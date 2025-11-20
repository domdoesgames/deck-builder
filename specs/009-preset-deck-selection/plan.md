# Implementation Plan: Preset Deck Selection

**Branch**: `009-preset-deck-selection` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-preset-deck-selection/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to select from a curated list of pre-configured decks managed within the codebase, displayed in the existing settings panel. Users can view preset deck details, select a deck to play with, and have their selection persisted across browser sessions. The feature integrates with existing JSON override functionality and includes build-time validation to ensure all preset decks are valid before deployment.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (target ES2022)  
**Primary Dependencies**: React 18.2.0, @picocss/pico 1.5.0, Vite 5.0.8  
**Storage**: Browser localStorage (with silent fallback to session-only state on failure)  
**Testing**: Jest 29.7.0 + React Testing Library 14.1.2, ESLint 8.56.0  
**Target Platform**: Static web application (client-side only, no server runtime)  
**Project Type**: Single-page application (SPA) - frontend only  
**Performance Goals**: <100ms response time for preset deck selection and loading, <2s first meaningful paint (per constitution)  
**Constraints**: Static site only (no backend/database), must work offline after initial load, reproducible builds via `npm run build`  
**Scale/Scope**: Initial: 1 preset deck, extensible to ~10-20 preset decks without performance degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I - Static Asset Simplicity**: ✅ PASS
- Preset deck data will be defined in TypeScript/JavaScript modules (code-managed)
- No server-side runtime, database, or external API calls
- Client-side rendering only using React components
- Continues to be a purely static site

**Principle II - Deterministic Build & Reproducible Output**: ✅ PASS
- Single `npm run build` command produces complete deployable artifact
- Preset deck definitions are compile-time constants (no external file loading)
- Build-time validation script will verify preset deck validity during CI/CD
- No runtime network calls or environment-dependent branching

**Principle III - Content Integrity & Accessibility Baseline**: ✅ PASS
- New preset deck selection UI will use semantic HTML within existing settings panel
- Expandable/collapsible sections will use proper ARIA attributes (aria-expanded, role="region")
- Clear visual indication of active preset deck (accessible color contrasts per WCAG AA)
- All interactive elements will have keyboard navigation support
- No images expected (text-based preset deck display), but will follow alt-text patterns if needed

## Project Structure

### Documentation (this feature)

```text
specs/009-preset-deck-selection/
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
├── components/
│   ├── SettingsPanel.tsx          # Existing - will extend to include PresetDeckSelector
│   ├── SettingsPanel.css          # Existing - may need style additions
│   ├── PresetDeckSelector.tsx     # NEW - preset deck list UI component
│   └── PresetDeckSelector.css     # NEW - preset deck selector styles
├── hooks/
│   ├── useDeckState.ts            # Existing - will add loadPresetDeck() action
│   └── usePresetDeckSelection.ts  # NEW - manages preset deck selection & persistence
├── lib/
│   ├── types.ts                   # Existing - will add PresetDeck interface
│   ├── presetDecks.ts             # NEW - preset deck definitions (code-managed data)
│   └── presetDeckValidator.ts     # NEW - runtime validation for preset decks
├── state/
│   └── deckReducer.ts             # Existing - will add LOAD_PRESET_DECK action
└── App.tsx                        # Existing - no changes expected

tests/
├── contract/
│   └── presetDeckContracts.test.ts    # NEW - contract tests for preset deck feature
├── integration/
│   ├── presetDeckSelection.test.tsx   # NEW - user flow integration tests
│   └── presetDeckPersistence.test.tsx # NEW - localStorage persistence tests
└── unit/
    ├── presetDecks.test.ts            # NEW - preset deck data validation tests
    ├── presetDeckValidator.test.ts    # NEW - validator logic tests
    ├── PresetDeckSelector.test.tsx    # NEW - component behavior tests
    └── usePresetDeckSelection.test.ts # NEW - hook behavior tests

.github/
└── workflows/
    └── deploy.yml                 # Existing - will add preset deck validation step
```

**Structure Decision**: Single project structure (Option 1). This is a client-side only React application with no backend. The feature adds new components and hooks to the existing `src/` structure, following the established patterns:
- Components in `src/components/` with co-located CSS
- Business logic hooks in `src/hooks/`
- Shared types and utilities in `src/lib/`
- State management in `src/state/`
- Three-tier testing (contract/integration/unit) in `tests/`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations detected. This feature maintains the static site architecture, uses deterministic builds, and follows accessibility guidelines.
