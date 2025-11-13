/**
 * Unit tests for stateValidator (Feature 005, Phase 1)
 * Tests validation and sanitization of persisted deck state
 * Tasks: T010-T013
 */

import { validateAndSanitizeDeckState } from '../../src/lib/stateValidator'
import { DeckState } from '../../src/lib/types'

describe('stateValidator', () => {
  const validState: DeckState = {
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
    isDealing: false,
    selectedCardIds: new Set(),
    discardPhase: { active: false, remainingDiscards: 0 },
    playOrderSequence: ['id1'],
    playOrderLocked: false,
    planningPhase: true,
  }

  describe('validateAndSanitizeDeckState()', () => {
    // T010: Valid state passes through
    it('should return valid state unchanged', () => {
      const result = validateAndSanitizeDeckState(validState)

      expect(result.isValid).toBe(true)
      expect(result.state).toEqual(validState)
      expect(result.errors).toEqual([])
    })

    // T011: Invalid types - arrays as objects
    it('should handle invalid array types (reject non-string elements)', () => {
      const invalidState = {
        ...validState,
        drawPile: ['A', 123, 'B', null, 'C'], // Mixed types
        hand: [true, 'E', { card: 'invalid' }], // Non-strings
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      // Should filter out invalid elements
      expect(result.state?.drawPile).toEqual(['A', 'B', 'C'])
      expect(result.state?.hand).toEqual(['E'])
    })

    // T011: Invalid handCards array
    it('should handle invalid handCards (missing required fields)', () => {
      const invalidState = {
        ...validState,
        handCards: [
          { instanceId: 'id1', card: 'A' },
          { instanceId: 'id2' }, // Missing 'card'
          { card: 'B' }, // Missing 'instanceId'
          'not an object', // Completely invalid
        ],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      // Should filter out invalid cards
      expect(result.state?.handCards).toEqual([
        { instanceId: 'id1', card: 'A' },
      ])
    })

    // T012: Out-of-range numbers
    it('should clamp out-of-range numeric values', () => {
      const invalidState = {
        ...validState,
        turnNumber: -5, // Negative
        handSize: 100, // Too large (max 10)
        discardCount: -2, // Negative (min 0)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.turnNumber).toBe(1) // Clamped to min 1
      expect(result.state?.handSize).toBe(10) // Clamped to max 10
      expect(result.state?.discardCount).toBe(0) // Clamped to min 0
    })

    // T012: Non-numeric values for numbers
    it('should reset non-numeric values to defaults', () => {
      const invalidState = {
        ...validState,
        turnNumber: 'not a number',
        handSize: null,
        discardCount: undefined,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.turnNumber).toBe(1) // Default
      expect(result.state?.handSize).toBe(5) // Default
      expect(result.state?.discardCount).toBe(2) // Default
    })

    // T013: Missing required fields
    it('should add default values for missing required fields', () => {
      const partialState = {
        drawPile: ['A', 'B'],
        // Missing almost everything
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(partialState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.discardPile).toEqual([])
      expect(result.state?.hand).toEqual([])
      expect(result.state?.handCards).toEqual([])
      expect(result.state?.turnNumber).toBe(1)
      expect(result.state?.handSize).toBe(5)
      expect(result.state?.discardCount).toBe(2)
      expect(result.state?.selectedCardIds).toEqual(new Set())
      expect(result.state?.playOrderSequence).toEqual([])
      expect(result.state?.playOrderLocked).toBe(false)
      expect(result.state?.planningPhase).toBe(false)
    })

    // T013: Completely invalid input (null/undefined)
    it('should return null for null input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(null as any)

      expect(result.isValid).toBe(false)
      expect(result.state).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
    })

    // T013: Completely invalid input (non-object)
    it('should return null for non-object input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState('not an object' as any)

      expect(result.isValid).toBe(false)
      expect(result.state).toBeNull()
    })

    // Forward compatibility: Extra fields preserved
    it('should preserve unknown fields for forward compatibility', () => {
      const stateWithExtra = {
        ...validState,
        futureField: 'some future data',
        anotherNewField: 123,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(stateWithExtra as any)

      expect(result.isValid).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.state as any).futureField).toBe('some future data')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.state as any).anotherNewField).toBe(123)
    })

    // Boolean coercion
    it('should coerce boolean fields to boolean type', () => {
      const invalidState = {
        ...validState,
        playOrderLocked: 'true', // String
        planningPhase: 1, // Number
        isDealing: 'false', // String
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.playOrderLocked).toBe(true) // Coerced to boolean
      expect(result.state?.planningPhase).toBe(true) // Truthy number
      expect(result.state?.isDealing).toBe(false) // Should be reset anyway
    })

    // discardPhase validation
    it('should validate and sanitize discardPhase object', () => {
      const invalidState = {
        ...validState,
        discardPhase: {
          active: 'not a boolean',
          remainingDiscards: 'not a number',
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.discardPhase.active).toBe(false)
      expect(result.state?.discardPhase.remainingDiscards).toBe(0)
    })

    // playOrderSequence validation
    it('should filter invalid elements from playOrderSequence', () => {
      const invalidState = {
        ...validState,
        playOrderSequence: ['id1', 123, 'id2', null, 'id3'],
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateAndSanitizeDeckState(invalidState as any)

      expect(result.isValid).toBe(true)
      expect(result.state?.playOrderSequence).toEqual(['id1', 'id2', 'id3'])
    })
  })
})
