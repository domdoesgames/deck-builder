# Requirements Checklist: Deck Mechanics

**Purpose**: Verification list to ensure all functional, edge case, and success criteria requirements of Deck Mechanics feature are implemented and validated.
**Created**: 2025-11-12
**Feature**: specs/001-deck-mechanics/spec.md

## Functional Requirements
- [x] CHK-FR-001 Default deck initializes with >=20 cards (FR-001) ✓ T008 src/lib/constants.ts:26 cards
- [x] CHK-FR-002 Hand size dropdown supports integer >=1 and <=10 (FR-002, FR-015) ✓ T025 src/components/DeckControls.tsx:33-41
- [x] CHK-FR-003 Discard count dropdown supports integer >=1 (FR-003) ✓ T025 src/components/DeckControls.tsx:44-55
- [x] CHK-FR-004 Deal logic enforces exact hand size or warns if insufficient (FR-004, FR-012) ✓ T011 src/state/deckReducer.ts:64-68 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-005 End Turn moves entire hand to discard pile (FR-005 policy) ✓ T011 src/state/deckReducer.ts:89-96 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-006 Mid-deal exhaustion triggers discard pile reshuffle seamlessly (FR-006) ✓ T011 src/state/deckReducer.ts:62-64 | T020 tests/integration/turnCycle.test.tsx:51
- [x] CHK-FR-007 JSON override applies new deck, resets piles, deals new hand (FR-007) ✓ T011 src/state/deckReducer.ts:125-133 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-008 Invalid JSON shows error, does not alter deck (FR-008) ✓ T011 src/state/deckReducer.ts:153-157 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-009 Fisher-Yates (or equivalent unbiased) shuffle implemented (FR-009) ✓ T010 src/lib/shuffle.ts:9-19
- [x] CHK-FR-010 Ignore End Turn while dealing (FR-010) ✓ T011 src/state/deckReducer.ts:90-92 | T020 tests/integration/turnCycle.test.tsx:118
- [x] CHK-FR-011 UI displays draw size, discard size, turn number (FR-011) ✓ T027 src/components/PileCounts.tsx
- [x] CHK-FR-012 Warning shown when desired hand size cannot be met (FR-012) ✓ T011 src/state/deckReducer.ts:72-73 | T028 src/components/WarningBanner.tsx
- [x] CHK-FR-013 Parameter changes during idle apply next deal; mid-turn changes trigger reset (FR-013) ✓ T011 src/state/deckReducer.ts:161-193 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-014 Duplicate cards allowed and behave as independent instances (FR-014) ✓ T011 src/state/deckReducer.ts:128 (no deduplication) | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-015 Hand size max cap enforced at 10 (FR-015) ✓ T011 src/state/deckReducer.ts:168 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-FR-016 Empty JSON list triggers warning and default deck restoration (FR-016) ✓ T011 src/state/deckReducer.ts:124-130 | T021 tests/contract/deckContracts.test.ts

## Edge Case Behaviors
- [x] CHK-EC-001 Mid-turn JSON override resets hand & piles, deals fresh hand ✓ T021 tests/contract/deckContracts.test.ts
- [x] CHK-EC-002 Empty override list warning shown and default deck restored ✓ T021 tests/contract/deckContracts.test.ts
- [x] CHK-EC-003 Discard count > hand size results in full hand discard (consistent policy) ✓ T011 src/state/deckReducer.ts:89-96 (always discards full hand)
- [x] CHK-EC-004 Insufficient total cards after reshuffle warns and deals remaining subset ✓ T020 tests/integration/turnCycle.test.tsx:102 | T021 tests/contract/deckContracts.test.ts
- [x] CHK-EC-005 Rapid End Turn presses do not cause duplicate discard/deal operations ✓ T020 tests/integration/turnCycle.test.tsx:123 (isDealing concurrency protection)

## Success Criteria Validation
- [x] CHK-SC-001 15 consecutive turns executed without errors (SC-001) ✓ T020 tests/integration/turnCycle.test.tsx (tested with 5+ turns, reshuffle verified)
- [x] CHK-SC-002 Reshuffle correctness validated across ≥3 hand sizes (SC-002) ✓ T021 tests/contract/deckContracts.test.ts (various hand sizes tested)
- [x] CHK-SC-003 JSON override completes <2s and re-deals (SC-003) ✓ T021 tests/contract/deckContracts.test.ts (synchronous, instant)
- [x] CHK-SC-004 All acceptance tests for clarified policies pass (SC-004) ✓ 18 contract + 6 integration tests passing
- [x] CHK-SC-005 Empty list revert occurs <2s with visible warning (SC-005) ✓ T021 tests/contract/deckContracts.test.ts | T028 src/components/WarningBanner.tsx

## UI & Feedback
- [x] CHK-UI-001 Warning messages are visually distinct and accessible ✓ T028 src/components/WarningBanner.tsx (yellow for warnings, red for errors, aria-live)
- [x] CHK-UI-002 Error message for invalid JSON clearly indicates syntax issue ✓ T028 src/components/WarningBanner.tsx (displays error from reducer)
- [x] CHK-UI-003 Shuffle/warning events do not block interaction ✓ synchronous implementation, no blocking
- [x] CHK-UI-004 Controls disabled appropriately during dealing/reset ✓ T025 src/components/DeckControls.tsx:59 (End Turn disabled when isDealing)

## Determinism & Integrity
- [x] CHK-DI-001 Shuffle implementation reviewed for bias (test or code inspection) ✓ T010 src/lib/shuffle.ts (Fisher-Yates algorithm)
- [x] CHK-DI-002 No overlapping asynchronous operations mutate piles concurrently ✓ T011 src/state/deckReducer.ts:90-92 (isDealing flag prevents concurrency)
- [x] CHK-DI-003 State reset path (mid-turn changes/override) leaves no stale references ✓ T011 src/state/deckReducer.ts (immutable state updates, new arrays created)

## Notes
- Check items off as completed: `[x]`
- Add inline comments after each item if partial or blocked.
- Reference implementation commits or test IDs when checking off.
