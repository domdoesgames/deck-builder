# Research: Card Discard Mechanic (Feature 003)

**Date**: 2025-11-13  
**Phase**: 0 (Research)  
**Status**: Complete

## Overview

This document consolidates research findings for implementing the card discard mechanic, covering UUID generation, keyboard navigation patterns, state persistence, CSS selection feedback, and focus management for accessibility compliance.

---

## 1. Browser Support for `crypto.randomUUID()`

### Findings

**MDN Documentation**: [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)

- **Baseline**: Widely available since March 2022
- **Browser Support**:
  - Chrome 79+ ✅
  - Safari 13.1+ ✅
  - Firefox 75+ ✅
  - Edge 79+ ✅
- **Availability**: Secure contexts only (HTTPS)
- **Web Workers**: Available ✅
- **Return Value**: 36-character v4 UUID string (e.g., "36b8f84d-df4e-4d49-b662-bcde71a8764f")

### Recommendation

**Primary approach**: Use `crypto.randomUUID()` directly - browser support exceeds project requirements (Chrome 79+, Safari 13.1+, Firefox 75+ from plan.md)

**Fallback strategy** (defensive coding):
```typescript
export function generateCardInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments (unlikely given target browsers)
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Rationale**: The project targets modern browsers where `crypto.randomUUID()` has full support. The fallback provides defense-in-depth but is not expected to be needed in production.

---

## 2. React Keyboard Event Patterns

### Findings

**React Documentation**: [Common components - KeyboardEvent handler](https://react.dev/reference/react-dom/components/common#keyboardevent-handler)

**Key Event Properties**:
- `e.key`: String representing the key value (e.g., `' '`, `'Enter'`, `'Tab'`)
- `e.code`: Physical key code (e.g., `'Space'`, `'Enter'`)
- `e.preventDefault()`: Prevents default browser action
- Event bubbling: Keyboard events bubble in React

**React Patterns for Tab + Space/Enter**:

```typescript
// Pattern 1: onKeyDown handler (recommended for selection toggle)
function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault(); // Prevent scroll on Space, form submission on Enter
    toggleCardSelection(cardId);
  }
}

// Pattern 2: Using event.code (alternative, more specific)
function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    toggleCardSelection(cardId);
  }
}
```

**Tab Navigation**:
- Controlled via `tabIndex` prop (0 = natural tab order, -1 = programmatically focusable only)
- React does NOT need to handle Tab key explicitly - browser handles focus order
- Focus order follows DOM order when `tabIndex={0}`

### Recommendation

**Implementation**:
1. Add `tabIndex={0}` to each card element to make it keyboard-focusable
2. Add `onKeyDown` handler checking `event.key === ' '` or `event.key === 'Enter'`
3. Call `event.preventDefault()` to avoid scroll (Space) and form submission (Enter)
4. Focus order follows visual left-to-right card layout (natural DOM order)

**Code example**:
```tsx
<div
  className="card"
  tabIndex={0}
  onClick={() => toggleCardSelection(card.id)}
  onKeyDown={(e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleCardSelection(card.id);
    }
  }}
>
  {card.value}
</div>
```

---

## 3. Existing State Persistence Patterns

### Findings from Codebase Examination

**File**: `src/hooks/useDeckState.ts` (lines 10-13)
```typescript
const [state, dispatch] = useReducer(deckReducer, null, () => {
  // Lazy initialization with INIT action
  return deckReducer({} as DeckState, { type: 'INIT' })
})
```

**File**: `src/state/deckReducer.ts` (lines 37-52)
```typescript
function initializeDeck(): DeckState {
  const drawPile = [...DEFAULT_DECK]
  const initialState: DeckState = {
    drawPile,
    discardPile: [],
    hand: [],
    turnNumber: 1,
    handSize: DEFAULT_HAND_SIZE,
    discardCount: DEFAULT_DISCARD_COUNT,
    warning: null,
    error: null,
    isDealing: false,
  }
  return dealNextHand(initialState)
}
```

**Observation**: 
- **No localStorage usage found** in existing code
- State is ephemeral (resets on page refresh)
- Initialization uses reducer pattern with lazy initialization

### Implications for Feature 003

**From spec.md FR-011**: "System MUST preserve game state (hand contents and discard requirement) across page refreshes, but card selections are cleared and must be re-selected"

**From plan.md (line 83)**: "State persistence via existing localStorage pattern (hand/discard count only)"

**Discrepancy**: Plan assumes localStorage exists, but **codebase has no localStorage implementation**.

### Recommendation

**Two options**:

**Option A** (Minimal - align with existing behavior):
- Do NOT implement localStorage persistence for MVP
- Update plan.md to reflect current state (no persistence)
- Defer FR-011 to a future feature
- Selection state already transient (cleared on refresh per A1)

**Option B** (Implement persistence as specified):
- Add localStorage persistence in Phase 9 (tasks.md T105-T111)
- Serialize: `drawPile`, `discardPile`, `handCards`, `discardPhase`, `handSize`, `discardCount`
- Do NOT serialize: `selectedCardIds` (cleared on refresh)
- Use `localStorage.setItem('deckState', JSON.stringify(state))` after state changes
- Use `localStorage.getItem('deckState')` in `initializeDeck()`

**Recommended path**: **Option A** for MVP, then add persistence in a dedicated feature. This avoids scope creep and maintains focus on core discard mechanic.

**Action**: Update tasks.md T105 to remove assumption about "existing localStorage pattern"

---

## 4. CSS Selection Feedback Patterns

### Findings from Existing Code

**File**: `src/components/HandView.css` (lines 162-185)

Existing hover/focus styles:
```css
.card:hover {
  transform: translateY(var(--card-hover-lift)); /* -1.5rem */
  z-index: 10;
  box-shadow: var(--card-shadow-hover);
}

.card:focus {
  transform: translateY(var(--card-hover-lift));
  z-index: 10;
  box-shadow: var(--card-shadow-hover);
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}
```

### Best Practices for Selection Feedback

**Multi-modal feedback** (per WCAG):
1. **Border change**: Increase border width/color
2. **Opacity change**: Reduce opacity slightly (0.8-0.9)
3. **Transform**: Subtle visual shift (e.g., `translateY(-4px)`)
4. **Background**: Optional background color change
5. **Icon indicator**: Checkmark or "SELECTED" text

### Recommendation

**CSS for `.card.selected`**:
```css
.card.selected {
  /* Border: Thicker + primary color (visual distinction) */
  border: 3px solid var(--primary, #0066cc);
  
  /* Opacity: Slight reduction (indicates "used" state) */
  opacity: 0.85;
  
  /* Transform: Slight upward lift (differentiate from hover) */
  transform: translateY(-4px);
  
  /* Z-index: Ensure visibility */
  z-index: 5;
  
  /* Box shadow: Maintain depth */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  
  /* Background: Optional subtle color shift */
  background: var(--card-selected-background, rgba(0, 102, 204, 0.05));
}

/* Transition for smooth feedback */
.card {
  transition: 
    border 200ms ease,
    opacity 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease,
    background 200ms ease;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card.selected {
    /* Keep visual states, remove animation */
    transform: none;
  }
}
```

**Accessibility considerations**:
- Color contrast: Ensure border/background meet WCAG AA (3:1 for UI components)
- Multiple indicators: Don't rely solely on color (add border + opacity + transform)
- Screen readers: Use `aria-pressed="true"` attribute (already in tasks.md T056)

---

## 5. Focus Management for Keyboard Users (WCAG Requirements)

### WCAG 2.1 Success Criterion 2.4.7: Focus Visible (Level AA)

**Requirement**: "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible."

**Key Points from W3C Documentation**:
- Focus indicator must be visible (not time-limited)
- Applies to all keyboard-operable elements
- Can take different forms (border, outline, background change)
- Level AA compliance required for this project

**Sufficient Techniques**:
- **C15**: Using CSS to change presentation when element receives focus
- **C40**: Two-color focus indicator for contrast
- **C45**: Using CSS `:focus-visible` for keyboard focus indication
- **G195**: Using author-supplied, visible focus indicator

**Common Failures to Avoid**:
- **F55**: Using script to remove focus when focus is received
- **F78**: Styling outlines/borders in a way that removes focus indicator

### Existing Implementation Analysis

**File**: `src/components/HandView.css` (lines 176-185)
```css
.card:focus {
  transform: translateY(var(--card-hover-lift));
  z-index: 10;
  box-shadow: var(--card-shadow-hover);
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}
```

**Compliance check**:
- ✅ Visible focus indicator (3px outline)
- ✅ Color contrast (primary color, likely meets 3:1)
- ✅ Multiple visual cues (outline + shadow + transform)
- ✅ Not removed or hidden

### Recommendation

**Enhance for selected + focused state**:
```css
/* Focus indicator for non-selected cards */
.card:focus {
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}

/* Focus indicator for selected cards (distinct from non-selected) */
.card.selected:focus {
  outline: 3px solid var(--primary, #0066cc);
  outline-offset: 4px;
  /* Optional: Different outline style for clarity */
  outline-style: double;
}

/* Use :focus-visible for modern browsers (hide focus on click, show on keyboard) */
.card:focus:not(:focus-visible) {
  outline: none; /* Hide outline when clicked with mouse */
}

.card:focus-visible {
  outline: 3px solid var(--primary-focus, #0066cc);
  outline-offset: 4px;
}
```

**WCAG 2.1 Level AA compliance checklist**:
- ✅ Focus indicator visible (3px outline)
- ✅ Sufficient contrast (3:1 minimum for UI components)
- ✅ Not removed on focus
- ✅ Keyboard navigation supported (`tabIndex={0}`)
- ✅ Focus order follows visual layout (left-to-right DOM order)

**Additional consideration**: Screen reader support via `aria-pressed` (tasks.md T056) provides non-visual focus indication.

---

## Summary of Recommendations

### 1. UUID Generation
- ✅ Use `crypto.randomUUID()` directly (full browser support)
- ✅ Add defensive fallback for edge cases
- Implementation: `src/lib/cardInstance.ts`

### 2. Keyboard Navigation
- ✅ Use `onKeyDown` with `event.key === ' '` or `event.key === 'Enter'`
- ✅ Add `tabIndex={0}` to cards for focus order
- ✅ Call `event.preventDefault()` to avoid side effects

### 3. State Persistence
- ⚠️ **Critical finding**: No existing localStorage pattern in codebase
- ⚠️ Update tasks.md T105 to remove assumption
- ✅ Recommend Option A: Defer persistence to future feature (scope management)

### 4. CSS Selection Feedback
- ✅ Use border (3px) + opacity (0.85) + transform (-4px) + shadow
- ✅ Add transition (200ms) with reduced-motion support
- ✅ Ensure WCAG AA contrast (3:1 for UI components)

### 5. Focus Management
- ✅ Existing focus styles comply with WCAG 2.4.7 (Level AA)
- ✅ Enhance with `:focus-visible` for better UX (hide outline on click)
- ✅ Add distinct selected+focused state for clarity

---

## Action Items for Phase 1 (Design)

1. **data-model.md**: Define `CardInstance` type with `id: string` field
2. **contracts/card-selection.contract.md**: Specify selection toggle logic using researched patterns
3. **contracts/discard-phase.contract.md**: Clarify state persistence behavior (defer to future or implement in Phase 9)
4. **quickstart.md**: Include keyboard navigation code snippets from this research
5. **Update tasks.md**: Remove localStorage assumption from T105

---

**Research Complete**: Phase 0 → Proceed to Phase 1 (Design)
