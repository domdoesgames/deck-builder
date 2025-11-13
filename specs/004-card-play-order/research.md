# Technical Research: Card Play Order

**Feature**: 004-card-play-order  
**Date**: 2025-11-13  
**Status**: Phase 0 Complete

## Research Questions & Answers

### Q1: State Management Integration

**Question**: How should play order state integrate with the existing DeckState reducer pattern?

**Answer**: Extend the existing DeckState interface and deckReducer with new fields and actions.

**Rationale**: 
- Feature 003 already established the pattern: added `handCards`, `selectedCardIds`, `discardPhase` to DeckState
- Play order is conceptually similar: tracking user selections during a phase before finalizing
- Consistency with existing architecture minimizes learning curve and code complexity

**Implementation Approach**:
```typescript
// Extend DeckState in src/lib/types.ts
interface DeckState {
  // ... existing fields
  playOrderSequence: string[]  // Array of instanceIds in play order
  playOrderLocked: boolean      // Whether order is locked
  planningPhase: boolean        // True during Planning, false during Executing
}

// Add new actions to DeckAction union
type DeckAction = 
  | ... existing actions
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
```

---

### Q2: Phase Lifecycle & Transitions

**Question**: When does the Planning phase start, and how does it integrate with the existing discard phase?

**Answer**: Planning phase starts immediately after discard phase completes (when `CONFIRM_DISCARD` action is processed).

**Decision Tree**:
1. User deals hand → `discardPhase.active = true`, `planningPhase = false`
2. User confirms discard → `discardPhase.active = false`, `planningPhase = true` (if cards remain)
3. User locks play order → `planningPhase = false`, `playOrderLocked = true`
4. User ends turn / new hand dealt → `playOrderLocked = false`, `playOrderSequence = []`, `planningPhase = false`

**Edge Case Handling**:
- If 0 cards remain after discard: skip Planning phase entirely (FR-011)
- If 1 card remains: still require user to select it and lock (edge case documented in spec)

---

### Q3: Sequence Number Display

**Question**: Should sequence numbers be stored separately or computed dynamically from the playOrderSequence array?

**Answer**: Compute dynamically via `playOrderSequence.indexOf(instanceId) + 1`.

**Rationale**:
- Single source of truth (playOrderSequence array) prevents sync issues
- Simple lookup: O(n) is acceptable for max 10 cards
- Less state to manage and persist
- Automatic renumbering when cards are deselected (FR-004 requirement)

**Implementation**:
```typescript
// In HandView.tsx rendering logic
const getSequenceNumber = (instanceId: string): number | null => {
  const index = state.playOrderSequence.indexOf(instanceId)
  return index >= 0 ? index + 1 : null
}
```

---

### Q4: Persistence Strategy

**Question**: What should be persisted to localStorage, and how should failures be handled?

**Answer**: Persist entire DeckState (existing pattern) with silent fallback to in-memory.

**Existing Pattern** (from Feature 003):
```typescript
// In useDeckState.ts
useEffect(() => {
  try {
    localStorage.setItem('deck-builder-state', JSON.stringify(state))
  } catch {
    // Silent fallback per FR-020
  }
}, [state])
```

**New Fields to Persist**:
- `playOrderSequence: string[]`
- `playOrderLocked: boolean`
- `planningPhase: boolean`

**Migration Strategy**: No migration needed - new fields will default to safe initial values:
- `playOrderSequence` defaults to `[]`
- `playOrderLocked` defaults to `false`
- `planningPhase` defaults to `false`

**Failure Handling**: Per A8 clarification, failures are silent - feature continues to work in-memory only.

---

### Q5: UI Component Architecture

**Question**: Should play order controls be a new component or integrated into existing components?

**Answer**: Integrate into existing components with minimal new UI elements.

**Component Changes**:

1. **HandView.tsx** (existing component):
   - Add sequence number badge overlay to each card
   - Make cards clickable during Planning phase for play order selection
   - Apply locked/disabled styling when `playOrderLocked = true`

2. **DeckControls.tsx** (existing component):
   - Add "Lock Order" button (enabled when all cards ordered)
   - Add "Clear Order" button (enabled during Planning, disabled when locked)
   - Add status indicator: "Planning" vs "Executing"

3. **No new top-level components required**

**Rationale**: 
- Existing components already handle card interaction (Feature 003 discard selection)
- Minimize UI complexity per Constitution Principle I
- Reuse existing Pico CSS styling patterns

---

### Q6: Keyboard & Touch Accessibility

**Question**: How should keyboard navigation and touch interactions work for play order selection?

**Answer**: Extend existing interaction patterns from Feature 003.

**Keyboard Navigation** (FR-014):
- Tab: Navigate between cards in hand
- Space/Enter: Select card for next position in play order
- Tab to "Clear Order" button: Space/Enter to clear
- Tab to "Lock Order" button: Space/Enter to lock

**Touch Interactions** (FR-015):
- Tap card: Select for next position in play order
- Tap selected card: Deselect and renumber
- Tap "Clear Order": Clear all selections
- Tap "Lock Order": Lock the sequence

**Accessibility Requirements** (Constitution Principle III):
```html
<!-- Sequence number badge -->
<span 
  className="sequence-number" 
  aria-label="Play order position {number}"
>
  {number}
</span>

<!-- Card wrapper -->
<div
  role="button"
  tabIndex={0}
  aria-label="Card {card.card}, {sequenceNumber ? `position ${sequenceNumber}` : 'not ordered'}"
  onKeyPress={handleKeyPress}
>
```

---

### Q7: Locked Order Display

**Question**: What is the "clear visual display" for the locked order mentioned in User Story 3?

**Answer**: In-place display with enhanced visual indicators - no modal or separate view.

**Visual Design**:
- Cards remain in original hand position (not reordered visually)
- Each card shows its sequence number badge prominently
- Status badge changes: "Planning" → "Executing"
- Cards receive locked/disabled styling (reduced opacity, no hover effects)
- Optional: Lock icon indicator near status badge

**Rationale**:
- Per A1 clarification: "manually show their screen to another player"
- No need for special sharing view - existing layout with clear sequence numbers is sufficient
- Simpler implementation, fewer state transitions

---

### Q8: Turn End Integration

**Question**: How does play order integrate with the existing END_TURN action?

**Answer**: Modify `endTurn` function in deckReducer to check `playOrderLocked` before allowing turn end.

**Modified Logic**:
```typescript
function endTurn(state: DeckState): DeckState {
  // Existing check: block if dealing
  if (state.isDealing) return state
  
  // Feature 003 check: block if discard phase active
  if (state.discardPhase.active) return state
  
  // Feature 004 check: block if planning phase active OR order not locked
  if (state.planningPhase || (state.playOrderSequence.length > 0 && !state.playOrderLocked)) {
    return state
  }
  
  // ... existing turn end logic
  
  // When dealing next hand, reset play order state (per A4 clarification)
  return dealNextHand({
    ...emptyHandState,
    playOrderSequence: [],
    playOrderLocked: false,
    planningPhase: false,
  })
}
```

**Edge Case**: If hand has 0 cards after discard, `playOrderSequence.length = 0`, so turn can end immediately without locking.

---

## Technical Decisions Summary

| Decision Area | Choice | Justification |
|---------------|--------|---------------|
| State management | Extend DeckState with 3 new fields | Consistency with Feature 003 pattern |
| Phase transitions | Planning starts after CONFIRM_DISCARD | Natural flow: discard → plan → execute |
| Sequence numbers | Computed from array index | Single source of truth, auto-renumber |
| Persistence | Full DeckState to localStorage | Existing pattern, silent fallback |
| UI components | Integrate into HandView & DeckControls | Minimize complexity, reuse patterns |
| Accessibility | Keyboard (Tab/Space/Enter) + Touch (tap) | WCAG AA compliance, existing patterns |
| Locked display | In-place with visual indicators | Simple, sufficient for manual sharing |
| Turn end logic | Block until locked or 0 cards | Enforces game rules per FR-010 |

---

## Open Questions / Risks

**None identified** - All technical unknowns resolved through analysis of existing codebase and spec clarifications (A1-A8).

---

## Next Steps

Proceed to **Phase 1 - Design & Contracts**:
1. Generate `data-model.md` - Define PlayOrderPhase interface and state shape
2. Generate API contracts:
   - `play-order-state.contract.md` - State transitions and action contracts
   - `play-order-ui.contract.md` - Component behavior and accessibility
3. Generate `quickstart.md` - Developer onboarding guide for implementing feature
