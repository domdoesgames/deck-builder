import { DeckControls } from './components/DeckControls'
import { HandView } from './components/HandView'
import { PileCounts } from './components/PileCounts'
import { JsonOverride } from './components/JsonOverride'
import { WarningBanner } from './components/WarningBanner'
import { SettingsPanel } from './components/SettingsPanel'
import { PresetDeckSelector } from './components/PresetDeckSelector'
import { useDeckState } from './hooks/useDeckState'

/**
 * Main App component composing deck mechanics UI (US1)
 * Uses semantic HTML5 landmarks (header, main, footer)
 */
function App() {
  const { 
    state, 
    endTurn, 
    applyJsonOverride, 
    changeParameters, 
    confirmDiscard, 
    toggleCardSelection,
    selectForPlayOrder,
    deselectFromPlayOrder,
    lockPlayOrder,
    clearPlayOrder,
    reset,  // Feature 006: Reset action (T007)
    loadPresetDeck,  // Feature 009: Preset deck loading (T019)
    startCustomDeck,  // Feature 009: Start custom deck mode (T027)
  } = useDeckState()

  return (
    <>
      <header>
        <h1>Broom Broom</h1>
      </header>

      <main>
        <WarningBanner warning={state.warning} error={null} />
        <HandView 
          hand={state.hand} 
          handCards={state.handCards}
          selectedCardIds={state.selectedCardIds}
          onToggleCardSelection={toggleCardSelection}
          discardPhaseActive={state.discardPhase.active}
          remainingDiscards={state.discardPhase.remainingDiscards}
          onConfirmDiscard={confirmDiscard}
          playOrderSequence={state.playOrderSequence}
          planningPhase={state.planningPhase}
          playOrderLocked={state.playOrderLocked}
          onSelectForPlayOrder={selectForPlayOrder}
          onDeselectFromPlayOrder={deselectFromPlayOrder}
          onLockPlayOrder={lockPlayOrder}
          onClearPlayOrder={clearPlayOrder}
        />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={endTurn} 
            disabled={state.isDealing || state.discardPhase.active || state.planningPhase}
            aria-label="End turn"
            title={state.discardPhase.active ? 'Complete discard phase to end turn' : state.planningPhase ? 'Lock play order to end turn' : undefined}
          >
            End Turn
          </button>
        </div>
        <PileCounts 
          drawPileSize={state.drawPile.length}
          discardPileSize={state.discardPile.length}
          turnNumber={state.turnNumber}
        />
        <SettingsPanel error={state.error}>
          <PresetDeckSelector 
            onSelectPreset={loadPresetDeck}
            activePresetId={state.activePresetId}
          />
          <DeckControls 
            state={state}
            onEndTurn={endTurn}
            onChangeParameters={changeParameters}
            reset={reset}
          />
          <JsonOverride onApplyJsonOverride={applyJsonOverride} error={state.error} />
          {/* Feature 009: Start Custom Deck button (T026, T028) */}
          {state.deckSource === 'preset' && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={startCustomDeck}
                type="button"
                aria-label="Start a new custom deck"
              >
                Start Custom Deck
              </button>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-color, #6c757d)', marginTop: '0.5rem' }}>
                Current mode: <strong>Preset Deck</strong> ({state.activePresetId})
              </p>
            </div>
          )}
          {state.deckSource === 'custom' && (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-color, #6c757d)', marginTop: '0.5rem' }}>
              Current mode: <strong>Custom Deck</strong>
            </p>
          )}
          {state.deckSource === 'default' && (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-color, #6c757d)', marginTop: '0.5rem' }}>
              Current mode: <strong>Default Deck</strong>
            </p>
          )}
        </SettingsPanel>
      </main>
    </>
  )
}

export default App
