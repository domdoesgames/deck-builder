# Implementation Plan: Card Hand Display

**Branch**: `002-card-hand-display` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-card-hand-display/spec.md`

## Summary

Transform the HandView component from a text-based list (`<ul>/<li>`) to a visual card fan/spread display using CSS Flexbox with responsive sizing. Cards will arrange horizontally with overlap, resize dynamically based on hand size (1-10 cards), and provide hover feedback—all implemented with pure CSS and client-side React (no server-side changes).

**Technical Approach**:
- **Layout**: Flexbox with negative margin overlap
- **Sizing**: CSS `clamp()` with custom properties (`--card-count`) for dynamic calculation
- **Responsive**: Viewport-based sizing ensures 1-10 cards fit @ 1024px+ without horizontal scroll
- **Accessibility**: Maintain semantic HTML + ARIA, add `role="article"` per card
- **Styling**: Integrate with Pico CSS custom properties for consistent theming

## Technical Context

**Language/Version**: TypeScript (ES2022 target)  
**Primary Dependencies**: React 18.2, Vite 5.0, Pico CSS 1.5  
**Storage**: N/A (client-side state only)  
**Testing**: Jest + React Testing Library  
**Target Platform**: Modern web browsers (Chrome 79+, Safari 13.1+, Firefox 75+)  
**Project Type**: Single-page web application (static site)  
**Performance Goals**: 
- Render <50ms for 10 cards
- Hover response <200ms (CSS transition)
- Build time <1s  

**Constraints**: 
- Static-only (no server/database changes)
- No horizontal scroll @ 1024px+ for 10 cards
- Minimum 12px font size (accessibility)  

**Scale/Scope**: 
- Single component modification (HandView.tsx)
- New CSS file (~150 lines)
- 4 new unit tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

✅ **I. Static Asset Simplicity**  
- Pure CSS + client-side React modifications
- No server-side runtime, databases, or build complexity
- Uses existing Vite bundler (no new tools)

✅ **II. Deterministic Build & Reproducible Output**  
- No new dependencies or build steps
- CSS changes bundled with existing `npm run build`
- No network calls beyond package install

✅ **III. Content Integrity & Accessibility Baseline**  
- Maintains semantic HTML (`<section>`, `<h2>`)
- Preserves ARIA labels (`aria-label="Current hand"`)
- Adds accessibility improvements (`role="article"` per card)
- Color contrast maintained (white background + dark text = 12.6:1 ratio)
- Internal links N/A (component-only change)

**Result**: All principles compliant. Proceed to Phase 0 research.

---

### Re-check (After Phase 1 Design)

✅ **I. Static Asset Simplicity**  
- Confirmed: HandView.tsx + HandView.css only
- No server-side changes
- CSS custom properties set via React `style` prop (client-side)

✅ **II. Deterministic Build & Reproducible Output**  
- Confirmed: No new dependencies added
- Build remains `npm run build` (Vite bundles CSS automatically)
- Reproducible: CSS calculations deterministic (no runtime variables)

✅ **III. Content Integrity & Accessibility Baseline**  
- Confirmed: Semantic HTML maintained
- Enhanced: Each card has `role="article"` + `aria-label="Card: {value}"`
- Color contrast: Using Pico CSS variables (pre-validated for WCAG AA)
- Long card names: Cards expand vertically to display full text without truncation

**Result**: All principles compliant. Proceed to Phase 2 (tasks).

## Project Structure

### Documentation (this feature)

```text
specs/002-card-hand-display/
├── plan.md                              # This file (/speckit.plan output)
├── research.md                          # Phase 0: CSS approaches, accessibility patterns
├── data-model.md                        # Phase 1: Card Visual & Hand Layout entities
├── quickstart.md                        # Phase 1: Developer implementation guide
├── contracts/
│   ├── HandView.contract.md            # Component behavior contract
│   └── HandView.css.contract.md        # CSS styling contract
└── checklists/
    └── requirements.md                 # Quality validation checklist (from /speckit.spec)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── HandView.tsx                    # MODIFY: Transform from list to card layout
│   └── HandView.css                    # CREATE: Card fan/spread styles
├── models/
│   ├── Deck.ts                         # EXISTING: From Feature 001
│   └── Hand.ts                         # EXISTING: From Feature 001
├── types/
│   └── css.d.ts                        # CREATE: TypeScript augmentation for CSS custom properties
└── App.tsx                             # EXISTING: No changes needed

tests/
├── unit/
│   └── HandView.test.tsx               # MODIFY: Update for new structure, add 4 tests
├── integration/
│   └── handDisplay.test.ts             # CREATE: Viewport/responsive tests
└── contract/
    └── [no changes]                    # Feature 001 contracts unchanged
```

**Structure Decision**: Single project structure (Option 1). This is a purely front-end feature modifying one component (`HandView`) and adding CSS. No backend, API, or mobile-specific code needed. All changes within `src/components/` and `tests/unit/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations. All principles compliant.
