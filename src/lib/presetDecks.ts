/**
 * Preset Deck Definitions (Feature 009)
 * 
 * Code-managed preset decks available for selection in the settings panel.
 * All preset decks are validated at build time via scripts/validate-presets.ts
 */

import { PresetDeck } from './types';

/**
 * Array of all available preset decks
 * 
 * To add a new preset deck:
 * 1. Add new PresetDeck object to this array
 * 2. Ensure unique `id` (kebab-case format)
 * 3. Provide descriptive `name` (max 50 chars)
 * 4. Provide `description` (max 200 chars)
 * 5. Define `cards` array (minimum 1 card)
 * 6. Run `npm run build` to validate automatically
 */
export const PRESET_DECKS: PresetDeck[] = [
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
];
