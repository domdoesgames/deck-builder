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
  
  // Rule 1: Type check
  if (typeof deck !== 'object' || deck === null || Array.isArray(deck)) {
    return {
      isValid: false,
      errors: ['Preset deck must be an object'],
      deck: deck as PresetDeck
    };
  }
  
  // Cast to record for field access
  const { id, name, description, cards } = deck as Record<string, unknown>;
  
  // Rule 2: ID field validation
  if (typeof id !== 'string' || id.trim() === '') {
    errors.push('Preset deck must have a non-empty "id" field');
  }
  
  if (typeof id === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errors.push('Preset deck "id" must be in kebab-case format (e.g., "starter-deck")');
  }
  
  // Rule 3: Name field validation
  if (typeof name !== 'string' || name.trim() === '') {
    errors.push('Preset deck must have a non-empty "name" field');
  }
  
  if (typeof name === 'string' && name.length > 50) {
    errors.push(`Preset deck "name" must be 50 characters or less (current: ${name.length})`);
  }
  
  // Rule 4: Description field validation
  if (typeof description !== 'string' || description.trim() === '') {
    errors.push('Preset deck must have a non-empty "description" field');
  }
  
  if (typeof description === 'string' && description.length > 200) {
    errors.push(`Preset deck "description" must be 200 characters or less (current: ${description.length})`);
  }
  
  // Rule 5: Cards array validation
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
  
  // Rule 6: Deck state initialization check
  // Only run if basic structure checks pass
  if (errors.length === 0) {
    try {
      // Note: Full state validation requires helpers from deckReducer.
      // For now, we perform basic structural validation.
      // This will be enhanced if initializeDeckFromCards is exported.
      
      // Basic checks that cards are valid for creating a deck
      const cardArray = cards as string[];
      
      // Verify cards can be processed (no null/undefined sneaking through)
      if (cardArray.some(c => c == null || typeof c !== 'string')) {
        errors.push('Preset deck contains invalid card values');
      }
    } catch (error) {
      errors.push(`Preset deck caused initialization error: ${(error as Error).message}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    deck: deck as PresetDeck
  };
}
