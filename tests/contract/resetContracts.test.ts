import { describe, it, expect, beforeEach } from '@jest/globals'
import { deckReducer } from '../../src/state/deckReducer'
import { DeckState } from '../../src/lib/types'
import { DEFAULT_DECK, DEFAULT_HAND_SIZE, DEFAULT_DISCARD_COUNT } from '../../src/lib/constants'

/**
 * Contract tests for RESET action (Feature 006)
 * Validates reset behavior per specs/006-deck-reset/contracts/reset-action.contract.md
 */

describe('Reset Contracts (Feature 006)', () => {
  let mockState: DeckState

  beforeEach(() => {
    mockState = {
      drawPile: ['A', 'B', 'C', 'D', 'E'],
      discardPile: [],
      hand: ['X', 'Y', 'Z'],
      handCards: [
        { instanceId: 'id1', card: 'X' },
        { instanceId: 'id2', card: 'Y' },
        { instanceId: 'id3', card: 'Z' },
      ],
      turnNumber: 1,
      handSize: 5,
      discardCount: 3,
      warning: null,
      error: null,
      selectedCardIds: new Set<string>(),
      isDealing: false,
      discardPhase: { active: true, remainingDiscards: 3 },
      playOrderSequence: [],
      playOrderLocked: false,
      planningPhase: false,
    }
  })

  /**
   * C001: INIT - Application Initialization with Shuffle
   */
  describe('C001: INIT shuffles deck before dealing hand', () => {
    it('should shuffle deck on INIT and deal hand from shuffled deck', () => {
      // INIT action doesn't use the previous state, so we pass a minimal state
      const initialState = {} as DeckState
      const state = deckReducer(initialState, { type: 'INIT' })

      const deckSize = DEFAULT_DECK.length
      expect(state.drawPile.length).toBe(deckSize - DEFAULT_HAND_SIZE)
      expect(state.hand.length).toBe(DEFAULT_HAND_SIZE)
      expect(state.turnNumber).toBe(1)

      // Verify deck is shuffled (very low probability of being in default order)
      const defaultOrder = DEFAULT_DECK.slice(0, DEFAULT_HAND_SIZE)
      const isShuffled = JSON.stringify(state.hand) !== JSON.stringify(defaultOrder)
      expect(isShuffled).toBe(true)
    })

    it('should maintain deck completeness after INIT', () => {
      // INIT action doesn't use the previous state, so we pass a minimal state
      const initialState = {} as DeckState
      const state = deckReducer(initialState, { type: 'INIT' })

      const deckSize = DEFAULT_DECK.length
      const totalCards = state.drawPile.length + state.hand.length
      expect(totalCards).toBe(deckSize)

      // Verify all cards are unique (no duplicates)
      const allCards = [...state.drawPile, ...state.hand]
      const uniqueCards = new Set(allCards)
      expect(uniqueCards.size).toBe(deckSize)
    })
  })

  /**
   * C002: RESET - Manual System Reset with Settings Preservation
   */
  describe('C002: RESET preserves user settings and clears game state', () => {
    it('should preserve handSize and discardCount after reset', () => {
      const midGameState: DeckState = {
        ...mockState,
        handSize: 7,
        discardCount: 4,
        turnNumber: 8,
        selectedCardIds: new Set(['id1', 'id2']),
        playOrderLocked: true,
        playOrderSequence: ['id1', 'id2', 'id3'],
        warning: 'Low cards in deck',
      }

      const newState = deckReducer(midGameState, { type: 'RESET' })

      // Settings preserved
      expect(newState.handSize).toBe(7)
      expect(newState.discardCount).toBe(4)
    })

    it('should reset game state (turn, selections, warnings, etc.)', () => {
      const midGameState: DeckState = {
        ...mockState,
        handSize: 7,
        discardCount: 4,
        turnNumber: 8,
        selectedCardIds: new Set(['id1', 'id2']),
        playOrderLocked: true,
        playOrderSequence: ['id1', 'id2', 'id3'],
        warning: 'Low cards in deck',
      }

      const newState = deckReducer(midGameState, { type: 'RESET' })

      // Game state reset
      expect(newState.turnNumber).toBe(1)
      expect(newState.selectedCardIds.size).toBe(0)
      expect(newState.playOrderSequence).toEqual([])
      expect(newState.playOrderLocked).toBe(false)
      expect(newState.warning).toBeNull()
      expect(newState.discardPile).toEqual([])
    })

    it('should shuffle deck and deal new hand with preserved handSize', () => {
      const midGameState: DeckState = {
        ...mockState,
        handSize: 7,
        discardCount: 4,
        turnNumber: 8,
        discardPile: ['old1', 'old2'],
      }

      const newState = deckReducer(midGameState, { type: 'RESET' })

      const deckSize = DEFAULT_DECK.length
      // Deck shuffled and dealt
      expect(newState.hand.length).toBe(7)
      expect(newState.drawPile.length).toBe(deckSize - 7)
      expect(newState.discardPile).toEqual([])

      // Total cards conserved
      const totalCards = newState.drawPile.length + newState.hand.length
      expect(totalCards).toBe(deckSize)
    })

    it('should generate new CardInstance IDs after reset', () => {
      const midGameState: DeckState = {
        ...mockState,
        handCards: [
          { instanceId: 'old-id-1', card: 'X' },
          { instanceId: 'old-id-2', card: 'Y' },
          { instanceId: 'old-id-3', card: 'Z' },
        ],
      }

      const newState = deckReducer(midGameState, { type: 'RESET' })

      // All new instance IDs
      const oldIds = midGameState.handCards.map((c) => c.instanceId)
      const newIds = newState.handCards.map((c) => c.instanceId)

      expect(newIds.some((id) => oldIds.includes(id))).toBe(false)
    })

    it('should preserve discardCount in new discardPhase', () => {
      const midGameState: DeckState = {
        ...mockState,
        discardCount: 4,
        discardPhase: { active: true, remainingDiscards: 1 },
      }

      const newState = deckReducer(midGameState, { type: 'RESET' })

      expect(newState.discardPhase.active).toBe(true)
      expect(newState.discardPhase.remainingDiscards).toBe(4)
    })
  })

  /**
   * C003: RESET - Settings Validation and Fallback
   */
  describe('C003: RESET falls back to defaults when settings invalid', () => {
    it('should use defaults when handSize is invalid', () => {
      const corruptedState: DeckState = {
        ...mockState,
        handSize: -5, // Invalid
        discardCount: 3, // Valid
      }

      const newState = deckReducer(corruptedState, { type: 'RESET' })

      expect(newState.handSize).toBe(DEFAULT_HAND_SIZE)
      expect(newState.discardCount).toBe(3) // Valid one preserved
    })

    it('should use defaults when discardCount is invalid', () => {
      const corruptedState: DeckState = {
        ...mockState,
        handSize: 5, // Valid
        discardCount: 100, // Invalid (> handSize)
      }

      const newState = deckReducer(corruptedState, { type: 'RESET' })

      expect(newState.handSize).toBe(5) // Valid one preserved
      expect(newState.discardCount).toBe(DEFAULT_DISCARD_COUNT)
    })

    it('should use defaults when both settings are invalid', () => {
      const corruptedState: DeckState = {
        ...mockState,
        handSize: 0, // Invalid
        discardCount: -10, // Invalid
      }

      const newState = deckReducer(corruptedState, { type: 'RESET' })

      expect(newState.handSize).toBe(DEFAULT_HAND_SIZE)
      expect(newState.discardCount).toBe(DEFAULT_DISCARD_COUNT)
    })
  })

  /**
   * C004: RESET Interaction with Discard Phase
   */
  describe('C004: RESET clears active discard phase', () => {
    it('should reset discard phase with preserved discardCount', () => {
      const midDiscardState: DeckState = {
        ...mockState,
        discardPhase: { active: true, remainingDiscards: 2 },
        selectedCardIds: new Set(['id1', 'id2']),
        discardCount: 3,
      }

      const newState = deckReducer(midDiscardState, { type: 'RESET' })

      expect(newState.discardPhase.active).toBe(true)
      expect(newState.discardPhase.remainingDiscards).toBe(3)
      expect(newState.selectedCardIds.size).toBe(0)
    })

    it('should handle discardCount=0 after reset (skip discard phase)', () => {
      const noDiscardState: DeckState = {
        ...mockState,
        discardCount: 0,
        discardPhase: { active: true, remainingDiscards: 1 }, // Will be reset
      }

      const newState = deckReducer(noDiscardState, { type: 'RESET' })

      expect(newState.discardCount).toBe(0)
      expect(newState.discardPhase.active).toBe(false)
      expect(newState.discardPhase.remainingDiscards).toBe(0)
    })
  })

  /**
   * C005: RESET Interaction with Play Order
   */
  describe('C005: RESET unlocks and clears play order', () => {
    it('should clear play order sequence and unlock', () => {
      const lockedOrderState: DeckState = {
        ...mockState,
        playOrderSequence: ['id1', 'id2', 'id3'],
        playOrderLocked: true,
        planningPhase: false,
      }

      const newState = deckReducer(lockedOrderState, { type: 'RESET' })

      expect(newState.playOrderSequence).toEqual([])
      expect(newState.playOrderLocked).toBe(false)
      expect(newState.planningPhase).toBe(false)
    })

    it('should clear planning phase if active', () => {
      const planningState: DeckState = {
        ...mockState,
        playOrderSequence: ['id1'],
        playOrderLocked: false,
        planningPhase: true,
      }

      const newState = deckReducer(planningState, { type: 'RESET' })

      expect(newState.playOrderSequence).toEqual([])
      expect(newState.playOrderLocked).toBe(false)
      expect(newState.planningPhase).toBe(false)
    })
  })

  /**
   * C007: Shuffle Randomness Guarantee
   */
  describe('C007: Shuffle produces random hands (probabilistic)', () => {
    it('should produce unique hands on repeated INIT (80% threshold)', () => {
      const hands: string[] = []

      // Generate 10 fresh states
      for (let i = 0; i < 10; i++) {
        const initialState = {} as DeckState
        const state = deckReducer(initialState, { type: 'INIT' })
        // Sort hand for comparison (order doesn't matter, just content)
        hands.push(JSON.stringify([...state.hand].sort()))
      }

      // Count unique hands
      const uniqueHands = new Set(hands)

      // Expect at least 8/10 unique (80% threshold)
      expect(uniqueHands.size).toBeGreaterThanOrEqual(8)
    })

    it('should produce unique hands on repeated RESET (80% threshold)', () => {
      const hands: string[] = []
      let state = mockState

      // Generate 10 RESET states
      for (let i = 0; i < 10; i++) {
        state = deckReducer(state, { type: 'RESET' })
        hands.push(JSON.stringify([...state.hand].sort()))
      }

      // Count unique hands
      const uniqueHands = new Set(hands)

      // Expect at least 8/10 unique (80% threshold)
      expect(uniqueHands.size).toBeGreaterThanOrEqual(8)
    })
  })

  /**
   * C008: Reset Operation Performance
   */
  describe('C008: RESET completes in under 500ms', () => {
    it('should complete reset operation in under 500ms', () => {
      const state: DeckState = { ...mockState, turnNumber: 8 }

      const start = performance.now()
      const newState = deckReducer(state, { type: 'RESET' })
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(500)
      expect(newState.turnNumber).toBe(1)
    })

    it('should complete INIT with shuffle in under 500ms', () => {
      const initialState = {} as DeckState
      const start = performance.now()
      const newState = deckReducer(initialState, { type: 'INIT' })
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(500)
      expect(newState.drawPile.length).toBe(DEFAULT_DECK.length - DEFAULT_HAND_SIZE)
    })
  })

  /**
   * Edge Cases
   */
  describe('Edge Cases', () => {
    it('Edge-1: RESET with discardCount=0 skips discard phase', () => {
      const stateWithNoDiscard: DeckState = {
        ...mockState,
        discardCount: 0,
        handSize: 5,
      }

      const newState = deckReducer(stateWithNoDiscard, { type: 'RESET' })

      expect(newState.discardCount).toBe(0)
      expect(newState.discardPhase.active).toBe(false)
      expect(newState.hand.length).toBe(5)
    })

    it('Edge-2: RESET works with exhausted draw pile', () => {
      const deckSize = DEFAULT_DECK.length
      const exhaustedState: DeckState = {
        ...mockState,
        drawPile: [],
        discardPile: Array(deckSize - DEFAULT_HAND_SIZE).fill('card'),
        hand: Array(DEFAULT_HAND_SIZE).fill('card'),
      }

      const newState = deckReducer(exhaustedState, { type: 'RESET' })

      expect(newState.drawPile.length).toBe(deckSize - DEFAULT_HAND_SIZE)
      expect(newState.discardPile.length).toBe(0)
      expect(newState.hand.length).toBe(DEFAULT_HAND_SIZE)
    })

    it('Edge-3: Rapid RESET dispatches produce valid state', () => {
      let state: DeckState = { ...mockState, turnNumber: 8 }

      // Simulate 5 rapid RESET actions
      for (let i = 0; i < 5; i++) {
        state = deckReducer(state, { type: 'RESET' })
      }

      // Final state should be valid initial state
      expect(state.turnNumber).toBe(1)
      expect(state.drawPile.length).toBeGreaterThan(0)
      expect(state.discardPile).toEqual([])
      expect(state.selectedCardIds.size).toBe(0)
    })
  })

  /**
   * State Invariants
   */
  describe('State Invariants', () => {
    it('should maintain deck completeness invariant', () => {
      const newState = deckReducer(mockState, { type: 'RESET' })

      const deckSize = DEFAULT_DECK.length
      const totalCards = newState.drawPile.length + newState.hand.length
      expect(totalCards).toBe(deckSize)
    })

    it('should maintain card uniqueness invariant', () => {
      const newState = deckReducer(mockState, { type: 'RESET' })

      const deckSize = DEFAULT_DECK.length
      const allCards = [...newState.drawPile, ...newState.hand]
      const uniqueCards = new Set(allCards)
      expect(uniqueCards.size).toBe(deckSize)
    })

    it('should maintain hand synchronization invariant', () => {
      const newState = deckReducer(mockState, { type: 'RESET' })

      expect(newState.handCards.length).toBe(newState.hand.length)
      expect(newState.hand.length).toBe(newState.handSize)
    })

    it('should clear all selection-related state', () => {
      const stateWithSelections: DeckState = {
        ...mockState,
        selectedCardIds: new Set(['id1', 'id2']),
      }

      const newState = deckReducer(stateWithSelections, { type: 'RESET' })

      expect(newState.selectedCardIds.size).toBe(0)
    })

    it('should reset turn number to 1', () => {
      const laterGameState: DeckState = {
        ...mockState,
        turnNumber: 42,
      }

      const newState = deckReducer(laterGameState, { type: 'RESET' })

      expect(newState.turnNumber).toBe(1)
    })
  })
})
