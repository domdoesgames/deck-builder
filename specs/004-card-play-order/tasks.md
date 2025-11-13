# Tasks: Card Play Order

**Input**: Design documents from `/specs/004-card-play-order/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as this is a complex state management feature with strict contracts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (this project)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and state structure for play order feature

- [X] T001 [P] Extend DeckState interface with playOrderSequence, playOrderLocked, planningPhase fields in src/lib/types.ts
- [X] T002 [P] Add DeckAction type union cases for SELECT_FOR_PLAY_ORDER, DESELECT_FROM_PLAY_ORDER, LOCK_PLAY_ORDER, CLEAR_PLAY_ORDER in src/lib/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state management that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Initialize play order state fields in initializeDeck() function in src/state/deckReducer.ts
- [X] T004 Implement selectForPlayOrder() reducer function in src/state/deckReducer.ts
- [X] T005 Implement deselectFromPlayOrder() reducer function in src/state/deckReducer.ts
- [X] T006 Implement lockPlayOrder() reducer function in src/state/deckReducer.ts
- [X] T007 Implement clearPlayOrder() reducer function in src/state/deckReducer.ts
- [X] T008 Add action cases to deckReducer switch statement for all 4 new actions in src/state/deckReducer.ts
- [X] T009 Modify confirmDiscard() to set planningPhase=true when cards remain in src/state/deckReducer.ts
- [X] T010 Modify confirmDiscard() to set planningPhase=false when hand is empty in src/state/deckReducer.ts
- [X] T011 Modify endTurn() to block when planningPhase=true in src/state/deckReducer.ts
- [X] T012 Modify endTurn() to block when playOrderSequence.length > 0 and playOrderLocked=false in src/state/deckReducer.ts
- [X] T013 Modify dealNextHand() to reset playOrderSequence, playOrderLocked, planningPhase to defaults in src/state/deckReducer.ts
- [X] T014 Update useDeckState hook to expose new state fields and action dispatchers in src/hooks/useDeckState.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Sequential Card Order Selection (Priority: P1) 🎯 MVP

**Goal**: Users can arrange their remaining cards into a specific play order by selecting them one at a time, with each card displaying its sequence number.

**Independent Test**: Complete discard phase, select cards in a specific order (e.g., card A, card B, card C), verify each card displays its sequence number badge.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
> 
> **NOTE: All contract tests (T015-T059) go in a single file tests/contract/playOrderContracts.test.ts, organized by describe() blocks per user story**

- [X] T015 [P] [US1] Write contract test T101 (SELECT_FOR_PLAY_ORDER - valid selection) in tests/contract/playOrderContracts.test.ts
- [X] T016 [P] [US1] Write contract test T102 (SELECT_FOR_PLAY_ORDER - ignore when not planning) in tests/contract/playOrderContracts.test.ts
- [X] T017 [P] [US1] Write contract test T103 (SELECT_FOR_PLAY_ORDER - ignore invalid instanceId) in tests/contract/playOrderContracts.test.ts
- [X] T018 [P] [US1] Write contract test T104 (SELECT_FOR_PLAY_ORDER - ignore duplicate) in tests/contract/playOrderContracts.test.ts
- [X] T019 [P] [US1] Write contract test T105 (DESELECT_FROM_PLAY_ORDER - valid deselection) in tests/contract/playOrderContracts.test.ts
- [X] T020 [P] [US1] Write contract test T106 (DESELECT_FROM_PLAY_ORDER - ignore when not in sequence) in tests/contract/playOrderContracts.test.ts
- [X] T021 [P] [US1] Write contract test T107 (DESELECT_FROM_PLAY_ORDER - ignore when locked) in tests/contract/playOrderContracts.test.ts
- [X] T022 [P] [US1] Write contract test T113 (CONFIRM_DISCARD - initiate planning phase) in tests/contract/playOrderContracts.test.ts
- [X] T023 [P] [US1] Write contract test T114 (CONFIRM_DISCARD - skip planning with empty hand) in tests/contract/playOrderContracts.test.ts

### Implementation for User Story 1

- [ ] T024 [US1] Extend HandView props interface with playOrderSequence, planningPhase, onSelectForPlayOrder, onDeselectFromPlayOrder in src/components/HandView.tsx
- [ ] T025 [US1] Implement getSequenceNumber() helper function in src/components/HandView.tsx
- [ ] T026 [US1] Update handleCardClick() to dispatch SELECT/DESELECT actions during planning phase in src/components/HandView.tsx
- [ ] T027 [US1] Add handleKeyPress() for keyboard selection (Space/Enter keys) in src/components/HandView.tsx
- [ ] T028 [US1] Add getCardAriaLabel() helper for accessibility labels in src/components/HandView.tsx
- [ ] T029 [US1] Update card rendering to display sequence number badge when card is ordered in src/components/HandView.tsx
- [ ] T030 [US1] Add sequence number badge CSS styles in src/components/HandView.css
- [ ] T031 [US1] Add card hover effects for planning phase in src/components/HandView.css
- [ ] T032 [US1] Wire up new HandView props from App.tsx with state and dispatch
- [ ] T033 [US1] Update existing HandView unit tests for new play order rendering in tests/unit/HandView.test.tsx

### Integration Tests for User Story 1

- [ ] T034 [US1] Write integration test for selecting 3 cards in sequence and verifying badges in tests/integration/playOrderFlow.test.tsx
- [ ] T035 [US1] Write integration test for deselecting middle card and verifying renumbering in tests/integration/playOrderFlow.test.tsx
- [ ] T036 [US1] Write integration test for keyboard navigation (Tab/Space/Enter) in tests/integration/playOrderFlow.test.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can select cards in order, see sequence numbers, and deselect to renumber.

---

## Phase 4: User Story 2 - Order Locking (Priority: P1) 🎯 MVP

**Goal**: Users can lock the sequence to prevent further changes once all remaining cards have been assigned a play order.

**Independent Test**: Assign play order to all remaining cards, click "Lock Order" button, verify cards can no longer be reordered and status shows "Executing".

**Dependencies**: User Story 1 must be complete (relies on play order selection UI)

### Tests for User Story 2

- [ ] T037 [P] [US2] Write contract test T108 (LOCK_PLAY_ORDER - valid lock) in tests/contract/playOrderContracts.test.ts
- [ ] T038 [P] [US2] Write contract test T109 (LOCK_PLAY_ORDER - ignore when incomplete) in tests/contract/playOrderContracts.test.ts
- [ ] T039 [P] [US2] Write contract test T110 (LOCK_PLAY_ORDER - ignore when already locked) in tests/contract/playOrderContracts.test.ts
- [ ] T040 [P] [US2] Write contract test T115 (END_TURN - block when planning phase active) in tests/contract/playOrderContracts.test.ts
- [ ] T041 [P] [US2] Write contract test T116 (END_TURN - block when order not locked) in tests/contract/playOrderContracts.test.ts
- [ ] T042 [P] [US2] Write contract test T118 (END_TURN - allow when locked) in tests/contract/playOrderContracts.test.ts

### Implementation for User Story 2

- [ ] T043 [US2] Extend DeckControls props interface with playOrderSequence, playOrderLocked, planningPhase, handCardsCount, onLockPlayOrder in src/components/DeckControls.tsx
- [ ] T044 [US2] Implement canLockOrder computed value in src/components/DeckControls.tsx
- [ ] T045 [US2] Add "Lock Order" button with enabled/disabled state logic in src/components/DeckControls.tsx
- [ ] T046 [US2] Add phase status indicator ("Planning" vs "Executing" badge) in src/components/DeckControls.tsx
- [ ] T047 [US2] Wire up DeckControls props from App.tsx with state and dispatch
- [ ] T048 [US2] Add locked card styling (opacity, grayscale, no hover) in src/components/HandView.css
- [ ] T049 [US2] Update HandView to apply locked styling when playOrderLocked=true in src/components/HandView.tsx
- [ ] T050 [US2] Update HandView to ignore clicks when playOrderLocked=true in src/components/HandView.tsx
- [ ] T051 [US2] Update sequence number badge styling for locked state (green background) in src/components/HandView.css

### Integration Tests for User Story 2

- [ ] T052 [US2] Write integration test for locking complete play order and verifying transition to Executing phase in tests/integration/playOrderFlow.test.tsx
- [ ] T053 [US2] Write integration test for attempting to lock incomplete order (button disabled) in tests/integration/playOrderFlow.test.tsx
- [ ] T054 [US2] Write integration test for attempting to modify cards after locking (ignored) in tests/integration/playOrderFlow.test.tsx
- [ ] T055 [US2] Write integration test for turn end blocking until order is locked in tests/integration/turnCycle.test.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can select order, lock it, and cannot modify after locking.

---

## Phase 5: User Story 3 - Order Display for Sharing (Priority: P2)

**Goal**: After locking the play order, users can view a clear visual display of the locked sequence that can be manually shown to another player.

**Independent Test**: Lock a play order and verify the locked sequence is clearly displayed with all cards showing their final position numbers in a visually distinct "locked" state.

**Dependencies**: User Story 2 must be complete (relies on locked state)

### Tests for User Story 3

- [ ] T056 [P] [US3] Write contract test T111 (CLEAR_PLAY_ORDER - valid clear) in tests/contract/playOrderContracts.test.ts
- [ ] T057 [P] [US3] Write contract test T112 (CLEAR_PLAY_ORDER - ignore when locked) in tests/contract/playOrderContracts.test.ts
- [ ] T058 [P] [US3] Write contract test T119 (DEAL_NEXT_HAND - reset play order state) in tests/contract/playOrderContracts.test.ts
- [ ] T059 [P] [US3] Write contract test T117 (END_TURN - allow when no play order required) in tests/contract/playOrderContracts.test.ts

### Implementation for User Story 3

- [ ] T060 [US3] Add "Clear Order" button with visibility logic (only during planning) in src/components/DeckControls.tsx
- [ ] T061 [US3] Add showClearButton computed value in src/components/DeckControls.tsx
- [ ] T062 [US3] Wire up onClearPlayOrder action dispatcher in App.tsx
- [ ] T063 [US3] Enhance locked state visual indicators (status badge, lock icon optional) in src/components/DeckControls.tsx
- [ ] T064 [US3] Add ARIA live region announcements for phase transitions in src/components/DeckControls.tsx
- [ ] T065 [US3] Update locked badge contrast to meet WCAG AA (4.5:1 ratio) in src/components/HandView.css
- [ ] T066 [US3] Add focus indicators for keyboard navigation (2px outline, 3:1 contrast) in src/components/HandView.css

### Integration Tests for User Story 3

- [ ] T067 [US3] Write integration test for clearing partial order and restarting selection in tests/integration/playOrderFlow.test.tsx
- [ ] T068 [US3] Write integration test for locked order persistence across page refresh in tests/integration/playOrderFlow.test.tsx
- [ ] T069 [US3] Write integration test for new hand dealing resetting play order state in tests/integration/turnCycle.test.tsx
- [ ] T070 [US3] Write integration test for single-card edge case (must select and lock) in tests/integration/playOrderFlow.test.tsx
- [ ] T071 [US3] Write integration test for empty hand edge case (skip planning phase) in tests/integration/turnCycle.test.tsx

**Checkpoint**: All user stories should now be independently functional - complete play order selection, locking, and display workflow.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T072 [P] Add state invariants validation tests (6 invariants from contract) in tests/contract/playOrderContracts.test.ts
- [ ] T073 [P] Add persistence serialization/deserialization round-trip tests in tests/unit/deckReducer.test.ts
- [ ] T074 [P] Add backward compatibility test for loading states without new fields in tests/unit/deckReducer.test.ts
- [ ] T075 [P] Update existing deckReducer tests to account for new state fields in tests/unit/deckReducer.test.ts
- [ ] T076 Performance optimization: Add React.memo() to card components if needed in src/components/HandView.tsx
- [ ] T077 Accessibility audit: Test keyboard navigation with screen reader
- [ ] T078 Accessibility audit: Verify WCAG AA contrast ratios for all UI elements
- [ ] T079 Accessibility audit: Test touch interactions on mobile/tablet devices
- [ ] T080 Performance testing: Verify card selection response time <100ms (SC-003)
- [ ] T081 Manual testing: Complete all edge cases from spec.md (single card, empty hand, refresh scenarios)
- [ ] T082 Run quickstart.md validation checklist (all success criteria SC-001 through SC-006)
- [ ] T083 Code cleanup and refactoring for reducer functions
- [ ] T084 [P] Update AGENTS.md if new patterns or technical decisions were made
- [ ] T085 [P] Write test for localStorage failure fallback (quota exceeded, privacy mode) in tests/unit/deckReducer.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase AND User Story 1 completion (uses selection UI)
- **User Story 3 (Phase 5)**: Depends on Foundational phase AND User Story 2 completion (uses locked state)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - 🎯 **MVP SCOPE**
- **User Story 2 (P1)**: Depends on User Story 1 (extends selection UI with locking) - 🎯 **MVP SCOPE**
- **User Story 3 (P2)**: Depends on User Story 2 (enhances locked display) - Can be deferred if MVP needed quickly

### Within Each User Story

- Tests MUST be written and FAIL before implementation (T015-T023 before T024-T036, etc.)
- State management before UI components (Foundational Phase 2 before all Phase 3+)
- Core implementation (card selection/display) before polish (clear button, accessibility)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (both modify types.ts but different sections)
- **User Story 1 Tests**: T015-T023 can all run in parallel (different test cases)
- **User Story 2 Tests**: T037-T042 can all run in parallel
- **User Story 3 Tests**: T056-T059 can all run in parallel
- **Polish Phase**: T072, T073, T074, T075, T084 can all run in parallel (different test files)

**Note**: User Stories 1, 2, 3 are SEQUENTIAL due to UI dependencies (each builds on previous)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all contract tests for User Story 1 together:
Task: "Write contract test T101 (SELECT_FOR_PLAY_ORDER - valid selection)"
Task: "Write contract test T102 (SELECT_FOR_PLAY_ORDER - ignore when not planning)"
Task: "Write contract test T103 (SELECT_FOR_PLAY_ORDER - ignore invalid instanceId)"
Task: "Write contract test T104 (SELECT_FOR_PLAY_ORDER - ignore duplicate)"
Task: "Write contract test T105 (DESELECT_FROM_PLAY_ORDER - valid deselection)"
Task: "Write contract test T106 (DESELECT_FROM_PLAY_ORDER - ignore when not in sequence)"
Task: "Write contract test T107 (DESELECT_FROM_PLAY_ORDER - ignore when locked)"
Task: "Write contract test T113 (CONFIRM_DISCARD - initiate planning phase)"
Task: "Write contract test T114 (CONFIRM_DISCARD - skip planning with empty hand)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T014) - CRITICAL
3. Complete Phase 3: User Story 1 (T015-T036)
4. **STOP and VALIDATE**: Test User Story 1 independently (can select and see numbers)
5. Complete Phase 4: User Story 2 (T037-T055)
6. **STOP and VALIDATE**: Test complete selection + locking workflow
7. Deploy/demo if ready (core feature functional)

### Full Feature Delivery

1. Complete MVP (Phases 1-4) → Foundation + US1 + US2 complete
2. Add Phase 5: User Story 3 (T056-T071) → Enhanced display and edge cases
3. Add Phase 6: Polish (T072-T084) → Production-ready quality
4. Each phase adds value without breaking previous functionality

### Single Developer Strategy

Work sequentially through phases:
1. Setup → Foundational (1-2 hours)
2. User Story 1 (2-3 hours including tests)
3. User Story 2 (1-2 hours including tests)
4. User Story 3 (1-2 hours including tests)
5. Polish (1 hour)

**Total Estimated Time**: 6-10 hours

---

## Notes

- **[P]** tasks = different test cases or different files, no dependencies
- **[Story]** label maps task to specific user story for traceability
- User Stories 2 and 3 depend on previous stories (UI builds incrementally)
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Reference quickstart.md for detailed implementation guidance
- All contract test IDs (T101-T119) map to contracts in play-order-state.contract.md
- All UI contracts (C201-C207) are covered by integration tests

---

## Test Coverage Summary

**Contract Tests** (tests/contract/playOrderContracts.test.ts):
- 19 state transition contracts (T101-T119)
- 6 state invariants validation

**Integration Tests** (tests/integration/playOrderFlow.test.tsx):
- Full user workflows (select, deselect, lock, clear)
- UI interaction contracts (C201-C207)
- Edge cases (single card, empty hand, refresh persistence)

**Unit Tests** (updates to existing):
- HandView rendering with sequence numbers
- DeckReducer with new state fields
- Persistence round-trip compatibility

**Manual Tests**:
- Accessibility (keyboard, screen reader, touch)
- Performance (SC-003: <100ms response)
- Success criteria validation (SC-001 through SC-006)
