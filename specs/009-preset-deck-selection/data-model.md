# Data Model: Preset Deck Selection

**Feature**: `009-preset-deck-selection`  
**Phase**: 1 (Design)  
**Date**: 2025-11-19

## Entity Definitions

### PresetDeck

A pre-configured deck definition managed in code, providing a curated gameplay experience.

```typescript
export interface PresetDeck {
  /** Unique identifier for persistence and programmatic access */
  id: string;
  
  /** Human-readable display name shown in preset deck list */
  name: string;
  
  /** Brief description of deck composition and strategy (1-2 sentences) */
  description: string;
  
  /** Array of card identifiers using existing Card type */
  cards: Card[];
}
```

**Constraints**:
- `id`: Must be unique across all preset decks, kebab-case format (e.g., 'starter-deck')
- `name`: Max 50 characters, non-empty
- `description`: Max 200 characters, non-empty
- `cards`: Must contain at least 1 card, all cards must be valid Card type strings

**Lifecycle**: Immutable after definition (managed in code, no runtime modifications)

**Storage**: Defined in `src/lib/presetDecks.ts` as TypeScript constant

---

### DeckSource

Enumeration tracking where the current deck configuration originated.

```typescript
export type DeckSource = 'preset' | 'custom' | 'default';
```

**Values**:
- `'preset'`: Deck loaded from preset deck selection
- `'custom'`: Deck loaded from JSON override
- `'default'`: Initial default deck (no user action)

**Usage**: Added to `DeckState` to enable UI indicators showing active deck source

---

## Type Extensions

### DeckState (Extended)

Extends existing `DeckState` interface with preset deck tracking.

```typescript
export interface DeckState {
  // ... existing fields ...
  
  /** 
   * Identifies the source of the current deck configuration
   * Used for UI indicators and state management decisions
   */
  deckSource: DeckSource;
  
  /**
   * ID of currently active preset deck (null if using custom/default)
   * Used for persisting user's preset deck selection
   */
  activePresetId: string | null;
}
```

**Migration**: Existing `DeckState` objects will default to:
- `deckSource: 'default'`
- `activePresetId: null`

---

### DeckAction (Extended)

Adds new action for loading preset decks.

```typescript
export type DeckAction =
  | { type: 'LOAD_PRESET_DECK'; payload: { presetId: string } }
  // ... existing action types ...
```

**Action Behavior**:
- Looks up preset deck by ID from `PRESET_DECKS` array
- Validates preset deck structure
- Rebuilds entire deck state (similar to `APPLY_JSON_OVERRIDE`)
- Sets `deckSource: 'preset'` and `activePresetId: presetId`
- Triggers persistence of both deck state AND active preset ID

**Side Effects**:
- When `APPLY_JSON_OVERRIDE` fires: Clear `activePresetId` to null, set `deckSource: 'custom'`
- When `RESET` fires: Clear `activePresetId` to null, set `deckSource: 'default'`

---

## Validation Model

### PresetDeckValidationResult

Result object returned by preset deck validation.

```typescript
export interface PresetDeckValidationResult {
  /** Whether the preset deck passed all validation checks */
  isValid: boolean;
  
  /** Array of error messages (empty if isValid is true) */
  errors: string[];
  
  /** The preset deck being validated (for context) */
  deck: PresetDeck;
}
```

**Validation Rules** (enforced by `presetDeckValidator.ts`):
1. `id` exists, is non-empty string
2. `name` exists, is non-empty string, length ≤ 50
3. `description` exists, is non-empty string, length ≤ 200
4. `cards` exists, is array, length ≥ 1
5. All cards in `cards` array are non-empty strings
6. Deck structure can initialize valid `DeckState` (reuses existing validator)

---

## Persistence Model

### Active Preset ID Persistence

**Storage Key**: `deck-builder:activePresetId`

**Stored Value**: Plain string (preset deck ID) or null

**Persistence Timing**:
- **Save**: Immediately after successful `LOAD_PRESET_DECK` action
- **Clear**: When `APPLY_JSON_OVERRIDE` or `RESET` actions fire
- **Load**: During app initialization, before first render

**Restoration Logic**:
```typescript
function restoreActivePreset(): void {
  const presetId = loadActivePresetId();
  
  if (presetId === null) {
    // No active preset - use default initialization
    return;
  }
  
  const preset = PRESET_DECKS.find(d => d.id === presetId);
  
  if (preset === undefined) {
    // Preset no longer exists (removed in code update)
    clearActivePresetId();
    return;
  }
  
  const validation = validatePresetDeck(preset);
  
  if (!validation.isValid) {
    // Preset became invalid (should not happen with build validation)
    console.error('Restored preset deck failed validation:', validation.errors);
    clearActivePresetId();
    return;
  }
  
  // Load the preset deck
  dispatch({ type: 'LOAD_PRESET_DECK', payload: { presetId } });
}
```

**Interaction with Deck State Persistence**:
- Both systems operate independently
- Deck state persistence saves full game state
- Preset ID persistence saves only user's preset selection
- On restore: If preset ID exists, it takes precedence and reloads the preset deck

---

## Relationships

```
┌─────────────────┐
│ PRESET_DECKS    │ (code-managed constant array)
│ PresetDeck[]    │
└────────┬────────┘
         │
         │ referenced by
         ▼
┌─────────────────┐
│ DeckState       │
│ ├─ activePresetId: string | null
│ └─ deckSource: DeckSource
└────────┬────────┘
         │
         │ persisted via
         ▼
┌─────────────────┐
│ localStorage    │
│ ├─ deck-builder:state (full DeckState)
│ └─ deck-builder:activePresetId (ID only)
└─────────────────┘

┌─────────────────┐
│ User Action     │ (clicks preset in UI)
└────────┬────────┘
         │
         │ dispatches
         ▼
┌─────────────────┐
│ LOAD_PRESET_DECK│ (DeckAction)
│ payload: { presetId }
└────────┬────────┘
         │
         │ triggers
         ▼
┌─────────────────┐
│ deckReducer     │
│ ├─ Looks up preset from PRESET_DECKS
│ ├─ Validates preset deck
│ ├─ Rebuilds deck state
│ └─ Updates deckSource + activePresetId
└────────┬────────┘
         │
         │ triggers (side effect)
         ▼
┌─────────────────┐
│ Persistence     │
│ ├─ Save deck state to localStorage
│ └─ Save active preset ID to localStorage
└─────────────────┘
```

## Data Flow Examples

### Example 1: User Selects Preset Deck

1. User clicks "Starter Deck" in `PresetDeckSelector` component
2. Component calls `loadPresetDeck('starter-deck')` from `useDeckState()`
3. Hook dispatches `{ type: 'LOAD_PRESET_DECK', payload: { presetId: 'starter-deck' } }`
4. Reducer:
   - Finds preset deck with ID 'starter-deck' in `PRESET_DECKS`
   - Validates preset deck structure
   - Initializes new deck state with preset's cards
   - Sets `deckSource: 'preset'`, `activePresetId: 'starter-deck'`
5. Persistence hook (`useDeckStatePersistence`) saves state to localStorage
6. Separate persistence call saves `'starter-deck'` to `activePresetId` key
7. UI updates to show active preset indicator

### Example 2: User Switches to JSON Override

1. User pastes custom JSON into `JsonOverride` component
2. Component calls `applyJsonOverride(jsonString)` from `useDeckState()`
3. Hook dispatches `{ type: 'APPLY_JSON_OVERRIDE', payload: jsonString }`
4. Reducer:
   - Parses and validates JSON
   - Rebuilds deck state with custom cards
   - Sets `deckSource: 'custom'`, `activePresetId: null`
5. Persistence saves updated state (with `activePresetId: null`)
6. Separate persistence call clears `activePresetId` from localStorage
7. UI updates to show no active preset

### Example 3: App Initialization with Saved Preset

1. User opens app (browser loads React application)
2. `useDeckState()` hook initializes with lazy initializer
3. Initializer calls `loadActivePresetId()` → Returns `'starter-deck'`
4. Initializer finds preset deck with ID 'starter-deck'
5. Initializer validates preset deck (passes)
6. Initializer returns `DeckState` with preset deck loaded
7. Component renders with preset deck active

### Example 4: Saved Preset No Longer Exists

1. User opens app after code update removed their saved preset
2. `useDeckState()` lazy initializer calls `loadActivePresetId()` → Returns `'old-preset-id'`
3. Initializer looks up preset with ID 'old-preset-id' → Not found
4. Initializer calls `clearActivePresetId()` (cleans up invalid reference)
5. Initializer falls back to default initialization (empty preset selection)
6. User sees no active preset, can select from current available presets

## Initial Preset Deck

**ID**: `starter-deck`

**Name**: Starter Deck

**Description**: A balanced deck for learning the game mechanics with 20 cards.

**Cards**: Array of 20 cards with variety for demonstrating all game features (draw, discard, play order, reset).

```typescript
{
  id: 'starter-deck',
  name: 'Starter Deck',
  description: 'A balanced deck for learning the game mechanics with 20 cards.',
  cards: [
    'Card 1', 'Card 1', 'Card 1',
    'Card 2', 'Card 2', 'Card 2',
    'Card 3', 'Card 3', 'Card 3',
    'Card 4', 'Card 4',
    'Card 5', 'Card 5',
    'Card 6', 'Card 6',
    'Card 7', 'Card 7',
    'Card 8',
    'Card 9',
    'Card 10',
  ]
}
```

**Rationale**: 
- 20 cards allows multiple draw-discard-play cycles
- Variety (10 unique cards) demonstrates discard choices and play order strategies
- Duplicates show shuffling and draw mechanics clearly
- Size balances between too small (boring) and too large (overwhelming for learning)
