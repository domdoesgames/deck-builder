# Research: Collapsible Settings Panel

**Feature**: 008-settings-panel  
**Date**: 2025-11-14  
**Status**: Complete

## Overview

This document consolidates research findings for implementing a collapsible settings panel in the deck-builder React application. Research focused on four key technical areas: localStorage persistence, accessibility best practices, error-triggered auto-expansion, and CSS animation performance.

## 1. localStorage Persistence Pattern

### Decision

Use a type-safe wrapper around localStorage with try-catch blocks for graceful degradation.

### Rationale

- **Graceful degradation**: Application continues functioning when localStorage fails (quota exceeded, privacy mode, disabled)
- **Type safety**: TypeScript interfaces ensure consistency between saved and loaded data
- **Proven pattern**: Already successfully implemented in `persistenceManager.ts`
- **Debuggability**: Console.debug logs help developers without breaking UX

### Implementation Pattern

```typescript
interface SettingsState {
  isPanelExpanded: boolean
}

const SETTINGS_STORAGE_KEY = 'deck-builder:settings-expanded'
const DEFAULT_SETTINGS: SettingsState = { isPanelExpanded: false }

function saveSettings(settings: SettingsState): boolean {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch (error) {
    console.debug('Failed to save settings:', error)
    return false
  }
}

function loadSettings(): SettingsState {
  try {
    const serialized = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!serialized) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(serialized) }
  } catch (error) {
    console.debug('Failed to load settings:', error)
    return DEFAULT_SETTINGS
  }
}
```

### Alternatives Considered

- **In-memory fallback storage**: Adds complexity for minimal benefit
- **IndexedDB**: Overkill for simple boolean flag
- **Throwing errors**: Breaks user experience unnecessarily
- **sessionStorage**: Loses data on tab close

## 2. Accessibility for Collapsible Panels

### Decision

Use `<button>` element with `aria-expanded` and `aria-controls` attributes.

### Rationale

- **Semantic HTML**: Buttons are natively keyboard accessible and screen-reader friendly
- **ARIA best practices**: `aria-expanded` communicates state, `aria-controls` links to content
- **Standard pattern**: Recognized by all assistive technologies
- **Keyboard support**: Space/Enter keys work automatically with buttons
- **Existing pattern**: Matches keyboard handling in `HandView.tsx`

### Implementation Pattern

```typescript
<button
  aria-expanded={isExpanded}
  aria-controls="settings-panel-content"
  onClick={onToggle}
>
  <span>Settings</span>
  <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
</button>

<div
  id="settings-panel-content"
  role="region"
  aria-labelledby="settings-heading"
  hidden={!isExpanded}
>
  {children}
</div>
```

### Key ARIA Attributes

- **aria-expanded**: Indicates if controlled content is expanded (true/false)
- **aria-controls**: Links button to controlled element via ID
- **aria-labelledby**: Associates region with its heading
- **aria-hidden**: Hides decorative icons from screen readers
- **hidden**: Hides content when collapsed (semantic + CSS)

### Alternatives Considered

- **`<details>` element**: Native HTML solution but limited styling control
- **`role="button"` on div**: Requires manual keyboard handling, less semantic
- **Custom focus trapping**: Overkill for settings panel
- **aria-live announcements**: Redundant with aria-expanded

## 3. Error-Triggered Auto-Expansion

### Decision

Use `useEffect` with stable dependencies (error count) and `useRef` to track previous state.

### Rationale

- **Separation of concerns**: Error state lives in parent, panel just displays
- **Predictable behavior**: useEffect with error-related dependencies is explicit
- **No infinite loops**: Effect doesn't modify its own dependencies
- **Testable**: Clear cause-and-effect relationship
- **User control**: Auto-expansion only on new errors, user can still manually collapse

### Implementation Pattern

```typescript
const [isExpanded, setIsExpanded] = useState(false)
const previousErrorCountRef = useRef(0)

useEffect(() => {
  const currentErrorCount = errors.length
  
  // Only expand if error count INCREASED (new errors appeared)
  if (currentErrorCount > previousErrorCountRef.current && currentErrorCount > 0) {
    setIsExpanded(true)
  }
  
  previousErrorCountRef.current = currentErrorCount
}, [errors.length]) // Depend on count, not array reference
```

### Preventing Infinite Loops

**Anti-patterns to avoid**:
- `useEffect(() => { if (error) setExpanded(true) }, [expanded])` - Effect modifies its dependency
- `useEffect(() => { if (error) setExpanded(true) }, [error])` - Object reference changes every render
- `useEffect(() => { if (!expanded && error) setExpanded(true) })` - No dependency array

**Safe patterns**:
- Depend on primitive value: `errors.length`
- Use ref to track previous state
- Don't include state you're setting in dependencies

### Alternatives Considered

- **Derive expansion from error state**: Removes user control, can't manually collapse
- **Event-based system**: Overly complex for simple state change
- **useReducer**: More boilerplate than necessary
- **Global state manager**: Overkill unless already using Redux/Zustand

## 4. CSS Animation Performance

### Decision

Use CSS Grid `grid-template-rows: 0fr/1fr` with `prefers-reduced-motion` support.

### Rationale

- **Performance**: Grid animation is smooth and doesn't require max-height guessing
- **Accessibility**: `prefers-reduced-motion` respects user preferences
- **Simplicity**: No JavaScript animation libraries required
- **Reliable**: Works across all modern browsers
- **No distortion**: Unlike scaleY, content remains readable during animation

### Implementation Pattern

```css
.settings-content-grid {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-in-out;
}

.settings-content-grid.expanded {
  grid-template-rows: 1fr;
}

.settings-content-grid__inner {
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .settings-content-grid {
    transition-duration: 0.01s; /* Near-instant, maintains transition events */
  }
}
```

### Performance Comparison

| Property | Triggers Reflow | GPU Accelerated | Notes |
|----------|----------------|-----------------|-------|
| `height` | Yes | No | Poor performance |
| `max-height` | Yes | No | Acceptable but needs guessing |
| `transform: scaleY()` | No | Yes | Distorts content |
| `grid-template-rows` | Yes | No | Smooth, no guessing needed |
| `opacity` | No | Yes | Excellent for fade effects |

### Accessibility: Reduced Motion

**Key principle**: Honor `prefers-reduced-motion` by reducing duration to 0.01s (not 0s).

**Rationale**:
- Users with vestibular disorders need minimal motion
- 0.01s maintains transition events while appearing instant
- Using 0s can break CSS transition event listeners

### Alternatives Considered

- **JavaScript animation libraries** (Framer Motion): Bundle size overkill for simple collapse
- **Pure transform: scaleY()**: GPU accelerated but distorts content
- **Clip-path animation**: Complex, browser support issues
- **Height: auto transition**: Doesn't work in CSS without JavaScript
- **No animation**: Simplest but feels jarring

## Summary

All four research areas have clear, proven solutions that align with existing codebase patterns:

1. **localStorage**: Type-safe wrapper with silent failures (matches `persistenceManager.ts`)
2. **Accessibility**: Button-based with ARIA attributes (matches `HandView.tsx` patterns)
3. **Error expansion**: useEffect with ref tracking (prevents infinite loops)
4. **Animation**: CSS Grid with reduced-motion support (performant + accessible)

No significant technical risks identified. All patterns are well-established and compatible with the existing TypeScript/React/Pico CSS stack.
