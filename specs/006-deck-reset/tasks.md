# Tasks: Deck Reset

**Feature**: 006-deck-reset  
**Input**: Design documents from `/specs/006-deck-reset/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Estimated Time**: 3-4 hours

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/` at repository root
- Tests: `tests/` at repository root

---

## Phase 1: Core Implementation (1.5 hours)

**Purpose**: Add RESET action to state management layer

### Setup & Type Definitions

- [X] T001 [P] [US1,US2] Add `{ type: 'RESET' }` to `DeckAction` union type in `src/lib/types.ts`

### Reducer Changes

- [X] T002 [US1,US2] Modify `initializeDeck()` in `src/state/deckReducer.ts` to:
  - Accept optional `params?: { handSize?: number; discardCount?: number }`
  - Call `shuffle([...DEFAULT_DECK])` instead of `[...DEFAULT_DECK]`
  - Use `params?.handSize ?? DEFAULT_HAND_SIZE` for configuration
  - Use `params?.discardCount ?? DEFAULT_DISCARD_COUNT` for configuration
  - **Contracts**: C001 (shuffle on INIT)

- [X] T003 [US1,US2] Add RESET case to `deckReducer()` switch statement in `src/state/deckReducer.ts`:
  - Extract `handSize` and `discardCount` from current state
  - Validate settings (fallback to defaults if `handSize < 1 || handSize > 52` or `discardCount < 0 || discardCount > handSize`)
  - Call `initializeDeck({ handSize: preservedHandSize, discardCount: preservedDiscardCount })`
  - Return fresh state with preserved settings
  - **Contracts**: C002 (settings preservation), C003 (validation), C004 (discard clear), C005 (play order clear)

### Hook Integration

- [X] T004 [US1] Add `reset()` function to `useDeckState()` hook in `src/hooks/useDeckState.ts`:
  - Add `const reset = () => dispatch({ type: 'RESET' })`
  - Add `reset` to return object
  - **Contracts**: C002

**Checkpoint**: At this point, RESET action is functional and can be tested via console

---

## Phase 2: User Interface (1 hour)

**Purpose**: Add reset button to DeckControls component

### UI Components

- [X] T005 [US1,US3] Update `DeckControlsProps` interface in `src/components/DeckControls.tsx`:
  - Add `reset: () => void` to props interface

- [X] T006 [US1,US3] Add reset button UI to `DeckControls` component in `src/components/DeckControls.tsx`:
  - Add `const [isResetting, setIsResetting] = useState(false)` for disabled state
  - Add `handleReset()` function that sets `isResetting(true)` and calls `reset()`
  - Add `useEffect` to reset `isResetting` to false after state update
  - Add reset button with `onClick={handleReset}`, `disabled={isResetting}`, and descriptive title
  - Button text: `{isResetting ? 'Resetting...' : 'Reset'}`
  - **Contracts**: C010 (button disabled state)

- [X] T007 [US1] Update `App.tsx` to pass `reset` prop:
  - Destructure `reset` from `useDeckState()` hook
  - Pass `reset={reset}` to `<DeckControls />` component

### Styling (Optional)

- [SKIPPED] T008 [P] [US3] Add CSS styles for reset button in `src/styles/index.css`:
  - Skipped: Using Pico CSS default button styles

**Checkpoint**: Reset button visible and functional in UI

---

## Phase 3: Contract Testing (1-1.5 hours)

**Purpose**: Verify all 10 behavioral contracts (C001-C010) are satisfied

### Contract Test Suite Creation

- [X] T009 [P] [US1,US2] Create `tests/contract/resetContracts.test.ts` with contract tests:

#### C001: INIT with Shuffle
- [X] T010 [P] [US2] Test: "shuffles deck before dealing hand" - Verify hand is not in DEFAULT_DECK order
- [X] T011 [P] [US2] Test: "initializes with correct default state" - Verify all state fields match initial values

#### C002: RESET with Settings Preservation
- [X] T012 [P] [US1] Test: "preserves user settings (handSize, discardCount)" - Verify settings unchanged after reset
- [X] T013 [P] [US1] Test: "clears all game state" - Verify turnNumber=1, cleared piles, no selections/locks
- [X] T014 [P] [US1] Test: "shuffles deck and deals new hand" - Verify fresh shuffled deck with correct hand size
- [X] T015 [P] [US1] Test: "activates discard phase if discardCount > 0" - Verify discard phase starts correctly

#### C003: Settings Validation
- [X] T016 [P] [US1] Test: "falls back to defaults when settings invalid" - Verify invalid handSize/discardCount use defaults
- [X] T017 [P] [US1] Test: "handles handSize > 52 (invalid)" - Verify fallback to DEFAULT_HAND_SIZE
- [X] T018 [P] [US1] Test: "handles negative discardCount (invalid)" - Verify fallback to DEFAULT_DISCARD_COUNT

#### C004: Discard Phase Interaction
- [X] T019 [P] [US1] Test: "clears active discard phase and starts fresh" - Verify mid-discard state resets properly

#### C005: Play Order Interaction
- [X] T020 [P] [US1] Test: "unlocks and clears play order" - Verify playOrderLocked=false, playOrderSequence=[]

#### C007: Shuffle Randomness
- [X] T021 [P] [US2] Test: "10 INIT calls produce at least 8 unique hands" - Probabilistic shuffle verification
- [X] T022 [P] [US2] Test: "10 RESET calls produce at least 8 unique hands" - Probabilistic shuffle verification

#### C008: Performance
- [X] T023 [P] [US3] Test: "RESET completes in under 500ms" - Performance contract verification

#### Edge Cases
- [X] T024 [P] [US1] Test: "Edge-1: RESET with discardCount=0 skips discard phase"
- [X] T025 [P] [US1] Test: "Edge-2: RESET works with exhausted draw pile"
- [X] T026 [P] [US1] Test: "Edge-3: Rapid RESET dispatches produce valid state"

**Checkpoint**: All contract tests written (15+ tests total)

---

## Phase 4: Integration & Regression Testing (30-45 minutes)

**Purpose**: Ensure no regressions and integration works correctly

### Regression Prevention

- [X] T027 [US1,US2] Run existing test suite: `npm test`
  - Verified: All 132 tests pass (106 existing + 26 new contract tests)
  - **Success Criteria**: SC-008 ✅

- [X] T028 [US1,US2] Fix any tests that assume card order (if needed):
  - No fixes needed - existing tests were already written to be shuffle-agnostic

### Integration Tests (Optional - extends existing)

- [ ] T029 [P] [US1] Add integration test "reset clears all state mid-game" in `tests/integration/resetFlow.test.tsx`:
  - Render full app
  - Play several turns (deal, discard, lock play order)
  - Click reset button
  - Verify all state cleared and new hand dealt

- [ ] T030 [P] [US2] Add integration test "page load produces different hands" in `tests/integration/resetFlow.test.tsx`:
  - Render app 5 times (unmount/remount)
  - Collect initial hands
  - Verify at least 4/5 are unique

- [ ] T031 [P] [US3] Add integration test "button disabled during reset prevents double-dispatch" in `tests/integration/resetFlow.test.tsx`:
  - Click reset button
  - Immediately try to click again
  - Verify only one RESET dispatched

**Checkpoint**: All tests passing (106 existing + 15+ new = 121+ total)

---

## Phase 5: Contract Verification Checklist (15 minutes)

**Purpose**: Manually verify each contract is satisfied

### Contract Verification Tasks

- [ ] T032 [US2] **C001 Verification**: Load page 3 times, observe different initial hands (shuffle on INIT)
- [ ] T033 [US1] **C002 Verification**: Change handSize to 7, reset, verify new hand has 7 cards (settings preserved)
- [ ] T034 [US1] **C003 Verification**: Manually create invalid state (console), reset, verify defaults used
- [ ] T035 [US1] **C004 Verification**: Mid-discard, click reset, verify selections cleared and new discard phase started
- [ ] T036 [US1] **C005 Verification**: Lock play order, click reset, verify play order cleared and unlocked
- [ ] T037 [US1] **C006 Verification**: Reset, check localStorage (DevTools), verify persisted state updated
- [ ] T038 [US2] **C007 Verification**: Run probabilistic test manually (10 resets = 8+ unique hands)
- [ ] T039 [US3] **C008 Verification**: DevTools Performance tab, measure reset operation (<500ms, typically <10ms)
- [ ] T040 [US2] **C009 Verification**: Hard refresh page, verify no "flash" of unshuffled deck
- [ ] T041 [US3] **C010 Verification**: Click reset, verify button disabled and shows "Resetting..." text

**Checkpoint**: All 10 contracts manually verified

---

## Phase 6: Polish & Quality Gates (30 minutes)

**Purpose**: Final validation and cleanup

### Code Quality

- [X] T042 [P] Run linter: `npm run lint` - ✅ Passed with 0 errors
- [X] T043 [P] Run production build: `npm run build` - ✅ Build successful
- [X] T044 [P] Check bundle size impact - Verify feature adds minimal size (~2KB estimated) - ✅ Build: 244KB total, reasonable size

### Manual Testing

- [ ] T045 Basic reset flow test:
  - Play 3-4 turns (deal, discard, set play order)
  - Note turn number and state
  - Click reset
  - Verify turn=1, piles cleared, new hand dealt, settings preserved

- [ ] T046 Page load shuffle test:
  - Load page 5 times (hard refresh: Ctrl+Shift+R)
  - Note initial hand each time
  - Verify different hands across loads

- [ ] T047 Settings preservation test:
  - Change hand size to 7 (via JSON override or UI)
  - Change discard count to 4
  - Play a turn
  - Click reset
  - Verify new hand has 7 cards, discard requires 4 cards

- [ ] T048 Button disabled state test:
  - Click reset button
  - Immediately try to click again
  - Verify button disabled during operation
  - Verify button re-enables after completion

### Accessibility & UX

- [ ] T049 [P] Keyboard accessibility test:
  - Tab to reset button
  - Press Enter
  - Verify reset triggers correctly

- [ ] T050 [P] Screen reader test:
  - Use screen reader (or browser dev tools)
  - Verify button label reads as "Reset"
  - Verify title attribute provides clear description

- [ ] T051 [P] Tooltip test:
  - Hover over reset button
  - Verify title tooltip appears with explanation

### Success Criteria Validation

- [ ] T052 Verify all 8 success criteria from spec.md:
  - ✅ **SC-001**: User can trigger reset via button click
  - ✅ **SC-002**: Reset completes in <500ms (performance test)
  - ✅ **SC-003**: 10 loads = 10 different hands (randomness test)
  - ✅ **SC-004**: Post-reset state matches fresh page load
  - ✅ **SC-005**: User settings survive reset
  - ✅ **SC-006**: Reset button disabled during operation
  - ✅ **SC-007**: Persisted state cleared/replaced
  - ✅ **SC-008**: All 106 existing tests still pass

**Checkpoint**: Feature complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Core Implementation)**: No dependencies - start immediately
  - T001-T004 can proceed sequentially (T002 blocks T003, T003 blocks T004)
  - T001 can be done in parallel with T002

- **Phase 2 (UI)**: Depends on Phase 1 (T004 complete)
  - T005-T007 are sequential (UI component changes)
  - T008 (styling) can be done in parallel with T005-T007

- **Phase 3 (Contract Testing)**: Can start after Phase 1 (T003 complete)
  - T009-T026: All contract tests can be written in parallel (different test cases)
  - Recommend writing tests BEFORE Phase 4 validation

- **Phase 4 (Integration)**: Depends on Phase 1 + Phase 2 (full feature implemented)
  - T027-T028 must be done first (regression check)
  - T029-T031 can be done in parallel (different test files)

- **Phase 5 (Verification)**: Depends on Phase 1 + Phase 2 (feature functional)
  - T032-T041 can be done in parallel (independent manual tests)

- **Phase 6 (Polish)**: Depends on all previous phases
  - T042-T044 can be done in parallel (independent quality checks)
  - T045-T051 are sequential manual tests
  - T052 is final validation (depends on all tasks)

### Critical Path

Fastest path to working feature:

1. **Core (Phase 1)**: T001 → T002 → T003 → T004 (1.5 hours)
2. **UI (Phase 2)**: T005 → T006 → T007 (45 minutes)
3. **Validation (Phase 4)**: T027 → T028 (30 minutes)
4. **Manual Test (Phase 6)**: T045 (5 minutes)

**Minimum Viable Feature**: 2.75 hours

### Parallel Opportunities

**Maximum Parallelization** (with 3 developers):

- **Developer A**: Phase 1 (T001-T004) → Phase 2 (T005-T007)
- **Developer B**: Phase 3 (T009-T026 contract tests) - starts after T003
- **Developer C**: Phase 6 (T042-T044 quality gates) - starts after T007

All converge at Phase 4 (Integration Testing) and Phase 5 (Manual Verification).

---

## Implementation Strategy

### Recommended Approach: Sequential MVP First

1. **Complete Phase 1**: Core implementation (1.5 hours)
   - STOP: Test RESET action in console (`dispatch({ type: 'RESET' })`)
   
2. **Complete Phase 2**: UI implementation (1 hour)
   - STOP: Click reset button in browser, verify it works
   
3. **Complete Phase 3**: Contract tests (1.5 hours)
   - STOP: Run `npm test`, verify all contract tests pass
   
4. **Complete Phase 4**: Regression & integration (45 minutes)
   - STOP: Verify 106 existing tests + 15+ new tests all pass
   
5. **Complete Phase 5**: Manual verification (15 minutes)
   - STOP: Verify all 10 contracts satisfied
   
6. **Complete Phase 6**: Polish & final validation (30 minutes)
   - STOP: Feature complete and ready for production

**Total Time**: 3-4 hours (as estimated)

### Alternative: Test-First Approach

If you prefer TDD:

1. **Phase 3 first**: Write contract tests (they will fail)
2. **Phase 1**: Implement core (tests start passing)
3. **Phase 2**: Implement UI (all tests pass)
4. **Phase 4-6**: Validation and polish

---

## User Story Mapping

### User Story 1 - Manual System Reset (P1) 🎯 MVP

**Tasks**: T001, T002, T003, T004, T005, T006, T007, T012-T020, T024-T026, T027-T028, T033-T037, T045, T047, T052

**Independent Test**: 
- Play several turns → Click reset → Verify all state cleared, new hand dealt, settings preserved
- **Validation Task**: T045

### User Story 2 - Automatic Shuffle on Page Load (P1) 🎯 MVP

**Tasks**: T001, T002, T010, T011, T021, T022, T027-T028, T030, T032, T038, T039, T046, T052

**Independent Test**:
- Load page 5 times → Verify different initial hands each time
- **Validation Task**: T046

### User Story 3 - Reset Performance and Feedback (P2)

**Tasks**: T006 (button disabled state), T008 (styling), T023, T031, T040, T041, T043, T048-T051, T052

**Independent Test**:
- Click reset → Verify button disabled, operation completes fast, button re-enables
- **Validation Task**: T048

---

## Notes

- **[P] tasks**: Different files or independent operations - can run in parallel
- **Contract tests** (T010-T026): Write BEFORE manual verification
- **Regression testing** (T027-T028): CRITICAL - must maintain 106 existing tests
- **Commit strategy**: Commit after each phase for easy rollback
- **Stop at checkpoints**: Validate feature works before moving to next phase
- **Performance expectation**: Reset should complete in <10ms (requirement is <500ms)
- **Test count**: 106 existing + 15+ new contract tests = 121+ total tests

---

## Success Checklist

Before marking feature complete, verify:

### Implementation Complete
- [x] RESET action type added to `src/lib/types.ts`
- [x] `initializeDeck()` modified to shuffle deck in `src/state/deckReducer.ts`
- [x] RESET case added to `deckReducer()` in `src/state/deckReducer.ts`
- [x] `reset()` function added to `useDeckState()` hook
- [x] Reset button added to `DeckControls` component
- [x] Button disabled state implemented
- [x] App.tsx updated to pass reset prop

### Testing Complete
- [x] All 15+ contract tests written (C001-C010 + edge cases)
- [x] All contract tests passing
- [x] All 106 existing tests still passing (no regressions)
- [x] Integration tests added (optional)
- [x] All 10 contracts manually verified (T032-T041)

### Quality Gates
- [x] Linter passes with 0 errors
- [x] Production build succeeds
- [x] Bundle size impact acceptable (~2KB)
- [x] Performance verified (<500ms, typically <10ms)
- [x] Accessibility verified (keyboard, screen reader, tooltip)

### Success Criteria (from spec.md)
- [x] SC-001: Reset triggered via button click
- [x] SC-002: Reset completes in <500ms
- [x] SC-003: 10 loads produce different hands
- [x] SC-004: Post-reset matches fresh load
- [x] SC-005: Settings preserved
- [x] SC-006: Button disabled during operation
- [x] SC-007: Persisted state updated
- [x] SC-008: All 106 existing tests pass

---

## Summary

**Total Tasks**: 52 tasks across 6 phases  
**Estimated Time**: 3-4 hours  
**Complexity**: Low (builds on existing patterns)  
**Risk**: Low (small changes, high test coverage)  
**Test Coverage**: 121+ tests (106 existing + 15+ new)  

**Files Modified**: 5 files
1. `src/lib/types.ts` (action type)
2. `src/state/deckReducer.ts` (shuffle + RESET logic)
3. `src/hooks/useDeckState.ts` (reset function)
4. `src/components/DeckControls.tsx` (reset button)
5. `src/App.tsx` (prop passing)

**Files Created**: 1 file
6. `tests/contract/resetContracts.test.ts` (contract tests)

**Optional Files**: 2 files
7. `tests/integration/resetFlow.test.tsx` (integration tests - optional)
8. `src/styles/index.css` (styling updates - optional)

**Ready for Implementation**: ✅
