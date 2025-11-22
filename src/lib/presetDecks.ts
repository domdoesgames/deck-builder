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
    description: 'Basic starter deck for witch team in Broom Broom',
    cards: [
      'Maiden Move 1', 'Mother Move 1', 'Crone Move 1',
      'Maiden Move 1', 'Mother Move 1', 'Crone Move 1',
      'Maiden Move 2', 'Mother Move 2', 'Crone Move 2',
      'Maiden Move 3', 'Mother Deflect', 'Crone Disorient',
    ]
  }
];
