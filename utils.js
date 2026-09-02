// utils.js

// Initialize Dexie Database
export const db = new Dexie("trainingLog");
db.version(1).stores({
  exercises: "++id,name",
  workouts: "++id,date",
});
db.version(2).stores({
  exercises: "++id,name",
  workouts: "++id,date",
  plates: "++id,weight,amount",
});

// Helper to calculate plate split using available plates
let platesCache = null;

export function invalidatePlatesCache() {
  platesCache = null;
}

export async function calculatePlates(weight, barWeight = 10) {
  if (weight <= barWeight) return null;

  let targetTotalWeight = weight;
  let weightPerSide = (weight - barWeight) / 2;
  if (weightPerSide <= 0) return null;

  // Retrieve available plates from cache or DB, ordered by weight descending
  // Plates must be pairs, so we divide the amount by 2
  if (!platesCache) {
    let availablePlates = await db.plates.orderBy("weight").reverse().toArray();

    if (availablePlates.length === 0) {
      availablePlates = [
        { weight: 25, amount: 20, color: "#ff0000" },
        { weight: 20, amount: 20, color: "#0000ff" },
        { weight: 15, amount: 20, color: "#ffff00" },
        { weight: 10, amount: 20, color: "#00ff00" },
        { weight: 5, amount: 20, color: "#ffffff" },
        { weight: 2.5, amount: 20, color: "#cfcfcf" },
        { weight: 1.25, amount: 20, color: "#cfcfcf" },
      ];
    }
    platesCache = availablePlates;
  }

  let usablePlates = platesCache
    .map((p) => ({
      weight: p.weight,
      pairs: Math.floor(p.amount / 2),
      color: p.color || "#cfcfcf",
    }))
    .filter((p) => p.pairs > 0);

  const targetInt = Math.round(weightPerSide * 1000);

  const platesInt = usablePlates
    .map((p) => ({
      ...p,
      weightInt: Math.round(p.weight * 1000),
    }))
    .sort((a, b) => b.weightInt - a.weightInt);

  let bestSumInt = -1;
  let minPlates = Infinity;
  let bestPlates = [];

  function findBest(index, currentSumInt, currentPlatesCount, currentPlates) {
    if (currentSumInt > bestSumInt) {
      bestSumInt = currentSumInt;
      minPlates = currentPlatesCount;
      bestPlates = [...currentPlates];
    } else if (currentSumInt === bestSumInt && currentPlatesCount < minPlates) {
      minPlates = currentPlatesCount;
      bestPlates = [...currentPlates];
    }

    if (index >= platesInt.length) return;

    const plate = platesInt[index];

    let maxRemainingSum = 0;
    for (let j = index; j < platesInt.length; j++) {
      maxRemainingSum += platesInt[j].pairs * platesInt[j].weightInt;
    }

    // Prune branch if we mathematically cannot exceed the best sum found so far
    if (currentSumInt + maxRemainingSum < bestSumInt) {
      return;
    }

    for (let i = plate.pairs; i >= 0; i--) {
      const nextSumInt = currentSumInt + i * plate.weightInt;
      if (nextSumInt <= targetInt) {
        // Prune paths that would definitely use more plates than an ideal match we already found
        if (bestSumInt === targetInt) {
          if (nextSumInt === targetInt && currentPlatesCount + i >= minPlates)
            continue;
          if (nextSumInt < targetInt && currentPlatesCount + i >= minPlates - 1)
            continue;
        }

        let added = [];
        if (i > 0) {
          for (let k = 0; k < i; k++) {
            added.push({ weight: plate.weight, color: plate.color });
          }
        }
        findBest(
          index + 1,
          nextSumInt,
          currentPlatesCount + i,
          currentPlates.concat(added),
        );
      }
    }
  }

  if (usablePlates.length > 0) {
    findBest(0, 0, 0, []);
  }

  const remainingWeightPerSide =
    bestSumInt >= 0 ? (targetInt - bestSumInt) / 1000 : weightPerSide;

  return {
    weightPerSide: weightPerSide.toFixed(2),
    barWeight: barWeight,
    plates: bestPlates,
    remainingWeightPerSide:
      remainingWeightPerSide > 0 ? remainingWeightPerSide : 0,
  };
}

// Helper to format date
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper to lazy load scripts
const loadedScripts = {};

export function loadScript(src) {
  if (loadedScripts[src]) {
    return loadedScripts[src];
  }

  const promise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = (err) => {
      delete loadedScripts[src];
      reject(err);
    };
    document.head.appendChild(script);
  });

  loadedScripts[src] = promise;
  return promise;
}

// Styled dialog helpers (replace native alert/confirm)
export function showAlert(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById("app-dialog");
    const msgEl = document.getElementById("dialog-message");
    const confirmBtn = document.getElementById("dialog-confirm-btn");
    const cancelBtn = document.getElementById("dialog-cancel-btn");

    msgEl.textContent = message;
    cancelBtn.style.display = "none";
    confirmBtn.textContent = "OK";

    const cleanup = () => {
      dialog.close();
      confirmBtn.removeEventListener("click", onConfirm);
      dialog.removeEventListener("click", onBackdrop);
    };

    const onConfirm = () => {
      cleanup();
      resolve();
    };
    const onBackdrop = (e) => {
      if (e.target === dialog) {
        cleanup();
        resolve();
      }
    };

    confirmBtn.addEventListener("click", onConfirm);
    dialog.addEventListener("click", onBackdrop);

    dialog.showModal();
  });
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById("app-dialog");
    const msgEl = document.getElementById("dialog-message");
    const confirmBtn = document.getElementById("dialog-confirm-btn");
    const cancelBtn = document.getElementById("dialog-cancel-btn");

    msgEl.textContent = message;
    cancelBtn.style.display = "";
    confirmBtn.textContent = "Confirm";

    const cleanup = () => {
      dialog.close();
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      dialog.removeEventListener("click", onBackdrop);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onBackdrop = (e) => {
      if (e.target === dialog) {
        cleanup();
        resolve(false);
      }
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    dialog.addEventListener("click", onBackdrop);

    dialog.showModal();
  });
}

// RFC 4180-aware CSV line parser (handles quoted fields with commas)
export function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function showSuccessToast(message) {
  const existing = document.querySelector(".success-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "success-toast";
  toast.innerHTML = `
    <div class="success-toast-icon">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, 2200);
}

// 1RM Calculation using Epley Formula: 1RM = Weight * (1 + Reps / 30)
export function calculate1RM(weight, reps) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return 0;
  if (r === 1) return Math.round(w * 10) / 10;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

// Helper to fetch max weight and max 1RM recorded for an exercise
export async function getExerciseHistoricalStats(exerciseName) {
  let maxWeight = 0;
  let max1RM = 0;
  let hasHistory = false;

  await db.workouts.orderBy("date").each((workout) => {
    workout.exercises.forEach((ex) => {
      if (ex.exercise === exerciseName) {
        hasHistory = true;
        const w = parseFloat(ex.weight) || 0;
        const r = parseInt(ex.reps, 10) || 0;
        const est1RM = ex.est1RM || calculate1RM(w, r);
        if (w > maxWeight) maxWeight = w;
        if (est1RM > max1RM) max1RM = est1RM;
      }
    });
  });

  return { maxWeight, max1RM, hasHistory };
}

// PR Celebratory Toast
export function showPRToast(prList) {
  if (!prList || prList.length === 0) return;

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch (e) {}
  }

  prList.forEach((pr, index) => {
    setTimeout(() => {
      const toast = document.createElement("div");
      toast.className = "pr-toast";

      let prTypeLabel = "";
      if (pr.isWeightPR && pr.is1RM_PR) prTypeLabel = "NEW MAX WEIGHT & 1RM PR!";
      else if (pr.isWeightPR) prTypeLabel = "NEW MAX WEIGHT PR!";
      else prTypeLabel = "NEW ESTIMATED 1RM PR!";

      toast.innerHTML = `
        <div class="pr-toast-header">
          <span class="pr-trophy">🏆</span>
          <div class="pr-title-group">
            <span class="pr-badge-title">${prTypeLabel}</span>
            <strong class="pr-exercise-name">${pr.exercise}</strong>
          </div>
        </div>
        <div class="pr-toast-body">
          <span>${pr.weight} kg × ${pr.sets} × ${pr.reps}</span>
          <span class="pr-1rm-tag">Est. 1RM: <strong>${pr.est1RM} kg</strong></span>
        </div>
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add("pr-toast-out");
        toast.addEventListener("animationend", () => toast.remove());
      }, 4500);
    }, index * 400);
  });
}


