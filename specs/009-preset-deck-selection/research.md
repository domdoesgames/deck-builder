# Research: Preset Deck Selection

**Feature**: `009-preset-deck-selection`  
**Phase**: 0 (Research & Design)  
**Date**: 2025-11-19

## Research Questions

### Q1: How should preset deck data be structured and stored in code?

**Context**: Preset decks need to be managed as code-based data structures, not external files.

**Options Evaluated**:
1. **TypeScript constant array** - Simple array of preset deck objects
2. **Separate JSON files imported at compile-time** - Would be bundled by Vite
3. **Registry pattern with registration functions** - Over-engineered for initial needs

**Decision**: Option 1 - TypeScript constant array exported from `src/lib/presetDecks.ts`

**Rationale**:
- Simplest approach that meets all requirements
- Type-safe at compile time using TypeScript interfaces
- Direct code management (no external file loading)
- Easy to extend (just add objects to the array)
- Aligns with existing codebase patterns (see `src/lib/constants.ts`)

**Example Structure**:
```typescript
export interface PresetDeck {
  id: string;              // Unique identifier for persistence
  name: string;            // Display name
  description: string;     // Short description for UI
  cards: Card[];           // Card array using existing Card type
}

export const PRESET_DECKS: PresetDeck[] = [
  {
    id: 'starter-deck',
    name: 'Starter Deck',
    description: 'A balanced deck for learning the game mechanics',
    cards: ['Card 1', 'Card 2', 'Card 3', /* ... */]
  }
];
```

---

### Q2: How should preset deck selection integrate with existing deck state management?

**Context**: The app already has `useDeckState()` hook with `applyJsonOverride()` for custom decks. Need to determine how preset decks fit into this architecture.

**Existing State Flow**:
1. `useDeckState()` uses `deckReducer` for state management
2. `APPLY_JSON_OVERRIDE` action accepts JSON string and rebuilds deck state
3. `persistenceManager.ts` handles localStorage save/restore
4. `stateValidator.ts` validates deck structure

**Integration Points**:
- **Option A**: Reuse `APPLY_JSON_OVERRIDE` action (convert preset deck to JSON string)
- **Option B**: Add new `LOAD_PRESET_DECK` action that directly accepts deck data
- **Option C**: Create separate preset deck reducer

**Decision**: Option B - Add new `LOAD_PRESET_DECK` action to `deckReducer`

**Rationale**:
- Clearer separation of concerns (preset vs custom JSON)
- Avoids unnecessary JSON serialization/deserialization
- Easier to track which source loaded the deck (for UI indicators)
- Better error messages specific to preset deck loading
- More efficient (direct data vs string parsing)

**Required Changes**:
- Add `LOAD_PRESET_DECK` action type to `DeckAction` union in `types.ts`
- Add handler in `deckReducer.ts` similar to `APPLY_JSON_OVERRIDE`
- Add `loadPresetDeck(presetId: string)` method to `useDeckState()` hook
- Store `activeDeckSource: 'preset' | 'custom' | 'default'` in DeckState for UI indicators

---

### Q3: How should preset deck selection state be persisted?

**Context**: User's selected preset deck should be remembered across browser sessions (FR-014, FR-015).

**Persistence Strategy**:
- What to persist: Preset deck ID only (not entire deck data)
- Where: localStorage key `deck-builder:activePresetId`
- When to restore: On app initialization before first render
- Fallback: If preset ID not found/invalid, show no active preset

**Implementation Pattern** (following existing `persistenceManager.ts` pattern):
```typescript
// Add to persistenceManager.ts
export function saveActivePresetId(presetId: string | null): void {
  try {
    if (presetId === null) {
      localStorage.removeItem('deck-builder:activePresetId');
    } else {
      localStorage.setItem('deck-builder:activePresetId', presetId);
    }
  } catch (error) {
    // Silent failure - session-only state
  }
}

export function loadActivePresetId(): string | null {
  try {
    return localStorage.getItem('deck-builder:activePresetId');
  } catch (error) {
    return null;
  }
}
```

**Integration with existing persistence**:
- Separate from main deck state persistence (different concern)
- When preset deck loads, update both activePresetId AND deck state
- When JSON override used, clear activePresetId (user switched to custom)
- New hook `usePresetDeckSelection()` manages preset-specific persistence

---

### Q4: How should build-time validation of preset decks work?

**Context**: FR-017 requires GitHub Actions validation to prevent invalid preset decks from being deployed.

**Validation Requirements**:
- Run during `npm run build` or as separate pre-build step
- Check each preset deck against same validation rules as custom JSON decks
- Exit with error code if any preset deck is invalid
- Report which deck(s) failed and why

**Implementation Approach**:

**Option A**: Add validation script to `package.json` scripts, run before build
```json
{
  "scripts": {
    "validate:presets": "tsx scripts/validatePresetDecks.ts",
    "build": "npm run validate:presets && tsc && vite build"
  }
}
```

**Option B**: Add validation as part of CI/CD workflow only (not local builds)

**Decision**: Option A - Validate during every build (local + CI/CD)

**Rationale**:
- Catches errors earlier (local development vs CI failure)
- Consistent behavior across environments
- Fast execution (validation is lightweight)
- Uses existing validation logic from `stateValidator.ts`

**Script Structure** (`scripts/validatePresetDecks.ts`):
```typescript
import { PRESET_DECKS } from '../src/lib/presetDecks';
import { validatePresetDeck } from '../src/lib/presetDeckValidator';

let hasErrors = false;

for (const deck of PRESET_DECKS) {
  const result = validatePresetDeck(deck);
  if (!result.isValid) {
    console.error(`❌ Invalid preset deck: ${deck.id}`);
    result.errors.forEach(err => console.error(`  - ${err}`));
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log(`✅ All ${PRESET_DECKS.length} preset decks are valid`);
```

**GitHub Actions Update** (`.github/workflows/deploy.yml`):
- Build step already runs `npm run build`, which includes validation
- No separate validation step needed

---

### Q5: What runtime validation should happen when loading preset decks?

**Context**: Even with build-time validation, runtime checks provide defense-in-depth (e.g., corrupted bundled code, browser compatibility issues).

**Runtime Validation Strategy**:
- Validate preset deck structure on load (user clicks preset)
- Use same validation logic as build-time (`presetDeckValidator.ts`)
- If invalid: Show error, hide from list (FR-009 option A)
- Log error details to console for debugging

**Validation Checks**:
1. Deck object structure (has id, name, description, cards)
2. Cards array is non-empty
3. All cards are valid strings
4. No duplicate instance IDs will be created (handled by existing `cardInstance.ts`)

**Implementation Location**: `src/lib/presetDeckValidator.ts`
```typescript
export function validatePresetDeck(deck: unknown): ValidationResult {
  // Reuse existing validation logic from stateValidator.ts
  // Add preset-specific checks (id, name, description presence)
}
```

**UI Integration**: `PresetDeckSelector` component
- Filter out invalid presets before rendering list
- Show console warning for filtered decks (for developers)
- Show empty state message if all presets filtered out

---

## Technical Unknowns Resolved

All technical questions for implementation have been resolved:

1. ✅ **Data structure**: TypeScript constant array in `presetDecks.ts`
2. ✅ **State integration**: New `LOAD_PRESET_DECK` action in reducer
3. ✅ **Persistence**: Separate localStorage key for active preset ID
4. ✅ **Build validation**: Pre-build script using existing validation logic
5. ✅ **Runtime validation**: Filter invalid presets, reuse validator logic

## Dependencies Confirmed

- **No new npm packages required** - Feature uses existing dependencies
- Validation script may need `tsx` or `ts-node` for execution (already in project via Vite/TypeScript setup)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| localStorage quota exceeded when persisting preset ID | Low | Low | Silent fallback to session-only (pattern already established) |
| Invalid preset reaches production despite validation | Very Low | Medium | Runtime validation filters invalid presets (defense-in-depth) |
| Preset deck conflicts with restored custom deck state | Low | Medium | Clear activePresetId when APPLY_JSON_OVERRIDE used; explicit source tracking |
| User confusion between preset vs custom decks | Medium | Low | Clear UI indicators, separate sections in settings panel |

## Next Phase

Phase 1 (Design) will produce:
- `data-model.md` - Entity definitions and relationships
- `quickstart.md` - API surface and integration examples
- `contracts/*.contract.md` - Component and hook contracts
