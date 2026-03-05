// app.js
import { db, calculatePlates } from "./utils.js";
import { initHistory, renderHistory } from "./history.js";
import { initExercises, manageExercises } from "./exercises.js";

// Prevent pinch-to-zoom while keeping 1-finger scroll intact (works on iOS Safari too)
document.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const logViewBtn = document.getElementById("log-view-btn");
  const historyViewBtn = document.getElementById("history-view-btn");
  const exercisesViewBtn = document.getElementById("exercises-view-btn");

  const logWorkoutSection = document.getElementById("log-workout");
  const historySection = document.getElementById("history");
  const exercisesSection = document.getElementById("exercises");
  const chartView = document.getElementById("chart-view");

  const addExerciseForm = document.getElementById("add-exercise-form");
  const currentWorkoutList = document.getElementById("current-workout-list");
  const saveWorkoutBtn = document.getElementById("save-workout-btn");
  const exerciseSelect = document.getElementById("exercise");
  const lastWeightInfo = document.getElementById("last-weight-info");
  const weightInput = document.getElementById("weight");
  const plateVisualizer = document.getElementById("plate-visualizer");
  const platesContainer = document.getElementById("plates-container");
  const timerBadge = document.getElementById("timer-badge");
  const timerDisplay = document.getElementById("timer-display");
  const workoutBadge = document.getElementById("workout-badge");
  const currentWorkoutSection = document.getElementById("current-workout-section");

  // --- DATA ---
  let currentWorkout = [];

  // --- VIEWS ---
  const showView = (viewToShow) => {
    [logWorkoutSection, historySection, exercisesSection, chartView].forEach(
      (view) => (view.hidden = true),
    );
    [logViewBtn, historyViewBtn, exercisesViewBtn].forEach((btn) =>
      btn.classList.remove("active"),
    );

    viewToShow.section.hidden = false;
    viewToShow.button.classList.add("active");
  };

  const showLogView = async () => {
    showView({ section: logWorkoutSection, button: logViewBtn });
    await renderExerciseOptions();
  };

  const showHistoryView = () => {
    showView({ section: historySection, button: historyViewBtn });
    renderHistory();
  };

  const showExercisesView = () => {
    showView({ section: exercisesSection, button: exercisesViewBtn });
    manageExercises();
  };

  const updateWorkoutBadge = () => {
    const count = currentWorkout.length;
    if (count > 0) {
      workoutBadge.textContent = count;
      workoutBadge.classList.remove("hidden");
    } else {
      workoutBadge.classList.add("hidden");
    }
  };

  // --- RENDER FUNCTIONS ---
  const renderCurrentWorkout = async () => {
    currentWorkoutList.innerHTML = "";
    const hasWorkout = currentWorkout.length > 0;
    saveWorkoutBtn.disabled = !hasWorkout;
    currentWorkoutSection.classList.toggle("hidden", !hasWorkout);
    updateWorkoutBadge();

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < currentWorkout.length; i++) {
      const exercise = currentWorkout[i];
      const item = document.createElement("article");
      item.className = "current-workout-item";

      const contentDiv = document.createElement("div");
      contentDiv.style.flex = "1";
      const plates = await calculatePlates(exercise.weight, exercise.barWeight);

      if (plates) {
        let platesText = `${plates.weightPerSide} kg/side + ${plates.barWeight} kg bar`;
        if (plates.plates && plates.plates.length > 0) {
          const plateWeights = plates.plates.map((p) => p.weight || p);
          platesText += ` [${plateWeights.join(", ")}]`;
        }
        contentDiv.innerHTML = `<p style="margin:0 0 4px 0;"><strong>${exercise.exercise}</strong></p><p style="margin:0; font-size:0.9em; color:var(--secondary-color);">${
          exercise.weight
        } kg (${platesText}) &times; ${
          exercise.sets
        } &times; ${exercise.reps}</p>`;
      } else {
        contentDiv.innerHTML = `<p style="margin:0 0 4px 0;"><strong>${exercise.exercise}</strong></p><p style="margin:0; font-size:0.9em; color:var(--secondary-color);">${exercise.weight} kg &times; ${exercise.sets} &times; ${exercise.reps}</p>`;
      }

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.setAttribute("aria-label", "Edit exercise");
      editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
      editBtn.onclick = async () => {
        document.getElementById("exercise").value = exercise.exercise;
        document.getElementById("weight").value = exercise.weight;
        document.getElementById("sets").value = exercise.sets;
        document.getElementById("reps").value = exercise.reps;
        currentWorkout.splice(i, 1);
        await renderCurrentWorkout();
        document.getElementById("weight").focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      item.appendChild(contentDiv);
      item.appendChild(editBtn);
      fragment.appendChild(item);
    }
    
    if (currentWorkout.length > 0) {
      currentWorkoutList.appendChild(fragment);
    }
  };

  const renderExerciseOptions = async () => {
    const allExercises = await db.exercises.toArray();
    const currentWorkoutExerciseNames = currentWorkout.map((ex) => ex.exercise);
    const availableExercises = allExercises.filter(
      (ex) => !currentWorkoutExerciseNames.includes(ex.name),
    );

    exerciseSelect.innerHTML = "";
    availableExercises.forEach((ex) => {
      const option = document.createElement("option");
      option.value = ex.name;
      option.textContent = ex.name;
      exerciseSelect.appendChild(option);
    });
    await updateLastWeightInfo(exerciseSelect.value);
  };

  const updateLastWeightInfo = async (exerciseName) => {
    if (!exerciseName) {
      lastWeightInfo.textContent = "";
      return;
    }

    let lastWeight = null;
    let maxWeight = 0;

    const workouts = await db.workouts.orderBy("date").reverse().toArray();
    for (let i = 0; i < workouts.length; i++) {
      const exercise = workouts[i].exercises.find(
        (ex) => ex.exercise === exerciseName,
      );
      if (exercise) {
        if (lastWeight === null) {
          lastWeight = exercise.weight;
        }
        if (exercise.weight > maxWeight) {
          maxWeight = exercise.weight;
        }
      }
    }

    if (lastWeight !== null) {
      const exerciseData = await db.exercises.get({ name: exerciseName });
      const barWeight = exerciseData ? exerciseData.barWeight || 10 : 10;
      const plates = await calculatePlates(lastWeight, barWeight);
      let infoText = `Last: ${lastWeight}kg`;
      if (plates) {
        infoText += ` (${plates.weightPerSide}kg/side)`;
      }
      infoText += ` | Max: ${maxWeight}kg`;
      lastWeightInfo.textContent = infoText;
    } else {
      lastWeightInfo.textContent = "";
    }
  };

  // --- EVENT LISTENERS ---
  // --- TIMER LOGIC ---
  let timerInterval = null;
  let timeRemaining = 0;
  let targetEndTime = 0;
  let wakeLock = null;

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log(`Wake Lock error: ${err.name}, ${err.message}`);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock !== null) {
      try {
        await wakeLock.release();
      } catch (e) {}
      wakeLock = null;
    }
  };

  const updateTimerDisplay = () => {
    if (timerInterval) {
      timeRemaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
    }
    
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      targetEndTime = 0;
      timerDisplay.textContent = "00:00";
      timerBadge.classList.remove("active");
      clearInterval(timerInterval);
      timerInterval = null;
      releaseWakeLock();
      if ("vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }
      return;
    }
    const m = Math.floor(timeRemaining / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeRemaining % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${m}:${s}`;
  };

  timerBadge.addEventListener("click", () => {
    if (!timerInterval) {
      timeRemaining = 60;
      targetEndTime = Date.now() + timeRemaining * 1000;
      timerBadge.classList.add("active");
      requestWakeLock();
      updateTimerDisplay(); // immediate update
      timerInterval = setInterval(() => {
        updateTimerDisplay();
      }, 1000);
    } else {
      targetEndTime += 60000;
      updateTimerDisplay();
    }
  });

  // Long press / right click to clear timer
  timerBadge.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (timerInterval) {
        targetEndTime = 0;
        updateTimerDisplay();
    }
  });

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && timeRemaining > 0) {
      await requestWakeLock();
    }
  });

  logViewBtn.addEventListener("click", showLogView);
  historyViewBtn.addEventListener("click", showHistoryView);
  exercisesViewBtn.addEventListener("click", showExercisesView);

  const getContrastYIQ = (hex) => {
    if (
      !hex ||
      typeof hex !== "string" ||
      hex.length !== 7 ||
      !hex.startsWith("#")
    )
      return "#000";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  };

  const getPlateColor = (weight) => {
    if (weight >= 25) return "#ff0000"; // Red
    if (weight >= 20) return "#0000ff"; // Blue
    if (weight >= 15) return "#ffff00"; // Yellow
    if (weight >= 10) return "#00ff00"; // Green
    if (weight >= 5) return "#ffffff"; // White
    return "#cfcfcf"; // Grey for smaller plates
  };

  const getPlateHeight = (weight) => {
    if (weight >= 20) return "100%";
    if (weight >= 15) return "92%";
    if (weight >= 10) return "84%";
    if (weight >= 5) return "76%";
    return "68%";
  };

  const updatePlateVisualizer = async () => {
    const exerciseName = exerciseSelect.value;
    const weightVal = parseFloat(weightInput.value);

    if (!exerciseName || isNaN(weightVal) || weightVal <= 0) {
      plateVisualizer.style.display = "none";
      return;
    }

    const exerciseData = await db.exercises.get({ name: exerciseName });
    const barWeight = exerciseData ? exerciseData.barWeight || 10 : 10;

    const plates = await calculatePlates(weightVal, barWeight);

    if (!plates || !plates.plates || plates.plates.length === 0) {
      plateVisualizer.style.display = "none";
      return;
    }

    platesContainer.innerHTML = "";

    plates.plates.forEach((plateItem) => {
      const plateWeight = plateItem.weight || plateItem;
      const plateEl = document.createElement("div");
      const plateColor = plateItem.color || getPlateColor(plateWeight);
      const plateHeight = getPlateHeight(plateWeight);
      const textColor = getContrastYIQ(plateColor);
      const textShadow =
        textColor === "#000"
          ? "0 0 2px rgba(255,255,255,0.7)"
          : "0 0 2px rgba(0,0,0,0.7)";

      plateEl.style.cssText = `
        height: ${plateHeight};
        width: 11px;
        background-color: ${plateColor};
        border-radius: 3px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: inset 0 0 3px rgba(0,0,0,0.5);
        position: relative;
        color: ${textColor};
        text-shadow: ${textShadow};
        font-size: 8px;
        font-weight: bold;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      `;

      // Always show text
      plateEl.textContent = plateWeight;

      platesContainer.appendChild(plateEl);
    });

    plateVisualizer.style.display = "flex";
  };

  weightInput.addEventListener("input", updatePlateVisualizer);
  exerciseSelect.addEventListener("change", updatePlateVisualizer);

  exerciseSelect.addEventListener("change", (e) => {
    updateLastWeightInfo(e.target.value);
  });

  addExerciseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const exerciseName = document.getElementById("exercise").value;
    if (!exerciseName) return;

    const exerciseData = await db.exercises.get({ name: exerciseName });
    const barWeight = exerciseData ? exerciseData.barWeight || 10 : 10;

    currentWorkout.push({
      exercise: exerciseName,
      weight: parseFloat(document.getElementById("weight").value),
      sets: parseInt(document.getElementById("sets").value, 10),
      reps: parseInt(document.getElementById("reps").value, 10),
      barWeight: barWeight,
    });
    await renderCurrentWorkout();
    await renderExerciseOptions();
    addExerciseForm.reset();
    plateVisualizer.style.display = "none";
    document.getElementById("exercise").focus();
  });

  saveWorkoutBtn.addEventListener("click", async () => {
    if (currentWorkout.length === 0) return;
    await db.workouts.add({
      date: new Date().toISOString(),
      exercises: currentWorkout,
    });
    currentWorkout = [];
    await renderCurrentWorkout();
    await renderExerciseOptions();
    showHistoryView();
  });

  // --- INITIALIZATION ---
  const init = async () => {
    const exerciseCount = await db.exercises.count();
    if (exerciseCount === 0) {
      const defaultExercises = [
        { name: "Back Squat", barWeight: 20 },
        { name: "Bench Press", barWeight: 20 },
        { name: "Overhead Press", barWeight: 20 },
        { name: "Barbell Row", barWeight: 20 },
        { name: "Deadlift", barWeight: 20 },
      ];
      await db.exercises.bulkAdd(defaultExercises);
    }

    // Initialize other modules
    initHistory();
    initExercises();

    await renderExerciseOptions();
    await renderCurrentWorkout();
    showLogView();
  };

  init();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").then(
        (registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );

          // Check for updates manually
          registration.update();

          // If there's an updated worker waiting, we could notify the user,
          // but since we added skipWaiting() in sw.js, it will activate immediately.
        },
        (err) => {
          console.log("ServiceWorker registration failed: ", err);
        },
      );
    });

    // Reload the page when a new service worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
});
