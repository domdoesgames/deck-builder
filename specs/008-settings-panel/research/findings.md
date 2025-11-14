# Settings Panel Research Findings

## 1. localStorage Best Practices

### Decision: Type-Safe Wrapper with Silent Fallback Pattern

Use a typed wrapper around localStorage operations with try-catch blocks that gracefully degrade to default behavior on any failure.

### Rationale

1. **Graceful degradation**: Application continues to function even when localStorage fails (quota exceeded, privacy mode, disabled)
2. **Type safety**: TypeScript interfaces ensure consistency between saved and loaded data
3. **Debuggability**: Console.debug logs help developers identify issues without breaking user experience
4. **Proven pattern**: Already successfully implemented in `persistenceManager.ts` (FR-003)

### Existing Implementation Analysis

Current codebase (`src/lib/persistenceManager.ts:20-35`) demonstrates best practices:

```typescript
export function saveDeckState(state: DeckState): boolean {
  try {
    const { selectedCardIds, isDealing, ...persistedState } = state
    const serialized = JSON.stringify(persistedState)
    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (error) {
    // Silent failure for quota exceeded, privacy mode, etc.
    console.debug('Failed to save deck state to localStorage:', error)
    return false
  }
}
```

### Recommended Pattern for Settings Panel

```typescript
// Settings type definition
interface SettingsState {
  isPanelExpanded: boolean
  theme?: 'light' | 'dark' | 'auto'
  animationsEnabled?: boolean
}

// Constants
const SETTINGS_STORAGE_KEY = 'deck-builder:settings'

// Default settings
const DEFAULT_SETTINGS: SettingsState = {
  isPanelExpanded: false,
  animationsEnabled: true,
}

// Type-safe save function
function saveSettings(settings: SettingsState): boolean {
  try {
    const serialized = JSON.stringify(settings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, serialized)
    return true
  } catch (error) {
    console.debug('Failed to save settings to localStorage:', error)
    return false
  }
}

// Type-safe load function with validation
function loadSettings(): SettingsState {
  try {
    const serialized = localStorage.getItem(SETTINGS_STORAGE_KEY)
    
    if (!serialized || serialized.trim() === '') {
      return DEFAULT_SETTINGS
    }

    const parsed = JSON.parse(serialized) as Partial<SettingsState>
    
    // Merge with defaults to handle missing/new fields
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch (error) {
    console.debug('Failed to load settings from localStorage:', error)
    return DEFAULT_SETTINGS
  }
}
```

### Key Naming Conventions

**Decision**: Use namespaced keys with colon separators

```typescript
// Good - namespaced and descriptive
'deck-builder:settings'
'deck-builder:deck-state'

// Avoid - generic names that might conflict
'settings'
'state'
```

**Rationale**: 
- Prevents key collisions with other apps on same domain
- Already established in codebase via `STORAGE_KEY` constant
- Clear ownership and purpose

### Type Safety Patterns

1. **Define explicit interfaces** for all persisted data
2. **Use Partial<T>** when loading to handle missing fields
3. **Merge with defaults** to ensure all required fields exist
4. **Avoid type assertions** without validation
5. **Return boolean success indicators** from save operations

### Error Handling Scenarios

| Scenario | Detection | Handling |
|----------|-----------|----------|
| QuotaExceededError | `localStorage.setItem()` throws | Silent failure, console.debug, return false |
| Privacy/Incognito mode | `localStorage.getItem()` returns null | Use defaults, no error |
| Disabled localStorage | Access throws exception | Catch, use in-memory state |
| Corrupted JSON | `JSON.parse()` throws | Catch, return defaults |
| Schema changes | Missing/extra fields | Merge with defaults |

### Alternatives Considered

1. **In-memory fallback storage**: Adds complexity for minimal benefit since app reloads anyway
2. **IndexedDB**: Overkill for simple key-value settings
3. **Throwing errors**: Breaks user experience unnecessarily
4. **sessionStorage**: Loses data on tab close, not suitable for settings persistence

---

## 2. React Accessibility for Collapsible Panels

### Decision: Button-Based Trigger with Comprehensive ARIA

Use a `<button>` element with `aria-expanded`, `aria-controls`, and proper keyboard handling.

### Rationale

1. **Semantic HTML**: Buttons are natively keyboard accessible and screen-reader friendly
2. **ARIA best practices**: `aria-expanded` communicates state, `aria-controls` links to content
3. **Standard pattern**: Recognized by all assistive technologies
4. **Keyboard support**: Space/Enter keys work automatically with buttons
5. **Focus management**: Buttons are naturally focusable

### Recommended Implementation

```typescript
interface SettingsPanelProps {
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SettingsPanel({ isExpanded, onToggle, children }: SettingsPanelProps) {
  const panelId = 'settings-panel-content'
  
  return (
    <section aria-labelledby="settings-heading">
      <button
        id="settings-toggle"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="settings-toggle"
      >
        <span id="settings-heading">Settings</span>
        <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      <div
        id={panelId}
        role="region"
        aria-labelledby="settings-heading"
        hidden={!isExpanded}
        className={`settings-content ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        {children}
      </div>
    </section>
  )
}
```

### ARIA Attributes Breakdown

| Attribute | Purpose | Value |
|-----------|---------|-------|
| `aria-expanded` | Indicates if controlled content is expanded | `true` or `false` |
| `aria-controls` | Links button to controlled element via ID | ID of content div |
| `aria-labelledby` | Associates region with its heading | ID of heading element |
| `aria-hidden` | Hides decorative icons from screen readers | `true` for chevrons |
| `hidden` | Hides content when collapsed | Boolean attribute |

### Keyboard Navigation Pattern

**Decision**: Support Space and Enter keys (handled automatically by `<button>`)

```typescript
// Button handles Space/Enter automatically, but for custom handlers:
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault() // Prevent page scroll on Space
    onToggle()
  }
}
```

**Existing pattern in codebase** (`HandView.tsx:109-117`):
```typescript
const handleKeyPress = (e: React.KeyboardEvent, instanceId: string) => {
  if (playOrderLocked) return
  
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    handleCardClick(instanceId)
  }
}
```

### Screen Reader Announcements

**Decision**: Use native HTML semantics + ARIA, avoid custom announcements

**Rationale**:
- `aria-expanded` automatically announces "expanded" or "collapsed" state
- State changes are announced without additional `aria-live` regions
- Less intrusive than custom announcements
- Consistent with platform conventions

**When to use aria-live**:
- Dynamic content updates inside the panel
- Error messages that appear
- Success confirmations

```typescript
// For error messages inside panel
<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

### Focus Management

**Decision**: Don't move focus automatically on expand/collapse

**Rationale**:
- Unexpected focus changes confuse users
- User initiated the action, they know where they are
- Focus remains on toggle button (user expectation)

**Exception**: If panel contains critical error information, consider moving focus:

```typescript
const panelContentRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (isExpanded && hasError && panelContentRef.current) {
    // Focus first focusable element in panel
    const firstFocusable = panelContentRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    firstFocusable?.focus()
  }
}, [isExpanded, hasError])
```

### Alternatives Considered

1. **`<details>` element**: Native HTML solution but limited styling control, animation challenges
2. **`role="button"` on div**: Requires manual keyboard handling, less semantic
3. **Custom focus trapping**: Overkill for settings panel, needed for modals only
4. **aria-live announcements**: Redundant with aria-expanded, creates announcement spam

---

## 3. Error-Triggered Panel Expansion

### Decision: Controlled useEffect with Stable Dependencies

Use `useEffect` that responds to error state changes while preventing infinite loops through careful dependency management.

### Rationale

1. **Separation of concerns**: Error state lives in parent, panel just displays
2. **Predictable behavior**: useEffect with error-related dependencies is explicit
3. **No infinite loops**: Effect doesn't modify its own dependencies
4. **Testable**: Clear cause-and-effect relationship
5. **Maintains user control**: Auto-expansion only on new errors, not every render

### Recommended Implementation

```typescript
interface SettingsPanelContainerProps {
  errors: string[]  // Or ErrorState object
  children: React.ReactNode
}

export function SettingsPanelContainer({ errors, children }: SettingsPanelContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const previousErrorCountRef = useRef(0)

  // Auto-expand when NEW errors appear
  useEffect(() => {
    const currentErrorCount = errors.length
    
    // Only expand if error count INCREASED (new errors appeared)
    if (currentErrorCount > previousErrorCountRef.current && currentErrorCount > 0) {
      setIsExpanded(true)
    }
    
    // Update the ref for next comparison
    previousErrorCountRef.current = currentErrorCount
  }, [errors.length]) // Depend on count, not array reference

  return (
    <SettingsPanel 
      isExpanded={isExpanded} 
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      {errors.length > 0 && (
        <div role="alert" aria-live="polite" className="error-messages">
          {errors.map((error, i) => (
            <p key={i} className="error-message">{error}</p>
          ))}
        </div>
      )}
      {children}
    </SettingsPanel>
  )
}
```

### Preventing Infinite Loops - Key Patterns

| Anti-Pattern | Why It Loops | Fix |
|--------------|--------------|-----|
| `useEffect(() => { if (error) setExpanded(true) }, [expanded])` | Effect modifies its dependency | Remove `expanded` from deps |
| `useEffect(() => { if (error) setExpanded(true) }, [error])` | Object/array reference changes every render | Use `errors.length` or memoize |
| `useEffect(() => { if (!expanded && error) setExpanded(true) })` | No dependency array | Add `[error.length]` |

### Safe Dependency Patterns

```typescript
// ✅ GOOD - Depends on primitive value
useEffect(() => {
  if (errors.length > 0) setIsExpanded(true)
}, [errors.length])

// ✅ GOOD - Uses ref to track previous state
useEffect(() => {
  if (errorCount > prevErrorCountRef.current) {
    setIsExpanded(true)
  }
  prevErrorCountRef.current = errorCount
}, [errorCount])

// ✅ GOOD - Memoized object comparison
const errorHash = useMemo(() => errors.join('|'), [errors])
useEffect(() => {
  if (errorHash) setIsExpanded(true)
}, [errorHash])

// ❌ BAD - Array reference changes every render
useEffect(() => {
  if (errors.length > 0) setIsExpanded(true)
}, [errors])

// ❌ BAD - Effect modifies its own dependency
useEffect(() => {
  if (hasError && !isExpanded) setIsExpanded(true)
}, [hasError, isExpanded])
```

### Error State Management

**Recommendation**: Use discriminated union for error state

```typescript
type ErrorState = 
  | { type: 'none' }
  | { type: 'storage_failed', message: string }
  | { type: 'validation_failed', fields: string[] }

// Easy to track state changes
useEffect(() => {
  if (errorState.type !== 'none') {
    setIsExpanded(true)
  }
}, [errorState.type])
```

### One-Time vs. Repeated Expansion

**Decision**: Expand on EACH new error, not just first

```typescript
// Track error identity, not just presence
const previousErrorsRef = useRef<Set<string>>(new Set())

useEffect(() => {
  const currentErrors = new Set(errors)
  
  // Check if there are NEW errors (not seen before)
  const hasNewErrors = errors.some(err => !previousErrorsRef.current.has(err))
  
  if (hasNewErrors && errors.length > 0) {
    setIsExpanded(true)
  }
  
  previousErrorsRef.current = currentErrors
}, [errors])
```

**Alternative**: Expand only on first error

```typescript
// Simpler: just expand once when errors appear
const [hasEverExpanded, setHasEverExpanded] = useState(false)

useEffect(() => {
  if (errors.length > 0 && !hasEverExpanded) {
    setIsExpanded(true)
    setHasEverExpanded(true)
  }
}, [errors.length, hasEverExpanded])
```

### Alternatives Considered

1. **Derive expansion from error state**: `const isExpanded = errors.length > 0` - Removes user control, can't manually collapse
2. **Event-based system**: Overly complex for simple state change
3. **useReducer**: More boilerplate than necessary for this simple case
4. **Global state manager**: Overkill unless already using Redux/Zustand

---

## 4. CSS Animation Performance

### Decision: CSS Grid + max-height with GPU-Accelerated Transforms

Use `max-height` for collapse animation with `transform: translateY()` for smooth performance and `prefers-reduced-motion` support.

### Rationale

1. **Performance**: `max-height` triggers reflow but acceptable for small panels; `transform` is GPU-accelerated
2. **Smooth animation**: CSS transitions handle intermediate states automatically
3. **Accessibility**: `prefers-reduced-motion` respects user preferences
4. **Simplicity**: No JavaScript animation required
5. **Reliable**: Works across all modern browsers

### Recommended Implementation

```css
/* Settings panel animations with accessibility */

.settings-panel {
  --animation-duration: 0.3s;
  --animation-easing: ease-in-out;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .settings-panel {
    --animation-duration: 0.01s; /* Near-instant, but still triggers transitions */
  }
}

/* Toggle button */
.settings-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  cursor: pointer;
  transition: background-color var(--animation-duration) var(--animation-easing);
}

.settings-toggle:hover {
  background-color: var(--pico-secondary-hover);
}

/* Content area - use max-height for collapse */
.settings-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--animation-duration) var(--animation-easing);
}

.settings-content.expanded {
  max-height: 500px; /* Set larger than expected content height */
}

/* Inner wrapper for transform animation (optional performance boost) */
.settings-content__inner {
  padding: 0 1rem;
  transform: translateY(-10px);
  opacity: 0;
  transition: 
    transform var(--animation-duration) var(--animation-easing),
    opacity var(--animation-duration) var(--animation-easing);
}

.settings-content.expanded .settings-content__inner {
  transform: translateY(0);
  opacity: 1;
}

/* Alternative: Use CSS Grid for smoother animation */
.settings-content-grid {
  display: grid;
  grid-template-rows: 0fr; /* Collapsed */
  transition: grid-template-rows var(--animation-duration) var(--animation-easing);
}

.settings-content-grid.expanded {
  grid-template-rows: 1fr; /* Expanded */
}

.settings-content-grid__inner {
  overflow: hidden;
}
```

### CSS Properties Performance Comparison

| Property | Triggers Reflow | Triggers Repaint | GPU Accelerated | Performance |
|----------|----------------|------------------|-----------------|-------------|
| `height` | ✅ Yes | ✅ Yes | ❌ No | Poor |
| `max-height` | ✅ Yes | ✅ Yes | ❌ No | Acceptable |
| `transform: scaleY()` | ❌ No | ✅ Yes | ✅ Yes | Good (distorts) |
| `transform: translateY()` | ❌ No | ✅ Yes | ✅ Yes | Excellent |
| `opacity` | ❌ No | ✅ Yes | ✅ Yes | Excellent |
| `grid-template-rows` | ✅ Yes | ✅ Yes | ❌ No | Good |

### Recommended Approach: Grid Animation (Best of Both Worlds)

```typescript
export function SettingsPanel({ isExpanded, onToggle, children }: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <button 
        aria-expanded={isExpanded}
        onClick={onToggle}
        className="settings-toggle"
      >
        Settings
      </button>
      
      <div className={`settings-content-grid ${isExpanded ? 'expanded' : ''}`}>
        <div className="settings-content-grid__inner">
          {children}
        </div>
      </div>
    </div>
  )
}
```

```css
/* Grid-based collapse - no max-height guessing needed */
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
    transition-duration: 0.01s;
  }
}
```

### Accessibility: Reduced Motion

**Decision**: Honor `prefers-reduced-motion` by reducing duration to near-zero

```css
@media (prefers-reduced-motion: reduce) {
  .settings-panel * {
    animation-duration: 0.01s !important;
    transition-duration: 0.01s !important;
  }
}
```

**Rationale**:
- Users with vestibular disorders need minimal motion
- 0.01s maintains transition events while appearing instant
- Using 0s can break CSS transition event listeners

### Hidden Attribute vs. Display None

**Decision**: Use `hidden` attribute when collapsed

```typescript
<div
  hidden={!isExpanded}
  className={`settings-content ${isExpanded ? 'expanded' : ''}`}
>
```

```css
/* Override hidden to allow animation */
.settings-content[hidden] {
  display: grid; /* Keep in layout for animation */
  grid-template-rows: 0fr;
}

.settings-content:not([hidden]) {
  grid-template-rows: 1fr;
}
```

**Rationale**:
- `hidden` attribute provides semantic meaning
- Screen readers properly ignore hidden content
- Can be overridden with CSS for animation
- Better than managing `display: none` with classes

### Animation Event Handling

```typescript
const handleTransitionEnd = (e: React.TransitionEvent) => {
  // Only handle our transition, not child elements
  if (e.propertyName === 'grid-template-rows' && !isExpanded) {
    // Content is now fully collapsed, can remove from DOM if needed
    console.debug('Panel collapse animation complete')
  }
}

<div 
  className="settings-content-grid"
  onTransitionEnd={handleTransitionEnd}
>
```

### Alternatives Considered

1. **JavaScript animation libraries** (Framer Motion, React Spring): 
   - Pro: More control
   - Con: Bundle size, complexity overkill for simple collapse
   
2. **Pure transform: scaleY()**:
   - Pro: GPU accelerated
   - Con: Distorts content, poor UX

3. **Clip-path animation**:
   - Pro: GPU accelerated
   - Con: Complex, browser support issues, hard to get right

4. **Height: auto transition**:
   - Con: Doesn't work in CSS, requires JavaScript measurement

5. **No animation**:
   - Pro: Simplest, most accessible
   - Con: Feels jarring, less polished UX

---

## Summary Recommendations

### 1. localStorage
- Use type-safe wrappers with try-catch
- Namespaced keys: `deck-builder:settings`
- Silent failures with console.debug
- Merge loaded data with defaults

### 2. Accessibility
- `<button>` with `aria-expanded` and `aria-controls`
- Space/Enter keyboard support (automatic)
- `hidden` attribute when collapsed
- No custom focus management needed

### 3. Error Auto-Expansion
- `useEffect` with `errors.length` dependency
- Use ref to track previous error count
- Expand only on NEW errors
- Never depend on own state in effect

### 4. CSS Animation
- CSS Grid `grid-template-rows: 0fr/1fr` for smooth collapse
- `@media (prefers-reduced-motion)` with 0.01s duration
- No JavaScript animation libraries needed
- GPU-accelerated where possible

### Integration Example

```typescript
// SettingsPanel.tsx
interface SettingsPanelProps {
  errors: string[]
  onDismissError?: (index: number) => void
}

export function SettingsPanel({ errors, onDismissError }: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const previousErrorCountRef = useRef(0)
  const panelId = 'settings-panel-content'

  // Auto-expand on new errors
  useEffect(() => {
    if (errors.length > previousErrorCountRef.current && errors.length > 0) {
      setIsExpanded(true)
    }
    previousErrorCountRef.current = errors.length
  }, [errors.length])

  // Persist expansion state
  useEffect(() => {
    try {
      localStorage.setItem('deck-builder:settings-expanded', String(isExpanded))
    } catch (e) {
      console.debug('Failed to persist settings panel state', e)
    }
  }, [isExpanded])

  // Load expansion state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deck-builder:settings-expanded')
      if (saved === 'true') setIsExpanded(true)
    } catch (e) {
      console.debug('Failed to load settings panel state', e)
    }
  }, [])

  return (
    <section className="settings-panel" aria-labelledby="settings-heading">
      <button
        id="settings-toggle"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded(!isExpanded)}
        className="settings-toggle"
      >
        <span id="settings-heading">Settings</span>
        <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      <div
        id={panelId}
        role="region"
        aria-labelledby="settings-heading"
        hidden={!isExpanded}
        className={`settings-content-grid ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="settings-content-grid__inner">
          {errors.length > 0 && (
            <div role="alert" aria-live="polite" className="error-messages">
              {errors.map((error, i) => (
                <div key={i} className="error-message">
                  {error}
                  {onDismissError && (
                    <button 
                      onClick={() => onDismissError(i)}
                      aria-label={`Dismiss error: ${error}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Additional settings content */}
        </div>
      </div>
    </section>
  )
}
```

```css
/* SettingsPanel.css */
.settings-panel {
  --animation-duration: 0.3s;
  margin-bottom: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  .settings-panel {
    --animation-duration: 0.01s;
  }
}

.settings-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  background: var(--pico-background-color);
  border: 1px solid var(--pico-muted-border-color);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color var(--animation-duration) ease-in-out;
}

.settings-toggle:hover {
  background-color: var(--pico-secondary-hover);
}

.settings-content-grid {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--animation-duration) ease-in-out;
  border: 1px solid var(--pico-muted-border-color);
  border-top: none;
  border-radius: 0 0 0.25rem 0.25rem;
}

.settings-content-grid.expanded {
  grid-template-rows: 1fr;
}

.settings-content-grid__inner {
  overflow: hidden;
  padding: 0 1rem;
}

.error-messages {
  padding: 1rem 0;
}

.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: var(--pico-del-color);
  border-radius: 0.25rem;
  color: var(--pico-contrast);
}

.error-message button {
  margin-left: 1rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  color: inherit;
  cursor: pointer;
}
```
