// exercises.js
import { db, loadScript } from './utils.js';

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

export function initExercises() {
    exerciseList = document.getElementById('exercise-list');
    addNewExerciseForm = document.getElementById('add-new-exercise-form');
    newExerciseNameInput = document.getElementById('new-exercise-name');
    chartView = document.getElementById('chart-view');
    backToExercisesBtn = document.getElementById('back-to-exercises-btn');
    exercisesView = document.getElementById('exercises');
    chartTitle = document.getElementById('chart-title');
    resetZoomBtn = document.getElementById('reset-zoom-btn');
    goalWeightInput = document.getElementById('goal-weight-input');
    saveGoalBtn = document.getElementById('save-goal-btn');

    // Initialize event listeners only once
    if (!initExercises.initialized) {
        resetZoomBtn.addEventListener('click', () => {
            if (chart) chart.resetZoom();
        });

        saveGoalBtn.addEventListener('click', async () => {
            if (!currentChartExercise) return;
            const goal = parseFloat(goalWeightInput.value);
            const exerciseData = await db.exercises.get({ name: currentChartExercise });
            if (exerciseData) {
                await db.exercises.update(exerciseData.id, { goalWeight: isNaN(goal) ? null : goal });
                await renderChart(currentChartExercise); // Re-render to update the line
                alert("Goal saved!");
            }
        });

        addNewExerciseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newExerciseName = newExerciseNameInput.value.trim();
            const barWeight = parseInt(document.getElementById('new-exercise-bar-weight').value);
            if (newExerciseName) {
                await db.exercises.add({ name: newExerciseName, barWeight: barWeight });
                await renderExerciseManagementList();
                newExerciseNameInput.value = '';
                alert("Exercise added! Go to 'Log Workout' to see it in the list.");
            }
        });

        exerciseList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('view-history-btn')) {
                const exerciseName = e.target.dataset.name;
                await renderChart(exerciseName);
            }
        });

        exerciseList.addEventListener('change', async (e) => {
            if (e.target.classList.contains('bar-weight-select')) {
                const id = parseInt(e.target.dataset.id);
                const barWeight = parseInt(e.target.value);
                await db.exercises.update(id, { barWeight: barWeight });
            }
        });

        backToExercisesBtn.addEventListener('click', () => {
            chartView.hidden = true;
            exercisesView.hidden = false;
        });
        
        initExercises.initialized = true;
    }
}

export function manageExercises() {
    renderExerciseManagementList();
}

const renderExerciseManagementList = async () => {
    const exercises = await db.exercises.toArray();
    exerciseList.innerHTML = '';
    exercises.forEach(ex => {
        const item = document.createElement('article');
        item.classList.add('exercise-list-item');
        const barWeight = ex.barWeight || 10; // Default to 10kg if not set
        item.innerHTML = `
            <div>
                <div class="exercise-info">
                    <strong>${ex.name}</strong>
                    <div class="bar-selection">
                        <label>Bar: </label>
                        <select class="bar-weight-select" data-id="${ex.id}">
                            <option value="2" ${barWeight === 2 ? 'selected' : ''}>2 kg</option>
                            <option value="8" ${barWeight === 8 ? 'selected' : ''}>8 kg</option>
                            <option value="10" ${barWeight === 10 ? 'selected' : ''}>10 kg</option>
                            <option value="20" ${barWeight === 20 ? 'selected' : ''}>20 kg</option>
                        </select>
                    </div>
                </div>
                <div class="button-group">
                    <button class="btn view-history-btn" data-name="${ex.name}">View History</button>
                </div>
            </div>
        `;
        exerciseList.appendChild(item);
    });
};

const renderChart = async (exerciseName) => {
    // Lazy load Chart.js and plugins
    try {
        await loadScript('./chart.min.js');
        // Load time adapter and zoom plugin from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@2/dist/chartjs-plugin-annotation.min.js');
    } catch (e) {
        console.error("Failed to load chart libraries", e);
        alert("Failed to load chart library.");
        return;
    }

    const exerciseData = await db.exercises.get({ name: exerciseName });
    const goalWeight = exerciseData && exerciseData.goalWeight ? exerciseData.goalWeight : null;
    currentChartExercise = exerciseName;
    if (goalWeightInput) {
        goalWeightInput.value = goalWeight || '';
    }

    const workouts = await db.workouts.orderBy('date').toArray();
    const exerciseHistory = workouts.flatMap(w =>
        w.exercises
            .filter(ex => ex.exercise === exerciseName)
            .map(ex => ({ 
                x: new Date(w.date).getTime(), 
                y: parseFloat(ex.weight) 
            }))
    );

    if (chart) {
        chart.destroy();
    }

    chartTitle.textContent = `${exerciseName} - Weight History`;

    const weights = exerciseHistory.map(h => h.weight);
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grace: '10%' // Add some breathing room at the top
            },
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'dd.MM'
                    },
                    tooltipFormat: 'PP'
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        },
        plugins: {
            annotation: {
                annotations: goalWeight ? {
                    goalLine: {
                        type: 'line',
                        yMin: goalWeight,
                        yMax: goalWeight,
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            display: true,
                            content: 'Goal',
                            position: 'start',
                            backgroundColor: 'rgba(255, 159, 64, 0.8)'
                        }
                    }
                } : {}
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                }
            }
        }
    };

    const ctx = document.getElementById('exercise-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Weight (kg)',
                data: exerciseHistory,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: options
    });

    exercisesView.hidden = true;
    chartView.hidden = false;
};
