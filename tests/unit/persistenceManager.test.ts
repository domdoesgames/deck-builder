/**
 * Unit tests for persistenceManager (Feature 005, Phase 1)
 * Tests localStorage persistence with graceful failure handling
 * Tasks: T004-T009
 */

import { saveDeckState, loadDeckState } from '../../src/lib/persistenceManager'
import { DeckState } from '../../src/lib/types'

describe('persistenceManager', () => {
  const mockState: DeckState = {
    drawPile: ['A', 'B', 'C'],
    discardPile: ['D'],
    hand: ['E', 'F'],
    handCards: [
      { instanceId: 'id1', card: 'E' },
      { instanceId: 'id2', card: 'F' },
    ],
    turnNumber: 5,
    handSize: 3,
    discardCount: 2,
    warning: 'test warning',
    error: null,
    isDealing: true, // Should NOT persist
    selectedCardIds: new Set(['id1']), // Should NOT persist
    discardPhase: { active: false, remainingDiscards: 0 },
    playOrderSequence: ['id1', 'id2'],
    playOrderLocked: true,
    planningPhase: false,
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('saveDeckState()', () => {
    // T004: Success case
    it('should save state to localStorage successfully', () => {
      const result = saveDeckState(mockState)

      expect(result).toBe(true)
      expect(localStorage.getItem('deck-builder-state')).toBeTruthy()

      const saved = JSON.parse(localStorage.getItem('deck-builder-state')!)
      expect(saved.turnNumber).toBe(5)
      expect(saved.handSize).toBe(3)
      expect(saved.playOrderLocked).toBe(true)
    })

    // T004: Verify transient fields NOT persisted
    it('should exclude selectedCardIds and isDealing from persistence', () => {
      saveDeckState(mockState)

      const saved = JSON.parse(localStorage.getItem('deck-builder-state')!)
      expect(saved.selectedCardIds).toBeUndefined()
      expect(saved.isDealing).toBeUndefined()
    })

    // T005: Quota exceeded handling
    it('should handle quota exceeded error silently', () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError
      })

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

      const result = saveDeckState(mockState)

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    // T006: Privacy mode failure
    it('should handle privacy mode failure silently', () => {
      // Mock localStorage.setItem to throw DOMException
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Failed to write to storage', 'SecurityError')
      })

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

      const result = saveDeckState(mockState)

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
      setItemSpy.mockRestore()
    })
  })

  describe('loadDeckState()', () => {
    // T007: Success case with valid data
    it('should load valid state from localStorage', () => {
      const validState = {
        drawPile: ['A', 'B'],
        discardPile: [],
        hand: ['C'],
        handCards: [{ instanceId: 'id1', card: 'C' }],
        turnNumber: 10,
        handSize: 5,
        discardCount: 2,
        warning: null,
        error: null,
        discardPhase: { active: false, remainingDiscards: 0 },
        playOrderSequence: [],
        playOrderLocked: false,
        planningPhase: false,
      }

      localStorage.setItem('deck-builder-state', JSON.stringify(validState))

      const loaded = loadDeckState()

      expect(loaded).toBeTruthy()
      expect(loaded!.turnNumber).toBe(10)
      expect(loaded!.handSize).toBe(5)
      expect(loaded!.drawPile).toEqual(['A', 'B'])
    })

    // T007: Verify transient fields reset to defaults
    it('should reset transient fields (selectedCardIds, isDealing) to defaults', () => {
      const stateWithTransient = {
        ...mockState,
        selectedCardIds: ['id1', 'id2'], // Will be in JSON as array
        isDealing: true,
      }

      localStorage.setItem('deck-builder-state', JSON.stringify(stateWithTransient))

      const loaded = loadDeckState()

      expect(loaded).toBeTruthy()
      // Transient fields should be reset
      expect(loaded!.selectedCardIds).toEqual(new Set())
      expect(loaded!.isDealing).toBe(false)
    })

    // T008: Corrupted JSON
    it('should return null for corrupted JSON data', () => {
      localStorage.setItem('deck-builder-state', '{invalid json}')

      const loaded = loadDeckState()

      expect(loaded).toBeNull()
    })

    // T009: Missing key
    it('should return null when localStorage key is missing', () => {
      const loaded = loadDeckState()

      expect(loaded).toBeNull()
    })

    // T009: Empty string value
    it('should return null for empty string value', () => {
      localStorage.setItem('deck-builder-state', '')

      const loaded = loadDeckState()

      expect(loaded).toBeNull()
    })
  })
})
