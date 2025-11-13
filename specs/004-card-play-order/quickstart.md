# Developer Quickstart: Card Play Order

**Feature**: 004-card-play-order  
**Date**: 2025-11-13  
**For**: Developers implementing this feature

## Overview

This feature allows users to select a play order for their remaining cards after the discard phase, lock that order to prevent changes, and display it for sharing. The implementation extends the existing deck state management with three new fields and four new actions.

**Estimated Implementation Time**: 6-8 hours for experienced developer

---

## Prerequisites

Before implementing this feature, ensure you have:

1. ✅ Completed Features 001 (Deck Mechanics), 002 (Hand Display), and 003 (Card Discard Mechanic)
2. ✅ Familiarity with the existing `DeckState`, `deckReducer`, and `HandView` component
3. ✅ Read the [spec.md](./spec.md) and [data-model.md](./data-model.md) documents
4. ✅ Reviewed the two contracts:
   - [play-order-state.contract.md](./contracts/play-order-state.contract.md)
   - [play-order-ui.contract.md](./contracts/play-order-ui.contract.md)

---

## Implementation Checklist

### Phase 1: State Management (2-3 hours)

#### Step 1.1: Extend Type Definitions

**File**: `src/lib/types.ts`

**Add to `DeckState` interface**:
```typescript
export interface DeckState {
  // ... existing fields ...
  
  // Feature 004: Card Play Order
  playOrderSequence: string[]   // Ordered array of CardInstance.instanceIds
  playOrderLocked: boolean       // Whether the order is permanently locked
  planningPhase: boolean         // True during Planning, false otherwise
}
```

**Add to `DeckAction` type union**:
```typescript
export type DeckAction =
  | ... existing actions ...
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
```

**Validation**: Run `npm run build` - should compile with no errors (though existing code may need updates)

---

#### Step 1.2: Initialize State in Reducer

**File**: `src/state/deckReducer.ts`

**Update `initializeDeck()` function**:
```typescript
function initializeDeck(): DeckState {
  const drawPile = [...DEFAULT_DECK]
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    turnNumber: 1,
    handSize: DEFAULT_HAND_SIZE,
    discardCount: DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
    handCards: [],
    selectedCardIds: new Set(),
    discardPhase: { active: false, remainingDiscards: 0 },
    // Feature 004: Initialize play order state
    playOrderSequence: [],
    playOrderLocked: false,
    planningPhase: false,
  }
  
  return dealNextHand(initialState)
}
```

**Validation**: Run `npm test` - existing tests should still pass

---

#### Step 1.3: Implement Action Handlers

**File**: `src/state/deckReducer.ts`

**Add new action cases to `deckReducer()` function**:
```typescript
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    // ... existing cases ...
    
    case 'SELECT_FOR_PLAY_ORDER':
      return selectForPlayOrder(state, action.payload.instanceId)
    
    case 'DESELECT_FROM_PLAY_ORDER':
      return deselectFromPlayOrder(state, action.payload.instanceId)
    
    case 'LOCK_PLAY_ORDER':
      return lockPlayOrder(state)
    
    case 'CLEAR_PLAY_ORDER':
      return clearPlayOrder(state)
    
    default:
      return state
  }
}
```

**Implement the four new reducer functions** (see contract T101-T112 for full specs):

```typescript
function selectForPlayOrder(state: DeckState, instanceId: string): DeckState {
  // Guard: Only during planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }
  
  // Guard: instanceId must exist in handCards
  if (!state.handCards.some(card => card.instanceId === instanceId)) {
    return state
  }
  
  // Guard: instanceId must not already be in sequence
  if (state.playOrderSequence.includes(instanceId)) {
    return state
  }
  
  // Valid: Add to sequence
  return {
    ...state,
    playOrderSequence: [...state.playOrderSequence, instanceId],
  }
}

function deselectFromPlayOrder(state: DeckState, instanceId: string): DeckState {
  // Guard: Only during planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }
  
  // Guard: instanceId must exist in sequence
  if (!state.playOrderSequence.includes(instanceId)) {
    return state
  }
  
  // Valid: Remove from sequence
  return {
    ...state,
    playOrderSequence: state.playOrderSequence.filter(id => id !== instanceId),
  }
}

function lockPlayOrder(state: DeckState): DeckState {
  // Guard: Must be in planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }
  
  // Guard: All cards must be ordered
  if (state.playOrderSequence.length !== state.handCards.length) {
    return state
  }
  
  // Valid: Lock the order
  return {
    ...state,
    playOrderLocked: true,
    planningPhase: false,
  }
}

function clearPlayOrder(state: DeckState): DeckState {
  // Guard: Only during planning phase
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }
  
  // Valid: Clear sequence
  return {
    ...state,
    playOrderSequence: [],
  }
}
```

**Validation**: Run `npm run build` - should compile successfully

---

#### Step 1.4: Modify Existing Actions

**Update `confirmDiscard()` function** to initiate planning phase:

```typescript
function confirmDiscard(state: DeckState): DeckState {
  // ... existing discard logic ...
  
  return {
    ...state,
    handCards: remainingHandCards,
    hand: remainingHand,
    discardPile,
    selectedCardIds: new Set(),
    discardPhase: {
      active: false,
      remainingDiscards: 0,
    },
    // Feature 004: Initiate planning phase if cards remain
    planningPhase: remainingHandCards.length > 0,
    playOrderSequence: [],
    playOrderLocked: false,
  }
}
```

**Update `endTurn()` function** to block during planning phase:

```typescript
export function endTurn(state: DeckState): DeckState {
  // Existing guards...
  if (state.isDealing) return state
  if (state.discardPhase.active) return state
  
  // Feature 004: Block if planning phase active or order not locked
  if (state.planningPhase) return state
  if (state.playOrderSequence.length > 0 && !state.playOrderLocked) {
    return state
  }
  
  // ... existing turn end logic ...
}
```

**Update `dealNextHand()` function** to reset play order state:

```typescript
export function dealNextHand(state: DeckState, preserveWarning = false): DeckState {
  // ... existing deal logic ...
  
  return {
    ...state,
    drawPile,
    discardPile,
    hand,
    warning,
    error: null,
    isDealing: false,
    handCards,
    selectedCardIds: new Set(),
    discardPhase: {
      active: effectiveDiscardCount > 0,
      remainingDiscards: effectiveDiscardCount,
    },
    // Feature 004: Reset play order state
    playOrderSequence: [],
    playOrderLocked: false,
    planningPhase: false,
  }
}
```

**Validation**: Run `npm test` - all existing tests should still pass

---

### Phase 2: UI Components (2-3 hours)

#### Step 2.1: Update HandView Component

**File**: `src/components/HandView.tsx`

**Add new props**:
```typescript
interface HandViewProps {
  // ... existing props ...
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  onSelectForPlayOrder: (instanceId: string) => void
  onDeselectFromPlayOrder: (instanceId: string) => void
}
```

**Add sequence number computation helper**:
```typescript
const getSequenceNumber = (instanceId: string): number | null => {
  const index = props.playOrderSequence.indexOf(instanceId)
  return index >= 0 ? index + 1 : null
}
```

**Update card click handler**:
```typescript
const handleCardClick = (card: CardInstance) => {
  // Ignore during discard phase (Feature 003 handles this)
  if (props.discardPhase.active) {
    // ... existing discard selection logic ...
    return
  }
  
  // Feature 004: Play order selection
  if (props.planningPhase && !props.playOrderLocked) {
    const sequenceNumber = getSequenceNumber(card.instanceId)
    
    if (sequenceNumber !== null) {
      props.onDeselectFromPlayOrder(card.instanceId)
    } else {
      props.onSelectForPlayOrder(card.instanceId)
    }
  }
}
```

**Add keyboard handler**:
```typescript
const handleKeyPress = (e: React.KeyboardEvent, card: CardInstance) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    handleCardClick(card)
  }
}
```

**Update card rendering** (add sequence number badge):
```typescript
{handCards.map(card => {
  const sequenceNumber = getSequenceNumber(card.instanceId)
  const isLocked = playOrderLocked
  
  return (
    <div
      key={card.instanceId}
      className={`card-wrapper ${planningPhase ? 'planning' : ''} ${isLocked ? 'locked' : ''}`}
      onClick={() => handleCardClick(card)}
      onKeyPress={(e) => handleKeyPress(e, card)}
      role="button"
      tabIndex={planningPhase && !isLocked ? 0 : -1}
      aria-label={getCardAriaLabel(card, sequenceNumber, isLocked)}
    >
      {sequenceNumber !== null && (
        <span 
          className={`card-sequence-number ${isLocked ? 'locked' : ''}`}
          aria-label={`Play order position ${sequenceNumber}`}
        >
          {sequenceNumber}
        </span>
      )}
      {/* Existing card content */}
    </div>
  )
})}
```

**Add ARIA label helper**:
```typescript
const getCardAriaLabel = (
  card: CardInstance, 
  sequenceNumber: number | null, 
  isLocked: boolean
): string => {
  if (isLocked && sequenceNumber !== null) {
    return `${card.card}, play order position ${sequenceNumber}, locked`
  } else if (sequenceNumber !== null) {
    return `${card.card}, play order position ${sequenceNumber}, click to deselect`
  } else {
    return `${card.card}, not ordered, click to add to play order`
  }
}
```

**Validation**: Component should render without errors (may need CSS updates to look correct)

---

#### Step 2.2: Add CSS Styling

**File**: `src/components/HandView.css`

**Add sequence number badge styles**:
```css
.card-sequence-number {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--primary);
  color: var(--primary-inverse);
  font-weight: bold;
  font-size: 1.125rem;
  padding: 6px 10px;
  border-radius: 50%;
  min-width: 36px;
  text-align: center;
  z-index: 10;
}

.card-sequence-number.locked {
  background: var(--success, #28a745);
}

.card-wrapper.planning {
  cursor: pointer;
}

.card-wrapper.planning:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.card-wrapper.locked {
  cursor: not-allowed;
  opacity: 0.7;
  filter: grayscale(20%);
}

.card-wrapper.locked:hover {
  transform: none;
  box-shadow: none;
}
```

**Validation**: Cards should display sequence numbers when selected, with hover effects only when unlocked

---

#### Step 2.3: Update DeckControls Component

**File**: `src/components/DeckControls.tsx`

**Add new props**:
```typescript
interface DeckControlsProps {
  // ... existing props ...
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  handCardsCount: number
  onLockPlayOrder: () => void
  onClearPlayOrder: () => void
}
```

**Add button state computation**:
```typescript
const canLockOrder = 
  props.planningPhase && 
  !props.playOrderLocked && 
  props.playOrderSequence.length === props.handCardsCount &&
  props.handCardsCount > 0

const showClearButton = 
  props.planningPhase && 
  !props.playOrderLocked && 
  props.playOrderSequence.length > 0

const phaseStatus = props.playOrderLocked ? 'Executing' : 
                    props.planningPhase ? 'Planning' : null
```

**Add UI elements** (insert after discard controls):
```typescript
{/* Feature 004: Play Order Controls */}
{phaseStatus && (
  <div className="phase-status">
    <span 
      role="status" 
      aria-live="polite"
      className={`badge ${phaseStatus.toLowerCase()}`}
    >
      {phaseStatus}
    </span>
  </div>
)}

{showClearButton && (
  <button
    onClick={props.onClearPlayOrder}
    aria-label="Clear all play order selections"
    className="secondary"
  >
    Clear Order
  </button>
)}

<button
  onClick={props.onLockPlayOrder}
  disabled={!canLockOrder}
  aria-label="Lock play order (all cards must be ordered first)"
>
  Lock Order
</button>
```

**Validation**: Buttons should appear in appropriate states, Lock Order only enabled when all cards ordered

---

#### Step 2.4: Wire Up in App

**File**: `src/App.tsx` (or wherever `useDeckState` is used)

**Pass new props to HandView**:
```typescript
<HandView
  handCards={state.handCards}
  selectedCardIds={state.selectedCardIds}
  discardPhase={state.discardPhase}
  playOrderSequence={state.playOrderSequence}
  playOrderLocked={state.playOrderLocked}
  planningPhase={state.planningPhase}
  onToggleCardSelection={(id) => dispatch({ type: 'TOGGLE_CARD_SELECTION', payload: { instanceId: id } })}
  onSelectForPlayOrder={(id) => dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: id } })}
  onDeselectFromPlayOrder={(id) => dispatch({ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: id } })}
/>
```

**Pass new props to DeckControls**:
```typescript
<DeckControls
  // ... existing props ...
  playOrderSequence={state.playOrderSequence}
  playOrderLocked={state.playOrderLocked}
  planningPhase={state.planningPhase}
  handCardsCount={state.handCards.length}
  onLockPlayOrder={() => dispatch({ type: 'LOCK_PLAY_ORDER' })}
  onClearPlayOrder={() => dispatch({ type: 'CLEAR_PLAY_ORDER' })}
/>
```

**Validation**: Run `npm run dev` and test the full flow manually

---

### Phase 3: Testing (2-3 hours)

#### Step 3.1: Write Contract Tests

**File**: `tests/contract/playOrderContracts.test.ts` (NEW FILE)

**Test all state contracts** (T101-T119 from play-order-state.contract.md):

```typescript
import { deckReducer } from '../../src/state/deckReducer'
import { DeckState } from '../../src/lib/types'

describe('Play Order State Contracts', () => {
  describe('SELECT_FOR_PLAY_ORDER', () => {
    it('T101: adds instanceId to playOrderSequence when valid', () => {
      const state: DeckState = {
        // ... minimal state setup ...
        planningPhase: true,
        playOrderLocked: false,
        playOrderSequence: [],
        handCards: [
          { instanceId: 'abc123', card: 'Card 1' },
          { instanceId: 'def456', card: 'Card 2' },
        ],
      }
      
      const result = deckReducer(state, {
        type: 'SELECT_FOR_PLAY_ORDER',
        payload: { instanceId: 'abc123' },
      })
      
      expect(result.playOrderSequence).toEqual(['abc123'])
      expect(result.playOrderSequence.length).toBe(1)
    })
    
    // ... implement T102-T104 ...
  })
  
  // ... implement tests for other actions ...
})
```

**Run tests**: `npm test tests/contract/playOrderContracts.test.ts`

---

#### Step 3.2: Write Integration Tests

**File**: `tests/integration/playOrderFlow.test.tsx` (NEW FILE)

**Test full user flows**:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from '../../src/App'

describe('Play Order Integration Flow', () => {
  it('full flow: discard, select play order, lock, verify locked state', async () => {
    render(<App />)
    
    // 1. Deal initial hand
    fireEvent.click(screen.getByText('Deal Hand'))
    
    // 2. Confirm discard (enter planning phase)
    fireEvent.click(screen.getByText('Confirm Discard'))
    
    // 3. Verify planning phase
    expect(screen.getByText('Planning')).toBeInTheDocument()
    
    // 4. Select cards in order
    const cards = screen.getAllByRole('button', { name: /Card \d/ })
    fireEvent.click(cards[1]) // Select second card first
    fireEvent.click(cards[0]) // Select first card second
    
    // 5. Verify sequence numbers
    expect(screen.getByText('1')).toBeInTheDocument() // On second card
    expect(screen.getByText('2')).toBeInTheDocument() // On first card
    
    // 6. Lock order
    fireEvent.click(screen.getByText('Lock Order'))
    
    // 7. Verify locked state
    expect(screen.getByText('Executing')).toBeInTheDocument()
    
    // 8. Attempt to modify (should be ignored)
    fireEvent.click(cards[0])
    expect(screen.getByText('1')).toBeInTheDocument() // Still shows position 1
  })
})
```

**Run tests**: `npm test tests/integration/playOrderFlow.test.tsx`

---

#### Step 3.3: Update Existing Tests

**Files to update**:
- `tests/unit/deckReducer.test.ts` - Add new state fields to existing test assertions
- `tests/integration/turnCycle.test.tsx` - Verify turn doesn't end during planning phase
- `tests/unit/HandView.test.tsx` - Add tests for sequence number rendering

**Example update** (turnCycle.test.tsx):
```typescript
it('blocks turn end during planning phase', () => {
  const state: DeckState = {
    // ... setup state ...
    planningPhase: true,
    playOrderLocked: false,
  }
  
  const result = deckReducer(state, { type: 'END_TURN' })
  
  expect(result).toEqual(state) // No change
  expect(result.planningPhase).toBe(true)
})
```

**Run all tests**: `npm test` - should have 100% pass rate

---

### Phase 4: Final Polish & Validation (1 hour)

#### Step 4.1: Accessibility Audit

**Manual Checklist**:
- [ ] All interactive elements have visible focus indicators
- [ ] Sequence number badges have 4.5:1 contrast ratio with background
- [ ] Screen reader announces phase changes ("Planning", "Executing")
- [ ] Keyboard navigation works (Tab through cards, Space/Enter to select)
- [ ] Touch interactions work on mobile/tablet
- [ ] ARIA labels are descriptive and accurate

**Tools**: Use browser dev tools accessibility panel to verify

---

#### Step 4.2: Performance Testing

**Validation** (per SC-003):
- [ ] Card selection response time < 100ms (measure with Chrome DevTools Performance tab)
- [ ] Sequence number badge appears immediately after click
- [ ] No visible lag when locking order with 10 cards

**Optimization**: If performance is slow, consider memoizing card components with `React.memo()`

---

#### Step 4.3: Persistence Testing

**Manual Test**:
1. Select play order partially (e.g., 2 out of 5 cards)
2. Refresh page
3. Verify: Sequence numbers reappear on correct cards
4. Lock the order
5. Refresh page again
6. Verify: Locked state persists, status shows "Executing"

**Validation**: State should survive refresh with no data loss

---

#### Step 4.4: Edge Case Testing

**Test Scenarios**:
- [ ] Single card remaining after discard (must still select and lock)
- [ ] Zero cards remaining after discard (skip planning phase)
- [ ] Deselect middle card in sequence (verify renumbering)
- [ ] Clear order and restart selection
- [ ] Attempt to end turn without locking (should block)

---

## Common Pitfalls & Solutions

### Pitfall 1: Sequence Numbers Not Updating

**Symptom**: Badge shows wrong number after deselection

**Cause**: Storing sequence number instead of computing from index

**Solution**: Always compute via `playOrderSequence.indexOf(instanceId) + 1`

---

### Pitfall 2: Locked State Can Be Modified

**Symptom**: User can still select cards after locking

**Cause**: Missing `playOrderLocked` guard in action handlers

**Solution**: Add guard to all selection actions:
```typescript
if (state.playOrderLocked) return state
```

---

### Pitfall 3: Turn Doesn't End After Locking

**Symptom**: "End Turn" button stays disabled after locking

**Cause**: Missing logic to allow turn end when locked

**Solution**: Verify `endTurn()` allows turn when `playOrderLocked === true`

---

### Pitfall 4: Planning Phase Not Triggered

**Symptom**: No play order phase after discard

**Cause**: `confirmDiscard()` not setting `planningPhase: true`

**Solution**: Add planning phase initiation in `confirmDiscard()`:
```typescript
planningPhase: remainingHandCards.length > 0
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test playOrderContracts.test.ts

# Run tests in watch mode
npm test -- --watch

# Check test coverage
npm test -- --coverage

# Build and verify
npm run build

# Lint code
npm run lint

# Dev server (manual testing)
npm run dev
```

---

## Success Criteria Verification

After implementation, verify all success criteria from spec.md:

- [ ] **SC-001**: Time yourself ordering 5 cards (should be < 15 seconds)
- [ ] **SC-002**: Verify turn cannot proceed without locking (test manually)
- [ ] **SC-003**: Sequence numbers appear within 100ms (measure in DevTools)
- [ ] **SC-004**: Have someone unfamiliar with the feature test it (95% success rate)
- [ ] **SC-005**: Locked order cannot be modified by any means (test exhaustively)
- [ ] **SC-006**: Locked order persists across refresh (test manually)

---

## Next Steps

After completing this feature:

1. **Update AGENTS.md**: Run `.specify/scripts/bash/update-agent-context.sh`
2. **Generate tasks.md**: Run `/speckit.tasks` command
3. **Create feature branch**: `git checkout -b 004-card-play-order-implementation`
4. **Implement & test**: Follow this checklist step-by-step
5. **Create pull request**: Include testing screenshots and accessibility audit results

---

## Support & References

- **Spec**: [spec.md](./spec.md) - Functional requirements and user stories
- **Data Model**: [data-model.md](./data-model.md) - State shape and types
- **State Contract**: [contracts/play-order-state.contract.md](./contracts/play-order-state.contract.md)
- **UI Contract**: [contracts/play-order-ui.contract.md](./contracts/play-order-ui.contract.md)
- **Research**: [research.md](./research.md) - Technical decisions and rationale

**Questions?** Review the contracts first - they contain detailed behavior specifications for all edge cases.
