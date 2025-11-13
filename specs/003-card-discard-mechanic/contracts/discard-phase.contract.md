# Contract: Discard Phase

**Feature**: 003-card-discard-mechanic  
**Date**: 2025-11-13  
**Status**: Complete

## Purpose

This contract defines the rules for discard phase activation, duration, and completion. It ensures the discard phase integrates correctly with the game loop and prevents turn progression until requirements are met.

---

## Phase Activation Rules

### Rule 1: Automatic Activation After Deal

**Contract**: The discard phase MUST activate automatically when a hand is dealt with `discardCount > 0`.

**Trigger**: `DEAL_NEXT_HAND` action completes

**Conditions**:
- IF `discardCount > 0` → Set `discardPhase = true`
- ELSE `discardCount === 0` → Set `discardPhase = false` (skip phase)

**Example**:
```typescript
// Case 1: Normal discard required
dealNextHand({ ...state, handSize: 5, discardCount: 3 })
// → state.discardPhase = true

// Case 2: No discard required (skip phase)
dealNextHand({ ...state, handSize: 5, discardCount: 0 })
// → state.discardPhase = false
```

**Test**:
```typescript
test('DEAL_NEXT_HAND enters discard phase when discardCount > 0', () => {
  const initialState = { ...emptyState, discardCount: 3, handSize: 5 };
  const action = { type: 'DEAL_NEXT_HAND' };
  const newState = deckReducer(initialState, action);
  
  expect(newState.discardPhase).toBe(true);
  expect(newState.handCards.length).toBe(5);
  expect(newState.selectedCardIds.size).toBe(0);
});
```

**Functional Requirement**: FR-001, FR-009

---

## Phase Duration Rules

### Rule 2: Turn End Blocked During Phase

**Contract**: The discard phase MUST prevent turn end actions until discard is confirmed.

**Enforcement**: `END_TURN` action returns unchanged state if `discardPhase === true`

**Implementation**:
```typescript
case 'END_TURN':
  if (state.discardPhase) {
    // Block turn end - return state unchanged
    return state;
  }
  // Normal turn end logic...
```

**UI Behavior**:
- "End Turn" button disabled when `discardPhase === true`
- Helper text shows: "Complete discard phase to end turn"
- Visual indicator shows discard phase active

**Test**:
```typescript
test('END_TURN blocked when discardPhase is true', () => {
  const stateInDiscardPhase = {
    ...mockState,
    discardPhase: true,
    handCards: [/* cards */]
  };
  const action = { type: 'END_TURN' };
  const newState = deckReducer(stateInDiscardPhase, action);
  
  expect(newState).toBe(stateInDiscardPhase); // No change
  expect(newState.turnNumber).toBe(stateInDiscardPhase.turnNumber);
});
```

**Functional Requirement**: FR-005

---

## Phase Completion Rules

### Rule 3: Confirmation Required to Exit Phase

**Contract**: The discard phase MUST exit when `CONFIRM_DISCARD` is executed with exactly the required selection count.

**Precondition**: `selectedCardIds.size === effectiveDiscardCount`

**Action**: `CONFIRM_DISCARD`

**State Changes**:
1. Move selected cards to discard pile (by value)
2. Remove selected cards from hand
3. Clear selection set (`selectedCardIds = new Set()`)
4. Exit phase (`discardPhase = false`)

**Implementation**:
```typescript
case 'CONFIRM_DISCARD':
  if (state.selectedCardIds.size !== effectiveDiscardCount) {
    // Button should be disabled, but handle gracefully
    return state;
  }
  
  const selectedCards = state.handCards.filter(card =>
    state.selectedCardIds.has(card.id)
  );
  const remainingCards = state.handCards.filter(card =>
    !state.selectedCardIds.has(card.id)
  );
  
  return {
    ...state,
    handCards: remainingCards,
    discardPile: [...state.discardPile, ...selectedCards.map(c => c.value)],
    selectedCardIds: new Set(),
    discardPhase: false,
    hand: remainingCards.map(c => c.value) // Backward compat
  };
```

**Test**:
```typescript
test('CONFIRM_DISCARD moves selected cards to discard pile', () => {
  const selectedIds = new Set(['id-1', 'id-2', 'id-3']);
  const stateInDiscard = {
    ...mockState,
    discardPhase: true,
    discardCount: 3,
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' },
      { id: 'id-3', value: 'K♦' },
      { id: 'id-4', value: '9♣' },
      { id: 'id-5', value: '2♥' }
    ],
    selectedCardIds: selectedIds,
    discardPile: []
  };
  
  const action = { type: 'CONFIRM_DISCARD' };
  const newState = deckReducer(stateInDiscard, action);
  
  expect(newState.discardPhase).toBe(false);
  expect(newState.handCards.length).toBe(2);
  expect(newState.discardPile).toEqual(['7♥', 'A♠', 'K♦']);
  expect(newState.selectedCardIds.size).toBe(0);
});
```

**Functional Requirement**: FR-007, FR-008

---

## Edge Cases

### Edge Case 1: discardCount = 0 (Skip Phase)

**Contract**: When `discardCount === 0`, the discard phase MUST be skipped entirely.

**Behavior**:
- `discardPhase = false` immediately after dealing
- "Discard Selected Cards" button NOT shown
- "End Turn" button enabled immediately
- No selection required

**Test**:
```typescript
test('discard count = 0 skips discard phase', () => {
  const initialState = { ...emptyState, discardCount: 0, handSize: 5 };
  const action = { type: 'DEAL_NEXT_HAND' };
  const newState = deckReducer(initialState, action);
  
  expect(newState.discardPhase).toBe(false);
  expect(newState.handCards.length).toBe(5);
  // User can end turn immediately
});
```

**Functional Requirement**: FR-009

### Edge Case 2: discardCount = handSize (All Cards)

**Contract**: When discard count equals hand size, all cards must be discarded.

**Behavior**:
- `effectiveDiscardCount = Math.min(discardCount, handCards.length)`
- User selects all cards in hand
- Confirmation leaves hand empty
- Turn can end with empty hand

**Test**:
```typescript
test('discard count = hand size requires all cards discarded', () => {
  const allCardIds = new Set(['id-1', 'id-2', 'id-3']);
  const stateWithFullSelection = {
    ...mockState,
    discardPhase: true,
    discardCount: 3,
    handSize: 3,
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' },
      { id: 'id-3', value: 'K♦' }
    ],
    selectedCardIds: allCardIds,
    discardPile: []
  };
  
  const action = { type: 'CONFIRM_DISCARD' };
  const newState = deckReducer(stateWithFullSelection, action);
  
  expect(newState.discardPhase).toBe(false);
  expect(newState.handCards.length).toBe(0); // Empty hand
  expect(newState.discardPile).toEqual(['7♥', 'A♠', 'K♦']);
});
```

**Functional Requirement**: FR-009

### Edge Case 3: discardCount > handSize (Capped to Hand Size)

**Contract**: When discard count exceeds hand size, the effective discard count MUST be capped at hand size.

**Behavior**:
- `effectiveDiscardCount = Math.min(discardCount, handCards.length)`
- Maximum selectable cards = hand size
- UI shows adjusted requirement (e.g., "Select 3 cards (capped from 5)")

**Example**:
```typescript
// discardCount = 5, handSize = 3
// effectiveDiscardCount = min(5, 3) = 3
// User can only select 3 cards (all in hand)
```

**Test**:
```typescript
test('discard count > hand size caps at hand size', () => {
  const initialState = { ...emptyState, discardCount: 5, handSize: 3 };
  const action = { type: 'DEAL_NEXT_HAND' };
  const newState = deckReducer(initialState, action);
  
  expect(newState.discardPhase).toBe(true);
  expect(newState.handCards.length).toBe(3);
  
  // Effective discard count = 3 (not 5)
  const effectiveDiscardCount = Math.min(5, newState.handCards.length);
  expect(effectiveDiscardCount).toBe(3);
});
```

**Functional Requirement**: FR-009

---

## State Persistence Behavior

### Contract: Phase State Persists, Selections Do Not

**Rule**: On page refresh during discard phase:
- ✅ `handCards` preserved (if persistence implemented)
- ✅ `discardPhase` preserved (user still in phase)
- ✅ `discardCount` preserved
- ❌ `selectedCardIds` cleared (new Set(), user must re-select)

**Rationale** (per research.md A1):
- Selection state is transient (user intent unclear after refresh)
- Hand contents and phase state are durable (game state)
- User re-selects cards after refresh (prevents accidental discard)

**Test** (when persistence implemented):
```typescript
test('page refresh during discard phase preserves hand but clears selections', () => {
  // Simulate state before refresh
  const stateBeforeRefresh = {
    ...mockState,
    discardPhase: true,
    handCards: [/* cards */],
    selectedCardIds: new Set(['id-1', 'id-2']),
    discardCount: 3
  };
  
  // Save to localStorage (if implemented)
  // localStorage.setItem('deckState', serialize(stateBeforeRefresh));
  
  // Simulate refresh (reinitialize state)
  const action = { type: 'INIT' };
  const newState = deckReducer({} as DeckState, action);
  
  expect(newState.discardPhase).toBe(true); // Preserved
  expect(newState.handCards).toEqual(stateBeforeRefresh.handCards); // Preserved
  expect(newState.selectedCardIds.size).toBe(0); // Cleared
  expect(newState.discardCount).toBe(3); // Preserved
});
```

**Functional Requirement**: FR-011

---

## Integration Points

### With Turn System

**Before discard feature**:
```
DEAL_NEXT_HAND → END_TURN (immediate)
```

**After discard feature**:
```
DEAL_NEXT_HAND → (if discardCount > 0) → DISCARD_PHASE → CONFIRM_DISCARD → END_TURN
                 (if discardCount === 0) → END_TURN (immediate)
```

### With Selection System

**Dependencies**:
- Discard phase provides context for selection limits
- Selection state (`selectedCardIds`) drives confirmation button enabled state
- Confirmation action consumes selection state and exits phase

**Flow**:
```
discardPhase = true
  ↓
User selects cards (TOGGLE_CARD_SELECTION)
  ↓
selectedCardIds.size === effectiveDiscardCount
  ↓
Confirmation button enabled
  ↓
CONFIRM_DISCARD → discardPhase = false
```

---

## Acceptance Criteria

From spec.md User Story 1:

**Scenario 1**: Discard phase activation
- ✅ Deal hand with discardCount > 0
- ✅ System enters discard phase automatically
- ✅ Status indicator shows "Discard Phase"
- ✅ "End Turn" button disabled

**Scenario 2**: Phase completion
- ✅ Select required number of cards
- ✅ Confirm discard action
- ✅ Cards removed from hand, added to discard pile
- ✅ Discard phase exits automatically
- ✅ "End Turn" button enabled

**Scenario 3**: Skip discard when count = 0
- ✅ Deal hand with discardCount = 0
- ✅ Discard phase NOT activated
- ✅ "End Turn" button enabled immediately
- ✅ No selection required

---

## Success Metrics

| Metric | Target | Validation |
|--------|--------|------------|
| SC-002: Turn block enforcement | 100% | Integration test + manual verification |
| FR-001: Phase activation accuracy | 100% | Unit test coverage |
| FR-005: Turn end blocking | 100% | Integration test |
| FR-009: Edge case handling | 100% | Dedicated edge case tests (T094-T098) |

---

## References

- **spec.md**: User Story 1 (discard phase flow), FR-001, FR-005, FR-007, FR-008, FR-009
- **data-model.md**: DeckState extensions, action types, state transitions
- **tasks.md**: T024, T031-T034, T042 (phase activation tests)

---

**Contract Status**: ✅ Complete  
**Next**: card-selection.contract.md
