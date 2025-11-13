# Research: Deck Reset Implementation

**Feature**: 006-deck-reset  
**Date**: 2025-11-13  
**Status**: Complete

## Purpose

This document resolves implementation approaches for the deck reset feature, including state reset patterns, shuffle integration timing, and performance considerations.

## Research Questions

### RQ-001: State Reset Pattern in React Reducer Architecture

**Question**: What is the best pattern for resetting state in a React useReducer hook while preserving specific fields (handSize, discardCount)?

**Findings**:
- **Option 1**: RESET action that calls `initializeDeck()` helper, then selectively restores preserved fields
- **Option 2**: RESET action that manually constructs new state object, copying preserved fields
- **Option 3**: RESET action that dispatches INIT, then CHANGE_PARAMETERS to restore settings

**Decision**: **Option 1** - RESET action calls modified `initializeDeck()` helper with optional parameter object for preserved settings

**Rationale**:
- Reuses existing initialization logic (DRY principle)
- Single source of truth for "initial state" definition
- Less error-prone than manual state construction
- More performant than double-dispatch pattern
- Matches existing codebase pattern where `initializeDeck()` already exists in `deckReducer.ts:57`

**Implementation Detail**:
```
// Signature
function initializeDeck(preservedSettings?: { handSize: number, discardCount: number }): DeckState

// RESET action will call:
return initializeDeck({ handSize: state.handSize, discardCount: state.discardCount })
```

### RQ-002: Shuffle Timing and Integration

**Question**: Where and when should shuffle be called to satisfy both "shuffle on page load" and "shuffle on reset" requirements?

**Findings**:
- **Current behavior**: `initializeDeck()` creates deck from `DEFAULT_DECK` constant (unshuffled)
- **Current shuffle usage**: Only used in `dealNextHand()` when reshuffling discard pile (line 91)
- **Requirement**: Shuffle must happen BEFORE dealing initial hand on both page load and reset

**Decision**: Modify `initializeDeck()` to shuffle the `drawPile` immediately after creating it from `DEFAULT_DECK`, before calling `dealNextHand()`

**Rationale**:
- Single modification point satisfies both requirements (page load via INIT action, manual reset via RESET action)
- Shuffle happens once per initialization, not per hand dealt
- Maintains existing `dealNextHand()` logic unchanged
- Clear separation: initialize = setup deck, deal = draw cards

**Implementation Detail**:
```
// In initializeDeck():
const drawPile = shuffle([...DEFAULT_DECK])  // ADD shuffle() call here
const initialState: DeckState = { drawPile, ... }
return dealNextHand(initialState)
```

### RQ-003: Button Disabled State Management

**Question**: How to prevent double-clicks on reset button while reset is processing?

**Findings**:
- **Option 1**: Add `isResetting` boolean to DeckState, set during RESET action
- **Option 2**: Use local component state in DeckControls with `useState`
- **Option 3**: Optimistic UI - disable immediately on click, re-enable after action completes

**Decision**: **Option 2** - Local component state with optimistic disable

**Rationale**:
- Reset operation is synchronous and fast (<500ms target, likely <50ms actual)
- No need to pollute global state with UI-only `isResetting` flag
- Component-level `useState` provides immediate feedback
- Pattern: `onClick={() => { setIsResetting(true); dispatch({ type: 'RESET' }); setIsResetting(false); }}`
- Re-enables immediately after synchronous dispatch completes

**Alternatives Considered**:
- Global state rejected: Reset is too fast to warrant state management overhead
- No disable rejected: Violates FR-007 requirement to prevent concurrent resets

### RQ-004: Persistence Clearing Strategy

**Question**: How should reset interact with localStorage persistence?

**Findings**:
- Existing codebase: `useDeckStatePersistence.ts` auto-persists state after every action
- Requirement FR-006: "System MUST clear persisted state from localStorage when reset is triggered"
- Current persistence: Saves full state object to `localStorage.setItem('deckState', JSON.stringify(state))`

**Decision**: No special handling needed - persistence layer will automatically persist the fresh state after RESET action completes

**Rationale**:
- Persistence hook already listens to state changes via `useEffect(() => persistenceManager.save(state), [state])`
- After RESET action returns new initial state, effect will fire and save it
- Result: Old state overwritten with fresh state automatically
- No need to explicitly call `localStorage.clear()` or `removeItem()` - that would break persistence entirely

**Implementation Detail**:
- No changes to persistence layer required
- RESET action simply returns fresh state
- Existing persistence effect handles "clearing" by overwriting

### RQ-005: Test Strategy for Shuffle Randomness

**Question**: How to test that shuffle is actually called and produces different results across resets?

**Findings**:
- **Challenge**: Fisher-Yates shuffle is non-deterministic (uses crypto.getRandomValues)
- **Anti-pattern**: Mocking Math.random or crypto (brittle, not meaningful)
- **Requirement SC-003**: "Loading the page 10 times produces 10 different initial hands"

**Decision**: Probabilistic integration test - reset 10 times, assert at least 8 different hands

**Rationale**:
- Extremely unlikely that 10 shuffles produce <8 unique hands by chance (statistical confidence)
- Tests actual shuffle behavior, not mocked behavior
- Accounts for rare edge case where 2/10 shuffles might happen to match
- Integration test validates full flow: reset → shuffle → deal → hand differs

**Alternatives Considered**:
- Unit test with mock rejected: Doesn't test actual shuffle implementation
- Assertion for 10/10 unique rejected: Theoretically possible to get duplicates, test would flake
- 8/10 threshold provides high confidence without brittleness

### RQ-006: Performance Measurement Approach

**Question**: How to verify the <500ms performance requirement (FR-008, SC-002)?

**Findings**:
- **Requirement**: Reset operation completes in under 500ms for standard 52-card deck
- **Actual expected**: ~5-10ms (single shuffle + state object construction)
- **Test approach**: Use `performance.now()` for high-precision timing

**Decision**: Add performance assertion to integration test with 500ms upper bound

**Rationale**:
- `performance.now()` provides sub-millisecond precision
- 500ms is extremely generous for this operation (likely finishes in <10ms)
- Test will catch performance regressions if shuffle or state logic becomes expensive
- Warning threshold at 100ms, hard failure at 500ms

**Implementation Detail**:
```
const start = performance.now()
dispatch({ type: 'RESET' })
const duration = performance.now() - start
expect(duration).toBeLessThan(500)
```

## Best Practices Applied

### BP-001: React State Management
- **Source**: React documentation on useReducer patterns
- **Applied**: Keep reducer pure (no side effects), use action types for clarity
- **Reference**: Existing deckReducer pattern in codebase

### BP-002: TypeScript Type Safety
- **Source**: TypeScript handbook on discriminated unions
- **Applied**: Add RESET to DeckAction discriminated union for type safety
- **Implementation**: `{ type: 'RESET' }` (no payload needed)

### BP-003: Shuffle Algorithm Reuse
- **Source**: Existing codebase at `src/lib/shuffle.ts`
- **Applied**: Use existing tested Fisher-Yates implementation
- **Rationale**: Algorithm already validated, uses crypto.getRandomValues with fallback

### BP-004: Component Responsibility
- **Source**: Feature 005 component contracts (DeckControls.tsx)
- **Applied**: Keep deck control buttons in DeckControls, not HandView
- **Consistency**: Reset button joins "Deal Next Hand", "End Turn", "Lock Order", etc.

## Dependencies and Constraints

### Existing Dependencies (No New Dependencies Required)
- React 18.2.0 - useReducer for state management
- TypeScript 5.3.3 - Type safety for actions
- Jest 29.7.0 - Testing framework
- @testing-library/react 14.1.2 - Component testing

### Constraints Validated
- **Performance**: <500ms target easily met (expected ~5-10ms actual)
- **Static site**: No server calls, no external dependencies
- **Offline-capable**: Reset works entirely client-side
- **Accessibility**: Button will follow existing DeckControls pattern (proper labels, keyboard access)

## Open Questions (Resolved)

All research questions resolved. No clarifications needed to proceed with implementation.

## Next Steps

Proceed to Phase 1:
1. Generate `data-model.md` - Document state transitions for RESET action
2. Generate `contracts/` - Define RESET action contract and behavior specifications
3. Generate `quickstart.md` - Implementation guidance for developers
4. Update agent context with any new patterns/technologies

---

**Research Status**: ✅ Complete  
**Ready for Phase 1**: Yes  
**Blockers**: None
