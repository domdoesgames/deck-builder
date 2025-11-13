# Implementation Plan: Deck Mechanics

**Branch**: `001-deck-mechanics` | **Date**: 2025-11-12 | **Spec**: specs/001-deck-mechanics/spec.md
**Input**: Feature specification from `/specs/001-deck-mechanics/spec.md`

## Summary

Implement client-side deck cycling system with configurable hand size & discard count, JSON deck override (duplicates allowed, empty override reverts to default with warning), immediate reset on mid-turn parameter/deck changes, static responsive UI (React + lightweight CSS library) adhering to constitution (static build, deterministic output, accessibility baseline).

## Technical Context

**Language/Version**: TypeScript (ES2022 target)  
**Primary Dependencies**: React 18.x, Pico.css (lightweight semantic CSS library)  
**Storage**: N/A (in-memory state only)  
**Testing**: Jest + React Testing Library  
**Target Platform**: Modern browsers (last 2 versions Chrome/Firefox/Safari), mobile Safari iOS 15+, mobile Chrome 110+  
**Project Type**: web (single-page React app)  
**Performance Goals**: First meaningful paint <2s on Fast 3G, interaction (End Turn) state update <150ms, JSON override operations <2s  
**Constraints**: Pure static build (Vite bundler), no runtime network calls, bundle <150KB gzipped initial load  
**Scale/Scope**: Single feature demo, expected users <100 concurrently (no backend)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Principle I (Static Asset Simplicity): PASS (React + Pico.css compiled to static assets; no server).  
Principle II (Deterministic Build): PASS if single build command `npm run build` using Vite bundler.  
Principle III (Content Integrity & Accessibility): PASS (text-only cards, semantic landmarks, Pico.css accessibility defaults, manual checklist to be added in PR).  
Operational Constraints: PASS (HTTPS hosting assumed; atomic deploy unaffected).  
Workflow Gates: PASS contingent on adding manual accessibility & link checklist in PR.  
Dist growth >20% justification: Initial baseline to be recorded after first build via manual gzip measurement.  

Gate Status: PASS. All clarifications resolved in research.md.

### Post-Design Recheck
Principle I: PASS (confirmed React SPA builds static via Vite).
Principle II: PASS (single command `npm run build` deterministic; no env branching).
Principle III: PASS (text-only cards, semantic landmarks planned, Pico.css accessibility defaults, manual checklist to be added in PR).
Dist Size Tracking: Baseline will be recorded after initial build; under 150KB target.
No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-deck-mechanics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md  (Phase 2 via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── DeckControls.tsx
│   ├── HandView.tsx
│   ├── PileCounts.tsx
│   ├── JsonOverride.tsx
│   └── WarningBanner.tsx
├── hooks/
│   └── useDeckState.ts
├── lib/
│   ├── shuffle.ts
│   ├── types.ts
│   └── constants.ts
├── state/
│   └── deckReducer.ts
├── styles/ (lightweight CSS framework integration + overrides)
│   └── index.css
├── App.tsx
└── main.tsx

tests/
├── unit/
│   ├── shuffle.test.ts
│   ├── deckReducer.test.ts
│   └── useDeckState.test.ts
├── integration/
│   ├── turnCycle.test.tsx
│   ├── jsonOverride.test.tsx
│   └── parameterChangeReset.test.tsx
└── contract/
    └── deckContracts.test.ts (hand size, reshuffle, empty override revert)
```

**Structure Decision**: Single web SPA with modular separation (components, hooks, pure logic libs). No backend directory to comply with static-only principle.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (None) | N/A | N/A |
