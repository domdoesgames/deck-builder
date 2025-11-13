# Contract: Reset Action

**Feature**: 006-deck-reset  
**Component**: `src/state/deckReducer.ts`  
**Date**: 2025-11-13  
**Based on**: [data-model.md](../data-model.md), [spec.md](../spec.md)

## Purpose

This contract defines the behavioral requirements for the RESET action and the initialization shuffle behavior. It ensures the system can reliably return to initial state while preserving user configuration, and guarantees deck shuffling occurs on both page load and manual reset.

---

## State Shape Extensions

```typescript
// No new state fields added
// Existing DeckState used, behavior changes only

type DeckAction = 
  | { type: 'INIT' }
  | { type: 'RESET' }  // NEW ACTION
  | // ... existing actions
```

---

## Action Contracts

### C001: INIT - Application Initialization with Shuffle

**Action**: `{ type: 'INIT' }`

**Trigger**: Application first loads, `useDeckState` hook initializes

**Preconditions**:
- No existing state (fresh load) OR persisted state exists
- `DEFAULT_DECK` constant available (52 cards)
- `shuffle()` function available

**Process**:
1. Call `initializeDeck()` with no parameters (uses defaults)
2. **MODIFIED BEHAVIOR**: `shuffle([...DEFAULT_DECK])` called immediately after deck creation
3. Fresh state created with shuffled deck
4. `dealNextHand()` called to deal initial hand from shuffled deck

**Postconditions**:
```typescript
{
  drawPile: [shuffled 47 cards],      // CHANGED: Now shuffled
  discardPile: [],
  hand: [first 5 cards from shuffled deck],
  handCards: [5 CardInstances],
  turnNumber: 1,
  handSize: DEFAULT_HAND_SIZE,        // 5
  discardCount: DEFAULT_DISCARD_COUNT, // 3
  selectedCardIds: new Set(),
  discardPhase: { active: true, remainingDiscards: 3 },
  playOrderSequence: [],
  playOrderLocked: false,
  planningPhase: false,
  warning: null,
  error: null,
  isDealing: false
}
```

**Invariants Maintained**:
- `drawPile.length + hand.length === 52`
- All cards in deck are unique (no duplicates)
- Card order is randomized (different from DEFAULT_DECK order)

**Test**:
```typescript
test('C001: INIT shuffles deck before dealing hand', () => {
  const state = deckReducer(undefined as any, { type: 'INIT' });
  
  expect(state.drawPile.length).toBe(47);
  expect(state.hand.length).toBe(5);
  
  // Verify shuffle occurred (deck not in default order)
  const defaultOrder = DEFAULT_DECK.slice(0, 5);
  expect(state.hand).not.toEqual(defaultOrder);
});
```

**Functional Requirements**: FR-004, FR-009, FR-013

---

### C002: RESET - Manual System Reset with Settings Preservation

**Action**: `{ type: 'RESET' }`

**Trigger**: User clicks "Reset" button in DeckControls

**Preconditions**:
- Valid existing state (app is running)
- Current state has `handSize` and `discardCount` values (valid or default)

**Process**:
1. Extract `handSize` and `discardCount` from current state
2. Validate extracted values (fallback to defaults if invalid)
3. Call `initializeDeck({ handSize, discardCount })` with preserved settings
4. Shuffle deck (same as INIT behavior)
5. Return new state identical to INIT but with preserved settings

**Before** (Example mid-game state):
```typescript
{
  drawPile: [20 cards],
  discardPile: [15 cards],
  hand: [5 cards],
  handCards: [5 CardInstances],
  turnNumber: 8,
  handSize: 7,                       // User configured
  discardCount: 4,                   // User configured
  selectedCardIds: new Set(['id1', 'id2']),
  discardPhase: { active: true, remainingDiscards: 1 },
  playOrderSequence: ['id1', 'id2', 'id3'],
  playOrderLocked: true,
  planningPhase: false,
  warning: "Low cards in deck",
  error: null,
  isDealing: false
}
```

**After**:
```typescript
{
  drawPile: [freshly shuffled 45 cards],
  discardPile: [],
  hand: [first 7 cards from shuffled deck],
  handCards: [7 new CardInstances],
  turnNumber: 1,
  handSize: 7,                       // PRESERVED
  discardCount: 4,                   // PRESERVED
  selectedCardIds: new Set(),        // CLEARED
  discardPhase: { active: true, remainingDiscards: 4 },
  playOrderSequence: [],             // CLEARED
  playOrderLocked: false,            // CLEARED
  planningPhase: false,
  warning: null,                     // CLEARED
  error: null,
  isDealing: false
}
```

**Postconditions**:
- All game state reset to initial values
- `handSize` and `discardCount` preserved from pre-reset state
- Deck is shuffled (different order than pre-reset)
- New CardInstance IDs generated (all old IDs invalidated)
- Turn number reset to 1
- All selections cleared
- All locks/phases cleared
- All warnings/errors cleared

**Invariants Maintained**:
- `drawPile.length + hand.length === 52`
- `hand.length === handSize` (preserved value)
- `discardPhase.remainingDiscards === discardCount` (preserved value)
- `selectedCardIds.size === 0` (always empty after reset)
- `playOrderSequence.length === 0` (always empty after reset)
- `playOrderLocked === false` (always unlocked after reset)

**Test**:
```typescript
test('C002: RESET preserves user settings and clears game state', () => {
  const midGameState: DeckState = {
    ...mockState,
    handSize: 7,
    discardCount: 4,
    turnNumber: 8,
    selectedCardIds: new Set(['id1', 'id2']),
    playOrderLocked: true,
    playOrderSequence: ['id1', 'id2', 'id3'],
    warning: "Low cards"
  };
  
  const newState = deckReducer(midGameState, { type: 'RESET' });
  
  // Settings preserved
  expect(newState.handSize).toBe(7);
  expect(newState.discardCount).toBe(4);
  
  // Game state reset
  expect(newState.turnNumber).toBe(1);
  expect(newState.selectedCardIds.size).toBe(0);
  expect(newState.playOrderSequence).toEqual([]);
  expect(newState.playOrderLocked).toBe(false);
  expect(newState.warning).toBeNull();
  expect(newState.discardPile).toEqual([]);
  
  // Deck shuffled and dealt
  expect(newState.hand.length).toBe(7);
  expect(newState.drawPile.length).toBe(45);
});
```

**Functional Requirements**: FR-002, FR-003, FR-005, FR-006, FR-011, FR-012

---

### C003: RESET - Settings Validation and Fallback

**Action**: `{ type: 'RESET' }`

**Preconditions**:
- Current state has invalid `handSize` or `discardCount` (corrupted state)
  - `handSize < 1` OR `handSize > 52`
  - `discardCount < 0` OR `discardCount > handSize`

**Process**:
1. Attempt to extract `handSize` and `discardCount`
2. Validate extracted values
3. If invalid, fallback to `DEFAULT_HAND_SIZE` and `DEFAULT_DISCARD_COUNT`
4. Proceed with RESET using validated values

**Example**:
```typescript
// Corrupted state
{ handSize: -5, discardCount: 100, ... }

// After RESET
{ handSize: 5, discardCount: 3, ... }  // Defaults used
```

**Test**:
```typescript
test('C003: RESET falls back to defaults when settings invalid', () => {
  const corruptedState: DeckState = {
    ...mockState,
    handSize: -5,      // Invalid
    discardCount: 100  // Invalid
  };
  
  const newState = deckReducer(corruptedState, { type: 'RESET' });
  
  expect(newState.handSize).toBe(DEFAULT_HAND_SIZE);
  expect(newState.discardCount).toBe(DEFAULT_DISCARD_COUNT);
});
```

**Functional Requirement**: FR-003 (preserve valid settings, fallback for invalid)

---

## Integration Contracts

### C004: RESET Interaction with Discard Phase

**Contract**: RESET MUST clear any active discard phase and start fresh

**Preconditions**:
- `state.discardPhase.active === true` (mid-discard)
- `state.selectedCardIds.size > 0` (cards selected)

**Postconditions**:
- New discard phase created based on preserved `discardCount`
- `discardPhase.active === true` IF new `discardCount > 0`
- `discardPhase.remainingDiscards === discardCount`
- `selectedCardIds.size === 0` (selections cleared)

**Test**:
```typescript
test('C004: RESET clears active discard phase', () => {
  const midDiscardState: DeckState = {
    ...mockState,
    discardPhase: { active: true, remainingDiscards: 2 },
    selectedCardIds: new Set(['id1', 'id2']),
    discardCount: 3
  };
  
  const newState = deckReducer(midDiscardState, { type: 'RESET' });
  
  expect(newState.discardPhase.active).toBe(true);
  expect(newState.discardPhase.remainingDiscards).toBe(3);
  expect(newState.selectedCardIds.size).toBe(0);
});
```

**Functional Requirement**: FR-012

---

### C005: RESET Interaction with Play Order

**Contract**: RESET MUST unlock and clear any play order state

**Preconditions**:
- `state.playOrderLocked === true` (locked order)
- `state.playOrderSequence.length > 0` (cards in order)
- `state.planningPhase === true` OR `false`

**Postconditions**:
- `playOrderSequence === []` (empty)
- `playOrderLocked === false` (unlocked)
- `planningPhase === false` (not in planning)

**Test**:
```typescript
test('C005: RESET unlocks and clears play order', () => {
  const lockedOrderState: DeckState = {
    ...mockState,
    playOrderSequence: ['id1', 'id2', 'id3'],
    playOrderLocked: true,
    planningPhase: false
  };
  
  const newState = deckReducer(lockedOrderState, { type: 'RESET' });
  
  expect(newState.playOrderSequence).toEqual([]);
  expect(newState.playOrderLocked).toBe(false);
  expect(newState.planningPhase).toBe(false);
});
```

**Functional Requirement**: FR-011

---

### C006: RESET Interaction with Persistence

**Contract**: RESET MUST trigger persistence of new state via existing persistence hook

**Preconditions**:
- Persisted state exists in localStorage
- User triggers RESET

**Process**:
1. RESET action returns new state
2. `useDeckStatePersistence` hook detects state change via `useEffect`
3. `persistenceManager.save(newState)` called automatically
4. New state serialized and written to localStorage

**Postconditions**:
- localStorage contains serialized new state
- Old persisted state completely overwritten
- No explicit `localStorage.clear()` needed

**Note**: Persistence layer unchanged. RESET clears persisted state by overwriting, not by explicit clear operation.

**Test** (integration test):
```typescript
test('C006: RESET triggers persistence update', () => {
  // Setup: Create persisted mid-game state
  const midGameState = { ...mockState, turnNumber: 8 };
  persistenceManager.save(midGameState);
  
  // Simulate RESET
  const { result } = renderHook(() => useDeckState());
  act(() => {
    result.current.dispatch({ type: 'RESET' });
  });
  
  // Verify new state persisted
  const loaded = persistenceManager.load();
  expect(loaded.turnNumber).toBe(1);
  expect(loaded.drawPile.length).toBeGreaterThan(0);
});
```

**Functional Requirement**: FR-006

---

## Shuffle Behavior Contract

### C007: Shuffle Randomness Guarantee

**Contract**: Both INIT and RESET MUST produce random deck orders with high probability

**Preconditions**:
- `shuffle()` function uses Fisher-Yates algorithm (unbiased)
- `DEFAULT_DECK` contains 52 unique cards

**Validation Method**:
Probabilistic test: Loading page 10 times MUST produce at least 8 unique initial hands (80% uniqueness threshold)

**Rationale**:
- Mathematical probability of identical shuffles: ~1 in 52! (negligible)
- 8/10 threshold accounts for test flakiness while ensuring randomness

**Test**:
```typescript
test('C007: Shuffle produces random hands (probabilistic)', () => {
  const hands: string[][] = [];
  
  // Generate 10 fresh states
  for (let i = 0; i < 10; i++) {
    const state = deckReducer(undefined as any, { type: 'INIT' });
    hands.push([...state.hand].sort()); // Sort for comparison
  }
  
  // Count unique hands
  const uniqueHands = new Set(hands.map(h => JSON.stringify(h)));
  
  // Expect at least 8/10 unique (80% threshold)
  expect(uniqueHands.size).toBeGreaterThanOrEqual(8);
});
```

**Functional Requirement**: FR-004, FR-005, FR-009, SC-003

---

## Performance Contracts

### C008: Reset Operation Performance

**Contract**: RESET MUST complete in under 500ms for standard 52-card deck

**Preconditions**:
- Standard 52-card deck
- No external I/O operations (localStorage writes are async/silent)

**Measurement**:
```typescript
test('C008: RESET completes in under 500ms', () => {
  const state: DeckState = { ...mockState, turnNumber: 8 };
  
  const start = performance.now();
  const newState = deckReducer(state, { type: 'RESET' });
  const end = performance.now();
  
  const duration = end - start;
  expect(duration).toBeLessThan(500);
  expect(newState.turnNumber).toBe(1);
});
```

**Expected Performance**: <10ms (requirement is <500ms)

**Functional Requirement**: FR-008, SC-002

---

### C009: Initialization Shuffle Performance

**Contract**: Shuffle operation MUST complete before hand rendering

**Preconditions**:
- INIT action triggered on page load
- UI waits for state initialization before first render

**Process**:
1. INIT action dispatched
2. Shuffle completes synchronously
3. State returned with shuffled deck
4. UI renders hand from shuffled state

**Postconditions**:
- User never sees unshuffled deck
- No "flash" of default card order

**Test** (integration test):
```typescript
test('C009: Hand renders only after shuffle completes', () => {
  const { container } = render(<App />);
  
  // Wait for initial render
  const handElement = container.querySelector('[data-testid="hand"]');
  const displayedCards = Array.from(handElement?.children || [])
    .map(el => el.textContent);
  
  // Verify displayed cards are from shuffled deck (not DEFAULT_DECK start)
  const defaultStart = DEFAULT_DECK.slice(0, 5);
  expect(displayedCards).not.toEqual(defaultStart);
});
```

**Functional Requirement**: FR-013

---

## UI Integration Contracts

### C010: Reset Button Disabled State

**Contract**: Reset button MUST be disabled during reset operation to prevent concurrent resets

**Preconditions**:
- Reset button exists in DeckControls component
- User clicks reset button

**Process** (component-level, not reducer):
```typescript
// DeckControls.tsx
const [isResetting, setIsResetting] = useState(false);

const handleReset = () => {
  setIsResetting(true);
  dispatch({ type: 'RESET' });
  // Button re-enabled on next render (state change triggers re-render)
};

<button disabled={isResetting} onClick={handleReset}>
  Reset
</button>
```

**Postconditions**:
- Button disabled immediately on click
- Button re-enabled after state update completes
- Rapid clicks do not trigger multiple RESET actions

**Note**: Disabled state managed by component, not reducer (FR-007)

**Test** (component test):
```typescript
test('C010: Reset button disabled during operation', async () => {
  const { getByText } = render(<DeckControls />);
  const resetButton = getByText('Reset');
  
  expect(resetButton).not.toBeDisabled();
  
  fireEvent.click(resetButton);
  
  // Button should be disabled immediately
  expect(resetButton).toBeDisabled();
  
  // Wait for state update
  await waitFor(() => {
    expect(resetButton).not.toBeDisabled();
  });
});
```

**Functional Requirement**: FR-007

---

## Edge Cases

### Edge Case 1: RESET with discardCount = 0

**Contract**: RESET with preserved `discardCount = 0` MUST skip discard phase

**Preconditions**:
- Current state has `discardCount = 0`
- User triggers RESET

**Postconditions**:
- `discardPhase.active === false`
- `discardPhase.remainingDiscards === 0`
- Turn can end immediately (no discard required)

**Test**:
```typescript
test('Edge-1: RESET with discardCount=0 skips discard phase', () => {
  const stateWithNoDiscard: DeckState = {
    ...mockState,
    discardCount: 0,
    handSize: 5
  };
  
  const newState = deckReducer(stateWithNoDiscard, { type: 'RESET' });
  
  expect(newState.discardCount).toBe(0);
  expect(newState.discardPhase.active).toBe(false);
  expect(newState.hand.length).toBe(5);
});
```

---

### Edge Case 2: RESET with Empty Draw Pile

**Contract**: RESET MUST work even if current draw pile is empty

**Preconditions**:
- `state.drawPile.length === 0` (deck exhausted)
- User triggers RESET

**Postconditions**:
- New shuffled deck created from `DEFAULT_DECK`
- `drawPile.length === 52 - handSize`
- All discarded cards returned to deck

**Test**:
```typescript
test('Edge-2: RESET works with exhausted draw pile', () => {
  const exhaustedState: DeckState = {
    ...mockState,
    drawPile: [],
    discardPile: Array(47).fill('card'),
    hand: Array(5).fill('card')
  };
  
  const newState = deckReducer(exhaustedState, { type: 'RESET' });
  
  expect(newState.drawPile.length).toBe(47);
  expect(newState.discardPile.length).toBe(0);
  expect(newState.hand.length).toBe(5);
});
```

---

### Edge Case 3: Rapid RESET Clicks

**Contract**: Multiple rapid RESET dispatches MUST produce valid final state

**Preconditions**:
- User clicks reset button multiple times rapidly
- Multiple RESET actions dispatched in quick succession

**Process**:
- Each RESET action processes independently
- Final state is result of last RESET
- All RESET actions produce identical result (idempotent)

**Postconditions**:
- Final state is valid initial state
- No state corruption from concurrent resets

**Test**:
```typescript
test('Edge-3: Rapid RESET dispatches produce valid state', () => {
  let state: DeckState = { ...mockState, turnNumber: 8 };
  
  // Simulate 5 rapid RESET actions
  for (let i = 0; i < 5; i++) {
    state = deckReducer(state, { type: 'RESET' });
  }
  
  // Final state should be valid initial state
  expect(state.turnNumber).toBe(1);
  expect(state.drawPile.length).toBeGreaterThan(0);
  expect(state.discardPile).toEqual([]);
  expect(state.selectedCardIds.size).toBe(0);
});
```

**Note**: Component-level button disabling (C010) prevents this in practice

---

## State Invariants

The RESET action MUST maintain these invariants:

1. **Deck Completeness**: `drawPile.length + hand.length === 52`
2. **Card Uniqueness**: No duplicate cards across all piles
3. **Selection Clear**: `selectedCardIds.size === 0` after reset
4. **Lock Clear**: `playOrderLocked === false` after reset
5. **Phase Clear**: `playOrderSequence.length === 0` after reset
6. **Turn Reset**: `turnNumber === 1` after reset
7. **Settings Preservation**: `handSize` and `discardCount` unchanged (unless invalid)
8. **Hand Synchronization**: `handCards.length === hand.length`

---

## Success Criteria

From spec.md:

- ✅ **SC-001**: User can trigger reset via single button click
- ✅ **SC-002**: Reset completes in under 500ms (C008)
- ✅ **SC-003**: 10 page loads produce 10 different hands (C007)
- ✅ **SC-004**: Post-reset state matches fresh page load (C002)
- ✅ **SC-005**: User settings survive reset (C002, C003)
- ✅ **SC-006**: Reset button disabled during operation (C010)
- ✅ **SC-007**: Persisted state replaced with fresh state (C006)
- ✅ **SC-008**: Existing 106 tests continue passing (regression prevention)

---

## References

- **Spec**: [spec.md](../spec.md) - FR-001 through FR-013, SC-001 through SC-008
- **Data Model**: [data-model.md](../data-model.md) - State transitions, action contracts
- **Research**: [research.md](../research.md) - RQ-001 through RQ-006

---

**Contract Status**: ✅ Complete  
**Implementation Target**: `src/state/deckReducer.ts`, `src/hooks/useDeckState.ts`, `src/components/DeckControls.tsx`  
**Next Step**: Generate quickstart.md
