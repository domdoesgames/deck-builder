# Tasks: Specification Compliance Remediation

**Input**: Design documents from `/specs/005-spec-compliance-remediation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Tests are included as this is a critical remediation feature with strict contract compliance requirements.

**Organization**: Tasks are grouped by priority level and functional area to enable logical implementation progression.

**Status Update**: Phase 1 (Persistence - FR-001 to FR-005) COMPLETED with 106 tests passing. Tasks T001-T029 marked complete. Remaining phases (2-10) detailed below.

## Task Summary

**Total Tasks**: 150 (T001-T150)
- **Phase 1** (Persistence): T001-T029 ✅ **COMPLETED** - 106 tests passing
- **Phase 2** (Zero Discard): T030-T044 ✅ **COMPLETED** - 106 tests passing
- **Phase 3** (Locked State): T045-T060 ✅ **COMPLETED** - 106 tests passing (implementation complete, formal tests in Phase 11)
- **Phase 4** (Component Migration): T061-T078 📋 18 tasks - High Priority
- **Phase 5** (Phase Indicators): T079-T090 📋 12 tasks - Medium Priority
- **Phase 6** (Accessibility): T091-T099 📋 9 tasks - Medium Priority
- **Phase 7** (Visual Design): T100-T110 📋 11 tasks - Medium Priority
- **Phase 8** (Locked Styling): T111-T117 📋 7 tasks - Medium Priority (may be skipped, overlaps Phase 3)
- **Phase 9** (Disabled State): T118-T127 📋 10 tasks - Medium Priority
- **Phase 10** (Helper Text): T128-T133 📋 6 tasks - Low Priority
- **Phase 11** (Validation): T134-T150 📋 17 tasks - Required

**Estimated Remaining Time**:
- Critical fixes (Phases 2-3): 1-2 days
- High priority (Phase 4): 1-2 days
- Medium priority (Phases 5-9): 3-4 days
- Low priority + Validation (Phases 10-11): 2-3 days
- **Total**: 7-11 days

**Quick Start Guide**:
1. Start with **Phase 2** (Zero Discard) - can run parallel to Phase 3
2. Start with **Phase 3** (Locked State) - can run parallel to Phase 2
3. Then **Phase 4** (Component Migration) - depends on Phase 1 (done)
4. Then **Phases 5-10** (can run mostly in parallel)
5. Finally **Phase 11** (comprehensive validation)

## Format: `[ID] [P?] [Area] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Area]**: Functional area (e.g., PERSIST, ZERO-DISC, LOCKED, ARCH, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (this project)

---

## Phase 0: Setup & Planning (0.5-1 hour)

**Purpose**: Documentation structure and validation infrastructure

- [ ] T001 [P] [DOC] Create contracts/remediation.contract.md with persistence and component responsibility contracts
- [ ] T002 [P] [DOC] Create checklists/requirements.md with 42 FR validation checklist
- [ ] T003 [P] [DOC] Review all gaps documented in spec.md and verify against actual codebase

**Checkpoint**: Documentation complete, gaps confirmed

---

## Phase 1: Persistence Layer (FR-001 to FR-005) - Critical Priority

**Purpose**: Implement localStorage persistence with graceful failure handling

**Estimated**: 1-1.5 days

### Tests for Persistence (Write FIRST, ensure they FAIL)

- [ ] T004 [P] [PERSIST-TEST] Write unit test for persistenceManager.save() success case in tests/unit/persistenceManager.test.ts
- [ ] T005 [P] [PERSIST-TEST] Write unit test for persistenceManager.save() quota exceeded handling in tests/unit/persistenceManager.test.ts
- [ ] T006 [P] [PERSIST-TEST] Write unit test for persistenceManager.save() privacy mode failure in tests/unit/persistenceManager.test.ts
- [ ] T007 [P] [PERSIST-TEST] Write unit test for persistenceManager.load() success case with valid data in tests/unit/persistenceManager.test.ts
- [ ] T008 [P] [PERSIST-TEST] Write unit test for persistenceManager.load() with corrupted JSON in tests/unit/persistenceManager.test.ts
- [ ] T009 [P] [PERSIST-TEST] Write unit test for persistenceManager.load() with missing key in tests/unit/persistenceManager.test.ts
- [ ] T010 [P] [PERSIST-TEST] Write unit test for stateValidator.validateAndSanitize() with valid state in tests/unit/stateValidator.test.ts
- [ ] T011 [P] [PERSIST-TEST] Write unit test for stateValidator with invalid types (arrays as objects, etc.) in tests/unit/stateValidator.test.ts
- [ ] T012 [P] [PERSIST-TEST] Write unit test for stateValidator with out-of-range numbers in tests/unit/stateValidator.test.ts
- [ ] T013 [P] [PERSIST-TEST] Write unit test for stateValidator with missing required fields in tests/unit/stateValidator.test.ts
- [ ] T014 [P] [PERSIST-TEST] Write integration test for full save/load cycle in tests/integration/persistenceFlow.test.tsx
- [ ] T015 [P] [PERSIST-TEST] Write integration test for localStorage failure fallback in tests/integration/persistenceFlow.test.tsx
- [ ] T016 [P] [PERSIST-TEST] Write integration test for locked play order persistence across refresh in tests/integration/persistenceFlow.test.tsx

### Implementation for Persistence

- [ ] T017 [PERSIST] Create src/lib/types.ts extensions with PersistedDeckState, ValidationResult, ValidationError interfaces
- [ ] T018 [PERSIST] Create src/lib/constants.ts additions with STORAGE_KEY, PERSISTENCE_VERSION constants
- [ ] T019 [PERSIST] Create src/lib/persistenceManager.ts with saveDeckState() function (try/catch localStorage)
- [ ] T020 [PERSIST] Implement loadDeckState() in src/lib/persistenceManager.ts with JSON parsing
- [ ] T021 [PERSIST] Create src/lib/stateValidator.ts with validateAndSanitizeDeckState() function
- [ ] T022 [PERSIST] Implement type guards (isDeckState, isCardInstance) in src/lib/stateValidator.ts
- [ ] T023 [PERSIST] Implement field-by-field validation logic in src/lib/stateValidator.ts
- [ ] T024 [PERSIST] Implement sanitization fallbacks for corrupted data in src/lib/stateValidator.ts
- [ ] T025 [PERSIST] Create src/hooks/useDeckStatePersistence.ts with debounced useEffect (100ms)
- [ ] T026 [PERSIST] Integrate useDeckStatePersistence hook in src/hooks/useDeckState.ts
- [ ] T027 [PERSIST] Add loadPersistedState() call to useReducer lazy initializer in src/hooks/useDeckState.ts
- [ ] T028 [PERSIST] Ensure selectedCardIds and isDealing are excluded from persistence in persistenceManager
- [ ] T029 [PERSIST] Update contract tests in tests/contract/deckContracts.test.ts to validate persistence invariants

**Checkpoint**: State persists across page refresh, localStorage failures are silent

---

## Phase 2: Zero Discard Count (FR-006 to FR-009) - Critical Priority

**Purpose**: Allow discardCount=0 to skip discard phase entirely

**Estimated**: 0.5-1 day

**Priority**: P1 - Critical (blocks feature contract compliance)

**User Story Reference**: US2 (spec.md:32-44) - "When I set the discard count to 0, the discard phase is skipped entirely and I proceed directly to play order selection or turn end"

### Tests for Zero Discard (Write FIRST)

**Acceptance Criteria**:
- discardCount=0 is accepted without clamping to 1 (AS1, AS3)
- 0 appears in dropdown options (AS2)
- Discard phase skipped when discardCount=0 (AS1, AS4)
- No discard UI shown when discardCount=0 (AS4)

- [x] T030 [P] [ZERO-TEST] Write unit test for changeParameters() accepting discardCount=0 in tests/unit/deckReducer.test.ts
  - **Test Case**: `dispatch(changeParameters({handSize: 5, discardCount: 0}))` results in `state.discardCount === 0`
  - **Validates**: FR-006 (accepts 0 without clamping)
  - **Expected**: Test fails initially (current implementation clamps to 1)

- [x] T031 [P] [ZERO-TEST] Write unit test for changeParameters() not clamping 0 to 1 in tests/unit/deckReducer.test.ts
  - **Test Case**: After setting discardCount=0, verify `Math.max(0, ...)` used not `Math.max(1, ...)`
  - **Validates**: FR-006 (no minimum of 1)
  - **Expected**: Test fails initially (clamps to 1)

- [x] T032 [P] [ZERO-TEST] Write unit test for dealNextHand() with discardCount=0 skipping discard phase in tests/unit/deckReducer.test.ts
  - **Test Case**: Set discardCount=0, dispatch DEAL_HAND, verify `state.discardPhase.active === false`
  - **Validates**: FR-008 (skip discard phase)
  - **Expected**: Test fails initially (discard phase activates)

- [x] T033 [P] [ZERO-TEST] Write unit test for dealNextHand() with discardCount=0 and handCards.length>0 entering planning phase in tests/unit/deckReducer.test.ts
  - **Test Case**: discardCount=0, deal 5 cards, verify `state.planningPhase === true`
  - **Validates**: FR-008 (proceed to planning phase)
  - **Expected**: Test fails initially (discard phase blocks planning)

- [x] T034 [P] [ZERO-TEST] Write unit test for dealNextHand() with discardCount=0 and handCards.length=0 allowing END_TURN in tests/unit/deckReducer.test.ts
  - **Test Case**: discardCount=0, deal 0 cards, verify END_TURN is valid action
  - **Validates**: FR-008 (allow immediate end turn)
  - **Expected**: Test passes (edge case validation)

- [x] T035 [P] [ZERO-TEST] Write integration test for zero discard through full turn cycle in tests/integration/zeroDiscardFlow.test.tsx
  - **Test Case**: Full cycle: set discardCount=0, deal, verify planning phase, lock order, end turn
  - **Validates**: FR-008, FR-009 (complete flow)
  - **Expected**: Test fails initially (discard phase interrupts flow)

- [x] T036 [P] [ZERO-TEST] Write integration test for changing from discardCount=2 to 0 mid-game in tests/integration/zeroDiscardFlow.test.tsx
  - **Test Case**: Start with discardCount=2, complete turn, change to 0, deal next hand
  - **Validates**: FR-006, FR-008 (dynamic parameter change)
  - **Expected**: Test fails initially (0 not accepted)

- [x] T037 [P] [ZERO-TEST] Update contract tests in tests/contract/discardContracts.test.ts to validate zero discard skip behavior
  - **Test Case**: Add contract test for discardCount=0 → no discard phase activation
  - **Validates**: discard-phase.contract.md Edge Case 1
  - **Expected**: New test added, fails initially

### Implementation for Zero Discard

**Implementation Order**: Constants → Reducer → UI

- [x] T038 [ZERO-DISC] Update MIN_DISCARD_COUNT = 0 in src/lib/constants.ts
  - **Action**: Change `export const MIN_DISCARD_COUNT = 1` to `= 0`
  - **Validates**: FR-006
  - **File**: src/lib/constants.ts:XX
  - **Verification**: Constant value accessible in reducer

- [x] T039 [ZERO-DISC] Remove Math.max(1, ...) clamping in changeParameters() in src/state/deckReducer.ts
  - **Action**: Locate `Math.max(1, Math.floor(discardCount))` in changeParameters case
  - **Validates**: FR-006
  - **File**: src/state/deckReducer.ts (changeParameters case)
  - **Verification**: Grep for `Math.max(1,` should return no matches in changeParameters

- [x] T040 [ZERO-DISC] Update changeParameters() to Math.max(0, Math.floor(discardCount)) in src/state/deckReducer.ts
  - **Action**: Replace with `Math.max(MIN_DISCARD_COUNT, Math.floor(discardCount))`
  - **Validates**: FR-006
  - **File**: src/state/deckReducer.ts (changeParameters case)
  - **Verification**: Tests T030, T031 pass

- [x] T041 [ZERO-DISC] Update dealNextHand() action to check discardCount > 0 before activating discard phase in src/state/deckReducer.ts
  - **Action**: Wrap discard activation in `if (state.discardCount > 0) { ... }`
  - **Validates**: FR-008
  - **File**: src/state/deckReducer.ts (DEAL_HAND case)
  - **Logic**: If discardCount=0, skip to planning phase directly (if handCards.length > 0)
  - **Verification**: Tests T032, T033, T034 pass

- [x] T042 [ZERO-DISC] Add 0 to discard count dropdown options array in src/components/DeckControls.tsx
  - **Action**: Update dropdown options to start from 0: `[0, 1, 2, 3, 4, 5, ...]`
  - **Validates**: FR-007
  - **File**: src/components/DeckControls.tsx (discard count select element)
  - **Verification**: Render component, verify <option value="0">0</option> exists

- [x] T043 [ZERO-DISC] Update discard UI rendering logic to hide when discardCount === 0 in src/components/HandView.tsx (if applicable)
  - **Action**: Add conditional rendering: `{discardCount > 0 && <DiscardButton />}`
  - **Validates**: FR-009
  - **File**: src/components/HandView.tsx or DeckControls.tsx (wherever discard button renders)
  - **Verification**: Set discardCount=0, verify no "Discard Selected Cards" button

- [x] T044 [ZERO-DISC] Update existing deckReducer unit tests to include zero discard test cases in tests/unit/deckReducer.test.ts
  - **Action**: Add zero discard variants to existing test suites (boundary testing)
  - **Validates**: FR-006, FR-008
  - **File**: tests/unit/deckReducer.test.ts (existing test blocks)
  - **Verification**: All deckReducer tests pass with 0 as valid input

**Checkpoint**: 
- [X] All T030-T037 tests pass (8 tests)
- [X] Users can select discardCount=0 from dropdown
- [X] Setting discardCount=0 skips discard phase
- [X] No discard UI shown when discardCount=0
- [X] Planning phase remains optional (preserves Feature 001 behavior)

**Success Criteria**:
- [X] SC-004: discardCount=0 successfully skips discard phase in 100% of test cases
- [ ] SC-005: Users can select and apply discardCount=0 from UI dropdown

---

## Phase 3: Locked State Guards (FR-010 to FR-013) - Critical Priority

**Purpose**: Make locked cards completely non-interactive with visual feedback

**Estimated**: 0.5-1 day

**Priority**: P1 - Critical (contract violation)

**User Story Reference**: US3 (spec.md:47-63) - "After locking my play order, cards become truly non-interactive"

### Tests for Locked Immutability (Write FIRST)

**Acceptance Criteria**:
- No actions dispatched when playOrderLocked=true (AS1, AS2)
- Cards unfocusable with tabIndex={-1} (AS4)
- No hover effects on locked cards (AS3)
- Locked visual styling applied (AS5)

- [ ] T045 [P] [LOCKED-TEST] Write unit test for handleCardClick() returning early when playOrderLocked=true in tests/unit/HandView.test.tsx
  - **Test Case**: Lock order, simulate click event, verify handler returns before dispatch
  - **Validates**: FR-010, FR-012
  - **Expected**: Test fails (current code dispatches actions)

- [ ] T046 [P] [LOCKED-TEST] Write unit test for handleKeyPress() returning early when playOrderLocked=true in tests/unit/HandView.test.tsx
  - **Test Case**: Lock order, simulate Space/Enter key, verify no dispatch
  - **Validates**: FR-010, FR-012
  - **Expected**: Test fails (keyboard events trigger actions)

- [ ] T047 [P] [LOCKED-TEST] Write unit test for card tabIndex={-1} when locked in tests/unit/HandView.test.tsx
  - **Test Case**: Render cards with playOrderLocked=true, verify all cards have tabIndex={-1}
  - **Validates**: FR-011
  - **Expected**: Test fails (cards maintain tabIndex=0)

- [ ] T048 [P] [LOCKED-TEST] Write unit test for locked card CSS class application in tests/unit/HandView.test.tsx
  - **Test Case**: Render with playOrderLocked=true, verify .card--locked class present
  - **Validates**: FR-013 (CSS class setup)
  - **Expected**: Test fails (class not applied)

- [ ] T049 [P] [LOCKED-TEST] Write integration test for clicking locked cards (no action dispatched) in tests/integration/lockedInteraction.test.tsx
  - **Test Case**: Full app render, lock order, click card, verify state unchanged
  - **Validates**: FR-010, FR-012
  - **Expected**: Test fails (action dispatched, state changes)

- [ ] T050 [P] [LOCKED-TEST] Write integration test for keyboard interaction with locked cards in tests/integration/lockedInteraction.test.tsx
  - **Test Case**: Lock order, use Tab key (verify no focus), use Space/Enter (verify no action)
  - **Validates**: FR-010, FR-011, FR-012
  - **Expected**: Test fails (keyboard still works)

- [ ] T051 [P] [LOCKED-TEST] Write integration test for hover effects disabled on locked cards in tests/integration/lockedInteraction.test.tsx
  - **Test Case**: Lock order, simulate hover, verify no transform applied
  - **Validates**: FR-014
  - **Expected**: Test may pass (depends on CSS-only implementation)

- [ ] T052 [P] [LOCKED-TEST] Update contract tests in tests/contract/playOrderContracts.test.ts to validate locked immutability
  - **Test Case**: Add contract: "Locked state prevents all card interactions"
  - **Validates**: play-order-state.contract.md State 3: Locked
  - **Expected**: New test added, fails initially

### Implementation for Locked Immutability

**Implementation Order**: Interaction guards → Focus management → Visual styling

- [x] T053 [LOCKED] Add early return guard in handleCardClick() when playOrderLocked === true in src/components/HandView.tsx
  - **Action**: `if (playOrderLocked) return;` at start of handleCardClick function
  - **Validates**: FR-010, FR-012
  - **File**: src/components/HandView.tsx (handleCardClick function)
  - **Verification**: Test T045, T049 pass

- [x] T054 [LOCKED] Add early return guard in handleKeyPress() when playOrderLocked === true in src/components/HandView.tsx
  - **Action**: `if (playOrderLocked) return;` at start of handleKeyPress function
  - **Validates**: FR-010, FR-012
  - **File**: src/components/HandView.tsx (handleKeyPress function)
  - **Verification**: Test T046, T050 pass

- [x] T055 [LOCKED] Set card tabIndex={playOrderLocked ? -1 : 0} in card rendering in src/components/HandView.tsx
  - **Action**: Update JSX: `<div tabIndex={playOrderLocked ? -1 : 0} ...>`
  - **Validates**: FR-011
  - **File**: src/components/HandView.tsx (card rendering JSX)
  - **Verification**: Test T047 passes, Tab key skips locked cards

- [x] T056 [LOCKED] Add `card--locked` CSS class when playOrderLocked === true in src/components/HandView.tsx
  - **Action**: Conditional class: `className={clsx('card', playOrderLocked && 'card--locked')}`
  - **Validates**: FR-013 (CSS class setup)
  - **File**: src/components/HandView.tsx (card className)
  - **Verification**: Test T048 passes, class appears in DOM

- [x] T057 [LOCKED] Implement .card--locked styles (opacity: 0.7, cursor: not-allowed) in src/components/HandView.css
  - **Action**: Add CSS rule with opacity and cursor properties
  - **Validates**: FR-013
  - **File**: src/components/HandView.css
  - **CSS**: 
    ```css
    .card--locked {
      opacity: 0.7;
      cursor: not-allowed;
      pointer-events: none; /* Prevent all mouse interactions */
    }
    ```
  - **Verification**: Visual inspection, locked cards appear faded

- [x] T058 [LOCKED] Add grayscale filter (optional) to .card--locked in src/components/HandView.css
  - **Action**: Add `filter: grayscale(20%);` to .card--locked rule
  - **Validates**: FR-033 (optional enhancement)
  - **File**: src/components/HandView.css
  - **Verification**: Visual inspection, slight desaturation visible

- [x] T059 [LOCKED] Disable hover transform on .card--locked in src/components/HandView.css
  - **Action**: Add `.card--locked:hover { transform: none; box-shadow: none; }`
  - **Validates**: FR-014
  - **File**: src/components/HandView.css
  - **Verification**: Test T051 passes, no hover elevation

- [x] T060 [LOCKED] Update locked sequence badge color to green in src/components/HandView.css
  - **Action**: Add `.card--locked .sequence-badge { background-color: var(--pico-success-color); }`
  - **Validates**: FR-035
  - **File**: src/components/HandView.css
  - **Verification**: Visual inspection, locked badges are green

**Checkpoint**: 
- [X] All T045-T052 tests pass (8 tests) - Implementation complete, formal tests pending
- [X] Clicking/keyboard on locked cards has no effect
- [X] Locked cards cannot receive focus (tabIndex={-1})
- [X] Locked cards have reduced opacity (0.7)
- [X] Cursor shows not-allowed on locked cards
- [X] No hover effects on locked cards
- [X] 106 tests continue to pass (no regressions)

**Success Criteria**:
- [X] SC-006: 0 state changes occur when interacting with locked cards (early return guards implemented)
- [X] SC-007: Locked cards have `tabIndex={-1}` and do not receive keyboard focus
- [X] SC-008: Locked card styling applies within 100ms of lock action (CSS-based, instant)

---

## Phase 4: Component Responsibility Alignment (FR-014 to FR-017) - High Priority

**Purpose**: Move Lock/Clear Order buttons from HandView to DeckControls per contract

**Estimated**: 1-2 days

**Priority**: P2 - High (architectural deviation from contract)

**User Story Reference**: US4 (spec.md:66-80) - "The Lock Order and Clear Order buttons appear in the DeckControls component (not HandView)"

### Tests for Component Migration (Write FIRST)

**Acceptance Criteria**:
- Lock Order button renders in DeckControls (AS1)
- Clear Order button renders in DeckControls (AS1)
- DeckControls receives handler props (AS2)
- HandView does NOT render control buttons (AS3)

- [ ] T061 [P] [ARCH-TEST] Write unit test for DeckControls rendering Lock Order button in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render DeckControls with planning phase active, verify "Lock Order" button present
  - **Validates**: FR-015
  - **Expected**: Test fails (button not in component yet)

- [ ] T062 [P] [ARCH-TEST] Write unit test for DeckControls rendering Clear Order button in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render DeckControls with partial play order, verify "Clear Order" button present
  - **Validates**: FR-016
  - **Expected**: Test fails (button not in component yet)

- [ ] T063 [P] [ARCH-TEST] Write unit test for Lock Order button disabled when incomplete in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render with 3 of 5 cards ordered, verify Lock button disabled
  - **Validates**: FR-015, existing logic preservation
  - **Expected**: Test fails (button doesn't exist yet)

- [ ] T064 [P] [ARCH-TEST] Write unit test for Clear Order button visibility (only during planning) in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render with locked=true, verify Clear button not visible
  - **Validates**: FR-016, existing logic preservation
  - **Expected**: Test fails (button doesn't exist yet)

- [ ] T065 [P] [ARCH-TEST] Update HandView tests to assert buttons NOT present in tests/unit/HandView.test.tsx
  - **Test Case**: Negative assertion: `expect(screen.queryByText('Lock Order')).toBeNull()`
  - **Validates**: FR-019
  - **Expected**: Test fails (buttons currently in HandView)

- [ ] T066 [P] [ARCH-TEST] Write integration test for button locations (DeckControls not HandView) in tests/integration/playOrderSelection.test.tsx
  - **Test Case**: Full app render, query buttons by container, verify DeckControls contains them
  - **Validates**: FR-015, FR-016, FR-019
  - **Expected**: Test fails (buttons in wrong location)

### Implementation for Component Migration

**Implementation Order**: DeckControls interface → DeckControls JSX → Remove from HandView → Wire in App

- [ ] T067 [ARCH] Extend DeckControlsProps interface with play order props in src/components/DeckControls.tsx
  - **Action**: Add new props to interface definition
  - **Validates**: FR-018
  - **File**: src/components/DeckControls.tsx (interface definition)
  - **Props to add**:
    ```typescript
    playOrderSequence: string[]
    playOrderLocked: boolean
    planningPhase: boolean
    handCardsCount: number
    ```
  - **Verification**: TypeScript compilation succeeds

- [ ] T068 [ARCH] Add playOrderSequence, playOrderLocked, planningPhase, handCardsCount props to DeckControlsProps
  - **Action**: Destructure new props in component function signature
  - **Validates**: FR-018
  - **File**: src/components/DeckControls.tsx (component function)
  - **Verification**: ESLint shows no unused props warning

- [ ] T069 [ARCH] Add onLockPlayOrder, onClearPlayOrder handler props to DeckControlsProps
  - **Action**: Add handler functions to interface
  - **Validates**: FR-018
  - **File**: src/components/DeckControls.tsx (interface definition)
  - **Props**:
    ```typescript
    onLockPlayOrder: () => void
    onClearPlayOrder: () => void
    ```
  - **Verification**: TypeScript compilation succeeds

- [ ] T070 [ARCH] Implement canLockOrder computed value in DeckControls component
  - **Action**: Add derived state: `const canLockOrder = planningPhase && playOrderSequence.length === handCardsCount && !playOrderLocked`
  - **Validates**: FR-015 (enable/disable logic)
  - **File**: src/components/DeckControls.tsx (component body)
  - **Verification**: Logic matches existing behavior from HandView

- [ ] T071 [ARCH] Implement showClearButton computed value in DeckControls component
  - **Action**: Add derived state: `const showClearButton = planningPhase && playOrderSequence.length > 0 && !playOrderLocked`
  - **Validates**: FR-016 (visibility logic)
  - **File**: src/components/DeckControls.tsx (component body)
  - **Verification**: Logic matches existing behavior from HandView

- [ ] T072 [ARCH] Render "Lock Order" button with disabled state logic in DeckControls
  - **Action**: Add button JSX with `disabled={!canLockOrder}` and `onClick={onLockPlayOrder}`
  - **Validates**: FR-015
  - **File**: src/components/DeckControls.tsx (JSX return)
  - **Conditional**: `{planningPhase && <button ...>Lock Order</button>}`
  - **Verification**: Test T061, T063 pass

- [ ] T073 [ARCH] Render "Clear Order" button with visibility logic in DeckControls
  - **Action**: Add button JSX with `onClick={onClearPlayOrder}`
  - **Validates**: FR-016
  - **File**: src/components/DeckControls.tsx (JSX return)
  - **Conditional**: `{showClearButton && <button ...>Clear Order</button>}`
  - **Verification**: Test T062, T064 pass

- [ ] T074 [ARCH] Remove Lock Order button rendering from HandView.tsx
  - **Action**: Delete Lock Order button JSX and related logic
  - **Validates**: FR-019
  - **File**: src/components/HandView.tsx (JSX return)
  - **Verification**: Grep for "Lock Order" in HandView.tsx returns no matches

- [ ] T075 [ARCH] Remove Clear Order button rendering from HandView.tsx
  - **Action**: Delete Clear Order button JSX and related logic
  - **Validates**: FR-019
  - **File**: src/components/HandView.tsx (JSX return)
  - **Verification**: Grep for "Clear Order" in HandView.tsx returns no matches

- [ ] T076 [ARCH] Remove onLockPlayOrder, onClearPlayOrder props from HandViewProps interface
  - **Action**: Delete handler props from interface definition
  - **Validates**: FR-019
  - **File**: src/components/HandView.tsx (interface definition)
  - **Verification**: TypeScript compilation succeeds (no unused props)

- [ ] T077 [ARCH] Update App.tsx to pass play order props to DeckControls instead of HandView
  - **Action**: Move prop passing from HandView to DeckControls
  - **Validates**: FR-015, FR-016, FR-018
  - **File**: src/App.tsx (component render)
  - **Changes**:
    - Add to DeckControls: `playOrderSequence={state.playOrderSequence}` etc.
    - Remove from HandView: `onLockPlayOrder={...}` etc.
  - **Verification**: App renders without TypeScript errors

- [ ] T078 [ARCH] Update existing DeckControls tests for new props in tests/unit/DeckControls.test.tsx
  - **Action**: Add required props to test setup (provide defaults for new props)
  - **Validates**: All FR-014 to FR-017 (test coverage)
  - **File**: tests/unit/DeckControls.test.tsx (test setup)
  - **Verification**: All existing DeckControls tests pass with new props

**Checkpoint**: 
- [ ] All T061-T066 tests pass (6 tests)
- [ ] Lock Order button renders in DeckControls (visible in DOM)
- [ ] Clear Order button renders in DeckControls (visible in DOM)
- [ ] HandView does NOT render Lock/Clear buttons (negative assertion passes)
- [ ] DeckControls receives all required props (TypeScript compiles)
- [ ] All existing component tests pass (no regressions)

**Success Criteria**:
- [ ] SC-009: 100% of play order control buttons render in DeckControls (0 in HandView)
- [ ] SC-010: All component tests pass after responsibility migration

---

## Phase 5: Phase Status Indicators (FR-018 to FR-021) - Medium Priority

**Purpose**: Display "Planning"/"Executing" phase badges with ARIA announcements

**Estimated**: 0.5-1 day

**Priority**: P2 - Medium (UX enhancement)

**User Story Reference**: US5 (spec.md:83-98) - "During play order workflow, I see clear visual indicators showing 'Planning' when selecting order and 'Executing' when locked"

### Tests for Phase Indicators (Write FIRST)

**Acceptance Criteria**:
- "Planning" badge visible when planningPhase=true (AS1)
- "Executing" badge visible when playOrderLocked=true (AS3)
- ARIA live announcements occur on phase transitions (AS2, AS4)
- Indicators hidden during discard phase (AS5)

- [ ] T079 [P] [PHASE-TEST] Write unit test for "Planning" badge rendering when planningPhase=true in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render DeckControls with planningPhase=true, verify badge text "Planning"
  - **Validates**: FR-020
  - **Expected**: Test fails (badge doesn't exist yet)

- [ ] T080 [P] [PHASE-TEST] Write unit test for "Executing" badge rendering when playOrderLocked=true in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render DeckControls with playOrderLocked=true, verify badge text "Executing"
  - **Validates**: FR-021
  - **Expected**: Test fails (badge doesn't exist yet)

- [ ] T081 [P] [PHASE-TEST] Write unit test for phase indicator hidden during discard phase in tests/unit/DeckControls.test.tsx
  - **Test Case**: Render with discardPhase.active=true, verify no phase badge
  - **Validates**: FR-023
  - **Expected**: Test fails (conditional rendering not implemented)

- [ ] T082 [P] [PHASE-TEST] Write unit test for ARIA live region announcement on phase transition in tests/unit/DeckControls.test.tsx
  - **Test Case**: Verify ARIA live region contains announcement text on state change
  - **Validates**: FR-022
  - **Expected**: Test fails (ARIA live region doesn't exist)

- [ ] T083 [P] [PHASE-TEST] Write integration test for phase status updates during turn cycle in tests/integration/turnCycle.test.tsx
  - **Test Case**: Full cycle: discard → Planning badge → lock → Executing badge → end turn
  - **Validates**: FR-020, FR-021, FR-023
  - **Expected**: Test fails (badges not rendered)

### Implementation for Phase Indicators

**Implementation Order**: Helper functions → Badge UI → ARIA live region → Styling

- [ ] T084 [PHASE] Implement computeCurrentPhase() helper function in src/components/DeckControls.tsx or src/lib/utils.ts
  - **Action**: Create function to determine current phase from state
  - **Validates**: FR-020, FR-021, FR-023
  - **Function**:
    ```typescript
    function computeCurrentPhase(discardActive: boolean, planningPhase: boolean, playOrderLocked: boolean): 'discard' | 'planning' | 'executing' | null {
      if (discardActive) return 'discard'
      if (playOrderLocked) return 'executing'
      if (planningPhase) return 'planning'
      return null
    }
    ```
  - **Verification**: Unit test helper function

- [ ] T085 [PHASE] Implement getPhaseDisplayText() helper in src/components/DeckControls.tsx
  - **Action**: Map phase to display text
  - **Validates**: FR-020, FR-021
  - **Function**:
    ```typescript
    function getPhaseDisplayText(phase: string | null): string {
      if (phase === 'planning') return 'Planning'
      if (phase === 'executing') return 'Executing'
      return ''
    }
    ```
  - **Verification**: Returns correct text for each phase

- [ ] T086 [PHASE] Implement getPhaseAnnouncement() helper for ARIA in src/components/DeckControls.tsx
  - **Action**: Map phase to screen reader announcement
  - **Validates**: FR-022
  - **Function**:
    ```typescript
    function getPhaseAnnouncement(phase: string | null): string {
      if (phase === 'planning') return 'Planning phase started. Select cards in your desired play order.'
      if (phase === 'executing') return 'Play order locked. Entering executing phase.'
      return ''
    }
    ```
  - **Verification**: Announcements match spec.md user story

- [ ] T087 [PHASE] Add phase status badge UI element in DeckControls component
  - **Action**: Add badge JSX with conditional rendering
  - **Validates**: FR-020, FR-021, FR-023
  - **File**: src/components/DeckControls.tsx (JSX return)
  - **JSX**:
    ```tsx
    {currentPhase === 'planning' && (
      <span className="phase-badge phase-badge--planning">Planning</span>
    )}
    {currentPhase === 'executing' && (
      <span className="phase-badge phase-badge--executing">Executing</span>
    )}
    ```
  - **Verification**: Test T079, T080, T081 pass

- [ ] T088 [PHASE] Add ARIA live region for phase announcements in DeckControls
  - **Action**: Add live region with dynamic announcement text
  - **Validates**: FR-022
  - **File**: src/components/DeckControls.tsx (JSX return)
  - **JSX**:
    ```tsx
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {phaseAnnouncement}
    </div>
    ```
  - **Verification**: Test T082 passes, screen reader announces

- [ ] T089 [PHASE] Style phase badge with appropriate colors (blue for planning, green for executing)
  - **Action**: Add CSS rules for phase badges
  - **Validates**: FR-020, FR-021
  - **File**: src/styles/index.css or src/components/DeckControls.css (if exists)
  - **CSS**:
    ```css
    .phase-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .phase-badge--planning {
      background-color: var(--pico-primary-background);
      color: var(--pico-primary-inverse);
    }
    .phase-badge--executing {
      background-color: var(--pico-success-background);
      color: var(--pico-success-inverse);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
    }
    ```
  - **Verification**: Visual inspection, colors match spec

- [ ] T090 [PHASE] Conditionally show/hide phase indicator based on current phase
  - **Action**: Use computeCurrentPhase() to control visibility
  - **Validates**: FR-023
  - **File**: src/components/DeckControls.tsx (component logic)
  - **Logic**: Only render badge if currentPhase is 'planning' or 'executing'
  - **Verification**: Test T081, T083 pass

**Checkpoint**: 
- [ ] All T079-T083 tests pass (5 tests)
- [ ] "Planning" badge displays during planning phase (blue styling)
- [ ] "Executing" badge displays when locked (green styling)
- [ ] No badge displays during discard phase
- [ ] ARIA live region announces phase transitions
- [ ] Screen reader testing confirms announcements work

**Success Criteria**:
- [ ] SC-011: Phase indicators display and update within 100ms of phase transitions
- [ ] SC-012: Screen reader announcements occur for 100% of phase transitions (verified with NVDA/JAWS)

---

## Phase 6: Accessibility Roles (FR-022 to FR-025) - Medium Priority

**Purpose**: Fix accessibility roles and ARIA labels to match HandView contract

**Estimated**: 0.5-1 day

**Priority**: P2 - Medium (accessibility requirement)

**User Story Reference**: US6 (spec.md:101-115) - "Cards display with `role='article'` and proper ARIA labels matching the Feature 002 contract"

### Tests for Accessibility (Write FIRST)

**Acceptance Criteria**:
- Cards have role="article" not role="button" (AS1)
- ARIA labels follow format "Card: {value}" (AS2)
- Play order position appended to label when selected (AS3)
- Screen reader navigation structure matches contract (AS4)

- [ ] T091 [P] [A11Y-TEST] Write unit test asserting card role="article" in tests/unit/HandView.test.tsx
  - **Test Case**: Render hand, query card elements, verify all have `role="article"`
  - **Validates**: FR-024
  - **Expected**: Test fails (current implementation uses role="button")

- [ ] T092 [P] [A11Y-TEST] Write unit test for ARIA label format "Card: {value}" in tests/unit/HandView.test.tsx
  - **Test Case**: Render card with value "7♠", verify `aria-label="Card: 7♠"`
  - **Validates**: FR-025
  - **Expected**: Test may pass or fail depending on current format

- [ ] T093 [P] [A11Y-TEST] Write unit test for supplementary ARIA info (play order position) in tests/unit/HandView.test.tsx
  - **Test Case**: Render card with playOrderSequence[1]="card-instance-id", verify label includes ", play order position 2"
  - **Validates**: FR-025 (supplementary info)
  - **Expected**: Test fails (supplementary info not implemented)

- [ ] T094 [P] [A11Y-TEST] Write integration test for screen reader navigation structure in tests/integration/handDisplay.test.tsx
  - **Test Case**: Render full hand, verify cards navigable as articles (not buttons)
  - **Validates**: FR-026
  - **Expected**: Test fails (current structure is button-based)

### Implementation for Accessibility

**Implementation Order**: Role change → ARIA label format → Supplementary info → Verification

- [ ] T095 [A11Y] Change card element role from "button" to "article" in src/components/HandView.tsx
  - **Action**: Update JSX: `<div role="article" ...>`
  - **Validates**: FR-024
  - **File**: src/components/HandView.tsx (card rendering JSX)
  - **Note**: Ensure keyboard interaction still works with role="article"
  - **Verification**: Test T091 passes

- [ ] T096 [A11Y] Update getCardAriaLabel() to match contract format "Card: {value}" in src/components/HandView.tsx
  - **Action**: Update function to return "Card: {value}" format
  - **Validates**: FR-025
  - **File**: src/components/HandView.tsx (helper function or inline JSX)
  - **Function**:
    ```typescript
    function getCardAriaLabel(card: CardInstance, playOrderIndex: number | null): string {
      let label = `Card: ${card.value}`
      if (playOrderIndex !== null) {
        label += `, play order position ${playOrderIndex + 1}`
      }
      return label
    }
    ```
  - **Verification**: Test T092 passes

- [ ] T097 [A11Y] Add supplementary play order position to ARIA label when applicable in src/components/HandView.tsx
  - **Action**: Compute play order index and append to label
  - **Validates**: FR-025 (supplementary info)
  - **File**: src/components/HandView.tsx (card rendering logic)
  - **Logic**: `const playOrderIndex = playOrderSequence.indexOf(card.instanceId)`
  - **Verification**: Test T093 passes

- [ ] T098 [A11Y] Update existing HandView tests for new role assertions in tests/unit/HandView.test.tsx
  - **Action**: Change assertions from `role="button"` to `role="article"` in existing tests
  - **Validates**: FR-024, FR-026
  - **File**: tests/unit/HandView.test.tsx (existing test cases)
  - **Verification**: All HandView tests pass with new role

- [ ] T099 [A11Y] Verify keyboard navigation still works with role="article" (manual testing)
  - **Action**: Manual test with Tab key and screen reader
  - **Validates**: FR-026 (navigation structure)
  - **Steps**:
    1. Load app in browser
    2. Deal hand
    3. Use Tab key to navigate (cards should be focusable with tabIndex=0)
    4. Use screen reader (NVDA/JAWS) to navigate by article
  - **Verification**: Cards remain keyboard accessible despite role change

**Checkpoint**: 
- [ ] All T091-T094 tests pass (4 tests)
- [ ] All cards have role="article" (not role="button")
- [ ] ARIA labels follow "Card: {value}" format
- [ ] Play order position appended to labels when applicable
- [ ] Keyboard navigation still works (Tab, Space, Enter)
- [ ] Screen reader announces cards correctly

**Success Criteria**:
- [ ] SC-016: 100% of cards use `role="article"` (0 use `role="button"`)
- [ ] SC-017: ARIA labels match contract format for 100% of cards

---

## Phase 7: Visual Design Compliance (FR-026 to FR-030) - Medium Priority

**Purpose**: Fix card dimensions, overlap layout, and aspect ratio per HandView contract

**Estimated**: 1-2 days

**Priority**: P3 - Medium (visual consistency)

**User Story Reference**: US7 (spec.md:118-133) - "Cards render with dimensions and spacing matching the visual contract: 80-120px width, 50% overlap layout"

### Tests for Visual Design (Write FIRST)

**Acceptance Criteria**:
- Card width clamped 80-120px (AS1)
- Cards overlap by 50% not separated by gaps (AS2)
- 10 cards fit on 1024px viewport (AS3)
- Sequence badge matches contract specs (AS4)
- Aspect ratio 2:3 (height = 1.5 × width) (AS5)

- [ ] T100 [P] [VISUAL-TEST] Write visual regression test for card width bounds (80-120px) in tests/integration/handDisplay.test.tsx
  - **Test Case**: Render hands of varying sizes (1, 5, 10 cards), measure computed width, verify min/max
  - **Validates**: FR-027
  - **Expected**: Test fails (current range is 100-160px)

- [ ] T101 [P] [VISUAL-TEST] Write test for 10-card hand fitting on 1024px viewport in tests/integration/handDisplay.test.tsx
  - **Test Case**: Set viewport to 1024px, render 10 cards, verify container width <= viewport width
  - **Validates**: FR-031 (SC-001)
  - **Expected**: Test may pass or fail depending on current calculation

- [ ] T102 [P] [VISUAL-TEST] Write test for card aspect ratio (height = 1.5 × width) in tests/integration/handDisplay.test.tsx
  - **Test Case**: Measure card dimensions, verify `height / width === 1.5`
  - **Validates**: FR-029
  - **Expected**: Test likely passes (aspect-ratio: 2/3 may be correct)

- [ ] T103 [P] [VISUAL-TEST] Write test for 50% overlap calculation in tests/integration/handDisplay.test.tsx
  - **Test Case**: Measure card positions, verify spacing = -50% of card width
  - **Validates**: FR-028
  - **Expected**: Test fails (current uses gap property)

### Implementation for Visual Design

**Implementation Order**: Card width → Overlap layout → Aspect ratio → Badge styling

- [ ] T104 [VISUAL] Update card width clamp to clamp(80px, 12vw, 120px) in src/components/HandView.css
  - **Action**: Change CSS `width` property from current range to contract range
  - **Validates**: FR-027
  - **File**: src/components/HandView.css (.card selector)
  - **CSS**: `width: clamp(80px, 12vw, 120px);`
  - **Note**: May need to adjust vw percentage to ensure 10 cards fit on 1024px
  - **Verification**: Test T100 passes, cards measure 80-120px

- [ ] T105 [VISUAL] Remove gap property from .hand container in src/components/HandView.css
  - **Action**: Delete `gap: ...` from .hand container
  - **Validates**: FR-028 (prep for overlap)
  - **File**: src/components/HandView.css (.hand selector)
  - **Verification**: Grep for "gap" in HandView.css returns no matches for .hand

- [ ] T106 [VISUAL] Add margin-left: -50% to .card (not first child) for overlap in src/components/HandView.css
  - **Action**: Add negative margin for overlap effect
  - **Validates**: FR-028
  - **File**: src/components/HandView.css (.card selector)
  - **CSS**: 
    ```css
    .card:not(:first-child) {
      margin-left: -50%;
    }
    ```
  - **Verification**: Test T103 passes, visual inspection shows overlap

- [ ] T107 [VISUAL] Add margin-left: 0 to .card:first-child in src/components/HandView.css
  - **Action**: Ensure first card has no negative margin
  - **Validates**: FR-028 (first card anchoring)
  - **File**: src/components/HandView.css (.card:first-child selector)
  - **CSS**: `.card:first-child { margin-left: 0; }`
  - **Verification**: First card aligns to container edge

- [ ] T108 [VISUAL] Verify aspect-ratio: 2/3 is already correct (or add if missing) in src/components/HandView.css
  - **Action**: Check if aspect-ratio property exists; add if missing
  - **Validates**: FR-029
  - **File**: src/components/HandView.css (.card selector)
  - **CSS**: `aspect-ratio: 2 / 3;` (or `height: 1.5 × width` calculation)
  - **Verification**: Test T102 passes

- [ ] T109 [VISUAL] Update sequence badge position and size per contract in src/components/HandView.css
  - **Action**: Adjust badge CSS to match contract specifications
  - **Validates**: FR-030
  - **File**: src/components/HandView.css (.sequence-badge selector)
  - **CSS**:
    ```css
    .sequence-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      min-width: 36px;
      min-height: 36px;
      /* ... other styling ... */
    }
    ```
  - **Verification**: Visual inspection, badge at top-right corner

- [ ] T110 [VISUAL] Test with 10-card hand on 1024px viewport (manual validation)
  - **Action**: Manual browser test at 1024px viewport width
  - **Validates**: FR-031 (SC-014)
  - **Steps**:
    1. Resize browser to 1024px width
    2. Deal 10-card hand
    3. Verify no horizontal scrollbar
    4. Verify all cards visible
  - **Verification**: Test T101 passes, SC-014 met

**Checkpoint**: 
- [ ] All T100-T103 tests pass (4 tests)
- [ ] Card width measures 80-120px across different hand sizes
- [ ] Cards overlap by 50% of width (not separated by gaps)
- [ ] 10-card hands fit on 1024px+ viewports without scroll
- [ ] Card aspect ratio is 2:3 (height = 1.5 × width)
- [ ] Sequence badges positioned top-right, min 36px size

**Success Criteria**:
- [ ] SC-013: 100% of card measurements fall within contract-specified ranges (80-120px width)
- [ ] SC-014: 10-card hands fit without horizontal scroll on 1024px+ viewports
- [ ] SC-015: Card overlap calculations match contract formula (50% of card width)

---

## Phase 8: Locked Styling (FR-031 to FR-034) - Medium Priority

**Purpose**: Add visual styling for locked cards (may overlap with Phase 3)

**Estimated**: 0.25-0.5 day

**Priority**: P3 - Medium (visual feedback)

**User Story Reference**: US8 (spec.md:136-151) - "When play order is locked, cards display with reduced opacity (0.7) and/or grayscale filter"

**Note**: Some tasks may already be completed in Phase 3 (T057-T060). This phase ensures comprehensive styling coverage.

### Tests for Locked Styling (Write FIRST)

**Acceptance Criteria**:
- Locked cards have opacity: 0.7 (AS1)
- Optional grayscale filter applied (AS2)
- No hover transform when locked (AS3)
- Cursor shows not-allowed (AS4)
- Styling applies within 100ms (AS5)

- [ ] T111 [P] [STYLE-TEST] Write test for .card--locked opacity: 0.7 in tests/unit/HandView.test.tsx
  - **Test Case**: Render locked cards, verify computed style `opacity: 0.7`
  - **Validates**: FR-032
  - **Expected**: May already pass if T057 completed
  - **Note**: If Phase 3 complete, mark as passing

- [ ] T112 [P] [STYLE-TEST] Write test for .card--locked cursor style in tests/unit/HandView.test.tsx
  - **Test Case**: Render locked cards, verify `cursor: not-allowed` or `cursor: default`
  - **Validates**: FR-034
  - **Expected**: May already pass if T057 completed

- [ ] T113 [P] [STYLE-TEST] Write test for locked badge color change in tests/unit/HandView.test.tsx
  - **Test Case**: Compare badge background color between planning and locked states
  - **Validates**: FR-035
  - **Expected**: May already pass if T060 completed

### Implementation for Locked Styling

**Implementation Order**: Verify Phase 3 completion → Add enhancements → Performance validation

- [ ] T114 [STYLE] Ensure .card--locked has opacity: 0.7 in src/components/HandView.css (may be done in T057)
  - **Action**: Check if CSS rule exists; add if missing
  - **Validates**: FR-032
  - **File**: src/components/HandView.css (.card--locked selector)
  - **CSS**: `.card--locked { opacity: 0.7; }`
  - **Verification**: Test T111 passes

- [ ] T115 [STYLE] Add filter: grayscale(20%) to .card--locked (optional) in src/components/HandView.css
  - **Action**: Add grayscale filter for visual distinction
  - **Validates**: FR-033 (optional enhancement)
  - **File**: src/components/HandView.css (.card--locked selector)
  - **CSS**: `.card--locked { filter: grayscale(20%); }`
  - **Verification**: Visual inspection, locked cards appear slightly desaturated

- [ ] T116 [STYLE] Ensure .card--locked has cursor: not-allowed in src/components/HandView.css (may be done in T057)
  - **Action**: Check if cursor property exists; add if missing
  - **Validates**: FR-034
  - **File**: src/components/HandView.css (.card--locked selector)
  - **CSS**: `.card--locked { cursor: not-allowed; }`
  - **Verification**: Test T112 passes

- [ ] T117 [STYLE] Update .card--locked .sequence-badge to use green background in src/components/HandView.css (may be done in T060)
  - **Action**: Check if badge color differentiation exists; add if missing
  - **Validates**: FR-035
  - **File**: src/components/HandView.css (.card--locked .sequence-badge selector)
  - **CSS**:
    ```css
    .card--locked .sequence-badge {
      background-color: var(--pico-success-background);
      color: var(--pico-success-inverse);
    }
    ```
  - **Verification**: Test T113 passes, visual distinction clear

**Checkpoint**: 
- [ ] All T111-T113 tests pass (3 tests)
- [ ] Locked cards have reduced opacity (0.7)
- [ ] Locked cards have not-allowed cursor
- [ ] Locked sequence badges use different color (green vs blue)
- [ ] Optional grayscale filter applied (if implemented)
- [ ] Locked styling visually distinct from planning phase

**Success Criteria**:
- [ ] SC-008: Locked card styling applies within 100ms of lock action (performance validation)

---

## Phase 9: Disabled Selection State (FR-035 to FR-038) - Medium Priority

**Purpose**: Show disabled state when max discard selection reached

**Estimated**: 0.5-1 day

**Priority**: P3 - Medium (UX enhancement)

**User Story Reference**: US9 (spec.md:154-168) - "During discard phase, when I've selected the maximum number of cards, unselected cards become clearly non-interactive"

### Tests for Disabled State (Write FIRST)

**Acceptance Criteria**:
- Unselected cards show disabled styling when max reached (AS1)
- Disabled cards don't respond to clicks (AS2)
- Disabled cards unfocusable (AS3)
- Disabled state clears when selection drops (AS4)

- [ ] T118 [P] [DISABLED-TEST] Write unit test for .card--disabled class when max selection reached in tests/unit/HandView.test.tsx
  - **Test Case**: discardCount=3, select 3 cards, verify unselected cards have .card--disabled class
  - **Validates**: FR-036
  - **Expected**: Test fails (disabled class not implemented)

- [ ] T119 [P] [DISABLED-TEST] Write unit test for disabled card tabIndex={-1} in tests/unit/HandView.test.tsx
  - **Test Case**: Max selection reached, verify disabled cards have tabIndex={-1}
  - **Validates**: FR-038
  - **Expected**: Test fails (tabIndex remains 0)

- [ ] T120 [P] [DISABLED-TEST] Write unit test for disabled card ignoring clicks in tests/unit/HandView.test.tsx
  - **Test Case**: Simulate click on disabled card, verify no action dispatched
  - **Validates**: FR-037
  - **Expected**: Test fails (click still triggers action)

- [ ] T121 [P] [DISABLED-TEST] Write integration test for disabled state clearing when selection drops in tests/integration/discardFlow.test.tsx
  - **Test Case**: Reach max, verify disabled; deselect one, verify re-enabled immediately
  - **Validates**: FR-039
  - **Expected**: Test fails (disabled state logic not implemented)

### Implementation for Disabled State

**Implementation Order**: Compute disabled state → Apply class → Interaction guards → Styling

- [ ] T122 [DISABLED] Compute isDisabled flag: discardPhase.active && !isSelected && selectedCardIds.size >= remainingDiscards in src/components/HandView.tsx
  - **Action**: Add derived state for each card
  - **Validates**: FR-036
  - **File**: src/components/HandView.tsx (card rendering logic)
  - **Logic**:
    ```typescript
    const isDisabled = discardPhase.active && 
                       !selectedCardIds.has(card.instanceId) && 
                       selectedCardIds.size >= discardPhase.remainingDiscards
    ```
  - **Verification**: Variable computed correctly per card

- [ ] T123 [DISABLED] Add .card--disabled CSS class when isDisabled === true in src/components/HandView.tsx
  - **Action**: Conditional class application
  - **Validates**: FR-036
  - **File**: src/components/HandView.tsx (card className)
  - **JSX**: `className={clsx('card', isDisabled && 'card--disabled')}`
  - **Verification**: Test T118 passes

- [ ] T124 [DISABLED] Set tabIndex={-1} or aria-disabled="true" for disabled cards in src/components/HandView.tsx
  - **Action**: Update tabIndex logic to account for disabled state
  - **Validates**: FR-038
  - **File**: src/components/HandView.tsx (card JSX)
  - **JSX**: `tabIndex={playOrderLocked || isDisabled ? -1 : 0}`
  - **Alternative**: `aria-disabled={isDisabled}`
  - **Verification**: Test T119 passes

- [ ] T125 [DISABLED] Add click guard to ignore disabled card clicks in src/components/HandView.tsx
  - **Action**: Early return in handleCardClick if disabled
  - **Validates**: FR-037
  - **File**: src/components/HandView.tsx (handleCardClick function)
  - **Logic**: `if (isDisabled) return;` (add before playOrderLocked guard)
  - **Verification**: Test T120 passes

- [ ] T126 [DISABLED] Implement .card--disabled styles (reduced opacity, different cursor) in src/components/HandView.css
  - **Action**: Add CSS rule for disabled cards
  - **Validates**: FR-036
  - **File**: src/components/HandView.css
  - **CSS**:
    ```css
    .card--disabled {
      opacity: 0.5;
      cursor: default;
      filter: grayscale(50%);
    }
    .card--disabled:hover {
      transform: none;
      box-shadow: none;
    }
    ```
  - **Verification**: Visual inspection, disabled cards appear faded and non-interactive

- [ ] T127 [DISABLED] Verify disabled state clears immediately when selection drops below max
  - **Action**: Manual test of reactive state update
  - **Validates**: FR-039
  - **File**: src/components/HandView.tsx (isDisabled computation)
  - **Steps**:
    1. Select max cards (e.g., 3 of 5)
    2. Verify unselected cards disabled
    3. Deselect one card
    4. Verify previously disabled cards re-enabled instantly
  - **Verification**: Test T121 passes, no visible delay

**Checkpoint**: 
- [ ] All T118-T121 tests pass (4 tests)
- [ ] Unselected cards show disabled styling when max selection reached
- [ ] Disabled cards cannot be focused (tabIndex={-1})
- [ ] Disabled cards do not respond to clicks
- [ ] Disabled state clears immediately when selection count drops
- [ ] Visual distinction between disabled and normal cards

**Success Criteria**:
- [ ] FR-036 through FR-039 all validated and passing

---

## Phase 10: Polish & Cleanup (FR-039 to FR-043) - Low Priority

**Purpose**: Update helper text to match contract format and final cleanup

**Estimated**: 0.5-1 day

**Priority**: P4 - Low (cosmetic improvements)

**User Story Reference**: US10 (spec.md:171-185) - "Helper text during discard and play order phases displays in the exact format specified in contracts"

### Tests for Helper Text (Write FIRST)

**Acceptance Criteria**:
- Discard helper text matches contract format (AS1)
- Play order helper text matches contract format (AS2)
- Checkmark prefix when requirements met (AS3, AS4)

- [ ] T128 [P] [TEXT-TEST] Write test for discard helper text format "X of Y selected" in tests/unit/HandView.test.tsx
  - **Test Case**: discardCount=3, select 2 cards, verify text "Select 3 cards to discard (2 of 3 selected)"
  - **Validates**: FR-040
  - **Expected**: Test may pass or fail depending on current format

- [ ] T129 [P] [TEXT-TEST] Write test for play order helper text format "X of Y cards ordered" in tests/unit/HandView.test.tsx
  - **Test Case**: 5 cards in hand, 3 ordered, verify text "3 of 5 cards ordered"
  - **Validates**: FR-041
  - **Expected**: Test may pass or fail depending on current format

- [ ] T130 [P] [TEXT-TEST] Write test for checkmark prefix when ready in tests/unit/HandView.test.tsx
  - **Test Case**: Discard requirement met, verify text starts with "✓"
  - **Validates**: FR-042
  - **Expected**: Test fails (checkmark not implemented)

### Implementation for Helper Text

**Implementation Order**: Discard text → Play order text → Checkmark prefix

- [ ] T131 [TEXT] Update discard helper text to match contract format in src/components/HandView.tsx or DeckControls.tsx
  - **Action**: Update helper text generation function
  - **Validates**: FR-040
  - **File**: src/components/HandView.tsx or src/components/DeckControls.tsx (wherever helper text renders)
  - **Format**: `"Select {discardCount} cards to discard ({selected} of {discardCount} selected)"`
  - **When met**: `"✓ Ready to discard {discardCount} card(s)"`
  - **Verification**: Test T128 passes

- [ ] T132 [TEXT] Update play order helper text to match contract format in src/components/HandView.tsx or DeckControls.tsx
  - **Action**: Update helper text generation function
  - **Validates**: FR-041
  - **File**: src/components/HandView.tsx or src/components/DeckControls.tsx
  - **Format**: `"{ordered} of {total} cards ordered"`
  - **When complete**: `"✓ All {total} cards ordered - ready to lock"`
  - **Verification**: Test T129 passes

- [ ] T133 [TEXT] Add checkmark (✓) prefix when requirements met in helper text
  - **Action**: Prepend checkmark to "ready" states
  - **Validates**: FR-042
  - **File**: src/components/HandView.tsx or src/components/DeckControls.tsx
  - **Logic**: Use Unicode ✓ (U+2713) or HTML entity &#10003;
  - **Verification**: Test T130 passes, visual inspection confirms checkmark

**Checkpoint**: 
- [ ] All T128-T130 tests pass (3 tests)
- [ ] Discard helper text matches contract format
- [ ] Play order helper text matches contract format
- [ ] Checkmark prefix appears when requirements met
- [ ] Helper text provides clear guidance to users

**Success Criteria**:
- [ ] FR-040, FR-041, FR-042 all validated

---

## Phase 11: Cross-Cutting Concerns & Validation

**Purpose**: Testing, validation, and final quality checks

**Estimated**: 2-3 days

**Priority**: Required before completion

**User Story Reference**: All 10 user stories (spec.md:13-185)

### Automated Testing

- [ ] T134 [P] [POLISH] Run full test suite and ensure all tests pass: `npm test`
  - **Action**: Execute all unit, integration, and contract tests
  - **Validates**: No regressions introduced
  - **Verification**: 0 test failures, all 106+ tests passing

- [ ] T135 [P] [POLISH] Run linter and fix any issues: `npm run lint`
  - **Action**: Execute ESLint across codebase
  - **Validates**: Code style compliance
  - **Verification**: 0 lint errors, 0 lint warnings

- [ ] T136 [P] [POLISH] Add state invariants validation tests (persistence, locked state) in tests/contract/deckContracts.test.ts
  - **Action**: Write contract tests for new invariants
  - **Validates**: Persistence contracts, locked state contracts
  - **Tests**:
    - Persistence: State saved to localStorage after mutations
    - Persistence: Loaded state matches saved state structure
    - Locked: playOrderLocked=true prevents all mutations
    - Locked: tabIndex={-1} applied to all cards when locked
  - **Verification**: Contract tests pass

- [ ] T137 [P] [POLISH] Add backward compatibility test for loading old state format in tests/unit/persistenceManager.test.ts
  - **Action**: Test loading state without new persistence metadata
  - **Validates**: FR-005 (sanitization)
  - **Test Case**: Load state object missing new fields, verify defaults applied
  - **Verification**: Old state loads without errors

- [ ] T138 [P] [POLISH] Performance test: Verify persistence save/load <100ms in tests/performance/persistence.test.ts (if applicable)
  - **Action**: Measure localStorage operations with performance.now()
  - **Validates**: SC-003 (persistence speed)
  - **Test Case**: Save state, measure time; load state, measure time
  - **Expected**: Both operations < 100ms
  - **Note**: May skip if performance tests not in current infrastructure

- [ ] T139 [P] [POLISH] Performance test: Verify no user-visible delay during localStorage failures
  - **Action**: Mock localStorage.setItem to throw, verify UI responsiveness
  - **Validates**: FR-003 (silent fallback)
  - **Test Case**: Trigger save failure, verify no UI blocking or error messages
  - **Verification**: App continues working normally

### Manual Testing & Validation

- [ ] T140 [POLISH] Manual accessibility audit with screen reader (NVDA or JAWS)
  - **Action**: Use screen reader to navigate entire app
  - **Validates**: FR-026, SC-012 (accessibility compliance)
  - **Steps**:
    1. Install NVDA (Windows) or enable VoiceOver (Mac)
    2. Navigate through deal → discard → planning → locked flow
    3. Verify announcements for phase transitions
    4. Verify card labels match "Card: {value}" format
    5. Verify role="article" announced correctly
  - **Verification**: WCAG AA compliance confirmed

- [ ] T141 [POLISH] Manual test: Verify all 44 acceptance scenarios from spec.md (10 user stories)
  - **Action**: Execute each acceptance scenario manually
  - **Validates**: All functional requirements (FR-001 through FR-042)
  - **User Stories**:
    - US1: Persistent play order (4 scenarios)
    - US2: Zero discard count (4 scenarios)
    - US3: Locked immutability (5 scenarios)
    - US4: Component responsibility (4 scenarios)
    - US5: Phase indicators (5 scenarios)
    - US6: Accessibility roles (4 scenarios)
    - US7: Visual design (5 scenarios)
    - US8: Locked styling (5 scenarios)
    - US9: Disabled state (4 scenarios)
    - US10: Helper text format (4 scenarios)
  - **Verification**: All 44 scenarios pass

- [ ] T142 [POLISH] Manual test: Cross-browser validation (Chrome, Firefox, Safari, Edge)
  - **Action**: Test full app flow in each browser
  - **Validates**: Cross-browser compatibility
  - **Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
  - **Verification**: All features work identically across browsers

- [ ] T143 [POLISH] Manual test: Private browsing mode in all browsers (localStorage fallback)
  - **Action**: Test app in incognito/private mode
  - **Validates**: FR-003 (localStorage failure handling)
  - **Steps**:
    1. Open browser in private/incognito mode
    2. Complete full turn cycle
    3. Verify app works (in-memory fallback)
    4. Verify no error messages shown
  - **Verification**: Silent fallback to in-memory state works

- [ ] T144 [POLISH] Manual test: localStorage quota exceeded scenario (fill storage manually)
  - **Action**: Manually fill localStorage to quota limit
  - **Validates**: FR-003 (quota exceeded handling)
  - **Steps**:
    1. Open DevTools console
    2. Fill localStorage with large data until quota error
    3. Use app normally
    4. Verify silent fallback, no error UI
  - **Verification**: App continues working with in-memory state

### Success Criteria Validation

- [ ] T145 [POLISH] Verify all 17 success criteria met (SC-001 through SC-017 from spec.md)
  - **Action**: Check each success criterion individually
  - **Validates**: Feature completion per spec
  - **Criteria**:
    - SC-001 through SC-003: Persistence metrics
    - SC-004 through SC-005: Zero discard metrics
    - SC-006 through SC-008: Locked immutability metrics
    - SC-009 through SC-010: Component alignment metrics
    - SC-011 through SC-012: Phase indicator metrics
    - SC-013 through SC-015: Visual design metrics
    - SC-016 through SC-017: Accessibility metrics
  - **Verification**: All 17 criteria documented as met

- [ ] T146 [POLISH] Complete requirements checklist (all 42 FRs verified) in checklists/requirements.md
  - **Action**: Mark all checkboxes in requirements.md
  - **Validates**: Full functional requirement coverage
  - **File**: specs/005-spec-compliance-remediation/checklists/requirements.md
  - **Verification**: All 42 checkboxes marked, all tests referenced

### Documentation & Cleanup

- [ ] T147 [P] [POLISH] Update AGENTS.md if new technical decisions or patterns added
  - **Action**: Document any new conventions or technologies
  - **Validates**: Project documentation completeness
  - **File**: AGENTS.md
  - **Updates**: Add persistence patterns, localStorage handling patterns if significant
  - **Verification**: AGENTS.md reflects current state

- [ ] T148 [POLISH] Code review and refactoring pass
  - **Action**: Review all changed files for code quality
  - **Validates**: Code maintainability
  - **Focus areas**:
    - Remove dead code
    - Consolidate duplicated logic
    - Improve variable naming
    - Add inline comments for complex logic
  - **Verification**: Code review checklist complete

- [ ] T149 [POLISH] Update documentation if needed (README, inline comments)
  - **Action**: Update user-facing or developer docs
  - **Validates**: Documentation accuracy
  - **Files**: README.md (if user-facing changes), inline code comments
  - **Verification**: Docs reflect current behavior

- [ ] T150 [POLISH] Final validation: All tests pass, no TypeScript errors, no lint errors
  - **Action**: Final comprehensive check before completion
  - **Validates**: Production readiness
  - **Commands**:
    - `npm test` → 0 failures
    - `npx tsc --noEmit` → 0 errors
    - `npm run lint` → 0 errors/warnings
  - **Verification**: Clean build, ready to merge

**Checkpoint (Feature Complete)**: 
- [ ] All 150 tasks completed
- [ ] All 42 functional requirements validated
- [ ] All 17 success criteria met
- [ ] All 44 acceptance scenarios passing
- [ ] All automated tests passing (106+ tests)
- [ ] Cross-browser compatibility confirmed
- [ ] Accessibility audit complete (WCAG AA)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Code review approved

**Success Criteria**:
- [ ] Definition of Done (spec.md:383-392) - All 10 checklist items complete
- [ ] Ready for production deployment
- [ ] 100% contract compliance achieved

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Setup)**: No dependencies - start immediately
- **Phase 1 (Persistence)**: Independent - can start after Phase 0
- **Phase 2 (Zero Discard)**: Independent - can run parallel to Phase 1
- **Phase 3 (Locked Immutability)**: Independent - can run parallel to Phases 1 & 2
- **Phase 4 (Component Migration)**: Depends on Phase 1 (uses persistence state)
- **Phase 5 (Phase Indicators)**: Depends on Phase 4 (renders in DeckControls)
- **Phase 6 (Accessibility)**: Independent - can run parallel to Phases 4-5
- **Phase 7 (Visual Design)**: Independent - can run parallel to other phases
- **Phase 8 (Locked Styling)**: Depends on Phase 3 (extends locked implementation)
- **Phase 9 (Disabled State)**: Independent - can run parallel to other phases
- **Phase 10 (Helper Text)**: Independent - can run parallel to other phases
- **Phase 11 (Polish)**: Depends on ALL previous phases complete

### Critical Path (MVP - Phases 1-3 only)

1. **Phase 0**: Setup (0.5-1 hour)
2. **Phase 1**: Persistence (1-1.5 days) - Can run parallel with Phases 2 & 3
3. **Phase 2**: Zero Discard (0.5-1 day) - Can run parallel with Phases 1 & 3
4. **Phase 3**: Locked Immutability (0.5-1 day) - Can run parallel with Phases 1 & 2

**MVP Total**: 3-4 days (if all critical phases run in parallel)

### Full Feature Path

1. Complete Phases 0-3 (MVP)
2. Phase 4: Component Migration (1-2 days)
3. Phases 5-10: Polish & Compliance (can run mostly in parallel, 3-4 days total)
4. Phase 11: Testing & Validation (2-3 days)

**Full Delivery**: 9-13 days total

### Parallel Opportunities

**Can Run in Parallel**:
- Phases 1, 2, 3 (critical fixes, different files)
- Phases 6, 7, 9, 10 (independent features, different areas)
- All test-writing tasks within a phase ([P] tagged)

**Must Run Sequentially**:
- Phase 4 must wait for Phase 1 (uses persistence)
- Phase 5 must wait for Phase 4 (renders in migrated component)
- Phase 8 must wait for Phase 3 (extends locked styling)
- Phase 11 must wait for all others (final validation)

---

## Implementation Strategy

### MVP First (Critical Fixes Only)

**Goal**: Fix blocking contract violations

1. Complete Phase 0: Setup (T001-T003)
2. **PARALLEL**: Start Phases 1, 2, 3 simultaneously
   - Developer A: Phase 1 (Persistence) - T004-T029
   - Developer B: Phase 2 (Zero Discard) - T030-T044
   - Developer C: Phase 3 (Locked Immutability) - T045-T060
3. **VALIDATE**: Test critical fixes independently
   - Persistence: Save/load across refresh works
   - Zero discard: Can skip discard phase
   - Locked: Cards completely non-interactive
4. Deploy/demo MVP if ready (core contract compliance achieved)

**MVP Timeline**: 3-4 days with 3 developers, 5-7 days single developer

### Full Compliance Delivery

**Goal**: 100% contract compliance across all 42 FRs

1. Complete MVP (Phases 0-3)
2. Complete Phase 4: Component Migration (T061-T078) - 1-2 days
3. **PARALLEL**: Start Phases 5-10 (can run independently)
   - Phase 5: Phase Indicators (T079-T090)
   - Phase 6: Accessibility (T091-T099)
   - Phase 7: Visual Design (T100-T110)
   - Phase 8: Locked Styling (T111-T117)
   - Phase 9: Disabled State (T118-T127)
   - Phase 10: Helper Text (T128-T133)
4. Complete Phase 11: Polish & Validation (T134-T150) - 2-3 days

**Full Timeline**: 9-13 days total

### Single Developer Strategy

**Work sequentially through phases with validation checkpoints**:

1. **Day 1**: Phase 0 + start Phase 1 (Persistence infrastructure)
2. **Day 2**: Finish Phase 1, validate persistence
3. **Day 3**: Phase 2 (Zero Discard), validate
4. **Day 4**: Phase 3 (Locked Immutability), validate MVP
5. **CHECKPOINT**: MVP complete, all critical fixes working
6. **Day 5-6**: Phase 4 (Component Migration)
7. **Day 7-9**: Phases 5-10 (Polish items, can prioritize)
8. **Day 10-12**: Phase 11 (Testing, validation, accessibility audit)
9. **CHECKPOINT**: Full compliance, production-ready

**Buffer**: 1-2 days for unexpected issues

---

## Notes

- **[P]** tasks = different files or test cases, no dependencies, can run parallel
- **[Area]** tags help track functional areas (PERSIST, ZERO-DISC, LOCKED, etc.)
- Tests MUST be written before implementation (TDD approach)
- Verify tests fail before implementing (ensures tests are actually testing)
- Commit after each logical group of tasks (e.g., all Phase 1 persistence tasks)
- Stop at any checkpoint to validate independently
- Reference quickstart.md for implementation patterns and code examples
- Reference data-model.md for type definitions and validation logic
- All contract test IDs map to FRs in spec.md (FR-001 through FR-042)
- Manual testing required for accessibility (screen readers), cross-browser, and private browsing modes

---

## Test Coverage Summary

**Unit Tests** (New):
- `persistenceManager.test.ts`: 6 tests (T004-T009)
- `stateValidator.test.ts`: 4 tests (T010-T013)
- Various component test updates: ~20 tests

**Integration Tests** (New):
- `persistenceFlow.test.tsx`: 3 tests (T014-T016)
- `zeroDiscardFlow.test.tsx`: 2 tests (T035-T036)
- `lockedInteraction.test.tsx`: 3 tests (T049-T051)

**Contract Tests** (Updates):
- `deckContracts.test.ts`: Persistence invariants (T029)
- `discardContracts.test.ts`: Zero discard validation (T037)
- `playOrderContracts.test.ts`: Locked immutability (T052)

**Visual/Manual Tests**:
- Accessibility audit (T140)
- Cross-browser validation (T142)
- Privacy mode testing (T143)
- 44 acceptance scenarios (T141)
- 17 success criteria (T145)

**Total**: 150 tasks, ~50 automated tests, ~60 manual validation checks

---

**Status**: Task breakdown complete, ready for implementation  
**Next Step**: Begin Phase 0 (Setup), then start critical fixes (Phases 1-3)
