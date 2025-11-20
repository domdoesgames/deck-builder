/**
 * Core types for Deck Mechanics (Feature 001 & 003)
 * Based on specs/001-deck-mechanics/contracts/deck-contracts.md
 * and specs/003-card-discard-mechanic/contracts/*.contract.md
 */

/**
 * Represents a card's base data (e.g., "Card 1", "Card 2")
 */
export type Card = string;

/**
 * Represents a unique instance of a card in the hand.
 * Each card dealt gets a unique instanceId for selection tracking.
 */
export interface CardInstance {
  instanceId: string;
  card: Card;
}

/**
 * Discard phase state
 */
export interface DiscardPhase {
  active: boolean;
  remainingDiscards: number;
}

export interface DeckState {
  drawPile: string[]
  discardPile: string[]
  hand: string[]
  turnNumber: number
  handSize: number
  discardCount: number
  warning: string | null
  error: string | null
  isDealing: boolean
  // Feature 003: Card discard mechanic extensions
  handCards: CardInstance[]
  selectedCardIds: Set<string>
  discardPhase: DiscardPhase
  // Feature 004: Card play order extensions
  playOrderSequence: string[]   // Ordered array of CardInstance.instanceIds
  playOrderLocked: boolean       // Whether the order is permanently locked
  planningPhase: boolean         // True during Planning, false otherwise
  // Feature 009: Preset deck selection extensions
  deckSource: DeckSource        // Where the current deck configuration originated
  activePresetId: string | null // ID of currently active preset deck (null if using custom/default)
}

export type DeckAction =
  | { type: 'INIT' }
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'APPLY_JSON_OVERRIDE'; payload: string }
  | { type: 'CHANGE_PARAMETERS'; payload: { handSize: number; discardCount: number; immediateReset: boolean } }
  | { type: 'TOGGLE_CARD_SELECTION'; payload: { instanceId: string } }
  | { type: 'CONFIRM_DISCARD' }
  // Feature 004: Play order actions
  | { type: 'SELECT_FOR_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'DESELECT_FROM_PLAY_ORDER'; payload: { instanceId: string } }
  | { type: 'LOCK_PLAY_ORDER' }
  | { type: 'CLEAR_PLAY_ORDER' }
  // Feature 006: Deck reset action
  | { type: 'RESET' }
  // Feature 009: Preset deck actions
  | { type: 'LOAD_PRESET_DECK'; payload: { presetId: string } }

/**
 * Feature 005: Persisted state (subset of DeckState)
 * Excludes transient fields: selectedCardIds, isDealing
 */
export interface PersistedDeckState extends Omit<DeckState, 'selectedCardIds' | 'isDealing'> {
  // All other fields from DeckState
}

/**
 * Validation result with error reporting
 */
export interface ValidationResult {
  isValid: boolean
  state: DeckState | null
  errors: string[]
}

/**
 * Feature 008: Settings panel visibility state
 */
export interface SettingsVisibilityState {
  isExpanded: boolean
}

/**
 * Feature 009: Preset Deck Selection
 */

/**
 * A pre-configured deck definition managed in code
 */
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

/**
 * Enumeration tracking where the current deck configuration originated
 */
export type DeckSource = 'preset' | 'custom' | 'default';
