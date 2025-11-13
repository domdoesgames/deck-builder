import { deckReducer } from '../../src/state/deckReducer'
import type { DeckState, DeckAction } from '../../src/lib/types'

describe('deckReducer', () => {
  test.todo('INIT action should initialize deck state')
  
  test.todo('DEAL_NEXT_HAND should deal correct number of cards')
  
  test.todo('END_TURN should move hand to discard pile')
  
  test.todo('APPLY_JSON_OVERRIDE should replace deck')
  
  test.todo('CHANGE_PARAMETERS with immediateReset should reset state')
})

describe('dealNextHand', () => {
  test.todo('should reshuffle discard pile when draw pile is empty')
  
  test.todo('should set warning when insufficient cards')
  
  test('should generate CardInstance objects for each card in hand', () => {
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

    const action: DeckAction = {
      type: 'DEAL_NEXT_HAND',
    }

    const nextState = deckReducer(state, action)

    // Verify handCards created
    expect(nextState.handCards).toHaveLength(3)
    
    // Verify each has instanceId and card
    nextState.handCards.forEach((cardInstance) => {
      expect(cardInstance.instanceId).toBeDefined()
      expect(typeof cardInstance.instanceId).toBe('string')
      expect(cardInstance.card).toBeDefined()
      expect(typeof cardInstance.card).toBe('string')
    })

    // Verify instanceIds are unique
    const instanceIds = nextState.handCards.map(c => c.instanceId)
    const uniqueIds = new Set(instanceIds)
    expect(uniqueIds.size).toBe(3)
  })
  
  test('should initialize discardPhase with active=true when discardCount > 0', () => {
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

    const action: DeckAction = {
      type: 'DEAL_NEXT_HAND',
    }

    const nextState = deckReducer(state, action)

    expect(nextState.discardPhase.active).toBe(true)
    expect(nextState.discardPhase.remainingDiscards).toBe(2)
  })
  
  test('should set remainingDiscards to min(discardCount, handCards.length)', () => {
    // Test when discardCount > handCards.length
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

    const action: DeckAction = {
      type: 'DEAL_NEXT_HAND',
    }

    const nextState = deckReducer(state, action)

    // Should cap at handCards.length
    expect(nextState.discardPhase.remainingDiscards).toBe(2)
  })
  
  test.todo('should clear selectedCardIds when dealing new hand')
})

describe('endTurn', () => {
  test.todo('should ignore action when isDealing is true')
  
  test.todo('should increment turn number')
})

describe('TOGGLE_CARD_SELECTION', () => {
  test('should add instanceId to selectedCardIds when not already selected', () => {
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

    const action: DeckAction = {
      type: 'TOGGLE_CARD_SELECTION',
      payload: { instanceId: 'card-1' },
    }

    const nextState = deckReducer(state, action)

    expect(nextState.selectedCardIds.has('card-1')).toBe(true)
    expect(nextState.selectedCardIds.size).toBe(1)
  })
  
  test.todo('should remove instanceId from selectedCardIds when already selected')
  
  test.todo('should not exceed discardPhase.remainingDiscards selections')
  
  test.todo('should only work when discardPhase.active is true')
  
  test.todo('should ignore invalid instanceIds not in handCards')
})

describe('CONFIRM_DISCARD', () => {
  test('should remove selected cards from handCards and add to discardPile', () => {
    const state: DeckState = {
      drawPile: ['A', 'B', 'C'],
      discardPile: ['X'],
      hand: ['D', 'E', 'F'],
      handCards: [
        { instanceId: 'card-1', card: 'D' },
        { instanceId: 'card-2', card: 'E' },
        { instanceId: 'card-3', card: 'F' },
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

    const action: DeckAction = {
      type: 'CONFIRM_DISCARD',
    }

    const nextState = deckReducer(state, action)

    // Verify selected cards removed from handCards
    expect(nextState.handCards).toHaveLength(1)
    expect(nextState.handCards[0].instanceId).toBe('card-2')
    expect(nextState.handCards[0].card).toBe('E')

    // Verify selected cards added to discardPile
    expect(nextState.discardPile).toEqual(['X', 'D', 'F'])

    // Verify hand array updated
    expect(nextState.hand).toEqual(['E'])

    // Verify selectedCardIds cleared
    expect(nextState.selectedCardIds.size).toBe(0)

    // Verify discard phase ended
    expect(nextState.discardPhase.active).toBe(false)
    expect(nextState.discardPhase.remainingDiscards).toBe(0)
  })
  
  test.todo('should only work when discardPhase.active is true')
  
  test.todo('should handle empty selection (no cards selected)')
  
  test.todo('should preserve non-selected cards in hand')
})
