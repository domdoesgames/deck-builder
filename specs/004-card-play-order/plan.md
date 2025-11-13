# Implementation Plan: Card Play Order

**Branch**: `004-card-play-order` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-card-play-order/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Allow users to select a play order for remaining cards after discard, lock the sequence to prevent changes, and display the locked order for sharing with another player. This feature extends the existing discard mechanic (Feature 003) by adding a "Planning" phase where users arrange cards sequentially, followed by an "Executing" phase after locking the order.

## Technical Context

**Language/Version**: TypeScript 5.3.3, ES2022 target  
**Primary Dependencies**: React 18.2.0, Vite 5.0.8, @picocss/pico 1.5.0  
**Storage**: localStorage (with silent fallback to in-memory on failure)  
**Testing**: Jest 29.7.0, @testing-library/react 14.1.2  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Single-page web application (static site)  
**Performance Goals**: 
- Card selection response <100ms (FR-003, SC-003)
- First meaningful paint <2s on Fast 3G (constitution requirement)
- Play order assignment: 5 cards in 15s, 10 cards in 30s (SC-001)

**Constraints**: 
- Must remain purely static (no server-side runtime per Constitution Principle I)
- Maximum 10 cards in hand (A5 clarification)
- Mouse, keyboard (Tab/Space/Enter), and touch (tap) interaction support (FR-014, FR-015)
- Persistence failures must not block functionality (FR-020)

**Scale/Scope**: 
- Single user, local state management
- Extension of existing 3 features (001: deck mechanics, 002: hand display, 003: discard)
- 3 new state fields, 4 new actions, 1 new UI component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I - Static Asset Simplicity**: ✅ PASS
- Feature adds client-side state management only (playOrder, playOrderLocked, planningPhase)
- localStorage persistence with silent fallback maintains static nature
- No server-side runtime, databases, or build complexity introduced

**Principle II - Deterministic Build & Reproducible Output**: ✅ PASS
- No changes to build process (`npm run build` continues to work)
- No new network calls or environment dependencies
- Feature code is purely TypeScript/React, bundled by existing Vite setup

**Principle III - Content Integrity & Accessibility Baseline**: ⚠️ REQUIRES ATTENTION
- New UI elements must include proper ARIA labels for play order sequence numbers
- Keyboard navigation (Tab/Space/Enter per FR-014) must be tested
- Touch interactions (FR-015) must work without complex gestures
- Locked state visual indicators must meet WCAG AA contrast requirements
- **Action items**: Add accessibility checklist for Play Order UI in contract testing

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

## Project Structure

### Documentation (this feature)

```text
specs/004-card-play-order/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── play-order-state.contract.md
│   └── play-order-ui.contract.md
├── checklists/
│   └── requirements.md  # Already exists (validation complete)
└── spec.md              # Already exists (clarifications complete)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── HandView.tsx           # MODIFY: Add play order selection UI
│   ├── HandView.css           # MODIFY: Add play order styling
│   ├── DeckControls.tsx       # MODIFY: Add "Lock Order" and "Clear Order" buttons
│   └── [existing components]
├── hooks/
│   └── useDeckState.ts        # MODIFY: Expose play order actions
├── lib/
│   ├── types.ts               # MODIFY: Add PlayOrderPhase, extend DeckState
│   └── [existing libs]
├── state/
│   └── deckReducer.ts         # MODIFY: Add 4 new actions (SELECT_PLAY_ORDER, DESELECT_PLAY_ORDER, LOCK_PLAY_ORDER, CLEAR_PLAY_ORDER)
└── [existing structure]

tests/
├── contract/
│   ├── playOrderContracts.test.ts    # NEW: Contract validation
│   └── [existing contract tests]
├── integration/
│   ├── playOrderFlow.test.tsx        # NEW: Full user flow testing
│   └── [existing integration tests]
└── unit/
    ├── playOrderReducer.test.ts      # NEW: Reducer logic testing
    └── [existing unit tests]
```

**Structure Decision**: Single project structure (Option 1) - This project is a client-side only prototype with all source in `src/` and tests in `tests/`. Feature 004 extends existing state management (DeckState/deckReducer) and UI components (HandView, DeckControls) without requiring new architectural patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
