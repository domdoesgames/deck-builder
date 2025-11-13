/**
 * HandView component (US1)
 * Displays the current hand of cards as visual card elements in a fan/spread layout
 */

import './HandView.css'

interface HandViewProps {
  hand: string[]
}

export function HandView({ hand }: HandViewProps) {
  return (
    <section aria-labelledby="hand-heading">
      <h2 id="hand-heading">Current Hand</h2>
      {hand.length === 0 ? (
        <div className="hand-container hand-container--empty">
          <p className="hand-empty-message">No cards in hand</p>
        </div>
      ) : (
        <div 
          className="hand-container" 
          style={{ '--card-count': hand.length }}
        >
          {hand.map((card, index) => (
            <div
              key={`${card}-${index}`}
              className="card"
              role="article"
              aria-label={`Card: ${card}`}
              style={{ '--card-index': index }}
            >
              <span className="card__value">{card}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
