import { DeckState } from '../lib/types'
import { useState, useEffect } from 'react'

/**
 * DeckControls component (US1)
 * Controls for hand size, discard count, and End Turn button
 * Feature 006: Now includes Reset button
 */

interface DeckControlsProps {
  state: DeckState
  onEndTurn: () => void
  onChangeParameters: (handSize: number, discardCount: number, immediateReset: boolean) => void
  reset: () => void  // Feature 006: Reset action (T005)
}

export function DeckControls({ state, onChangeParameters, reset }: DeckControlsProps) {
  // Feature 006: Track button disabled state (T006, C010)
  const [isResetting, setIsResetting] = useState(false)

  // Reset the disabled state after state update completes
  useEffect(() => {
    if (isResetting) {
      setIsResetting(false)
    }
  }, [state, isResetting])

  const handleHandSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHandSize = parseInt(e.target.value, 10)
    const isMidTurn = state.hand.length > 0
    onChangeParameters(newHandSize, state.discardCount, isMidTurn)
  }

  const handleDiscardCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDiscardCount = parseInt(e.target.value, 10)
    const isMidTurn = state.hand.length > 0
    onChangeParameters(state.handSize, newDiscardCount, isMidTurn)
  }

  // Feature 006: Reset handler (T006)
  const handleReset = () => {
    setIsResetting(true)
    reset()
  }

  return (
    <div>
      <h2>Deck Controls</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <label>
          Hand Size:
          <select 
            value={state.handSize} 
            onChange={handleHandSizeChange}
            aria-label="Hand size"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <label>
          Discard Count:
          <select 
            value={state.discardCount} 
            onChange={handleDiscardCountChange}
            aria-label="Discard count"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(count => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>

        {/* Feature 006: Reset button (T006, C010) */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          aria-label="Reset game"
          title="Reset the game to initial state while preserving hand size and discard count settings"
        >
          {isResetting ? 'Resetting...' : 'Reset'}
        </button>
      </div>
    </div>
  )
}
