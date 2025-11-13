/**
 * Feature 005: localStorage persistence manager (FR-001 to FR-005)
 * Handles saving and loading DeckState with graceful failure handling
 * Tasks: T019-T020, T028
 */

import { DeckState } from './types'
import { STORAGE_KEY } from './constants'
import { validateAndSanitizeDeckState } from './stateValidator'

/**
 * Save deck state to localStorage
 * Excludes transient fields: selectedCardIds, isDealing
 * 
 * @param state - Current deck state
 * @returns true if save succeeded, false if failed (gracefully)
 * 
 * Contract: C-PERSIST-001, C-PERSIST-003
 */
export function saveDeckState(state: DeckState): boolean {
  try {
    // Exclude transient fields (T028)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selectedCardIds, isDealing, ...persistedState } = state

    const serialized = JSON.stringify(persistedState)
    localStorage.setItem(STORAGE_KEY, serialized)
    
    return true
  } catch (error) {
    // Silent failure for quota exceeded, privacy mode, etc. (FR-003)
    console.debug('Failed to save deck state to localStorage:', error)
    return false
  }
}

/**
 * Load deck state from localStorage
 * Returns null if no valid state found
 * Validates and sanitizes loaded data
 * 
 * @returns DeckState with validated data, or null if invalid/missing
 * 
 * Contract: C-PERSIST-002, C-PERSIST-004
 */
export function loadDeckState(): DeckState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    
    if (!serialized || serialized.trim() === '') {
      return null
    }

    const parsed = JSON.parse(serialized)
    
    // Validate and sanitize (FR-005)
    const validationResult = validateAndSanitizeDeckState(parsed)
    
    if (!validationResult.isValid || !validationResult.state) {
      console.debug('Invalid persisted state, using defaults')
      return null
    }

    // Ensure transient fields are reset (T028)
    const loadedState: DeckState = {
      ...validationResult.state,
      selectedCardIds: new Set(), // Always reset
      isDealing: false, // Always reset
    }

    return loadedState
  } catch (error) {
    // JSON parse error or other failures
    console.debug('Failed to load deck state from localStorage:', error)
    return null
  }
}
