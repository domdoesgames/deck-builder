# Contract: PresetDeckSelector Component

**Component**: `PresetDeckSelector`  
**File**: `src/components/PresetDeckSelector.tsx`  
**Purpose**: Display list of available preset decks with selection and detail viewing capabilities

## Interface Contract

### Props

```typescript
interface PresetDeckSelectorProps {
  /**
   * Callback invoked when user selects a preset deck
   * @param presetId - Unique identifier of selected preset deck
   */
  onSelectPreset: (presetId: string) => void;
  
  /**
   * Currently active preset deck ID (for visual indication)
   * null if no preset deck is active (custom/default deck)
   */
  activePresetId: string | null;
}
```

### Component Signature

```typescript
export function PresetDeckSelector(props: PresetDeckSelectorProps): JSX.Element;
```

---

## Behavior Contract

### Rendering Rules

**MUST** display:
1. Section heading: "Preset Decks" or similar
2. List of all valid preset decks from `PRESET_DECKS` array
3. For each preset deck:
   - Deck name (from `PresetDeck.name`)
   - Deck description (from `PresetDeck.description`)
   - Card count: "X cards" (from `PresetDeck.cards.length`)
   - Visual indicator if this deck is active (when `activePresetId` matches deck ID)
4. Expandable section control (expand/collapse icon or button)

**MUST NOT** display:
- Invalid preset decks (filtered out via `validatePresetDeck()`)
- Internal IDs (these are for programmatic use only)
- Raw card array data in collapsed view

**Empty State**:
- **IF** `PRESET_DECKS` array is empty OR all presets invalid
- **THEN** display: "No preset decks available. Use JSON Override to load a custom deck."
- **AND** provide clear visual separation (border, background color, or icon)

---

### Interaction Contract

#### Selection Interaction

**WHEN** user clicks a preset deck entry (excluding expand/collapse control):
1. Call `props.onSelectPreset(deck.id)`
2. Component does NOT manage loading state (parent's responsibility)
3. No visual feedback required beyond hover/active CSS states

**ACCESSIBILITY**:
- Deck entries MUST be keyboard-navigable (Enter key triggers selection)
- MUST use semantic button or anchor elements for clickable areas
- MUST provide clear focus indicators (visible outline)

---

#### Expand/Collapse Interaction

**WHEN** user clicks expand control on a preset deck entry:
1. Toggle visibility of detailed card composition section
2. Update expand/collapse icon (▼ collapsed, ▲ expanded)
3. MUST use `aria-expanded` attribute (true/false)
4. Smooth CSS transition (max-height or opacity, <300ms)

**Expanded Section MUST display**:
1. Full list of cards with quantities:
   - Group identical cards and show count (e.g., "Card 1 ×3")
   - OR show all cards in order (if order matters for gameplay)
2. Total card count: "Total: X cards"
3. Optional: Short strategy hint or deck composition summary

**Collapse Behavior**:
- Clicking expanded deck's control collapses it
- Clicking another deck's expand control SHOULD collapse previously expanded deck (accordion pattern)
- OR allow multiple decks expanded simultaneously (up to implementation choice)

**ACCESSIBILITY**:
- MUST use `aria-controls` linking expand button to content region
- Expanded content MUST use `role="region"` with `aria-labelledby`
- Keyboard navigation: Enter/Space to toggle expansion

---

### Active Preset Indication

**WHEN** `props.activePresetId` matches a deck's ID:
1. Apply distinct visual styling (border, background color, checkmark icon)
2. Use accessible color contrast (WCAG AA minimum)
3. Include aria-label or sr-only text: "Currently active deck"
4. Position indicator clearly (left border, badge, or icon)

**WHEN** `props.activePresetId` is null:
- No decks should show active indication
- Normal rendering for all decks

**Visual Examples** (CSS guidance):
```css
.preset-deck-entry.active {
  border-left: 4px solid var(--primary-color);
  background-color: var(--primary-bg-light);
}

.preset-deck-entry.active::before {
  content: "✓";
  font-weight: bold;
  color: var(--primary-color);
}
```

---

## Error Handling Contract

### Runtime Validation

**BEFORE** rendering preset deck list:
1. Iterate through `PRESET_DECKS` array
2. Call `validatePresetDeck(deck)` for each deck
3. Filter out invalid decks (`result.isValid === false`)
4. Log warning to console for filtered decks: `console.warn('Invalid preset deck filtered:', deck.id, result.errors)`

**Result**: Only valid decks rendered in UI

---

### Invalid Props

**IF** `props.onSelectPreset` is not a function:
- Component MUST throw error or fail gracefully (render but disable selection)

**IF** `props.activePresetId` is not a string or null:
- Treat as null (no active preset indication)

---

## Styling Contract

### Required CSS Classes

```css
/* Container for entire component */
.preset-deck-selector { }

/* Individual preset deck entry */
.preset-deck-entry { }

/* Active preset deck entry */
.preset-deck-entry.active { }

/* Expand/collapse button */
.preset-deck-toggle { }

/* Expanded detail section */
.preset-deck-details { }

/* Empty state message */
.preset-deck-empty { }
```

### Responsive Behavior

**Mobile (<768px)**:
- Stack deck entries vertically (default)
- Ensure touch-friendly tap targets (min 44×44px)
- Expanded sections full width

**Desktop (≥768px)**:
- Optional: Two-column layout if many preset decks exist
- Hover states for interactivity feedback

---

## Testing Contract

### Unit Test Requirements

1. **Renders list of valid preset decks**
   - Mock `PRESET_DECKS` with 2 decks
   - Verify both names appear in output

2. **Filters out invalid preset decks**
   - Mock `PRESET_DECKS` with 1 valid, 1 invalid deck
   - Mock `validatePresetDeck` to return isValid: false for second deck
   - Verify only first deck rendered

3. **Shows empty state when no valid decks**
   - Mock `PRESET_DECKS` as empty array
   - Verify empty state message displayed

4. **Calls onSelectPreset when deck clicked**
   - Mock `onSelectPreset` callback
   - Click preset deck entry
   - Verify callback called with correct deck ID

5. **Highlights active preset deck**
   - Pass `activePresetId='starter-deck'` prop
   - Verify deck with ID 'starter-deck' has 'active' class

6. **Expands and collapses deck details**
   - Click expand control
   - Verify details section visible (aria-expanded=true)
   - Click again
   - Verify details hidden (aria-expanded=false)

---

## Integration Points

### Dependencies

- `PRESET_DECKS` from `@/lib/presetDecks`
- `validatePresetDeck` from `@/lib/presetDeckValidator`
- `PresetDeck` type from `@/lib/types`

### Parent Component Responsibilities

Parent (e.g., `App.tsx` or `SettingsPanel`) MUST:
1. Provide `onSelectPreset` callback that dispatches `LOAD_PRESET_DECK` action
2. Pass current `activePresetId` from deck state
3. Handle loading/error states resulting from preset deck load

### Sibling Components

- **JsonOverride**: Separate section, no direct coupling
- **DeckControls**: May display active preset indicator (separate concern)
- **WarningBanner**: May show errors from invalid preset load (separate concern)

---

## Performance Contract

### Rendering Performance

- Component MUST render list of ≤20 preset decks without perceptible lag (<100ms)
- Validation of preset decks MUST NOT block UI thread
- Consider memoization if preset deck array very large (>50 decks)

### Memory

- Expanded deck details SHOULD render on-demand (not hidden in DOM)
- Use CSS `display: none` OR conditional rendering for collapsed details

---

## Accessibility Contract

### Keyboard Navigation

- **Tab**: Navigate between preset deck entries and expand controls
- **Enter/Space**: Select preset deck or toggle expansion
- **Escape**: Optional - collapse all expanded sections

### Screen Reader Support

- Each deck entry MUST have accessible name (deck name + "preset deck")
- Active deck MUST announce "Currently active" status
- Expand controls MUST announce state ("Expanded" / "Collapsed")
- Card counts MUST be readable ("20 cards")

### ARIA Attributes

```html
<div class="preset-deck-entry" role="button" tabindex="0" aria-label="Starter Deck preset, 20 cards">
  <h4>Starter Deck</h4>
  <p>A balanced deck for learning...</p>
  
  <button 
    aria-expanded="false" 
    aria-controls="starter-deck-details"
    aria-label="Show deck details"
  >
    Details ▼
  </button>
</div>

<div 
  id="starter-deck-details" 
  role="region" 
  aria-labelledby="starter-deck-heading"
  hidden
>
  <!-- Card composition details -->
</div>
```

---

## Version

**Contract Version**: 1.0.0  
**Created**: 2025-11-19  
**Status**: Draft (Phase 1)

**Breaking Changes Policy**: Changes to props interface require MAJOR version bump and update to this contract.
