# Research: Card Hand Display

**Feature**: 002-card-hand-display  
**Date**: 2025-11-12  
**Phase**: 0 (Research)

## Technical Clarifications

### From Technical Context Discovery

- **Language/Version**: TypeScript (ES2022 target) ✓
- **Framework**: React 18.2 + Vite 5.0 ✓
- **Styling**: Pico CSS 1.5 ✓
- **Testing**: Jest + React Testing Library ✓
- **Target Platform**: Static web application (modern browsers) ✓
- **Project Type**: Single-page web application ✓

All technical context is clarified. No NEEDS CLARIFICATION items remaining.

## CSS Layout Approaches for Card Fan Display

### Option 1: Flexbox with Negative Margins (Recommended)

**Approach**: Use `display: flex` with negative margins to create overlap/fan effect.

```css
.hand-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0;
  padding: 1rem;
}

.card {
  flex: 0 0 auto;
  width: clamp(80px, 10vw, 120px); /* Responsive sizing */
  margin-left: -40px; /* Overlap previous card */
}

.card:first-child {
  margin-left: 0; /* No overlap for first card */
}

.card:hover {
  transform: translateY(-20px); /* Lift on hover */
  z-index: 10;
}
```

**Pros**:
- Simple, well-supported
- Easy to make responsive with `clamp()` and viewport units
- Smooth hover transitions with CSS transforms
- Works well with 1-10 cards

**Cons**:
- Requires manual overlap calculation
- Less "fan-like" (more of a horizontal spread)

### Option 2: CSS Grid with Transform Rotate

**Approach**: Use CSS Grid with `transform: rotate()` to create true fan effect.

```css
.hand-container {
  display: grid;
  grid-template-columns: repeat(var(--card-count), 1fr);
  justify-items: center;
  align-items: end;
}

.card {
  transform: rotate(calc(var(--card-index) * 5deg - var(--center-offset)));
  transform-origin: center bottom;
}
```

**Pros**:
- Creates authentic "fan" visual
- CSS custom properties allow dynamic rotation based on card count

**Cons**:
- More complex calculation for center offset
- Rotated text harder to read at extreme positions
- May not fit well on narrow viewports

### Option 3: Pure Flexbox with Container Queries (Modern)

**Approach**: Use container queries to adjust card size based on container width.

```css
.hand-container {
  container-type: inline-size;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

@container (max-width: 600px) {
  .card {
    width: 60px;
    font-size: 10px;
  }
}

@container (min-width: 601px) {
  .card {
    width: 100px;
    font-size: 14px;
  }
}
```

**Pros**:
- Most responsive approach
- Cards automatically resize based on container, not viewport
- Future-proof (container queries are CSS standard)

**Cons**:
- Requires modern browser (Safari 16+, Chrome 105+)
- May need fallback for older browsers

### Recommended Approach: Hybrid Flexbox + clamp()

Combine **Option 1** with responsive sizing using `clamp()`:

```css
.hand-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 1rem;
  max-width: 100%;
  overflow: visible;
}

.card {
  /* Card width: min 80px, ideal 120px, max based on viewport and card count */
  width: clamp(80px, calc((100vw - 4rem) / var(--card-count)), 120px);
  height: clamp(120px, calc(1.5 * clamp(80px, calc((100vw - 4rem) / var(--card-count)), 120px)), 180px);
  margin-left: clamp(-60px, calc(-0.5 * clamp(80px, calc((100vw - 4rem) / var(--card-count)), 120px)), -20px);
  
  /* Visual styling */
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 1rem;
  
  /* Typography */
  font-size: clamp(12px, 1.2vw, 16px);
  text-align: center;
  
  /* Interactive */
  transition: transform 0.2s ease;
  cursor: pointer;
}

.card:first-child {
  margin-left: 0;
}

.card:hover {
  transform: translateY(-1.5rem);
  z-index: 10;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

**Rationale**:
- Uses CSS custom properties (`--card-count`) set via React for dynamic sizing
- `clamp()` ensures cards never get too small or too large
- Overlap scales with card size
- Works on all modern browsers (including Safari 13.1+)
- No JavaScript calculation needed for layout

## Responsive Sizing Strategy

### Calculation Approach

For hand sizes 1-10 cards on 1024px+ viewports:

```
Available width = viewport width - container padding
Card width = max(80px, min(120px, available width / card count))
Overlap = card width * 0.5 (for cards 2+)
```

**Example calculations**:
- 1 card @ 1024px: 120px (max size, centered)
- 5 cards @ 1024px: 120px each, -60px overlap = ~340px total
- 10 cards @ 1024px: 100px each, -50px overlap = ~550px total

All fit comfortably within 1024px viewport with padding.

### Minimum Font Size Enforcement

Use `clamp(12px, ...)` for all card text to enforce FR-007 (SC-002: minimum 12px font size).

## Accessibility Patterns

### Semantic HTML Structure

```html
<section aria-label="Current hand" role="region">
  <h2 id="hand-heading">Your Hand</h2>
  <div class="hand-container" aria-labelledby="hand-heading">
    <div class="card" role="article" aria-label="Card: Ace of Spades">
      <span aria-hidden="true">🂡</span>
      <span class="card-value">Ace of Spades</span>
    </div>
    <!-- More cards... -->
  </div>
</section>
```

**Key points**:
- Maintain `<section>` with `aria-label` (FR-012)
- Each card is `role="article"` for screen reader navigation
- Card value repeated in `aria-label` for clarity
- Decorative elements (icons) use `aria-hidden="true"`

### Keyboard Navigation (Future Enhancement)

For US3 (Visual States), consider:
- `tabindex="0"` on cards for keyboard focus
- `:focus` styles matching `:hover` styles
- Arrow key navigation (future)

### Color Contrast

Ensure card background/text meets WCAG AA (4.5:1 for normal text):
- White background (#FFFFFF) + dark text (#333333) = 12.6:1 ✓
- Or use Pico CSS semantic colors (already WCAG compliant)

## Long Card Name Handling (Edge Case)

For cards with 20+ character names:

### Option A: CSS Text Truncation
```css
.card-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Option B: Multi-line with Line Clamp
```css
.card-value {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Recommendation**: Use **Option B** (multi-line) to maximize readability while fitting within card dimensions (FR-010).

## Performance Considerations

### CSS Transitions vs JavaScript Animation

**Use CSS transitions** (already in approach):
- Hardware-accelerated transforms (`translateY`, not `top`)
- Meets SC-005 (hover response <100ms)
- No JavaScript overhead

### Re-render Strategy

When hand size changes:
- React re-renders HandView component
- CSS custom property `--card-count` updates
- Browser re-calculates `clamp()` values automatically
- No manual resize calculations needed

## Pico CSS Integration

Pico CSS provides:
- Semantic color variables: `var(--primary)`, `var(--secondary)`
- Spacing scale: `var(--spacing)`
- Border radius: `var(--border-radius)`

**Integration approach**:
```css
.card {
  background: var(--card-background-color);
  border: var(--border-width) solid var(--primary);
  border-radius: var(--border-radius);
  padding: var(--spacing);
}
```

Use Pico's custom properties where possible for consistency with existing design system.

## Research Conclusions

### Primary Technical Decisions

1. **Layout**: Flexbox with negative margin overlap
2. **Sizing**: `clamp()` with CSS custom properties for card count
3. **Responsive**: Viewport-based calculation with min/max constraints
4. **Accessibility**: Maintain semantic HTML, add `role="article"` to cards
5. **Long names**: Multi-line with `-webkit-line-clamp: 2`
6. **Styling**: Integrate with Pico CSS custom properties
7. **Interactions**: CSS transforms for hover (hardware-accelerated)

### Constitution Compliance

- ✅ **Static Asset Simplicity**: Pure CSS + React (client-side), no server/build changes
- ✅ **Deterministic Build**: No new build steps or dependencies required
- ✅ **Content Integrity**: Maintains accessibility with semantic HTML + ARIA labels

### Open Questions for Implementation

None. Research phase complete.

---

**Next Phase**: Design & Contracts (Phase 1)
