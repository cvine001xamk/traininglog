function renderHistory() {
  const db = new Dexie("trainingLog");
  db.version(1).stores({
    workouts: "++id,date",
    exercises: "++id,name",
  });

  const historyList = document.getElementById("history-list");
  const importBtn = document.getElementById("import-csv-btn");
  const exportBtn = document.getElementById("export-csv-btn");
  const fileInput = document.getElementById("csv-file-input");

  const render = async () => {
    const workouts = await db.workouts.orderBy("date").toArray();
    historyList.innerHTML =
      workouts.length === 0
        ? '<p class="text-center">No workouts logged yet.</p>'
        : "";
    const reversedWorkouts = [...workouts].reverse();
    reversedWorkouts.forEach((workout) => {
      historyList.appendChild(createWorkoutArticle(workout));
    });
  };

  const createWorkoutArticle = (workout) => {
    const article = document.createElement("article");
    article.dataset.id = workout.id;

    const header = document.createElement("header");

    const date = new Date(workout.date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateEl = document.createElement("strong");
    dateEl.textContent = date;
    header.appendChild(dateEl);

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.setAttribute("aria-label", "Edit Workout");
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
    editBtn.onclick = () => showEditView(article, workout);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.setAttribute("aria-label", "Delete Workout");
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    deleteBtn.onclick = async () => {
      if (confirm("Are you sure you want to delete this workout?")) {
        await db.workouts.delete(workout.id);
        await render();
      }
    };

    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(deleteBtn);
    header.appendChild(buttonGroup);
    article.appendChild(header);

    const exercisesContainer = document.createElement("div");
    exercisesContainer.className = "exercises-container";
    workout.exercises.forEach((ex) => {
      const exDiv = document.createElement("div");

      const exerciseName = document.createElement("strong");
      exerciseName.textContent = ex.exercise;
      exDiv.appendChild(exerciseName);

      const details = document.createElement("div");
      if (ex.weight > 10) {
        let weightPerSide = (ex.weight - 10) / 2;
        if (weightPerSide < 0) {
          weightPerSide = 0;
        }
        details.textContent = `${ex.weight} kg (${weightPerSide.toFixed(
          2
        )} kg/side + 10 kg bar) × ${ex.sets} × ${ex.reps}`;
      } else {
        details.textContent = `${ex.weight} kg × ${ex.sets} × ${ex.reps}`;
      }
      exDiv.appendChild(details);
      exercisesContainer.appendChild(exDiv);
    });
    article.appendChild(exercisesContainer);

    return article;
  };

  const showEditView = (article, workout) => {
    const exercisesContainer = article.querySelector(".exercises-container");
    const header = article.querySelector("header");
    header.hidden = true;
    exercisesContainer.innerHTML = "";

    workout.exercises.forEach((ex, index) => {
      const form = document.createElement("form");
      form.className = "grid edit-form";
      form.dataset.index = index;
      form.innerHTML = `
                <input type="text" value="${ex.exercise}" data-field="exercise" disabled>
                <input type="number" value="${ex.weight}" data-field="weight">
                <input type="number" value="${ex.sets}" data-field="sets">
                <input type="number" value="${ex.reps}" data-field="reps">
            `;
      exercisesContainer.appendChild(form);
    });

    const footer = document.createElement("footer");
    footer.className = "edit-form-footer";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Changes";
    saveBtn.onclick = async () => {
      const updatedExercises = [];
      const forms = exercisesContainer.querySelectorAll("form");
      forms.forEach((form) => {
        updatedExercises.push({
          exercise: form.querySelector('[data-field="exercise"]').value,
          weight: form.querySelector('[data-field="weight"]').value,
          sets: form.querySelector('[data-field="sets"]').value,
          reps: form.querySelector('[data-field="reps"]').value,
        });
      });
      await db.workouts.update(workout.id, { exercises: updatedExercises });
      await render();
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "secondary";
    cancelBtn.onclick = () => {
      historyList.innerHTML = "";
      render();
    };

    footer.appendChild(saveBtn);
    footer.appendChild(cancelBtn);
    article.appendChild(footer);
  };

  const exportToCSV = async () => {
    const workouts = await db.workouts.orderBy("date").toArray();
    if (workouts.length === 0) return;

    let csvContent = "Date,Exercise,Weight,Sets,Reps\n";
    workouts.forEach((workout) => {
      const date = new Date(workout.date).toISOString().split("T")[0];
      workout.exercises.forEach((ex) => {
        const row = `${date},${ex.exercise},${ex.weight},${ex.sets},${ex.reps}\n`;
        csvContent += row;
      });
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `training_log_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csv = event.target.result;
      const lines = csv.split("\n").filter((line) => line);
      if (lines.length <= 1) return;

      const existingWorkouts = await db.workouts.toArray();
      const existingWorkoutDates = new Set(existingWorkouts.map(w => new Date(w.date).toISOString().split('T')[0]));

      const newWorkouts = {};
      const allExerciseNames = new Set(
        (await db.exercises.toArray()).map((e) => e.name)
      );

      for (let i = 1; i < lines.length; i++) {
        const [date, exercise, weight, sets, reps] = lines[i].split(",");
        if (date && exercise && weight && sets && reps) {
          const workoutDate = new Date(date).toISOString().split('T')[0];
          if (existingWorkoutDates.has(workoutDate)) {
            console.log(`Skipping duplicate workout for date: ${date}`);
            continue;
          }

          if (!newWorkouts[date]) {
            newWorkouts[date] = {
              date: new Date(date).toISOString(),
              exercises: [],
            };
          }
          newWorkouts[date].exercises.push({
            exercise: exercise.trim(),
            weight: parseFloat(weight.trim()),
            sets: parseInt(sets.trim()),
            reps: parseInt(reps.trim()),
          });
          if (!allExerciseNames.has(exercise.trim())) {
            await db.exercises.add({ name: exercise.trim() });
            allExerciseNames.add(exercise.trim());
          }
        }
      }
      if(Object.values(newWorkouts).length > 0) {
        await db.workouts.bulkAdd(Object.values(newWorkouts));
      }
      await render();
    };
    reader.readAsText(file);
  };

  // Initialize event listeners only once
  const initHistoryEventListeners = () => {
    exportBtn.addEventListener("click", exportToCSV);
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", importFromCSV);
    // Set a flag to ensure this doesn't run again
    initHistoryEventListeners.initialized = true;
  };

  if (!initHistoryEventListeners.initialized) {
    initHistoryEventListeners();
  }

  render();
}
