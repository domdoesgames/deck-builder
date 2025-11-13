/**
 * Feature 005: Persistence hook (FR-001 to FR-005)
 * Manages automatic state persistence with debouncing
 * Tasks: T025
 */

import { useEffect, useRef } from 'react'
import { DeckState } from '../lib/types'
import { saveDeckState } from '../lib/persistenceManager'

/**
 * Hook to persist deck state to localStorage with debouncing
 * Saves state 100ms after last change to avoid excessive writes
 * 
 * @param state - Current deck state to persist
 * 
 * Contract: C-PERSIST-001, C-PERSIST-002
 */
export function useDeckStatePersistence(state: DeckState): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any pending saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce: save 100ms after last state change
    timeoutRef.current = setTimeout(() => {
      saveDeckState(state)
    }, 100)

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [state])
}
