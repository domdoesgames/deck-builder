# Contract: useDeckState Hook Extension

**Hook**: `useDeckState`  
**File**: `src/hooks/useDeckState.ts`  
**Purpose**: Extension to existing hook for preset deck loading functionality

## Interface Contract

### Existing Interface (Unchanged)

```typescript
interface UseDeckStateReturn {
  state: DeckState;
  dealNextHand: () => void;
  endTurn: () => void;
  applyJsonOverride: (jsonString: string) => void;
  changeParameters: (handSize: number, discardCount: number, immediateReset: boolean) => void;
  toggleCardSelection: (instanceId: string) => void;
  confirmDiscard: () => void;
  selectForPlayOrder: (instanceId: string) => void;
  deselectFromPlayOrder: (instanceId: string) => void;
  lockPlayOrder: () => void;
  clearPlayOrder: () => void;
  reset: () => void;
  // ... existing methods unchanged
}
```

### New Interface Extension

```typescript
interface UseDeckStateReturn {
  // ... all existing methods ...
  
  /**
   * Load a preset deck by its unique identifier
   * Replaces current deck state with preset deck configuration
   * Sets deckSource to 'preset' and activePresetId to provided ID
   * 
   * @param presetId - Unique identifier of preset deck (from PresetDeck.id)
   * 
   * @throws Does not throw - errors reported via state.error
   * 
   * Side effects:
   * - Dispatches LOAD_PRESET_DECK action to reducer
   * - Triggers persistence of deck state to localStorage
   * - Triggers persistence of activePresetId to localStorage
   * - Clears any existing warnings/errors
   * - Resets game phase to initial state (no discard, no play order)
   */
  loadPresetDeck: (presetId: string) => void;
}
```

---

## Behavior Contract

### loadPresetDeck Implementation

```typescript
const loadPresetDeck = useCallback((presetId: string) => {
  dispatch({ type: 'LOAD_PRESET_DECK', payload: { presetId } });
}, []);
```

**MUST**:
1. Dispatch `LOAD_PRESET_DECK` action with provided `presetId`
2. Use `useCallback` to memoize function (prevent unnecessary re-renders)
3. Include no dependencies (action dispatch stable across renders)

**MUST NOT**:
1. Perform validation directly (validation is reducer's responsibility)
2. Update localStorage directly (persistence handled by side effects)
3. Throw errors (errors set in `state.error` field)

---

### Reducer Action Handler Contract

**Action Type**: `LOAD_PRESET_DECK`

**Payload**:
```typescript
{
  presetId: string;  // Unique identifier of preset deck to load
}
```

**Reducer Behavior**:

1. **Preset Lookup**:
   ```typescript
   const preset = PRESET_DECKS.find(d => d.id === presetId);
   ```
   - **IF** preset not found:
     - Return state with `error: 'Preset deck "{presetId}" not found'`
     - All other state unchanged

2. **Preset Validation**:
   ```typescript
   const validation = validatePresetDeck(preset);
   ```
   - **IF** validation fails (`!validation.isValid`):
     - Return state with `error: 'Invalid preset deck: {errors}'`
     - All other state unchanged

3. **State Initialization**:
   - Call existing deck initialization logic with `preset.cards`
   - Preserve current `handSize` and `discardCount` parameters
   - Initialize fresh game state:
     - Shuffle `preset.cards` into `drawPile`
     - Empty `discardPile`
     - Empty `hand` and `handCards`
     - Reset `turnNumber` to 1
     - Clear `warning` and `error`
     - Set `isDealing: false`
     - Clear selections (`selectedCardIds: Set()`)
     - Reset discard phase (`discardPhase.active: false`)
     - Reset play order (`playOrderSequence: []`, `playOrderLocked: false`)

4. **Source Tracking**:
   - Set `deckSource: 'preset'`
   - Set `activePresetId: presetId`

**Return**: New `DeckState` with preset deck loaded

---

### Side Effect: activePresetId Persistence

**Trigger**: After `LOAD_PRESET_DECK` action completes successfully

**Implementation**: Add to `useDeckState` hook

```typescript
// Effect to persist activePresetId whenever it changes
useEffect(() => {
  if (state.activePresetId) {
    saveActivePresetId(state.activePresetId);
  } else {
    clearActivePresetId();
  }
}, [state.activePresetId]);
```

**Behavior**:
- **IF** `state.activePresetId` is non-null string:
  - Save to localStorage key `deck-builder:activePresetId`
- **IF** `state.activePresetId` is null:
  - Remove localStorage key `deck-builder:activePresetId`
- **ON** localStorage error:
  - Silent failure (no error thrown or reported)

---

### Side Effect: Clear activePresetId on Other Actions

**Affected Actions**:
- `APPLY_JSON_OVERRIDE`: User loaded custom JSON deck
- `RESET`: User reset to default deck

**Required Changes in Reducer**:

```typescript
case 'APPLY_JSON_OVERRIDE': {
  const newState = parseAndInitializeFromJson(action.payload, state);
  return {
    ...newState,
    deckSource: 'custom',
    activePresetId: null,  // NEW: Clear active preset
  };
}

case 'RESET': {
  return initializeDefaultDeck({
    deckSource: 'default',
    activePresetId: null,  // NEW: Clear active preset
  });
}
```

**Result**: When user switches away from preset deck, `activePresetId` set to null, triggering persistence side effect to clear localStorage.

---

## State Contract Extensions

### DeckState Type Extensions

```typescript
export interface DeckState {
  // ... existing fields ...
  
  /**
   * Source of current deck configuration
   * - 'preset': Loaded from preset deck selection
   * - 'custom': Loaded from JSON override
   * - 'default': Initial default deck (no user action)
   */
  deckSource: DeckSource;
  
  /**
   * ID of currently active preset deck
   * - Non-null when deckSource === 'preset'
   * - null when deckSource === 'custom' | 'default'
   */
  activePresetId: string | null;
}
```

### DeckAction Type Extensions

```typescript
export type DeckAction =
  | { type: 'LOAD_PRESET_DECK'; payload: { presetId: string } }
  // ... existing action types ...
```

---

## Initialization Contract

### Lazy Initializer Update

**Current Behavior**: Initializer tries to load persisted deck state from localStorage, falls back to default initialization.

**New Behavior**: After attempting to restore persisted deck state, also restore active preset if available.

**Implementation**:

```typescript
const [state, dispatch] = useReducer(deckReducer, null, () => {
  // 1. Try to restore full persisted deck state
  const persistedState = loadDeckState();
  
  if (persistedState) {
    // Persisted state exists, check if it references a preset
    if (persistedState.activePresetId) {
      // Validate preset still exists and is valid
      const preset = PRESET_DECKS.find(d => d.id === persistedState.activePresetId);
      
      if (preset) {
        const validation = validatePresetDeck(preset);
        
        if (validation.isValid) {
          // Preset is still valid, reload it (fresher than persisted state)
          // This ensures any preset updates are reflected
          return deckReducer(
            {} as DeckState, 
            { type: 'LOAD_PRESET_DECK', payload: { presetId: preset.id } }
          );
        } else {
          // Preset became invalid, clear reference and use persisted state
          console.warn('Stored preset deck invalid, using persisted state:', validation.errors);
          return {
            ...persistedState,
            activePresetId: null,
            deckSource: 'custom',
          };
        }
      } else {
        // Preset no longer exists (removed in code update)
        console.warn('Stored preset deck not found:', persistedState.activePresetId);
        return {
          ...persistedState,
          activePresetId: null,
          deckSource: 'custom',
        };
      }
    }
    
    // No active preset, return persisted state as-is
    return persistedState;
  }
  
  // 2. No persisted state, check for standalone active preset ID
  const presetId = loadActivePresetId();
  
  if (presetId) {
    const preset = PRESET_DECKS.find(d => d.id === presetId);
    
    if (preset) {
      const validation = validatePresetDeck(preset);
      
      if (validation.isValid) {
        // Load preset deck
        return deckReducer(
          {} as DeckState,
          { type: 'LOAD_PRESET_DECK', payload: { presetId } }
        );
      }
    }
    
    // Invalid or missing preset, clear and use default
    clearActivePresetId();
  }
  
  // 3. Fall back to default initialization
  return deckReducer({} as DeckState, { type: 'INIT' });
});
```

**Behavior Summary**:
1. Restore persisted deck state if available
2. If persisted state references a preset, reload preset (ensures freshness)
3. If no persisted state but active preset ID saved, load preset
4. Otherwise, default initialization

---

## Error Handling Contract

### Preset Not Found Error

**Condition**: `PRESET_DECKS.find(d => d.id === presetId)` returns `undefined`

**State Update**:
```typescript
{
  ...state,
  error: `Preset deck "${presetId}" not found. Available presets: ${PRESET_DECKS.map(d => d.id).join(', ')}`
}
```

**User Experience**: Error displayed in `WarningBanner` or settings panel error section.

---

### Preset Validation Error

**Condition**: `validatePresetDeck(preset)` returns `isValid: false`

**State Update**:
```typescript
{
  ...state,
  error: `Invalid preset deck "${preset.name}": ${result.errors.join(', ')}`
}
```

**User Experience**: Error displayed, preset not loaded, existing deck state preserved.

---

### localStorage Failure

**Condition**: `saveActivePresetId()` or `clearActivePresetId()` throws error

**Behavior**: Silent failure - user continues with session-only state

**Rationale**: Follows existing pattern from `persistenceManager.ts` (see Feature 005)

---

## Testing Contract

### Unit Test Requirements

1. **loadPresetDeck dispatches correct action**
   - Call `loadPresetDeck('test-id')`
   - Verify dispatch called with `{ type: 'LOAD_PRESET_DECK', payload: { presetId: 'test-id' } }`

2. **loadPresetDeck is memoized**
   - Multiple renders should return same function reference

3. **Reducer loads valid preset deck**
   - Dispatch `LOAD_PRESET_DECK` with valid preset ID
   - Verify state contains cards from preset
   - Verify `deckSource: 'preset'` and `activePresetId` set

4. **Reducer handles preset not found**
   - Dispatch `LOAD_PRESET_DECK` with invalid ID
   - Verify state.error contains "not found" message
   - Verify existing deck state unchanged

5. **Reducer handles invalid preset**
   - Mock `validatePresetDeck` to return `isValid: false`
   - Dispatch `LOAD_PRESET_DECK`
   - Verify state.error contains validation errors
   - Verify existing deck state unchanged

6. **APPLY_JSON_OVERRIDE clears activePresetId**
   - Start with state where `activePresetId: 'test-id'`
   - Dispatch `APPLY_JSON_OVERRIDE`
   - Verify `activePresetId: null` and `deckSource: 'custom'`

7. **RESET clears activePresetId**
   - Start with state where `activePresetId: 'test-id'`
   - Dispatch `RESET`
   - Verify `activePresetId: null` and `deckSource: 'default'`

8. **Initialization restores active preset**
   - Mock `loadActivePresetId()` to return 'starter-deck'
   - Initialize hook
   - Verify state loaded with starter deck data
   - Verify `activePresetId: 'starter-deck'`

---

## Integration Points

### Dependencies

- `PRESET_DECKS` from `@/lib/presetDecks`
- `validatePresetDeck` from `@/lib/presetDeckValidator`
- `saveActivePresetId`, `loadActivePresetId`, `clearActivePresetId` from `@/lib/persistenceManager`
- Existing `deckReducer` from `@/state/deckReducer`

### Consumers

- `App.tsx`: Passes `loadPresetDeck` to `PresetDeckSelector`
- `PresetDeckSelector`: Calls `loadPresetDeck` when user selects preset
- `DeckControls`: May display active preset indicator using `state.activePresetId`

---

## Backward Compatibility

### Existing Functionality

**MUST NOT** break:
- All existing hook methods (`dealNextHand`, `applyJsonOverride`, etc.)
- Existing action handlers in reducer
- Existing persistence behavior
- Existing initialization flow (when no preset selected)

### Migration

**No migration required** - new fields have sensible defaults:
- `deckSource: 'default'` for existing states
- `activePresetId: null` for existing states

---

## Performance Contract

- `loadPresetDeck` callback: O(1) - simple dispatch
- Reducer `LOAD_PRESET_DECK`: O(n) where n = preset deck size (typically <100 cards)
- Preset lookup: O(m) where m = number of preset decks (typically <20)
- Validation: O(n) where n = preset deck size

**Total**: O(n + m) - acceptable for interactive use (<100ms)

---

## Version

**Contract Version**: 1.0.0  
**Created**: 2025-11-19  
**Status**: Draft (Phase 1)

**Breaking Changes Policy**: Changes to return interface or action payload structure require MAJOR version bump.
