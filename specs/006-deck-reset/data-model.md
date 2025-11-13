# Data Model: Deck Reset

**Feature**: 006-deck-reset  
**Date**: 2025-11-13  
**Status**: Complete

## Overview

This document defines the state entities and transitions for the deck reset feature. The feature introduces a new RESET action that returns the game state to its initial condition while preserving user configuration.

## Core Entities

### DeckState (Existing - Modified)

The global state object managed by `deckReducer`. No new fields added, but behavior changes on initialization.

**Relevant Fields for Reset**:

```typescript
interface DeckState {
  // Piles - RESET to initial values
  drawPile: string[]           // Reset to shuffled DEFAULT_DECK
  discardPile: string[]        // Reset to []
  hand: string[]               // Reset to empty, then dealt
  
  // Configuration - PRESERVED across reset
  handSize: number             // Preserved
  discardCount: number         // Preserved
  
  // Game state - RESET to initial values
  turnNumber: number           // Reset to 1
  warning: string | null       // Reset to null
  error: string | null         // Reset to null
  isDealing: boolean           // Reset to false
  
  // Feature 003 state - RESET
  handCards: CardInstance[]    // Reset to []
  selectedCardIds: Set<string> // Reset to new Set()
  discardPhase: DiscardPhase   // Reset to { active: false, remainingDiscards: 0 }
  
  // Feature 004 state - RESET
  playOrderSequence: string[]  // Reset to []
  playOrderLocked: boolean     // Reset to false
  planningPhase: boolean       // Reset to false
}
```

### Reset Operation (New Conceptual Entity)

**Purpose**: Encapsulates the logic for returning to initial state

**Behavior**:
- Calls `initializeDeck({ handSize, discardCount })` with preserved settings
- Shuffles deck using existing `shuffle()` function
- Deals initial hand
- Clears all transient state (selections, locks, phases)

**Not a data structure** - implemented as reducer logic in RESET action handler

### Initial State Definition

**Source of Truth**: `initializeDeck()` function in `deckReducer.ts`

**Components**:
1. Fresh deck created from `DEFAULT_DECK` constant
2. **New behavior**: Deck is shuffled immediately after creation
3. All piles empty except drawPile
4. Default or preserved hand size and discard count
5. All flags/phases reset to false
6. Turn counter reset to 1

## State Transitions

### Transition 1: Application Initialization (Page Load)

**Trigger**: App component mounts, dispatches INIT action

**Before**:
```typescript
state = undefined  // No state exists yet
```

**Process**:
1. INIT action handled by `initializeDeck()`
2. **Modified behavior**: `shuffle([...DEFAULT_DECK])` called (NEW)
3. Fresh state created with shuffled deck
4. `dealNextHand()` called to deal initial hand

**After**:
```typescript
state = {
  drawPile: [shuffled cards],      // Changed: Now shuffled
  discardPile: [],
  hand: [first N cards],
  handCards: [CardInstance array],
  turnNumber: 1,
  handSize: DEFAULT_HAND_SIZE,
  discardCount: DEFAULT_DISCARD_COUNT,
  selectedCardIds: new Set(),
  discardPhase: { active: false, remainingDiscards: 0 },
  playOrderSequence: [],
  playOrderLocked: false,
  planningPhase: false,
  warning: null,
  error: null,
  isDealing: false
}
```

### Transition 2: Manual Reset (Button Click)

**Trigger**: User clicks "Reset" button in DeckControls, dispatches RESET action

**Before** (Example mid-game state):
```typescript
state = {
  drawPile: [20 cards],
  discardPile: [15 cards],
  hand: [5 cards],
  handCards: [5 CardInstances],
  turnNumber: 8,
  handSize: 5,                    // User configured
  discardCount: 2,                // User configured
  selectedCardIds: new Set(['id1', 'id2']),
  discardPhase: { active: true, remainingDiscards: 1 },
  playOrderSequence: ['id1', 'id2', 'id3'],
  playOrderLocked: true,
  planningPhase: false,
  warning: "Low cards",
  error: null,
  isDealing: false
}
```

**Process**:
1. RESET action extracts `handSize` and `discardCount` from current state
2. Calls `initializeDeck({ handSize: 5, discardCount: 2 })`
3. Shuffle called on fresh deck
4. New state returned with preserved settings

**After**:
```typescript
state = {
  drawPile: [shuffled cards],
  discardPile: [],
  hand: [first 5 cards],         // Uses preserved handSize
  handCards: [5 new CardInstances],
  turnNumber: 1,
  handSize: 5,                   // PRESERVED
  discardCount: 2,               // PRESERVED
  selectedCardIds: new Set(),    // CLEARED
  discardPhase: { active: false, remainingDiscards: 0 },  // CLEARED
  playOrderSequence: [],         // CLEARED
  playOrderLocked: false,        // CLEARED
  planningPhase: false,
  warning: null,                 // CLEARED
  error: null,
  isDealing: false
}
```

**Invariants Maintained**:
- `handCards.length === hand.length` (always synchronized)
- `discardPhase.active === false` after reset (no active discard)
- `playOrderLocked === false` after reset (always unlocked)
- `selectedCardIds.size === 0` after reset (no selections)

### Transition 3: Persistence on Reset

**Trigger**: RESET action completes, persistence effect fires

**Before** (localStorage):
```json
{
  "drawPile": [20 cards],
  "discardPile": [15 cards],
  "hand": [5 cards],
  "turnNumber": 8,
  ...mid-game state
}
```

**Process**:
1. RESET action returns new initial state
2. `useDeckStatePersistence` hook detects state change via `useEffect`
3. `persistenceManager.save(newState)` called
4. New state serialized and written to localStorage

**After** (localStorage):
```json
{
  "drawPile": [freshly shuffled 47 cards],
  "discardPile": [],
  "hand": [5 cards],
  "turnNumber": 1,
  ...initial state
}
```

**Note**: Persistence layer unchanged. Reset clears persisted state by overwriting with fresh state, not by explicit `localStorage.clear()`.

## Action Contract

### RESET Action

**Type Signature**:
```typescript
{ type: 'RESET' }  // No payload needed
```

**Preconditions**:
- Can be dispatched at any time (no state requirements)
- Current state must exist (always true if app is running)

**Postconditions**:
- All game state returned to initial values (as if INIT was called)
- User settings (handSize, discardCount) preserved from pre-reset state
- Deck is shuffled (different card order than previous state)
- New CardInstance IDs generated (all old instance IDs invalidated)

**Side Effects**:
- Triggers persistence update (via existing persistence hook)
- UI re-renders with fresh hand display
- Button disabled state managed by component (not reducer)

## Validation Rules

### Preserved Fields Validation
- `handSize` must remain valid (≥1, ≤52)
- `discardCount` must remain valid (≥0, ≤handSize)

If preserved values are invalid (corrupted state), fallback to defaults:
- `handSize`: Use `DEFAULT_HAND_SIZE`
- `discardCount`: Use `DEFAULT_DISCARD_COUNT`

### Post-Reset Validation
- `drawPile.length + hand.length === 52` (standard deck)
- `discardPile.length === 0`
- `selectedCardIds.size === 0`
- `playOrderSequence.length === 0`
- `playOrderLocked === false`
- `planningPhase === false`

## Relationships to Existing Features

### Feature 001: Deck Mechanics
- **Reuses**: `initializeDeck()`, `dealNextHand()`, `shuffle()` functions
- **Modifies**: `initializeDeck()` to shuffle deck on creation

### Feature 003: Card Discard Mechanic
- **Clears**: `selectedCardIds`, `discardPhase.active`
- **Validates**: No cards should be in mid-discard state after reset

### Feature 004: Card Play Order
- **Clears**: `playOrderSequence`, `playOrderLocked`, `planningPhase`
- **Validates**: No play order should exist after reset

### Feature 005: Persistence
- **Uses**: Existing persistence layer (no changes)
- **Behavior**: Reset triggers automatic persistence of new state

## Performance Considerations

### Time Complexity
- RESET action: O(n) where n = deck size (52)
  - Shuffle: O(n) Fisher-Yates
  - State construction: O(1)
  - Hand dealing: O(handSize) = O(1) since handSize is small (~5-10)
- **Expected**: <10ms for standard 52-card deck
- **Requirement**: <500ms (easily met)

### Space Complexity
- New state object: O(n) for deck storage
- Temporary shuffle array: O(n)
- **Total**: O(n), same as existing state management

### Optimization Notes
- No optimization needed - operation is already fast
- Shuffle algorithm is optimal (Fisher-Yates, unbiased)
- State construction is simple object creation

## Migration Notes

**No migration required** - this is a new action, not a state schema change.

**Backward Compatibility**:
- Existing persisted states remain valid
- INIT action behavior changed (now shuffles), but produces valid state
- Old save games will load successfully and can be reset

**Breaking Changes**: None

---

**Data Model Status**: ✅ Complete  
**Validation**: All entities defined, all transitions documented  
**Ready for Contracts**: Yes
