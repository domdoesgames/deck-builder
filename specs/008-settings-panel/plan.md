# Implementation Plan: Collapsible Settings Panel

**Branch**: `008-settings-panel` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-settings-panel/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a collapsible settings panel to reduce visual clutter on the main game interface. The settings (hand size, discard count, reset button, JSON override) will be hidden by default and can be toggled via a "Settings" button. The panel state persists across page reloads using browser storage and automatically expands when errors occur.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (target ES2022)  
**Primary Dependencies**: React 18.2.0, @picocss/pico 1.5.0, Vite 5.0.8  
**Storage**: localStorage (browser storage API)  
**Testing**: Jest 29.7.0 with @testing-library/react 14.1.2  
**Target Platform**: Modern web browsers (ES2022 compatible)  
**Project Type**: Single-page web application (SPA)  
**Performance Goals**: Settings toggle response <100ms, expansion animation <300ms  
**Constraints**: Static site only (no backend), must maintain WCAG AA accessibility, keyboard navigable  
**Scale/Scope**: Single feature affecting 2 existing components (DeckControls, JsonOverride) plus 1 new component (SettingsPanel wrapper)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Static Asset Simplicity ✅
- **Status**: PASS
- **Assessment**: Feature uses only client-side JavaScript (React state + localStorage). No server-side runtime, databases, or backend services introduced.
- **Action**: None required

### Principle II: Deterministic Build & Reproducible Output ✅
- **Status**: PASS
- **Assessment**: No changes to build process. Uses existing `npm run build` command. localStorage is runtime-only, no build-time dependencies.
- **Action**: None required

### Principle III: Content Integrity & Accessibility Baseline ✅
- **Status**: PASS
- **Assessment**: 
  - FR-010 mandates keyboard accessibility for toggle control
  - Toggle button will use semantic HTML (`<button>` with proper ARIA attributes)
  - Visual state indication (FR-006) ensures accessible feedback
  - No new images or color-contrast issues introduced
- **Action**: Manual checklist in PR: verify toggle is keyboard accessible, test with screen reader, confirm ARIA states

### Minimal Operational Constraints ✅
- **Status**: PASS
- **Assessment**: No impact on hosting, deployment, or performance targets. Feature improves perceived performance by reducing initial visual complexity.
- **Action**: None required

### Workflow & Quality Gates ✅
- **Status**: PASS
- **Assessment**: All gates satisfied:
  1. Build unchanged (existing Vite config)
  2. No new external links
  3. Accessibility addressed in FR-010 and design
  4. No server-side code
  5. Minimal size impact (one small component + localStorage hook)
- **Action**: Standard PR workflow with accessibility checklist

**Constitution Gate**: ✅ PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/008-settings-panel/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── SettingsPanel.contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── DeckControls.tsx       # Existing - will be wrapped by SettingsPanel
│   ├── JsonOverride.tsx       # Existing - will be wrapped by SettingsPanel
│   └── SettingsPanel.tsx      # New - collapsible wrapper component
├── hooks/
│   ├── useDeckState.ts        # Existing - no changes needed
│   └── useSettingsVisibility.ts  # New - manages visibility state + localStorage
├── lib/
│   └── types.ts               # Existing - may add SettingsVisibility type
└── App.tsx                    # Existing - will use SettingsPanel wrapper

tests/
├── unit/
│   ├── SettingsPanel.test.tsx          # New - component tests
│   └── useSettingsVisibility.test.ts   # New - hook tests
└── integration/
    └── settingsVisibility.test.tsx     # New - error expansion flow tests
```

**Structure Decision**: Single project structure maintained. Feature adds one new component (SettingsPanel) and one new hook (useSettingsVisibility) following existing patterns. DeckControls and JsonOverride remain unchanged internally but are composed within SettingsPanel wrapper.

## Complexity Tracking

*No constitution violations - section not applicable.*
