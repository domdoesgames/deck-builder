# Tasks: Card Discard Mechanic (Feature 003)

**Feature**: 003-card-discard-mechanic  
**Input**: Design documents from `/specs/003-card-discard-mechanic/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md (plan.md references research.md, data-model.md, contracts/ - to be created in Phase 0-1)

**Tests**: Tests are included per feature specification requirements (FR-001 to FR-014, SC-001 to SC-005)

**Organization**: Tasks are grouped by phase to enable systematic implementation: Setup → Foundational → User Stories → Polish

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3) or FND (Foundational), SET (Setup), POL (Polish)
- Include exact file paths in descriptions

---

## Phase 0: Research (1-2 hours)

**Purpose**: Investigate selection patterns, keyboard navigation, and state persistence strategies per plan.md Phase 0

- [X] T001 [P] Research browser support for `crypto.randomUUID()` (MDN, caniuse.com); document fallback strategy for older browsers
- [X] T002 [P] Research React keyboard event patterns for Tab + Space/Enter navigation; document synthetic event handling approach
- [X] T003 [P] Examine existing state persistence in `src/hooks/useDeckState.ts` and `src/state/deckReducer.ts`; identify localStorage pattern (if any)
- [X] T004 [P] Research CSS selection feedback patterns (border, opacity, checkmark, transform); document accessibility considerations
- [X] T005 [P] Research focus management for keyboard users (focus rings, focus-visible, aria-pressed); document WCAG requirements
- [X] T006 Create `specs/003-card-discard-mechanic/research.md` consolidating findings from T001-T005 with recommendations

**Checkpoint**: Research complete → Proceed to Phase 1 Design

---

## Phase 1: Design (2-3 hours)

**Purpose**: Define contracts, data model, and quickstart guide per plan.md Phase 1

- [X] T007 [P] Create `specs/003-card-discard-mechanic/data-model.md` defining CardInstance type, DeckState extensions, selection state diagram, phase transition flowchart
- [X] T008 [P] Create `specs/003-card-discard-mechanic/contracts/` directory
- [X] T009 Create `specs/003-card-discard-mechanic/contracts/discard-phase.contract.md` defining phase activation rules (when discardCount > 0), completion conditions (selectedCardIds.size === effectiveDiscardCount), edge cases (0 count, equals hand size, exceeds hand size)
- [X] T010 Create `specs/003-card-discard-mechanic/contracts/card-selection.contract.md` defining selection toggle logic (add if not present, remove if present), max limit enforcement (prevent selection when size === discardCount), deselection behavior
- [X] T011 Create `specs/003-card-discard-mechanic/quickstart.md` with step-by-step developer guide: 1) Add CardInstance type, 2) Extend DeckState, 3) Implement actions, 4) Update components, 5) Add CSS, 6) Test

**Checkpoint**: Design complete → Proceed to Phase 2 Implementation Tasks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core logic & structural code needed before user stories. No user story tasks may start until these complete.

### Type System & Data Model

- [X] T012 [P] FND Create `src/lib/cardInstance.ts` with `generateCardInstance(value: string): CardInstance` function using `crypto.randomUUID()` with fallback to `Date.now() + Math.random()` for unique IDs
- [X] T013 [P] FND Update `src/lib/types.ts`: Add `CardInstance` interface with `id: string` and `value: string` fields
- [X] T014 FND Update `src/lib/types.ts`: Add `handCards: CardInstance[]` field to `DeckState` (keep deprecated `hand: string[]` for backward compatibility)
- [X] T015 FND Update `src/lib/types.ts`: Add `selectedCardIds: Set<string>` field to `DeckState`
- [X] T016 FND Update `src/lib/types.ts`: Add `discardPhase: boolean` field to `DeckState`
- [X] T017 FND Update `src/lib/types.ts`: Add `TOGGLE_CARD_SELECTION` action type with `payload: string` (card ID)
- [X] T018 FND Update `src/lib/types.ts`: Add `CONFIRM_DISCARD` action type (no payload)

### Test Setup (Write FIRST, ensure FAIL)

- [X] T019 [P] FND Create `tests/unit/cardInstance.test.ts` with 3 tests: 1) generateCardInstance creates unique IDs, 2) preserves card value, 3) multiple calls produce different IDs (all should FAIL initially)
- [X] T020 [P] FND Update `tests/unit/deckReducer.test.ts`: Add placeholder test `test.todo('TOGGLE_CARD_SELECTION adds card ID to selectedCardIds')`
- [X] T021 [P] FND Update `tests/unit/deckReducer.test.ts`: Add placeholder test `test.todo('TOGGLE_CARD_SELECTION removes card ID if already selected')`
- [X] T022 [P] FND Update `tests/unit/deckReducer.test.ts`: Add placeholder test `test.todo('TOGGLE_CARD_SELECTION prevents exceeding discard count')`
- [X] T023 [P] FND Update `tests/unit/deckReducer.test.ts`: Add placeholder test `test.todo('CONFIRM_DISCARD moves selected cards to discard pile')`
- [X] T024 [P] FND Update `tests/unit/deckReducer.test.ts`: Add placeholder test `test.todo('DEAL_NEXT_HAND enters discard phase when discardCount > 0')`

### State Management Implementation

- [X] T025 FND Implement `src/lib/cardInstance.ts`: Write `generateCardInstance()` function with UUID generation and fallback
- [X] T026 FND Update `src/state/deckReducer.ts`: Add `TOGGLE_CARD_SELECTION` case in reducer switch statement
- [X] T027 FND Implement selection toggle logic in `deckReducer.ts`: Check if card ID exists in `selectedCardIds` Set; if yes, remove (deselect); if no and size < discardCount, add (select); else ignore (max limit reached)
- [X] T028 FND Update `src/state/deckReducer.ts`: Add `CONFIRM_DISCARD` case in reducer switch statement
- [X] T029 FND Implement discard confirmation logic in `deckReducer.ts`: 1) Filter `handCards` to separate selected/remaining, 2) Add selected card values to `discardPile`, 3) Clear `selectedCardIds` Set, 4) Set `discardPhase: false`, 5) Update `handCards` to remaining cards
- [X] T030 FND Update `dealNextHand()` function in `src/state/deckReducer.ts`: Generate `CardInstance` objects using `generateCardInstance()` instead of plain strings; populate `handCards` array
- [X] T031 FND Update `dealNextHand()` function in `src/state/deckReducer.ts`: Set `discardPhase: true` when `discardCount > 0` after dealing
- [X] T032 FND Update `dealNextHand()` function in `src/state/deckReducer.ts`: Set `discardPhase: false` when `discardCount === 0` (skip discard phase per FR-009)
- [X] T033 FND Update `dealNextHand()` function in `src/state/deckReducer.ts`: Initialize `selectedCardIds` as empty Set after dealing new hand (clear previous selections per A1)
- [X] T034 FND Update `endTurn()` function in `src/state/deckReducer.ts`: Prevent turn end if `discardPhase === true` (return current state unchanged per FR-005)
- [X] T035 FND Update `initializeDeck()` function in `src/state/deckReducer.ts`: Initialize `handCards: []`, `selectedCardIds: new Set()`, `discardPhase: false` in initial state
- [X] T036 FND Update deprecated `hand` field sync in `src/state/deckReducer.ts`: Map `handCards` to `hand` (extract `.value`) in all state returns for backward compatibility

### Hook Updates

- [X] T037 FND Update `src/hooks/useDeckState.ts`: Add `toggleCardSelection(cardId: string)` function dispatching `TOGGLE_CARD_SELECTION` action
- [X] T038 FND Update `src/hooks/useDeckState.ts`: Add `confirmDiscard()` function dispatching `CONFIRM_DISCARD` action
- [X] T039 FND Update `src/hooks/useDeckState.ts`: Export new functions in return object

**Checkpoint**: Foundation complete → User stories may proceed

---

## Phase 3: User Story 1 - Basic Card Discard (Priority: P1) 🎯 MVP

**Goal**: Enable core discard mechanic: select required number of cards, confirm discard, cards move to discard pile

**Independent Test**: Deal hand with discardCount=3, select 3 cards, confirm, verify cards removed from hand and added to discard pile

### Tests for User Story 1 (write FIRST)

- [X] T040 [P] US1 Update `tests/unit/deckReducer.test.ts`: Replace T020 placeholder with full test for TOGGLE_CARD_SELECTION adding card ID
- [X] T041 [P] US1 Update `tests/unit/deckReducer.test.ts`: Replace T023 placeholder with full test for CONFIRM_DISCARD moving cards
- [X] T042 [P] US1 Update `tests/unit/deckReducer.test.ts`: Replace T024 placeholder with full test for DEAL_NEXT_HAND entering discard phase
- [X] T043 [P] US1 Create `tests/integration/discardFlow.test.tsx`: Full flow test - mount app, deal hand, select required cards via click, confirm discard, verify hand state and discard pile state
- [X] T044 [P] US1 Create `tests/contract/discardContracts.test.ts`: Verify FR-001 (discard phase after deal when count > 0), FR-005 (block turn end during phase), FR-008 (cards move to discard pile)

### Implementation for User Story 1

- [X] T045 US1 Update `src/components/DeckControls.tsx`: Import `confirmDiscard` and `toggleCardSelection` from useDeckState hook
- [X] T046 US1 Update `src/components/DeckControls.tsx`: Add "Discard Selected Cards" button below "End Turn" button
- [X] T047 US1 Update `src/components/DeckControls.tsx`: Disable "Discard" button when `selectedCardIds.size !== effectiveDiscardCount` (calculate effective as `Math.min(discardCount, handCards.length)`)
- [X] T048 US1 Update `src/components/DeckControls.tsx`: Add `onClick` handler to "Discard" button calling `confirmDiscard()`
- [X] T049 US1 Update `src/components/DeckControls.tsx`: Disable "End Turn" button when `discardPhase === true` per FR-005
- [X] T050 US1 Update `src/components/DeckControls.tsx`: Add visual indicator (e.g., tooltip or helper text) showing "Complete discard phase to end turn" when button disabled
- [X] T051 US1 Update `src/components/HandView.tsx`: Import `toggleCardSelection` from useDeckState hook
- [X] T052 US1 Update `src/components/HandView.tsx`: Map over `handCards` instead of deprecated `hand` array
- [X] T053 US1 Update `src/components/HandView.tsx`: Add `onClick` handler to each card calling `toggleCardSelection(card.id)`
- [X] T054 US1 Update `src/components/HandView.tsx`: Add conditional CSS class `.selected` to cards when `selectedCardIds.has(card.id)` returns true
- [X] T055 US1 Update `src/components/HandView.tsx`: Display card value using `card.value` instead of plain string
- [X] T056 US1 Update `src/components/HandView.tsx`: Add `aria-pressed={selectedCardIds.has(card.id)}` to each card for accessibility
- [X] T057 US1 Update `tests/unit/HandView.test.tsx`: Update existing tests to use `handCards` array structure instead of `hand` strings

**Checkpoint**: US1 independently functional - can select and discard cards, tests pass

---

## Phase 4: User Story 2 - Card Selection Toggle (Priority: P2)

**Goal**: Users can select and deselect cards, visual feedback shows selection state, enforce max selection limit

**Independent Test**: Select card (verify selected), click again (verify deselected), select max count (verify 4th card unselectable)

### Tests for User Story 2

- [ ] T058 [P] US2 Update `tests/unit/deckReducer.test.ts`: Replace T021 placeholder with full test for TOGGLE_CARD_SELECTION removing card ID (deselect)
- [ ] T059 [P] US2 Update `tests/unit/deckReducer.test.ts`: Replace T022 placeholder with full test for TOGGLE_CARD_SELECTION preventing exceeding discard count
- [ ] T060 [P] US2 Update `tests/unit/HandView.test.tsx`: Add test "clicking card toggles selection state" - click card, verify `toggleCardSelection` called with card ID
- [ ] T061 [P] US2 Update `tests/unit/HandView.test.tsx`: Add test "selected cards display .selected CSS class" - render with selected card IDs, verify class present
- [ ] T061a [P] US2 Add test for FR-004 selection progress indicator in `tests/unit/DeckControls.test.tsx` or `tests/unit/HandView.test.tsx`: Verify "X of Y cards selected" text displays correctly and updates when selection changes

### Implementation for User Story 2

- [ ] T062 US2 Update `src/components/HandView.css`: Add `.card.selected` CSS rules with distinct visual styling (e.g., `border: 3px solid var(--primary)`, `opacity: 0.8`, `transform: translateY(-4px)`)
- [ ] T063 US2 Update `src/components/HandView.css`: Add transition for `.card` element covering `border`, `opacity`, `transform` properties (200ms duration)
- [ ] T064 US2 Update `src/components/HandView.tsx`: Add visual selection indicator inside card (e.g., checkmark icon or "SELECTED" text) when card is selected
- [ ] T065 US2 Update `src/components/HandView.tsx`: Add disabled/unclickable state for cards when max selection reached and card not selected (add `.disabled` class, prevent onClick)
- [ ] T066 US2 Update `src/components/DeckControls.tsx` or create new component: Add selection progress indicator showing "X of Y cards selected" where X = `selectedCardIds.size`, Y = effective discard count

**Checkpoint**: US1 + US2 both functional - selection toggle works, visual feedback clear, max limit enforced, tests pass

---

## Phase 5: User Story 3 - Discard Confirmation (Priority: P2)

**Goal**: Explicit confirmation required before cards discarded, button disabled until requirement met, clear messaging

**Independent Test**: Select 2 cards when 3 required (verify button disabled), select 3rd card (verify button enabled), click button (verify cards discarded)

### Tests for User Story 3

- [ ] T067 [P] US3 Update `tests/integration/discardFlow.test.tsx`: Add scenario testing button disabled state when under-selected (e.g., 2 of 3 selected)
- [ ] T068 [P] US3 Update `tests/integration/discardFlow.test.tsx`: Add scenario testing button enabled state when exactly required count selected
- [ ] T069 [P] US3 Update `tests/contract/discardContracts.test.ts`: Verify FR-007 (confirmation action required), FR-010 (button disabled until requirement met), SC-005 (zero accidental discards)

### Implementation for User Story 3

- [ ] T070 US3 Update `src/components/DeckControls.tsx`: Add conditional rendering - only show "Discard" button when `discardPhase === true`
- [ ] T071 US3 Update `src/components/DeckControls.tsx`: Add disabled button styling (opacity, cursor not-allowed) when button disabled
- [ ] T072 US3 Update `src/components/DeckControls.tsx`: Add helper text below button showing requirement (e.g., "Select 3 cards to discard" or "2 of 3 cards selected")
- [ ] T073 US3 Update `src/components/DeckControls.tsx`: Update helper text color/style when requirement met (e.g., green checkmark, "Ready to discard")

**Checkpoint**: US1 + US2 + US3 all functional - confirmation flow complete, messaging clear, tests pass

---

## Phase 6: Keyboard Navigation (FR-013, A3)

**Purpose**: Enable keyboard-only users to select cards using Tab, Space, Enter

### Tests for Keyboard Navigation

- [ ] T074 [P] Create `tests/integration/keyboardSelection.test.tsx`: Test file for keyboard navigation flow
- [ ] T075 [P] Add test "Tab key navigates between cards" in `keyboardSelection.test.tsx` - simulate Tab key presses, verify focus moves through cards
- [ ] T076 [P] Add test "Space key toggles card selection" in `keyboardSelection.test.tsx` - focus card, press Space, verify `toggleCardSelection` called
- [ ] T077 [P] Add test "Enter key toggles card selection" in `keyboardSelection.test.tsx` - focus card, press Enter, verify `toggleCardSelection` called
- [ ] T078 Update `tests/unit/HandView.test.tsx`: Add test "pressing Space on focused card toggles selection"

### Implementation for Keyboard Navigation

- [ ] T079 Update `src/components/HandView.tsx`: Add `tabIndex={0}` to each card element to make focusable
- [ ] T080 Update `src/components/HandView.tsx`: Add `onKeyDown` handler to each card element
- [ ] T081 Update `src/components/HandView.tsx`: Implement keyboard handler - if `event.key === ' '` or `event.key === 'Enter'`, call `toggleCardSelection(card.id)` and `event.preventDefault()`
- [ ] T082 Update `src/components/HandView.css`: Add `:focus-visible` styles to `.card` element (outline, box-shadow) for clear focus indicator
- [ ] T083 Update `src/components/HandView.css`: Add `@media (prefers-reduced-motion: reduce)` to disable focus animations if needed
- [ ] T084 Update `src/components/DeckControls.tsx`: Ensure "Discard" button is keyboard accessible (native `<button>` element with proper focus order)

**Checkpoint**: Keyboard navigation fully functional - can complete discard flow without mouse, tests pass

---

## Phase 7: Visual Phase Indicators (FR-014, A4)

**Purpose**: Multiple clear indicators of discard phase state (status text + card states + disabled actions)

### Tests for Phase Indicators

- [ ] T085 [P] Update `tests/integration/discardFlow.test.tsx`: Add assertion verifying status text shows "Discard Phase" or similar when `discardPhase === true`
- [ ] T086 [P] Update `tests/contract/discardContracts.test.ts`: Verify FR-014 (multiple indicators present) and FR-001 (phase activated after deal)

### Implementation for Phase Indicators

- [ ] T087 Update `src/components/HandView.tsx` or `src/App.tsx`: Add phase status section above hand display showing current game phase
- [ ] T088 Add status text: When `discardPhase === true`, display "Discard Phase: Select X cards to discard" where X = effective discard count
- [ ] T089 Add status text: When `discardPhase === false`, display "Draw Phase" or hide status (normal state)
- [ ] T090 Update `src/components/HandView.tsx`: Add `role="status"` to phase status text for screen reader announcements
- [ ] T091 Update `src/components/HandView.tsx`: Add conditional class to hand container (e.g., `.hand-container--discard-phase`) when `discardPhase === true`
- [ ] T092 Update `src/components/HandView.css`: Add styling for `.hand-container--discard-phase` (e.g., subtle background color, border)
- [ ] T093 Update `src/components/DeckControls.tsx`: Ensure "End Turn" button shows disabled state visually (already implemented in T049, verify styling)

**Checkpoint**: Phase indicators complete - users clearly understand game state, tests pass

---

## Phase 8: Edge Cases (FR-009, Edge Cases from spec.md)

**Purpose**: Handle edge cases - discard count 0, equals hand size, exceeds hand size

### Tests for Edge Cases

- [ ] T094 [P] Create `tests/integration/edgeCases.test.tsx`: Test file for edge case scenarios
- [ ] T095 Add test "discard count = 0 skips discard phase" in `edgeCases.test.tsx` - set discardCount=0, deal hand, verify `discardPhase === false`, verify can end turn immediately
- [ ] T096 Add test "discard count = hand size requires all cards discarded" in `edgeCases.test.tsx` - set handSize=5, discardCount=5, deal, select all 5, confirm, verify hand empty
- [ ] T097 Add test "discard count > hand size caps at hand size" in `edgeCases.test.tsx` - set handSize=3, discardCount=5, deal, verify can only select 3 cards, verify effective discard count = 3
- [ ] T098 Update `tests/contract/discardContracts.test.ts`: Verify FR-009 edge case handling and all edge cases from spec.md

### Implementation for Edge Cases

- [ ] T099 Update `src/state/deckReducer.ts` in `dealNextHand()`: Calculate effective discard count as `Math.min(discardCount, handCards.length)` and use throughout discard phase logic
- [ ] T100 Update `src/components/DeckControls.tsx`: Use effective discard count (calculated as `Math.min(discardCount, handCards.length)`) for button disabled state and helper text
- [ ] T101 Update `src/components/HandView.tsx` or status component: Display effective discard count in status text when it differs from configured discard count (e.g., "Select 3 cards (capped from 5)")
- [ ] T102 Verify `dealNextHand()` logic in `deckReducer.ts`: Ensure `discardPhase` set to `false` when `discardCount === 0` (already implemented in T032, add comment)

**Checkpoint**: Edge cases handled correctly, all scenarios tested, tests pass

---

## Phase 9: State Persistence (FR-011, A1)

**Purpose**: Preserve game state across refresh, clear selections on refresh

### Tests for State Persistence

- [ ] T103 [P] Update `tests/integration/discardFlow.test.tsx`: Add test "page refresh during discard phase preserves hand but clears selections" - set up discard phase with selections, simulate refresh (reinitialize state), verify `handCards` preserved, `selectedCardIds` empty
- [ ] T104 Update `tests/contract/discardContracts.test.ts`: Verify FR-011 state persistence behavior and A1 clarification (selections cleared on refresh)

### Implementation for State Persistence

- [ ] T105 Examine `src/hooks/useDeckState.ts` or `src/state/deckReducer.ts`: Research note - No localStorage implementation found in existing codebase (per Phase 0 research.md T003). State persistence deferred to future feature. This task validates no persistence exists.
- [ ] T106 Update persistence logic: Extend serialization to include `handCards` (serialize as array of `{id, value}` objects)
- [ ] T107 Update persistence logic: Extend serialization to include `discardPhase` boolean
- [ ] T108 Update persistence logic: Do NOT serialize `selectedCardIds` (transient state, cleared on refresh per A1)
- [ ] T109 Update deserialization logic: Parse `handCards` from localStorage, reconstruct `CardInstance` objects
- [ ] T110 Update deserialization logic: Initialize `selectedCardIds` as empty Set on every load (implement A1 clarification)
- [ ] T111 Update deserialization logic: Restore `discardPhase` boolean from localStorage

**Checkpoint**: State persistence working - hand/phase preserved, selections cleared on refresh, tests pass

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, documentation, validation

- [ ] T112 [P] POL Update `src/components/HandView.css`: Ensure color contrast for `.card.selected` meets WCAG AA (4.5:1 for text, 3:1 for UI components)
- [ ] T113 [P] POL Update `src/components/HandView.css`: Add `@media (prefers-reduced-motion: reduce)` to disable all selection transitions
- [ ] T114 [P] POL Add `src/components/HandView.css`: Ensure focus indicators meet WCAG 2.1 Level AA (2.4.7 Focus Visible) - minimum 2px outline
- [ ] T115 [P] POL Manual test: Screen reader (VoiceOver/NVDA) announces card selection state changes (use `aria-pressed` attribute added in T056)
- [ ] T116 [P] POL Manual test: Keyboard navigation follows visual layout (Tab order matches left-to-right card order)
- [ ] T117 [P] POL Manual test: Verify selection state updates within 100ms (SC-004) - use browser DevTools Performance tab or manual timer
- [ ] T118 [P] POL Manual test: Complete discard flow in <10s for 5-10 cards (SC-001) - manual user testing
- [ ] T119 POL Run full test suite: `npm test` (expect all tests pass - estimate 30+ tests total with new additions)
- [ ] T120 POL Run linter: `npm run lint` (expect 0 errors)
- [ ] T121 POL Run production build: `npm run build` (expect success)
- [ ] T122 [P] POL Update `specs/003-card-discard-mechanic/checklists/requirements.md`: Mark all FR-001 to FR-014 as complete with test references
- [ ] T123 [P] POL Update `specs/003-card-discard-mechanic/checklists/requirements.md`: Mark all SC-001 to SC-005 as validated with verification method
- [ ] T124 [P] POL Update `specs/003-card-discard-mechanic/checklists/requirements.md`: Mark all edge cases as handled with test references
- [ ] T125 POL Follow `quickstart.md` validation checklist: Complete all manual verification items from Phase 4 in plan.md

**Checkpoint**: Feature complete, polished, tested, documented, ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Research)**: No dependencies - can start immediately
- **Phase 1 (Design)**: Depends on Phase 0 research complete
- **Phase 2 (Foundational)**: Depends on Phase 1 design complete - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 foundational complete
- **Phase 4 (US2)**: Depends on Phase 3 (US1) complete - builds on selection logic
- **Phase 5 (US3)**: Depends on Phase 3 (US1) complete - can run parallel with Phase 4
- **Phase 6 (Keyboard)**: Depends on Phase 3 (US1) complete - can run parallel with Phase 4/5
- **Phase 7 (Indicators)**: Depends on Phase 3 (US1) complete - can run parallel with Phase 4/5/6
- **Phase 8 (Edge Cases)**: Depends on Phase 3 (US1) complete - can run parallel with Phase 4/5/6/7
- **Phase 9 (Persistence)**: Depends on Phase 2 (Foundational) complete - can run parallel with user stories
- **Phase 10 (Polish)**: Depends on all previous phases complete

### User Story Independence

- **US1 (P1)**: Foundational - must complete first (Phase 3)
- **US2 (P2)**: Depends on US1 - extends selection logic
- **US3 (P2)**: Depends on US1 - can run parallel with US2
- **Keyboard (FR-013)**: Can run parallel with US2/US3 after US1
- **Phase Indicators (FR-014)**: Can run parallel with US2/US3 after US1
- **Edge Cases (FR-009)**: Can run parallel with US2/US3 after US1

### Parallel Opportunities

**Phase 0 (Research)**: T001, T002, T003, T004, T005 all parallel [P]

**Phase 1 (Design)**: T007, T008 parallel [P], then T009-T011 sequential

**Phase 2 (Foundational)**:
- T012, T013 parallel [P] (types)
- T019-T024 parallel [P] (test setup)
- T025 after T012 complete (implementation)
- T026-T036 sequential (reducer logic builds)
- T037-T039 sequential (hook updates)

**Phase 3 (US1)**:
- T040-T044 parallel [P] (tests)
- T045-T057 sequential (implementation builds on itself)

**Phase 4 (US2)**:
- T058-T061 parallel [P] (tests)
- T062-T066 sequential (CSS then component updates)

**Phase 5 (US3)**:
- T067-T069 parallel [P] (tests)
- T070-T073 sequential (component updates)

**Phase 6 (Keyboard)**:
- T074-T078 parallel [P] (tests)
- T079-T084 sequential (component updates)

**Phase 7 (Indicators)**:
- T085-T086 parallel [P] (tests)
- T087-T093 sequential (component updates)

**Phase 8 (Edge Cases)**:
- T094-T098 parallel [P] (tests, can write together)
- T099-T102 sequential (implementation)

**Phase 9 (Persistence)**:
- T103-T104 parallel [P] (tests)
- T105-T111 sequential (persistence logic builds)

**Phase 10 (Polish)**: T112-T118, T122-T125 all parallel [P], then T119-T121 sequential (validation)

**Maximum parallelization after US1 complete**:
```
After Phase 3 (US1) complete, launch in parallel:
- Phase 4 (US2)
- Phase 5 (US3)
- Phase 6 (Keyboard)
- Phase 7 (Indicators)
- Phase 8 (Edge Cases)
- Phase 9 (Persistence)

Then converge at Phase 10 (Polish)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 0: Research (T001-T006)
2. Complete Phase 1: Design (T007-T011)
3. Complete Phase 2: Foundational (T012-T039)
4. Complete Phase 3: User Story 1 (T040-T057)
5. **STOP and VALIDATE**:
   - Run `npm test -- deckReducer.test.ts HandView.test.tsx discardFlow.test.tsx`
   - Manual browser test: Deal hand with discardCount=3, select 3 cards, confirm, verify discard
   - Verify "End Turn" blocked during discard phase
6. **MVP READY**: Core discard mechanic functional

### Full Feature Delivery

1. Complete MVP (Phases 0-3)
2. Launch Phases 4-9 in parallel (US2, US3, Keyboard, Indicators, Edge Cases, Persistence)
3. Validate each phase independently:
   - US2: Test selection toggle and visual feedback
   - US3: Test confirmation flow
   - Keyboard: Test Tab/Space/Enter navigation
   - Indicators: Test status text and visual phase cues
   - Edge Cases: Test 0/equals/exceeds scenarios
   - Persistence: Test refresh behavior
4. Complete Phase 10: Polish and final validation
5. All functional requirements and success criteria met

### Time Estimates

- **Phase 0 (Research)**: 1-2 hours
- **Phase 1 (Design)**: 2-3 hours
- **Phase 2 (Foundational)**: 2-3 hours
- **Phase 3 (US1)**: 2 hours (1h tests + 1h implementation)
- **Phase 4 (US2)**: 1 hour
- **Phase 5 (US3)**: 45 minutes
- **Phase 6 (Keyboard)**: 1 hour
- **Phase 7 (Indicators)**: 45 minutes
- **Phase 8 (Edge Cases)**: 1 hour
- **Phase 9 (Persistence)**: 1.5 hours
- **Phase 10 (Polish)**: 1.5 hours

**Total**: ~14-16 hours (matches plan.md Phase 0-4 estimates combined)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story or phase for traceability
- Write tests FIRST (TDD approach) - ensure they FAIL before implementation
- Commit after each phase completion for rollback safety
- Stop at any checkpoint to validate independently
- Keep deprecated `hand` field for 1 release cycle (backward compatibility per plan.md migration strategy)
- Use effective discard count (`Math.min(discardCount, handCards.length)`) throughout for edge case handling
- Selection state is transient (cleared on refresh per A1)
- Card instance IDs use `crypto.randomUUID()` with fallback (per A2)
- Keyboard navigation required (per A3)
- Multiple phase indicators required (per A4)
- No "clear all" button (per A5)

---

## Success Criteria Validation Map

| Success Criteria | Tasks | Validation Method |
|------------------|-------|-------------------|
| SC-001: Complete discard <10s | T118 | Manual user testing with timer |
| SC-002: 100% turn block enforcement | T034, T049, T043 | Integration test + "End Turn" disabled state |
| SC-003: 95% first-time success | T118 | Manual user testing (not automated in MVP) |
| SC-004: Visual update <100ms | T117, T063 | Manual DevTools Performance + CSS transition 200ms |
| SC-005: Zero accidental discards | T048, T069 | Integration test + confirmation required |

All success criteria covered by task breakdown.

---

## Functional Requirements Validation Map

| Requirement | Tasks | Validation Method |
|-------------|-------|-------------------|
| FR-001: Enforce discard phase after deal | T031, T042, T086 | Unit test + integration test |
| FR-002: Select individual cards | T053, T040 | Component implementation + unit test |
| FR-003: Visual distinction for selected | T054, T062, T061 | CSS class + unit test |
| FR-004: Display selection progress | T066 | Component implementation |
| FR-005: Prevent turn end during phase | T034, T049, T043 | Reducer logic + integration test |
| FR-006: Deselect cards | T027, T041 | Reducer logic + unit test |
| FR-007: Confirmation action | T048, T067 | Button implementation + test |
| FR-008: Move cards to discard pile | T029, T041 | Reducer logic + unit test |
| FR-009: Handle edge cases | T095-T102 | Edge case tests + implementation |
| FR-010: Disable confirmation until ready | T047, T067 | Button disabled state + test |
| FR-011: State persistence | T103-T111 | Persistence logic + test |
| FR-012: Prevent exceeding max selection | T027, T059 | Reducer logic + unit test |
| FR-013: Keyboard navigation | T074-T084 | Keyboard tests + implementation |
| FR-014: Multiple phase indicators | T085-T093 | Status text + visual cues + test |

All 14 functional requirements covered by task breakdown.

---

**Tasks Status**: ✅ Complete  
**Ready for**: Phase 0 (Research) execution
