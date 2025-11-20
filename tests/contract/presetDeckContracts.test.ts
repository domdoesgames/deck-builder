/**
 * Contract tests for preset deck validation (Feature 009, Phase 3)
 * Tests validation rules from contracts/presetDeckValidator.contract.md
 * Task: T020
 */

import { validatePresetDeck } from '../../src/lib/presetDeckValidator'
import { PresetDeck } from '../../src/lib/types'

describe('Preset Deck Validator Contracts', () => {
  const validPresetDeck: PresetDeck = {
    id: 'test-deck',
    name: 'Test Deck',
    description: 'A valid test deck for testing',
    cards: ['Card 1', 'Card 2', 'Card 3'],
  }

  describe('Rule 1: Type Check', () => {
    it('should reject null input', () => {
      const result = validatePresetDeck(null)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must be an object')
    })

    it('should reject array input', () => {
      const result = validatePresetDeck([])
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must be an object')
    })

    it('should reject primitive input (string)', () => {
      const result = validatePresetDeck('not an object')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must be an object')
    })

    it('should reject primitive input (number)', () => {
      const result = validatePresetDeck(123)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must be an object')
    })
  })

  describe('Rule 2: ID Field Validation', () => {
    it('should reject missing id field', () => {
      const { id, ...deckWithoutId } = validPresetDeck
      const result = validatePresetDeck(deckWithoutId)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "id" field')
    })

    it('should reject empty string id', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: '' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "id" field')
    })

    it('should reject whitespace-only id', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: '   ' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "id" field')
    })

    it('should reject non-kebab-case id (spaces)', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: 'test deck' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true)
    })

    it('should reject non-kebab-case id (uppercase)', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: 'Test-Deck' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true)
    })

    it('should reject non-kebab-case id (underscores)', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: 'test_deck' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true)
    })

    it('should accept valid kebab-case id', () => {
      const result = validatePresetDeck({ ...validPresetDeck, id: 'valid-deck-id-123' })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Rule 3: Name Field Validation', () => {
    it('should reject missing name field', () => {
      const { name, ...deckWithoutName } = validPresetDeck
      const result = validatePresetDeck(deckWithoutName)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "name" field')
    })

    it('should reject empty string name', () => {
      const result = validatePresetDeck({ ...validPresetDeck, name: '' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "name" field')
    })

    it('should reject whitespace-only name', () => {
      const result = validatePresetDeck({ ...validPresetDeck, name: '   ' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "name" field')
    })

    it('should reject name longer than 50 characters', () => {
      const longName = 'A'.repeat(51)
      const result = validatePresetDeck({ ...validPresetDeck, name: longName })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('50 characters or less'))).toBe(true)
      expect(result.errors.some(e => e.includes('current: 51'))).toBe(true)
    })

    it('should accept name exactly 50 characters', () => {
      const name50 = 'A'.repeat(50)
      const result = validatePresetDeck({ ...validPresetDeck, name: name50 })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Rule 4: Description Field Validation', () => {
    it('should reject missing description field', () => {
      const { description, ...deckWithoutDesc } = validPresetDeck
      const result = validatePresetDeck(deckWithoutDesc)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "description" field')
    })

    it('should reject empty string description', () => {
      const result = validatePresetDeck({ ...validPresetDeck, description: '' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "description" field')
    })

    it('should reject whitespace-only description', () => {
      const result = validatePresetDeck({ ...validPresetDeck, description: '   ' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a non-empty "description" field')
    })

    it('should reject description longer than 200 characters', () => {
      const longDesc = 'A'.repeat(201)
      const result = validatePresetDeck({ ...validPresetDeck, description: longDesc })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('200 characters or less'))).toBe(true)
      expect(result.errors.some(e => e.includes('current: 201'))).toBe(true)
    })

    it('should accept description exactly 200 characters', () => {
      const desc200 = 'A'.repeat(200)
      const result = validatePresetDeck({ ...validPresetDeck, description: desc200 })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Rule 5: Cards Array Validation', () => {
    it('should reject missing cards field', () => {
      const { cards, ...deckWithoutCards } = validPresetDeck
      const result = validatePresetDeck(deckWithoutCards)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a "cards" field that is an array')
    })

    it('should reject non-array cards field', () => {
      const result = validatePresetDeck({ ...validPresetDeck, cards: 'not an array' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck must have a "cards" field that is an array')
    })

    it('should reject empty cards array', () => {
      const result = validatePresetDeck({ ...validPresetDeck, cards: [] })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Preset deck "cards" array must contain at least 1 card')
    })

    it('should reject non-string card elements', () => {
      const result = validatePresetDeck({ 
        ...validPresetDeck, 
        cards: ['Card 1', 123, 'Card 3'] 
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('index 1'))).toBe(true)
    })

    it('should reject empty string card elements', () => {
      const result = validatePresetDeck({ 
        ...validPresetDeck, 
        cards: ['Card 1', '', 'Card 3'] 
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('index 1'))).toBe(true)
    })

    it('should reject whitespace-only card elements', () => {
      const result = validatePresetDeck({ 
        ...validPresetDeck, 
        cards: ['Card 1', '   ', 'Card 3'] 
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('index 1'))).toBe(true)
    })

    it('should accept valid cards array', () => {
      const result = validatePresetDeck({ 
        ...validPresetDeck, 
        cards: ['Card 1', 'Card 2', 'Card 3'] 
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Rule 6: Multiple Errors Accumulated', () => {
    it('should collect multiple errors from different fields', () => {
      const invalidDeck = {
        id: '',
        name: '',
        description: '',
        cards: [],
      }
      const result = validatePresetDeck(invalidDeck)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)
    })

    it('should collect multiple errors from same field', () => {
      const invalidDeck = {
        ...validPresetDeck,
        id: 'Invalid ID',  // Both non-empty check and kebab-case check fail
      }
      const result = validatePresetDeck(invalidDeck)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('kebab-case'))).toBe(true)
    })
  })

  describe('Success Case', () => {
    it('should pass validation for completely valid preset deck', () => {
      const result = validatePresetDeck(validPresetDeck)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.deck).toEqual(validPresetDeck)
    })

    it('should pass validation for preset with many cards', () => {
      const manyCards = Array.from({ length: 52 }, (_, i) => `Card ${i + 1}`)
      const result = validatePresetDeck({ 
        ...validPresetDeck, 
        cards: manyCards 
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })
})
