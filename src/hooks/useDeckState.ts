import { useReducer, useCallback } from 'react'
import { DeckState } from '../lib/types'
import { deckReducer } from '../state/deckReducer'
import { loadDeckState, loadPresetSelection } from '../lib/persistenceManager'
import { useDeckStatePersistence } from './useDeckStatePersistence'

/**
 * Custom hook wrapping deck state reducer with imperative helpers
 * Exposes: state, dealNextHand, endTurn, applyJsonOverride, changeParameters
 * Feature 003: Also exposes toggleCardSelection, confirmDiscard
 * Feature 004: Also exposes selectForPlayOrder, deselectFromPlayOrder, lockPlayOrder, clearPlayOrder (T014)
 * Feature 005: Implements automatic persistence to localStorage (T026, T027)
 * Feature 009: Also exposes loadPresetDeck and loads saved preset on initialization (T014)
 */
export function useDeckState() {
  const [state, dispatch] = useReducer(deckReducer, null, () => {
    // Lazy initialization: Try to load persisted state (T027)
    const persistedState = loadDeckState()
    
    // Feature 009: Check for saved preset selection (T014)
    const savedPresetId = loadPresetSelection()
    
    // If both persisted state and preset exist, prefer persisted state
    // (it contains the most recent game progress)
    if (persistedState) {
      return persistedState
    }
    
    // If no persisted state but preset selection exists, load the preset
    if (savedPresetId) {
      const initState = deckReducer({} as DeckState, { type: 'INIT' })
      return deckReducer(initState, { 
        type: 'LOAD_PRESET_DECK', 
        payload: { presetId: savedPresetId } 
      })
    }
    
    // Fall back to INIT action if no persisted state or preset
    return deckReducer({} as DeckState, { type: 'INIT' })
  })
  
  // Auto-save state changes with 100ms debounce (T026)
  useDeckStatePersistence(state)
  
  const dealNextHand = useCallback(() => {
    dispatch({ type: 'DEAL_NEXT_HAND' })
  }, [])
  
  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' })
  }, [])
  
  const applyJsonOverride = useCallback((jsonString: string) => {
    dispatch({ type: 'APPLY_JSON_OVERRIDE', payload: jsonString })
  }, [])
  
  const changeParameters = useCallback((handSize: number, discardCount: number, immediateReset: boolean) => {
    dispatch({ 
      type: 'CHANGE_PARAMETERS', 
      payload: { handSize, discardCount, immediateReset } 
    })
  }, [])
  
  const toggleCardSelection = useCallback((instanceId: string) => {
    dispatch({ type: 'TOGGLE_CARD_SELECTION', payload: { instanceId } })
  }, [])
  
  const confirmDiscard = useCallback(() => {
    dispatch({ type: 'CONFIRM_DISCARD' })
  }, [])
  
  // Feature 004: Play order action dispatchers (T014)
  const selectForPlayOrder = useCallback((instanceId: string) => {
    dispatch({ type: 'SELECT_FOR_PLAY_ORDER', payload: { instanceId } })
  }, [])
  
  const deselectFromPlayOrder = useCallback((instanceId: string) => {
    dispatch({ type: 'DESELECT_FROM_PLAY_ORDER', payload: { instanceId } })
  }, [])
  
  const lockPlayOrder = useCallback(() => {
    dispatch({ type: 'LOCK_PLAY_ORDER' })
  }, [])
  
  const clearPlayOrder = useCallback(() => {
    dispatch({ type: 'CLEAR_PLAY_ORDER' })
  }, [])
  
  // Feature 006: Reset action dispatcher (T004)
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])
  
  // Feature 009: Load preset deck action dispatcher (T014)
  const loadPresetDeck = useCallback((presetId: string) => {
    dispatch({ type: 'LOAD_PRESET_DECK', payload: { presetId } })
  }, [])
  
  // Feature 009: Start custom deck mode (T027)
  const startCustomDeck = useCallback(() => {
    dispatch({ type: 'START_CUSTOM_DECK' })
  }, [])
  
  return {
    state,
    dealNextHand,
    endTurn,
    applyJsonOverride,
    changeParameters,
    toggleCardSelection,
    confirmDiscard,
    selectForPlayOrder,
    deselectFromPlayOrder,
    lockPlayOrder,
    clearPlayOrder,
    reset,
    loadPresetDeck,
    startCustomDeck,
  }
}
