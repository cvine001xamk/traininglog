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
- **Custom Exercises**: Register custom exercises and configure default bar weights (e.g., 2kg, 8kg, 10kg, 20kg barbell options).

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

## 📄 License

This project is open-source and available under the standard project license.
