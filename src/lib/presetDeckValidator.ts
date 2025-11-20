/**
 * Preset Deck Validator (Feature 009)
 * 
 * Runtime and build-time validation for preset deck definitions.
 * Ensures all preset decks meet structural requirements before deployment.
 */

import { PresetDeck } from './types';

/**
 * Result object returned by preset deck validation
 */
export interface PresetDeckValidationResult {
  /** Whether the preset deck passed all validation checks */
  isValid: boolean;
  
  /** Array of error messages (empty if isValid is true) */
  errors: string[];
  
  /** The preset deck being validated (for context) */
  deck: PresetDeck;
}

/**
 * Validates a preset deck against all structural requirements
 * 
 * Validation Rules:
 * 1. Type check - must be object
 * 2. `id` exists, is non-empty string, kebab-case format
 * 3. `name` exists, is non-empty string, length ≤ 50
 * 4. `description` exists, is non-empty string, length ≤ 200
 * 5. `cards` exists, is array, length ≥ 1, all elements are non-empty strings
 * 6. Deck structure can initialize valid DeckState (not yet implemented - requires helper function)
 * 
 * @param deck - Preset deck to validate
 * @returns Validation result with isValid flag and error array
 */
export function validatePresetDeck(deck: unknown): PresetDeckValidationResult {
  const errors: string[] = [];
  
  // Rule 1: Type check - must be a plain object
  // We validate in this order (type check first) to prevent runtime errors when accessing properties.
  // Early return on type failure since subsequent checks require object structure.
  if (typeof deck !== 'object' || deck === null || Array.isArray(deck)) {
    return {
      isValid: false,
      errors: ['Preset deck must be an object'],
      deck: deck as PresetDeck
    };
  }
  
  // Cast to record for safe field access
  // This allows us to check properties without TypeScript errors on unknown type
  const { id, name, description, cards } = deck as Record<string, unknown>;
  
  // Rule 2: ID field validation
  // The ID is used as a unique identifier for localStorage keys and must be URL-safe.
  // We enforce kebab-case to ensure consistency across the codebase and prevent issues
  // with special characters in storage keys or future URL routing.
  if (typeof id !== 'string' || id.trim() === '') {
    errors.push('Preset deck must have a non-empty "id" field');
  }
  
  // Kebab-case regex: starts with lowercase letter or digit, allows hyphens between segments
  // Pattern: ^[a-z0-9]+(-[a-z0-9]+)*$ ensures no trailing/leading hyphens or consecutive hyphens
  if (typeof id === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errors.push('Preset deck "id" must be in kebab-case format (e.g., "starter-deck")');
  }
  
  // Rule 3: Name field validation
  // The name is displayed in UI (PresetDeckSelector), so we enforce length limits
  // to prevent layout overflow and ensure good UX across different screen sizes.
  if (typeof name !== 'string' || name.trim() === '') {
    errors.push('Preset deck must have a non-empty "name" field');
  }
  
  // 50 character limit chosen to fit comfortably in mobile viewports (320px min)
  if (typeof name === 'string' && name.length > 50) {
    errors.push(`Preset deck "name" must be 50 characters or less (current: ${name.length})`);
  }
  
  // Rule 4: Description field validation
  // Description provides context in the preset selector UI. The 200 character limit
  // ensures descriptions are concise while providing enough detail for users to make
  // informed choices. Longer descriptions could cause UI scroll issues.
  if (typeof description !== 'string' || description.trim() === '') {
    errors.push('Preset deck must have a non-empty "description" field');
  }
  
  // 200 character limit balances informativeness with UI constraints
  if (typeof description === 'string' && description.length > 200) {
    errors.push(`Preset deck "description" must be 200 characters or less (current: ${description.length})`);
  }
  
  // Rule 5: Cards array validation
  // The cards array is the core of the preset deck - it defines what cards are included.
  // Each card string becomes a card instance in the deck state.
  if (!Array.isArray(cards)) {
    errors.push('Preset deck must have a "cards" field that is an array');
  } else {
    // At least one card is required for a functional deck
    // An empty deck would break the game mechanics (no cards to draw/play)
    if (cards.length === 0) {
      errors.push('Preset deck "cards" array must contain at least 1 card');
    }
    
    // Each card must be a non-empty string (card names/identifiers)
    // Empty strings would create invalid card instances that break rendering and state logic
    cards.forEach((card, index) => {
      if (typeof card !== 'string' || card.trim() === '') {
        errors.push(`Preset deck card at index ${index} must be a non-empty string`);
      }
    });
  }
  
  // Rule 6: Deck state initialization check
  // Only run if basic structure checks pass to avoid cascading errors.
  // This catch-all validation ensures the deck can be safely used to initialize DeckState.
  if (errors.length === 0) {
    try {
      // Note: Full state validation would require importing and calling initializeDeckFromCards
      // from deckReducer. However, to avoid circular dependencies and keep the validator
      // lightweight, we perform basic structural validation here.
      // 
      // Future enhancement: If deck initialization logic becomes more complex, we could
      // export a validation-specific helper from deckReducer.
      
      // Basic check: ensure cards array contains only valid values
      const cardArray = cards as string[];
      
      // Edge case: TypeScript type guards don't guarantee runtime safety.
      // This catches any null/undefined values that might slip through due to type assertions
      // or dynamic data loading (e.g., from JSON parsing errors).
      if (cardArray.some(c => c == null || typeof c !== 'string')) {
        errors.push('Preset deck contains invalid card values');
      }
    } catch (error) {
      // Catch unexpected errors during validation checks (e.g., property access errors)
      // This ensures validator doesn't crash the build/runtime even with malformed data
      errors.push(`Preset deck caused initialization error: ${(error as Error).message}`);
    }
  }
  
  // Return aggregated validation result
  // If any errors accumulated, isValid will be false
  return {
    isValid: errors.length === 0,
    errors,
    deck: deck as PresetDeck
  };
}
