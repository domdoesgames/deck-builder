import { describe, it, expect } from '@jest/globals'
import { deckReducer } from '../../src/state/deckReducer'
import { DeckState, DeckAction } from '../../src/lib/types'

/**
 * Contract tests for discard phase mechanics (Feature 003)
 * Validates FR-001, FR-005, FR-008 per specs/003-card-discard-mechanic/contracts/
 */

describe('Discard Phase Contracts', () => {
  describe('FR-001: Discard phase activation after deal when count > 0', () => {
    it('should activate discard phase when discardCount > 0', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: [],
        handCards: [],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: false, remainingDiscards: 0 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'DEAL_NEXT_HAND' }
      const result = deckReducer(state, action)

      expect(result.discardPhase.active).toBe(true)
      expect(result.discardPhase.remainingDiscards).toBe(2)
    })

    it('should NOT activate discard phase when discardCount = 0', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: [],
        handCards: [],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: false, remainingDiscards: 0 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 0,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'DEAL_NEXT_HAND' }
      const result = deckReducer(state, action)

      expect(result.discardPhase.active).toBe(false)
      expect(result.discardPhase.remainingDiscards).toBe(0)
    })

    it('should cap remainingDiscards at handCards.length when discardCount > handSize', () => {
      const state: DeckState = {
        drawPile: ['A', 'B'],
        discardPile: [],
        hand: [],
        handCards: [],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: false, remainingDiscards: 0 },
        turnNumber: 1,
        handSize: 2,
        discardCount: 5,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'DEAL_NEXT_HAND' }
      const result = deckReducer(state, action)

      expect(result.discardPhase.active).toBe(true)
      expect(result.discardPhase.remainingDiscards).toBe(2) // Capped at handCards.length
    })
  })

  describe('FR-005: Block turn end during discard phase', () => {
    it('should prevent END_TURN action when discardPhase.active = true', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C'],
        discardPile: [],
        hand: ['D', 'E', 'F'],
        handCards: [
          { instanceId: 'card-1', card: 'D' },
          { instanceId: 'card-2', card: 'E' },
          { instanceId: 'card-3', card: 'F' },
        ],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'END_TURN' }
      const result = deckReducer(state, action)

      // State should remain unchanged
      expect(result.turnNumber).toBe(1)
      expect(result.hand).toEqual(['D', 'E', 'F'])
      expect(result.discardPhase.active).toBe(true)
    })

    it('should allow END_TURN action when discardPhase.active = false', () => {
      const state: DeckState = {
        drawPile: ['A', 'B', 'C', 'D', 'E'],
        discardPile: [],
        hand: ['F', 'G'],
        handCards: [
          { instanceId: 'card-1', card: 'F' },
          { instanceId: 'card-2', card: 'G' },
        ],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: false, remainingDiscards: 0 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 0,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'END_TURN' }
      const result = deckReducer(state, action)

      // Turn should increment and hand should move to discard
      expect(result.turnNumber).toBe(2)
      expect(result.discardPile).toContain('F')
      expect(result.discardPile).toContain('G')
      expect(result.hand.length).toBeGreaterThan(0) // New hand dealt
    })
  })

  describe('FR-008: Cards move to discard pile after confirmation', () => {
    it('should move selected cards to discard pile on CONFIRM_DISCARD', () => {
      const state: DeckState = {
        drawPile: ['A', 'B'],
        discardPile: ['X'],
        hand: ['C', 'D', 'E'],
        handCards: [
          { instanceId: 'card-1', card: 'C' },
          { instanceId: 'card-2', card: 'D' },
          { instanceId: 'card-3', card: 'E' },
        ],
        selectedCardIds: new Set<string>(['card-1', 'card-3']),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'CONFIRM_DISCARD' }
      const result = deckReducer(state, action)

      // Selected cards should be in discard pile
      expect(result.discardPile).toContain('C')
      expect(result.discardPile).toContain('E')
      expect(result.discardPile).toHaveLength(3) // X + C + E

      // Only unselected card remains in hand
      expect(result.hand).toEqual(['D'])
      expect(result.handCards).toHaveLength(1)
      expect(result.handCards[0].card).toBe('D')

      // Discard phase should be complete
      expect(result.discardPhase.active).toBe(false)
      expect(result.selectedCardIds.size).toBe(0)
    })

    it('should preserve card order in discard pile', () => {
      const state: DeckState = {
        drawPile: [],
        discardPile: ['A', 'B'],
        hand: ['C', 'D', 'E'],
        handCards: [
          { instanceId: 'card-1', card: 'C' },
          { instanceId: 'card-2', card: 'D' },
          { instanceId: 'card-3', card: 'E' },
        ],
        selectedCardIds: new Set<string>(['card-1', 'card-2']),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = { type: 'CONFIRM_DISCARD' }
      const result = deckReducer(state, action)

      // Discard pile should maintain order: existing + new
      expect(result.discardPile).toEqual(['A', 'B', 'C', 'D'])
    })
  })

  describe('Selection Contracts (card-selection.contract.md)', () => {
    it('should toggle selection: add when not selected', () => {
      const state: DeckState = {
        drawPile: [],
        discardPile: [],
        hand: ['A', 'B'],
        handCards: [
          { instanceId: 'card-1', card: 'A' },
          { instanceId: 'card-2', card: 'B' },
        ],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 2,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = {
        type: 'TOGGLE_CARD_SELECTION',
        payload: { instanceId: 'card-1' },
      }
      const result = deckReducer(state, action)

      expect(result.selectedCardIds.has('card-1')).toBe(true)
    })

    it('should toggle selection: remove when already selected', () => {
      const state: DeckState = {
        drawPile: [],
        discardPile: [],
        hand: ['A', 'B'],
        handCards: [
          { instanceId: 'card-1', card: 'A' },
          { instanceId: 'card-2', card: 'B' },
        ],
        selectedCardIds: new Set<string>(['card-1']),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 2,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = {
        type: 'TOGGLE_CARD_SELECTION',
        payload: { instanceId: 'card-1' },
      }
      const result = deckReducer(state, action)

      expect(result.selectedCardIds.has('card-1')).toBe(false)
    })

    it('should enforce max selection limit', () => {
      const state: DeckState = {
        drawPile: [],
        discardPile: [],
        hand: ['A', 'B', 'C'],
        handCards: [
          { instanceId: 'card-1', card: 'A' },
          { instanceId: 'card-2', card: 'B' },
          { instanceId: 'card-3', card: 'C' },
        ],
        selectedCardIds: new Set<string>(['card-1', 'card-2']),
        discardPhase: { active: true, remainingDiscards: 2 },
        turnNumber: 1,
        handSize: 3,
        discardCount: 2,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = {
        type: 'TOGGLE_CARD_SELECTION',
        payload: { instanceId: 'card-3' },
      }
      const result = deckReducer(state, action)

      // Should NOT add card-3 (already at max)
      expect(result.selectedCardIds.has('card-3')).toBe(false)
      expect(result.selectedCardIds.size).toBe(2)
    })

    it('should ignore selection when discard phase not active', () => {
      const state: DeckState = {
        drawPile: [],
        discardPile: [],
        hand: ['A'],
        handCards: [{ instanceId: 'card-1', card: 'A' }],
        selectedCardIds: new Set<string>(),
        discardPhase: { active: false, remainingDiscards: 0 },
        turnNumber: 1,
        handSize: 1,
        discardCount: 0,
        warning: null,
        error: null,
        isDealing: false,
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      const action: DeckAction = {
        type: 'TOGGLE_CARD_SELECTION',
        payload: { instanceId: 'card-1' },
      }
      const result = deckReducer(state, action)

      // Selection should be ignored
      expect(result.selectedCardIds.size).toBe(0)
    })
  })
})
