// history.js
import { db, formatDate, showConfirm, parseCSVLine } from "./utils.js";

let historyList;
let importBtn;
let exportBtn;
let clearBtn;
let fileInput;

export function initHistory() {
  historyList = document.getElementById("history-list");
  importBtn = document.getElementById("import-csv-btn");
  exportBtn = document.getElementById("export-csv-btn");
  clearBtn = document.getElementById("clear-history-btn");
  fileInput = document.getElementById("csv-file-input");

  // Initialize event listeners only once
  if (!initHistory.initialized) {
    exportBtn.addEventListener("click", exportToCSV);
    importBtn.addEventListener("click", () => fileInput.click());
    clearBtn.addEventListener("click", async () => {
      const confirmed = await showConfirm(
        "Are you sure you want to clear ALL workout history? This cannot be undone.",
      );
      if (confirmed) {
        await db.workouts.clear();
        await renderHistory();
      }
    });
    fileInput.addEventListener("change", importFromCSV);
    initHistory.initialized = true;
  }
}

const PAGE_SIZE = 20;
let currentOffset = 0;

export async function renderHistory() {
  currentOffset = 0;
  historyList.innerHTML = "";

  const total = await db.workouts.count();
  if (total === 0) {
    historyList.innerHTML =
      '<p class="text-center">No workouts logged yet.</p>';
    return;
  }

  await appendHistoryPage();
}

async function appendHistoryPage() {
  // Remove existing load-more button before appending new items
  const existingBtn = historyList.querySelector(".load-more-btn");
  if (existingBtn) existingBtn.remove();

  const workouts = await db.workouts
    .orderBy("date")
    .reverse()
    .offset(currentOffset)
    .limit(PAGE_SIZE)
    .toArray();

  const fragment = document.createDocumentFragment();
  workouts.forEach((workout) => {
    fragment.appendChild(createWorkoutArticle(workout));
  });
  historyList.appendChild(fragment);
  currentOffset += workouts.length;

  // If there are more items, show a Load More button
  const total = await db.workouts.count();
  if (currentOffset < total) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.textContent = `Load More (${total - currentOffset} remaining)`;
    loadMoreBtn.className = "load-more-btn secondary";
    loadMoreBtn.style.cssText = "width:100%; margin-top: 0.5rem;";
    loadMoreBtn.addEventListener("click", appendHistoryPage);
    historyList.appendChild(loadMoreBtn);
  }
}

const createWorkoutArticle = (workout) => {
  const article = document.createElement("article");
  article.dataset.id = workout.id;

  const header = document.createElement("header");

  const dateEl = document.createElement("strong");
  dateEl.textContent = formatDate(workout.date);
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
    const confirmed = await showConfirm(
      "Are you sure you want to delete this workout?",
    );
    if (confirmed) {
      await db.workouts.delete(workout.id);
      await renderHistory();
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

    const exerciseName = document.createElement("span");
    exerciseName.style.fontWeight = "bold";
    exerciseName.textContent = ex.exercise;
    exDiv.appendChild(exerciseName);

    const details = document.createElement("span");
    details.textContent = `${ex.weight}kg × ${ex.sets} × ${ex.reps}`;
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
              <input type="text" value="${ex.exercise}" data-field="exercise" disabled aria-label="Exercise name">
              <input type="number" value="${ex.weight}" data-field="weight" step="any" inputmode="decimal" placeholder="Weight (kg)" aria-label="Weight (kg)">
              <input type="number" value="${ex.sets}" data-field="sets" inputmode="numeric" placeholder="Sets" aria-label="Sets">
              <input type="number" value="${ex.reps}" data-field="reps" inputmode="numeric" placeholder="Reps" aria-label="Reps">
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
    let isValid = true;

    for (const form of forms) {
      const index = form.dataset.index;
      const exerciseName = form.querySelector('[data-field="exercise"]').value;
      const rawWeight = form.querySelector('[data-field="weight"]').value;
      const rawSets = form.querySelector('[data-field="sets"]').value;
      const rawReps = form.querySelector('[data-field="reps"]').value;

      const weight = parseFloat(rawWeight);
      const sets = parseInt(rawSets, 10);
      const reps = parseInt(rawReps, 10);

      if (
        isNaN(weight) ||
        weight < 0 ||
        isNaN(sets) ||
        sets < 0 ||
        isNaN(reps) ||
        reps < 0
      ) {
        isValid = false;
        break;
      }

      // Safeguard barWeight if it's missing (e.g. from imported CSVs)
      let barWeight = workout.exercises[index].barWeight;
      if (barWeight === undefined || barWeight === null) {
        const exerciseData = await db.exercises.get({ name: exerciseName });
        barWeight = exerciseData ? exerciseData.barWeight || 20 : 20;
      }

      updatedExercises.push({
        exercise: exerciseName,
        weight: weight,
        sets: sets,
        reps: reps,
        barWeight: barWeight,
      });
    }

    if (!isValid) {
      // showAlert is asynchronous, so await it
      await showAlert(
        "Please enter valid positive numbers for weight, sets, and reps.",
      );
      return;
    }

    await db.workouts.update(workout.id, { exercises: updatedExercises });
    await renderHistory();
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "secondary";
  cancelBtn.onclick = () => {
    historyList.innerHTML = "";
    renderHistory();
  };

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  article.appendChild(footer);
};

const exportToCSV = async () => {
  const workouts = await db.workouts.orderBy("date").toArray();
  if (workouts.length === 0) return;

  const escapeCSV = (field) => {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  let csvContent = "Date,Exercise,Weight,Sets,Reps\n";
  workouts.forEach((workout) => {
    const date = new Date(workout.date).toISOString().split("T")[0];
    workout.exercises.forEach((ex) => {
      const row = `${date},${escapeCSV(ex.exercise)},${ex.weight},${ex.sets},${ex.reps}\n`;
      csvContent += row;
    });
  });

  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const date = new Date().toISOString().split("T")[0];
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
    const lines = csv.split("\n").filter((line) => line.trim());
    if (lines.length <= 1) return;

    const newWorkouts = {};
    const exercisesToAdd = [];
    const allExercises = await db.exercises.toArray();
    const allExerciseNames = new Set(allExercises.map((e) => e.name));
    const exerciseBarWeights = new Map(
      allExercises.map((e) => [e.name, e.barWeight || 20]),
    );

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 5) continue;
      const [date, exercise, weight, sets, reps] = fields;
      if (date && exercise && weight && sets && reps) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.warn(`Skipping invalid CSV row date: ${date}`);
          continue; // Safe skip instead of crashing
        }

        const dateKey = parsedDate.toISOString().split("T")[0];
        const exerciseName = exercise.trim();

        if (!newWorkouts[dateKey]) {
          newWorkouts[dateKey] = {
            date: parsedDate.toISOString(),
            exercises: [],
          };
        }

        // Retrieve or assign barWeight
        let barWeight = exerciseBarWeights.get(exerciseName);
        if (barWeight === undefined) {
          barWeight = 20; // Default to 20kg barbell
          exerciseBarWeights.set(exerciseName, barWeight);
        }

        const parsedWeight = parseFloat(weight.trim());
        const parsedSets = parseInt(sets.trim(), 10);
        const parsedReps = parseInt(reps.trim(), 10);
        if (
          isNaN(parsedWeight) ||
          parsedWeight <= 0 ||
          isNaN(parsedSets) ||
          parsedSets <= 0 ||
          isNaN(parsedReps) ||
          parsedReps <= 0
        ) {
          console.warn(`Skipping invalid CSV row: ${lines[i]}`);
          continue;
        }

        newWorkouts[dateKey].exercises.push({
          exercise: exerciseName,
          weight: parsedWeight,
          sets: parsedSets,
          reps: parsedReps,
          barWeight: barWeight,
        });

        if (!allExerciseNames.has(exerciseName)) {
          exercisesToAdd.push({ name: exerciseName, barWeight: 20 });
          allExerciseNames.add(exerciseName);
        }
      }
    }

    // Execute multiple table updates as one ACID transaction
    await db.transaction("rw", db.workouts, db.exercises, async () => {
      if (exercisesToAdd.length > 0) {
        await db.exercises.bulkAdd(exercisesToAdd);
      }
      if (Object.values(newWorkouts).length > 0) {
        await db.workouts.bulkAdd(Object.values(newWorkouts));
      }
    });

    fileInput.value = ""; // Reset input value so re-importing the same file works
    await renderHistory();
  };
  reader.readAsText(file);
};
