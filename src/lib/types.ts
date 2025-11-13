/**
 * Core types for Deck Mechanics (Feature 001)
 * Based on specs/001-deck-mechanics/contracts/deck-contracts.md
 */

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
}

export type DeckAction =
  | { type: 'INIT' }
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'APPLY_JSON_OVERRIDE'; payload: string }
  | { type: 'CHANGE_PARAMETERS'; payload: { handSize: number; discardCount: number; immediateReset: boolean } }
