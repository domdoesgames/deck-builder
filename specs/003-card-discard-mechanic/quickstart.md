# Quickstart: Card Discard Mechanic Implementation

**Feature**: 003-card-discard-mechanic  
**Audience**: Developers implementing this feature  
**Date**: 2025-11-13

## Overview

This guide provides a step-by-step walkthrough for implementing the card discard mechanic. Follow these steps in order to add card instance tracking, selection state, and discard phase logic to the deck builder application.

**Estimated Time**: 6-8 hours (MVP), 14-16 hours (full feature)

---

## Prerequisites

Before starting:
- ✅ Read `spec.md` (understand user requirements)
- ✅ Read `plan.md` (understand architecture)
- ✅ Read `data-model.md` (understand types and state)
- ✅ Read `contracts/` (understand phase and selection rules)
- ✅ Read `research.md` (understand technical decisions)

**Existing files to modify**:
- `src/lib/types.ts` (type definitions)
- `src/state/deckReducer.ts` (state management)
- `src/hooks/useDeckState.ts` (hook interface)
- `src/components/HandView.tsx` (card display)
- `src/components/DeckControls.tsx` (action buttons)
- Test files in `tests/`

**New files to create**:
- `src/lib/cardInstance.ts` (UUID generation)
- `tests/unit/cardInstance.test.ts`
- `tests/integration/discardFlow.test.tsx`
- `tests/contract/discardContracts.test.ts`

---

## Step 1: Add CardInstance Type (30 minutes)

### 1.1 Create Card Instance Generator

**File**: `src/lib/cardInstance.ts`

```typescript
/**
 * Generates a unique card instance with UUID identifier
 * @param value The card's value/rank (e.g., "A♠", "7♥")
 * @returns CardInstance with unique ID and value
 */
export function generateCardInstance(value: string): CardInstance {
  const id = generateUUID();
  return { id, value };
}

/**
 * Generates a UUID v4 identifier with fallback for older browsers
 * @returns UUID string (e.g., "36b8f84d-df4e-4d49-b662-bcde71a8764f")
 */
function generateUUID(): string {
  // Modern browser support (Chrome 79+, Safari 13.1+, Firefox 75+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments (unlikely but defensive)
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface CardInstance {
  /** Unique identifier for this card instance (UUID v4) */
  id: string;
  
  /** The card's value/rank (e.g., "A♠", "7♥", "K♦") */
  value: string;
}
```

**Why**: Enables selection tracking by ID instead of value (important for duplicate cards).

### 1.2 Update Type Definitions

**File**: `src/lib/types.ts`

Add CardInstance interface (import from cardInstance.ts or define here):

```typescript
export interface CardInstance {
  id: string;
  value: string;
}
```

Add new fields to DeckState:

```typescript
export interface DeckState {
  // Existing fields
  drawPile: string[];
  discardPile: string[];
  hand: string[];  // DEPRECATED - keep for backward compat
  turnNumber: number;
  handSize: number;
  discardCount: number;
  warning: string | null;
  error: string | null;
  isDealing: boolean;
  
  // New fields for Feature 003
  handCards: CardInstance[];
  selectedCardIds: Set<string>;
  discardPhase: boolean;
}
```

Add new action types:

```typescript
export type DeckAction =
  | { type: 'INIT' }
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'TOGGLE_CARD_SELECTION'; payload: string } // Card ID
  | { type: 'CONFIRM_DISCARD' };
```

**Test**: Verify types compile (`npm run build`)

---

## Step 2: Extend DeckState (1 hour)

### 2.1 Update initializeDeck()

**File**: `src/state/deckReducer.ts`

Add new fields to initial state:

```typescript
function initializeDeck(): DeckState {
  const drawPile = [...DEFAULT_DECK];
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],  // Deprecated
    handCards: [],  // New
    selectedCardIds: new Set(),  // New
    discardPhase: false,  // New
    turnNumber: 1,
    handSize: DEFAULT_HAND_SIZE,
    discardCount: DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
  };
  return dealNextHand(initialState);
}
```

### 2.2 Update dealNextHand()

**File**: `src/state/deckReducer.ts`

Generate CardInstance objects instead of strings:

```typescript
function dealNextHand(state: DeckState): DeckState {
  // Existing shuffle logic...
  
  const dealtCards = drawPile.slice(0, state.handSize);
  const remainingDraw = drawPile.slice(state.handSize);
  
  // Generate CardInstance objects with unique IDs
  const handCards = dealtCards.map(value => generateCardInstance(value));
  
  // Calculate effective discard count (cap at hand size)
  const effectiveDiscardCount = Math.min(state.discardCount, handCards.length);
  
  return {
    ...state,
    drawPile: remainingDraw,
    handCards,
    hand: handCards.map(card => card.value),  // Backward compat
    selectedCardIds: new Set(),  // Clear previous selections
    discardPhase: effectiveDiscardCount > 0,  // Activate if discard required
    isDealing: false,
    warning: null,
  };
}
```

**Key changes**:
- Use `generateCardInstance()` to create cards with IDs
- Set `discardPhase = true` when `discardCount > 0`
- Clear `selectedCardIds` on each deal
- Sync deprecated `hand` field for compatibility

### 2.3 Update endTurn()

**File**: `src/state/deckReducer.ts`

Block turn end during discard phase:

```typescript
function endTurn(state: DeckState): DeckState {
  // Block turn end if in discard phase
  if (state.discardPhase) {
    return state;  // No change, user must complete discard first
  }
  
  // Existing turn end logic...
  return {
    ...state,
    hand: [],
    handCards: [],  // Clear hand cards too
    turnNumber: state.turnNumber + 1,
  };
}
```

**Test**: Verify state initializes with new fields (`console.log(state)` in browser)

---

## Step 3: Implement Actions (1.5 hours)

### 3.1 Add TOGGLE_CARD_SELECTION

**File**: `src/state/deckReducer.ts`

```typescript
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    // Existing cases...
    
    case 'TOGGLE_CARD_SELECTION': {
      const cardId = action.payload;
      
      // Validate card exists
      const cardExists = state.handCards.some(card => card.id === cardId);
      if (!cardExists) {
        return state;  // Ignore invalid ID
      }
      
      // Calculate effective discard count (cap at hand size)
      const effectiveDiscardCount = Math.min(
        state.discardCount,
        state.handCards.length
      );
      
      // Clone selectedCardIds Set (immutability)
      const newSelectedCardIds = new Set(state.selectedCardIds);
      
      if (newSelectedCardIds.has(cardId)) {
        // Deselect (always allowed)
        newSelectedCardIds.delete(cardId);
      } else if (newSelectedCardIds.size < effectiveDiscardCount) {
        // Select (only if under limit)
        newSelectedCardIds.add(cardId);
      }
      // Else: at max limit, ignore
      
      return {
        ...state,
        selectedCardIds: newSelectedCardIds,
      };
    }
    
    default:
      return state;
  }
}
```

### 3.2 Add CONFIRM_DISCARD

**File**: `src/state/deckReducer.ts`

```typescript
case 'CONFIRM_DISCARD': {
  const effectiveDiscardCount = Math.min(
    state.discardCount,
    state.handCards.length
  );
  
  // Validate selection is complete
  if (state.selectedCardIds.size !== effectiveDiscardCount) {
    return state;  // Button should be disabled, but handle gracefully
  }
  
  // Separate selected and remaining cards
  const selectedCards = state.handCards.filter(card =>
    state.selectedCardIds.has(card.id)
  );
  const remainingCards = state.handCards.filter(card =>
    !state.selectedCardIds.has(card.id)
  );
  
  // Move selected card values to discard pile
  const newDiscardPile = [
    ...state.discardPile,
    ...selectedCards.map(card => card.value)
  ];
  
  return {
    ...state,
    handCards: remainingCards,
    hand: remainingCards.map(card => card.value),  // Backward compat
    discardPile: newDiscardPile,
    selectedCardIds: new Set(),  // Clear selections
    discardPhase: false,  // Exit discard phase
  };
}
```

**Test**: Manually dispatch actions in browser console

---

## Step 4: Update Hook Interface (30 minutes)

### 4.1 Add Hook Functions

**File**: `src/hooks/useDeckState.ts`

```typescript
export function useDeckState() {
  const [state, dispatch] = useReducer(deckReducer, null, () => {
    return deckReducer({} as DeckState, { type: 'INIT' });
  });
  
  // Existing functions...
  
  // New functions for Feature 003
  const toggleCardSelection = (cardId: string) => {
    dispatch({ type: 'TOGGLE_CARD_SELECTION', payload: cardId });
  };
  
  const confirmDiscard = () => {
    dispatch({ type: 'CONFIRM_DISCARD' });
  };
  
  return {
    state,
    dealNextHand: () => dispatch({ type: 'DEAL_NEXT_HAND' }),
    endTurn: () => dispatch({ type: 'END_TURN' }),
    toggleCardSelection,  // New
    confirmDiscard,  // New
  };
}
```

**Test**: Verify hook exports new functions (`console.log(useDeckState())`)

---

## Step 5: Update Components (2-3 hours)

### 5.1 Update HandView.tsx

**File**: `src/components/HandView.tsx`

```tsx
interface HandViewProps {
  handCards: CardInstance[];
  selectedCardIds: Set<string>;
  toggleCardSelection: (cardId: string) => void;
  discardCount: number;
}

export function HandView({
  handCards,
  selectedCardIds,
  toggleCardSelection,
  discardCount
}: HandViewProps) {
  const effectiveDiscardCount = Math.min(discardCount, handCards.length);
  const isMaxSelected = selectedCardIds.size >= effectiveDiscardCount;
  
  return (
    <div className="hand-view">
      <div className="hand-container">
        {handCards.map(card => {
          const isSelected = selectedCardIds.has(card.id);
          const isDisabled = isMaxSelected && !isSelected;
          
          return (
            <div
              key={card.id}
              className={`card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              tabIndex={0}
              onClick={() => {
                if (!isDisabled) {
                  toggleCardSelection(card.id);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isDisabled) {
                  e.preventDefault();
                  toggleCardSelection(card.id);
                }
              }}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
            >
              <div className="card-value">{card.value}</div>
              {isSelected && <div className="selection-indicator">✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Key changes**:
- Map over `handCards` instead of `hand`
- Add selection state classes (`selected`, `disabled`)
- Add keyboard support (`onKeyDown`)
- Add ARIA attributes (`aria-pressed`, `aria-disabled`)
- Show checkmark for selected cards

### 5.2 Update DeckControls.tsx

**File**: `src/components/DeckControls.tsx`

```tsx
interface DeckControlsProps {
  discardPhase: boolean;
  selectedCardIds: Set<string>;
  discardCount: number;
  handCards: CardInstance[];
  confirmDiscard: () => void;
  endTurn: () => void;
  dealNextHand: () => void;
}

export function DeckControls({
  discardPhase,
  selectedCardIds,
  discardCount,
  handCards,
  confirmDiscard,
  endTurn,
  dealNextHand
}: DeckControlsProps) {
  const effectiveDiscardCount = Math.min(discardCount, handCards.length);
  const isDiscardReady = selectedCardIds.size === effectiveDiscardCount;
  
  return (
    <div className="deck-controls">
      {discardPhase && (
        <div className="discard-section">
          <div className="selection-progress">
            {isDiscardReady ? (
              <span className="ready">✓ {selectedCardIds.size} cards selected - Ready to discard</span>
            ) : (
              <span>{selectedCardIds.size} of {effectiveDiscardCount} cards selected</span>
            )}
          </div>
          
          <button
            onClick={confirmDiscard}
            disabled={!isDiscardReady}
            className="discard-button"
          >
            Discard Selected Cards
          </button>
        </div>
      )}
      
      <button
        onClick={endTurn}
        disabled={discardPhase}
        title={discardPhase ? "Complete discard phase to end turn" : ""}
      >
        End Turn
      </button>
      
      <button onClick={dealNextHand}>
        Deal Next Hand
      </button>
    </div>
  );
}
```

**Key changes**:
- Show discard button only when `discardPhase === true`
- Disable discard button until `isDiscardReady`
- Disable end turn button during discard phase
- Show selection progress indicator

---

## Step 6: Add CSS Styles (1 hour)

### 6.1 Update HandView.css

**File**: `src/components/HandView.css`

```css
/* Selection state */
.card.selected {
  border: 3px solid var(--primary, #0066cc);
  opacity: 0.85;
  transform: translateY(-4px);
  z-index: 5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: rgba(0, 102, 204, 0.05);
}

/* Disabled state (max selection reached) */
.card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.card {
  transition: 
    border 200ms ease,
    opacity 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease,
    background 200ms ease;
}

/* Keyboard focus */
.card:focus-visible {
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}

.card.selected:focus-visible {
  outline-style: double;
}

/* Selection indicator (checkmark) */
.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.5rem;
  color: var(--primary, #0066cc);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card.selected {
    transform: none;
  }
}
```

### 6.2 Update DeckControls.css

**File**: `src/components/DeckControls.css` (or add to existing styles)

```css
.discard-section {
  margin-bottom: 1rem;
}

.selection-progress {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.selection-progress .ready {
  color: var(--success, #28a745);
  font-weight: bold;
}

.discard-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Test**: Verify styles apply correctly in browser

---

## Step 7: Write Tests (3-4 hours)

### 7.1 Unit Tests for cardInstance.ts

**File**: `tests/unit/cardInstance.test.ts`

```typescript
import { generateCardInstance } from '../../src/lib/cardInstance';

describe('generateCardInstance', () => {
  test('creates unique IDs for identical values', () => {
    const card1 = generateCardInstance('7♥');
    const card2 = generateCardInstance('7♥');
    
    expect(card1.id).not.toBe(card2.id);
    expect(card1.value).toBe('7♥');
    expect(card2.value).toBe('7♥');
  });
  
  test('preserves card value correctly', () => {
    const card = generateCardInstance('A♠');
    expect(card.value).toBe('A♠');
  });
  
  test('multiple calls produce different IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      const card = generateCardInstance('K♦');
      ids.add(card.id);
    }
    expect(ids.size).toBe(100); // All unique
  });
});
```

### 7.2 Unit Tests for Reducer

**File**: `tests/unit/deckReducer.test.ts`

```typescript
describe('TOGGLE_CARD_SELECTION', () => {
  test('adds card ID to selectedCardIds', () => {
    const state = {
      ...mockState,
      discardCount: 3,
      handCards: [{ id: 'id-1', value: '7♥' }],
      selectedCardIds: new Set()
    };
    
    const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
    const newState = deckReducer(state, action);
    
    expect(newState.selectedCardIds.has('id-1')).toBe(true);
  });
  
  test('removes card ID if already selected', () => {
    const state = {
      ...mockState,
      handCards: [{ id: 'id-1', value: '7♥' }],
      selectedCardIds: new Set(['id-1'])
    };
    
    const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-1' };
    const newState = deckReducer(state, action);
    
    expect(newState.selectedCardIds.has('id-1')).toBe(false);
  });
  
  test('prevents exceeding discard count', () => {
    const state = {
      ...mockState,
      discardCount: 2,
      handCards: [
        { id: 'id-1', value: '7♥' },
        { id: 'id-2', value: 'A♠' },
        { id: 'id-3', value: 'K♦' }
      ],
      selectedCardIds: new Set(['id-1', 'id-2'])
    };
    
    const action = { type: 'TOGGLE_CARD_SELECTION', payload: 'id-3' };
    const newState = deckReducer(state, action);
    
    expect(newState.selectedCardIds.has('id-3')).toBe(false);
    expect(newState.selectedCardIds.size).toBe(2);
  });
});

describe('CONFIRM_DISCARD', () => {
  test('moves selected cards to discard pile', () => {
    const state = {
      ...mockState,
      discardPhase: true,
      discardCount: 2,
      handCards: [
        { id: 'id-1', value: '7♥' },
        { id: 'id-2', value: 'A♠' },
        { id: 'id-3', value: 'K♦' }
      ],
      selectedCardIds: new Set(['id-1', 'id-2']),
      discardPile: []
    };
    
    const action = { type: 'CONFIRM_DISCARD' };
    const newState = deckReducer(state, action);
    
    expect(newState.discardPhase).toBe(false);
    expect(newState.handCards.length).toBe(1);
    expect(newState.discardPile).toContain('7♥');
    expect(newState.discardPile).toContain('A♠');
    expect(newState.selectedCardIds.size).toBe(0);
  });
});
```

### 7.3 Integration Tests

**File**: `tests/integration/discardFlow.test.tsx`

```typescript
import { render, fireEvent } from '@testing-library/react';
import App from '../../src/App';

test('full discard flow', () => {
  const { getByText, getAllByRole } = render(<App />);
  
  // Set up state (may need test utilities)
  // Deal hand with discardCount = 3
  fireEvent.click(getByText(/Deal Next Hand/i));
  
  // Verify discard phase active
  expect(getByText(/Discard Phase/i)).toBeInTheDocument();
  
  // Select 3 cards
  const cards = getAllByRole('button', { pressed: false });
  fireEvent.click(cards[0]);
  fireEvent.click(cards[1]);
  fireEvent.click(cards[2]);
  
  // Verify selection count
  expect(getByText(/3 of 3 cards selected/i)).toBeInTheDocument();
  
  // Confirm discard
  const discardButton = getByText(/Discard Selected Cards/i);
  expect(discardButton).not.toBeDisabled();
  fireEvent.click(discardButton);
  
  // Verify phase exited
  expect(getByText(/End Turn/i)).not.toBeDisabled();
});
```

**Run tests**: `npm test`

---

## Step 8: Manual Testing (1 hour)

### 8.1 Basic Flow Test

1. Start dev server: `npm run dev`
2. Open browser to `localhost:5173`
3. Click "Deal Next Hand"
4. Verify discard phase indicator appears
5. Click 3 cards (verify visual selection)
6. Verify "Discard Selected Cards" button enabled
7. Click "Discard Selected Cards"
8. Verify cards removed from hand
9. Verify "End Turn" button enabled

### 8.2 Keyboard Navigation Test

1. Press Tab to focus first card
2. Press Space to select
3. Press Tab to next card
4. Press Enter to select
5. Verify keyboard selection works identically to mouse

### 8.3 Edge Case Tests

- **discardCount = 0**: Verify discard phase skipped
- **discardCount = handSize**: Verify can discard all cards
- **discardCount > handSize**: Verify capped to hand size
- **Max selection**: Verify cannot select more than required

### 8.4 Accessibility Test

- **Screen reader**: Test with VoiceOver (Mac) or NVDA (Windows)
  - Verify card selection state announced
  - Verify "X of Y cards selected" announced
- **Keyboard only**: Complete full flow without mouse
- **Color contrast**: Verify selected cards meet WCAG AA (use browser DevTools)

---

## Step 9: Polish & Validation (1-2 hours)

### 9.1 Run Linter

```bash
npm run lint
```

Fix any errors or warnings.

### 9.2 Run Full Test Suite

```bash
npm test
```

Verify all tests pass (expect 30+ tests total).

### 9.3 Build Production

```bash
npm run build
```

Verify build succeeds with no errors.

### 9.4 Performance Check

- Open browser DevTools → Performance tab
- Record interaction: select 3 cards, confirm discard
- Verify selection state updates within 100ms (SC-004)

### 9.5 Cross-Browser Test

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Troubleshooting

### Issue: "crypto is not defined"

**Solution**: Check browser version. `crypto.randomUUID()` supported in Chrome 79+, Safari 13.1+, Firefox 75+. Fallback should handle older browsers.

### Issue: Set not serializing correctly

**Solution**: `selectedCardIds` is a Set, which doesn't serialize to JSON. When implementing persistence (Phase 9), serialize as array:

```typescript
// Serialize
const serialized = {
  ...state,
  selectedCardIds: Array.from(state.selectedCardIds)
};

// Deserialize
const deserialized = {
  ...parsed,
  selectedCardIds: new Set(parsed.selectedCardIds)
};
```

### Issue: Selections not clearing on new hand

**Solution**: Verify `dealNextHand()` sets `selectedCardIds: new Set()`.

### Issue: Turn end not blocked

**Solution**: Verify `endTurn()` checks `if (state.discardPhase) return state;` first.

---

## Success Checklist

Before marking feature complete:

- [ ] All 14 functional requirements (FR-001 to FR-014) implemented
- [ ] All 5 success criteria (SC-001 to SC-005) validated
- [ ] All 5 edge cases from spec.md handled
- [ ] All unit tests pass (20+ tests)
- [ ] All integration tests pass (5+ tests)
- [ ] All contract tests pass (10+ tests)
- [ ] Linter passes with 0 errors
- [ ] Production build succeeds
- [ ] Manual testing completed (basic + keyboard + edge cases + accessibility)
- [ ] Cross-browser testing completed
- [ ] Performance verified (<100ms selection updates)

---

## Next Steps

**MVP Complete** (Phases 0-3): Core discard mechanic functional

**Full Feature** (Phases 4-10): Selection toggle, confirmation flow, keyboard navigation, phase indicators, edge cases, persistence, polish

**Future Enhancements**:
- State persistence via localStorage (Phase 9)
- Animations for card transitions
- Sound effects for selection/discard
- Undo/redo support

---

## References

- **spec.md**: User requirements, acceptance criteria, success metrics
- **plan.md**: Architecture, migration strategy, phase breakdown
- **data-model.md**: Type definitions, state structure, transitions
- **contracts/**: Phase activation rules, selection logic contracts
- **research.md**: UUID generation, keyboard patterns, CSS feedback, focus management
- **tasks.md**: Detailed task breakdown with time estimates

---

**Developer Guide Complete**: Ready for implementation  
**Estimated MVP Time**: 6-8 hours  
**Estimated Full Feature Time**: 14-16 hours
