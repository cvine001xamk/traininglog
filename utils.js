// utils.js

// Initialize Dexie Database
export const db = new Dexie("trainingLog");
db.version(1).stores({
  exercises: "++id,name",
  workouts: "++id,date",
});

// Helper to calculate plate split
export function calculatePlates(weight) {
  if (weight <= 10) return null;
  
  let weightPerSide = (weight - 10) / 2;
  if (weightPerSide < 0) weightPerSide = 0;
  
  return {
    weightPerSide: weightPerSide.toFixed(2)
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
