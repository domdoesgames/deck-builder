/**
 * Feature 005: localStorage persistence manager (FR-001 to FR-005)
 * Feature 009: Preset deck selection persistence (T011-T013)
 * Handles saving and loading DeckState with graceful failure handling
 * Tasks: T019-T020, T028, T011-T013
 */

import { DeckState } from './types'
import { STORAGE_KEY } from './constants'
import { validateAndSanitizeDeckState } from './stateValidator'

/**
 * Feature 009: Storage key for active preset ID
 */
const PRESET_SELECTION_KEY = 'deck-builder:activePresetId'

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

/**
 * Feature 009: Save preset selection to localStorage (T011)
 * Separate from full deck state for independent persistence
 * 
 * @param presetId - ID of selected preset (null to clear)
 * @returns true if save succeeded, false if failed (gracefully)
 * 
 * Contract: persistenceManager-extension.contract.md C-PERSIST-PRESET-001
 */
export function savePresetSelection(presetId: string | null): boolean {
  try {
    if (presetId === null) {
      localStorage.removeItem(PRESET_SELECTION_KEY)
    } else {
      localStorage.setItem(PRESET_SELECTION_KEY, presetId)
    }
    return true
  } catch (error) {
    // Silent failure for quota exceeded, privacy mode, etc.
    console.debug('Failed to save preset selection to localStorage:', error)
    return false
  }
}

/**
 * Feature 009: Load preset selection from localStorage (T012)
 * Returns null if no selection found or storage unavailable
 * 
 * @returns Preset ID string, or null if not found/invalid
 * 
 * Contract: persistenceManager-extension.contract.md C-PERSIST-PRESET-002
 */
export function loadPresetSelection(): string | null {
  try {
    const presetId = localStorage.getItem(PRESET_SELECTION_KEY)
    
    if (!presetId || presetId.trim() === '') {
      return null
    }
    
    return presetId
  } catch (error) {
    // Silent failure for privacy mode, etc.
    console.debug('Failed to load preset selection from localStorage:', error)
    return null
  }
}

/**
 * Feature 009: Clear preset selection from localStorage (T013)
 * Used when user switches to custom/default deck mode
 * 
 * @returns true if clear succeeded, false if failed (gracefully)
 * 
 * Contract: persistenceManager-extension.contract.md C-PERSIST-PRESET-003
 */
export function clearPresetSelection(): boolean {
  try {
    localStorage.removeItem(PRESET_SELECTION_KEY)
    return true
  } catch (error) {
    // Silent failure
    console.debug('Failed to clear preset selection from localStorage:', error)
    return false
  }
}
