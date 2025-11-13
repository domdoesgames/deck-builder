import { describe, it, expect } from '@jest/globals'
import { dealNextHand, endTurn, applyJsonOverride, changeParameters } from '../../src/state/deckReducer'
import { DeckState } from '../../src/lib/types'
import { DEFAULT_DECK } from '../../src/lib/constants'

/**
 * Contract tests for deck mechanics (US1)
 * Validates internal logic boundaries per contracts/deck-contracts.md
 */

describe('Deck Contracts', () => {
  describe('dealNextHand', () => {
    it('should deal exactly handSize cards when sufficient cards available', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = dealNextHand(state)

      expect(result.hand).toHaveLength(5)
      expect(result.drawPile).toHaveLength(5)
      expect(result.warning).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should reshuffle discard pile when draw pile exhausted', () => {
      const state: DeckState = {
        drawPile: ['A', 'B'],
        discardPile: ['C', 'D', 'E', 'F', 'G'],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = dealNextHand(state)

      // Should deal 5 cards total (2 from draw, then reshuffle discard, then 3 more)
      expect(result.hand).toHaveLength(5)
      expect(result.discardPile).toHaveLength(0)
      expect(result.warning).toBeNull()
    })

    it('should show warning when total cards less than handSize', () => {
      const state: DeckState = {
        drawPile: ['A', 'B'],
        discardPile: ['C'],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = dealNextHand(state)

      // Should deal only 3 cards total
      expect(result.hand).toHaveLength(3)
      expect(result.warning).toMatch(/insufficient cards.*3.*5/i)
      expect(result.drawPile).toHaveLength(0)
      expect(result.discardPile).toHaveLength(0)
    })

    it('should clear isDealing flag', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: true,
      }

      const result = dealNextHand(state)

      expect(result.isDealing).toBe(false)
    })
  })

  describe('endTurn', () => {
    it('should move entire hand to discard pile', () => {
      const state: DeckState = {
        drawPile: ['D', 'E', 'F'],
        discardPile: ['G', 'H'],
        hand: ['A', 'B', 'C'],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = endTurn(state)

      // Old hand should be in discard pile
      expect(result.discardPile).toContain('A')
      expect(result.discardPile).toContain('B')
      expect(result.discardPile).toContain('C')
      
      // Should have new hand dealt
      expect(result.hand).toHaveLength(3)
      expect(result.turnNumber).toBe(2)
    })

    it('should increment turn number', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: ['X', 'Y', 'Z'],
        turnNumber: 5,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = endTurn(state)

      expect(result.turnNumber).toBe(6)
    })

    it('should ignore when isDealing is true (concurrency protection)', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: ['X', 'Y', 'Z'],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: true,
      }

      const result = endTurn(state)

      // State should be unchanged
      expect(result).toEqual(state)
    })

    it('should handle reshuffle during end turn if needed', () => {
      const state: DeckState = {
        drawPile: ['A'],
        discardPile: ['B', 'C', 'D', 'E'],
        hand: ['X', 'Y', 'Z'],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = endTurn(state)

      // Should have dealt new hand of 3 cards
      expect(result.hand).toHaveLength(3)
      expect(result.turnNumber).toBe(2)
      
      // Old hand should be in discard, but some may have been reshuffled
      // Total cards should be conserved (8 total: 1 draw + 4 discard + 3 old hand)
      const totalCards = result.drawPile.length + result.discardPile.length + result.hand.length
      expect(totalCards).toBe(8)
    })
  })

  describe('applyJsonOverride', () => {
    it('should replace deck with valid JSON array', () => {
      const state: DeckState = {
        drawPile: [...DEFAULT_DECK],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('["X","Y","Z","W","Q","R"]', state)

      // Should have new hand dealt from new deck
      expect(result.hand).toHaveLength(3)
      expect(result.error).toBeNull()
      
      // Total cards should be 6
      const totalCards = result.drawPile.length + result.discardPile.length + result.hand.length
      expect(totalCards).toBe(6)
    })

    it('should preserve duplicate entries', () => {
      const state: DeckState = {
        drawPile: [...DEFAULT_DECK],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('["A","A","A","B","B","C"]', state)

      expect(result.error).toBeNull()
      
      // Total cards should include duplicates (6 total)
      const totalCards = result.drawPile.length + result.discardPile.length + result.hand.length
      expect(totalCards).toBe(6)
    })

    it('should revert to default deck on empty array with warning', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('[]', state)

      expect(result.warning).toMatch(/empty deck.*revert/i)
      expect(result.error).toBeNull()
      
      // Should have reverted to DEFAULT_DECK
      const totalCards = result.drawPile.length + result.discardPile.length + result.hand.length
      expect(totalCards).toBe(DEFAULT_DECK.length)
    })

    it('should set error and not mutate state on invalid JSON', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('not valid json', state)

      expect(result.error).toMatch(/invalid json/i)
      expect(result.drawPile).toEqual(['A', 'B', 'C'])
      expect(result.discardPile).toEqual([])
      expect(result.hand).toEqual([])
    })

    it('should set error when JSON is not an array', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('{"cards": ["A","B"]}', state)

      expect(result.error).toMatch(/must be.*array/i)
      expect(result.drawPile).toEqual(['A', 'B', 'C'])
    })

    it('should set error when array contains non-strings', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = applyJsonOverride('[1, 2, 3]', state)

      expect(result.error).toMatch(/must be strings/i)
      expect(result.drawPile).toEqual(['A', 'B', 'C'])
    })
  })

  describe('changeParameters', () => {
    it('should update parameters without reset when immediateReset is false', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: ['D', 'E'],
        hand: ['X', 'Y', 'Z'],
        turnNumber: 3,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = changeParameters(7, 10, state, false)

      expect(result.handSize).toBe(7)
      expect(result.discardCount).toBe(10)
      
      // State should be otherwise unchanged
      expect(result.drawPile).toEqual(['A', 'B', 'C'])
      expect(result.discardPile).toEqual(['D', 'E'])
      expect(result.hand).toEqual(['X', 'Y', 'Z'])
      expect(result.turnNumber).toBe(3)
    })

    it('should reset and deal new hand when immediateReset is true', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: ['D', 'E'],
        hand: ['X', 'Y', 'Z'],
        turnNumber: 3,
        handSize: 3,
        discardCount: 3,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result = changeParameters(4, 5, state, true)

      expect(result.handSize).toBe(4)
      expect(result.discardCount).toBe(5)
      
      // Should have new hand of size 4
      expect(result.hand).toHaveLength(4)
      
      // All 8 cards should be accounted for
      const totalCards = result.drawPile.length + result.discardPile.length + result.hand.length
      expect(totalCards).toBe(8)
      
      // Discard should be empty after reset
      expect(result.discardPile).toHaveLength(0)
    })

    it('should clamp handSize to range 1-10', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      // Test upper bound
      const result1 = changeParameters(15, 5, state, false)
      expect(result1.handSize).toBe(10)

      // Test lower bound
      const result2 = changeParameters(0, 5, state, false)
      expect(result2.handSize).toBe(1)

      // Test negative
      const result3 = changeParameters(-5, 5, state, false)
      expect(result3.handSize).toBe(1)
    })

    it('should ensure discardCount is at least 1', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: [],
        turnNumber: 1,
        handSize: 5,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
      }

      const result1 = changeParameters(5, 0, state, false)
      expect(result1.discardCount).toBe(1)

      const result2 = changeParameters(5, -3, state, false)
      expect(result2.discardCount).toBe(1)
    })
  })
})
