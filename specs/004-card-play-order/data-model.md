# Data Model: Card Play Order

**Feature**: 004-card-play-order  
**Date**: 2025-11-13  
**Based on**: [spec.md](./spec.md) Key Entities section

## Overview

This feature extends the existing `DeckState` interface to support play order selection, locking, and phase tracking. The data model follows the established pattern from Feature 003 (card discard mechanic), adding three new fields to track the Planning/Executing workflow.

## Core Type Extensions

### DeckState Interface

**Location**: `src/lib/types.ts`

**New Fields**:

```typescript
export interface DeckState {
  // ... existing fields from Features 001-003
  drawPile: string[]
  discardPile: string[]
  hand: string[]
  turnNumber: number
  handSize: number
  discardCount: number
  warning: string | null
  error: string | null
  isDealing: boolean
  handCards: CardInstance[]
  selectedCardIds: Set<string>
  discardPhase: DiscardPhase
  
  // Feature 004: Card Play Order additions
  playOrderSequence: string[]   // Ordered array of CardInstance.instanceIds
  playOrderLocked: boolean       // Whether the order is permanently locked
  planningPhase: boolean         // True during Planning, false otherwise
}
```

**Field Specifications**:

| Field | Type | Constraints | Default Value | Description |
|-------|------|-------------|---------------|-------------|
| `playOrderSequence` | `string[]` | Length 0-10, all values must be valid `instanceId` from `handCards` | `[]` | Ordered list of card instance IDs representing the play order. Index 0 is played first, index 1 second, etc. |
| `playOrderLocked` | `boolean` | N/A | `false` | Indicates whether the play order has been locked and can no longer be modified. |
| `planningPhase` | `boolean` | N/A | `false` | True when user is actively selecting play order (after discard confirmed, before locking). False during discard phase, executing phase, and when no active turn. |

**Invariants**:

1. **Uniqueness**: All `instanceId` values in `playOrderSequence` MUST be unique (no duplicates)
2. **Validity**: All `instanceId` values in `playOrderSequence` MUST exist in `handCards` array
3. **Completeness** (when locking): `playOrderSequence.length === handCards.length` when `LOCK_PLAY_ORDER` is dispatched
4. **Phase exclusivity**: `planningPhase` and `discardPhase.active` MUST NOT both be `true` simultaneously
5. **Lock persistence**: Once `playOrderLocked` becomes `true`, `playOrderSequence` MUST NOT change until next hand is dealt

---

## Action Types

**Location**: `src/lib/types.ts`

**New Actions**:

```typescript
export type DeckAction =
  | { type: 'INIT' }
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'APPLY_JSON_OVERRIDE'; payload: string }
  | { type: 'CHANGE_PARAMETERS'; payload: { handSize: number; discardCount: number; immediateReset: boolean } }
  | { type: 'TOGGLE_CARD_SELECTION'; payload: { instanceId: string } }
  | { type: 'CONFIRM_DISCARD' }
  // Feature 004: Play Order actions
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
```

**Action Specifications**:

### `SELECT_FOR_PLAY_ORDER`

**Purpose**: Add a card to the end of the play order sequence.

**Preconditions**:
- `planningPhase === true`
- `playOrderLocked === false`
- `payload.instanceId` exists in `handCards`
- `payload.instanceId` NOT already in `playOrderSequence`

**Postconditions**:
- `playOrderSequence` includes `payload.instanceId` at the end
- All other state unchanged

**Effect**: `playOrderSequence = [...playOrderSequence, payload.instanceId]`

---

### `DESELECT_FROM_PLAY_ORDER`

**Purpose**: Remove a card from the play order sequence and renumber subsequent cards.

**Preconditions**:
- `planningPhase === true`
- `playOrderLocked === false`
- `payload.instanceId` exists in `playOrderSequence`

**Postconditions**:
- `playOrderSequence` no longer includes `payload.instanceId`
- All subsequent cards maintain their relative order

**Effect**: `playOrderSequence = playOrderSequence.filter(id => id !== payload.instanceId)`

---

### `LOCK_PLAY_ORDER`

**Purpose**: Permanently lock the play order and transition from Planning to Executing phase.

**Preconditions**:
- `planningPhase === true`
- `playOrderSequence.length === handCards.length` (all cards ordered)
- `playOrderLocked === false`

**Postconditions**:
- `playOrderLocked === true`
- `planningPhase === false`
- `playOrderSequence` unchanged

**Effect**: Immutably sets locked state, preventing further modifications.

---

### `CLEAR_PLAY_ORDER`

**Purpose**: Remove all cards from the play order sequence, allowing user to restart.

**Preconditions**:
- `planningPhase === true`
- `playOrderLocked === false`

**Postconditions**:
- `playOrderSequence === []`
- All other state unchanged

**Effect**: `playOrderSequence = []`

---

## State Transitions

### Phase Lifecycle

```
┌─────────────────┐
│  Initial State  │
│  planningPhase: false
│  discardPhase.active: false
└────────┬────────┘
         │
         │ DEAL_NEXT_HAND (with discardCount > 0)
         ▼
┌─────────────────┐
│ Discard Phase   │
│  discardPhase.active: true
│  planningPhase: false
└────────┬────────┘
         │
         │ CONFIRM_DISCARD (handCards.length > 0)
         ▼
┌─────────────────┐
│ Planning Phase  │ ◄─── CLEAR_PLAY_ORDER (resets sequence only)
│  planningPhase: true   │
│  playOrderLocked: false │
│  playOrderSequence: []  │
└────────┬────────┘       │
         │ SELECT/DESELECT │
         │ actions         │
         │                 │
         │ (when all cards ordered)
         │                 │
         │ LOCK_PLAY_ORDER │
         ▼                 │
┌─────────────────┐       │
│ Executing Phase │       │
│  planningPhase: false   │
│  playOrderLocked: true  │
└────────┬────────┘
         │
         │ END_TURN → DEAL_NEXT_HAND
         ▼
┌─────────────────┐
│  Reset State    │
│  playOrderSequence: []
│  playOrderLocked: false
│  planningPhase: false
└─────────────────┘
```

**Special Cases**:

1. **Empty hand after discard** (`handCards.length === 0`):
   - Skip Planning phase entirely
   - `planningPhase` remains `false`
   - `END_TURN` can proceed immediately

2. **Single card remaining** (`handCards.length === 1`):
   - Still enter Planning phase
   - User must select the single card and lock
   - Enforces consistent workflow

---

## Derived Values

### Sequence Number Computation

**Function**: `getSequenceNumber(instanceId: string): number | null`

**Implementation**:
```typescript
const getSequenceNumber = (instanceId: string): number | null => {
  const index = state.playOrderSequence.indexOf(instanceId)
  return index >= 0 ? index + 1 : null
}
```

**Returns**:
- `null`: Card not in play order sequence
- `1-10`: Card's position in play order (1-based index)

**Usage**: UI components call this to display sequence number badges on cards.

---

### Planning Completion Status

**Function**: `isPlayOrderComplete(): boolean`

**Implementation**:
```typescript
const isPlayOrderComplete = (): boolean => {
  return state.playOrderSequence.length === state.handCards.length
}
```

**Returns**:
- `true`: All cards have been assigned a play order position
- `false`: Some cards remain unordered

**Usage**: Controls "Lock Order" button enabled state.

---

## Persistence Format

**Storage Key**: `deck-builder-state` (existing key, unchanged)

**Serialization**:
```typescript
const serialized = JSON.stringify({
  ...state,
  selectedCardIds: Array.from(state.selectedCardIds), // Set → Array
  // playOrderSequence already serializable (string[])
})
```

**Deserialization**:
```typescript
const deserialized = {
  ...parsed,
  selectedCardIds: new Set(parsed.selectedCardIds),
  // New fields default to safe values if missing (backward compatibility)
  playOrderSequence: parsed.playOrderSequence ?? [],
  playOrderLocked: parsed.playOrderLocked ?? false,
  planningPhase: parsed.planningPhase ?? false,
}
```

**Backward Compatibility**: Existing saved states (from Features 001-003) will load successfully with default values for new fields.

---

## Validation Rules

### Action Validation (in reducer)

```typescript
function selectForPlayOrder(state: DeckState, instanceId: string): DeckState {
  // Guard: Only during planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state // Ignore action
  }
  
  // Guard: instanceId must exist in handCards
  if (!state.handCards.some(card => card.instanceId === instanceId)) {
    return state // Ignore invalid ID
  }
  
  // Guard: instanceId must not already be in sequence
  if (state.playOrderSequence.includes(instanceId)) {
    return state // Ignore duplicate selection
  }
  
  // Valid: Add to sequence
  return {
    ...state,
    playOrderSequence: [...state.playOrderSequence, instanceId],
  }
}
```

### Lock Validation

```typescript
function lockPlayOrder(state: DeckState): DeckState {
  // Guard: Must be in planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }
  
  // Guard: All cards must be ordered
  if (state.playOrderSequence.length !== state.handCards.length) {
    return state // Cannot lock incomplete sequence
  }
  
  // Valid: Lock the order
  return {
    ...state,
    playOrderLocked: true,
    planningPhase: false,
  }
}
```

---

## Examples

### Example 1: Typical 5-Card Flow

**Initial state** (after discard confirmed, 3 cards remain):
```typescript
{
  handCards: [
    { instanceId: 'abc123', card: 'Card 1' },
    { instanceId: 'def456', card: 'Card 2' },
    { instanceId: 'ghi789', card: 'Card 3' },
  ],
  playOrderSequence: [],
  playOrderLocked: false,
  planningPhase: true,
}
```

**After selecting cards in order: Card 2, Card 3, Card 1**:
```typescript
{
  handCards: [...same...],
  playOrderSequence: ['def456', 'ghi789', 'abc123'],
  playOrderLocked: false,
  planningPhase: true,
}
```

**After LOCK_PLAY_ORDER**:
```typescript
{
  handCards: [...same...],
  playOrderSequence: ['def456', 'ghi789', 'abc123'], // Unchanged
  playOrderLocked: true,
  planningPhase: false, // Transitioned to Executing
}
```

**Sequence number mapping**:
- Card 1 (`abc123`): position 3
- Card 2 (`def456`): position 1
- Card 3 (`ghi789`): position 2

---

### Example 2: Deselecting a Card

**State before deselect** (Card 2 selected first):
```typescript
{
  playOrderSequence: ['def456', 'ghi789'],
  // Card 1 not yet ordered
}
```

**After DESELECT_FROM_PLAY_ORDER with instanceId 'def456'**:
```typescript
{
  playOrderSequence: ['ghi789'], // Card 3 renumbered from position 2 → position 1
}
```

---

### Example 3: Edge Case - Single Card

**State** (only 1 card remains after discard):
```typescript
{
  handCards: [{ instanceId: 'abc123', card: 'Card 1' }],
  playOrderSequence: [],
  planningPhase: true,
}
```

**User must still select the card**:
```typescript
// After SELECT_FOR_PLAY_ORDER
{
  playOrderSequence: ['abc123'],
  planningPhase: true,
}
```

**Then lock**:
```typescript
// After LOCK_PLAY_ORDER
{
  playOrderSequence: ['abc123'],
  playOrderLocked: true,
  planningPhase: false,
}
```

---

## Migration Strategy

**No migration required** - New fields have safe default values:

```typescript
// Default values for new installations or legacy saves
playOrderSequence: []           // Empty sequence
playOrderLocked: false          // Unlocked
planningPhase: false            // Not in planning phase
```

Existing saved states will load and continue to function correctly with these defaults.

---

## Type Summary

```typescript
// src/lib/types.ts additions

export interface DeckState {
  // ... existing fields ...
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
}

export type DeckAction =
  | ... existing actions ...
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
```

**No new interfaces required** - Feature integrates cleanly with existing `DeckState` and `DeckAction` types.
