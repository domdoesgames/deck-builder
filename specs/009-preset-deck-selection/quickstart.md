# Quickstart: Preset Deck Selection

**Feature**: `009-preset-deck-selection`  
**Phase**: 1 (Design)  
**Date**: 2025-11-19

## API Surface

### 1. Preset Deck Data (`src/lib/presetDecks.ts`)

**Export**: Array of pre-configured decks

```typescript
import { PRESET_DECKS } from '@/lib/presetDecks';

// Access all available preset decks
const allPresets = PRESET_DECKS;

// Find specific preset by ID
const starterDeck = PRESET_DECKS.find(d => d.id === 'starter-deck');
```

**Type**: `PresetDeck[]`

**Usage**: Import in components that need to display or load preset decks

---

### 2. Deck State Hook (`src/hooks/useDeckState.ts`)

**New Method**: `loadPresetDeck(presetId: string): void`

```typescript
const { loadPresetDeck, state } = useDeckState();

// Load a preset deck by ID
loadPresetDeck('starter-deck');

// Check current deck source
if (state.deckSource === 'preset') {
  console.log(`Active preset: ${state.activePresetId}`);
}
```

**Behavior**:
- Validates preset exists and is valid
- Replaces current deck state with preset deck configuration
- Sets `deckSource` to `'preset'` and `activePresetId` to provided ID
- Triggers persistence to localStorage

**Error Handling**: If preset not found or invalid, dispatches error to `state.error`

---

### 3. Preset Deck Selector Component (`src/components/PresetDeckSelector.tsx`)

**Component**: UI for displaying and selecting preset decks

```typescript
import { PresetDeckSelector } from '@/components/PresetDeckSelector';

function App() {
  const deckState = useDeckState();
  
  return (
    <SettingsPanel error={deckState.state.error}>
      <PresetDeckSelector 
        onSelectPreset={deckState.loadPresetDeck}
        activePresetId={deckState.state.activePresetId}
      />
      {/* Other settings components */}
    </SettingsPanel>
  );
}
```

**Props**:
```typescript
interface PresetDeckSelectorProps {
  /** Callback when user selects a preset deck */
  onSelectPreset: (presetId: string) => void;
  
  /** Currently active preset ID (for highlighting) */
  activePresetId: string | null;
}
```

**Features**:
- Displays list of all valid preset decks
- Expandable sections showing deck details (card composition)
- Visual indicator for currently active preset
- Handles empty state (no presets available)
- Filters out invalid presets at runtime

---

### 4. Preset Deck Validator (`src/lib/presetDeckValidator.ts`)

**Function**: Validate preset deck structure

```typescript
import { validatePresetDeck } from '@/lib/presetDeckValidator';

const result = validatePresetDeck(someDeck);

if (!result.isValid) {
  console.error('Invalid preset deck:', result.errors);
}
```

**Returns**: `PresetDeckValidationResult`

```typescript
interface PresetDeckValidationResult {
  isValid: boolean;
  errors: string[];
  deck: PresetDeck;
}
```

**Usage**:
- Runtime validation in components (filter invalid presets)
- Build-time validation in validation script
- Testing preset deck definitions

---

### 5. Persistence Helpers (`src/lib/persistenceManager.ts`)

**New Functions**:

```typescript
import { 
  saveActivePresetId, 
  loadActivePresetId, 
  clearActivePresetId 
} from '@/lib/persistenceManager';

// Save user's selected preset
saveActivePresetId('starter-deck');

// Load saved preset on app init
const savedPresetId = loadActivePresetId(); // Returns 'starter-deck' | null

// Clear saved preset (when switching to custom deck)
clearActivePresetId();
```

**Behavior**:
- Silent failure on localStorage errors (fallback to session-only state)
- Uses key `deck-builder:activePresetId`
- Separate from main deck state persistence

---

## Integration Examples

### Example 1: Rendering Preset Deck Selector in Settings Panel

```typescript
// src/App.tsx
import { SettingsPanel } from './components/SettingsPanel';
import { PresetDeckSelector } from './components/PresetDeckSelector';
import { JsonOverride } from './components/JsonOverride';
import { useDeckState } from './hooks/useDeckState';

function App() {
  const { state, loadPresetDeck, applyJsonOverride } = useDeckState();
  
  return (
    <div className="app">
      <SettingsPanel error={state.error}>
        {/* New: Preset deck selection section */}
        <section>
          <h3>Preset Decks</h3>
          <PresetDeckSelector 
            onSelectPreset={loadPresetDeck}
            activePresetId={state.activePresetId}
          />
        </section>
        
        {/* Existing: JSON override section */}
        <section>
          <h3>Custom Deck (JSON Override)</h3>
          <JsonOverride onApply={applyJsonOverride} />
        </section>
        
        {/* Existing: Other settings */}
      </SettingsPanel>
      
      {/* Existing: Game UI components */}
    </div>
  );
}
```

---

### Example 2: Creating a New Preset Deck

```typescript
// src/lib/presetDecks.ts
import { PresetDeck } from './types';

export const PRESET_DECKS: PresetDeck[] = [
  // Existing starter deck
  {
    id: 'starter-deck',
    name: 'Starter Deck',
    description: 'A balanced deck for learning the game mechanics with 20 cards.',
    cards: [
      'Card 1', 'Card 1', 'Card 1',
      'Card 2', 'Card 2', 'Card 2',
      // ... more cards
    ]
  },
  
  // New preset deck
  {
    id: 'advanced-strategy',
    name: 'Advanced Strategy Deck',
    description: 'A larger deck with more variety for experienced players (30 cards).',
    cards: [
      'Card 1', 'Card 2', 'Card 3', 'Card 4', 'Card 5',
      'Card 6', 'Card 7', 'Card 8', 'Card 9', 'Card 10',
      // ... 20 more cards for 30 total
    ]
  },
];
```

**Steps to add a new preset deck**:
1. Add new object to `PRESET_DECKS` array
2. Ensure unique `id` (kebab-case)
3. Provide descriptive `name` and `description`
4. Define `cards` array with at least 1 card
5. Run `npm run build` to validate (automatic via build script)
6. Test in UI before committing

---

### Example 3: Handling Preset Deck Load in Reducer

```typescript
// src/state/deckReducer.ts (excerpt)
import { PRESET_DECKS } from '../lib/presetDecks';
import { validatePresetDeck } from '../lib/presetDeckValidator';

function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'LOAD_PRESET_DECK': {
      const { presetId } = action.payload;
      
      // Find preset deck
      const preset = PRESET_DECKS.find(d => d.id === presetId);
      if (!preset) {
        return {
          ...state,
          error: `Preset deck "${presetId}" not found`,
        };
      }
      
      // Validate preset deck
      const validation = validatePresetDeck(preset);
      if (!validation.isValid) {
        return {
          ...state,
          error: `Invalid preset deck: ${validation.errors.join(', ')}`,
        };
      }
      
      // Build new deck state from preset
      return initializeDeckFromCards(preset.cards, state.handSize, state.discardCount, {
        deckSource: 'preset',
        activePresetId: presetId,
      });
    }
    
    case 'APPLY_JSON_OVERRIDE': {
      // When custom JSON loaded, clear active preset
      const newState = parseAndInitializeFromJson(action.payload, state);
      return {
        ...newState,
        deckSource: 'custom',
        activePresetId: null,
      };
    }
    
    case 'RESET': {
      // When reset, clear active preset
      return initializeDefaultDeck({
        deckSource: 'default',
        activePresetId: null,
      });
    }
    
    // ... other cases
  }
}
```

---

### Example 4: Build-Time Validation Script

```typescript
// scripts/validatePresetDecks.ts
import { PRESET_DECKS } from '../src/lib/presetDecks';
import { validatePresetDeck } from '../src/lib/presetDeckValidator';

function main() {
  console.log(`Validating ${PRESET_DECKS.length} preset deck(s)...`);
  
  let hasErrors = false;
  
  for (const deck of PRESET_DECKS) {
    const result = validatePresetDeck(deck);
    
    if (!result.isValid) {
      console.error(`\n❌ Invalid preset deck: "${deck.id}"`);
      result.errors.forEach(err => {
        console.error(`   - ${err}`);
      });
      hasErrors = true;
    } else {
      console.log(`✅ ${deck.id}: Valid (${deck.cards.length} cards)`);
    }
  }
  
  if (hasErrors) {
    console.error('\n❌ Preset deck validation failed!');
    process.exit(1);
  }
  
  console.log(`\n✅ All preset decks are valid!`);
}

main();
```

**Usage**: Runs automatically during `npm run build`

---

### Example 5: Displaying Active Preset Indicator

```typescript
// src/components/DeckControls.tsx (example addition)
import { useDeckState } from '../hooks/useDeckState';

export function DeckControls() {
  const { state, dealNextHand, reset } = useDeckState();
  
  return (
    <div className="deck-controls">
      {state.deckSource === 'preset' && (
        <div className="active-deck-indicator">
          <span className="deck-source-icon">📦</span>
          <span>
            Using preset: {PRESET_DECKS.find(d => d.id === state.activePresetId)?.name}
          </span>
        </div>
      )}
      
      <button onClick={dealNextHand}>Deal Next Hand</button>
      <button onClick={reset}>Reset Deck</button>
    </div>
  );
}
```

---

## Testing Integration

### Contract Test Example

```typescript
// tests/contract/presetDeckContracts.test.ts
import { PRESET_DECKS } from '@/lib/presetDecks';
import { validatePresetDeck } from '@/lib/presetDeckValidator';

describe('Preset Deck Contracts', () => {
  it('all preset decks have required fields', () => {
    PRESET_DECKS.forEach(deck => {
      expect(deck).toHaveProperty('id');
      expect(deck).toHaveProperty('name');
      expect(deck).toHaveProperty('description');
      expect(deck).toHaveProperty('cards');
    });
  });
  
  it('all preset deck IDs are unique', () => {
    const ids = PRESET_DECKS.map(d => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
  
  it('all preset decks pass validation', () => {
    PRESET_DECKS.forEach(deck => {
      const result = validatePresetDeck(deck);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/presetDeckSelection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetDeckSelector } from '@/components/PresetDeckSelector';

describe('Preset Deck Selection Flow', () => {
  it('loads preset deck when user selects it', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <PresetDeckSelector 
        onSelectPreset={mockOnSelect}
        activePresetId={null}
      />
    );
    
    // Find starter deck in list
    const starterDeck = screen.getByText(/Starter Deck/i);
    
    // Click to select
    fireEvent.click(starterDeck);
    
    // Verify callback called with correct ID
    expect(mockOnSelect).toHaveBeenCalledWith('starter-deck');
  });
});
```

---

## Migration Path

### For Existing Users

**No breaking changes** - existing functionality remains intact:
1. Users with saved custom JSON decks continue to work normally
2. Default deck initialization unchanged if no preset selected
3. All existing features (draw, discard, play order, reset) work identically

### For Developers Adding Preset Decks

**Simple addition process**:
1. Add new object to `PRESET_DECKS` array in `presetDecks.ts`
2. Run `npm run build` (validates automatically)
3. Test in local dev environment
4. Commit and push (CI/CD validates before deploy)

**No architectural changes needed** - system designed for extensibility from day one.
