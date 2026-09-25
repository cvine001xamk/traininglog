# Training Log 🏋️‍♂️

A lightweight, privacy-focused Progressive Web Application (PWA) designed for strength training and barbell weight logging. Built with pure Vanilla JavaScript, HTML5, and CSS3, it offers an offline-first experience powered by IndexedDB.

---

## 🌟 Key Features

### 🏋️ 1. Workout Logging & Staging
- **Exercise Session Staging**: Log exercises with weight (kg), sets, and reps before saving the full workout session.
- **Barbell Plate Visualizer**: Dynamic visual breakdown showing exact plate combinations to load on each side of the barbell based on your custom plate inventory and selected bar weight.
- **Last Logged Weight Hint**: Displays the weight, sets, and reps from your last recorded session when selecting an exercise.
- **Built-in Rest Timer**: Quick 1-minute increment rest timer positioned at the top of the logging view with real-time countdown display.

### 📊 2. Progress Analytics & Goal Setting
- **Interactive Progress Charts**: View strength trends and Estimated 1RM over time per exercise powered by `Chart.js` (lazy-loaded for fast initial load).
- **Estimated 1RM & PR Celebrations**: Automatic 1-Rep Max calculation using the Epley formula ($1RM = Weight \times (1 + Reps / 30)$) with celebratory gold toast notifications (🏆) and vibration alerts whenever a Personal Record is broken.
- **Time-Range Filters**: Filter progress history across preset timeframes (`1M`, `3M`, `6M`, `1Y`, `ALL`).
- **Goal Weight Tracking**: Set target goals per exercise with a goal visualization line rendered on progress charts.
- **Performance Summary Badges**: Dynamic calculation of weight change ($\Delta$ kg and %), total sessions completed, and weekly average frequency over the selected timeframe.
- **Chart Controls**: Pinch-to-zoom support, pan, and one-click zoom reset.

### 📜 3. Workout History & Data Management
- **Chronological History View**: Paginated view of past workouts with detailed breakdowns of exercises, weights, sets, reps, Estimated 1RM, and 🏆 **PR Badges**.
- **In-Place History Editing**: Modify previous workout sets, reps, or weights directly from the history view.
- **Data Import / Export**:
  - Export training logs to standard `.csv` files.
  - RFC 4180-compliant CSV parser for importing existing history seamlessly.

### ⚙️ 4. Inventory & Customization
- **Plate Inventory Management**: Add, modify, or remove custom barbell plates with specified weights, pair quantities, and custom colors.
- **Custom Exercises & Categorization**: Register custom exercises across categories (Barbell / Main Lifts, Auxiliary / Landmine / Cable, and Bodyweight / Core). Auxiliary and bodyweight movements adapt dynamically with contextual placeholders, 0kg bodyweight logging, and automatic plate visualizer suppression.

### 📱 5. PWA & Mobile UX
- **Offline Support**: Service Worker (`sw.js`) enables full functionality without an active internet connection.
- **Background Rest Timer Notifications**: Native PWA notifications scheduled via Service Worker (`showNotification`) that alert you when rest intervals complete—even when the app is minimized or the screen is locked.
- **Installable PWA**: Modern web app manifest allowing setup as a standalone desktop or mobile application.
- **Mobile-Optimized Interface**: Clean bottom-navigation bar, custom modal dialogs, non-intrusive toast notifications, and iOS-optimized touch interactions.

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, Vanilla JavaScript (ES Modules), Custom CSS3 (Outfit Google Font)
- **Database**: IndexedDB via [Dexie.js](https://dexie.org/)
- **Charts & Visualization**: [Chart.js](https://www.chartjs.org/) (Lazy-loaded module)
- **Offline & PWA**: Service Worker API & Web App Manifest

---

## 🚀 Getting Started

### Local Setup
Since **Training Log** is built with standard web technologies and ES modules, you can serve the project using any local web server.

1. Clone or open the repository:
   ```bash
   git clone https://github.com/cvine001xamk/traininglog.git
   cd traininglog
   ```

2. Start a local server (e.g., using Python or Node.js `http-server`):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Or using npx http-server
   npx http-server . -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 🔮 Future Roadmap (TODO Tasks)

Here are planned features and improvements for future iterations:

- [x] **Auxiliary & Bodyweight Exercise Support**: Log landmine workouts, ab crunches, and core/bodyweight exercises cleanly with categorized `<optgroup>` dropdowns, adaptive weight inputs (supporting 0 kg bodyweight), and automated plate visualizer suppression.
- [ ] **RPE & RIR Tracking**: Add Rate of Perceived Exertion (RPE 1–10) and Reps in Reserve (RIR) fields per set for advanced autoregulation.
- [ ] **Warm-up Set Calculator**: Automatically calculate progressive warm-up sets and barbell plate loadings leading up to working sets.
- [ ] **Workout Templates & Routines**: Create, save, and quickly start pre-configured workout routines (e.g., Push/Pull/Legs, Upper/Lower, 5/3/1).
- [ ] **Superset & Circuit Support**: Link exercises together in the session staging area to track supersets and circuit rest intervals.
- [ ] **Specialty Bars & Collars**: Support custom barbell types (Safety Squat Bar, Trap Bar, Swiss Bar, EZ-Curl) and collar weights in the plate visualizer.
- [ ] **Exercise Notes & Form Cues**: Attach persistent form cues, technique notes, and workout session reflections.
- [ ] **Calendar & Consistency Heatmap**: Visual training calendar with weekly streaks and monthly workout frequency heatmaps.
- [ ] **Lossless JSON Backup & Restore**: Full offline database export and restore in JSON format alongside CSV support.
- [ ] **Custom Audio Rest Timer Alerts**: Optional audio chimes/bell sound cues when the rest timer finishes.
- [ ] **Relative Strength Metrics (Wilks / DOTS)**: Optional bodyweight tracking to calculate strength-to-weight ratios over time.

---

## 🐛 Known Issues & Planned Improvements

Findings from a full codebase audit, grouped by priority.

### 🔴 High Priority

- [ ] **Bundle chart plugins locally** (`exercises.js`) — `chartjs-adapter-date-fns`, `chartjs-plugin-zoom`, and `chartjs-plugin-annotation` are currently fetched from `cdn.jsdelivr.net` at runtime, which silently breaks the chart view when offline. These should be bundled locally like `chart.min.js` and added to the service worker cache.
- [x] **Batch PR stats check on save** (`utils.js`, `app.js`) — `getExerciseHistoricalStats` is called in a `for...of` loop on workout save, triggering one full IndexedDB table scan per exercise. Fixed: replaced with `getBatchExerciseStats` — a single cursor pass that collects stats for all exercises in the workout simultaneously.

### 🟡 Medium Priority

- [x] **Debounce weight input** (`app.js`) — The plate visualizer hits IndexedDB on every keystroke. Fixed: Added a 150ms debounce handler on the weight input to prevent redundant DB reads during rapid typing.
- [ ] **Fix CSV export encoding** (`history.js`) — `encodeURI` on the data URI doesn't encode `#` characters, which can silently truncate exports for exercises with special characters. Should use `URL.createObjectURL(new Blob(...))` instead.
- [ ] **History delete/edit — avoid full list re-render** (`history.js`) — Deleting or cancelling an edit currently wipes and re-fetches the entire history list, resetting pagination. Should remove/replace only the affected `<article>` element in the DOM.
- [ ] **Haptic feedback on workout save** (`app.js`) — The app vibrates on PR and timer finish but not on the primary save action. A short `navigator.vibrate(100)` pulse would reinforce the action on mobile.
- [ ] **`updateLastWeightInfo` scan can be expensive** (`app.js`) — Scans the full workouts table on every exercise selection change. Could cache historical max values on the exercise record and update them only on save.
- [ ] **Chart colors use hardcoded hex** (`exercises.js`) — Chart dataset colors (`#3399ff`, `#99aab5`, etc.) are hardcoded instead of reading from CSS custom properties. Should use `getComputedStyle` to read `--primary-color` / `--secondary-color` at render time.

### 🟢 Low Priority / Polish

- [x] **History re-fetches on every tab switch** (`app.js`) — `renderHistory()` is called unconditionally when switching to the History tab. Fixed: Added a `historyDirty` flag gating re-fetches to only when new workouts have been saved or upon initial load.
- [x] **Plate visualizer uses `cssText` strings** (`app.js`, `style.css`) — Plate elements are styled entirely via `element.style.cssText`, bypassing the CSS custom property system. Fixed: Created `.plate` CSS class with structural and font styles; dynamic plate values (`height`, `backgroundColor`, `color`, `textShadow`) are now set cleanly as direct properties.
- [ ] **`showAlert` used for success feedback** (`exercises.js`) — Adding a new exercise shows a modal dialog to confirm success. This should use `showSuccessToast` to avoid interrupting the user's flow.
- [ ] **CSV export loses PR and 1RM data** (`history.js`) — Exported CSVs only contain `Date,Exercise,Weight,Sets,Reps`. Re-importing loses PR badges and stored 1RM values. Optional `Est1RM,IsPR` columns would allow lossless round-trips.
- [x] **Legacy inline styles in `index.html`** (`index.html`, `style.css`) — Several elements (`#last-weight-info`, timer SVG, `#plate-list`, etc.) use inline `style` attributes. Fixed: Extracted all legacy inline styles into dedicated CSS classes and tokens in `style.css`.
- [ ] **Drag-to-reorder exercises in workout list** (`app.js`, `style.css`) — Allow reordering exercises in the current workout session list by dragging them up or down (via drag handles and touch-friendly drag-and-drop).

---

## 📄 License

This project is open-source and available under the standard project license.
