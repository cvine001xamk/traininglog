// exercises.js
import { db, loadScript, showAlert, showConfirm } from "./utils.js";

let exerciseList;
let addNewExerciseForm;
let newExerciseNameInput;
let chartView;
let backToExercisesBtn;
let exercisesView;
let chartTitle;
let chart;
let resetZoomBtn;
let goalWeightInput;
let saveGoalBtn;
let currentChartExercise;
let plateList;
let addNewPlateForm;
let chartGoalToggle;
let chartGoalRow;
let rangeButtons;
let currentTimeRange = "ALL";

export function initExercises() {
  exerciseList = document.getElementById("exercise-list");
  addNewExerciseForm = document.getElementById("add-new-exercise-form");
  newExerciseNameInput = document.getElementById("new-exercise-name");
  chartView = document.getElementById("chart-view");
  backToExercisesBtn = document.getElementById("back-to-exercises-btn");
  exercisesView = document.getElementById("exercises");
  chartTitle = document.getElementById("chart-title");
  resetZoomBtn = document.getElementById("reset-zoom-btn");
  goalWeightInput = document.getElementById("goal-weight-input");
  saveGoalBtn = document.getElementById("save-goal-btn");
  plateList = document.getElementById("plate-list");
  addNewPlateForm = document.getElementById("add-new-plate-form");
  chartGoalToggle = document.getElementById("chart-goal-toggle");
  chartGoalRow = document.getElementById("chart-goal-row");
  rangeButtons = document.querySelectorAll(".range-btn");

  // Initialize event listeners only once
  if (!initExercises.initialized) {
    resetZoomBtn.addEventListener("click", () => {
      if (chart) chart.resetZoom();
    });

    chartGoalToggle.addEventListener("click", () => {
      chartGoalRow.classList.toggle("hidden");
    });

    rangeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        rangeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentTimeRange = btn.dataset.range;
        if (currentChartExercise) renderChart(currentChartExercise);
      });
    });

    saveGoalBtn.addEventListener("click", async () => {
      if (!currentChartExercise) return;
      const goal = parseFloat(goalWeightInput.value);
      const exerciseData = await db.exercises.get({
        name: currentChartExercise,
      });
      if (exerciseData) {
        await db.exercises.update(exerciseData.id, {
          goalWeight: isNaN(goal) ? null : goal,
        });
        await renderChart(currentChartExercise);
        await showAlert("Goal saved!");
      }
    });

    addNewExerciseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newExerciseName = newExerciseNameInput.value.trim();
      const barWeight = parseInt(
        document.getElementById("new-exercise-bar-weight").value,
      );
      if (newExerciseName) {
        await db.exercises.add({ name: newExerciseName, barWeight: barWeight });
        await renderExerciseManagementList();
        newExerciseNameInput.value = "";
        await showAlert("Exercise added! Go to 'Log Workout' to see it in the list.");
      }
    });

    exerciseList.addEventListener("click", async (e) => {
      if (e.target.classList.contains("view-history-btn")) {
        const exerciseName = e.target.dataset.name;
        await renderChart(exerciseName);
      }
      const deleteBtn = e.target.closest(".delete-exercise-btn");
      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        const confirmed = await showConfirm("Delete this exercise? This won't remove it from past workouts.");
        if (confirmed) {
          await db.exercises.delete(id);
          await renderExerciseManagementList();
        }
      }
    });

    exerciseList.addEventListener("change", async (e) => {
      if (e.target.classList.contains("bar-weight-select")) {
        const id = parseInt(e.target.dataset.id);
        const barWeight = parseInt(e.target.value);
        await db.exercises.update(id, { barWeight: barWeight });
      }
    });

    backToExercisesBtn.addEventListener("click", () => {
      chartView.hidden = true;
      exercisesView.hidden = false;
    });

    addNewPlateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const weight = parseFloat(
        document.getElementById("new-plate-weight").value,
      );
      const amount = parseInt(
        document.getElementById("new-plate-amount").value,
      );
      const color = document.getElementById("new-plate-color").value;
      if (weight > 0 && amount > 0) {
        const existingPlate = await db.plates.get({ weight: weight });
        if (existingPlate) {
          await db.plates.update(existingPlate.id, {
            amount: existingPlate.amount + amount,
            color: color,
          });
        } else {
          await db.plates.add({ weight: weight, amount: amount, color: color });
        }
        await renderPlateList();
        addNewPlateForm.reset();
        document.getElementById("new-plate-color").value = "#cfcfcf";
      }
    });

    plateList.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".delete-plate-btn");
      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        await db.plates.delete(id);
        await renderPlateList();
      }
    });

    initExercises.initialized = true;
  }
}

export function manageExercises() {
  renderExerciseManagementList();
  renderPlateList();
}

const renderPlateList = async () => {
  const plates = await db.plates.orderBy("weight").reverse().toArray();
  plateList.innerHTML = "";

  if (plates.length === 0) {
    plateList.innerHTML =
      '<p style="text-align: center; color: var(--secondary-color); margin-bottom: 1rem;">No plates added yet.</p>';
    return;
  }

  plates.forEach((p) => {
    const item = document.createElement("article");
    item.classList.add("exercise-list-item");
    item.innerHTML = `
            <div>
                <div class="exercise-info" style="flex-direction: row; gap: 0.75rem; align-items: center;">
                    <div style="width: 16px; height: 16px; border-radius: 4px; background-color: ${p.color || "#cfcfcf"}; box-shadow: 0 0 2px rgba(255,255,255,0.4);"></div>
                    <strong>${p.weight} kg</strong>
                    <span style="color: var(--secondary-color); font-size: 0.9rem;">${p.amount} plates</span>
                </div>
                <div class="button-group">
                    <button class="icon-btn delete-btn delete-plate-btn" data-id="${p.id}" style="padding: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    plateList.appendChild(item);
  });
};

const renderExerciseManagementList = async () => {
  const exercises = await db.exercises.toArray();
  exerciseList.innerHTML = "";
  exercises.forEach((ex) => {
    const item = document.createElement("article");
    item.classList.add("exercise-list-item");
    const barWeight = ex.barWeight || 10;

    const wrapper = document.createElement("div");

    const infoDiv = document.createElement("div");
    infoDiv.className = "exercise-info";

    const nameEl = document.createElement("strong");
    nameEl.textContent = ex.name; // Safe — no innerHTML
    infoDiv.appendChild(nameEl);

    const barDiv = document.createElement("div");
    barDiv.className = "bar-selection";

    const barLabel = document.createElement("label");
    barLabel.textContent = "Bar: ";
    barDiv.appendChild(barLabel);

    const barSelect = document.createElement("select");
    barSelect.className = "bar-weight-select";
    barSelect.dataset.id = ex.id;
    [2, 8, 10, 20].forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w;
      opt.textContent = `${w} kg`;
      if (barWeight === w) opt.selected = true;
      barSelect.appendChild(opt);
    });
    barDiv.appendChild(barSelect);
    infoDiv.appendChild(barDiv);
    wrapper.appendChild(infoDiv);

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn view-history-btn";
    viewBtn.dataset.name = ex.name;
    viewBtn.textContent = "View History";
    buttonGroup.appendChild(viewBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn delete-btn delete-exercise-btn";
    deleteBtn.dataset.id = ex.id;
    deleteBtn.setAttribute("aria-label", "Delete exercise");
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    buttonGroup.appendChild(deleteBtn);

    wrapper.appendChild(buttonGroup);
    item.appendChild(wrapper);
    exerciseList.appendChild(item);
  });
};

const renderChart = async (exerciseName) => {
  // Lazy load Chart.js and plugins
  try {
    await loadScript("./chart.min.js");
    // Load time adapter and zoom plugin from CDN
    await loadScript(
      "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js",
    );
    await loadScript(
      "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js",
    );
    await loadScript(
      "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@2/dist/chartjs-plugin-annotation.min.js",
    );
  } catch (e) {
    console.error("Failed to load chart libraries", e);
    alert("Failed to load chart library.");
    return;
  }

  const exerciseData = await db.exercises.get({ name: exerciseName });
  const goalWeight =
    exerciseData && exerciseData.goalWeight ? exerciseData.goalWeight : null;
  currentChartExercise = exerciseName;
  if (goalWeightInput) {
    goalWeightInput.value = goalWeight || "";
  }

  const workouts = await db.workouts.orderBy("date").toArray();
  let exerciseHistory = workouts.flatMap((w) =>
    w.exercises
      .filter((ex) => ex.exercise === exerciseName)
      .map((ex) => ({
        x: new Date(w.date).getTime(),
        y: parseFloat(ex.weight),
      })),
  );

  // Apply time range filter
  if (currentTimeRange !== "ALL") {
    const now = new Date();
    let cutoff = new Date();
    if (currentTimeRange === "1M") cutoff.setMonth(now.getMonth() - 1);
    else if (currentTimeRange === "3M") cutoff.setMonth(now.getMonth() - 3);
    else if (currentTimeRange === "6M") cutoff.setMonth(now.getMonth() - 6);
    else if (currentTimeRange === "1Y") cutoff.setFullYear(now.getFullYear() - 1);
    
    const cutoffTime = cutoff.getTime();
    exerciseHistory = exerciseHistory.filter(d => d.x >= cutoffTime);
  }

  if (chart) {
    chart.destroy();
  }

  chartTitle.textContent = `${exerciseName} - Weight History`;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grace: "10%",
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#99aab5",
        }
      },
      x: {
        type: "time",
        time: {
          unit: "day",
          displayFormats: {
            day: "dd.MM.yy",
          },
          tooltipFormat: "PP",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#99aab5",
        }
      },
    },
    plugins: {
      annotation: {
        annotations: goalWeight
          ? {
              goalLine: {
                type: "line",
                yMin: goalWeight,
                yMax: goalWeight,
                borderColor: "rgba(255, 159, 64, 1)",
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: "Goal",
                  position: "start",
                  backgroundColor: "rgba(255, 159, 64, 0.8)",
                },
              },
            }
          : {},
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          threshold: 5,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
      },
    },
  };

  const ctx = document.getElementById("exercise-chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Weight (kg)",
          data: exerciseHistory,
          borderColor: "#3399ff",
          backgroundColor: "rgba(51, 153, 255, 0.2)",
          tension: 0.2,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 10,
          borderWidth: 3,
        },
      ],
    },
    options: options,
  });

  exercisesView.hidden = true;
  chartView.hidden = false;
};
