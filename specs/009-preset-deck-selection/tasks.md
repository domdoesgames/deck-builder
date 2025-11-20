# Tasks: Preset Deck Selection

**Feature ID**: 009-preset-deck-selection  
**Branch**: `009-preset-deck-selection`  
**Status**: Ready for Implementation

---

## Task Summary

| Phase | Task Count | Estimated Effort | Blocking |
|-------|-----------|------------------|----------|
| Phase 1: Setup | 5 | 2-3 hours | Yes (all stories) |
| Phase 2: Foundational | 9 | 4-5 hours | Yes (all stories) |
| Phase 3: User Story 1 (P1) | 7 | 3-4 hours | No |
| Phase 4: User Story 2 (P2) | 4 | 2-3 hours | No |
| Phase 5: User Story 3 (P3) | 5 | 2-3 hours | No |
| Phase 6: Build-Time Validation | 3 | 1-2 hours | No |
| Phase 7: Polish | 4 | 2-3 hours | No |
| **Total** | **37** | **16-23 hours** | - |

---

## Dependencies

### Internal Dependencies
- **Phase 2 blocks all user stories**: Foundation must be complete before any UI work
- **Phase 3 (US1) is prerequisite for Phase 4 & 5**: Component must exist before adding features
- **Phase 6 can run parallel** to Phases 4-5 once Phase 3 is complete

### External Dependencies
- None (all dependencies already in project)

### Critical Path
Phase 1 → Phase 2 → Phase 3 (US1) → [Phase 4 (US2) || Phase 5 (US3) || Phase 6] → Phase 7

---

## Phase 1: Setup
**Goal**: Create type definitions, data structures, and module scaffolding  
**Blocking**: All user stories  
**Estimated Time**: 2-3 hours

- [X] T001 [P] Create `PresetDeck` type in `src/lib/types.ts`
- [X] T002 [P] Create `DeckSource` type in `src/lib/types.ts`
- [X] T003 Create `src/lib/presetDecks.ts` with starter deck constant
- [X] T004 [P] Create `src/lib/presetDeckValidator.ts` stub
- [X] T005 [P] Create `src/components/PresetDeckSelector.tsx` stub

**Acceptance Criteria**:
- All type definitions compile without errors
- Starter deck passes TypeScript type checking
- Module structure matches contracts

---

## Phase 2: Foundational (State & Persistence)
**Goal**: Extend state management to support preset decks  
**Blocking**: All user stories (US1, US2, US3)  
**Estimated Time**: 4-5 hours

### State Extension
- [X] T006 [US-Foundation] Add `deckSource` property to `DeckState` in `src/lib/types.ts`
- [X] T007 [US-Foundation] Add `selectedPresetId` property to `DeckState` in `src/lib/types.ts`
- [X] T008 [US-Foundation] Add `LOAD_PRESET_DECK` action type to `src/state/deckReducer.ts`

### Reducer Logic
- [X] T009 [US-Foundation] Implement `LOAD_PRESET_DECK` handler in `src/state/deckReducer.ts`
- [X] T010 [US-Foundation] Update reducer to set `deckSource` for all deck-modifying actions

### Persistence Extension
- [X] T011 [US-Foundation] Add `savePresetSelection()` function to `src/lib/persistenceManager.ts`
- [X] T012 [US-Foundation] Add `loadPresetSelection()` function to `src/lib/persistenceManager.ts`
- [X] T013 [US-Foundation] Add `clearPresetSelection()` function to `src/lib/persistenceManager.ts`

### Hook Extension
- [X] T014 [US-Foundation] Update `useDeckState` lazy initializer to call `loadPresetSelection()` in `src/hooks/useDeckState.ts`

**Acceptance Criteria**:
- All reducer actions handle `deckSource` correctly
- Persistence functions serialize/deserialize preset ID
- Hook initializes with saved preset if available
- All tests in `tests/unit/deckReducer.test.ts` pass

---

## Phase 3: User Story 1 - Select Preset Deck (P1) 🎯 MVP
**Goal**: Users can select a preset deck from a list and load it into the game  
**Priority**: P1 (Must Have)  
**Estimated Time**: 3-4 hours

### Implementation
- [X] T015 [P] [US1] Implement preset deck validator with 6 rules in `src/lib/presetDeckValidator.ts`
- [X] T016 [US1] Implement `PresetDeckSelector` component UI in `src/components/PresetDeckSelector.tsx`
- [X] T017 [US1] Add preset list rendering with radio selection in `PresetDeckSelector`
- [X] T018 [US1] Implement "Load Selected Deck" button handler in `PresetDeckSelector`
- [X] T019 [US1] Integrate `PresetDeckSelector` into `SettingsPanel` in `src/components/SettingsPanel.tsx`

### Testing
- [X] T020 [P] [US1] Create contract tests in `tests/contract/presetDeckContracts.test.ts`
- [X] T021 [US1] Create integration test for preset deck selection flow in `tests/integration/presetDeckSelection.test.tsx`

**Acceptance Criteria** (from spec.md):
- Settings panel displays list of available preset decks
- User can select a preset deck via radio button
- "Load Selected Deck" button triggers deck load
- Selected preset replaces current deck state
- Deck is marked as `deckSource: 'preset'`
- Selected preset ID is persisted across sessions
- Invalid/corrupted presets are filtered out (runtime validation)

---

## Phase 4: User Story 2 - View Deck Details (P2)
**Goal**: Users can expand/collapse deck details to view card composition  
**Priority**: P2 (Should Have)  
**Estimated Time**: 2-3 hours

### Implementation
- [X] T022 [US2] Add expand/collapse state management to `PresetDeckSelector`
- [X] T023 [US2] Implement expandable section UI with card composition display
- [X] T024 [US2] Add CSS styling for expand/collapse animations in `src/components/SettingsPanel.css`

### Testing
- [X] T025 [US2] Add component interaction tests for expand/collapse in `tests/integration/presetDeckSelection.test.tsx`

**Acceptance Criteria** (from spec.md):
- Each preset deck has an expand/collapse control (e.g., chevron icon)
- Clicking expands/collapses the details section
- Details section shows card composition (e.g., "3x Attack, 2x Defense")
- Only one deck details section can be expanded at a time
- Expand/collapse does not affect deck selection

---

## Phase 5: User Story 3 - Switch Between Modes (P3)
**Goal**: Users can switch between preset, custom, and default deck modes  
**Priority**: P3 (Could Have)  
**Estimated Time**: 2-3 hours

### Implementation
- [X] T026 [US3] Add "Start Custom Deck" button to `SettingsPanel` UI
- [X] T027 [US3] Implement custom deck handler that transitions to `deckSource: 'custom'`
- [X] T028 [US3] Add visual indicators for current deck source mode in `SettingsPanel`
- [X] T029 [US3] Update `JsonOverride` component to set `deckSource: 'custom'` on load

### Testing
- [X] T030 [US3] Add mode switching validation tests in `tests/integration/presetDeckSelection.test.tsx`

**Acceptance Criteria** (from spec.md):
- "Start Custom Deck" button clears preset selection and sets `deckSource: 'custom'`
- JSON override sets `deckSource: 'custom'` when loaded
- Clear visual distinction between preset/custom/default modes
- Mode transitions persist across page reloads
- Mode switching does not break existing deck state

---

## Phase 6: Build-Time Validation
**Goal**: Validate preset decks at build time to catch errors early  
**Priority**: P2 (Should Have)  
**Estimated Time**: 1-2 hours

- [X] T031 [P] Create validation script in `scripts/validate-presets.ts`
- [X] T032 Update `package.json` with `validate:presets` script
- [X] T033 Add validation step to `.github/workflows/deploy.yml`

**Acceptance Criteria**:
- Script validates all preset decks against 6 rules from contract
- Script exits with error code if validation fails
- CI pipeline blocks deployment on validation failure
- npm scripts include `npm run validate:presets`

---

## Phase 7: Polish & Documentation
**Goal**: Accessibility, responsive design, performance optimization, documentation  
**Priority**: P3 (Could Have)  
**Estimated Time**: 2-3 hours

- [X] T034 [P] Add ARIA labels and keyboard navigation to `PresetDeckSelector`
- [X] T035 [P] Test responsive design on mobile viewports (320px-768px)
- [X] T036 Update README.md with preset deck selection feature
- [X] T037 Add inline code comments for complex validation logic

**Acceptance Criteria**:
- Component is fully keyboard accessible
- Screen reader announces preset deck names and selection state
- UI is responsive on mobile devices
- Documentation includes adding new preset decks

---

## Execution Strategy

### Recommended Approach
1. **Sequential Foundation** (Phases 1-2): Must complete in order, no parallelization
2. **Parallel Feature Development** (Phases 3-6):
   - Phase 3 (US1) → complete first (MVP)
   - Phase 4 (US2) + Phase 5 (US3) + Phase 6 → can run in parallel after Phase 3
3. **Final Polish** (Phase 7): Run after all features complete

### Parallel Opportunities
- **T001, T002** (type definitions) can be done simultaneously
- **T004, T005** (module stubs) can be done simultaneously
- **T015, T020** (validator implementation + tests) can be done simultaneously
- **T031, T032** (validation script) can be done while US2/US3 are in progress
- **T034, T035** (accessibility + responsive) can be done simultaneously

### Testing Strategy
- **Unit tests**: Run after each foundational module (T010, T014)
- **Contract tests**: Run after Phase 2 complete (T020)
- **Integration tests**: Run after each user story (T021, T025, T030)
- **CI validation**: Add after T033 complete

---

## Risk Mitigation

### High-Risk Tasks
- **T009** (LOAD_PRESET_DECK handler): Complex state transformation, requires careful testing
- **T014** (lazy initializer): Async loading + race conditions, needs error handling
- **T015** (validator): 6 validation rules, must handle edge cases

### Mitigation Strategies
- Write tests before implementation for T009, T014, T015
- Use quickstart.md integration examples as test cases
- Add extensive error logging during development
- Manual testing with corrupted localStorage data

---

## Notes

### Constitution Compliance
- ✅ Passes all 8 constitution checks (see `plan.md`)
- No breaking changes to existing functionality
- Maintains existing JSON override behavior

### Technology Decisions (from research.md)
1. **Preset decks as TypeScript constants** (not external files)
2. **New `LOAD_PRESET_DECK` action** (not reusing JSON override path)
3. **Dual persistence** (full state + standalone preset ID)
4. **Build-time + runtime validation** (two-layer approach)
5. **Runtime filters invalid presets** (graceful degradation)

### Key Files Modified
- `src/lib/types.ts` (T001, T002, T006, T007)
- `src/state/deckReducer.ts` (T008, T009, T010)
- `src/lib/persistenceManager.ts` (T011, T012, T013)
- `src/hooks/useDeckState.ts` (T014)
- `src/components/SettingsPanel.tsx` (T019, T026, T028)

### New Files Created
- `src/lib/presetDecks.ts` (T003)
- `src/lib/presetDeckValidator.ts` (T004, T015)
- `src/components/PresetDeckSelector.tsx` (T005, T016-T018, T022-T023)
- `scripts/validate-presets.ts` (T031)
- `tests/contract/presetDeckContracts.test.ts` (T020)
- `tests/integration/presetDeckSelection.test.tsx` (T021, T025, T030)

---

**Last Updated**: 2025-11-19  
**Generated By**: /speckit.tasks workflow  
**Ready for**: Implementation (Phase 1 → Phase 2 → Phase 3)
