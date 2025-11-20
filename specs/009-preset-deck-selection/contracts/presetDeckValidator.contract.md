# Contract: Preset Deck Validator

**Module**: `presetDeckValidator`  
**File**: `src/lib/presetDeckValidator.ts`  
**Purpose**: Runtime validation of preset deck structure and content

## Interface Contract

### Primary Function

```typescript
/**
 * Validates a preset deck's structure and content
 * 
 * Checks:
 * - Required fields presence (id, name, description, cards)
 * - Field types and constraints
 * - Cards array validity
 * - Deck can initialize valid DeckState
 * 
 * @param deck - Preset deck object to validate (unknown type for safety)
 * @returns Validation result with isValid flag and error messages
 */
export function validatePresetDeck(deck: unknown): PresetDeckValidationResult;
```

### Return Type

```typescript
export interface PresetDeckValidationResult {
  /** True if deck passes all validation checks */
  isValid: boolean;
  
  /** Array of human-readable error messages (empty if isValid is true) */
  errors: string[];
  
  /** The deck being validated (typed as PresetDeck if valid) */
  deck: PresetDeck | unknown;
}
```

---

## Validation Rules Contract

### Rule 1: Type Check

**MUST** verify `deck` is an object (not null, array, primitive).

**Implementation**:
```typescript
if (typeof deck !== 'object' || deck === null || Array.isArray(deck)) {
  return {
    isValid: false,
    errors: ['Preset deck must be an object'],
    deck,
  };
}
```

**Error Message**: `"Preset deck must be an object"`

---

### Rule 2: ID Field Validation

**MUST** verify:
- `id` field exists
- `id` is a non-empty string
- `id` follows kebab-case format (lowercase, hyphens, no spaces)

**Implementation**:
```typescript
const { id, name, description, cards } = deck as Record<string, unknown>;

if (typeof id !== 'string' || id.trim() === '') {
  errors.push('Preset deck must have a non-empty "id" field');
}

if (typeof id === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  errors.push('Preset deck "id" must be in kebab-case format (e.g., "starter-deck")');
}
```

**Error Messages**:
- `"Preset deck must have a non-empty 'id' field"`
- `"Preset deck 'id' must be in kebab-case format (e.g., 'starter-deck')"`

---

### Rule 3: Name Field Validation

**MUST** verify:
- `name` field exists
- `name` is a non-empty string
- `name` length ≤ 50 characters

**Implementation**:
```typescript
if (typeof name !== 'string' || name.trim() === '') {
  errors.push('Preset deck must have a non-empty "name" field');
}

if (typeof name === 'string' && name.length > 50) {
  errors.push('Preset deck "name" must be 50 characters or less (current: ' + name.length + ')');
}
```

**Error Messages**:
- `"Preset deck must have a non-empty 'name' field"`
- `"Preset deck 'name' must be 50 characters or less (current: X)"`

---

### Rule 4: Description Field Validation

**MUST** verify:
- `description` field exists
- `description` is a non-empty string
- `description` length ≤ 200 characters

**Implementation**:
```typescript
if (typeof description !== 'string' || description.trim() === '') {
  errors.push('Preset deck must have a non-empty "description" field');
}

if (typeof description === 'string' && description.length > 200) {
  errors.push('Preset deck "description" must be 200 characters or less (current: ' + description.length + ')');
}
```

**Error Messages**:
- `"Preset deck must have a non-empty 'description' field"`
- `"Preset deck 'description' must be 200 characters or less (current: X)"`

---

### Rule 5: Cards Array Validation

**MUST** verify:
- `cards` field exists
- `cards` is an array
- `cards` array is non-empty (length ≥ 1)
- All elements in `cards` array are non-empty strings

**Implementation**:
```typescript
if (!Array.isArray(cards)) {
  errors.push('Preset deck must have a "cards" field that is an array');
} else {
  if (cards.length === 0) {
    errors.push('Preset deck "cards" array must contain at least 1 card');
  }
  
  cards.forEach((card, index) => {
    if (typeof card !== 'string' || card.trim() === '') {
      errors.push(`Preset deck card at index ${index} must be a non-empty string`);
    }
  });
}
```

**Error Messages**:
- `"Preset deck must have a 'cards' field that is an array"`
- `"Preset deck 'cards' array must contain at least 1 card"`
- `"Preset deck card at index X must be a non-empty string"`

---

### Rule 6: Deck State Initialization Check

**MUST** verify preset deck can initialize a valid `DeckState`.

**Implementation**: Reuse existing deck validation logic.

```typescript
// Only if basic structure checks pass
if (errors.length === 0) {
  try {
    // Attempt to create a temporary deck state using preset's cards
    const testState = initializeDeckFromCards(
      cards as string[], 
      5,  // Default handSize
      2   // Default discardCount
    );
    
    // Use existing state validator from Feature 005
    const stateValidation = validateDeckState(testState);
    
    if (!stateValidation.isValid) {
      errors.push('Preset deck failed state validation: ' + stateValidation.errors.join(', '));
    }
  } catch (error) {
    errors.push('Preset deck caused initialization error: ' + (error as Error).message);
  }
}
```

**Error Messages**:
- `"Preset deck failed state validation: {details}"`
- `"Preset deck caused initialization error: {details}"`

**Note**: This rule only runs if basic structure checks (Rules 1-5) pass.

---

## Behavior Contract

### Validation Order

**MUST** execute rules in this order:
1. Type check (Rule 1)
2. Field presence and type checks (Rules 2-5)
3. State initialization check (Rule 6) - only if no errors from 1-5

**Rationale**: Fail fast on structural issues before attempting expensive initialization.

---

### Error Accumulation

**MUST** collect ALL errors, not stop at first error.

**Rationale**: Provides complete feedback for debugging.

**Exception**: Rule 6 only runs if Rules 1-5 pass (prevent cascading errors).

---

### Success Case

**WHEN** no errors found:
- Return `{ isValid: true, errors: [], deck }`
- `deck` typed as `PresetDeck` (safe to use)

---

### Failure Case

**WHEN** any errors found:
- Return `{ isValid: false, errors: [...messages], deck }`
- `deck` remains `unknown` type (unsafe to use)

---

## Usage Contract

### Build-Time Validation (Script)

```typescript
// scripts/validatePresetDecks.ts
import { PRESET_DECKS } from '../src/lib/presetDecks';
import { validatePresetDeck } from '../src/lib/presetDeckValidator';

for (const deck of PRESET_DECKS) {
  const result = validatePresetDeck(deck);
  
  if (!result.isValid) {
    console.error(`Invalid preset: ${deck.id}`);
    result.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}
```

**Exit Code**:
- 0 if all presets valid
- 1 if any preset invalid

---

### Runtime Validation (Component)

```typescript
// src/components/PresetDeckSelector.tsx
import { PRESET_DECKS } from '@/lib/presetDecks';
import { validatePresetDeck } from '@/lib/presetDeckValidator';

export function PresetDeckSelector() {
  const validPresets = useMemo(() => {
    return PRESET_DECKS.filter(deck => {
      const result = validatePresetDeck(deck);
      
      if (!result.isValid) {
        console.warn('Invalid preset filtered:', deck.id, result.errors);
      }
      
      return result.isValid;
    });
  }, []);
  
  // Render validPresets only
}
```

**Behavior**: Invalid presets filtered out, warnings logged.

---

### Reducer Validation (Action Handler)

```typescript
// src/state/deckReducer.ts
case 'LOAD_PRESET_DECK': {
  const preset = PRESET_DECKS.find(d => d.id === action.payload.presetId);
  
  if (!preset) {
    return { ...state, error: 'Preset not found' };
  }
  
  const validation = validatePresetDeck(preset);
  
  if (!validation.isValid) {
    return { 
      ...state, 
      error: `Invalid preset: ${validation.errors.join(', ')}` 
    };
  }
  
  // Proceed with loading
}
```

**Behavior**: Reject invalid presets, report error to user.

---

## Testing Contract

### Unit Test Requirements

1. **Valid preset deck passes validation**
   - Input: Well-formed preset deck
   - Expect: `{ isValid: true, errors: [] }`

2. **Missing id field fails validation**
   - Input: Deck without `id` field
   - Expect: `isValid: false`, error message about missing `id`

3. **Empty name field fails validation**
   - Input: Deck with `name: ''`
   - Expect: `isValid: false`, error message about empty `name`

4. **Description too long fails validation**
   - Input: Deck with 201-character description
   - Expect: `isValid: false`, error message about length

5. **Empty cards array fails validation**
   - Input: Deck with `cards: []`
   - Expect: `isValid: false`, error message about empty cards

6. **Non-string card fails validation**
   - Input: Deck with `cards: ['Card 1', 123, 'Card 3']`
   - Expect: `isValid: false`, error message about card at index 1

7. **Non-kebab-case id fails validation**
   - Input: Deck with `id: 'Starter Deck'` (spaces/capitals)
   - Expect: `isValid: false`, error message about kebab-case

8. **Multiple errors accumulated**
   - Input: Deck missing `name` and with empty `cards`
   - Expect: `isValid: false`, `errors.length >= 2`

9. **Null input fails validation**
   - Input: `null`
   - Expect: `isValid: false`, error about object type

10. **Array input fails validation**
    - Input: `[]`
    - Expect: `isValid: false`, error about object type

---

## Dependencies

### Internal Dependencies

- `PresetDeck` type from `@/lib/types`
- `PresetDeckValidationResult` type from `@/lib/types` (or defined in this module)
- `initializeDeckFromCards` helper from `@/state/deckReducer` (for Rule 6)
- `validateDeckState` from `@/lib/stateValidator` (Feature 005, for Rule 6)

### External Dependencies

- None (pure JavaScript/TypeScript)

---

## Performance Contract

**Time Complexity**: O(n) where n = number of cards in preset deck

**Space Complexity**: O(k) where k = number of validation errors (typically 0-5)

**Acceptable Use Cases**:
- Build-time validation: Run once per preset deck during build (<10ms per deck)
- Runtime validation: Run once per preset deck on component mount (<5ms per deck)
- Reducer validation: Run on user action (interactive, <10ms)

**NOT Acceptable**:
- Validating on every render (use `useMemo` to cache)
- Validating in tight loops (batch validation calls)

---

## Error Message Standards

### Format

- Start with context: "Preset deck {field}..."
- Use double quotes for field names: `"id"`, `"name"`
- Include current values for length violations: `"(current: 75)"`
- Use examples for format requirements: `"(e.g., 'starter-deck')"`

### Tone

- Descriptive (explain what's wrong)
- Actionable (clear what needs fixing)
- Consistent (same phrasing for similar issues)

### Examples

✅ Good: `"Preset deck 'name' must be 50 characters or less (current: 75)"`
❌ Bad: `"Name too long"`

✅ Good: `"Preset deck card at index 3 must be a non-empty string"`
❌ Bad: `"Invalid card"`

---

## Extensibility Contract

### Adding New Validation Rules

**When adding new rules**:
1. Add rule function to module
2. Call from `validatePresetDeck` in logical order
3. Update error accumulation logic
4. Add corresponding unit tests
5. Update this contract document

**Example Structure**:
```typescript
function validateCardUniqueness(cards: string[], errors: string[]): void {
  // New rule: warn if all cards identical
  const uniqueCards = new Set(cards);
  if (uniqueCards.size === 1) {
    errors.push('Preset deck contains only one unique card (may be intentional)');
  }
}
```

### Backward Compatibility

**MUST** maintain for existing valid preset decks:
- Existing valid decks continue to pass validation
- Error messages can improve (more specific) but not break existing checks

**MAY** change without breaking:
- Error message wording (as long as meaning preserved)
- Validation performance optimizations
- Additional warnings (non-fatal)

**REQUIRES** major version bump:
- Adding new required fields
- Making existing rules stricter
- Removing validation rules

---

## Version

**Contract Version**: 1.0.0  
**Created**: 2025-11-19  
**Status**: Draft (Phase 1)

**Breaking Changes Policy**: Changes to validation rules or return interface require MAJOR version bump.
