import {
  db,
  calculatePlates,
  showAlert,
  showSuccessToast,
  calculate1RM,
  calculateVolume,
  getExerciseHistoricalStats,
  showPRToast,
} from "./utils.js";
import { initHistory, renderHistory } from "./history.js";
import { initExercises, manageExercises } from "./exercises.js";

// Prevent pinch-to-zoom while keeping 1-finger scroll intact (works on iOS Safari too)
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false },
);

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
  const currentWorkoutSection = document.getElementById(
    "current-workout-section",
  );

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

    // Run all plate calculations in parallel instead of sequentially
    const plateResults = await Promise.all(
      currentWorkout.map((ex) => calculatePlates(ex.weight, ex.barWeight)),
    );

    currentWorkout.forEach((exercise, i) => {
      const plates = plateResults[i];
      const item = document.createElement("article");
      item.className = "current-workout-item";

      const contentDiv = document.createElement("div");
      contentDiv.style.flex = "1";

      const exVolume = calculateVolume(exercise.weight, exercise.sets, exercise.reps);

      if (plates) {
        let platesText = `${plates.weightPerSide} kg/side + ${plates.barWeight} kg bar`;
        if (plates.plates && plates.plates.length > 0) {
          const plateWeights = plates.plates.map((p) => p.weight || p);
          platesText += ` [${plateWeights.join(", ")}]`;
        }
        contentDiv.innerHTML = `<p style="margin:0 0 4px 0;"><strong>${exercise.exercise}</strong></p><p style="margin:0; font-size:0.9em; color:var(--secondary-color);">${exercise.weight} kg (${platesText}) &times; ${exercise.sets} &times; ${exercise.reps} <span class="volume-info">${exVolume}kg vol</span></p>`;
      } else {
        contentDiv.innerHTML = `<p style="margin:0 0 4px 0;"><strong>${exercise.exercise}</strong></p><p style="margin:0; font-size:0.9em; color:var(--secondary-color);">${exercise.weight} kg &times; ${exercise.sets} &times; ${exercise.reps} <span class="volume-info">${exVolume}kg vol</span></p>`;
      }

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.setAttribute("aria-label", "Edit exercise");
      editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
      editBtn.onclick = async () => {
        currentWorkout.splice(i, 1);
        await renderExerciseOptions();
        await renderCurrentWorkout();

        document.getElementById("exercise").value = exercise.exercise;
        document.getElementById("weight").value = exercise.weight;
        document.getElementById("sets").value = exercise.sets;
        document.getElementById("reps").value = exercise.reps;

        await updatePlateVisualizer();
        document.getElementById("weight").focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      item.appendChild(contentDiv);
      item.appendChild(editBtn);
      fragment.appendChild(item);
    });

    if (currentWorkout.length > 0) {
      currentWorkoutList.appendChild(fragment);

      // Add total session volume footer
      const totalVolume = currentWorkout.reduce((sum, ex) => sum + calculateVolume(ex.weight, ex.sets, ex.reps), 0);
      const volumeFooter = document.createElement("div");
      volumeFooter.className = "workout-volume-footer";
      const formattedVolume = totalVolume >= 1000
        ? `${(totalVolume / 1000).toFixed(1)}t`
        : `${totalVolume}kg`;
      volumeFooter.innerHTML = `<span class="volume-icon">📊</span> Session Volume: <strong>${formattedVolume}</strong>`;
      currentWorkoutList.appendChild(volumeFooter);
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
    let lastReps = null;
    let maxWeight = 0;
    let max1RM = 0;

    // Stream through workouts with a cursor (.each) instead of loading all into RAM (.toArray)
    await db.workouts
      .orderBy("date")
      .reverse()
      .each((workout) => {
        const exercise = workout.exercises.find(
          (ex) => ex.exercise === exerciseName,
        );
        if (exercise) {
          if (lastWeight === null) {
            lastWeight = exercise.weight;
            lastReps = exercise.reps;
          }
          if (exercise.weight > maxWeight) maxWeight = exercise.weight;
          const e1RM = exercise.est1RM || calculate1RM(exercise.weight, exercise.reps);
          if (e1RM > max1RM) max1RM = e1RM;
        }
      });

    if (lastWeight !== null) {
      const exerciseData = await db.exercises.get({ name: exerciseName });
      const barWeight = exerciseData ? exerciseData.barWeight || 10 : 10;
      const plates = await calculatePlates(lastWeight, barWeight);
      const est1RM = calculate1RM(lastWeight, lastReps || 1);

      let infoText = `Last: ${lastWeight}kg`;
      if (plates) {
        infoText += ` (${plates.weightPerSide}kg/side)`;
      }
      infoText += ` | Max: ${maxWeight}kg | Est. 1RM: ${max1RM > 0 ? max1RM : est1RM}kg`;
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
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
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
      timeRemaining = Math.max(
        0,
        Math.ceil((targetEndTime - Date.now()) / 1000),
      );
    }

    if (timeRemaining > 10) tenPlayed = false;
    if (timeRemaining > 0) goPlayed = false;

    if (timeRemaining === 10 && !tenPlayed) {
      playAudioCue(tenBuffer);
      tenPlayed = true;
    }

    if (timeRemaining <= 0) {
      if (timerInterval && !goPlayed) {
        playAudioCue(goBuffer);
        goPlayed = true;
      }
      timeRemaining = 0;
      targetEndTime = 0;
      timerDisplay.textContent = "00:00";
      timerBadge.classList.remove("active");
      clearInterval(timerInterval);
      timerInterval = null;
      releaseWakeLock();
      postSWMessage({ type: "CANCEL_TIMER" });

      if ("vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }

      // If app is currently hidden/in background, trigger fallback Notification
      if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification("Rest Timer Finished! ⏱️", {
            body: "Rest time is up! Ready for your next set 💪",
            icon: "static/logos/logo192.png",
            badge: "static/logos/logo192.png",
            tag: "rest-timer-notification",
            renotify: true,
          });
        }).catch(() => {});
      }

      return;
    }
    const m = Math.floor(timeRemaining / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeRemaining % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${m}:${s}`;
  };

  const postSWMessage = (msg) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(msg);
    }
  };

  timerBadge.addEventListener("click", async () => {
    await preloadTimerCues();
    await unlockAudio();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

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

    postSWMessage({ type: "SCHEDULE_TIMER", targetEndTime: targetEndTime });
  });

  const createAudioContext = () => {
    if (audioContext) return audioContext;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext = new AudioContext();
    return audioContext;
  };

  const loadAudioBuffer = async (src) => {
    try {
      const context = createAudioContext();
      if (!context) return null;
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      return await context.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn("Failed to load audio cue:", src, err);
      return null;
    }
  };

  const playAudioCue = (buffer) => {
    try {
      const context = createAudioContext();
      if (!context || !buffer) return;
      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    } catch (err) {
      console.warn("Audio cue playback failed", err);
    }
  };

  const unlockAudio = async () => {
    const context = createAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      await context.resume().catch((e) => {
        console.warn("Audio context resume failed:", e);
      });
    }
  };

  let audioContext = null;
  let tenBuffer = null;
  let goBuffer = null;
  let timerAudioLoaded = false;
  let tenPlayed = false;
  let goPlayed = false;

  const preloadTimerCues = async () => {
    if (timerAudioLoaded) return;
    tenBuffer = await loadAudioBuffer("./static/ten.wav");
    goBuffer = await loadAudioBuffer("./static/go.wav");
    timerAudioLoaded = true;
  };

  // Long press / right click to clear timer
  timerBadge.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (timerInterval) {
      targetEndTime = 0;
      postSWMessage({ type: "CANCEL_TIMER" });
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
        width: 14px;
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

  // Merged into one listener — both run in parallel on exercise change
  exerciseSelect.addEventListener("change", (e) => {
    Promise.all([
      updatePlateVisualizer(),
      updateLastWeightInfo(e.target.value),
    ]);
  });

  addExerciseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const exerciseName = document.getElementById("exercise").value;
    const weight = parseFloat(document.getElementById("weight").value);
    const sets = parseInt(document.getElementById("sets").value, 10);
    const reps = parseInt(document.getElementById("reps").value, 10);

    if (
      !exerciseName ||
      isNaN(weight) ||
      weight <= 0 ||
      isNaN(sets) ||
      sets <= 0 ||
      isNaN(reps) ||
      reps <= 0
    ) {
      await showAlert(
        "Please enter valid positive values for exercise, weight, sets and reps.",
      );
      return;
    }

    const exerciseData = await db.exercises.get({ name: exerciseName });
    const barWeight = exerciseData ? exerciseData.barWeight || 10 : 10;
    const est1RM = calculate1RM(weight, reps);

    currentWorkout.push({
      exercise: exerciseName,
      weight: weight,
      sets: sets,
      reps: reps,
      barWeight: barWeight,
      est1RM: est1RM,
    });
    await renderCurrentWorkout();
    await renderExerciseOptions();
    addExerciseForm.reset();
    plateVisualizer.style.display = "none";
    document.getElementById("exercise").focus();
  });

  saveWorkoutBtn.addEventListener("click", async () => {
    if (currentWorkout.length === 0) return;
    const exerciseCount = currentWorkout.length;

    // Check for PRs across all exercises in current workout session
    const prList = [];
    for (const ex of currentWorkout) {
      const stats = await getExerciseHistoricalStats(ex.exercise);
      if (!ex.est1RM) ex.est1RM = calculate1RM(ex.weight, ex.reps);

      let isWeightPR = false;
      let is1RM_PR = false;

      if (stats.hasHistory) {
        isWeightPR = ex.weight > stats.maxWeight;
        is1RM_PR = ex.est1RM > stats.max1RM;
      }

      if (isWeightPR || is1RM_PR) {
        ex.isPR = true;
        ex.isWeightPR = isWeightPR;
        ex.is1RM_PR = is1RM_PR;
        prList.push(ex);
      }
    }

    await db.workouts.add({
      date: new Date().toISOString(),
      exercises: currentWorkout,
    });

    currentWorkout = [];
    await renderCurrentWorkout();
    await renderExerciseOptions();

    if (prList.length > 0) {
      showPRToast(prList);
    } else {
      showSuccessToast(`Workout saved! ${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} logged 💪`);
    }

    setTimeout(() => showHistoryView(), 400);
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
