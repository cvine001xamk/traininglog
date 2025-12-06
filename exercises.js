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

export function initExercises() {
    exerciseList = document.getElementById('exercise-list');
    addNewExerciseForm = document.getElementById('add-new-exercise-form');
    newExerciseNameInput = document.getElementById('new-exercise-name');
    chartView = document.getElementById('chart-view');
    backToExercisesBtn = document.getElementById('back-to-exercises-btn');
    exercisesView = document.getElementById('exercises');
    chartTitle = document.getElementById('chart-title');

    // Initialize event listeners only once
    if (!initExercises.initialized) {
        addNewExerciseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newExerciseName = newExerciseNameInput.value.trim();
            if (newExerciseName) {
                await db.exercises.add({ name: newExerciseName });
                // We need to re-render the options in app.js, but since we don't have direct access,
                // we can rely on the user navigating or we could export a refresh function from app.js.
                // For simplicity/decoupling, we just update the local list.
                // Ideally, we'd use a reactive store or event bus.
                // For now, let's just update the management list.
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
        item.innerHTML = `
            <div>
                <span>${ex.name}</span>
                <div class="button-group">
                    <button class="btn view-history-btn" data-name="${ex.name}">View History</button>
                </div>
            </div>
        `;
        exerciseList.appendChild(item);
    });
};

const renderChart = async (exerciseName) => {
    // Lazy load Chart.js
    try {
        await loadScript('./chart.min.js');
    } catch (e) {
        console.error("Failed to load Chart.js", e);
        alert("Failed to load chart library.");
        return;
    }

    const workouts = await db.workouts.orderBy('date').toArray();
    const exerciseHistory = workouts.flatMap(w =>
        w.exercises
            .filter(ex => ex.exercise === exerciseName)
            .map(ex => ({ date: w.date, weight: ex.weight }))
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
            y: {}
        }
    };

    if (weights.length > 0) {
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        options.scales.y.min = minWeight - 5;
        options.scales.y.max = maxWeight + 5;
    }

    const ctx = document.getElementById('exercise-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: exerciseHistory.map(h => new Date(h.date).toLocaleDateString()),
            datasets: [{
                label: 'Weight (kg)',
                data: weights,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: options
    });

    exercisesView.hidden = true;
    chartView.hidden = false;
};
