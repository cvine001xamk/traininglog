# Training Log — Project Rules

Always-on instructions for every task in this workspace.

## Project Identity
Strength training PWA. Vanilla stack, no build step, no package manager, no node_modules.

## Tech Stack
- **HTML**: `index.html` — single-page app, sections toggled via `hidden` attribute
- **CSS**: `style.css` — plain CSS3, no Tailwind, no preprocessors
- **JS**: ES modules (`app.js`, `history.js`, `exercises.js`, `utils.js`) — no bundler
- **DB**: IndexedDB via `dexie.min.js` (bundled locally)
- **Charts**: `chart.min.js` (bundled locally, lazy-loaded)
- **PWA**: `sw.js` service worker + `manifest.json`
- **Font**: Outfit (Google Fonts, loaded in `index.html`) + Bokor (local TTF, headings only)

## CSS Conventions
Use CSS custom properties defined in `:root` — never hardcode values:

```css
--primary-color: #3399ff
--secondary-color: #99aab5
--background-color: #050c38
--surface-color: #1b2062
--border-color: #6700a3
--danger-color: #dc3545
--success-color: #2ecc71
--border-radius: 0.5rem
--spacing: 0.5rem

/* 8-point spacing tokens */
--space-1: 0.25rem   /* 4px  */
--space-2: 0.5rem    /* 8px  */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
```

- Use `var(--space-N)` for spacing, not arbitrary `px` or `rem` values
- Add new CSS to `style.css` — never add inline styles to HTML (existing inline styles are legacy)
- Design is dark theme: `background-color: #050c38` gradient to `#6700a3`
- Bottom nav is fixed at 60px; content area has `padding-bottom: calc(70px + env(safe-area-inset-bottom))`
- All buttons use `min-height: 44px` and `touch-action` for iOS tap targets
- Glassmorphism used on nav bar: `backdrop-filter: blur(12px)`

## JS Conventions
- All JS uses ES module `import`/`export` — no CommonJS
- DOM queries use `getElementById` / `querySelector` — no jQuery
- State is module-level variables; no global `window.*` assignments
- `utils.js` contains shared helpers: `db`, `calculatePlates`, `showAlert`, `showSuccessToast`, `calculate1RM`, `calculateVolume`, `getExerciseHistoricalStats`, `showPRToast`
- New utility functions go in `utils.js`; feature-specific logic stays in its own module

## PWA Rules
- Any change to cached files requires bumping the cache version in `sw.js`
- Notifications go through the Service Worker (`showNotification`) — not the Notification API directly
- `manifest.json` controls installable PWA metadata — update if adding new icon sizes

## Do Not
- Install npm packages or create `package.json`
- Use Tailwind, Bootstrap, or any CSS framework
- Add `<script src="...">` tags for CDN libraries — use locally bundled files only
- Use `document.write` or synchronous XHR
- Modify `chart.min.js` or `dexie.min.js` directly

## Mobile-App Design Skill Override
When the `mobile-app-ui-design` skill is active, **ignore its "Implementation Tech Stack" section** and follow the stack above instead. Design principles (color rules, spacing, typography, UX patterns) still apply.
