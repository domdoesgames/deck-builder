# Quickstart Guide: Collapsible Settings Panel Implementation

**Feature**: 008-settings-panel  
**Audience**: Developers implementing this feature  
**Date**: 2025-11-14

## Overview

This guide walks through implementing the collapsible settings panel feature, which wraps existing settings controls (DeckControls, JsonOverride) in a toggleable panel to reduce visual clutter.

**Estimated Time**: 2-3 hours  
**Difficulty**: Medium (React hooks, localStorage, CSS animations, error handling)

---

## Prerequisites

### Knowledge Required

- ✅ TypeScript + React fundamentals
- ✅ React hooks (`useState`, `useEffect`, `useRef`)
- ✅ localStorage API basics
- ✅ CSS Grid animations
- ✅ ARIA accessibility attributes
- ✅ React Testing Library

### Environment Setup

```bash
# Ensure you're on the feature branch
git checkout 008-settings-panel

# Install dependencies (should already be installed)
npm install

# Run dev server
npm run dev

# Run tests (in separate terminal)
npm test -- --watch
```

### Context Files to Review

1. **Specification**: `specs/008-settings-panel/spec.md`
2. **Plan**: `specs/008-settings-panel/plan.md`
3. **Data Model**: `specs/008-settings-panel/data-model.md`
4. **Component Contract**: `specs/008-settings-panel/contracts/settings-panel.contract.md`
5. **Hook Contract**: `specs/008-settings-panel/contracts/use-settings-visibility.contract.md`
6. **Existing Components**: `src/components/DeckControls.tsx`, `src/components/JsonOverride.tsx`
7. **Existing Hook**: `src/hooks/useDeckState.ts` (for error state)

---

## Implementation Workflow

### Phase 1: Hook Implementation (45 min)

#### Step 1.1: Create useSettingsVisibility Hook

**File**: `src/hooks/useSettingsVisibility.ts` (create new file)

```typescript
import { useState } from 'react';

const STORAGE_KEY = 'deck-builder:settings-expanded';

interface SettingsVisibilityState {
  isExpanded: boolean;
}

export interface UseSettingsVisibilityReturn {
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

function isValidSettingsState(data: unknown): data is SettingsVisibilityState {
  return (
    typeof data === 'object' &&
    data !== null &&
    'isExpanded' in data &&
    typeof (data as SettingsVisibilityState).isExpanded === 'boolean'
  );
}

function loadInitialState(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    
    const parsed = JSON.parse(raw);
    if (isValidSettingsState(parsed)) {
      return parsed.isExpanded;
    }
    
    return false;
  } catch (error) {
    console.debug('Failed to load settings visibility:', error);
    return false;
  }
}

function saveState(expanded: boolean): void {
  try {
    const data: SettingsVisibilityState = { isExpanded: expanded };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.debug('Failed to save settings visibility:', error);
    // Silent failure - app functions normally without persistence
  }
}

export function useSettingsVisibility(): UseSettingsVisibilityReturn {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => loadInitialState());

  return {
    isExpanded,
    toggleExpanded: () => {
      setIsExpanded(prev => {
        const next = !prev;
        saveState(next);
        return next;
      });
    },
    setExpanded: (expanded: boolean) => {
      setIsExpanded(expanded);
      saveState(expanded);
    }
  };
}
```

**Key Points**:
- ✅ Load state from localStorage on mount (lazy initialization)
- ✅ Fall back to `false` (collapsed) if localStorage unavailable
- ✅ Save state on every update
- ✅ Type guard validates loaded data
- ✅ Silent error handling (no crashes)

---

### Phase 2: Component Implementation (60 min)

#### Step 2.1: Create SettingsPanel Component

**File**: `src/components/SettingsPanel.tsx` (create new file)

```typescript
import { useEffect, useRef } from 'react';
import { useSettingsVisibility } from '../hooks/useSettingsVisibility';
import './SettingsPanel.css';

export interface SettingsPanelProps {
  error: string | null;
  children: React.ReactNode;
}

export function SettingsPanel({ error, children }: SettingsPanelProps) {
  const { isExpanded, toggleExpanded, setExpanded } = useSettingsVisibility();
  const errorCountRef = useRef(0);

  // Auto-expand on new errors
  useEffect(() => {
    if (error && !isExpanded) {
      // New error occurred while collapsed
      if (errorCountRef.current === 0) {
        // First error detection - expand panel
        setExpanded(true);
        errorCountRef.current = 1;
      }
      // else: Already saw an error, don't re-expand
    } else if (!error) {
      // Error cleared, reset counter for next error
      errorCountRef.current = 0;
    }
  }, [error, isExpanded, setExpanded]);

  return (
    <div className="settings-panel">
      <button
        className="settings-toggle"
        aria-expanded={isExpanded}
        aria-controls="settings-content"
        type="button"
        onClick={toggleExpanded}
      >
        Settings
        <span className="toggle-icon" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
      
      <div
        id="settings-content"
        className={`settings-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        role="region"
        aria-labelledby="settings-toggle"
      >
        <div className="settings-content__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Key Points**:
- ✅ Use `useSettingsVisibility` hook for state
- ✅ Track error count with `useRef` (persists across renders)
- ✅ Auto-expand only on first error (count === 0)
- ✅ Reset counter when error clears
- ✅ ARIA attributes for accessibility
- ✅ Inner wrapper for CSS Grid animation

---

#### Step 2.2: Create SettingsPanel CSS

**File**: `src/components/SettingsPanel.css` (create new file)

```css
/* Settings Panel Container */
.settings-panel {
  margin: 1rem 0;
}

/* Toggle Button */
.settings-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--spacing, 1rem);
  background: var(--card-background-color, #ffffff);
  border: 1px solid var(--muted-border-color, #dee2e6);
  border-radius: var(--border-radius, 8px);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color, #333333);
  transition: background 0.2s ease;
}

.settings-toggle:hover {
  background: var(--secondary-hover, #f8f9fa);
}

.settings-toggle:focus-visible {
  outline: 2px solid var(--primary, #0066cc);
  outline-offset: 2px;
}

.toggle-icon {
  margin-left: auto;
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

/* Settings Content - Grid Animation */
.settings-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
  overflow: hidden;
}

.settings-content.expanded {
  grid-template-rows: 1fr;
}

.settings-content__inner {
  min-height: 0; /* Required for grid row animation */
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .settings-content,
  .toggle-icon {
    transition: none;
  }
}
```

**Key Points**:
- ✅ CSS Grid `grid-template-rows` for smooth expansion
- ✅ Pico CSS variables for theming consistency
- ✅ Focus visible outline for keyboard navigation
- ✅ Respects `prefers-reduced-motion`
- ✅ Inner wrapper needed for grid animation

---

### Phase 3: App Integration (30 min)

#### Step 3.1: Update App Component

**File**: `src/App.tsx`

**Before** (current structure):
```tsx
function App() {
  const { state, dispatch } = useDeckState();
  // ...

  return (
    <div className="container">
      <h1>Deck Builder</h1>
      
      {state.error && <WarningBanner message={state.error} severity="error" />}
      {state.warning && <WarningBanner message={state.warning} severity="warning" />}
      
      <DeckControls
        handSize={state.handSize}
        discardCount={state.discardCount}
        // ...
      />
      
      <JsonOverride error={null} />
      
      {/* ... rest of app */}
    </div>
  );
}
```

**After** (with SettingsPanel):
```tsx
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const { state, dispatch } = useDeckState();
  // ...

  return (
    <div className="container">
      <h1>Deck Builder</h1>
      
      {/* Error no longer shown in WarningBanner - will be in JsonOverride */}
      {state.warning && <WarningBanner message={state.warning} severity="warning" />}
      
      <SettingsPanel error={state.error}>
        <DeckControls
          handSize={state.handSize}
          discardCount={state.discardCount}
          // ...
        />
        
        <JsonOverride error={state.error} />
      </SettingsPanel>
      
      {/* ... rest of app */}
    </div>
  );
}
```

**Changes**:
- ✅ Import `SettingsPanel` component
- ✅ Wrap `DeckControls` + `JsonOverride` in `<SettingsPanel>`
- ✅ Pass `error={state.error}` to SettingsPanel (for auto-expansion)
- ✅ Pass `error={state.error}` to JsonOverride (existing prop)
- ✅ Remove error display from top-level WarningBanner (now shown in JsonOverride)

---

### Phase 4: Testing (60 min)

#### Step 4.1: Unit Tests for Hook

**File**: `tests/unit/useSettingsVisibility.test.ts` (create new file)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useSettingsVisibility } from '../../src/hooks/useSettingsVisibility';

describe('useSettingsVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns false by default when no saved state', () => {
    const { result } = renderHook(() => useSettingsVisibility());
    expect(result.current.isExpanded).toBe(false);
  });

  test('loads saved expanded state from localStorage', () => {
    localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }));
    
    const { result } = renderHook(() => useSettingsVisibility());
    expect(result.current.isExpanded).toBe(true);
  });

  test('toggleExpanded flips state', () => {
    const { result } = renderHook(() => useSettingsVisibility());
    
    expect(result.current.isExpanded).toBe(false);
    
    act(() => {
      result.current.toggleExpanded();
    });
    
    expect(result.current.isExpanded).toBe(true);
    
    act(() => {
      result.current.toggleExpanded();
    });
    
    expect(result.current.isExpanded).toBe(false);
  });

  test('setExpanded sets state directly', () => {
    const { result } = renderHook(() => useSettingsVisibility());
    
    act(() => {
      result.current.setExpanded(true);
    });
    
    expect(result.current.isExpanded).toBe(true);
    
    act(() => {
      result.current.setExpanded(false);
    });
    
    expect(result.current.isExpanded).toBe(false);
  });

  test('saves state to localStorage on update', () => {
    const { result } = renderHook(() => useSettingsVisibility());
    
    act(() => {
      result.current.toggleExpanded();
    });
    
    const saved = JSON.parse(localStorage.getItem('deck-builder:settings-expanded')!);
    expect(saved.isExpanded).toBe(true);
  });

  test('handles localStorage errors gracefully', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    
    const { result } = renderHook(() => useSettingsVisibility());
    
    // Should not crash, defaults to false
    expect(result.current.isExpanded).toBe(false);
  });

  test('handles corrupted localStorage data', () => {
    localStorage.setItem('deck-builder:settings-expanded', 'not valid JSON');
    
    const { result } = renderHook(() => useSettingsVisibility());
    expect(result.current.isExpanded).toBe(false);
  });
});
```

---

#### Step 4.2: Unit Tests for Component

**File**: `tests/unit/SettingsPanel.test.tsx` (create new file)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPanel } from '../../src/components/SettingsPanel';

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders collapsed by default', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    );
    
    const button = screen.getByText('Settings');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('expands on toggle click', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    );
    
    const button = screen.getByText('Settings');
    
    fireEvent.click(button);
    
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Settings Content')).toBeVisible();
  });

  test('collapses on second toggle click', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    );
    
    const button = screen.getByText('Settings');
    
    fireEvent.click(button); // Expand
    fireEvent.click(button); // Collapse
    
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('auto-expands when error occurs while collapsed', () => {
    const { getByText, rerender } = render(
      <SettingsPanel error={null}>
        <div>Settings</div>
      </SettingsPanel>
    );
    
    expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'false');
    
    rerender(
      <SettingsPanel error="Invalid JSON">
        <div>Settings</div>
      </SettingsPanel>
    );
    
    expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
  });

  test('does not re-expand on error message change', () => {
    const { getByText, rerender } = render(
      <SettingsPanel error="First error">
        <div>Settings</div>
      </SettingsPanel>
    );
    
    // First error auto-expands
    expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
    
    // User manually collapses
    fireEvent.click(getByText('Settings'));
    expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'false');
    
    // Error message changes (still an error)
    rerender(
      <SettingsPanel error="Second error">
        <div>Settings</div>
      </SettingsPanel>
    );
    
    // Should NOT re-expand (error count > 0)
    expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'false');
  });

  test('loads saved expansion state on mount', () => {
    localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }));
    
    render(
      <SettingsPanel error={null}>
        <div>Settings</div>
      </SettingsPanel>
    );
    
    expect(screen.getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
  });

  test('maintains ARIA attributes', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings</div>
      </SettingsPanel>
    );
    
    const button = screen.getByText('Settings');
    expect(button).toHaveAttribute('aria-controls', 'settings-content');
    
    const content = screen.getByRole('region');
    expect(content).toHaveAttribute('id', 'settings-content');
  });
});
```

---

#### Step 4.3: Integration Test

**File**: `tests/integration/settingsVisibility.test.tsx` (create new file)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';

describe('Settings Panel Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('settings hidden by default on app load', () => {
    render(<App />);
    
    const settingsButton = screen.getByText('Settings');
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    
    // Verify DeckControls exists but is hidden
    const handSizeLabel = screen.queryByLabelText(/Hand Size/i);
    expect(handSizeLabel).not.toBeVisible();
  });

  test('error in JsonOverride auto-expands settings', () => {
    render(<App />);
    
    const settingsButton = screen.getByText('Settings');
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    
    // Expand settings to access JsonOverride
    fireEvent.click(settingsButton);
    
    // Enter invalid JSON
    const textarea = screen.getByLabelText(/Override deck state/i);
    fireEvent.change(textarea, { target: { value: 'invalid json' } });
    
    // Collapse settings
    fireEvent.click(settingsButton);
    expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
    
    // Trigger validation (blur or button click)
    fireEvent.blur(textarea);
    
    // Settings should auto-expand due to error
    await waitFor(() => {
      expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test('settings state persists across remount', () => {
    const { unmount } = render(<App />);
    
    // Expand settings
    fireEvent.click(screen.getByText('Settings'));
    
    // Unmount and remount
    unmount();
    render(<App />);
    
    // Settings should still be expanded
    expect(screen.getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
  });
});
```

---

#### Step 4.4: Run Tests

```bash
npm test -- useSettingsVisibility.test.ts
npm test -- SettingsPanel.test.tsx
npm test -- settingsVisibility.test.tsx
```

**Expected**: All tests pass

---

### Phase 5: Validation (30 min)

#### Step 5.1: Manual Browser Testing

```bash
npm run dev
```

**Test Checklist**:

- [ ] Page loads with settings collapsed by default
- [ ] Click "Settings" button expands panel smoothly (<300ms)
- [ ] DeckControls and JsonOverride visible when expanded
- [ ] Click "Settings" again collapses panel
- [ ] Toggle icon changes (▼ collapsed, ▲ expanded)
- [ ] Reload page preserves expansion state
- [ ] Enter invalid JSON while collapsed → settings auto-expand
- [ ] Error message visible in JsonOverride after auto-expansion
- [ ] Fix error → settings remain expanded (don't auto-collapse)
- [ ] Keyboard navigation: Tab to button, Space/Enter toggles

---

#### Step 5.2: Accessibility Testing

**Screen Reader Test** (VoiceOver/NVDA):
```
1. Navigate to Settings button
2. Expected: "Settings, button, collapsed"
3. Activate button
4. Expected: "Settings, button, expanded"
5. Navigate into settings region
6. Expected: Settings controls announced
```

**Keyboard Test**:
```
1. Tab to Settings button
2. Press Space or Enter → panel expands
3. Tab into settings area → controls focusable
4. Shift+Tab back to button
5. Press Space/Enter → panel collapses
```

**Reduced Motion Test**:
```
1. Enable "Reduce motion" in OS settings
2. Toggle settings panel
3. Verify: No animation (instant show/hide)
```

---

#### Step 5.3: Run Full Test Suite

```bash
npm test
```

**Expected**: All existing tests + new tests pass

---

#### Step 5.4: Lint and Build

```bash
npm run lint
npm run build
```

**Expected**: 0 errors, build succeeds

---

## Common Issues & Solutions

### Issue 1: CSS Grid Animation Not Working

**Symptom**: Panel appears/disappears instantly (no animation)

**Solution**: Check:
1. `.settings-content__inner` wrapper exists (required for grid animation)
2. `grid-template-rows: 0fr` and `1fr` are set correctly
3. `min-height: 0` on inner wrapper
4. CSS file imported in component

---

### Issue 2: Settings Don't Auto-Expand on Error

**Symptom**: Error occurs but panel stays collapsed

**Solution**: Verify:
1. `error` prop passed to SettingsPanel in App.tsx
2. `useEffect` dependency array includes `error`, `isExpanded`, `setExpanded`
3. Error state actually changes (not already set)
4. `errorCountRef.current` resets to 0 when error clears

---

### Issue 3: localStorage Not Persisting

**Symptom**: State resets on page reload

**Solution**: Check:
1. `saveState()` called in `toggleExpanded` and `setExpanded`
2. Browser not in private/incognito mode
3. localStorage quota not exceeded
4. No console errors about localStorage access

---

### Issue 4: Multiple Re-Expansions

**Symptom**: Panel keeps expanding even after user collapses it

**Solution**: Verify:
1. `errorCountRef` used (not state variable)
2. Check `errorCountRef.current === 0` before expanding
3. Counter increments to 1 after first expansion
4. Counter resets when `error` becomes `null`

---

### Issue 5: Test Failures on Auto-Expansion

**Symptom**: Integration test can't find error expansion

**Solution**: Use `waitFor()` for async state updates:
```typescript
await waitFor(() => {
  expect(button).toHaveAttribute('aria-expanded', 'true');
});
```

---

## Verification Checklist

Before marking feature complete:

### Functional Requirements

- [ ] FR-001: Settings hidden by default on page load
- [ ] FR-002: Toggle button labeled "Settings" at top of settings area
- [ ] FR-003: Single click expands settings
- [ ] FR-004: Single click collapses settings
- [ ] FR-005: Setting values preserved when toggling
- [ ] FR-006: Toggle button indicates current state
- [ ] FR-007: Visibility preference persists across reloads
- [ ] FR-008: Auto-expand on error while collapsed
- [ ] FR-009: Toggle button always visible/accessible
- [ ] FR-010: Keyboard accessible (Space/Enter)
- [ ] FR-011: Settings stay expanded after auto-expansion
- [ ] FR-012: Panel expands in place below toggle

### Success Criteria

- [ ] SC-001: 50% visual reduction when collapsed (manual check)
- [ ] SC-002: Single-click toggle
- [ ] SC-003: 100% persistence across reloads
- [ ] SC-004: No setting value loss
- [ ] SC-005: Clear state indication (icon change)
- [ ] SC-006: Error expansion <100ms

### Tests

- [ ] 7 hook unit tests pass
- [ ] 7 component unit tests pass
- [ ] 3 integration tests pass
- [ ] All existing tests still pass
- [ ] Linter passes (0 errors)
- [ ] Production build succeeds

---

## Next Steps

After completing implementation:

1. **Update requirements checklist**:
   ```bash
   # Mark all FR/SC items as complete in:
   specs/008-settings-panel/checklists/requirements.md
   ```

2. **Update AGENTS.md**:
   ```bash
   .specify/scripts/bash/update-agent-context.sh opencode
   ```

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Implement collapsible settings panel (US1-US4)"
   ```

4. **Create pull request** (optional)

---

## Resources

### Reference Files

- **Spec**: `specs/008-settings-panel/spec.md`
- **Plan**: `specs/008-settings-panel/plan.md`
- **Component Contract**: `specs/008-settings-panel/contracts/settings-panel.contract.md`
- **Hook Contract**: `specs/008-settings-panel/contracts/use-settings-visibility.contract.md`
- **Data Model**: `specs/008-settings-panel/data-model.md`

### External Resources

- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [MDN: grid-template-rows](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [React Testing Library: Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/)

### Constitution Compliance

- ✅ **Static Asset Simplicity**: Client-side only (localStorage + React state)
- ✅ **Deterministic Build**: No new dependencies or build changes
- ✅ **Accessibility Baseline**: ARIA attributes + keyboard navigation

---

**Estimated Total Time**: 2.5-3 hours (including testing and validation)

**Ready to start?** Begin with Phase 1, Step 1.1!
