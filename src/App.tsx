import { DeckControls } from './components/DeckControls'
import { HandView } from './components/HandView'
import { PileCounts } from './components/PileCounts'
import { JsonOverride } from './components/JsonOverride'
import { WarningBanner } from './components/WarningBanner'
import { useDeckState } from './hooks/useDeckState'

/**
 * Main App component composing deck mechanics UI (US1)
 * Uses semantic HTML5 landmarks (header, main, footer)
 */
function App() {
  const { state, endTurn, applyJsonOverride, changeParameters } = useDeckState()

  return (
    <>
      <header>
        <h1>Deck Builder</h1>
        <p>Foundational deck mechanics</p>
      </header>
      
      <main>
        <WarningBanner warning={state.warning} error={state.error} />
        <PileCounts 
          drawPileSize={state.drawPile.length}
          discardPileSize={state.discardPile.length}
          turnNumber={state.turnNumber}
        />
        <HandView hand={state.hand} />
        <DeckControls 
          state={state}
          onEndTurn={endTurn}
          onChangeParameters={changeParameters}
        />
        <JsonOverride onApplyJsonOverride={applyJsonOverride} />
      </main>
      
      <footer>
        <p>Feature 001: Deck Mechanics</p>
      </footer>
    </>
  )
}

export default App
