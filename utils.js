// utils.js

// Initialize Dexie Database
export const db = new Dexie("trainingLog");
db.version(1).stores({
  exercises: "++id,name",
  workouts: "++id,date",
});
db.version(2).stores({
  plates: "++id,weight,amount",
});

// Helper to calculate plate split using available plates
export async function calculatePlates(weight, barWeight = 10) {
  if (weight <= barWeight) return null;

  let targetTotalWeight = weight;
  let weightPerSide = (weight - barWeight) / 2;
  if (weightPerSide <= 0) return null;

  // Retrieve available plates from DB, ordered by weight descending
  // Plates must be pairs, so we divide the amount by 2
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
  const usablePlates = availablePlates
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
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
