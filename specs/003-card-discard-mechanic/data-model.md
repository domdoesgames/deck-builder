# Data Model: Card Discard Mechanic (Feature 003)

**Date**: 2025-11-13  
**Phase**: 1 (Design)  
**Status**: Complete

## Overview

This document defines the data structures, type extensions, and state transitions for the card discard mechanic. It establishes the foundation for implementing card instance tracking, selection state management, and discard phase flow.

---

## Core Types

### CardInstance

Represents an individual card with a unique instance identifier, enabling selection tracking across identical card values.

```typescript
interface CardInstance {
  /** Unique identifier for this card instance (UUID v4) */
  id: string;
  
  /** The card's value/rank (e.g., "A♠", "7♥", "K♦") */
  value: string;
}
```

**Generation**: Use `crypto.randomUUID()` with fallback to `Date.now() + Math.random()` for legacy browser support (per research.md Section 1).

**Uniqueness guarantee**: Each dealt card receives a new UUID, even if values are identical (e.g., two "7♥" cards have different IDs).

---

## DeckState Extensions

Extensions to the existing `DeckState` interface to support discard phase and selection tracking.

### New Fields

```typescript
interface DeckState {
  // Existing fields (unchanged)
  drawPile: string[];
  discardPile: string[];
  hand: string[];  // DEPRECATED - keep for 1 release cycle
  turnNumber: number;
  handSize: number;
  discardCount: number;
  warning: string | null;
  error: string | null;
  isDealing: boolean;
  
  // New fields for Feature 003
  /** Card instances with unique IDs (replaces deprecated 'hand') */
  handCards: CardInstance[];
  
  /** Set of selected card IDs (transient, cleared on refresh) */
  selectedCardIds: Set<string>;
  
  /** Whether the discard phase is active (blocks turn end) */
  discardPhase: boolean;
}
```

### Field Semantics

**handCards**:
- Replaces deprecated `hand: string[]`
- Populated when `dealNextHand()` is called
- Each card has a unique `id` for selection tracking
- Synced to deprecated `hand` field for backward compatibility (map `.value`)

**selectedCardIds**:
- Set of card instance IDs currently selected for discard
- Maximum size: `effectiveDiscardCount` (capped at `handCards.length`)
- Cleared when discard is confirmed or new hand dealt
- NOT persisted (transient state per research.md Section 3, A1)

**discardPhase**:
- `true` when user must select and discard cards before ending turn
- `true` when `discardCount > 0` after dealing
- `false` when `discardCount === 0` (skip discard) or after confirming discard
- Blocks turn end action when `true` (per FR-005)

---

## Action Types

New Redux-style actions for discard mechanic.

### TOGGLE_CARD_SELECTION

Adds or removes a card from the selection set.

```typescript
{
  type: 'TOGGLE_CARD_SELECTION';
  payload: string;  // Card instance ID
}
```

**Behavior**:
1. If card ID is in `selectedCardIds` → Remove it (deselect)
2. If card ID is NOT in `selectedCardIds` AND `size < effectiveDiscardCount` → Add it (select)
3. If card ID is NOT in `selectedCardIds` AND `size === effectiveDiscardCount` → Ignore (max limit reached)

**Effective discard count**: `Math.min(discardCount, handCards.length)` (handles edge cases per FR-009)

### CONFIRM_DISCARD

Confirms the discard action, moving selected cards to discard pile.

```typescript
{
  type: 'CONFIRM_DISCARD';
  // No payload
}
```

**Behavior**:
1. Filter `handCards` into selected (in `selectedCardIds`) and remaining (not in set)
2. Extract `.value` from selected cards → append to `discardPile` array
3. Update `handCards` to remaining cards only
4. Clear `selectedCardIds` (empty Set)
5. Set `discardPhase: false` (exit discard phase)
6. Update deprecated `hand` field (map `handCards` to `.value`)

**Precondition**: `selectedCardIds.size === effectiveDiscardCount` (button disabled otherwise)

---

## State Transition Diagram

### Discard Phase Activation

```
DEAL_NEXT_HAND action
  ↓
Generate handCards with CardInstance objects
  ↓
Check discardCount
  ├─ discardCount > 0 → discardPhase = true
  └─ discardCount === 0 → discardPhase = false (skip)
  ↓
Initialize selectedCardIds = new Set() (empty)
```

### Selection Flow

```
User clicks card (or presses Space/Enter)
  ↓
TOGGLE_CARD_SELECTION(cardId)
  ↓
Check if cardId in selectedCardIds
  ├─ YES → Remove from set (deselect)
  └─ NO → Check set size
       ├─ size < effectiveDiscardCount → Add to set (select)
       └─ size === effectiveDiscardCount → Ignore (max limit)
  ↓
UI updates visual selection state
```

### Discard Confirmation Flow

```
User clicks "Discard Selected Cards" button
  ↓
CONFIRM_DISCARD action
  ↓
Separate handCards into selected/remaining
  ↓
Move selected card values to discardPile
  ↓
Update handCards to remaining cards
  ↓
Clear selectedCardIds (empty Set)
  ↓
Set discardPhase = false
  ↓
User can now end turn (END_TURN button enabled)
```

### Turn End Blocking

```
User attempts to click "End Turn" button
  ↓
Check discardPhase
  ├─ true → Button disabled (no action)
  └─ false → END_TURN action proceeds
```

---

## Phase Transition Flowchart

```
┌─────────────────┐
│  Draw Phase     │
│ (normal state)  │
└────────┬────────┘
         │
         │ DEAL_NEXT_HAND (discardCount > 0)
         ↓
┌─────────────────┐
│ Discard Phase   │
│ Active          │
│                 │
│ discardPhase:   │
│   true          │
│ selectedCardIds:│
│   new Set()     │
└────────┬────────┘
         │
         │ User selects cards
         ↓
┌─────────────────┐
│ Selection In    │
│ Progress        │
│                 │
│ selectedCardIds:│
│   {id1, id2}    │
└────────┬────────┘
         │
         │ Selected count === effectiveDiscardCount
         ↓
┌─────────────────┐
│ Ready to        │
│ Discard         │
│                 │
│ Discard button: │
│   enabled       │
└────────┬────────┘
         │
         │ CONFIRM_DISCARD
         ↓
┌─────────────────┐
│ Draw Phase      │
│ Restored        │
│                 │
│ discardPhase:   │
│   false         │
│ selectedCardIds:│
│   new Set()     │
└─────────────────┘
```

### Edge Case: discardCount = 0

```
DEAL_NEXT_HAND (discardCount = 0)
  ↓
Generate handCards
  ↓
Set discardPhase = false (skip discard phase)
  ↓
User can immediately end turn (no selection required)
```

### Edge Case: discardCount >= handSize

```
DEAL_NEXT_HAND (discardCount = 5, handSize = 3)
  ↓
Generate 3 handCards
  ↓
Calculate effectiveDiscardCount = min(5, 3) = 3
  ↓
Set discardPhase = true
  ↓
User must select all 3 cards (max selection limit = 3)
  ↓
CONFIRM_DISCARD → handCards becomes empty []
```

---

## Backward Compatibility

### Deprecated 'hand' Field

**Migration strategy** (per plan.md):
- Keep `hand: string[]` in DeckState for 1 release cycle
- Sync `hand` with `handCards` in every state return:
  ```typescript
  return {
    ...newState,
    hand: newState.handCards.map(card => card.value)
  };
  ```
- Components use `handCards` going forward
- Remove `hand` field in next major version

### Why keep 'hand'?

- Prevents breaking existing code that may read `state.hand`
- Allows gradual migration if external integrations exist
- Zero impact on new feature implementation (automatic sync)

---

## Invariants and Constraints

### Selection Invariants

1. **Size constraint**: `selectedCardIds.size <= effectiveDiscardCount` at all times
2. **Membership constraint**: All IDs in `selectedCardIds` exist in `handCards` (no orphaned selections)
3. **Transient state**: `selectedCardIds` cleared on:
   - New hand dealt (`DEAL_NEXT_HAND`)
   - Discard confirmed (`CONFIRM_DISCARD`)
   - Page refresh (NOT persisted)

### Phase Invariants

1. **Phase activation**: `discardPhase === true` IFF `discardCount > 0` after dealing
2. **Turn blocking**: `END_TURN` disabled when `discardPhase === true`
3. **Confirmation requirement**: `CONFIRM_DISCARD` only executes when `selectedCardIds.size === effectiveDiscardCount`

### Effective Discard Count

**Formula**: `effectiveDiscardCount = Math.min(discardCount, handCards.length)`

**Purpose**: Handles edge cases where discard count exceeds hand size (per FR-009).

**Usage**:
- Selection limit check: `selectedCardIds.size < effectiveDiscardCount`
- Button disabled state: `selectedCardIds.size !== effectiveDiscardCount`
- Status text: "Select X of Y cards" where Y = effectiveDiscardCount

---

## Testing Implications

### Unit Test Scenarios

**CardInstance generation**:
- ✅ Generates unique IDs for identical values
- ✅ Preserves card value correctly
- ✅ Multiple calls produce different IDs

**TOGGLE_CARD_SELECTION**:
- ✅ Adds card ID to empty set
- ✅ Removes card ID if already present (deselect)
- ✅ Prevents adding when max limit reached
- ✅ Allows adding when under limit

**CONFIRM_DISCARD**:
- ✅ Moves selected card values to discard pile
- ✅ Removes selected cards from handCards
- ✅ Clears selectedCardIds
- ✅ Sets discardPhase to false

**Phase transitions**:
- ✅ discardPhase true when discardCount > 0
- ✅ discardPhase false when discardCount === 0
- ✅ END_TURN blocked when discardPhase true

### Integration Test Scenarios

**Full discard flow**:
- Deal hand with discardCount=3
- Select 3 cards via click
- Confirm discard
- Verify cards removed from hand
- Verify cards added to discard pile
- Verify can now end turn

**Edge cases**:
- discardCount = 0 (skip discard phase)
- discardCount = handSize (all cards)
- discardCount > handSize (capped to handSize)

---

## References

- **spec.md**: FR-001 to FR-014 (functional requirements)
- **research.md**: UUID generation, keyboard navigation, state persistence
- **plan.md**: Architecture, migration strategy, phase organization
- **tasks.md**: Implementation task breakdown (T012-T039 for data model)

---

**Data Model Complete**: Phase 1 → Proceed to Contracts
