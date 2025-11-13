import { useReducer, useCallback } from 'react'
import { DeckState } from '../lib/types'
import { deckReducer } from '../state/deckReducer'
import { loadDeckState } from '../lib/persistenceManager'
import { useDeckStatePersistence } from './useDeckStatePersistence'

/**
 * Custom hook wrapping deck state reducer with imperative helpers
 * Exposes: state, dealNextHand, endTurn, applyJsonOverride, changeParameters
 * Feature 003: Also exposes toggleCardSelection, confirmDiscard
 * Feature 004: Also exposes selectForPlayOrder, deselectFromPlayOrder, lockPlayOrder, clearPlayOrder (T014)
 * Feature 005: Implements automatic persistence to localStorage (T026, T027)
 */
export function useDeckState() {
  const [state, dispatch] = useReducer(deckReducer, null, () => {
    // Lazy initialization: Try to load persisted state (T027)
    const persistedState = loadDeckState()
    
    if (persistedState) {
      return persistedState
    }
    
    // Fall back to INIT action if no persisted state
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
  }
}
