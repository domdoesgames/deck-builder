# Component Contract: SettingsPanel

**Feature**: 008-settings-panel  
**Component**: `SettingsPanel`  
**Path**: `src/components/SettingsPanel.tsx`  
**Date**: 2025-11-14

## Purpose

Provides a collapsible wrapper for settings controls (DeckControls, JsonOverride), reducing visual clutter by hiding settings by default while maintaining accessibility and error visibility.

## Interface

### Props

```typescript
export interface SettingsPanelProps {
  error: string | null;  // Error state from parent, triggers auto-expansion
  children: React.ReactNode;  // Settings components to wrap (DeckControls, JsonOverride)
}
```

**Constraints**:
- `error` may be `null` (no error) or a string (error message)
- `children` should contain settings components (enforced by composition)

### Events

None. This is a presentational component with internal state management via hook.

## Behavior Contract

### GIVEN settings panel on initial load

**WHEN** component mounts for the first time

**THEN**:
- MUST attempt to load expansion state from localStorage
- MUST default to `isExpanded = false` if no saved state or load fails
- MUST render toggle button labeled "Settings"
- MUST hide children (settings controls)
- Toggle button MUST indicate collapsed state via `aria-expanded="false"`

---

### GIVEN settings are collapsed

**WHEN** user clicks toggle button

**THEN**:
- `isExpanded` MUST change to `true`
- Settings panel MUST expand with CSS animation (<300ms)
- Children MUST become visible
- Toggle button MUST update `aria-expanded="true"`
- New state MUST be saved to localStorage (best effort)

---

### GIVEN settings are expanded

**WHEN** user clicks toggle button

**THEN**:
- `isExpanded` MUST change to `false`
- Settings panel MUST collapse with CSS animation (<300ms)
- Children MUST become hidden
- Toggle button MUST update `aria-expanded="false"`
- New state MUST be saved to localStorage (best effort)

---

### GIVEN settings are collapsed AND no previous errors exist

**WHEN** `error` prop changes from `null` to non-null string

**THEN**:
- Settings panel MUST auto-expand: `setExpanded(true)`
- Expansion animation MUST trigger (<100ms response time)
- Children MUST become visible to show error in context
- Toggle button MUST update `aria-expanded="true"`
- New state MUST be saved to localStorage

---

### GIVEN settings are collapsed AND error already exists

**WHEN** `error` prop value changes (e.g., different error message)

**THEN**:
- Settings panel MUST remain collapsed (only new errors trigger expansion)
- Error count tracking prevents re-expansion on same error

---

### GIVEN settings auto-expanded due to error

**WHEN** error clears (`error` becomes `null`)

**THEN**:
- Settings panel MUST remain expanded (respects auto-expansion action)
- User must manually collapse to hide settings
- State preserved in localStorage

---

### WHEN component remounts (e.g., page reload)

**THEN**:
- MUST load expansion state from localStorage
- MUST apply saved state: `isExpanded = savedValue`
- Settings panel MUST render in saved state (no animation)
- If localStorage unavailable, fall back to default `false`

---

## Accessibility Contract

### Semantic Structure

```html
<div class="settings-panel">
  <button
    class="settings-toggle"
    aria-expanded={isExpanded}
    aria-controls="settings-content"
    type="button"
  >
    Settings
    <span class="toggle-icon" aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
  </button>
  
  <div
    id="settings-content"
    class={`settings-content ${isExpanded ? 'expanded' : 'collapsed'}`}
    role="region"
    aria-labelledby="settings-toggle"
  >
    {children}
  </div>
</div>
```

### Requirements

- MUST use `<button>` for toggle control (keyboard accessible)
- Toggle button MUST have `aria-expanded` attribute reflecting current state
- Toggle button MUST have `aria-controls` pointing to content container ID
- Content container MUST have `id="settings-content"` for ARIA relationship
- Content container SHOULD have `role="region"` for screen reader navigation
- Toggle icon MUST have `aria-hidden="true"` (decorative)
- Toggle button MUST be keyboard accessible (focusable, Space/Enter activation)

### Screen Reader Behavior

**Expected announcement** (when focusing toggle button):
```
"Settings, button, collapsed"  [when collapsed]
"Settings, button, expanded"   [when expanded]
```

**Expected announcement** (when expanding):
```
[Button clicked]
"Settings, button, expanded"
[Content revealed, user can navigate into settings region]
```

---

## Visual Contract (CSS Requirements)

### Toggle Button Styling

```css
.settings-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--spacing);
  background: var(--card-background-color);
  border: 1px solid var(--muted-border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s ease;
}

.settings-toggle:hover {
  background: var(--secondary-hover);
}

.settings-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.toggle-icon {
  margin-left: auto;
  transition: transform 0.2s ease;
}
```

### Expansion Animation

```css
.settings-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
  overflow: hidden;
}

.settings-content.expanded {
  grid-template-rows: 1fr;
}

.settings-content > * {
  min-height: 0;  /* Required for grid animation */
}

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .settings-content,
  .toggle-icon {
    transition: none;
  }
}
```

### Layout Requirements

- Toggle button MUST span full width of parent container
- Settings content MUST expand directly below toggle button (in-place)
- Panel MUST NOT shift other page content when expanding/collapsing
- Animation MUST complete in <300ms (FR-012)
- Animation MUST respect `prefers-reduced-motion` (instant transition)

---

## Performance Contract

### Render Performance

- Initial render MUST complete in <50ms
- Toggle action MUST respond in <100ms (state update + re-render)
- Expansion animation MUST complete in <300ms (CSS transition)
- Auto-expansion on error MUST trigger within 100ms of error detection (SC-006)

### Re-render Behavior

**Triggers for re-render**:
1. Toggle button clicked (state change)
2. `error` prop changes (parent re-render)
3. `children` prop changes (parent re-render)
4. Page reload (remount with saved state)

**No re-render when**:
- localStorage saves occur (async, no state change)
- User hovers over toggle button (pure CSS)
- Settings components inside panel re-render (isolated)

---

## Hook Integration Contract

### useSettingsVisibility Hook

**Component uses hook for state management**:

```typescript
const { isExpanded, toggleExpanded, setExpanded } = useSettingsVisibility();
```

**Hook responsibilities**:
- Load initial state from localStorage
- Provide `isExpanded` boolean
- Provide `toggleExpanded()` function (user clicks)
- Provide `setExpanded(value)` function (error auto-expansion)
- Save state changes to localStorage automatically

**Component responsibilities**:
- Render UI based on `isExpanded` state
- Call `toggleExpanded()` on button click
- Monitor `error` prop and call `setExpanded(true)` when new error occurs
- Pass `error` count tracking logic to hook via useEffect

---

## Error Auto-Expansion Contract

### Error Detection Logic

```typescript
const errorCountRef = useRef(0);

useEffect(() => {
  if (error && !isExpanded) {
    // New error occurred while collapsed
    if (errorCountRef.current === 0) {
      // First error detection
      setExpanded(true);
      errorCountRef.current = 1;
    } else {
      // Already saw an error, don't re-expand
    }
  } else if (!error) {
    // Error cleared, reset counter for next error
    errorCountRef.current = 0;
  }
}, [error, isExpanded, setExpanded]);
```

**Behavior**:
- Track error count via `useRef` (persists across renders)
- Detect transition from no-error to error state
- Auto-expand only on first error detection
- Reset counter when error clears (ready for next error)
- Don't re-expand if error message changes (count > 0)

---

## Edge Cases & Error Handling

### localStorage Unavailable

**Contract**: Component MUST function without localStorage

**Implementation**:
- Hook catches localStorage errors
- Falls back to session-only state (lost on reload)
- Component behavior unchanged (no user-visible errors)

**Test**:
```typescript
test('Component works when localStorage unavailable', () => {
  // Mock localStorage.getItem to throw
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('localStorage disabled');
  });
  
  const { getByText } = render(
    <SettingsPanel error={null}>
      <div>Settings Content</div>
    </SettingsPanel>
  );
  
  const toggleButton = getByText('Settings');
  expect(toggleButton).toBeInTheDocument();
  expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  
  // Should still toggle
  fireEvent.click(toggleButton);
  expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
});
```

---

### Rapid Toggle Clicks

**Contract**: Multiple rapid clicks MUST produce consistent final state

**Behavior**:
- Each click toggles state: `isExpanded = !isExpanded`
- Final state after N clicks: `initialState` XOR (N % 2 === 1)
- All state changes saved to localStorage (only last write matters)

**Test**:
```typescript
test('Rapid toggle clicks produce consistent state', () => {
  const { getByText } = render(
    <SettingsPanel error={null}>
      <div>Settings</div>
    </SettingsPanel>
  );
  
  const button = getByText('Settings');
  
  // 5 rapid clicks (odd number)
  for (let i = 0; i < 5; i++) {
    fireEvent.click(button);
  }
  
  // Should end up expanded (started collapsed)
  expect(button).toHaveAttribute('aria-expanded', 'true');
});
```

---

### Error While Expanded

**Contract**: Errors occurring while expanded MUST NOT trigger state change

**Behavior**:
- Check `!isExpanded` condition before auto-expanding
- If already expanded, error display handled by child components
- No unnecessary state changes or localStorage writes

**Test**:
```typescript
test('Error while expanded does not trigger expansion', () => {
  const { getByText, rerender } = render(
    <SettingsPanel error={null}>
      <div>Settings</div>
    </SettingsPanel>
  );
  
  // Expand manually
  fireEvent.click(getByText('Settings'));
  
  // Trigger error while expanded
  rerender(
    <SettingsPanel error="Validation failed">
      <div>Settings</div>
    </SettingsPanel>
  );
  
  // State should remain expanded (no change)
  expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
});
```

---

## Testing Contract

### Unit Tests (React Testing Library)

**File**: `tests/unit/SettingsPanel.test.tsx`

**Required test cases**:

1. **Default collapsed state**
   ```typescript
   test('Renders collapsed by default', () => {
     const { getByText, queryByText } = render(
       <SettingsPanel error={null}>
         <div>Settings Content</div>
       </SettingsPanel>
     );
     
     expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'false');
     expect(queryByText('Settings Content')).not.toBeVisible();
   });
   ```

2. **Toggle expansion**
   ```typescript
   test('Expands on toggle click', () => {
     const { getByText } = render(
       <SettingsPanel error={null}>
         <div>Settings Content</div>
       </SettingsPanel>
     );
     
     const button = getByText('Settings');
     fireEvent.click(button);
     
     expect(button).toHaveAttribute('aria-expanded', 'true');
     expect(getByText('Settings Content')).toBeVisible();
   });
   ```

3. **Auto-expand on error**
   ```typescript
   test('Auto-expands when error occurs while collapsed', () => {
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
   ```

4. **Persist state across remount**
   ```typescript
   test('Loads saved expansion state on mount', () => {
     // Pre-populate localStorage
     localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }));
     
     const { getByText } = render(
       <SettingsPanel error={null}>
         <div>Settings</div>
       </SettingsPanel>
     );
     
     expect(getByText('Settings')).toHaveAttribute('aria-expanded', 'true');
   });
   ```

5. **Accessibility structure**
   ```typescript
   test('Maintains ARIA attributes', () => {
     const { getByText, getByRole } = render(
       <SettingsPanel error={null}>
         <div>Settings</div>
       </SettingsPanel>
     );
     
     const button = getByText('Settings');
     expect(button).toHaveAttribute('aria-controls', 'settings-content');
     expect(getByRole('region')).toHaveAttribute('id', 'settings-content');
   });
   ```

---

### Integration Tests

**File**: `tests/integration/settingsVisibility.test.tsx`

**Required test cases**:

1. **Error expansion flow**
   - Render full app with settings collapsed
   - Trigger JSON validation error via JsonOverride
   - Verify settings auto-expand
   - Verify error message visible in expanded panel

2. **Persistence across reload**
   - Expand settings panel
   - Unmount component
   - Remount component
   - Verify panel renders expanded

3. **Settings functionality while hidden**
   - Collapse settings panel
   - Expand panel, change hand size
   - Collapse again
   - Verify hand size change persisted

---

## Dependencies

### From Existing Features

- `DeckControls` component (existing) - Wrapped as child
- `JsonOverride` component (existing) - Wrapped as child
- `state.error` from `useDeckState` hook - Passed as `error` prop
- Pico CSS variables - Used for theming

### New Dependencies

- `useSettingsVisibility` hook - Manages expansion state + localStorage

### External Libraries

- **React 18.2**: Component framework
- **Pico CSS 1.5**: CSS custom properties for theming

### Browser Requirements

- **CSS Features**: CSS Grid, `grid-template-rows` animation, `@media (prefers-reduced-motion)`
- **Browser Support**: Chrome 79+, Safari 14+, Firefox 75+

---

## State Invariants

The component MUST maintain these invariants:

1. **ARIA Consistency**: `aria-expanded` MUST always match `isExpanded` state
2. **Content Visibility**: Children MUST be hidden when collapsed, visible when expanded
3. **Error Response**: New errors while collapsed MUST trigger expansion
4. **Persistence Sync**: `isExpanded` MUST be saved to localStorage on every state change
5. **Accessibility**: Toggle button MUST be keyboard accessible and focusable

---

## Success Criteria

From spec.md:

- ✅ **SC-001**: Settings hidden by default (50% visual reduction)
- ✅ **SC-002**: Toggle in single click
- ✅ **SC-003**: State persists across 100% of reloads
- ✅ **SC-004**: Settings values unchanged when toggling
- ✅ **SC-005**: Toggle control clearly indicates state
- ✅ **SC-006**: Error expansion within 100ms

---

## References

- **Spec**: [../spec.md](../spec.md) - FR-001 through FR-012, SC-001 through SC-006
- **Data Model**: [../data-model.md](../data-model.md) - SettingsVisibilityState, error behavior
- **Hook Contract**: [useSettingsVisibility.contract.md](./useSettingsVisibility.contract.md)

---

**Contract Status**: ✅ Complete  
**Implementation Target**: `src/components/SettingsPanel.tsx`  
**Next Step**: Hook contract (useSettingsVisibility.contract.md)
