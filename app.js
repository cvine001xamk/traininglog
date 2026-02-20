// app.js
import { db, calculatePlates } from './utils.js';
import { initHistory, renderHistory } from './history.js';
import { initExercises, manageExercises } from './exercises.js';

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const logViewBtn = document.getElementById("log-view-btn");
  const historyViewBtn = document.getElementById("history-view-btn");
  const exercisesViewBtn = document.getElementById("exercises-view-btn");

  const logWorkoutSection = document.getElementById("log-workout");
  const historySection = document.getElementById("history");
  const exercisesSection = document.getElementById("exercises");
  const chartView = document.getElementById('chart-view');

  const addExerciseForm = document.getElementById("add-exercise-form");
  const currentWorkoutList = document.getElementById("current-workout-list");
  const saveWorkoutBtn = document.getElementById("save-workout-btn");
  const exerciseSelect = document.getElementById("exercise");
  const lastWeightInfo = document.getElementById("last-weight-info");

  // --- DATA ---
  let currentWorkout = [];

  // --- VIEWS ---
  const showView = (viewToShow) => {
    [logWorkoutSection, historySection, exercisesSection, chartView].forEach(
      (view) => (view.hidden = true)
    );
    [logViewBtn, historyViewBtn, exercisesViewBtn].forEach((btn) =>
      btn.classList.remove("active")
    );

    viewToShow.section.hidden = false;
    viewToShow.button.classList.add("active");
  };

  const showLogView = () =>
    showView({ section: logWorkoutSection, button: logViewBtn });
  
  const showHistoryView = () => {
    showView({ section: historySection, button: historyViewBtn });
    renderHistory();
  };
  
  const showExercisesView = () => {
    showView({ section: exercisesSection, button: exercisesViewBtn });
    manageExercises();
  };

  // --- RENDER FUNCTIONS ---
  const renderCurrentWorkout = () => {
    currentWorkoutList.innerHTML = "";
    saveWorkoutBtn.hidden = currentWorkout.length === 0;

    currentWorkout.forEach((exercise) => {
      const item = document.createElement("article");
      const plates = calculatePlates(exercise.weight, exercise.barWeight);
      
      if (plates) {
        item.innerHTML = `<p><strong>${exercise.exercise}</strong></p><p>${
          exercise.weight
        } kg (${plates.weightPerSide} kg/side + ${plates.barWeight} kg bar) &times; ${
          exercise.sets
        } &times; ${exercise.reps}</p>`;
      } else {
        item.innerHTML = `<p><strong>${exercise.exercise}</strong></p><p>${exercise.weight} kg &times; ${exercise.sets} &times; ${exercise.reps}</p>`;
      }
      currentWorkoutList.appendChild(item);
    });
  };

  const renderExerciseOptions = async () => {
    const allExercises = await db.exercises.toArray();
    const currentWorkoutExerciseNames = currentWorkout.map((ex) => ex.exercise);
    const availableExercises = allExercises.filter(
      (ex) => !currentWorkoutExerciseNames.includes(ex.name)
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

    const workoutsWithExercise = await db.workouts
      .orderBy("date")
      .reverse()
      .toArray();

    let lastWeight = null;
    let maxWeight = 0;

    for (const workout of workoutsWithExercise) {
      const exercise = workout.exercises.find(
        (ex) => ex.exercise === exerciseName
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
      const barWeight = exerciseData ? (exerciseData.barWeight || 20) : 20;
      const plates = calculatePlates(lastWeight, barWeight);
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
  logViewBtn.addEventListener("click", showLogView);
  historyViewBtn.addEventListener("click", showHistoryView);
  exercisesViewBtn.addEventListener("click", showExercisesView);

  exerciseSelect.addEventListener("change", (e) => {
    updateLastWeightInfo(e.target.value);
  });

  addExerciseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const exerciseName = document.getElementById("exercise").value;
    if (!exerciseName) return;

    const exerciseData = await db.exercises.get({ name: exerciseName });
    const barWeight = exerciseData ? (exerciseData.barWeight || 20) : 20;

    currentWorkout.push({
      exercise: exerciseName,
      weight: document.getElementById("weight").value,
      sets: document.getElementById("sets").value,
      reps: document.getElementById("reps").value,
      barWeight: barWeight
    });
    renderCurrentWorkout();
    await renderExerciseOptions();
    addExerciseForm.reset();
    document.getElementById("exercise").focus();
  });

  saveWorkoutBtn.addEventListener("click", async () => {
    if (currentWorkout.length === 0) return;
    await db.workouts.add({
      date: new Date().toISOString(),
      exercises: currentWorkout,
    });
    currentWorkout = [];
    renderCurrentWorkout();
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
    showLogView();
  };

  init();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").then(
        (registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        },
        (err) => {
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });
  }
});
