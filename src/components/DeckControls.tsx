import { DeckState } from '../lib/types'

/**
 * DeckControls component (US1)
 * Controls for hand size, discard count, and End Turn button
 */

interface DeckControlsProps {
  state: DeckState
  onEndTurn: () => void
  onChangeParameters: (handSize: number, discardCount: number, immediateReset: boolean) => void
}

export function DeckControls({ state, onEndTurn, onChangeParameters }: DeckControlsProps) {
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
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(count => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>

        <button 
          onClick={onEndTurn} 
          disabled={state.isDealing}
          aria-label="End turn"
        >
          End Turn
        </button>
      </div>
    </div>
  )
}
