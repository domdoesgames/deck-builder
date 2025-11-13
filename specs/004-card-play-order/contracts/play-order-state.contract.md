# Contract: Play Order State Management

**Feature**: 004-card-play-order  
**Component**: `src/state/deckReducer.ts`  
**Date**: 2025-11-13  
**Based on**: [data-model.md](../data-model.md)

## Purpose

This contract defines the behavior of the play order state management system within the `deckReducer`. It specifies the preconditions, postconditions, and invariants for all play order-related actions to ensure correct state transitions and data integrity.

---

## State Shape Extensions

```typescript
interface DeckState {
  // Existing fields...
  playOrderSequence: string[]   // Ordered array of CardInstance.instanceIds
  playOrderLocked: boolean       // Whether the order is permanently locked
  planningPhase: boolean         // True during Planning, false otherwise
}
```

**Initial Values** (when state is first created or reset):
- `playOrderSequence: []`
- `playOrderLocked: false`
- `planningPhase: false`

---

## Action Contracts

### T101: SELECT_FOR_PLAY_ORDER - Valid Selection

**Action**: `{ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'abc123' } }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `payload.instanceId` exists in `state.handCards` (valid card instance)
- `payload.instanceId` NOT in `state.playOrderSequence` (not already selected)

**Postconditions**:
- `state.playOrderSequence.includes(payload.instanceId) === true`
- `state.playOrderSequence[state.playOrderSequence.length - 1] === payload.instanceId` (added to end)
- All other state fields unchanged
- `state.playOrderSequence.length` increased by 1

**Invariants Maintained**:
- All `instanceId` values in `playOrderSequence` are unique
- All `instanceId` values in `playOrderSequence` exist in `handCards`

---

### T102: SELECT_FOR_PLAY_ORDER - Ignore When Not in Planning Phase

**Action**: `{ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'abc123' } }`

**Preconditions**:
- `state.planningPhase === false` OR `state.playOrderLocked === true`

**Postconditions**:
- State completely unchanged (action ignored)
- `state.playOrderSequence` remains identical

---

### T103: SELECT_FOR_PLAY_ORDER - Ignore Invalid Instance ID

**Action**: `{ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'invalid' } }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `payload.instanceId` does NOT exist in `state.handCards`

**Postconditions**:
- State completely unchanged (action ignored)
- `state.playOrderSequence` remains identical

---

### T104: SELECT_FOR_PLAY_ORDER - Ignore Duplicate Selection

**Action**: `{ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'abc123' } }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `payload.instanceId` already exists in `state.playOrderSequence`

**Postconditions**:
- State completely unchanged (action ignored)
- `state.playOrderSequence` remains identical (no duplicate added)

---

### T105: DESELECT_FROM_PLAY_ORDER - Valid Deselection

**Action**: `{ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: 'def456' } }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `payload.instanceId` exists in `state.playOrderSequence`

**Initial State Example**:
```typescript
playOrderSequence: ['abc123', 'def456', 'ghi789']
```

**Postconditions**:
```typescript
playOrderSequence: ['abc123', 'ghi789']  // 'def456' removed, order preserved
```

- `state.playOrderSequence` no longer includes `payload.instanceId`
- Relative order of remaining cards preserved
- `state.playOrderSequence.length` decreased by 1
- All other state fields unchanged

**Renumbering Effect**: Cards after the removed card automatically get renumbered (via array index computation)

---

### T106: DESELECT_FROM_PLAY_ORDER - Ignore When Not in Sequence

**Action**: `{ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: 'notInSequence' } }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `payload.instanceId` does NOT exist in `state.playOrderSequence`

**Postconditions**:
- State completely unchanged (action ignored)

---

### T107: DESELECT_FROM_PLAY_ORDER - Ignore When Locked

**Action**: `{ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: 'abc123' } }`

**Preconditions**:
- `state.playOrderLocked === true`

**Postconditions**:
- State completely unchanged (locked order cannot be modified)

---

### T108: LOCK_PLAY_ORDER - Valid Lock (All Cards Ordered)

**Action**: `{ type: 'LOCK_PLAY_ORDER' }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`
- `state.playOrderSequence.length === state.handCards.length` (all cards ordered)

**Postconditions**:
- `state.playOrderLocked === true`
- `state.planningPhase === false` (transition to Executing phase)
- `state.playOrderSequence` unchanged
- All other state fields unchanged

**Phase Transition**: `Planning → Executing`

---

### T109: LOCK_PLAY_ORDER - Ignore When Incomplete

**Action**: `{ type: 'LOCK_PLAY_ORDER' }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderSequence.length < state.handCards.length` (some cards not ordered)

**Postconditions**:
- State completely unchanged (cannot lock incomplete sequence)
- `state.playOrderLocked` remains `false`
- `state.planningPhase` remains `true`

---

### T110: LOCK_PLAY_ORDER - Ignore When Already Locked

**Action**: `{ type: 'LOCK_PLAY_ORDER' }`

**Preconditions**:
- `state.playOrderLocked === true`

**Postconditions**:
- State completely unchanged (already locked)

---

### T111: CLEAR_PLAY_ORDER - Valid Clear

**Action**: `{ type: 'CLEAR_PLAY_ORDER' }`

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderLocked === false`

**Postconditions**:
- `state.playOrderSequence === []` (empty array)
- `state.planningPhase` remains `true`
- `state.playOrderLocked` remains `false`
- All other state fields unchanged

**Effect**: Allows user to restart play order selection from scratch

---

### T112: CLEAR_PLAY_ORDER - Ignore When Locked

**Action**: `{ type: 'CLEAR_PLAY_ORDER' }`

**Preconditions**:
- `state.playOrderLocked === true`

**Postconditions**:
- State completely unchanged (locked order cannot be cleared)

---

### T113: CONFIRM_DISCARD - Initiate Planning Phase

**Action**: `{ type: 'CONFIRM_DISCARD' }`

**Preconditions**:
- `state.discardPhase.active === true`
- After discard confirmation, `state.handCards.length > 0` (cards remain)

**Postconditions**:
- `state.discardPhase.active === false`
- `state.planningPhase === true` (initiate Planning phase)
- `state.playOrderSequence === []` (reset to empty)
- `state.playOrderLocked === false`

**Phase Transition**: `Discard → Planning`

---

### T114: CONFIRM_DISCARD - Skip Planning Phase (No Cards Remain)

**Action**: `{ type: 'CONFIRM_DISCARD' }`

**Preconditions**:
- `state.discardPhase.active === true`
- After discard confirmation, `state.handCards.length === 0` (all cards discarded)

**Postconditions**:
- `state.discardPhase.active === false`
- `state.planningPhase === false` (skip Planning phase)
- `state.playOrderSequence === []`
- `state.playOrderLocked === false`

**Phase Transition**: `Discard → (no Planning phase) → ready for END_TURN`

---

### T115: END_TURN - Block When Planning Phase Active

**Action**: `{ type: 'END_TURN' }`

**Preconditions**:
- `state.planningPhase === true` (still in Planning phase)

**Postconditions**:
- State completely unchanged (turn cannot end during Planning)

**Rationale**: User must complete play order selection and lock before ending turn (FR-010)

---

### T116: END_TURN - Block When Order Not Locked

**Action**: `{ type: 'END_TURN' }`

**Preconditions**:
- `state.playOrderSequence.length > 0` (cards were ordered)
- `state.playOrderLocked === false` (order not locked)

**Postconditions**:
- State completely unchanged (turn cannot end with unlocked order)

**Rationale**: Enforces order locking requirement (FR-010)

---

### T117: END_TURN - Allow When No Play Order Required

**Action**: `{ type: 'END_TURN' }`

**Preconditions**:
- `state.discardPhase.active === false`
- `state.planningPhase === false`
- `state.playOrderSequence.length === 0` (no play order was started)

**Postconditions**:
- Normal END_TURN behavior proceeds (move hand to discard, deal next hand)

**Rationale**: If no cards remained after discard, no play order phase occurs, turn can end

---

### T118: END_TURN - Allow When Locked

**Action**: `{ type: 'END_TURN' }`

**Preconditions**:
- `state.discardPhase.active === false`
- `state.planningPhase === false`
- `state.playOrderLocked === true`

**Postconditions**:
- Normal END_TURN behavior proceeds
- Next hand dealt has reset play order state:
  - `playOrderSequence: []`
  - `playOrderLocked: false`
  - `planningPhase: false`

**Phase Transition**: `Executing → (new hand) → Discard`

---

### T119: DEAL_NEXT_HAND - Reset Play Order State

**Action**: `{ type: 'DEAL_NEXT_HAND' }`

**Preconditions**: (any state)

**Postconditions**:
- New hand dealt with reset play order:
  - `state.playOrderSequence === []`
  - `state.playOrderLocked === false`
  - `state.planningPhase === false` (will transition to `true` after discard if needed)

**Rationale**: Each new hand starts fresh, per A4 clarification

---

## State Invariants

The reducer MUST maintain these invariants at all times:

1. **Mutual Exclusivity**: `state.discardPhase.active` and `state.planningPhase` MUST NOT both be `true`
2. **Uniqueness**: All values in `state.playOrderSequence` MUST be unique (no duplicates)
3. **Validity**: All values in `state.playOrderSequence` MUST exist in `state.handCards`
4. **Completeness for Lock**: If `state.playOrderLocked === true`, then `state.playOrderSequence.length` MUST equal the number of cards that were in hand when locked
5. **Lock Immutability**: If `state.playOrderLocked === true`, then `state.playOrderSequence` MUST NOT change until next hand is dealt
6. **Planning Phase Constraints**: If `state.planningPhase === true`, then `state.discardPhase.active` MUST be `false`

---

## Persistence Behavior

**Contract**: All play order state fields MUST be persisted to localStorage after every state mutation.

**Serialization**:
```typescript
localStorage.setItem('deck-builder-state', JSON.stringify(state))
```

**Deserialization** (with backward compatibility):
```typescript
const loaded = JSON.parse(localStorage.getItem('deck-builder-state'))
const state = {
  ...loaded,
  playOrderSequence: loaded.playOrderSequence ?? [],
  playOrderLocked: loaded.playOrderLocked ?? false,
  planningPhase: loaded.planningPhase ?? false,
}
```

**Failure Handling** (per FR-020):
```typescript
try {
  localStorage.setItem('deck-builder-state', JSON.stringify(state))
} catch {
  // Silent fallback - continue with in-memory state
}
```

---

## Test Coverage Requirements

All tests MUST validate:
1. ✅ Each action contract (T101-T119) with explicit before/after state assertions
2. ✅ All six state invariants are maintained across action sequences
3. ✅ Phase transitions occur correctly (Discard → Planning → Executing → reset)
4. ✅ Locked state cannot be modified by any action except DEAL_NEXT_HAND or END_TURN
5. ✅ Persistence serialization/deserialization round-trips correctly
6. ✅ Backward compatibility with states that lack new fields

**Suggested Test Structure**:
```typescript
describe('deckReducer - Play Order (Feature 004)', () => {
  describe('SELECT_FOR_PLAY_ORDER', () => {
    it('T101: adds instanceId to playOrderSequence when valid')
    it('T102: ignores when not in planning phase')
    it('T103: ignores invalid instanceId')
    it('T104: ignores duplicate selection')
  })
  
  // ... similar structure for other actions
  
  describe('State Invariants', () => {
    it('maintains mutual exclusivity of discard and planning phases')
    it('maintains uniqueness of playOrderSequence values')
    // ... etc
  })
})
```

---

## Example Scenarios

### Scenario 1: Complete Flow (3 Cards)

```typescript
// Initial state after CONFIRM_DISCARD
{
  handCards: [
    { instanceId: 'a', card: 'Card 1' },
    { instanceId: 'b', card: 'Card 2' },
    { instanceId: 'c', card: 'Card 3' },
  ],
  playOrderSequence: [],
  playOrderLocked: false,
  planningPhase: true,
}

// User selects Card 2
dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'b' } })
// → playOrderSequence: ['b']

// User selects Card 1
dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'a' } })
// → playOrderSequence: ['b', 'a']

// User selects Card 3
dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'c' } })
// → playOrderSequence: ['b', 'a', 'c']

// User locks
dispatch({ type: 'LOCK_PLAY_ORDER' })
// → playOrderLocked: true, planningPhase: false

// Attempt to modify (should be ignored)
dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: 'a' } })
// → State unchanged (T102)

// End turn
dispatch({ type: 'END_TURN' })
// → New hand dealt with playOrderSequence: [], playOrderLocked: false, planningPhase: false
```

### Scenario 2: Deselection & Renumbering

```typescript
// State with partial selection
{
  playOrderSequence: ['b', 'a', 'c'],
  planningPhase: true,
  playOrderLocked: false,
}

// Card sequence numbers: b=1, a=2, c=3

// User deselects Card 1 (instanceId 'a')
dispatch({ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: 'a' } })
// → playOrderSequence: ['b', 'c']

// Card sequence numbers now: b=1, c=2 (automatic renumbering via index)
```

### Scenario 3: Clear and Restart

```typescript
{
  playOrderSequence: ['b', 'a'],
  planningPhase: true,
  playOrderLocked: false,
}

// User clicks "Clear Order"
dispatch({ type: 'CLEAR_PLAY_ORDER' })
// → playOrderSequence: []

// User can now restart selection from scratch
```

---

## References

- **Spec**: [spec.md](../spec.md) - FR-001 through FR-020
- **Data Model**: [data-model.md](../data-model.md) - State shape and action definitions
- **Research**: [research.md](../research.md) - Q8 (Turn End Integration)
