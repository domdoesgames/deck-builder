import { useMemo, useState } from 'react';
import { PRESET_DECKS } from '../lib/presetDecks';
import { validatePresetDeck } from '../lib/presetDeckValidator';
import type { PresetDeck } from '../lib/types';

/**
 * PresetDeckSelector Component (Feature 009)
 * 
 * UI component for displaying and selecting preset decks.
 * Integrated into SettingsPanel for deck selection.
 */

/**
 * Props for PresetDeckSelector component
 */
export interface PresetDeckSelectorProps {
  /** Callback when user selects a preset deck */
  onSelectPreset: (presetId: string) => void;
  
  /** Currently active preset ID (for highlighting) */
  activePresetId: string | null;
}

/**
 * Component for selecting preset decks
 * 
 * Features:
 * - Displays list of all valid preset decks
 * - Expandable sections showing deck details (card composition)
 * - Visual indicator for currently active preset
 * - Handles empty state (no presets available)
 * - Filters out invalid presets at runtime
 * - Radio button selection with "Load Selected Deck" button
 */
export function PresetDeckSelector(props: PresetDeckSelectorProps): JSX.Element {
  const { onSelectPreset, activePresetId } = props;
  
  // Track which deck's details are expanded (accordion pattern)
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  
  // Track which preset is selected (but not yet loaded)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Validate preset decks at runtime and filter out invalid ones
  const validPresets = useMemo(() => {
    const filtered = PRESET_DECKS.filter(deck => {
      const result = validatePresetDeck(deck);
      if (!result.isValid) {
        console.warn(`Invalid preset deck filtered: ${deck.id}`, result.errors);
      }
      return result.isValid;
    });
    return filtered;
  }, []);

  // Calculate card composition (group by card name and count)
  const getCardComposition = (deck: PresetDeck): Map<string, number> => {
    const composition = new Map<string, number>();
    deck.cards.forEach(card => {
      composition.set(card, (composition.get(card) || 0) + 1);
    });
    return composition;
  };

  // Handle expand/collapse toggle
  const toggleExpanded = (deckId: string) => {
    setExpandedDeckId(prev => prev === deckId ? null : deckId);
  };

  // Handle keyboard events on toggle button (Enter/Space)
  const handleToggleKeyDown = (event: React.KeyboardEvent, deckId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded(deckId);
    }
  };

  // Handle radio selection change
  const handleRadioChange = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  // Handle "Load Selected Deck" button click
  const handleLoadDeck = () => {
    if (selectedPresetId && typeof onSelectPreset === 'function') {
      onSelectPreset(selectedPresetId);
    }
  };

  // Empty state
  if (validPresets.length === 0) {
    return (
      <div className="preset-deck-selector">
        <h3>Preset Decks</h3>
        <div className="preset-deck-empty" role="status" aria-live="polite">
          <p>No preset decks available. Use JSON Override to load a custom deck.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preset-deck-selector">
      <h3>Preset Decks</h3>
      
      {validPresets.map(deck => {
        const isActive = activePresetId === deck.id;
        const isExpanded = expandedDeckId === deck.id;
        const composition = getCardComposition(deck);
        const detailsId = `${deck.id}-details`;
        const headingId = `${deck.id}-heading`;
        const radioId = `preset-radio-${deck.id}`;

        return (
          <div 
            key={deck.id}
            className={`preset-deck-entry ${isActive ? 'active' : ''}`}
          >
            {/* Main deck info with radio selection */}
            <div className="preset-deck-header">
              <label 
                htmlFor={radioId}
                className="preset-deck-info"
              >
                <input
                  type="radio"
                  id={radioId}
                  name="preset-deck-selection"
                  value={deck.id}
                  checked={selectedPresetId === deck.id}
                  onChange={() => handleRadioChange(deck.id)}
                  aria-label={`Select ${deck.name} preset deck, ${deck.cards.length} cards${isActive ? ', currently active' : ''}`}
                />
                
                <div className="preset-deck-content">
                  <h4 id={headingId}>
                    {isActive && <span className="active-indicator" aria-label="Currently active">✓ </span>}
                    {deck.name}
                  </h4>
                  <p className="preset-deck-description">{deck.description}</p>
                  <p className="preset-deck-card-count">{deck.cards.length} cards</p>
                </div>
              </label>

              {/* Expand/collapse button */}
              <button
                className="preset-deck-toggle"
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                aria-label={`${isExpanded ? 'Hide' : 'Show'} deck details for ${deck.name}`}
                onClick={() => toggleExpanded(deck.id)}
                onKeyDown={(e) => handleToggleKeyDown(e, deck.id)}
                type="button"
                tabIndex={0}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>

            {/* Expanded details section */}
            {isExpanded && (
              <div 
                id={detailsId}
                className="preset-deck-details"
                role="region"
                aria-labelledby={headingId}
              >
                <h5>Card Composition</h5>
                <ul className="preset-deck-card-list">
                  {Array.from(composition.entries())
                    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                    .map(([cardName, count]) => (
                      <li key={cardName}>
                        {cardName} {count > 1 ? `×${count}` : ''}
                      </li>
                    ))
                  }
                </ul>
                <p className="preset-deck-total">
                  <strong>Total: {deck.cards.length} cards</strong>
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Load Selected Deck button */}
      <div className="preset-deck-actions">
        <button
          type="button"
          onClick={handleLoadDeck}
          disabled={selectedPresetId === null}
          className="preset-deck-load-button"
          aria-label="Load selected preset deck"
        >
          Load Selected Deck
        </button>
      </div>
    </div>
  );
}
