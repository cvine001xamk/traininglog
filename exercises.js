// exercises.js
import { db, loadScript, showAlert, showConfirm, invalidatePlatesCache, calculate1RM, calculateVolume } from "./utils.js";

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
        invalidatePlatesCache();
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
        invalidatePlatesCache();
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
    infoDiv.style.flexDirection = "row";
    infoDiv.style.alignItems = "center";
    infoDiv.style.flex = "1";
    infoDiv.style.paddingRight = "0.5rem";
    infoDiv.style.minWidth = "0"; // Ensures child text truncation works

    const nameEl = document.createElement("strong");
    nameEl.textContent = ex.name; // Safe — no innerHTML
    nameEl.style.flex = "1";
    nameEl.style.whiteSpace = "nowrap";
    nameEl.style.overflow = "hidden";
    nameEl.style.textOverflow = "ellipsis";
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

  // Stream workouts via cursor — avoids loading entire array into RAM
  const dailyMaxMap = new Map();
  const daily1RMMap = new Map();
  const dailyVolumeMap = new Map();

  await db.workouts.orderBy("date").each((w) => {
    const exerciseSets = w.exercises.filter((ex) => ex.exercise === exerciseName);
    if (exerciseSets.length === 0) return;
    const maxWeight = Math.max(...exerciseSets.map((ex) => parseFloat(ex.weight)));
    const max1RM = Math.max(
      ...exerciseSets.map((ex) => ex.est1RM || calculate1RM(ex.weight, ex.reps)),
    );
    const totalVolume = exerciseSets.reduce(
      (sum, ex) => sum + calculateVolume(ex.weight, ex.sets, ex.reps), 0
    );

    const dateKey = new Date(w.date).setHours(0, 0, 0, 0);
    if (!dailyMaxMap.has(dateKey) || dailyMaxMap.get(dateKey) < maxWeight) {
      dailyMaxMap.set(dateKey, maxWeight);
    }
    if (!daily1RMMap.has(dateKey) || daily1RMMap.get(dateKey) < max1RM) {
      daily1RMMap.set(dateKey, max1RM);
    }
    // Accumulate volume for the same day (multiple sessions)
    dailyVolumeMap.set(dateKey, (dailyVolumeMap.get(dateKey) || 0) + totalVolume);
  });

  let exerciseHistory = Array.from(dailyMaxMap.entries())
    .map(([time, weight]) => ({ x: time, y: weight }))
    .sort((a, b) => a.x - b.x);

  let est1RMHistory = Array.from(daily1RMMap.entries())
    .map(([time, rm]) => ({ x: time, y: rm }))
    .sort((a, b) => a.x - b.x);

  let volumeHistory = Array.from(dailyVolumeMap.entries())
    .map(([time, vol]) => ({ x: time, y: vol }))
    .sort((a, b) => a.x - b.x);

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
    est1RMHistory = est1RMHistory.filter(d => d.x >= cutoffTime);
    volumeHistory = volumeHistory.filter(d => d.x >= cutoffTime);
  }

  // Update change stats summary badge
  const statsSummaryEl = document.getElementById("chart-stats-summary");
  const changeBadgeEl = document.getElementById("chart-change-badge");
  const countBadgeEl = document.getElementById("chart-count-badge");
  const changePeriodEl = document.getElementById("chart-change-period");

  if (statsSummaryEl && changeBadgeEl && changePeriodEl) {
    const totalCount = exerciseHistory.length;

    // Calculate time span in weeks for selected horizon
    let totalWeeks = 1;
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;

    if (currentTimeRange !== "ALL") {
      let cutoff = new Date();
      if (currentTimeRange === "1M") cutoff.setMonth(new Date().getMonth() - 1);
      else if (currentTimeRange === "3M") cutoff.setMonth(new Date().getMonth() - 3);
      else if (currentTimeRange === "6M") cutoff.setMonth(new Date().getMonth() - 6);
      else if (currentTimeRange === "1Y") cutoff.setFullYear(new Date().getFullYear() - 1);
      totalWeeks = Math.max(0.1, (now - cutoff.getTime()) / msPerWeek);
    } else if (totalCount >= 1) {
      const firstTime = exerciseHistory[0].x;
      totalWeeks = Math.max(1, (now - firstTime) / msPerWeek);
    }

    const weeklyAvg = (totalCount / totalWeeks).toFixed(1);

    if (countBadgeEl) {
      countBadgeEl.textContent = `${totalCount} ${totalCount === 1 ? "exercise" : "exercises"} (${weeklyAvg}/wk)`;
    }

    if (totalCount >= 2) {
      const startWeight = exerciseHistory[0].y;
      const endWeight = exerciseHistory[totalCount - 1].y;
      const diffKg = endWeight - startWeight;
      const diffPct = startWeight > 0 ? (diffKg / startWeight) * 100 : 0;

      const sign = diffKg > 0 ? "+" : "";
      const formattedKg = `${sign}${diffKg.toFixed(1)} kg`;
      const formattedPct = `${sign}${diffPct.toFixed(1)}%`;

      changeBadgeEl.textContent = `${formattedKg} (${formattedPct})`;
      changeBadgeEl.className = "stat-badge " + (diffKg > 0 ? "positive" : diffKg < 0 ? "negative" : "neutral");

      const rangeLabels = {
        "1M": "past month",
        "3M": "past 3 months",
        "6M": "past 6 months",
        "1Y": "past year",
        "ALL": "all time",
      };
      changePeriodEl.textContent = `over ${rangeLabels[currentTimeRange] || "selected timeline"}`;
      statsSummaryEl.classList.remove("hidden");
    } else if (totalCount === 1) {
      changeBadgeEl.textContent = "0.0 kg (0.0%)";
      changeBadgeEl.className = "stat-badge neutral";
      changePeriodEl.textContent = "single entry in selected timeline";
      statsSummaryEl.classList.remove("hidden");
    } else {
      statsSummaryEl.classList.add("hidden");
    }
  }

  if (chart) {
    chart.destroy();
  }

  chartTitle.textContent = `${exerciseName} - Weight History`;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      // Index mode: tapping anywhere in a vertical band shows the tooltip,
      // far more reliable than requiring a precise point hit on mobile.
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        // beginAtZero: false lets the chart zoom in on actual data range so
        // even small progress is visible rather than dwarfed by a 0 baseline.
        beginAtZero: false,
        grace: "5%",
        grid: {
          color: "rgba(255, 255, 255, 0.08)",
        },
        ticks: {
          color: "#99aab5",
          font: { size: 12 },
          maxTicksLimit: 6,
        }
      },
      x: {
        type: "time",
        time: {
          // Let Chart.js pick the best unit (day/week/month) automatically
          // so the x-axis is never overcrowded on mobile.
          tooltipFormat: "PP",
          displayFormats: {
            day: "d MMM",
            week: "d MMM",
            month: "MMM yy",
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.08)",
        },
        ticks: {
          color: "#99aab5",
          font: { size: 11 },
          // Limit tick count so dates never overlap on a narrow phone screen.
          autoSkip: true,
          maxTicksLimit: 6,
          maxRotation: 0,   // Never rotate labels — keeps axis clean.
          minRotation: 0,
        }
      },
      yVolume: {
        position: "right",
        beginAtZero: true,
        grace: "10%",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "rgba(51, 153, 255, 0.4)",
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: function(value) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 't' : value + 'kg';
          },
        },
        title: {
          display: true,
          text: 'Volume',
          color: 'rgba(51, 153, 255, 0.4)',
          font: { size: 10 },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#99aab5",
          font: { size: 11 },
          boxWidth: 12,
        },
      },
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
                  content: `Goal: ${goalWeight} kg`,
                  position: "start",
                  backgroundColor: "rgba(255, 159, 64, 0.85)",
                  color: "#fff",
                  font: { size: 11, weight: "bold" },
                  padding: { x: 6, y: 3 },
                  borderRadius: 4,
                },
              },
            }
          : {},
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          // Raised from 5 → 10 so vertical page scrolls don't accidentally
          // trigger a chart pan on mobile.
          threshold: 10,
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
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
          backgroundColor: "rgba(51, 153, 255, 0.15)",
          tension: 0.3,
          fill: true,
          // Smaller resting radius so dense points don't overlap;
          // large hover radius for easy fat-finger tapping.
          pointRadius: 4,
          pointHoverRadius: 12,
          pointBackgroundColor: "#3399ff",
          pointHoverBackgroundColor: "#fff",
          pointBorderWidth: 0,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#3399ff",
          borderWidth: 2.5,
          order: 0,
        },
        {
          label: "Est. 1RM (kg)",
          data: est1RMHistory,
          borderColor: "#ffd700",
          borderDash: [4, 4],
          backgroundColor: "rgba(255, 215, 0, 0.05)",
          tension: 0.3,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 10,
          pointBackgroundColor: "#ffd700",
          pointHoverBackgroundColor: "#fff",
          pointBorderWidth: 0,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#ffd700",
          borderWidth: 2,
          order: 0,
        },
        {
          label: "Volume (kg)",
          type: "bar",
          data: volumeHistory,
          yAxisID: "yVolume",
          backgroundColor: "rgba(51, 153, 255, 0.18)",
          borderColor: "rgba(51, 153, 255, 0.3)",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          order: 1,
        },
      ],
    },
    options: options,
  });

  exercisesView.hidden = true;
  chartView.hidden = false;
};
