# Contract: Card Selection

**Feature**: 003-card-discard-mechanic  
**Date**: 2025-11-13  
**Status**: Complete

## Purpose

This contract defines the rules for card selection toggle logic, maximum selection enforcement, and deselection behavior. It ensures users can select exactly the required number of cards with clear feedback and constraints.

---

## Selection Toggle Logic

### Rule 1: Toggle Behavior (Add or Remove)

**Contract**: Clicking a card (or pressing Space/Enter) MUST toggle its selection state.

**Action**: `TOGGLE_CARD_SELECTION` with `payload: cardId`

**Logic**:
```typescript
if (selectedCardIds.has(cardId)) {
  // Card already selected → Remove (deselect)
  selectedCardIds.delete(cardId);
} else {
  // Card not selected → Check if under limit
  const effectiveDiscardCount = Math.min(discardCount, handCards.length);
  if (selectedCardIds.size < effectiveDiscardCount) {
    // Under limit → Add (select)
    selectedCardIds.add(cardId);
  } else {
    // At max limit → Ignore (no-op)
    // Do nothing, button/card should be visually disabled
  }
}
```

**Cases**:

| Current State | Action | Result |
|---------------|--------|--------|
| Card NOT selected, under limit | Click card | Card selected ✅ |
| Card NOT selected, at max limit | Click card | No change (ignored) ❌ |
| Card selected | Click card | Card deselected ✅ |

**Test**:
```typescript
test('TOGGLE_CARD_SELECTION adds card ID to selectedCardIds', () => {
  const state = {
    ...mockState,
    discardCount: 3,
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' }
    ],
    selectedCardIds: new Set()
  };
  
  const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
  const newState = deckReducer(state, action);
  
  expect(newState.selectedCardIds.has('id-1')).toBe(true);
  expect(newState.selectedCardIds.size).toBe(1);
});

test('TOGGLE_CARD_SELECTION removes card ID if already selected', () => {
  const state = {
    ...mockState,
    discardCount: 3,
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' }
    ],
    selectedCardIds: new Set(['id-1'])
  };
  
  const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
  const newState = deckReducer(state, action);
  
  expect(newState.selectedCardIds.has('id-1')).toBe(false);
  expect(newState.selectedCardIds.size).toBe(0);
});
```

**Functional Requirement**: FR-002, FR-006

---

## Maximum Selection Limit Enforcement

### Rule 2: Prevent Exceeding Discard Count

**Contract**: The system MUST prevent users from selecting more cards than required.

**Limit**: `effectiveDiscardCount = Math.min(discardCount, handCards.length)`

**Enforcement**:
1. **State level**: `TOGGLE_CARD_SELECTION` ignores add requests when at max
2. **UI level**: Unselected cards become unclickable when limit reached

**Implementation**:
```typescript
case 'TOGGLE_CARD_SELECTION':
  const { payload: cardId } = action;
  const effectiveDiscardCount = Math.min(
    state.discardCount,
    state.handCards.length
  );
  
  const newSelectedCardIds = new Set(state.selectedCardIds);
  
  if (newSelectedCardIds.has(cardId)) {
    // Deselect (always allowed)
    newSelectedCardIds.delete(cardId);
  } else if (newSelectedCardIds.size < effectiveDiscardCount) {
    // Select (only if under limit)
    newSelectedCardIds.add(cardId);
  }
  // Else: at max limit, ignore (no state change)
  
  return {
    ...state,
    selectedCardIds: newSelectedCardIds
  };
```

**UI Behavior**:
```tsx
// In HandView component
const isMaxSelected = selectedCardIds.size >= effectiveDiscardCount;
const isCardSelected = selectedCardIds.has(card.id);
const isDisabled = isMaxSelected && !isCardSelected;

<div
  className={`card ${isCardSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
  onClick={() => {
    if (!isDisabled) {
      toggleCardSelection(card.id);
    }
  }}
  aria-disabled={isDisabled}
>
  {card.value}
</div>
```

**Test**:
```typescript
test('TOGGLE_CARD_SELECTION prevents exceeding discard count', () => {
  const state = {
    ...mockState,
    discardCount: 2, // Limit = 2
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' },
      { id: 'id-3', value: 'K♦' }
    ],
    selectedCardIds: new Set(['id-1', 'id-2']) // Already at max
  };
  
  const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-3' };
  const newState = deckReducer(state, action);
  
  // Should NOT add id-3 (already at max)
  expect(newState.selectedCardIds.has('id-3')).toBe(false);
  expect(newState.selectedCardIds.size).toBe(2);
});
```

**Functional Requirement**: FR-012

---

## Deselection Behavior

### Rule 3: Unrestricted Deselection

**Contract**: Users MUST be able to deselect any selected card at any time, regardless of current selection count.

**Rationale**: Users may change their mind about which cards to discard.

**Behavior**:
- Clicking a selected card always removes it from `selectedCardIds`
- No confirmation required for deselection
- Deselection happens immediately with visual feedback

**Test**:
```typescript
test('deselection always allowed regardless of limit', () => {
  const state = {
    ...mockState,
    discardCount: 2,
    handCards: [
      { id: 'id-1', value: '7♥' },
      { id: 'id-2', value: 'A♠' }
    ],
    selectedCardIds: new Set(['id-1', 'id-2']) // At max
  };
  
  // Deselect id-1
  const action1 = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
  const newState1 = deckReducer(state, action1);
  expect(newState1.selectedCardIds.has('id-1')).toBe(false);
  expect(newState1.selectedCardIds.size).toBe(1);
  
  // Now can select id-1 again (under limit)
  const action2 = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
  const newState2 = deckReducer(newState1, action2);
  expect(newState2.selectedCardIds.has('id-1')).toBe(true);
  expect(newState2.selectedCardIds.size).toBe(2);
});
```

**Functional Requirement**: FR-006

---

## Visual Selection Feedback

### Rule 4: Multi-Modal Selection State

**Contract**: Selected cards MUST provide visual distinction through multiple modalities (not color alone).

**Required Indicators** (per research.md Section 4):
1. ✅ Border change (3px solid, primary color)
2. ✅ Opacity change (0.85)
3. ✅ Transform (translateY(-4px))
4. ✅ Checkmark icon or "SELECTED" text (optional but recommended)
5. ✅ ARIA attribute (`aria-pressed="true"`)

**CSS Implementation**:
```css
.card.selected {
  border: 3px solid var(--primary, #0066cc);
  opacity: 0.85;
  transform: translateY(-4px);
  z-index: 5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: var(--card-selected-background, rgba(0, 102, 204, 0.05));
}

.card {
  transition: 
    border 200ms ease,
    opacity 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease,
    background 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card.selected {
    transform: none; /* Keep other visual states */
  }
}
```

**Accessibility**:
- ✅ Color contrast: Border color meets WCAG AA (3:1 for UI components)
- ✅ Non-color indicators: Opacity, transform, icon
- ✅ Screen reader support: `aria-pressed="true"` on selected cards
- ✅ Reduced motion support: Disable transitions, keep visual states

**Test** (visual regression or component test):
```typescript
test('selected cards display .selected CSS class', () => {
  const { container } = render(
    <HandView
      handCards={[{ id: 'id-1', value: '7♥' }]}
      selectedCardIds={new Set(['id-1'])}
      toggleCardSelection={() => {}}
    />
  );
  
  const card = container.querySelector('.card');
  expect(card).toHaveClass('selected');
  expect(card).toHaveAttribute('aria-pressed', 'true');
});
```

**Functional Requirement**: FR-003

---

## Selection Progress Indicator

### Rule 5: Display Selection Count

**Contract**: The UI MUST show current selection count and required count.

**Format**: "X of Y cards selected" where:
- X = `selectedCardIds.size`
- Y = `effectiveDiscardCount` (capped at hand size)

**Location**: Above or below hand display, OR in discard button helper text

**Dynamic Updates**:
- Updates immediately when selection changes
- Shows green checkmark or "Ready" when X === Y
- Shows remaining count when X < Y (e.g., "2 more cards needed")

**Implementation**:
```tsx
const effectiveDiscardCount = Math.min(discardCount, handCards.length);
const selectionComplete = selectedCardIds.size === effectiveDiscardCount;

<div className="selection-progress">
  {selectionComplete ? (
    <span className="ready">✓ {selectedCardIds.size} cards selected - Ready to discard</span>
  ) : (
    <span>{selectedCardIds.size} of {effectiveDiscardCount} cards selected</span>
  )}
</div>
```

**Test**:
```typescript
test('selection progress indicator shows correct counts', () => {
  const { getByText } = render(
    <DeckControls
      selectedCardIds={new Set(['id-1', 'id-2'])}
      discardCount={3}
      handCards={[/* 5 cards */]}
      discardPhase={true}
    />
  );
  
  expect(getByText(/2 of 3 cards selected/i)).toBeInTheDocument();
});
```

**Functional Requirement**: FR-004

---

## Keyboard Selection Support

### Rule 6: Space and Enter Toggle Selection

**Contract**: Keyboard users MUST be able to toggle selection using Space or Enter keys.

**Implementation** (per research.md Section 2):
```tsx
<div
  className="card"
  tabIndex={0}
  onClick={() => toggleCardSelection(card.id)}
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); // Prevent scroll (Space) and form submission (Enter)
      toggleCardSelection(card.id);
    }
  }}
  aria-pressed={selectedCardIds.has(card.id)}
>
  {card.value}
</div>
```

**Focus Order**: Tab key navigates left-to-right through cards (natural DOM order)

**Focus Indicator** (per research.md Section 5):
```css
.card:focus-visible {
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}

.card.selected:focus-visible {
  outline-style: double; /* Distinguish selected+focused from just focused */
}
```

**Test**:
```typescript
test('pressing Space on focused card toggles selection', () => {
  const mockToggle = jest.fn();
  const { container } = render(
    <HandView
      handCards={[{ id: 'id-1', value: '7♥' }]}
      selectedCardIds={new Set()}
      toggleCardSelection={mockToggle}
    />
  );
  
  const card = container.querySelector('.card');
  card.focus();
  
  fireEvent.keyDown(card, { key: ' ' });
  expect(mockToggle).toHaveBeenCalledWith('id-1');
});
```

**Functional Requirement**: FR-013

---

## Edge Cases

### Edge Case 1: Invalid Card ID

**Contract**: Attempting to toggle a non-existent card ID MUST be ignored.

**Behavior**: If `payload` card ID does not exist in `handCards`, return state unchanged.

**Implementation**:
```typescript
case 'TOGGLE_CARD_SELECTION':
  const cardExists = state.handCards.some(card => card.id === action.payload);
  if (!cardExists) {
    return state; // Ignore invalid ID
  }
  // ... proceed with toggle logic
```

### Edge Case 2: Discard Phase Inactive

**Contract**: Selection toggle should only work during active discard phase.

**Behavior** (optional strict mode):
```typescript
case 'TOGGLE_CARD_SELECTION':
  if (!state.discardPhase) {
    return state; // Ignore selection when not in discard phase
  }
  // ... proceed with toggle logic
```

**Note**: This is optional - allowing selection when phase inactive does no harm (UI hides buttons anyway).

### Edge Case 3: Empty Hand

**Contract**: Cannot select cards when hand is empty.

**Behavior**: `handCards.length === 0` → No cards to click, no selection possible.

---

## Acceptance Criteria

From spec.md User Story 2:

**Scenario 1**: Select card
- ✅ Click unselected card
- ✅ Card visually changes (border, opacity, transform)
- ✅ Selection count updates

**Scenario 2**: Deselect card
- ✅ Click selected card
- ✅ Visual state reverts
- ✅ Selection count decreases

**Scenario 3**: Maximum selection enforcement
- ✅ Select 3 cards (when discardCount = 3)
- ✅ Attempt to select 4th card
- ✅ 4th card unclickable (disabled state)
- ✅ Selection count remains 3

**Scenario 4**: Keyboard selection
- ✅ Tab to focus card
- ✅ Press Space or Enter
- ✅ Card toggles selection
- ✅ Same behavior as mouse click

---

## Success Metrics

| Metric | Target | Validation |
|--------|--------|------------|
| SC-004: Visual update time | <100ms | CSS transition 200ms < target (PASS) |
| SC-005: Accidental discard prevention | 0% | Max limit enforcement + confirmation required |
| FR-003: Visual distinction | 100% | Multi-modal feedback (border + opacity + transform + aria) |
| FR-012: Max selection enforcement | 100% | Unit tests + integration tests |

---

## References

- **spec.md**: User Story 2 (selection toggle), FR-002, FR-003, FR-004, FR-006, FR-012, FR-013
- **research.md**: Keyboard patterns (Section 2), CSS feedback (Section 4), Focus management (Section 5)
- **data-model.md**: TOGGLE_CARD_SELECTION action, selectedCardIds Set, effectiveDiscardCount formula
- **tasks.md**: T020-T022, T040-T042, T058-T061 (selection tests)

---

**Contract Status**: ✅ Complete  
**Next**: quickstart.md (developer guide)
