---
name: mobile-app-ui-design
description: Design high-quality mobile app UI/UX screens, flows, and components. Use this skill whenever the user asks to design a mobile app screen, create app mockups, build mobile UI components, improve an existing mobile app design, create onboarding flows, design mobile navigation, or requests any mobile-first interface work. Also trigger when the user mentions app design, mobile UI, mobile UX, screen design, app mockups, wireframes, or wants to build React Native / Flutter / SwiftUI style interfaces as visual prototypes. Even if the user just says "design an app" or "make this screen look better", use this skill.
---

# Mobile App UI/UX Design Skill

**Goal**: intentional, smooth, personal interfaces — not just functional.

Before designing, answer:
1. What is the user trying to accomplish? (reduce friction to that goal)
2. How should this make the user feel? (trust, delight, confidence, calm)
3. What's the one thing they should notice first? (visual hierarchy)

## 5-Step Design Process

1. **Context** — app type, user stage (new/returning/power), primary action, industry conventions
2. **Structure (UX)** — map user flow, MVP elements only, thumb zone for primary actions, F-pattern layout, minimize taps
3. **Visual Design (UI)** — typography, color (60/30/10 rule), spacing (8-point grid), shadows, imagery
4. **Emotion** — design the peak moment and the ending; add emotional feedback loops
5. **Polish** — micro-animations, 44×44pt tap targets, contrast check, all states (error/empty/loading/success)

> For detailed rules on each step, read `references/design-rules.md`.

## Key Design Laws (quick ref)

| Law | Rule |
|-----|------|
| Color | 60% neutral / 30% complementary / 10% accent |
| Spacing | All values divisible by 8 or 4 |
| Typography | Max 4 font sizes, 2 weights; opacity for hierarchy |
| Shadows | Soft only; tint to match background |
| Thumb Zone | Primary CTAs in bottom 1/3 of screen |
| Peak-End | Design the peak moment + final impression |

## Anti-Patterns
- More than 4 font sizes or 3 font weights
- Random spacing values (not on 8-point grid)
- CTAs outside the thumb zone
- Blank search / empty states with no guidance
- Gray/black shadows on colored backgrounds
- All content at the same visual weight
- Labels bigger than values (e.g., "Sales" bigger than "591")
- Sliders for frequent/precise data entry

## Implementation Tech Stack
> **Always check the workspace `AGENTS.md` first** — it overrides this section with the actual project stack.

Defaults (when no project-level rules exist):
- **CSS**: Tailwind CSS utility classes
- **Icons**: Lucide React
- **Charts**: Recharts
- **Motion**: CSS transitions for micro-interactions + CSS variables for the color system
- **Baseline**: mobile-first at 375px (iPhone SE); `rounded-2xl`/`rounded-3xl` for cards; `backdrop-blur` for glassmorphism

## Reference Files
Read these when you need deeper guidance — do not load them unless relevant to the task:

- `references/design-rules.md` — detailed typography, color, spacing, shadow, and UX pattern rules
- `references/industry-conventions.md` — industry-specific design languages (AI, Crypto, Finance, Health, etc.), Peak-End Rule deep dive, Spotify strategic principles, 4-phase client design process
