# Quickstart: Deck Reset Implementation

**Feature**: 006-deck-reset  
**Audience**: Developers implementing this feature  
**Date**: 2025-11-13

## Overview

This guide provides a step-by-step walkthrough for implementing the deck reset feature. This feature adds a reset button that returns the system to initial state while preserving user settings, and modifies initialization to shuffle the deck on every page load and reset.

**Estimated Time**: 3-4 hours (small feature, builds on existing infrastructure)

---

## Prerequisites

Before starting:
- ✅ Read `spec.md` (understand user requirements)
- ✅ Read `plan.md` (understand implementation approach)
- ✅ Read `data-model.md` (understand state transitions)
- ✅ Read `contracts/reset-action.contract.md` (understand action contracts)
- ✅ Read `research.md` (understand technical decisions)

**Existing files to modify**:
- `src/lib/types.ts` (add RESET action type)
- `src/state/deckReducer.ts` (modify initializeDeck, add RESET handler)
- `src/hooks/useDeckState.ts` (add reset hook function)
- `src/components/DeckControls.tsx` (add reset button)
- Test files in `tests/`

**New files to create**:
- `tests/contract/resetContracts.test.ts`
- `tests/integration/resetFlow.test.tsx` (optional, can extend existing tests)

---

## Step 1: Add RESET Action Type (10 minutes)

### 1.1 Update Type Definitions

**File**: `src/lib/types.ts`

**Location**: Add to `DeckAction` union type (around line 49-62)

**Change**:
```typescript
export type DeckAction =
  | { type: 'INIT' }
  | { type: 'RESET' }  // NEW ACTION - Add this line
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'APPLY_JSON_OVERRIDE'; payload: string }
  | { type: 'CHANGE_PARAMETERS'; payload: { handSize: number; discardCount: number; immediateReset: boolean } }
  | { type: 'TOGGLE_CARD_SELECTION'; payload: { instanceId: string } }
  | { type: 'CONFIRM_DISCARD' }
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
```

**Why**: TypeScript needs to know about the new action type for type safety.

**Test**: Run `npm run build` to verify types compile.

---

## Step 2: Modify initializeDeck to Shuffle (20 minutes)

### 2.1 Add Shuffle to Deck Initialization

**File**: `src/state/deckReducer.ts`

**Location**: Modify `initializeDeck()` function (around line 57-80)

**Before**:
```typescript
function initializeDeck(): DeckState {
  const drawPile = [...DEFAULT_DECK]  // No shuffle
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    // ... rest of state
  }
  
  return dealNextHand(initialState)
}
```

**After**:
```typescript
function initializeDeck(params?: { handSize?: number; discardCount?: number }): DeckState {
  // Shuffle deck on initialization (FR-004, FR-005)
  const drawPile = shuffle([...DEFAULT_DECK])
  
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    turnNumber: 1,
    handSize: params?.handSize ?? DEFAULT_HAND_SIZE,
    discardCount: params?.discardCount ?? DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
    // Feature 003: Card discard mechanic
    handCards: [],
    selectedCardIds: new Set(),
    discardPhase: { active: false, remainingDiscards: 0 },
    // Feature 004: Card play order
    playOrderSequence: [],
    playOrderLocked: false,
    planningPhase: false,
  }
  
  return dealNextHand(initialState)
}
```

**Key changes**:
1. Call `shuffle([...DEFAULT_DECK])` instead of `[...DEFAULT_DECK]`
2. Add optional `params` parameter to accept preserved settings
3. Use `params?.handSize ?? DEFAULT_HAND_SIZE` to preserve or use defaults

**Why**: 
- Satisfies FR-004 (shuffle on page load)
- Enables settings preservation for RESET action
- Single shuffle logic for both INIT and RESET

**Import required**: `shuffle` should already be imported at top of file

**Test**: Load page multiple times, verify hand is different each time

---

## Step 3: Add RESET Action Handler (30 minutes)

### 3.1 Add RESET Case to Reducer

**File**: `src/state/deckReducer.ts`

**Location**: Inside `deckReducer()` switch statement (around line 11-54), add after INIT case

**Code**:
```typescript
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'INIT':
      return initializeDeck()
    
    case 'RESET':
      // FR-002: Reset all game state to initial conditions
      // FR-003: Preserve user configuration (handSize, discardCount)
      // FR-005: Shuffle deck before dealing
      
      // Extract and validate preserved settings
      let preservedHandSize = state.handSize
      let preservedDiscardCount = state.discardCount
      
      // Validation: Ensure settings are valid (fallback to defaults if corrupted)
      if (preservedHandSize < 1 || preservedHandSize > 52) {
        preservedHandSize = DEFAULT_HAND_SIZE
      }
      if (preservedDiscardCount < 0 || preservedDiscardCount > preservedHandSize) {
        preservedDiscardCount = DEFAULT_DISCARD_COUNT
      }
      
      // Return fresh initial state with preserved settings
      return initializeDeck({
        handSize: preservedHandSize,
        discardCount: preservedDiscardCount
      })
    
    case 'DEAL_NEXT_HAND':
      return dealNextHand(state)
    
    // ... rest of cases
  }
}
```

**Key logic**:
1. Extract `handSize` and `discardCount` from current state
2. Validate extracted values (handle corrupted state gracefully)
3. Call `initializeDeck()` with preserved values
4. Return fresh state (automatically shuffled due to Step 2 changes)

**Why**:
- Preserves user settings (FR-003)
- Resets all game state (FR-002)
- Leverages existing initialization logic (DRY principle)
- Handles edge cases (invalid settings)

**Test**: Manually dispatch `{ type: 'RESET' }` in browser console, verify state resets

---

## Step 4: Add Reset Hook Function (15 minutes)

### 4.1 Expose Reset Action in Hook

**File**: `src/hooks/useDeckState.ts`

**Location**: Inside `useDeckState()` function, add after existing action functions

**Code**:
```typescript
export function useDeckState() {
  const [state, dispatch] = useReducer(deckReducer, null, () => {
    return deckReducer({} as DeckState, { type: 'INIT' })
  })
  
  // Existing action functions...
  const dealNextHand = () => dispatch({ type: 'DEAL_NEXT_HAND' })
  const endTurn = () => dispatch({ type: 'END_TURN' })
  const toggleCardSelection = (instanceId: string) => 
    dispatch({ type: 'TOGGLE_CARD_SELECTION', payload: { instanceId } })
  const confirmDiscard = () => dispatch({ type: 'CONFIRM_DISCARD' })
  // ... play order functions
  
  // NEW: Reset action (FR-001)
  const reset = () => dispatch({ type: 'RESET' })
  
  return {
    state,
    dispatch,
    dealNextHand,
    endTurn,
    toggleCardSelection,
    confirmDiscard,
    selectForPlayOrder,
    deselectFromPlayOrder,
    lockPlayOrder,
    clearPlayOrder,
    changeParameters,
    applyJsonOverride,
    reset,  // NEW - Add to return object
  }
}
```

**Why**: Provides convenient API for components to trigger reset.

**Test**: `console.log(useDeckState())` and verify `reset` function exists.

---

## Step 5: Add Reset Button to UI (30 minutes)

### 5.1 Update DeckControls Component

**File**: `src/components/DeckControls.tsx`

**Location**: Add reset button to component JSX

**Before** (simplified):
```tsx
export function DeckControls({
  dealNextHand,
  endTurn,
  // ... other props
}: DeckControlsProps) {
  return (
    <div className="deck-controls">
      {/* Discard section */}
      {/* Play order section */}
      
      <button onClick={endTurn} disabled={...}>
        End Turn
      </button>
      
      <button onClick={dealNextHand}>
        Deal Next Hand
      </button>
    </div>
  )
}
```

**After**:
```tsx
export function DeckControls({
  dealNextHand,
  endTurn,
  reset,  // NEW prop
  discardPhaseActive,
  planningPhase,
  // ... other props
}: DeckControlsProps) {
  // Component-level state for button disabled during reset (FR-007)
  const [isResetting, setIsResetting] = useState(false)
  
  const handleReset = () => {
    setIsResetting(true)
    reset()
    // Button re-enables on next render (state change triggers re-render)
  }
  
  // Re-enable button after state updates
  useEffect(() => {
    if (isResetting) {
      setIsResetting(false)
    }
  }, [isResetting])
  
  return (
    <div className="deck-controls">
      {/* Discard section */}
      {/* Play order section */}
      
      <button onClick={endTurn} disabled={discardPhaseActive || planningPhase}>
        End Turn
      </button>
      
      <button onClick={dealNextHand}>
        Deal Next Hand
      </button>
      
      {/* NEW: Reset button (FR-001, FR-010) */}
      <button 
        onClick={handleReset}
        disabled={isResetting}
        className="reset-button"
        title="Reset entire system to initial state (preserves hand size and discard count)"
      >
        {isResetting ? 'Resetting...' : 'Reset'}
      </button>
    </div>
  )
}
```

**Key changes**:
1. Add `reset` prop (function from hook)
2. Add `isResetting` local state for button disabled state
3. Add `handleReset` function to set disabled state and dispatch action
4. Add reset button with disabled state and title tooltip
5. Add `useEffect` to re-enable button after state update

**TypeScript**: Update `DeckControlsProps` interface:
```typescript
interface DeckControlsProps {
  // ... existing props
  reset: () => void  // NEW
}
```

**Why**:
- Provides user-accessible reset button (FR-001, FR-010)
- Prevents double-clicks during reset (FR-007)
- Provides clear label and tooltip

**Test**: Click reset button, verify state resets and button re-enables.

---

### 5.2 Update App.tsx to Pass Reset Prop

**File**: `src/App.tsx`

**Location**: Update where DeckControls is rendered

**Code**:
```tsx
function App() {
  const {
    state,
    dealNextHand,
    endTurn,
    reset,  // NEW - destructure from hook
    // ... other functions
  } = useDeckState()
  
  return (
    <div>
      {/* ... other components */}
      
      <DeckControls
        dealNextHand={dealNextHand}
        endTurn={endTurn}
        reset={reset}  // NEW - pass to component
        discardPhaseActive={state.discardPhase.active}
        planningPhase={state.planningPhase}
        // ... other props
      />
    </div>
  )
}
```

**Test**: Full integration test - click reset button in browser, verify full reset flow.

---

## Step 6: Add CSS Styles (Optional, 15 minutes)

### 6.1 Style Reset Button

**File**: `src/styles/index.css` or `src/components/DeckControls.css`

**Code**:
```css
.reset-button {
  /* Use warning/secondary color to differentiate from primary actions */
  background-color: var(--secondary, #6c757d);
  border-color: var(--secondary, #6c757d);
}

.reset-button:hover:not(:disabled) {
  background-color: var(--secondary-hover, #5a6268);
  border-color: var(--secondary-hover, #5a6268);
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Optional: Add icon or visual indicator */
.reset-button::before {
  content: "↻ ";  /* Unicode reset symbol */
}
```

**Why**: Visual differentiation from primary actions (reset is destructive).

**Test**: Verify button styling looks appropriate in browser.

---

## Step 7: Write Contract Tests (1-1.5 hours)

### 7.1 Create Contract Test File

**File**: `tests/contract/resetContracts.test.ts`

**Code**:
```typescript
import { describe, test, expect } from '@jest/globals'
import { deckReducer } from '../../src/state/deckReducer'
import { DeckState } from '../../src/lib/types'
import { DEFAULT_DECK, DEFAULT_HAND_SIZE, DEFAULT_DISCARD_COUNT } from '../../src/lib/constants'

describe('Reset Contracts (Feature 006)', () => {
  const mockMidGameState: DeckState = {
    drawPile: ['Card 20', 'Card 21'],
    discardPile: ['Card 1', 'Card 2', 'Card 3'],
    hand: [],
    handCards: [],
    turnNumber: 8,
    handSize: 7,           // User configured
    discardCount: 4,       // User configured
    selectedCardIds: new Set(['id1', 'id2']),
    discardPhase: { active: true, remainingDiscards: 2 },
    playOrderSequence: ['id1', 'id2', 'id3'],
    playOrderLocked: true,
    planningPhase: false,
    warning: 'Low cards in deck',
    error: null,
    isDealing: false,
  }
  
  describe('C001: INIT - Application Initialization with Shuffle', () => {
    test('shuffles deck before dealing hand', () => {
      const state = deckReducer(undefined as any, { type: 'INIT' })
      
      expect(state.drawPile.length).toBeGreaterThan(0)
      expect(state.hand.length).toBe(DEFAULT_HAND_SIZE)
      expect(state.handCards.length).toBe(DEFAULT_HAND_SIZE)
      
      // Verify shuffle occurred (deck not in default order)
      // Note: Probabilistic test - may rarely fail if shuffle produces default order
      const defaultStart = DEFAULT_DECK.slice(0, 5)
      const currentHand = state.hand
      const isShuffled = !defaultStart.every((card, i) => card === currentHand[i])
      expect(isShuffled).toBe(true)
    })
    
    test('initializes with correct default state', () => {
      const state = deckReducer(undefined as any, { type: 'INIT' })
      
      expect(state.turnNumber).toBe(1)
      expect(state.handSize).toBe(DEFAULT_HAND_SIZE)
      expect(state.discardCount).toBe(DEFAULT_DISCARD_COUNT)
      expect(state.selectedCardIds.size).toBe(0)
      expect(state.playOrderSequence).toEqual([])
      expect(state.playOrderLocked).toBe(false)
      expect(state.planningPhase).toBe(false)
      expect(state.warning).toBeNull()
      expect(state.error).toBeNull()
    })
  })
  
  describe('C002: RESET - Manual System Reset with Settings Preservation', () => {
    test('preserves user settings (handSize, discardCount)', () => {
      const newState = deckReducer(mockMidGameState, { type: 'RESET' })
      
      // Settings preserved
      expect(newState.handSize).toBe(7)
      expect(newState.discardCount).toBe(4)
    })
    
    test('clears all game state', () => {
      const newState = deckReducer(mockMidGameState, { type: 'RESET' })
      
      // Game state reset
      expect(newState.turnNumber).toBe(1)
      expect(newState.selectedCardIds.size).toBe(0)
      expect(newState.playOrderSequence).toEqual([])
      expect(newState.playOrderLocked).toBe(false)
      expect(newState.planningPhase).toBe(false)
      expect(newState.warning).toBeNull()
      expect(newState.discardPile).toEqual([])
    })
    
    test('shuffles deck and deals new hand', () => {
      const newState = deckReducer(mockMidGameState, { type: 'RESET' })
      
      // Deck shuffled and dealt with preserved handSize
      expect(newState.hand.length).toBe(7)
      expect(newState.handCards.length).toBe(7)
      expect(newState.drawPile.length).toBe(52 - 7)
      
      // Verify total cards = 52
      expect(newState.drawPile.length + newState.hand.length).toBe(52)
    })
    
    test('activates discard phase if discardCount > 0', () => {
      const newState = deckReducer(mockMidGameState, { type: 'RESET' })
      
      expect(newState.discardPhase.active).toBe(true)
      expect(newState.discardPhase.remainingDiscards).toBe(4)
    })
  })
  
  describe('C003: RESET - Settings Validation and Fallback', () => {
    test('falls back to defaults when settings invalid', () => {
      const corruptedState: DeckState = {
        ...mockMidGameState,
        handSize: -5,      // Invalid
        discardCount: 100  // Invalid
      }
      
      const newState = deckReducer(corruptedState, { type: 'RESET' })
      
      expect(newState.handSize).toBe(DEFAULT_HAND_SIZE)
      expect(newState.discardCount).toBe(DEFAULT_DISCARD_COUNT)
    })
    
    test('handles handSize > 52 (invalid)', () => {
      const invalidState: DeckState = {
        ...mockMidGameState,
        handSize: 100,
        discardCount: 3
      }
      
      const newState = deckReducer(invalidState, { type: 'RESET' })
      
      expect(newState.handSize).toBe(DEFAULT_HAND_SIZE)
    })
    
    test('handles negative discardCount (invalid)', () => {
      const invalidState: DeckState = {
        ...mockMidGameState,
        handSize: 5,
        discardCount: -10
      }
      
      const newState = deckReducer(invalidState, { type: 'RESET' })
      
      expect(newState.discardCount).toBe(DEFAULT_DISCARD_COUNT)
    })
  })
  
  describe('C004: RESET Interaction with Discard Phase', () => {
    test('clears active discard phase and starts fresh', () => {
      const midDiscardState: DeckState = {
        ...mockMidGameState,
        discardPhase: { active: true, remainingDiscards: 2 },
        selectedCardIds: new Set(['id1', 'id2']),
        discardCount: 3
      }
      
      const newState = deckReducer(midDiscardState, { type: 'RESET' })
      
      expect(newState.discardPhase.active).toBe(true)  // New phase
      expect(newState.discardPhase.remainingDiscards).toBe(3)  // Reset to discardCount
      expect(newState.selectedCardIds.size).toBe(0)  // Cleared
    })
  })
  
  describe('C005: RESET Interaction with Play Order', () => {
    test('unlocks and clears play order', () => {
      const lockedOrderState: DeckState = {
        ...mockMidGameState,
        playOrderSequence: ['id1', 'id2', 'id3'],
        playOrderLocked: true,
        planningPhase: false
      }
      
      const newState = deckReducer(lockedOrderState, { type: 'RESET' })
      
      expect(newState.playOrderSequence).toEqual([])
      expect(newState.playOrderLocked).toBe(false)
      expect(newState.planningPhase).toBe(false)
    })
  })
  
  describe('C007: Shuffle Randomness Guarantee (Probabilistic)', () => {
    test('10 INIT calls produce at least 8 unique hands', () => {
      const hands: string[] = []
      
      // Generate 10 fresh states
      for (let i = 0; i < 10; i++) {
        const state = deckReducer(undefined as any, { type: 'INIT' })
        hands.push(JSON.stringify([...state.hand].sort()))
      }
      
      // Count unique hands
      const uniqueHands = new Set(hands)
      
      // Expect at least 8/10 unique (80% threshold)
      expect(uniqueHands.size).toBeGreaterThanOrEqual(8)
    })
    
    test('10 RESET calls produce at least 8 unique hands', () => {
      const hands: string[] = []
      const baseState = mockMidGameState
      
      // Generate 10 reset states
      for (let i = 0; i < 10; i++) {
        const state = deckReducer(baseState, { type: 'RESET' })
        hands.push(JSON.stringify([...state.hand].sort()))
      }
      
      // Count unique hands
      const uniqueHands = new Set(hands)
      
      // Expect at least 8/10 unique (80% threshold)
      expect(uniqueHands.size).toBeGreaterThanOrEqual(8)
    })
  })
  
  describe('C008: Reset Operation Performance', () => {
    test('RESET completes in under 500ms', () => {
      const start = performance.now()
      const newState = deckReducer(mockMidGameState, { type: 'RESET' })
      const end = performance.now()
      
      const duration = end - start
      expect(duration).toBeLessThan(500)
      expect(newState.turnNumber).toBe(1)
    })
  })
  
  describe('Edge Cases', () => {
    test('Edge-1: RESET with discardCount=0 skips discard phase', () => {
      const stateWithNoDiscard: DeckState = {
        ...mockMidGameState,
        discardCount: 0,
        handSize: 5
      }
      
      const newState = deckReducer(stateWithNoDiscard, { type: 'RESET' })
      
      expect(newState.discardCount).toBe(0)
      expect(newState.discardPhase.active).toBe(false)
      expect(newState.hand.length).toBe(5)
    })
    
    test('Edge-2: RESET works with exhausted draw pile', () => {
      const exhaustedState: DeckState = {
        ...mockMidGameState,
        drawPile: [],
        discardPile: Array(47).fill('Card X'),
        hand: Array(5).fill('Card Y')
      }
      
      const newState = deckReducer(exhaustedState, { type: 'RESET' })
      
      expect(newState.drawPile.length).toBeGreaterThan(0)
      expect(newState.discardPile.length).toBe(0)
      expect(newState.hand.length).toBeGreaterThan(0)
    })
    
    test('Edge-3: Rapid RESET dispatches produce valid state', () => {
      let state: DeckState = { ...mockMidGameState, turnNumber: 8 }
      
      // Simulate 5 rapid RESET actions
      for (let i = 0; i < 5; i++) {
        state = deckReducer(state, { type: 'RESET' })
      }
      
      // Final state should be valid initial state
      expect(state.turnNumber).toBe(1)
      expect(state.drawPile.length).toBeGreaterThan(0)
      expect(state.discardPile).toEqual([])
      expect(state.selectedCardIds.size).toBe(0)
    })
  })
})
```

**Run tests**: `npm test`

**Expected**: All contract tests pass (15+ tests)

---

## Step 8: Update Existing Tests (30 minutes)

### 8.1 Verify Existing Tests Still Pass

**Command**: `npm test`

**Expected behavior**:
- All 106 existing tests should pass (SC-008)
- No regressions from adding shuffle to `initializeDeck()`

**If tests fail**:
1. Check if test expects specific card order (shuffle breaks this)
2. Update test to check for cards without assuming order
3. Use `.toContain()` or `.toEqual(expect.arrayContaining([...]))` instead of exact array equality

### 8.2 Update Tests that Assume Card Order

**Example fix**:
```typescript
// Before (assumes order)
expect(state.hand).toEqual(['Card 1', 'Card 2', 'Card 3'])

// After (checks presence, not order)
expect(state.hand).toHaveLength(3)
expect(state.hand).toEqual(expect.arrayContaining(['Card 1', 'Card 2', 'Card 3']))

// Or if order doesn't matter
expect(state.hand.sort()).toEqual(['Card 1', 'Card 2', 'Card 3'].sort())
```

**Files likely needing updates**:
- `tests/unit/deckReducer.test.ts`
- `tests/integration/turnCycle.test.tsx`

---

## Step 9: Manual Testing (30 minutes)

### 9.1 Basic Reset Flow Test

1. Start dev server: `npm run dev`
2. Open browser to `localhost:5173`
3. Play a few turns (deal hands, discard cards, etc.)
4. Note current turn number and state
5. Click "Reset" button
6. Verify:
   - Turn number reset to 1
   - All piles cleared except draw pile
   - New hand dealt (different cards than before)
   - Hand size and discard count preserved (if you changed them)
   - No selections or locks active

### 9.2 Page Load Shuffle Test

1. Load page 5 times (Ctrl+Shift+R for hard refresh)
2. Note the initial hand each time
3. Verify:
   - Each load shows different initial hand
   - Cards are randomized (not always same order)

### 9.3 Settings Preservation Test

1. Change hand size to 7 (if UI allows)
2. Change discard count to 4
3. Play a turn
4. Click "Reset"
5. Verify:
   - New hand has 7 cards (not default 5)
   - Discard phase requires 4 cards (not default 3)

### 9.4 Button Disabled State Test

1. Click "Reset" button
2. Immediately try to click again
3. Verify:
   - Button shows "Resetting..." text briefly
   - Button is disabled during reset
   - Button re-enables after reset completes

---

## Step 10: Polish & Validation (30 minutes)

### 10.1 Run Linter

```bash
npm run lint
```

Fix any errors or warnings.

### 10.2 Run Full Test Suite

```bash
npm test
```

Verify all tests pass:
- ✅ 106 existing tests
- ✅ 15+ new contract tests
- ✅ Total: ~121+ tests

### 10.3 Build Production

```bash
npm run build
```

Verify build succeeds with no errors.

### 10.4 Performance Check

- Open browser DevTools → Performance tab
- Record interaction: click reset button
- Verify reset operation completes in <10ms (requirement is <500ms)

### 10.5 Accessibility Check

- **Keyboard**: Tab to reset button, press Enter - verify works
- **Screen reader**: Verify button label read correctly ("Reset")
- **Tooltip**: Hover reset button, verify title attribute shows explanation

---

## Troubleshooting

### Issue: Tests fail after adding shuffle

**Symptom**: Tests expect specific card order, but shuffle randomizes it

**Solution**: Update tests to check card presence without assuming order:
```typescript
// Instead of exact array match
expect(state.hand).toEqual(['Card 1', 'Card 2', 'Card 3'])

// Use length + contains
expect(state.hand).toHaveLength(3)
expect(state.hand).toContain('Card 1')
```

### Issue: Button doesn't re-enable after reset

**Symptom**: Reset button stays disabled after clicking

**Solution**: Verify `useEffect` in DeckControls runs:
```typescript
useEffect(() => {
  if (isResetting) {
    setIsResetting(false)
  }
}, [isResetting])
```

Dependency array should include `isResetting`.

### Issue: Settings not preserved on reset

**Symptom**: Reset uses default hand size instead of current

**Solution**: Verify RESET case extracts state:
```typescript
case 'RESET':
  const preservedHandSize = state.handSize  // Not DEFAULT_HAND_SIZE
  // ...
```

### Issue: Shuffle produces same hand repeatedly

**Symptom**: Multiple resets show identical hands

**Solution**: 
1. Verify `shuffle()` function uses random seed (not fixed seed)
2. Check if shuffle is using `Math.random()` correctly
3. Probabilistic test may rarely produce duplicates - re-run test

---

## Success Checklist

Before marking feature complete:

- [ ] RESET action type added to types.ts
- [ ] initializeDeck() modified to shuffle deck
- [ ] RESET case added to deckReducer
- [ ] reset() function added to useDeckState hook
- [ ] Reset button added to DeckControls component
- [ ] Button disabled state implemented (prevents double-clicks)
- [ ] All 15+ contract tests written and passing (C001-C010, Edge cases)
- [ ] All 106 existing tests still passing (no regressions)
- [ ] Linter passes with 0 errors
- [ ] Production build succeeds
- [ ] Manual testing completed (reset flow, page load shuffle, settings preservation, button state)
- [ ] Performance verified (<500ms, typically <10ms)
- [ ] Accessibility verified (keyboard, screen reader, tooltip)

---

## Summary of Changes

**Files Modified** (6 files):
1. `src/lib/types.ts` - Added RESET action type
2. `src/state/deckReducer.ts` - Modified initializeDeck, added RESET handler
3. `src/hooks/useDeckState.ts` - Added reset() function
4. `src/components/DeckControls.tsx` - Added reset button with disabled state
5. `src/App.tsx` - Passed reset prop to DeckControls

**Files Created** (1 file):
6. `tests/contract/resetContracts.test.ts` - Contract tests for reset feature

**Total Lines Changed**: ~150-200 lines (small feature, big impact)

---

## Next Steps

**Feature Complete**: Reset button functional, shuffle on page load working

**Integration with Persistence** (already works):
- Existing `useDeckStatePersistence` hook automatically persists new state
- No changes needed to persistence layer
- Reset triggers save via existing useEffect

**Future Enhancements**:
- Confirmation dialog before reset (if user requests it)
- Reset animation or transition effect
- Undo reset (save previous state temporarily)

---

## References

- **spec.md**: FR-001 through FR-013, SC-001 through SC-008
- **plan.md**: Implementation phases, file modifications
- **data-model.md**: State transitions, RESET action contract
- **contracts/reset-action.contract.md**: C001-C010 behavioral contracts
- **research.md**: RQ-001 through RQ-006 technical decisions

---

**Developer Guide Complete**: Ready for implementation  
**Estimated Time**: 3-4 hours  
**Complexity**: Low (builds on existing patterns)  
**Risk**: Low (minimal changes, high test coverage)
