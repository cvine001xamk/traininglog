// exercises.js

function manageExercises() {
    const db = new Dexie('trainingLog');
    db.version(1).stores({
        exercises: '++id,name'
    });

    const exerciseList = document.getElementById('exercise-list');
    const addNewExerciseForm = document.getElementById('add-new-exercise-form');
    const newExerciseNameInput = document.getElementById('new-exercise-name');

    const renderExerciseManagementList = async () => {
        const exercises = await db.exercises.toArray();
        exerciseList.innerHTML = '';
        exercises.forEach(ex => {
            const item = document.createElement('article');
            item.classList.add('exercise-list-item');
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${ex.name}</span>
                    <button class="delete-exercise-btn" data-id="${ex.id}" style="width: auto; background-color: var(--pico-color-red-500); margin-left: 1rem;">&times;</button>
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
        if (e.target.classList.contains('delete-exercise-btn')) {
            const exerciseId = parseInt(e.target.dataset.id);
            await db.exercises.delete(exerciseId);
            await renderExerciseOptions();
            await renderExerciseManagementList();
        }
    });

    renderExerciseManagementList();
}
