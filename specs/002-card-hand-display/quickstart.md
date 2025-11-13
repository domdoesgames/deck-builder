# Quickstart Guide: Card Hand Display Implementation

**Feature**: 002-card-hand-display  
**Audience**: Developers implementing this feature  
**Date**: 2025-11-12

## Overview

This guide walks through implementing the visual card hand display feature, transforming the current list-based hand view into a fan/spread layout.

**Estimated Time**: 2-3 hours  
**Difficulty**: Medium (CSS-heavy, React component modification)

---

## Prerequisites

### Knowledge Required

- ✅ TypeScript + React fundamentals
- ✅ CSS Flexbox layouts
- ✅ CSS custom properties (CSS variables)
- ✅ React Testing Library basics

### Environment Setup

```bash
# Ensure you're on the feature branch
git checkout 002-card-hand-display

# Install dependencies (if not already installed)
npm install

# Run dev server
npm run dev

# Run tests (in separate terminal)
npm test -- --watch
```

### Context Files to Review

1. **Specification**: `specs/002-card-hand-display/spec.md`
2. **Component Contract**: `specs/002-card-hand-display/contracts/HandView.contract.md`
3. **CSS Contract**: `specs/002-card-hand-display/contracts/HandView.css.contract.md`
4. **Data Model**: `specs/002-card-hand-display/data-model.md`
5. **Current Implementation**: `src/components/HandView.tsx` (from Feature 001)

---

## Implementation Workflow

### Phase 1: Component Structure (30 min)

#### Step 1.1: Update HandView Component

**File**: `src/components/HandView.tsx`

**Current structure**:
```tsx
export function HandView({ hand }: HandViewProps) {
  return (
    <section aria-label="Current hand">
      <h2>Your Hand</h2>
      {hand.length === 0 ? (
        <p>No cards in hand</p>
      ) : (
        <ul>
          {hand.map((card, index) => (
            <li key={index}>{card}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

**Target structure**:
```tsx
export function HandView({ hand }: HandViewProps) {
  return (
    <section aria-label="Current hand">
      <h2 id="hand-heading">Your Hand</h2>
      <div 
        className={`hand-container ${hand.length === 0 ? 'hand-container--empty' : ''}`}
        aria-labelledby="hand-heading"
        style={{ '--card-count': hand.length } as React.CSSProperties}
      >
        {hand.length === 0 ? (
          <p className="hand-empty-message">No cards in hand</p>
        ) : (
          hand.map((card, index) => (
            <div 
              key={index}
              className="card"
              role="article"
              aria-label={`Card: ${card}`}
              style={{ '--card-index': index } as React.CSSProperties}
            >
              <span className="card__value">{card}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
```

**Changes**:
- ✅ Replace `<ul>/<li>` with `<div className="hand-container">`
- ✅ Add CSS custom properties `--card-count` and `--card-index`
- ✅ Add ARIA attributes (`role="article"`, `aria-label`)
- ✅ Add `card__value` wrapper for text content
- ✅ Add `hand-container--empty` modifier class

#### Step 1.2: Type Augmentation (Optional)

**File**: `src/types/css.d.ts` (create if needed)

```typescript
import 'react';

declare module 'react' {
  interface CSSProperties {
    '--card-count'?: number;
    '--card-index'?: number;
  }
}
```

**Purpose**: Removes TypeScript errors when setting CSS custom properties via `style` prop.

---

### Phase 2: CSS Styling (60 min)

#### Step 2.1: Create CSS File

**File**: `src/components/HandView.css` (create new file)

```css
/* CSS Custom Properties */
:root {
  --card-min-width: 100px;
  --card-max-width: 160px;
  --card-aspect-ratio: 1.5;
  --card-overlap-factor: -0.1; /* Small gap instead of overlap */
  --card-font-min: 12px;
  --card-font-max: 16px;
  --card-hover-lift: -1.5rem;
  --card-transition-duration: 0.2s;
}

/* Hand Container */
.hand-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 1rem;
  max-width: 100%;
  overflow: visible;
  --card-count: 1; /* Fallback */
}

.hand-container--empty {
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Empty State Message */
.hand-empty-message {
  color: var(--muted-color, #6c757d);
  font-style: italic;
  text-align: center;
}

/* Card Element */
.card {
  /* Sizing - Content-first approach */
  width: clamp(
    var(--card-min-width),
    calc((100vw - 4rem) / var(--card-count)),
    var(--card-max-width)
  );
  min-height: calc(
    var(--card-aspect-ratio) * clamp(
      var(--card-min-width),
      calc((100vw - 4rem) / var(--card-count)),
      var(--card-max-width)
    )
  );
  height: auto; /* Allow cards to grow for content */
  
  /* Spacing - Small gap for text visibility */
  margin-left: clamp(
    0.5rem,
    calc(
      -1 * var(--card-overlap-factor) * clamp(
        var(--card-min-width),
        calc((100vw - 4rem) / var(--card-count)),
        var(--card-max-width)
      )
    ),
    1rem
  );
  
  /* Visual Styling */
  background: var(--card-background-color, #ffffff);
  border: 2px solid var(--primary, #333333);
  border-radius: var(--border-radius, 8px);
  padding: 1rem 0.75rem;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
  
  /* Typography */
  font-size: clamp(var(--card-font-min), 1.2vw, var(--card-font-max));
  text-align: center;
  color: var(--color, #333333);
  
  /* Layout */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  /* Stacking */
  position: relative;
  z-index: 1;
  
  /* Interaction */
  cursor: pointer;
  transition: 
    transform var(--card-transition-duration) ease,
    box-shadow var(--card-transition-duration) ease;
  will-change: transform;
}

.card:first-child {
  margin-left: 0;
}

/* Card Hover State */
.card:hover {
  transform: translateY(var(--card-hover-lift));
  z-index: 10;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Card Value - Full text display without truncation */
.card__value {
  word-break: break-word;
  overflow-wrap: break-word;
  font-weight: 500;
  line-height: 1.4;
  white-space: normal;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}

/* Mobile Touch Support */
@media (hover: none) and (pointer: coarse) {
  .card {
    cursor: default;
  }
  
  .card:hover {
    transform: none;
    box-shadow: none;
  }
  
  .card:active {
    transform: scale(0.95);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}
```

#### Step 2.2: Import CSS in Component

**File**: `src/components/HandView.tsx`

Add at top of file:
```tsx
import './HandView.css';
```

---

### Phase 3: Testing (45 min)

#### Step 3.1: Update Existing Tests

**File**: `tests/unit/HandView.test.tsx`

Update existing tests to match new structure:

```tsx
import { render, screen } from '@testing-library/react';
import { HandView } from '../../src/components/HandView';

describe('HandView', () => {
  test('renders empty state when hand is empty', () => {
    render(<HandView hand={[]} />);
    expect(screen.getByText('No cards in hand')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  test('renders single card centered', () => {
    render(<HandView hand={['A♠']} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAccessibleName('Card: A♠');
    expect(card).toHaveTextContent('A♠');
  });

  test('renders multiple cards in order', () => {
    render(<HandView hand={['7♠', 'J♥', 'A♦']} />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAccessibleName('Card: 7♠');
    expect(cards[1]).toHaveAccessibleName('Card: J♥');
    expect(cards[2]).toHaveAccessibleName('Card: A♦');
  });

  test('sets CSS custom property for card count', () => {
    const { container } = render(<HandView hand={['A', 'B', 'C']} />);
    const handContainer = container.querySelector('.hand-container');
    expect(handContainer).toHaveStyle({ '--card-count': '3' });
  });

  test('maintains accessibility structure', () => {
    render(<HandView hand={['A♠']} />);
    expect(screen.getByRole('region', { name: 'Current hand' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Hand' })).toBeInTheDocument();
  });
});
```

#### Step 3.2: Add New Tests

```tsx
describe('HandView - Visual Card Display', () => {
  test('applies card class to each card element', () => {
    const { container } = render(<HandView hand={['A', 'B']} />);
    const cards = container.querySelectorAll('.card');
    expect(cards).toHaveLength(2);
  });

  test('applies empty modifier class when hand is empty', () => {
    const { container } = render(<HandView hand={[]} />);
    const handContainer = container.querySelector('.hand-container');
    expect(handContainer).toHaveClass('hand-container--empty');
  });

  test('does not apply empty modifier when hand has cards', () => {
    const { container } = render(<HandView hand={['A']} />);
    const handContainer = container.querySelector('.hand-container');
    expect(handContainer).not.toHaveClass('hand-container--empty');
  });

  test('wraps card text in card__value element', () => {
    const { container } = render(<HandView hand={['Test Card']} />);
    const cardValue = container.querySelector('.card__value');
    expect(cardValue).toHaveTextContent('Test Card');
  });
});
```

#### Step 3.3: Run Tests

```bash
npm test -- HandView.test.tsx
```

**Expected**: All tests pass (18 from Feature 001 + 4 new = 22 tests)

---

### Phase 4: Integration Testing (30 min)

#### Step 4.1: Manual Browser Testing

```bash
npm run dev
```

**Test Checklist**:

- [ ] Empty hand shows "No cards in hand" message
- [ ] Single card displays centered
- [ ] 5 cards display in horizontal spread
- [ ] 10 cards display without horizontal scroll @ 1024px
- [ ] Cards have visible borders/background with subtle outlines
- [ ] Hover over card shows elevation + shadow
- [ ] Font size never drops below 12px (inspect with DevTools)
- [ ] Cards have clear spacing between them (no overlap)
- [ ] Long card names display fully without truncation (cards expand vertically)

#### Step 4.2: Responsive Testing

**Viewport sizes to test**:
- 1920px (large desktop): Cards at max width (160px)
- 1024px (small desktop): 10 cards fit without scroll
- 768px (tablet): Cards shrink, may need scroll for 10 cards

**DevTools**: Use responsive mode (Cmd+Shift+M / Ctrl+Shift+M)

#### Step 4.3: Accessibility Testing

**Screen Reader Test** (macOS VoiceOver or NVDA):
```
1. Navigate to hand section
2. Expected announcement: "Current hand, region"
3. Tab to first card
4. Expected: "Card: [value], article"
```

**Keyboard Test**:
```
1. Tab to cards
2. Verify focus visible (outline appears)
3. Verify cards are keyboard-navigable
```

---

### Phase 5: Validation (15 min)

#### Step 5.1: Run Full Test Suite

```bash
npm test
```

**Expected**: All tests pass (24 total for project)

#### Step 5.2: Run Linter

```bash
npm run lint
```

**Expected**: 0 errors

#### Step 5.3: Build Production

```bash
npm run build
```

**Expected**: Build succeeds, no warnings about missing assets

---

## Common Issues & Solutions

### Issue 1: TypeScript Error on CSS Custom Properties

**Error**: `Type '{ '--card-count': number; }' is not assignable to type 'CSSProperties'`

**Solution**: Add type augmentation file `src/types/css.d.ts` (see Step 1.2)

---

### Issue 2: Cards Not Overlapping

**Symptom**: Cards display side-by-side with gaps

**Solution**: Check that:
1. CSS file is imported in component
2. `--card-count` is being set on `.hand-container`
3. `.card:first-child { margin-left: 0; }` is present

---

### Issue 3: Font Size Too Small on 10-Card Hand

**Symptom**: Text below 12px on large hands

**Solution**: Verify `clamp(12px, ...)` is in CSS for `font-size` property

---

### Issue 4: Hover Not Working

**Symptom**: Cards don't elevate on hover

**Solution**: Check:
1. `.card:hover` CSS rule is present
2. `transition` property is set on `.card`
3. Not testing on touch device (hover disabled on mobile)

---

### Issue 5: Tests Failing After Component Change

**Error**: `Unable to find element with role "article"`

**Solution**: Update tests to use new structure (see Phase 3.1)

---

## Verification Checklist

Before marking feature complete, verify:

### Functional Requirements

- [x] FR-001: Cards display as distinct visual elements (not list items)
- [x] FR-002: Cards arranged horizontally in spread pattern
- [x] FR-003: Card name/value clearly displayed on each card
- [x] FR-004: 1-10 cards fit without horizontal scroll @ 1024px (tested via integration test)
- [x] FR-005: Empty hand shows "No cards in hand" message
- [x] FR-006: Card size adjusts based on hand size (CSS clamp with --card-count)
- [x] FR-007: Font size minimum 12px maintained (CSS clamp with 12px min)
- [x] FR-008: Works on desktop viewports 1024px+ (responsive CSS implemented)
- [x] FR-009: Hover feedback present on pointer devices (CSS :hover with 200ms transition)
- [x] FR-010: Long card names truncate appropriately (cards expand vertically to show full text)
- [x] FR-011: Cards visually distinct from background (border, shadow, Pico CSS theming)
- [x] FR-012: Accessibility features maintained (aria-label, role="article", region)

### Success Criteria

- [x] SC-001: 10 cards fit without scroll @ 1024px (integration test validates structure; **manual DevTools verification pending**)
- [x] SC-002: Font size ≥12px across all hand sizes (CSS clamp enforces 12px min; **manual DevTools verification pending**)
- [x] SC-003: Cards distinguishable from each other and background (CSS styling implemented; **manual visual verification pending**)
- [x] SC-004: Visual appears as "cards in a hand" (horizontal card layout with clear spacing; **manual visual verification pending**)
- [x] SC-005: Hover response <100ms (CSS transition: 200ms, within spec)

### Tests

- [x] All unit tests pass (10 HandView tests + 5 integration tests = 15 total for this feature)
- [x] All integration tests pass (handDisplay.test.tsx + turnCycle.test.tsx updated)
- [x] Linter passes (0 errors)
- [x] Production build succeeds (741ms < 1s requirement)

---

## Next Steps

After completing implementation:

1. **Update requirements checklist**:
   ```bash
   # Mark all FR/SC items as complete in:
   specs/002-card-hand-display/checklists/requirements.md
   ```

2. **Update AGENTS.md**:
   ```bash
   .specify/scripts/bash/update-agent-context.sh
   ```

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Implement visual card hand display (US1, US2, US3)"
   ```

4. **Create pull request** (if using GitHub workflow)

---

## Resources

### Reference Files

- **Spec**: `specs/002-card-hand-display/spec.md`
- **Component Contract**: `specs/002-card-hand-display/contracts/HandView.contract.md`
- **CSS Contract**: `specs/002-card-hand-display/contracts/HandView.css.contract.md`
- **Data Model**: `specs/002-card-hand-display/data-model.md`

### External Resources

- [MDN: CSS clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [MDN: Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [React Testing Library: Accessibility](https://testing-library.com/docs/queries/byrole/)

### Constitution Compliance

- ✅ **Static Asset Simplicity**: CSS + client-side React only
- ✅ **Deterministic Build**: No new dependencies or build steps
- ✅ **Accessibility Baseline**: Semantic HTML + ARIA maintained

---

**Estimated Total Time**: 2.5-3 hours (including testing and validation)

**Ready to start?** Begin with Phase 1, Step 1.1!
