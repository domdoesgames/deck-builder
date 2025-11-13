# Component Contract: HandView

**Feature**: 002-card-hand-display  
**Component**: `HandView`  
**Path**: `src/components/HandView.tsx`  
**Date**: 2025-11-12

## Purpose

Displays the player's current hand of cards as a visual card fan/spread layout (replacing the previous list-based display).

## Interface

### Props

```typescript
export interface HandViewProps {
  hand: string[]; // Array of card values (0-10 items)
}
```

**Constraints**:
- `hand.length` must be in range [0, 10] (enforced by caller - Feature 001 Hand model)
- Each `hand[i]` must be a non-empty string (enforced by Feature 001 Deck model)

### Events

None. This is a purely presentational component (no user interactions beyond hover).

## Behavior Contract

### GIVEN an empty hand (hand.length === 0)

**WHEN** component renders

**THEN**:
- MUST display empty state message "No cards in hand"
- MUST use `.hand-container--empty` CSS modifier class
- MUST maintain `<section aria-label="Current hand">` wrapper (accessibility)
- MUST NOT render any `.card` elements

---

### GIVEN a hand with 1-10 cards

**WHEN** component renders

**THEN**:
- MUST render exactly `hand.length` card elements
- MUST apply `.hand-container` class to container
- MUST set CSS custom property `--card-count` to `hand.length`
- MUST render cards in order (hand[0] leftmost, hand[n-1] rightmost)
- Each card MUST:
  - Display the card value from `hand[i]`
  - Have `aria-label="Card: {hand[i]}"`
  - Have `role="article"`
  - Have CSS custom property `--card-index` set to `i`
  - Use `.card` CSS class

---

### WHEN hand prop changes (e.g., new deal, hand size change)

**THEN**:
- Component MUST re-render with new hand values
- Previous cards MUST be replaced (not animated/transitioned)
- CSS custom properties MUST update to reflect new `hand.length`
- Browser WILL automatically recalculate card sizes via CSS `clamp()`

---

### WHEN user hovers over a card (on pointer devices)

**THEN**:
- CSS `:hover` pseudo-class MUST apply
- Card MUST elevate (via `transform: translateY(-1.5rem)`)
- Card MUST show shadow (`box-shadow: 0 8px 16px rgba(0,0,0,0.2)`)
- Card MUST have `z-index: 10` (appear above other cards)
- Transition MUST complete within 200ms (CSS transition)

**WHEN** user's pointer leaves card

**THEN**:
- Card MUST return to default state
- Reverse transition MUST complete within 200ms

---

## Accessibility Contract

### Semantic Structure

```html
<section aria-label="Current hand" role="region">
  <h2 id="hand-heading">Your Hand</h2>
  <div 
    class="hand-container" 
    aria-labelledby="hand-heading"
    data-card-count="{hand.length}"
  >
    <!-- Cards or empty state -->
  </div>
</section>
```

### Requirements

- MUST maintain `<section>` wrapper with `aria-label="Current hand"`
- MUST include `<h2>Your Hand</h2>` heading
- Each card MUST have `role="article"` for screen reader navigation
- Each card MUST have `aria-label="Card: {value}"` for announcements
- Decorative elements (if any) MUST have `aria-hidden="true"`

### Screen Reader Behavior

**Expected announcement** (when navigating to hand section):
```
"Current hand, region
Your Hand, heading level 2
Card: 7♠, article
Card: J♥, article
Card: A♦, article
End of region"
```

---

## Visual Contract (CSS Requirements)

### Card Dimensions

```css
.card {
  /* Width: min 80px, max 120px, responsive to card count */
  width: clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px);
  
  /* Height: 1.5x width (aspect ratio 2:3) */
  height: calc(1.5 * clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px));
  
  /* Overlap: 50% of card width for cards 2+ */
  margin-left: clamp(-60px, calc(-0.5 * clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px)), -20px);
}

.card:first-child {
  margin-left: 0; /* No overlap for first card */
}
```

### Typography

```css
.card {
  /* Font size: min 12px (FR-007), max 16px */
  font-size: clamp(12px, calc(0.133 * clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px)), 16px);
  text-align: center;
}
```

### Layout Container

```css
.hand-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 1rem;
  max-width: 100%;
  overflow: visible; /* Allow hover elevation */
}
```

### Visual Styling

```css
.card {
  background: var(--card-background-color); /* Pico CSS variable */
  border: 2px solid var(--primary); /* Pico CSS variable */
  border-radius: var(--border-radius); /* Pico CSS variable */
  padding: var(--spacing); /* Pico CSS variable */
  
  /* Interactive states */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-1.5rem);
  z-index: 10;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

---

## Performance Contract

### Render Performance

- Component MUST render in <50ms for 10 cards (React render + browser layout)
- Hover transition MUST complete in <200ms (CSS transition)
- Hover transition MUST use hardware-accelerated properties (`transform`, not `top`/`left`)

### Re-render Behavior

**Triggers for re-render**:
1. `hand` prop changes (reference equality check)
2. Parent component re-renders (normal React behavior)

**No re-render when**:
- User hovers over cards (pure CSS, no state change)
- Window resizes (CSS recalculates automatically via viewport units)

---

## Edge Cases & Error Handling

### Long Card Names (20+ characters)

**Requirement** (FR-010): Card names must be fully visible or appropriately truncated.

**Implementation**:
```css
.card__value {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Max 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
```

**Behavior**:
- Card names up to ~30 characters: Display in full (wrapped to 2 lines)
- Card names 30+ characters: Truncate with "..." on line 2

---

### Special Characters / Emojis

**Requirement** (Edge Case 5): Handle card names with special characters/emojis.

**Implementation**:
- UTF-8 encoding (default in React/HTML5)
- CSS `word-break: break-word` prevents overflow
- No special sanitization needed (React escapes by default)

**Example**:
```
Card name: "🂡 Ace of Spades ♠"
Renders correctly with emoji + Unicode suit symbols
```

---

### Viewport Constraints

**Desktop (1024px+)**: All hand sizes (1-10) fit without horizontal scroll  
**Narrow viewports (<1024px)**: Not specified in FR-008, but CSS degrades gracefully:
- Cards shrink to minimum 80px width
- May require horizontal scroll for 10-card hands on narrow screens

---

## Testing Contract

### Unit Tests (React Testing Library)

**File**: `tests/unit/HandView.test.tsx`

**Required test cases**:

1. **Empty hand renders empty state**
   ```typescript
   render(<HandView hand={[]} />)
   expect(screen.getByText('No cards in hand')).toBeInTheDocument()
   ```

2. **Single card renders centered**
   ```typescript
   render(<HandView hand={['A♠']} />)
   expect(screen.getByLabelText('Card: A♠')).toBeInTheDocument()
   ```

3. **Multiple cards render in order**
   ```typescript
   render(<HandView hand={['7♠', 'J♥', 'A♦']} />)
   const cards = screen.getAllByRole('article')
   expect(cards).toHaveLength(3)
   expect(cards[0]).toHaveAccessibleName('Card: 7♠')
   ```

4. **CSS custom properties set correctly**
   ```typescript
   const { container } = render(<HandView hand={['A', 'B', 'C']} />)
   const handContainer = container.querySelector('.hand-container')
   expect(handContainer).toHaveStyle({ '--card-count': 3 })
   ```

5. **Long card names truncate**
   ```typescript
   render(<HandView hand={['Very Long Card Name That Should Truncate']} />)
   const card = screen.getByLabelText(/Card: Very Long/)
   // Visual regression test or check for -webkit-line-clamp class
   ```

6. **Accessibility structure maintained**
   ```typescript
   render(<HandView hand={['A♠']} />)
   expect(screen.getByRole('region', { name: 'Current hand' })).toBeInTheDocument()
   expect(screen.getByRole('heading', { name: 'Your Hand' })).toBeInTheDocument()
   ```

---

### Integration Tests

**File**: `tests/integration/handDisplay.test.ts`

**Required test cases**:

1. **Hand size changes update display**
   - Deal 5-card hand → verify 5 cards render
   - Change hand size to 10 → reset → verify 10 cards render

2. **Cards fit in viewport (1024px+)**
   - Set viewport to 1024px
   - Deal 10-card hand
   - Verify no horizontal scroll (`container.scrollWidth === container.clientWidth`)

---

### Visual Regression Tests (Optional)

**Tool**: Playwright or similar

**Scenarios**:
- Screenshot of 1, 5, and 10 card hands
- Screenshot of hover state
- Screenshot of empty state

---

## Dependencies

### From Feature 001 (Deck Mechanics)

- `Hand.cards` property provides `string[]` for `hand` prop
- Hand size limits (1-10) enforced by `Hand` model

### External Libraries

- **React 18.2**: Component framework
- **Pico CSS 1.5**: CSS custom properties for theming

### Browser Requirements

- **CSS Features**: `clamp()`, CSS custom properties, flexbox
- **Browser Support**: Modern browsers (Chrome 79+, Safari 13.1+, Firefox 75+)

---

## Open Questions

None. Contract is complete and ready for implementation.

---

**Next**: CSS stylesheet contract
