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

  const platesNeeded = [];
  let remainingWeightPerSide = weightPerSide;

  if (usablePlates.length > 0) {
    for (const plate of usablePlates) {
      if (remainingWeightPerSide <= 0) break;

      const pairsNeeded = Math.floor(remainingWeightPerSide / plate.weight);
      const pairsToUse = Math.min(pairsNeeded, plate.pairs);

      if (pairsToUse > 0) {
        for (let i = 0; i < pairsToUse; i++) {
          platesNeeded.push({ weight: plate.weight, color: plate.color });
        }
        remainingWeightPerSide -= plate.weight * pairsToUse;
      }
    }

    // Check if we couldn't match exactly based on plates
    // To allow for micro-loading not tracked in DB, we'll still consider valid if remaining is very small
    // But if we cannot construct the weight without plates, we'll return what we could and note the difference
  }

  return {
    weightPerSide: weightPerSide.toFixed(2),
    barWeight: barWeight,
    plates: platesNeeded,
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
