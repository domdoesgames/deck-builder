/**
 * Feature 005: State validator and sanitizer (FR-005)
 * Validates and sanitizes loaded state to prevent corruption
 * Tasks: T021-T024
 */

import { DeckState, CardInstance, DiscardPhase, ValidationResult } from './types'
import {
  DEFAULT_HAND_SIZE,
  DEFAULT_DISCARD_COUNT,
  MIN_HAND_SIZE,
  MAX_HAND_SIZE,
  MIN_DISCARD_COUNT,
  MAX_DISCARD_COUNT,
} from './constants'

/**
 * Validate and sanitize persisted deck state
 * Implements defensive validation with graceful fallbacks
 * 
 * @param data - Raw data loaded from localStorage
 * @returns ValidationResult with sanitized state or null if critically invalid
 * 
 * Contract: C-PERSIST-004
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateAndSanitizeDeckState(data: any): ValidationResult {
  const errors: string[] = []

  // Critical validation: must be an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('State must be a non-null object')
    return { isValid: false, state: null, errors }
  }

  try {
    // Build sanitized state with defaults
    const sanitized: DeckState = {
      // Arrays (filter invalid elements)
      drawPile: sanitizeStringArray(data.drawPile, 'drawPile', errors),
      discardPile: sanitizeStringArray(data.discardPile, 'discardPile', errors),
      hand: sanitizeStringArray(data.hand, 'hand', errors),
      handCards: sanitizeCardInstances(data.handCards, errors),
      playOrderSequence: sanitizeStringArray(data.playOrderSequence, 'playOrderSequence', errors),

      // Numbers (clamp to valid ranges)
      turnNumber: sanitizeNumber(data.turnNumber, 1, Number.MAX_SAFE_INTEGER, 1, 'turnNumber', errors),
      handSize: sanitizeNumber(data.handSize, MIN_HAND_SIZE, MAX_HAND_SIZE, DEFAULT_HAND_SIZE, 'handSize', errors),
      discardCount: sanitizeNumber(data.discardCount, MIN_DISCARD_COUNT, MAX_DISCARD_COUNT, DEFAULT_DISCARD_COUNT, 'discardCount', errors),

      // Strings/Nulls
      warning: typeof data.warning === 'string' ? data.warning : null,
      error: typeof data.error === 'string' ? data.error : null,

      // Booleans (coerce to boolean)
      playOrderLocked: Boolean(data.playOrderLocked),
      planningPhase: Boolean(data.planningPhase),

      // Complex objects
      discardPhase: sanitizeDiscardPhase(data.discardPhase, errors),

      // Transient fields (always reset to defaults)
      selectedCardIds: new Set<string>(),
      isDealing: false,

      // Preserve any extra fields for forward compatibility
      ...getExtraFields(data),
    }

    return {
      isValid: true,
      state: sanitized,
      errors,
    }
  } catch (error) {
    errors.push(`Validation failed: ${error}`)
    return { isValid: false, state: null, errors }
  }
}

/**
 * Sanitize string array - filter out non-string elements
 */
function sanitizeStringArray(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  fieldName: string,
  errors: string[]
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} is not an array, using empty array`)
    return []
  }

  const filtered = value.filter(item => typeof item === 'string')
  
  if (filtered.length !== value.length) {
    errors.push(`${fieldName} had invalid elements removed`)
  }

  return filtered
}

/**
 * Sanitize CardInstance array - filter out invalid card objects
 */
function sanitizeCardInstances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  errors: string[]
): CardInstance[] {
  if (!Array.isArray(value)) {
    errors.push('handCards is not an array, using empty array')
    return []
  }

  const filtered = value.filter(item => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.instanceId === 'string' &&
      typeof item.card === 'string'
    )
  })

  if (filtered.length !== value.length) {
    errors.push('handCards had invalid elements removed')
  }

  return filtered
}

/**
 * Sanitize number - clamp to valid range, use default if invalid
 */
function sanitizeNumber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  min: number,
  max: number,
  defaultValue: number,
  fieldName: string,
  errors: string[]
): number {
  // Check for null/undefined first before coercion
  if (value == null) {
    errors.push(`${fieldName} is not a valid number, using default ${defaultValue}`)
    return defaultValue
  }

  const num = Number(value)

  if (isNaN(num) || !isFinite(num)) {
    errors.push(`${fieldName} is not a valid number, using default ${defaultValue}`)
    return defaultValue
  }

  const clamped = Math.max(min, Math.min(max, Math.floor(num)))

  if (clamped !== num) {
    errors.push(`${fieldName} was clamped from ${num} to ${clamped}`)
  }

  return clamped
}

/**
 * Sanitize DiscardPhase object
 */
function sanitizeDiscardPhase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  errors: string[]
): DiscardPhase {
  if (!value || typeof value !== 'object') {
    errors.push('discardPhase is invalid, using defaults')
    return { active: false, remainingDiscards: 0 }
  }

  const active = typeof value.active === 'boolean' ? value.active : false
  const remainingDiscards = sanitizeNumber(
    value.remainingDiscards,
    0,
    MAX_DISCARD_COUNT,
    0,
    'discardPhase.remainingDiscards',
    errors
  )

  return { active, remainingDiscards }
}

/**
 * Extract unknown fields for forward compatibility
 * Preserves fields not in DeckState interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExtraFields(data: any): Record<string, any> {
  const knownFields = new Set([
    'drawPile',
    'discardPile',
    'hand',
    'handCards',
    'playOrderSequence',
    'turnNumber',
    'handSize',
    'discardCount',
    'warning',
    'error',
    'playOrderLocked',
    'planningPhase',
    'discardPhase',
    'selectedCardIds',
    'isDealing',
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extra: Record<string, any> = {}

  for (const key in data) {
    if (!knownFields.has(key)) {
      extra[key] = data[key]
    }
  }

  return extra
}
