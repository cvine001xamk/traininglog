// exercises.js

function manageExercises() {
    const db = new Dexie('trainingLog');
    db.version(1).stores({
        workouts: '++id,date',
        exercises: '++id,name'
    });

    const exerciseList = document.getElementById('exercise-list');
    const addNewExerciseForm = document.getElementById('add-new-exercise-form');
    const newExerciseNameInput = document.getElementById('new-exercise-name');
    const chartView = document.getElementById('chart-view');
    const backToExercisesBtn = document.getElementById('back-to-exercises-btn');
    const exercisesView = document.getElementById('exercises');
    const chartTitle = document.getElementById('chart-title');
    let chart;

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

    const renderExerciseOptions = async () => {
        const exerciseSelect = document.getElementById('exercise');
        const exercises = await db.exercises.toArray();
        exerciseSelect.innerHTML = '';
        exercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex.name;
            option.textContent = ex.name;
            exerciseSelect.appendChild(option);
        });
    };

    const renderChart = async (exerciseName) => {
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
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);

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
            options: {
                scales: {
                    y: {
                        suggestedMin: minWeight - 5,
                        suggestedMax: maxWeight + 5
                    }
                }
            }
        });

        exercisesView.hidden = true;
        chartView.hidden = false;
    };

    addNewExerciseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newExerciseName = newExerciseNameInput.value.trim();
        if (newExerciseName) {
            await db.exercises.add({ name: newExerciseName });
            await renderExerciseOptions();
            await renderExerciseManagementList();
            newExerciseNameInput.value = '';
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

    renderExerciseManagementList();
}
