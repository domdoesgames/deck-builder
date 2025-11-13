# Research: Specification Compliance Remediation

**Feature**: 005-spec-compliance-remediation  
**Date**: 2025-11-13  
**Status**: Complete

## Overview

This feature addresses documented gaps between specifications (features 001-004) and implementation. Research focuses on:
1. localStorage API failure modes and graceful degradation
2. React 18 useEffect persistence patterns
3. WCAG AA requirements for disabled/locked states
4. Browser compatibility for localStorage across modern browsers

## localStorage Persistence Research

### API Specifications

**Storage Capacity**:
- **Chrome/Edge**: ~10MB per origin
- **Firefox**: ~10MB per origin  
- **Safari**: ~5MB per origin (iOS may be lower)
- **Recommendation**: Keep state under 1MB (current DeckState ~10-50KB serialized)

**Quota Exceeded Handling**:
```typescript
try {
  localStorage.setItem(key, value)
} catch (e) {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    // Silent fallback per FR-003
    console.debug('localStorage quota exceeded, using in-memory state')
  }
}
```

**Privacy Mode Failures**:
- **Safari Private Browsing**: localStorage throws on `setItem()` (quota = 0)
- **Firefox Private Browsing**: localStorage available but cleared on session end
- **Chrome Incognito**: localStorage available, cleared on window close

**Recommendation**: Wrap all localStorage calls in try/catch, never expose errors to user (FR-003)

### Browser Compatibility

| Browser | localStorage Support | Notes |
|---------|---------------------|-------|
| Chrome 90+ | ✅ Full support | Standard behavior |
| Firefox 88+ | ✅ Full support | Standard behavior |
| Safari 14+ | ✅ Full support | Private browsing has quota=0 |
| Edge 90+ | ✅ Full support | Chromium-based, same as Chrome |

**Conclusion**: All target browsers support localStorage. Failure handling is critical for privacy modes.

### Serialization Approach

**JSON.stringify() Limitations**:
- `Set` objects → convert to array before serialization
- `undefined` values → omitted from output
- Functions → omitted from output
- `NaN`/`Infinity` → `null` in output

**Solution for DeckState**:
```typescript
const serialize = (state: DeckState): string => {
  return JSON.stringify({
    ...state,
    selectedCardIds: Array.from(state.selectedCardIds), // Set → array
    // Explicitly exclude transient fields
    isDealing: undefined,
  })
}

const deserialize = (raw: string): Partial<DeckState> => {
  const parsed = JSON.parse(raw)
  return {
    ...parsed,
    selectedCardIds: new Set(parsed.selectedCardIds || []), // array → Set
  }
}
```

---

## React 18 useEffect Persistence Patterns

### Auto-Save Pattern

**Recommended Approach** (debounced):
```typescript
import { useEffect, useRef } from 'react'

function useDebouncedPersistence(state: DeckState, delay = 100) {
  const timeoutRef = useRef<number | null>(null)
  
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify({
          ...state,
          selectedCardIds: undefined, // Don't persist
        })
        localStorage.setItem('deck-builder-state', serialized)
      } catch (e) {
        // Silent fallback per FR-003
        console.debug('Persistence failed:', e)
      }
    }, delay)
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [state, delay])
}
```

**Why Debounce?**:
- Avoid excessive localStorage writes during rapid state changes (e.g., selecting multiple cards)
- Performance optimization: 100ms delay groups multiple updates into single write
- Still feels instant to users (<100ms is imperceptible)

### Load Pattern

**Recommended Approach** (with validation):
```typescript
function loadPersistedState(): Partial<DeckState> | null {
  try {
    const raw = localStorage.getItem('deck-builder-state')
    if (!raw) return null
    
    const parsed = JSON.parse(raw)
    
    // Validate and sanitize (see stateValidator.ts)
    const validated = validateAndSanitize(parsed)
    
    if (!validated.isValid) {
      console.warn('Loaded state invalid, using defaults', validated.errors)
      return null
    }
    
    return validated.sanitizedState
  } catch (e) {
    // Corrupted JSON or other error
    console.debug('Failed to load state:', e)
    return null
  }
}
```

**Integration with Reducer**:
```typescript
const [state, dispatch] = useReducer(
  deckReducer,
  null, // Lazy init argument
  () => {
    const persisted = loadPersistedState()
    return persisted 
      ? { ...initializeDeck(), ...persisted }
      : initializeDeck()
  }
)

// Auto-save on every state change
useDebouncedPersistence(state)
```

---

## WCAG AA Accessibility Requirements

### Disabled/Locked State Requirements

**Contrast Requirements**:
- **Normal text**: 4.5:1 contrast ratio (WCAG AA Level)
- **Large text** (18pt+): 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio against adjacent colors
- **Focus indicators**: 3:1 contrast ratio, minimum 2px thick

**Applied to Feature 005**:
- Locked card opacity (0.7) must maintain 4.5:1 text contrast
- Sequence number badges must have 3:1 contrast in both planning and locked states
- Phase status indicators ("Planning"/"Executing") must have 4.5:1 text contrast
- Disabled cards must have 3:1 contrast difference from enabled state

**Keyboard Navigation**:
- All interactive elements must be keyboard accessible (Tab, Enter, Space)
- Non-interactive elements should have `tabIndex={-1}` (locked/disabled cards)
- Focus indicators must be visible (2px outline minimum)
- Focus order must match visual order

**Screen Reader Requirements**:
- Use semantic HTML (`role="article"` for cards per FR-024)
- ARIA labels must describe state: "Card: 7♠, play order position 2"
- State changes must be announced via ARIA live regions (`aria-live="polite"`)
- Disabled states must be announced (`aria-disabled="true"`)

### Phase Indicator Accessibility

**ARIA Live Region Pattern**:
```tsx
<div aria-live="polite" aria-atomic="true">
  {planningPhase && !playOrderLocked && (
    <span>Planning phase started. Select cards in your desired play order.</span>
  )}
  {playOrderLocked && (
    <span>Play order locked. Entering executing phase.</span>
  )}
</div>
```

**Why `polite` not `assertive`?**:
- Phase changes are not urgent interruptions
- Allows screen reader to finish current announcement
- Better UX for continuous reading

**Why `aria-atomic="true"`?**:
- Ensures entire message is re-announced on change
- Prevents partial updates that confuse context

---

## Zero Discard Count Edge Cases

### Contract Specification

From `specs/003-card-discard-mechanic/contracts/discard-phase.contract.md`:

> **Edge Case 1: Zero Discard Count**
> - `discardCount = 0` is valid (skip discard phase entirely)
> - Discard UI elements should not render
> - Planning phase begins immediately (if cards remain)

### Implementation Gaps Identified

**Current Behavior**:
1. `MIN_DISCARD_COUNT = 1` in constants.ts → blocks zero
2. Dropdown options start at 1 → user cannot select 0
3. `changeParameters()` clamps to minimum 1 → validation blocks zero

**Required Fixes**:
1. Change `MIN_DISCARD_COUNT = 0` (FR-006)
2. Add 0 to dropdown options (FR-007)
3. Remove clamping in `changeParameters()` (FR-006)
4. Update discard phase activation logic (FR-008):

```typescript
// In dealNextHand() action
const shouldActivateDiscard = handCards.length > 0 && discardCount > 0
// OLD: const shouldActivateDiscard = handCards.length > 0

return {
  ...state,
  hand,
  handCards,
  discardPhase: {
    active: shouldActivateDiscard,
    remainingDiscards: shouldActivateDiscard ? discardCount : 0
  }
}
```

### Edge Case Matrix

| discardCount | handSize | Expected Behavior |
|--------------|----------|-------------------|
| 0 | 0 | Skip discard, skip planning, allow END_TURN |
| 0 | 3 | Skip discard, enter planning phase |
| 0 | 10 | Skip discard, enter planning phase |
| 1 | 0 | N/A (no cards to discard) |
| 1 | 3 | Activate discard phase normally |

**Test Coverage Required**:
- `zeroDiscardFlow.test.tsx`: Full turn cycle with discardCount=0
- `deckReducer.test.ts`: Zero validation tests
- Contract test: `discardCount=0` skips phase (FR-008)

---

## Component Responsibility Migration

### Contract Violations Identified

From `specs/004-card-play-order/contracts/play-order-ui.contract.md`:

> **Component Responsibilities**
> - DeckControls: Game controls, Lock Order button, Clear Order button
> - HandView: Card display, card interaction (click to select/deselect)

**Current Implementation (WRONG)**:
- `HandView.tsx` renders Lock/Clear Order buttons
- `DeckControls.tsx` missing play order button support

**Required Migration**:
1. Remove buttons from `HandView.tsx` (FR-019)
2. Add button props to `DeckControls` interface (FR-018)
3. Implement buttons in `DeckControls.tsx` (FR-015, FR-016)
4. Add phase status indicator in `DeckControls.tsx` (FR-017)

### Migration Strategy

**Atomic Commit Approach** (recommended):
- Single commit changes both components simultaneously
- Avoids intermediate broken state
- Simplifies test updates (all at once)

**Test Impact**:
```typescript
// OLD: tests/unit/HandView.test.tsx
expect(screen.getByText('Lock Order')).toBeInTheDocument()

// NEW: tests/unit/DeckControls.test.tsx
expect(screen.getByText('Lock Order')).toBeInTheDocument()

// HandView tests updated to NOT expect buttons
expect(screen.queryByText('Lock Order')).not.toBeInTheDocument()
```

---

## Visual Design Corrections

### Card Dimension Gaps

**Contract Specification** (`specs/002-card-hand-display/contracts/HandView.contract.md`):
- Width range: 80-120px (not 100-160px as currently implemented)
- Aspect ratio: 2:3 (height = 1.5 × width)
- Layout: 50% overlap (negative margin-left), not gap spacing

**Current Implementation Gaps**:
1. Card width formula uses 100-160px range
2. Cards use `gap` property instead of overlap
3. Aspect ratio not enforced

**CSS Corrections Required**:
```css
/* OLD */
.hand {
  display: flex;
  gap: 10px; /* WRONG: should use overlap */
}

.card {
  width: clamp(100px, 15vw, 160px); /* WRONG RANGE */
  aspect-ratio: 2/3; /* Correct */
}

/* NEW */
.hand {
  display: flex;
  /* No gap - cards overlap */
}

.card {
  width: clamp(80px, 12vw, 120px); /* Correct range per contract */
  aspect-ratio: 2/3;
  margin-left: -50%; /* 50% overlap (except first card) */
}

.card:first-child {
  margin-left: 0; /* First card not overlapped */
}
```

### Locked State Styling

**Contract Requirements**:
- Opacity: 0.7 (FR-032)
- Grayscale filter: Optional, 20% if used (FR-033)
- Cursor: `not-allowed` or `default` (FR-034)
- No hover effects when locked (FR-014 from feature 004)

**Implementation**:
```css
.card--locked {
  opacity: 0.7;
  filter: grayscale(20%); /* Optional */
  cursor: not-allowed;
  pointer-events: none; /* Prevent hover/click */
}

/* Sequence badge color change when locked */
.card--locked .sequence-badge {
  background-color: var(--success-green); /* Green vs blue */
}
```

---

## State Validation Strategy

### Validation Rules

**Type Validation**:
- Arrays must be arrays (not null or non-array)
- Booleans must be boolean (coerce with `Boolean()`)
- Numbers must be numbers within valid ranges
- Sets must be converted from arrays on load

**Range Validation**:
- `turnNumber`: ≥ 1
- `handSize`: 1-10
- `discardCount`: 0-20 (Feature 005: allow 0)
- `playOrderSequence`: length ≤ handCards.length

**Sanitization**:
- Invalid arrays → reset to empty `[]`
- Invalid numbers → reset to defaults
- Missing fields → add with default values
- Extra fields → preserve (forward compatibility)

**Example Validation Function** (pseudo-code):
```typescript
function validateAndSanitize(loaded: unknown): ValidationResult {
  // Type guard
  if (typeof loaded !== 'object' || loaded === null) {
    return { isValid: false, sanitizedState: null, errors: [...] }
  }
  
  const errors: ValidationError[] = []
  const sanitized: Partial<DeckState> = {}
  
  // Validate each field
  sanitized.drawPile = Array.isArray(loaded.drawPile) 
    ? loaded.drawPile.filter(c => typeof c === 'string')
    : (errors.push({...}), [])
  
  // ... repeat for all fields
  
  // Transient fields always reset
  sanitized.selectedCardIds = new Set()
  sanitized.isDealing = false
  
  return {
    isValid: !errors.some(e => e.severity === 'error'),
    sanitizedState: sanitized,
    errors
  }
}
```

---

## Performance Considerations

### Persistence Performance

**Debounce Timing**:
- 100ms: Good balance between responsiveness and write reduction
- 250ms: May feel sluggish during rapid state changes
- 50ms: Minimal benefit over 100ms, more writes

**localStorage Write Performance**:
- Serialization (JSON.stringify): ~0.1ms for 50KB state
- localStorage.setItem: ~1-5ms (synchronous, blocks main thread)
- Total: <10ms per save (imperceptible to users)

**Recommendation**: 100ms debounce is optimal

### Render Performance

**React.memo Opportunities**:
```typescript
// Card components re-render on every state change
// Memoize to prevent unnecessary re-renders
export const Card = React.memo(({ card, isSelected, ... }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for deep equality
  return prevProps.instanceId === nextProps.instanceId &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.isLocked === nextProps.isLocked
})
```

**When to Apply**:
- Only if performance testing reveals render bottlenecks
- Not part of MVP (premature optimization)
- Add in Phase 6 (Polish) if needed

---

## Browser Testing Matrix

### localStorage Compatibility

| Browser | Version | localStorage | Private Mode | Notes |
|---------|---------|-------------|--------------|-------|
| Chrome | 90+ | ✅ | ✅ (clears on close) | Standard behavior |
| Firefox | 88+ | ✅ | ✅ (clears on close) | Standard behavior |
| Safari | 14+ | ✅ | ⚠️ (quota=0, throws) | Requires try/catch |
| Edge | 90+ | ✅ | ✅ (clears on close) | Chromium-based |

**Testing Strategy**:
1. Test normal mode: Save/load cycle works
2. Test private mode: Silent fallback, no errors shown
3. Test quota exceeded: Graceful degradation (manually fill storage)
4. Test corrupted data: Validation sanitizes or resets

---

## Summary of Research Findings

### Critical Decisions

1. **Persistence Pattern**: Debounced useEffect (100ms delay)
2. **Failure Handling**: Silent fallback to in-memory state (no user-visible errors)
3. **Validation Strategy**: Strict validation with sanitization fallbacks
4. **Accessibility**: ARIA live regions, semantic roles, keyboard support

### Implementation Priorities

**Must Have (P1)**:
- localStorage save/load with error handling
- Zero discard count support
- Locked card interaction guards

**Should Have (P2)**:
- Component migration (buttons to DeckControls)
- Phase status indicators with ARIA

**Nice to Have (P3-P4)**:
- Visual design corrections (card dimensions)
- Helper text format updates
- Performance optimizations (React.memo)

### Risk Mitigation

1. **localStorage Failures**: Comprehensive try/catch, fallback to in-memory
2. **State Corruption**: Validation layer with sanitization
3. **Performance**: Debounce writes, measure load times
4. **Accessibility**: WCAG AA compliance testing, screen reader validation

---

**Status**: Research complete, ready for implementation planning  
**Next Step**: Create detailed task breakdown (tasks.md)
