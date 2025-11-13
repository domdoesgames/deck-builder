/**
 * PileCounts component (US1)
 * Shows draw pile size, discard pile size, and turn number
 */

interface PileCountsProps {
  drawPileSize: number
  discardPileSize: number
  turnNumber: number
}

export function PileCounts({ drawPileSize, discardPileSize, turnNumber }: PileCountsProps) {
  return (
    <section aria-label="Pile status">
      <h2>Pile Status</h2>
      <p>
        <strong>Draw pile:</strong> {drawPileSize} | {' '}
        <strong>Discard pile:</strong> {discardPileSize} | {' '}
        <strong>Turn:</strong> {turnNumber}
      </p>
    </section>
  )
}
