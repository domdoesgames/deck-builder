import { describe, it, expect } from '@jest/globals'
import { deckReducer } from '../../src/state/deckReducer'
import { DeckState, DeckAction } from '../../src/lib/types'
import { generateCardInstance } from '../../src/lib/cardInstance'

/**
 * Contract tests for play order feature (Feature 004)
 * Validates state transitions per contracts/play-order-state.contract.md
 * Per tasks.md: All contract tests (T015-T059) in single file, organized by user story
 */

describe('Play Order Contracts - Feature 004', () => {
  
  /**
   * User Story 1: Sequential Card Order Selection
   * Tests T015-T023
   */
  describe('User Story 1: Sequential Card Order Selection', () => {
    
    describe('SELECT_FOR_PLAY_ORDER', () => {
      
      // T015: T101 - Valid selection
      it('T101: adds instanceId to playOrderSequence when valid', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        const card3 = generateCardInstance('Card C')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B', 'Card C'],
          handCards: [card1, card2, card3],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [],
          playOrderLocked: false,
          planningPhase: true, // Key precondition
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'SELECT_FOR_PLAY_ORDER',
          payload: { instanceId: card2.instanceId },
        }
        
        const result = deckReducer(state, action)
        
        // Postconditions
        expect(result.playOrderSequence).toContain(card2.instanceId)
        expect(result.playOrderSequence[result.playOrderSequence.length - 1]).toBe(card2.instanceId)
        expect(result.playOrderSequence.length).toBe(1)
        // All other state unchanged
        expect(result.playOrderLocked).toBe(false)
        expect(result.planningPhase).toBe(true)
        expect(result.handCards).toBe(state.handCards)
      })
      
      // T016: T102 - Ignore when not in planning phase
      it('T102: ignores selection when not in planning phase', () => {
        const card1 = generateCardInstance('Card A')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A'],
          handCards: [card1],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [],
          playOrderLocked: false,
          planningPhase: false, // Not in planning phase
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'SELECT_FOR_PLAY_ORDER',
          payload: { instanceId: card1.instanceId },
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged
        expect(result).toEqual(state)
        expect(result.playOrderSequence).toEqual([])
      })
      
      // T016 (continued): T102 - Ignore when locked
      it('T102: ignores selection when playOrderLocked is true', () => {
        const card1 = generateCardInstance('Card A')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A'],
          handCards: [card1],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [card1.instanceId],
          playOrderLocked: true, // Locked
          planningPhase: false,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'SELECT_FOR_PLAY_ORDER',
          payload: { instanceId: card1.instanceId },
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged
        expect(result).toEqual(state)
      })
      
      // T017: T103 - Ignore invalid instanceId
      it('T103: ignores selection with invalid instanceId', () => {
        const card1 = generateCardInstance('Card A')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A'],
          handCards: [card1],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [],
          playOrderLocked: false,
          planningPhase: true,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'SELECT_FOR_PLAY_ORDER',
          payload: { instanceId: 'invalid-id-not-in-hand' },
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged
        expect(result).toEqual(state)
        expect(result.playOrderSequence).toEqual([])
      })
      
      // T018: T104 - Ignore duplicate selection
      it('T104: ignores duplicate selection', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B'],
          handCards: [card1, card2],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [card1.instanceId], // Already selected
          playOrderLocked: false,
          planningPhase: true,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'SELECT_FOR_PLAY_ORDER',
          payload: { instanceId: card1.instanceId }, // Try to select again
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged (no duplicate added)
        expect(result).toEqual(state)
        expect(result.playOrderSequence).toEqual([card1.instanceId])
        expect(result.playOrderSequence.length).toBe(1)
      })
      
    })
    
    describe('DESELECT_FROM_PLAY_ORDER', () => {
      
      // T019: T105 - Valid deselection
      it('T105: removes instanceId and preserves order of remaining cards', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        const card3 = generateCardInstance('Card C')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B', 'Card C'],
          handCards: [card1, card2, card3],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [card1.instanceId, card2.instanceId, card3.instanceId],
          playOrderLocked: false,
          planningPhase: true,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'DESELECT_FROM_PLAY_ORDER',
          payload: { instanceId: card2.instanceId }, // Remove middle card
        }
        
        const result = deckReducer(state, action)
        
        // Postconditions
        expect(result.playOrderSequence).not.toContain(card2.instanceId)
        expect(result.playOrderSequence).toEqual([card1.instanceId, card3.instanceId])
        expect(result.playOrderSequence.length).toBe(2)
        // Other state unchanged
        expect(result.planningPhase).toBe(true)
        expect(result.playOrderLocked).toBe(false)
      })
      
      // T020: T106 - Ignore when not in sequence
      it('T106: ignores deselection when instanceId not in sequence', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B'],
          handCards: [card1, card2],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [card1.instanceId], // Only card1 in sequence
          playOrderLocked: false,
          planningPhase: true,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'DESELECT_FROM_PLAY_ORDER',
          payload: { instanceId: card2.instanceId }, // Not in sequence
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged
        expect(result).toEqual(state)
      })
      
      // T021: T107 - Ignore when locked
      it('T107: ignores deselection when playOrderLocked is true', () => {
        const card1 = generateCardInstance('Card A')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A'],
          handCards: [card1],
          selectedCardIds: new Set(),
          discardPhase: { active: false, remainingDiscards: 0 },
          playOrderSequence: [card1.instanceId],
          playOrderLocked: true, // Locked
          planningPhase: false,
          turnNumber: 1,
          handSize: 5,
          discardCount: 3,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = {
          type: 'DESELECT_FROM_PLAY_ORDER',
          payload: { instanceId: card1.instanceId },
        }
        
        const result = deckReducer(state, action)
        
        // State completely unchanged (locked order cannot be modified)
        expect(result).toEqual(state)
      })
      
    })
    
    describe('CONFIRM_DISCARD - Planning Phase Initiation', () => {
      
      // T022: T113 - Initiate planning phase when cards remain
      it('T113: sets planningPhase=true and resets play order when cards remain after discard', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        const card3 = generateCardInstance('Card C')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B', 'Card C'],
          handCards: [card1, card2, card3],
          selectedCardIds: new Set([card1.instanceId]), // Card1 selected for discard
          discardPhase: { active: true, remainingDiscards: 1 },
          playOrderSequence: [],
          playOrderLocked: false,
          planningPhase: false,
          turnNumber: 1,
          handSize: 3,
          discardCount: 1,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = { type: 'CONFIRM_DISCARD' }
        
        const result = deckReducer(state, action)
        
        // Phase transition: Discard → Planning
        expect(result.discardPhase.active).toBe(false)
        expect(result.planningPhase).toBe(true)
        expect(result.playOrderSequence).toEqual([])
        expect(result.playOrderLocked).toBe(false)
        // Cards remain in hand (2 cards: card2, card3)
        expect(result.handCards.length).toBe(2)
      })
      
      // T023: T114 - Skip planning phase when no cards remain
      it('T114: sets planningPhase=false when all cards discarded', () => {
        const card1 = generateCardInstance('Card A')
        const card2 = generateCardInstance('Card B')
        
        const state: DeckState = {
          drawPile: [],
          discardPile: [],
          hand: ['Card A', 'Card B'],
          handCards: [card1, card2],
          selectedCardIds: new Set([card1.instanceId, card2.instanceId]), // All cards selected
          discardPhase: { active: true, remainingDiscards: 2 },
          playOrderSequence: [],
          playOrderLocked: false,
          planningPhase: false,
          turnNumber: 1,
          handSize: 2,
          discardCount: 2,
          warning: null,
          error: null,
          isDealing: false,
        }
        
        const action: DeckAction = { type: 'CONFIRM_DISCARD' }
        
        const result = deckReducer(state, action)
        
        // Phase transition: Discard → (skip Planning) → ready for END_TURN
        expect(result.discardPhase.active).toBe(false)
        expect(result.planningPhase).toBe(false) // Skipped
        expect(result.playOrderSequence).toEqual([])
        expect(result.playOrderLocked).toBe(false)
        expect(result.handCards.length).toBe(0)
      })
      
    })
    
  })
  
})
