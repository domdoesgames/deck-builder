import { useReducer, useCallback } from 'react'
import { DeckState } from '../lib/types'
import { deckReducer } from '../state/deckReducer'

/**
 * Custom hook wrapping deck state reducer with imperative helpers
 * Exposes: state, dealNextHand, endTurn, applyJsonOverride, changeParameters
 */
export function useDeckState() {
  const [state, dispatch] = useReducer(deckReducer, null, () => {
    // Lazy initialization with INIT action
    return deckReducer({} as DeckState, { type: 'INIT' })
  })
  
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
  
  return {
    state,
    dealNextHand,
    endTurn,
    applyJsonOverride,
    changeParameters,
  }
}
