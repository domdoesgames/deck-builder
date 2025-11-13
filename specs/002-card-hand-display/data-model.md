# Data Model: Card Hand Display

**Feature**: 002-card-hand-display  
**Date**: 2025-11-12  
**Phase**: 1 (Design & Contracts)

## Key Entities

Based on spec.md FR-001 to FR-012, this feature introduces two new domain concepts:

### 1. Card Visual

**Definition**: A visual representation of a single card in the hand display.

**Properties**:

| Property | Type | Source | Description |
|----------|------|--------|-------------|
| `value` | `string` | Passed from HandView props | The card's name/value (e.g., "Ace of Spades", "7♠") |
| `displayIndex` | `number` | Calculated from array position | Zero-based index in the hand (0-9) |
| `totalCards` | `number` | Derived from hand.length | Total number of cards in hand (1-10) |

**Visual States**:

- **Default**: Card at rest in hand layout
- **Hover**: Card elevated with shadow (`:hover` pseudo-class)
- **Focus**: Keyboard focus state (`:focus` pseudo-class, future)

**Layout Calculations** (CSS-driven):

```
cardWidth = clamp(80px, (viewportWidth - padding) / totalCards, 120px)
cardHeight = cardWidth * 1.5 (aspect ratio 2:3)
overlapOffset = cardWidth * -0.5 (for cards after first)
fontSize = clamp(12px, cardWidth * 0.133, 16px)
```

**Accessibility Attributes**:

- `role="article"` (semantic grouping)
- `aria-label="Card: {value}"` (screen reader announcement)
- `aria-hidden="true"` on decorative elements

**CSS Custom Properties** (set on card element):

```css
--card-index: [0-9]; /* displayIndex */
--card-count: [1-10]; /* totalCards */
```

---

### 2. Hand Layout

**Definition**: The spatial arrangement and container behavior for the collection of Card Visual elements.

**Properties**:

| Property | Type | Source | Description |
|----------|------|--------|-------------|
| `cardCount` | `number` | hand.length | Number of cards currently in hand (0-10) |
| `isEmpty` | `boolean` | cardCount === 0 | Whether hand is empty (triggers empty state) |
| `containerWidth` | `number` | CSS viewport units | Available width for card display |

**Layout Behavior**:

- **Alignment**: Horizontal flexbox, centered
- **Spacing**: Cards overlap using negative margin (except first card)
- **Responsive**: Cards resize based on `cardCount` to fit container
- **Empty State**: When `isEmpty === true`, display "No cards in hand" message

**Container Properties**:

```css
.hand-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 1rem;
  max-width: 100%;
  overflow: visible; /* Allow hover elevation to extend beyond container */
  
  /* CSS custom property for child calculations */
  --card-count: attr(data-card-count); /* Set via React */
}
```

**Empty State Structure**:

```html
<div class="hand-container hand-container--empty">
  <p class="hand-empty-message">No cards in hand</p>
</div>
```

---

## Data Flow

### From Hand Model to Visual Display

```
Hand (domain model - Feature 001)
  └─> hand: string[]        (e.g., ["7♠", "J♥", "A♦"])
       └─> HandView component (React)
            ├─> Hand Layout entity
            │    ├─> cardCount = hand.length
            │    └─> isEmpty = hand.length === 0
            │
            └─> For each card:
                 └─> Card Visual entity
                      ├─> value = hand[index]
                      ├─> displayIndex = index
                      └─> totalCards = hand.length
```

### CSS Custom Property Propagation

**React component sets data attributes**:

```tsx
<div 
  className="hand-container" 
  data-card-count={hand.length}
  style={{ '--card-count': hand.length } as React.CSSProperties}
>
  {hand.map((card, index) => (
    <div 
      className="card"
      data-card-index={index}
      style={{ '--card-index': index } as React.CSSProperties}
    >
      {card}
    </div>
  ))}
</div>
```

**CSS uses custom properties**:

```css
.card {
  width: clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px);
  margin-left: clamp(-60px, calc(-0.5 * clamp(80px, calc((100vw - 4rem) / var(--card-count, 1)), 120px)), -20px);
}

.card:first-child {
  margin-left: 0;
}
```

---

## State Transitions

### Hand Size Changes

**Scenario**: User changes hand size parameter, new hand dealt

```
Event: Hand size changes (e.g., 5 → 10 cards)
  ↓
HandView receives new hand prop
  ↓
React re-renders HandView
  ↓
Hand Layout recalculates:
  - cardCount: 5 → 10
  - CSS --card-count: 5 → 10
  ↓
Browser recalculates clamp() for all cards
  - cardWidth: ~120px → ~100px
  - overlapOffset: -60px → -50px
  ↓
Visual update (smooth, no animation needed)
```

### Card Hover Interaction

```
Event: Mouse enters card element
  ↓
Browser applies :hover pseudo-class
  ↓
CSS transition triggers:
  - transform: translateY(0) → translateY(-1.5rem)
  - z-index: 1 → 10
  - box-shadow: none → 0 8px 16px rgba(0,0,0,0.2)
  ↓
Transition duration: 200ms
  ↓
Event: Mouse leaves card element
  ↓
Transition reverses (200ms)
```

---

## Type Definitions (TypeScript)

### Component Props

```typescript
// src/components/HandView.tsx
export interface HandViewProps {
  hand: string[]; // Array of card values (from Feature 001)
}

// No additional prop interfaces needed - Card Visual is purely presentational
```

### CSS Type Augmentation (for custom properties)

```typescript
// src/types/css.d.ts (optional, for type safety)
import 'react';

declare module 'react' {
  interface CSSProperties {
    '--card-count'?: number;
    '--card-index'?: number;
  }
}
```

---

## Entity Lifecycle

### Card Visual

**Created**: When HandView renders each item in `hand` array  
**Updated**: When card `value` changes (rare - usually entire hand replaced)  
**Destroyed**: When card removed from hand (hand reset/redeal)

### Hand Layout

**Created**: When HandView component mounts  
**Updated**: When `hand.length` changes  
**Destroyed**: When HandView component unmounts (unlikely in single-page app)

---

## Validation Rules

### Card Visual

- ✅ `value` must be non-empty string (enforced by Feature 001 Deck model)
- ✅ `displayIndex` must be in range [0, totalCards-1]
- ✅ `totalCards` must be in range [0, 10] (enforced by Feature 001 hand size limits)

### Hand Layout

- ✅ `cardCount` must equal `hand.length` (React state consistency)
- ✅ `isEmpty` must equal `cardCount === 0` (derived property, always consistent)

---

## CSS Architecture

### Component Hierarchy

```
.hand-container
├── .hand-container--empty (modifier for empty state)
├── .card (repeating child)
│   ├── .card__value (semantic wrapper for card text)
│   └── .card__icon (optional decorative element, aria-hidden)
└── .hand-empty-message (shown when isEmpty === true)
```

### Modifier Classes

- `.hand-container--empty`: Applied when `hand.length === 0`
- `.card:hover`: Browser-applied pseudo-class for hover state
- `.card:focus`: Browser-applied pseudo-class for keyboard focus (future)

---

## Constraints & Assumptions

### From Constitution

- ✅ **Static Asset Simplicity**: All calculations done in CSS or client-side React (no server)
- ✅ **Deterministic Build**: No runtime dependencies on external services
- ✅ **Accessibility Baseline**: Semantic HTML + ARIA maintained

### From Spec Requirements

- ✅ **FR-004**: Layout must fit 1-10 cards without horizontal scroll (enforced by `clamp()` calculations)
- ✅ **FR-007**: Minimum 12px font size (enforced by `clamp(12px, ...)`)
- ✅ **FR-008**: Desktop viewports 1024px+ (CSS calculations assume this minimum)

### Performance Assumptions

- CSS `clamp()` calculations are fast (<16ms per frame) on modern browsers
- Transform animations are hardware-accelerated (GPU compositing)
- React re-renders for hand size changes are acceptable (<100ms for 10 cards)

---

**Next**: Component Contracts (Phase 1)
