# Contract: Play Order UI Component

**Feature**: 004-card-play-order  
**Components**: `src/components/HandView.tsx`, `src/components/DeckControls.tsx`  
**Date**: 2025-11-13  
**Based on**: [spec.md](../spec.md), [research.md](../research.md)

## Purpose

This contract defines the user interface behavior for play order selection, locking, and display. It specifies interaction patterns, visual states, accessibility requirements, and component responsibilities to ensure consistent user experience across mouse, keyboard, and touch interactions.

---

## Component Responsibilities

### HandView Component

**File**: `src/components/HandView.tsx`

**Responsibilities**:
1. Display sequence number badges on cards when they are ordered
2. Make cards clickable for play order selection during Planning phase
3. Apply locked/disabled styling when play order is locked
4. Support keyboard navigation (Tab) and selection (Space/Enter)
5. Support touch interactions (tap to select/deselect)
6. Provide ARIA labels for accessibility

---

### DeckControls Component

**File**: `src/components/DeckControls.tsx`

**Responsibilities**:
1. Display "Lock Order" button with appropriate enabled/disabled state
2. Display "Clear Order" button during Planning phase
3. Display phase status indicator ("Planning" or "Executing")
4. Manage button click handlers for lock and clear actions

---

## Visual States

### Card Visual States

#### State 1: Unordered Card (Planning Phase)

**Conditions**:
- `state.planningPhase === true`
- Card's `instanceId` NOT in `state.playOrderSequence`

**Visual Indicators**:
- No sequence number badge visible
- Normal card styling (per existing HandView implementation)
- Hover effect visible (indicates clickable)
- Cursor: `pointer`

**Behavior**:
- Clickable: Yes
- Keyboard selectable: Yes (Tab + Space/Enter)
- Touch selectable: Yes (tap)

---

#### State 2: Ordered Card (Planning Phase)

**Conditions**:
- `state.planningPhase === true`
- Card's `instanceId` exists in `state.playOrderSequence`

**Visual Indicators**:
- Sequence number badge visible (displays `playOrderSequence.indexOf(instanceId) + 1`)
- Badge styling:
  - Position: Top-right corner overlay
  - Background: Contrasting color (WCAG AA compliant)
  - Text: Bold, 1-based sequence number (1, 2, 3, ...)
- Hover effect visible (indicates clickable for deselection)
- Cursor: `pointer`

**Behavior**:
- Clickable: Yes (deselects card, removes from sequence)
- Keyboard selectable: Yes (Tab + Space/Enter to deselect)
- Touch selectable: Yes (tap to deselect)

---

#### State 3: Locked Card (Executing Phase)

**Conditions**:
- `state.playOrderLocked === true`
- `state.planningPhase === false`

**Visual Indicators**:
- Sequence number badge visible (permanent display)
- Locked styling applied:
  - Reduced opacity (e.g., 0.7) or grayscale filter
  - No hover effect
  - Cursor: `default` or `not-allowed`
- Visual distinction from Planning phase (e.g., badge color change)

**Behavior**:
- Clickable: No (all click events ignored)
- Keyboard selectable: No
- Touch selectable: No

---

### Control Button States

#### "Lock Order" Button

**Enabled State**:
- `state.planningPhase === true`
- `state.playOrderSequence.length === state.handCards.length` (all cards ordered)
- `state.playOrderLocked === false`

**Disabled State**:
- `state.planningPhase === false` OR
- `state.playOrderSequence.length < state.handCards.length` OR
- `state.playOrderLocked === true`

**Visual Indicators**:
- Enabled: Primary button styling, clickable
- Disabled: Greyed out, `cursor: not-allowed`, non-interactive

**Accessibility**:
```html
<button
  disabled={!canLock}
  aria-label="Lock play order (all cards must be ordered first)"
>
  Lock Order
</button>
```

---

#### "Clear Order" Button

**Visible State**:
- `state.planningPhase === true`
- `state.playOrderSequence.length > 0` (at least one card ordered)

**Hidden State**:
- `state.planningPhase === false` OR
- `state.playOrderLocked === true` OR
- `state.playOrderSequence.length === 0`

**Visual Indicators**:
- Secondary button styling (less prominent than "Lock Order")
- Always enabled when visible

**Accessibility**:
```html
<button
  aria-label="Clear all play order selections"
>
  Clear Order
</button>
```

---

#### Phase Status Indicator

**Planning Phase Display**:
- `state.planningPhase === true`
- Text: "Planning"
- Badge color: Blue or info color
- Optional icon: Edit/pencil icon

**Executing Phase Display**:
- `state.playOrderLocked === true`
- Text: "Executing"
- Badge color: Green or success color
- Optional icon: Lock icon

**Hidden State**:
- `state.discardPhase.active === true` (show discard status instead)
- Neither planning nor locked (initial/reset state)

**Accessibility**:
```html
<span 
  role="status" 
  aria-live="polite"
  aria-label="Current phase: Planning"
>
  Planning
</span>
```

---

## Interaction Contracts

### C201: Select Card for Play Order (Mouse)

**Trigger**: User clicks an unordered card

**Preconditions**:
- `state.planningPhase === true`
- Card's `instanceId` NOT in `state.playOrderSequence`
- `state.playOrderLocked === false`

**Action Dispatched**:
```typescript
dispatch({ 
  type: 'SELECT_FOR_PLAY_ORDER', 
  payload: { instanceId: card.instanceId } 
})
```

**Visual Feedback**:
- Sequence number badge appears within 100ms (per SC-003)
- Badge displays next position number (e.g., if 2 cards already ordered, shows "3")

---

### C202: Deselect Card from Play Order (Mouse)

**Trigger**: User clicks an ordered card

**Preconditions**:
- `state.planningPhase === true`
- Card's `instanceId` exists in `state.playOrderSequence`
- `state.playOrderLocked === false`

**Action Dispatched**:
```typescript
dispatch({ 
  type: 'DESELECT_FROM_PLAY_ORDER', 
  payload: { instanceId: card.instanceId } 
})
```

**Visual Feedback**:
- Sequence number badge disappears within 100ms
- All subsequent cards' badges renumber automatically (computed from array index)

---

### C203: Select Card for Play Order (Keyboard)

**Trigger**: User presses Space or Enter while card is focused

**Preconditions**:
- Card element has focus (via Tab navigation)
- `state.planningPhase === true`
- `state.playOrderLocked === false`

**Behavior**:
- If card is unordered: dispatch `SELECT_FOR_PLAY_ORDER`
- If card is ordered: dispatch `DESELECT_FROM_PLAY_ORDER`

**Accessibility Requirements**:
```typescript
const handleKeyPress = (e: React.KeyboardEvent, card: CardInstance) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault() // Prevent page scroll on Space
    
    const isOrdered = state.playOrderSequence.includes(card.instanceId)
    
    if (isOrdered) {
      dispatch({ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId: card.instanceId } })
    } else {
      dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId: card.instanceId } })
    }
  }
}
```

**Element Requirements**:
```html
<div
  role="button"
  tabIndex={state.planningPhase && !state.playOrderLocked ? 0 : -1}
  onKeyPress={handleKeyPress}
  aria-label={getCardAriaLabel(card)}
>
  {/* Card content */}
</div>
```

---

### C204: Select Card for Play Order (Touch)

**Trigger**: User taps an unordered card

**Preconditions**: Same as C201 (mouse selection)

**Behavior**: Same action dispatch as C201

**Touch Optimization**:
- Ensure touch target is at least 44x44px (iOS/Android standard)
- No hover effects on touch devices
- Tap feedback: brief highlight or scale animation (optional)

---

### C205: Lock Play Order Button Click

**Trigger**: User clicks "Lock Order" button

**Preconditions**:
- Button is enabled (all cards ordered)
- `state.playOrderLocked === false`

**Action Dispatched**:
```typescript
dispatch({ type: 'LOCK_PLAY_ORDER' })
```

**Visual Feedback** (within 100ms):
- Status badge changes: "Planning" → "Executing"
- All cards transition to locked styling
- "Lock Order" button disappears or becomes disabled
- "Clear Order" button disappears

---

### C206: Clear Play Order Button Click

**Trigger**: User clicks "Clear Order" button

**Preconditions**:
- `state.planningPhase === true`
- `state.playOrderSequence.length > 0`

**Action Dispatched**:
```typescript
dispatch({ type: 'CLEAR_PLAY_ORDER' })
```

**Visual Feedback** (within 100ms):
- All sequence number badges disappear
- All cards return to unordered visual state
- "Clear Order" button remains visible (can be used again)

---

### C207: Ignore Interactions When Locked

**Trigger**: User attempts any interaction with cards when locked

**Preconditions**:
- `state.playOrderLocked === true`

**Behavior**:
- All click/tap/keyboard events on cards are ignored
- No action dispatched
- No visual feedback (cursor: `not-allowed`)

---

## Accessibility Requirements (WCAG AA Compliance)

### Keyboard Navigation

**Tab Order** (Planning Phase):
```
1. First card in hand
2. Second card in hand
...
N. Last card in hand
N+1. "Clear Order" button (if visible)
N+2. "Lock Order" button (if enabled)
N+3. Other controls (e.g., "End Turn")
```

**Focus Indicators**:
- All focusable elements MUST have visible focus outline
- Outline contrast ratio ≥ 3:1 against background
- Outline thickness ≥ 2px

---

### Screen Reader Support

**Card ARIA Labels** (computed dynamically):

```typescript
const getCardAriaLabel = (card: CardInstance): string => {
  const sequenceNumber = state.playOrderSequence.indexOf(card.instanceId) + 1
  
  if (state.playOrderLocked) {
    return `${card.card}, play order position ${sequenceNumber}, locked`
  } else if (sequenceNumber > 0) {
    return `${card.card}, play order position ${sequenceNumber}, click to deselect`
  } else {
    return `${card.card}, not ordered, click to add to play order`
  }
}
```

**Example Outputs**:
- Unordered card: `"Card 1, not ordered, click to add to play order"`
- Ordered card (position 2): `"Card 3, play order position 2, click to deselect"`
- Locked card (position 1): `"Card 2, play order position 1, locked"`

---

### Sequence Number Badge

**Badge HTML**:
```html
<span 
  className="sequence-number-badge"
  aria-label={`Play order position ${sequenceNumber}`}
  role="status"
>
  {sequenceNumber}
</span>
```

**Badge Styling** (WCAG AA requirements):
```css
.sequence-number-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--primary-color); /* Must have ≥4.5:1 contrast with text */
  color: white;
  font-weight: bold;
  font-size: 1rem;
  padding: 4px 8px;
  border-radius: 50%;
  min-width: 32px;
  text-align: center;
}

.sequence-number-badge.locked {
  background: var(--success-color); /* Different color when locked */
}
```

---

### Live Region Announcements

**Phase Transitions**:
```html
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcePhaseChange()}
</div>
```

**Announcement Examples**:
- When entering Planning phase: `"Planning phase started. Select cards in your desired play order."`
- When locking order: `"Play order locked. Entering executing phase."`
- When clearing order: `"Play order cleared. Select cards to start over."`

---

## Performance Requirements

### Response Time (SC-003)

**Measurement**: Time from user interaction to visible state change

**Requirement**: ≤ 100ms for all interactions

**Critical Path**:
1. User clicks card (0ms)
2. Event handler fires (< 1ms)
3. Action dispatched to reducer (< 1ms)
4. State updated (< 5ms)
5. Component re-renders (< 10ms)
6. DOM updates, badge visible (< 100ms total)

**Optimization Strategies**:
- Use React.memo() for card components if re-render performance degrades
- Compute sequence numbers only in render (no useEffect needed)
- Avoid unnecessary state copies in reducer

---

## Component Integration

### HandView.tsx Modifications

**New Props** (from DeckState):
```typescript
interface HandViewProps {
  // Existing props...
  handCards: CardInstance[]
  selectedCardIds: Set<string>
  discardPhase: DiscardPhase
  
  // New props for Feature 004
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  
  // New action dispatchers
  onSelectForPlayOrder: (instanceId: string) => void
  onDeselectFromPlayOrder: (instanceId: string) => void
}
```

**Rendering Logic**:
```typescript
const getSequenceNumber = (instanceId: string): number | null => {
  const index = props.playOrderSequence.indexOf(instanceId)
  return index >= 0 ? index + 1 : null
}

const handleCardClick = (card: CardInstance) => {
  if (props.playOrderLocked) return // Ignore when locked
  
  if (!props.planningPhase) return // Only during planning
  
  const sequenceNumber = getSequenceNumber(card.instanceId)
  
  if (sequenceNumber !== null) {
    props.onDeselectFromPlayOrder(card.instanceId)
  } else {
    props.onSelectForPlayOrder(card.instanceId)
  }
}
```

---

### DeckControls.tsx Modifications

**New Props**:
```typescript
interface DeckControlsProps {
  // Existing props...
  
  // New props for Feature 004
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  handCardsCount: number
  
  // New action dispatchers
  onLockPlayOrder: () => void
  onClearPlayOrder: () => void
}
```

**Button Rendering Logic**:
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

---

## Test Coverage Requirements

### Unit Tests (HandView.test.tsx)

```typescript
describe('HandView - Play Order (Feature 004)', () => {
  it('C201: displays sequence number badge when card is ordered')
  it('C202: removes badge when card is deselected')
  it('C203: handles keyboard selection (Space/Enter)')
  it('C204: handles touch tap events')
  it('C207: ignores interactions when locked')
  it('renders locked styling when playOrderLocked is true')
  it('computes sequence numbers correctly from playOrderSequence array')
  it('provides correct ARIA labels for ordered/unordered/locked cards')
})
```

### Integration Tests (playOrderFlow.test.tsx - NEW FILE)

```typescript
describe('Play Order Flow Integration', () => {
  it('full flow: select 3 cards in order, lock, verify locked state')
  it('deselection renumbers subsequent cards correctly')
  it('clear button resets all selections')
  it('locked order persists across page refresh')
  it('turn end is blocked until order is locked')
  it('new hand resets play order state')
})
```

---

## CSS Styling Contract

### Required CSS Classes

**File**: `src/components/HandView.css`

```css
/* Sequence number badge */
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
  background: var(--success);
}

/* Card states */
.card-wrapper.planning {
  cursor: pointer;
}

.card-wrapper.planning:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-wrapper.locked {
  cursor: not-allowed;
  opacity: 0.7;
  filter: grayscale(20%);
}

.card-wrapper.locked:hover {
  transform: none; /* No hover effect when locked */
}
```

---

## Edge Case Handling

### EC-1: Single Card Remaining

**Scenario**: Only 1 card remains after discard

**UI Behavior**:
- User must still select the single card (displays "1" badge)
- "Lock Order" button becomes enabled after selection
- No functional difference from multi-card flow

---

### EC-2: All Cards Discarded

**Scenario**: 0 cards remain after discard

**UI Behavior**:
- Planning phase does NOT activate
- No play order controls visible
- "End Turn" button immediately available

---

### EC-3: Page Refresh During Planning

**Scenario**: User refreshes page with partially ordered cards (not locked)

**UI Behavior**:
- Play order state restored from localStorage
- Sequence number badges reappear on ordered cards
- User can continue selection or clear and restart

---

### EC-4: Page Refresh After Locking

**Scenario**: User refreshes page with locked play order

**UI Behavior**:
- Locked state restored from localStorage
- Cards display locked styling with sequence numbers
- Status shows "Executing"
- No modification possible

---

## References

- **Spec**: [spec.md](../spec.md) - FR-012 through FR-016 (UI requirements)
- **Research**: [research.md](../research.md) - Q5 (UI Component Architecture), Q6 (Accessibility)
- **Data Model**: [data-model.md](../data-model.md) - Derived values (getSequenceNumber)
- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/ (accessibility guidelines)
