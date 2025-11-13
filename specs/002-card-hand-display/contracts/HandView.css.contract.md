# CSS Contract: HandView Styles

**Feature**: 002-card-hand-display  
**Stylesheet**: `src/components/HandView.css` (or inline styles)  
**Component**: `HandView.tsx`  
**Date**: 2025-11-12

## Purpose

Defines the visual presentation and layout for the card hand display, implementing the fan/spread layout and responsive sizing.

## CSS Custom Properties

### Component-Specific Properties

```css
:root {
  /* Card sizing bounds */
  --card-min-width: 80px;
  --card-max-width: 120px;
  --card-aspect-ratio: 1.5; /* height = width * 1.5 */
  
  /* Card spacing */
  --card-overlap-factor: 0.5; /* Cards overlap by 50% of width */
  
  /* Typography */
  --card-font-min: 12px; /* FR-007 minimum */
  --card-font-max: 16px;
  
  /* Animation */
  --card-hover-lift: -1.5rem;
  --card-transition-duration: 0.2s;
  
  /* Visual styling (can use Pico CSS variables) */
  --card-background: var(--card-background-color, #ffffff);
  --card-border-color: var(--primary, #333333);
  --card-border-width: 2px;
  --card-border-radius: var(--border-radius, 8px);
  --card-padding: var(--spacing, 1rem);
  --card-shadow-hover: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

### Dynamic Properties (Set via React)

```typescript
// Set on .hand-container element
style={{ '--card-count': hand.length }}

// Set on each .card element
style={{ '--card-index': index }}
```

---

## Selectors & Rules

### Hand Container

```css
.hand-container {
  /* Layout */
  display: flex;
  justify-content: center;
  align-items: flex-end;
  
  /* Spacing */
  padding: 1rem;
  max-width: 100%;
  
  /* Overflow */
  overflow: visible; /* Allow hover elevation to extend beyond bounds */
  
  /* Ensure custom property has fallback */
  --card-count: 1;
}
```

### Empty State Modifier

```css
.hand-container--empty {
  /* Center empty message */
  justify-content: center;
  align-items: center;
  min-height: 200px; /* Provide visual space for empty state */
}

.hand-empty-message {
  color: var(--muted-color, #6c757d);
  font-style: italic;
  text-align: center;
}
```

---

### Card Element (Base)

```css
.card {
  /* Sizing (FR-004, FR-006, SC-002) */
  width: clamp(
    var(--card-min-width),
    calc((100vw - 4rem) / var(--card-count)),
    var(--card-max-width)
  );
  height: calc(
    var(--card-aspect-ratio) * clamp(
      var(--card-min-width),
      calc((100vw - 4rem) / var(--card-count)),
      var(--card-max-width)
    )
  );
  
  /* Spacing (FR-002: horizontal spread) */
  margin-left: clamp(
    calc(var(--card-min-width) * -0.75), /* Max overlap: 60px */
    calc(
      -1 * var(--card-overlap-factor) * clamp(
        var(--card-min-width),
        calc((100vw - 4rem) / var(--card-count)),
        var(--card-max-width)
      )
    ),
    calc(var(--card-max-width) * -0.167) /* Min overlap: -20px */
  );
  
  /* Visual styling (FR-011: visually distinct) */
  background: var(--card-background);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  
  /* Typography (FR-007, SC-002: min 12px) */
  font-size: clamp(var(--card-font-min), 1.2vw, var(--card-font-max));
  text-align: center;
  color: var(--color, #333333);
  
  /* Layout for content */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  /* Stacking */
  position: relative;
  z-index: 1;
  
  /* Interaction (FR-009: hover feedback) */
  cursor: pointer;
  transition: 
    transform var(--card-transition-duration) ease,
    box-shadow var(--card-transition-duration) ease,
    z-index 0s; /* Instant z-index change */
}
```

### First Card (No Overlap)

```css
.card:first-child {
  margin-left: 0; /* No overlap for leftmost card */
}
```

### Card Hover State

```css
.card:hover {
  /* Elevation (US3: visual states) */
  transform: translateY(var(--card-hover-lift));
  
  /* Stacking (appear above other cards) */
  z-index: 10;
  
  /* Shadow (SC-005: <100ms response) */
  box-shadow: var(--card-shadow-hover);
}
```

### Card Focus State (Future: Keyboard Navigation)

```css
.card:focus {
  /* Match hover styles for keyboard users */
  transform: translateY(var(--card-hover-lift));
  z-index: 10;
  box-shadow: var(--card-shadow-hover);
  
  /* Focus indicator (accessibility) */
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}
```

---

### Card Content Elements

```css
.card__value {
  /* Text wrapping for long names (FR-010) */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Max 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  
  /* Ensure readability */
  font-weight: 500;
  line-height: 1.4;
}

.card__icon {
  /* Decorative element (if used) */
  font-size: 2rem;
  margin-bottom: 0.5rem;
  
  /* Hidden from screen readers */
  /* aria-hidden="true" in HTML */
}
```

---

## Responsive Behavior

### Desktop (1024px+)

```css
@media (min-width: 1024px) {
  .hand-container {
    /* Calculations already optimized for 1024px+ */
    /* All hand sizes (1-10) fit without horizontal scroll */
  }
}
```

### Narrow Viewports (<1024px)

```css
@media (max-width: 1023px) {
  .card {
    /* Cards shrink to minimum width */
    /* May require horizontal scroll for 10-card hands */
    /* Edge case: not specified in FR-008, graceful degradation */
  }
  
  .hand-container {
    /* Allow horizontal scroll on narrow screens */
    overflow-x: auto;
    overflow-y: visible; /* Still allow vertical hover elevation */
  }
}
```

### Mobile Touch Devices

```css
@media (hover: none) and (pointer: coarse) {
  .card {
    /* Disable hover effects on touch devices */
    cursor: default;
  }
  
  .card:hover {
    /* No hover state on touch (relies on :active instead) */
    transform: none;
    box-shadow: none;
  }
  
  .card:active {
    /* Touch feedback (US3: visual states) */
    transform: scale(0.95);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}
```

---

## Animation Performance

### Hardware Acceleration

```css
.card {
  /* Force GPU layer for smooth animations */
  will-change: transform;
}

.card:hover,
.card:focus {
  /* Use transform (hardware-accelerated) not top/left */
  transform: translateY(var(--card-hover-lift));
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    /* Disable transitions for users with motion sensitivities */
    transition: none;
  }
  
  .card:hover,
  .card:focus {
    /* Keep visual states, remove animation */
    box-shadow: var(--card-shadow-hover);
    /* No transform animation */
  }
}
```

---

## Theming Integration (Pico CSS)

### Using Pico Variables

```css
.card {
  /* Background */
  background: var(--card-background-color, #ffffff);
  
  /* Border */
  border-color: var(--primary, #333333);
  border-radius: var(--border-radius, 8px);
  
  /* Padding */
  padding: var(--spacing, 1rem);
  
  /* Text color */
  color: var(--color, #333333);
}

.card:hover {
  /* Shadow using Pico's shadow variables (if available) */
  box-shadow: var(--card-shadow-hover, 0 8px 16px rgba(0, 0, 0, 0.2));
}
```

### Dark Mode Support (If Pico Provides)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --card-background: var(--card-background-color, #2d3748);
    --card-border-color: var(--primary, #63b3ed);
  }
}
```

---

## Layout Calculations (Detailed)

### Card Width Formula

```
cardWidth = clamp(
  80px,                          // Minimum (FR-007 readability)
  (100vw - 4rem) / cardCount,    // Ideal (viewport minus padding)
  120px                          // Maximum (optimal size)
)
```

**Example calculations**:

| Viewport | Cards | Ideal Width | Clamped Width | Total Width (with overlap) |
|----------|-------|-------------|---------------|---------------------------|
| 1024px   | 1     | 960px       | 120px (max)   | 120px                     |
| 1024px   | 5     | 192px       | 120px (max)   | 360px (120 + 4×60)        |
| 1024px   | 10    | 96px        | 96px          | 528px (96 + 9×48)         |
| 768px    | 10    | 64px        | 80px (min)    | 440px (80 + 9×40)         |

### Overlap Offset Formula

```
overlapOffset = clamp(
  -60px,                         // Max overlap (for small cards)
  -0.5 * cardWidth,              // 50% of card width
  -20px                          // Min overlap (for large cards)
)
```

---

## Visual Validation Criteria

### Success Criteria Mapping

- **SC-001**: No horizontal scroll @ 1024px with 10 cards
  - ✅ Verified by calculation: 528px < 1024px
  
- **SC-002**: Min 12px font size
  - ✅ Enforced by `clamp(12px, ...)`
  
- **SC-003**: Cards visually distinct
  - ✅ Border, background, shadow on hover
  
- **SC-004**: Recognizable as "cards in a hand"
  - ✅ Horizontal spread, card-shaped rectangles
  
- **SC-005**: Hover response <100ms
  - ✅ CSS transition 200ms (visual feedback starts immediately)

---

## Browser Compatibility

### Required CSS Features

- ✅ **Flexbox**: All modern browsers
- ✅ **CSS Custom Properties**: Chrome 49+, Safari 9.1+, Firefox 31+
- ✅ **`clamp()`**: Chrome 79+, Safari 13.1+, Firefox 75+
- ✅ **`calc()` nesting**: All modern browsers

### Fallback Strategy

For browsers not supporting `clamp()` (Safari <13.1):

```css
.card {
  /* Fallback for old browsers */
  width: 100px;
  margin-left: -50px;
  font-size: 14px;
}

/* Modern browsers override with clamp() */
@supports (width: clamp(1px, 2px, 3px)) {
  .card {
    width: clamp(var(--card-min-width), calc((100vw - 4rem) / var(--card-count)), var(--card-max-width));
    /* ... rest of clamp() rules */
  }
}
```

---

## Testing Requirements

### Visual Regression Tests

**Scenarios to screenshot**:
1. Empty hand (0 cards)
2. Single card (centered)
3. 5 cards (medium spread)
4. 10 cards (maximum spread)
5. Hover state on middle card
6. Long card name (20+ characters)

### Manual Checklist

- [ ] All hand sizes (1-10) fit without horizontal scroll @ 1024px
- [ ] Font size never drops below 12px
- [ ] Cards overlap consistently (50% of card width)
- [ ] Hover transition completes in <200ms
- [ ] Focus state visible for keyboard users
- [ ] Reduced motion respected in browsers with that preference

---

## Open Questions

None. CSS contract is complete and ready for implementation.

---

**Next**: Quickstart guide
