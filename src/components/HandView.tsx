/**
 * HandView component (US1)
 * Displays the current hand of cards as visual card elements in a fan/spread layout
 * Feature 003: Supports card selection for discard mechanic
 * Feature 004: Supports play order selection with sequence numbers (T024-T031)
 */

import './HandView.css'
import { CardInstance } from '../lib/types'

interface HandViewProps {
  hand: string[]  // Deprecated: kept for backward compatibility
  handCards: CardInstance[]
  selectedCardIds: Set<string>
  onToggleCardSelection: (instanceId: string) => void
  // Feature 003: Discard phase props
  discardPhaseActive?: boolean
  remainingDiscards?: number
  onConfirmDiscard?: () => void
  // Feature 004: Play order props (T024)
  playOrderSequence?: string[]
  planningPhase?: boolean
  playOrderLocked?: boolean
  onSelectForPlayOrder?: (instanceId: string) => void
  onDeselectFromPlayOrder?: (instanceId: string) => void
  onLockPlayOrder?: () => void
  onClearPlayOrder?: () => void
}

/**
 * Get sequence number for a card in play order (T025)
 * @returns 1-based sequence number, or null if not in sequence
 */
function getSequenceNumber(instanceId: string, playOrderSequence: string[]): number | null {
  const index = playOrderSequence.indexOf(instanceId)
  return index >= 0 ? index + 1 : null
}

/**
 * Get accessible label for card with play order info (T028)
 */
function getCardAriaLabel(
  card: string,
  isSelected: boolean,
  sequenceNumber: number | null,
  planningPhase: boolean
): string {
  let label = `Card: ${card}`
  
  if (planningPhase && sequenceNumber !== null) {
    label += `, Play order: ${sequenceNumber}`
  }
  
  if (isSelected) {
    label += ', Selected for discard'
  }
  
  return label
}

export function HandView({ 
  hand, 
  handCards, 
  selectedCardIds, 
  onToggleCardSelection,
  discardPhaseActive = false,
  remainingDiscards = 0,
  onConfirmDiscard,
  playOrderSequence = [],
  planningPhase = false,
  playOrderLocked = false,
  onSelectForPlayOrder,
  onDeselectFromPlayOrder,
  onLockPlayOrder,
  onClearPlayOrder,
}: HandViewProps) {
  // Use handCards if available, fallback to legacy hand
  const cardsToDisplay = handCards.length > 0 ? handCards : hand.map((card, index) => ({ 
    instanceId: `legacy-${index}`, 
    card 
  }))

  /**
   * Handle card click - dispatch to appropriate handler (T026)
   * T053: Block all interactions when play order is locked
   */
  const handleCardClick = (instanceId: string) => {
    // T053: Early return when locked (FR-010, FR-012)
    if (playOrderLocked) return
    
    if (planningPhase) {
      // During planning phase: select/deselect for play order
      const sequenceNumber = getSequenceNumber(instanceId, playOrderSequence)
      if (sequenceNumber !== null && onDeselectFromPlayOrder) {
        onDeselectFromPlayOrder(instanceId)
      } else if (onSelectForPlayOrder) {
        onSelectForPlayOrder(instanceId)
      }
    } else {
      // During discard phase: toggle selection for discard
      onToggleCardSelection(instanceId)
    }
  }

  /**
   * Handle keyboard interaction (T027)
   * T054: Block keyboard events when play order is locked
   */
  const handleKeyPress = (e: React.KeyboardEvent, instanceId: string) => {
    // T054: Early return when locked (FR-010, FR-012)
    if (playOrderLocked) return
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleCardClick(instanceId)
    }
  }

  return (
    <section aria-labelledby="hand-heading">
      <h2 id="hand-heading">Current Hand</h2>
      {cardsToDisplay.length === 0 ? (
        <div className="hand-container hand-container--empty">
          <p className="hand-empty-message">No cards in hand</p>
        </div>
      ) : (
        <div 
          className="hand-container"
          data-planning-phase={planningPhase}
          style={{ '--card-count': cardsToDisplay.length } as React.CSSProperties}
        >
          {cardsToDisplay.map((cardInstance, index) => {
            const isSelected = selectedCardIds.has(cardInstance.instanceId)
            const sequenceNumber = getSequenceNumber(cardInstance.instanceId, playOrderSequence)
            const ariaLabel = getCardAriaLabel(
              cardInstance.card,
              isSelected,
              sequenceNumber,
              planningPhase
            )
            
            return (
              <div
                key={cardInstance.instanceId}
                data-testid={`card-${cardInstance.instanceId}`}
                className={`card ${isSelected ? 'selected' : ''} ${playOrderLocked ? 'card--locked' : ''}`}
                role="button"
                tabIndex={playOrderLocked ? -1 : 0}
                aria-label={ariaLabel}
                aria-pressed={isSelected}
                onClick={() => handleCardClick(cardInstance.instanceId)}
                onKeyDown={(e) => handleKeyPress(e, cardInstance.instanceId)}
                style={{ '--card-index': index } as React.CSSProperties}
              >
                <span className="card__value">{cardInstance.card}</span>
                {/* T029: Display sequence number badge when card is ordered */}
                {sequenceNumber !== null && (
                  <span className="card__sequence-badge" aria-hidden="true">
                    {sequenceNumber}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Feature 003: Discard button (only show during discard phase) */}
      {discardPhaseActive && onConfirmDiscard && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={onConfirmDiscard}
            disabled={selectedCardIds.size !== remainingDiscards}
            aria-label="Discard selected cards"
          >
            Discard Selected Cards
          </button>
          
          {/* Helper text for discard phase */}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            {selectedCardIds.size === remainingDiscards
              ? `✓ Ready to discard ${remainingDiscards} card(s)`
              : `Select ${remainingDiscards} card(s) to discard (${selectedCardIds.size} selected)`
            }
          </p>
        </div>
      )}

      {/* Feature 004: Play order controls (only show during planning phase) */}
      {planningPhase && !playOrderLocked && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onLockPlayOrder}
              disabled={playOrderSequence.length !== handCards.length}
              aria-label="Lock play order"
              title={playOrderSequence.length !== handCards.length 
                ? `Order all ${handCards.length} cards before locking` 
                : 'Lock the play order to proceed'}
            >
              Lock Order
            </button>
            
            {playOrderSequence.length > 0 && (
              <button
                onClick={onClearPlayOrder}
                aria-label="Clear play order"
              >
                Clear Order
              </button>
            )}
          </div>
          
          {/* Helper text for play order phase */}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            {playOrderSequence.length === handCards.length
              ? `✓ All ${handCards.length} cards ordered - ready to lock`
              : `Select cards in play order (${playOrderSequence.length}/${handCards.length} ordered)`
            }
          </p>
        </div>
      )}

      {/* Feature 004: Locked state indicator */}
      {playOrderLocked && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#28a745', fontWeight: 'bold' }}>
            ✓ Play order locked - ready to end turn
          </p>
        </div>
      )}
    </section>
  )
}
