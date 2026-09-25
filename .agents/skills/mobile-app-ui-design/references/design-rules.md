# Design Rules Reference

## Typography
- One font family (two max, with clear hierarchy purpose)
- Max 4 font sizes, 2 font weights
- Monospace variants for large numbers (prices, stats, metrics)
- Text containers under 600px wide
- Hierarchy via size, weight, and opacity — not just bold

## Color System — 60/30/10 Rule
- **60%** neutral base (white, light gray, or dark background)
- **30%** complementary (black text, dark elements)
- **10%** brand/accent (CTAs, key indicators, icons)
- Opacity tiers for text hierarchy: 100% headings / 80% body / 60-70% secondary
- Accent at 5% opacity for secondary buttons and subtle card highlights
- Shadow colors tinted to match background — never pure gray/black on colored backgrounds
- Reserve strong colors (red, etc.) for meaningful moments only

## Spacing — 8-Point Grid
- All values divisible by 8 or 4 (8, 12, 16, 24, 32, 48, 64, 80, 96)
- Relationship-based: related elements closer, unrelated further
- Multiplier rule: if related elements are 16px apart, the gap to the next group = 32px
- Section vertical padding: 80–96px (160px for major sections on larger screens)
- Card internal padding: 24–32px baseline
- Larger text → larger surrounding spacing

## Shadows
- Always soft — never harsh/distinct
- Shadow color tinted to background hue
- Subtle white inner shadows on buttons for dimension
- Faded drop shadows for depth without heaviness

## Visual Cues & Imagery
- Icons, emojis, illustrations make information digestible
- User avatars/photos > initials > generic icons (for people)
- Color-coded categories: soft solid backgrounds + clean isolated images
- Consistent visual style across the entire app
- AI-generated or curated visuals with matching color palettes

## Emotional Design — Peak-End Rule
- **Peak**: the most intense/emotional moment in the flow
  - Pick ONE spot for a "holy dang" moment (badge, sparkle, personalized brief, etc.)
  - Trigger: after completing a core task, hitting a milestone, or significant effort
- **End**: last impression before leaving
  - Celebrate what was done (check mark, summary card)
  - Encourage what comes next; reaffirm progress
  - Gentle nudge to return
- Reduce negative peaks: uplift wait/error states with microcopy and loading animations

## Smart UX Patterns
- **Search**: never show blank — include recent searches, trending, personalized recs
- **Order/Status**: open with confident status; use visual timelines over text date lists
- **Categories**: color-coded cards, soft backgrounds, consistent visual rhythm
- **Selection over input**: tappable options with icons/emojis + "Other" fallback
- **Personalization by stage**:
  - New users → simple welcome, guided setup, minimal options
  - Returning → personalized content, routine focus, progress indicators
  - Power users → dense info, advanced stats, optimization tools
