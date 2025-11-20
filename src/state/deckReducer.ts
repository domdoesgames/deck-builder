import { DeckState, DeckAction } from '../lib/types'
import { DEFAULT_DECK, DEFAULT_HAND_SIZE, DEFAULT_DISCARD_COUNT, MIN_DISCARD_COUNT } from '../lib/constants'
import { shuffle } from '../lib/shuffle'
import { generateCardInstance } from '../lib/cardInstance'
import { PRESET_DECKS } from '../lib/presetDecks'

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
    
    case 'TOGGLE_CARD_SELECTION':
      return toggleCardSelection(state, action.payload.instanceId)
    
    case 'CONFIRM_DISCARD':
      return confirmDiscard(state)
    
    // Feature 004: Play order actions (T008)
    case 'SELECT_FOR_PLAY_ORDER':
      return selectForPlayOrder(state, action.payload.instanceId)
    
    case 'DESELECT_FROM_PLAY_ORDER':
      return deselectFromPlayOrder(state, action.payload.instanceId)
    
    case 'LOCK_PLAY_ORDER':
      return lockPlayOrder(state)
    
    case 'CLEAR_PLAY_ORDER':
      return clearPlayOrder(state)
    
    // Feature 006: Deck reset (T003)
    case 'RESET': {
      // Extract and validate user settings (C002, C003)
      const handSize = state.handSize
      const discardCount = state.discardCount
      
      // Validate settings, fallback to defaults if invalid (C003)
      const preservedHandSize = (handSize >= 1 && handSize <= 52) ? handSize : DEFAULT_HAND_SIZE
      const preservedDiscardCount = (discardCount >= 0 && discardCount <= preservedHandSize) 
        ? discardCount 
        : DEFAULT_DISCARD_COUNT
      
      // Reset to initial state with preserved settings (C002, C004, C005)
      return initializeDeck({ 
        handSize: preservedHandSize, 
        discardCount: preservedDiscardCount,
        deckSource: 'default',
        activePresetId: null,
      })
    }
    
    // Feature 009: Load preset deck (T009)
    case 'LOAD_PRESET_DECK':
      return loadPresetDeck(action.payload.presetId, state)
    
    default:
      return state
  }
}

function initializeDeck(params?: { 
  handSize?: number; 
  discardCount?: number;
  deckSource?: 'preset' | 'custom' | 'default';
  activePresetId?: string | null;
}): DeckState {
  // Feature 006: Shuffle deck on every initialization (C001)
  const drawPile = shuffle([...DEFAULT_DECK])
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    turnNumber: 1,
    handSize: params?.handSize ?? DEFAULT_HAND_SIZE,
    discardCount: params?.discardCount ?? DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
    // Feature 003: Card discard mechanic
    handCards: [],
    selectedCardIds: new Set(),
    discardPhase: { active: false, remainingDiscards: 0 },
    // Feature 004: Card play order (T003)
    playOrderSequence: [],
    playOrderLocked: false,
    planningPhase: false,
    // Feature 009: Preset deck selection
    deckSource: params?.deckSource ?? 'default',
    activePresetId: params?.activePresetId ?? null,
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
  
  // Feature 003: Generate CardInstance objects for hand
  const handCards = hand.map(card => generateCardInstance(card))
  const effectiveDiscardCount = Math.min(state.discardCount, handCards.length)
  
  return {
    ...state,
    drawPile,
    discardPile,
    hand,
    warning,
    error: null,
    isDealing: false,
    // Feature 003: Initialize discard phase with new hand
    handCards,
    selectedCardIds: new Set(),
    discardPhase: {
      active: effectiveDiscardCount > 0,
      remainingDiscards: effectiveDiscardCount,
    },
    // Feature 004: Reset play order state (T013)
    playOrderSequence: [],
    playOrderLocked: false,
    // Feature 005: Planning phase is NOT activated when discardCount=0 (preserves Feature 001 auto-discard behavior)
    planningPhase: false,
  }
}

export function endTurn(state: DeckState): DeckState {
  // Ignore if currently dealing (concurrency protection)
  if (state.isDealing) {
    return state
  }
  
  // Feature 003: Block turn end during discard phase (T034, FR-005)
  if (state.discardPhase.active) {
    return state
  }
  
  // Feature 004: Block turn end during planning phase (T011, T115)
  if (state.planningPhase) {
    return state
  }
  
  // Feature 004: Block turn end if play order exists but not locked (T012, T116)
  if (state.playOrderSequence.length > 0 && !state.playOrderLocked) {
    return state
  }
  
  // Move entire hand to discard pile (FR-005)
  const discardPile = [...state.discardPile, ...state.hand]
  const emptyHandState = {
    ...state,
    hand: [],
    handCards: [], // T036: Clear handCards when ending turn
    discardPile,
    turnNumber: state.turnNumber + 1,
    selectedCardIds: new Set<string>(), // T036: Clear selections
    discardPhase: { active: false, remainingDiscards: 0 }, // T036: Reset discard phase
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
    // Feature 006: Shuffle deck on apply (C001 - all deck initializations should shuffle)
    if (parsed.length === 0) {
      const drawPile = shuffle([...DEFAULT_DECK])
      return dealNextHand({
        ...state,
        drawPile,
        discardPile: [],
        hand: [],
        handCards: [],
        warning: 'Empty deck provided, reverted to default',
        error: null,
        // Feature 009: Custom deck via JSON override (T010)
        deckSource: 'custom',
        activePresetId: null,
      }, true)  // Preserve the warning message
    }
    
    // Valid non-empty array: replace deck (duplicates preserved per data-model.md)
    // Feature 006: Shuffle deck on apply (C001 - all deck initializations should shuffle)
    const drawPile = shuffle([...parsed])
    return dealNextHand({
      ...state,
      drawPile,
      discardPile: [],
      hand: [],
      handCards: [],
      warning: null,
      error: null,
      // Feature 009: Custom deck via JSON override (T010)
      deckSource: 'custom',
      activePresetId: null,
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
  const validDiscardCount = Math.max(MIN_DISCARD_COUNT, Math.floor(discardCount))
  
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
    handCards: [],
    handSize: validHandSize,
    discardCount: validDiscardCount,
    warning: null,
    error: null,
  })
}

/**
 * Feature 003: Toggle card selection for discard
 * Per specs/003-card-discard-mechanic/contracts/card-selection.contract.md
 */
function toggleCardSelection(state: DeckState, instanceId: string): DeckState {
  // Only allow selection during active discard phase
  if (!state.discardPhase.active) {
    return state
  }

  // Validate instanceId exists in handCards
  const validInstanceId = state.handCards.some(card => card.instanceId === instanceId)
  if (!validInstanceId) {
    return state
  }

  const selectedCardIds = new Set(state.selectedCardIds)
  const isCurrentlySelected = selectedCardIds.has(instanceId)

  if (isCurrentlySelected) {
    // Deselect: remove from set
    selectedCardIds.delete(instanceId)
  } else {
    // Select: add to set only if not at max
    if (selectedCardIds.size < state.discardPhase.remainingDiscards) {
      selectedCardIds.add(instanceId)
    } else {
      // At max selections, ignore the toggle
      return state
    }
  }

  return {
    ...state,
    selectedCardIds,
  }
}

/**
 * Feature 003: Confirm discard of selected cards
 * Per specs/003-card-discard-mechanic/contracts/discard-phase.contract.md
 * Feature 004: Initiate planning phase if cards remain (T009, T010, T113, T114)
 */
function confirmDiscard(state: DeckState): DeckState {
  // Only allow during active discard phase
  if (!state.discardPhase.active) {
    return state
  }

  // Get the cards to discard
  const cardsToDiscard = state.handCards.filter(card => 
    state.selectedCardIds.has(card.instanceId)
  )

  // Get remaining cards in hand
  const remainingHandCards = state.handCards.filter(card =>
    !state.selectedCardIds.has(card.instanceId)
  )

  // Update hand array (legacy field)
  const remainingHand = remainingHandCards.map(cardInstance => cardInstance.card)

  // Add discarded cards to discard pile
  const discardPile = [
    ...state.discardPile,
    ...cardsToDiscard.map(cardInstance => cardInstance.card)
  ]

  // Feature 004: Initiate planning phase if cards remain (T009, T113)
  // Skip planning phase if hand is empty (T010, T114)
  const planningPhase = remainingHandCards.length > 0

  return {
    ...state,
    handCards: remainingHandCards,
    hand: remainingHand,
    discardPile,
    selectedCardIds: new Set(),
    discardPhase: {
      active: false,
      remainingDiscards: 0,
    },
    // Feature 004: Initiate planning phase
    planningPhase,
    playOrderSequence: [],
    playOrderLocked: false,
  }
}

/**
 * Feature 004: Select card for play order (T004, T101-T104)
 * Per specs/004-card-play-order/contracts/play-order-state.contract.md
 */
function selectForPlayOrder(state: DeckState, instanceId: string): DeckState {
  // T102: Ignore when not in planning phase or when locked
  if (!state.planningPhase || state.playOrderLocked) {
    return state
  }

  // T103: Ignore if instanceId doesn't exist in handCards
  const validInstanceId = state.handCards.some(card => card.instanceId === instanceId)
  if (!validInstanceId) {
    return state
  }

  // T104: Ignore if already in sequence (duplicate)
  if (state.playOrderSequence.includes(instanceId)) {
    return state
  }

  // T101: Valid selection - add to end of sequence
  return {
    ...state,
    playOrderSequence: [...state.playOrderSequence, instanceId],
  }
}

/**
 * Feature 004: Deselect card from play order (T005, T105-T107)
 * Per specs/004-card-play-order/contracts/play-order-state.contract.md
 */
function deselectFromPlayOrder(state: DeckState, instanceId: string): DeckState {
  // T107: Ignore when locked
  if (state.playOrderLocked) {
    return state
  }

  // T106: Ignore when not in planning phase
  if (!state.planningPhase) {
    return state
  }

  // T106: Ignore if not in sequence
  if (!state.playOrderSequence.includes(instanceId)) {
    return state
  }

  // T105: Valid deselection - remove and preserve order of remaining
  return {
    ...state,
    playOrderSequence: state.playOrderSequence.filter(id => id !== instanceId),
  }
}

/**
 * Feature 004: Lock play order (T006, T108-T110)
 * Per specs/004-card-play-order/contracts/play-order-state.contract.md
 */
function lockPlayOrder(state: DeckState): DeckState {
  // T110: Ignore if already locked
  if (state.playOrderLocked) {
    return state
  }

  // T109: Ignore if sequence is incomplete
  if (state.playOrderSequence.length < state.handCards.length) {
    return state
  }

  // T108: Valid lock - transition to Executing phase
  return {
    ...state,
    playOrderLocked: true,
    planningPhase: false,
  }
}

/**
 * Feature 004: Clear play order (T007, T111-T112)
 * Per specs/004-card-play-order/contracts/play-order-state.contract.md
 */
function clearPlayOrder(state: DeckState): DeckState {
  // T112: Ignore when locked
  if (state.playOrderLocked) {
    return state
  }

  // T111: Valid clear - reset sequence to empty
  return {
    ...state,
    playOrderSequence: [],
  }
}

/**
 * Feature 009: Load preset deck (T009)
 * Per specs/009-preset-deck-selection/contracts/persistenceManager-extension.contract.md
 * 
 * Looks up preset by ID, validates structure, and rebuilds deck state.
 * Similar to APPLY_JSON_OVERRIDE but for code-managed presets.
 */
function loadPresetDeck(presetId: string, state: DeckState): DeckState {
  // Look up preset by ID
  const preset = PRESET_DECKS.find(deck => deck.id === presetId)
  
  // Preset not found: return error state
  if (!preset) {
    return {
      ...state,
      error: `Preset deck "${presetId}" not found`,
    }
  }
  
  // Validate preset has cards
  if (!preset.cards || preset.cards.length === 0) {
    return {
      ...state,
      error: `Preset deck "${preset.name}" has no cards`,
    }
  }
  
  // Valid preset: rebuild deck state
  // Shuffle the preset deck (consistent with all deck initializations)
  const drawPile = shuffle([...preset.cards])
  
  return dealNextHand({
    ...state,
    drawPile,
    discardPile: [],
    hand: [],
    handCards: [],
    warning: null,
    error: null,
    // Set deck source and active preset ID
    deckSource: 'preset',
    activePresetId: presetId,
  })
}
