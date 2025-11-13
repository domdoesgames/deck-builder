# Implementation Plan: Deck Reset

**Branch**: `006-deck-reset` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-deck-reset/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a reset button to DeckControls that returns the entire game state to initial conditions (fresh shuffled deck, cleared piles, unlocked play order) while preserving user settings (hand size, discard count). Additionally, ensure the deck is automatically shuffled on every page load before dealing the initial hand. The reset operation must complete in under 500ms and use the existing Fisher-Yates shuffle algorithm for consistency.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (ES2022 target)  
**Primary Dependencies**: React 18.2.0, Vite 5.0.8, @picocss/pico 1.5.0  
**Storage**: localStorage (with silent fallback to in-memory on failure)  
**Testing**: Jest 29.7.0, @testing-library/react 14.1.2  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - static site deployment)
**Project Type**: Single-page web application (static)  
**Performance Goals**: <500ms reset operation, <2s first meaningful paint (per constitution)  
**Constraints**: Purely static site (no server-side runtime), offline-capable after initial load, no database  
**Scale/Scope**: Single-user prototype, ~10-card hand, 52-card standard deck, 106 existing tests to maintain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Static Asset Simplicity
✅ **PASS** - Feature adds reset button (UI interaction) and client-side state management only. No server-side runtime, databases, or dynamic backends introduced. Uses existing localStorage (already in codebase). Purely client-side JavaScript/TypeScript logic.

### Principle II: Deterministic Build & Reproducible Output
✅ **PASS** - No changes to build process. Feature adds TypeScript code that compiles via existing `npm run build` command. No new build steps, no network calls, no environment-dependent branches. Shuffle uses crypto.getRandomValues with Math.random fallback (deterministic in build, randomness at runtime is expected behavior).

### Principle III: Content Integrity & Accessibility Baseline
✅ **PASS** - Reset button will be added to existing DeckControls component which already follows semantic HTML patterns. Button will have clear label and proper ARIA attributes. No new pages added. Existing accessibility baseline maintained.

### Operational Constraints Check
✅ **PASS** - No hosting changes needed (static files only). No secrets required. Performance target: Reset operation <500ms per spec (well under 2s FMP budget). No deployment changes.

### Quality Gates Check
✅ **PASS** - Will verify: (1) Build succeeds cleanly, (2) No broken links (no new pages/routes), (3) No new pages requiring accessibility checklist, (4) No server-side code, (5) Dist size impact minimal (single button + state reset logic ~2KB estimated).

**Constitution Compliance**: ✅ **ALL GATES PASS** - No violations. No complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/           # React components
│   ├── DeckControls.tsx    # [MODIFY] Add reset button here
│   ├── HandView.tsx        # Display components (no changes expected)
│   └── PileCounts.tsx      # Display components (no changes expected)
├── hooks/
│   └── useDeckState.ts     # [MODIFY] Add reset action handler
├── lib/
│   ├── constants.ts        # Deck constants (no changes expected)
│   ├── shuffle.ts          # [REUSE] Existing Fisher-Yates algorithm
│   └── types.ts            # [MODIFY] Add RESET action type
├── state/
│   └── deckReducer.ts      # [MODIFY] Add RESET case, shuffle on INIT
└── App.tsx               # Root component (minimal changes)

tests/
├── contract/             # [ADD] Reset contract tests
├── integration/          # [ADD] Reset flow integration tests
└── unit/                # [ADD] Reset button and reducer tests
```

**Structure Decision**: Single project structure (Option 1) maintained. This is a client-side only feature adding reset functionality to existing state management. No backend, no new architectural layers. Changes focused on:
1. DeckControls component (add button)
2. deckReducer (add RESET action, modify INIT to shuffle)
3. useDeckState hook (dispatch reset action)
4. Test coverage for new functionality

## Complexity Tracking

**No violations detected** - Constitution gates all pass. No complexity tracking required.
