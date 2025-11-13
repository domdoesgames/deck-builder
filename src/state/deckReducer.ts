import { DeckState, DeckAction } from '../lib/types'
import { DEFAULT_DECK, DEFAULT_HAND_SIZE, DEFAULT_DISCARD_COUNT } from '../lib/constants'
import { shuffle } from '../lib/shuffle'

/**
 * Deck state reducer implementing all actions per contracts/deck-contracts.md
 * Handles: INIT, DEAL_NEXT_HAND, END_TURN, APPLY_JSON_OVERRIDE, CHANGE_PARAMETERS
 */

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'INIT':
      return initializeDeck()
    
    case 'DEAL_NEXT_HAND':
      return dealNextHand(state)
    
    case 'END_TURN':
      return endTurn(state)
    
    case 'APPLY_JSON_OVERRIDE':
      return applyJsonOverride(action.payload, state)
    
    case 'CHANGE_PARAMETERS':
      return changeParameters(
        action.payload.handSize,
        action.payload.discardCount,
        state,
        action.payload.immediateReset
      )
    
    default:
      return state
  }
}

function initializeDeck(): DeckState {
  const drawPile = [...DEFAULT_DECK]
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    turnNumber: 1,
    handSize: DEFAULT_HAND_SIZE,
    discardCount: DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
  }
  
  return dealNextHand(initialState)
}

export function dealNextHand(state: DeckState, preserveWarning = false): DeckState {
  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]
  const hand: string[] = []
  let warning: string | null = preserveWarning ? state.warning : null
  
  for (let i = 0; i < state.handSize; i++) {
    // If draw pile is empty, reshuffle discard pile
    if (drawPile.length === 0 && discardPile.length > 0) {
      drawPile = shuffle(discardPile)
      discardPile = []
    }
    
    // Draw a card if available
    if (drawPile.length > 0) {
      const card = drawPile.shift()!
      hand.push(card)
    } else {
      // Insufficient cards warning (FR-004)
      warning = `Insufficient cards: could only deal ${hand.length} of ${state.handSize} requested cards`
      break
    }
  }
  
  return {
    ...state,
    drawPile,
    discardPile,
    hand,
    warning,
    error: null,
    isDealing: false,
  }
}

export function endTurn(state: DeckState): DeckState {
  // Ignore if currently dealing (concurrency protection)
  if (state.isDealing) {
    return state
  }
  
  // Move entire hand to discard pile (FR-005)
  const discardPile = [...state.discardPile, ...state.hand]
  const emptyHandState = {
    ...state,
    hand: [],
    discardPile,
    turnNumber: state.turnNumber + 1,
  }
  
  // Deal next hand
  return dealNextHand(emptyHandState)
}

export function applyJsonOverride(raw: string, state: DeckState): DeckState {
  try {
    const parsed = JSON.parse(raw)
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      return {
        ...state,
        error: 'Override must be a JSON array',
      }
    }
    
    // Validate all elements are strings
    if (!parsed.every(item => typeof item === 'string')) {
      return {
        ...state,
        error: 'All deck items must be strings',
      }
    }
    
    // Empty array: revert to default deck with warning (FR-009)
    if (parsed.length === 0) {
      const drawPile = [...DEFAULT_DECK]
      return dealNextHand({
        ...state,
        drawPile,
        discardPile: [],
        hand: [],
        warning: 'Empty deck provided, reverted to default',
        error: null,
      }, true)  // Preserve the warning message
    }
    
    // Valid non-empty array: replace deck (duplicates preserved per data-model.md)
    const drawPile = [...parsed]
    return dealNextHand({
      ...state,
      drawPile,
      discardPile: [],
      hand: [],
      warning: null,
      error: null,
    })
    
  } catch (err) {
    // Parse error: no state mutation (FR-008)
    return {
      ...state,
      error: `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

export function changeParameters(
  handSize: number,
  discardCount: number,
  state: DeckState,
  immediateReset: boolean
): DeckState {
  // Validate handSize range (1-10 per data-model.md)
  const validHandSize = Math.max(1, Math.min(10, Math.floor(handSize)))
  const validDiscardCount = Math.max(1, Math.floor(discardCount))
  
  if (!immediateReset) {
    // Apply parameters for next deal
    return {
      ...state,
      handSize: validHandSize,
      discardCount: validDiscardCount,
    }
  }
  
  // Immediate reset: consolidate all cards, reshuffle, deal new hand
  const allCards = [...state.drawPile, ...state.discardPile, ...state.hand]
  const drawPile = shuffle(allCards)
  
  return dealNextHand({
    ...state,
    drawPile,
    discardPile: [],
    hand: [],
    handSize: validHandSize,
    discardCount: validDiscardCount,
    warning: null,
    error: null,
  })
}
