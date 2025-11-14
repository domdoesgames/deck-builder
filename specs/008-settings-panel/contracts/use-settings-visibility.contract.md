# Hook Contract: useSettingsVisibility

**Feature**: 008-settings-panel  
**Hook**: `useSettingsVisibility`  
**Path**: `src/hooks/useSettingsVisibility.ts`  
**Date**: 2025-11-14

## Purpose

Manages settings panel visibility state with localStorage persistence, providing state and control functions to SettingsPanel component.

## Interface

### Hook Signature

```typescript
function useSettingsVisibility(): UseSettingsVisibilityReturn

interface UseSettingsVisibilityReturn {
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isExpanded` | `boolean` | Current expansion state (true = visible, false = hidden) |
| `toggleExpanded` | `() => void` | Toggles expansion state (used by toggle button click) |
| `setExpanded` | `(expanded: boolean) => void` | Sets expansion state directly (used for error auto-expansion) |

### Parameters

None. Hook has no parameters.

---

## Behavior Contract

### GIVEN hook is called for the first time (component mount)

**WHEN** hook initializes

**THEN**:
- MUST attempt to read from localStorage key `deck-builder:settings-expanded`
- IF localStorage read succeeds AND data is valid SettingsVisibilityState:
  - MUST return `isExpanded = loadedValue.isExpanded`
- ELSE (localStorage unavailable, empty, or invalid data):
  - MUST return `isExpanded = false` (default)
- MUST NOT throw errors (graceful fallback)

**Test**:
```typescript
test('Loads saved state from localStorage on mount', () => {
  localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }));
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  expect(result.current.isExpanded).toBe(true);
});

test('Falls back to false when localStorage empty', () => {
  localStorage.clear();
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  expect(result.current.isExpanded).toBe(false);
});
```

---

### GIVEN hook has initialized with state

**WHEN** `toggleExpanded()` is called

**THEN**:
- `isExpanded` MUST flip to opposite value: `!isExpanded`
- New state MUST be saved to localStorage immediately
- Component MUST re-render with new state
- localStorage write errors MUST be caught and logged silently

**Test**:
```typescript
test('toggleExpanded flips state and saves to localStorage', () => {
  const { result } = renderHook(() => useSettingsVisibility());
  
  expect(result.current.isExpanded).toBe(false);
  
  act(() => {
    result.current.toggleExpanded();
  });
  
  expect(result.current.isExpanded).toBe(true);
  
  const saved = JSON.parse(localStorage.getItem('deck-builder:settings-expanded')!);
  expect(saved.isExpanded).toBe(true);
});
```

---

### GIVEN hook has initialized with state

**WHEN** `setExpanded(true)` is called

**THEN**:
- `isExpanded` MUST be set to `true`
- New state MUST be saved to localStorage
- Component MUST re-render

**WHEN** `setExpanded(false)` is called

**THEN**:
- `isExpanded` MUST be set to `false`
- New state MUST be saved to localStorage
- Component MUST re-render

**Test**:
```typescript
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
```

---

### GIVEN localStorage is unavailable (disabled, quota exceeded, private mode)

**WHEN** hook attempts to load or save state

**THEN**:
- Load operation MUST catch error and return default `false`
- Save operation MUST catch error and log silently
- Hook MUST NOT crash or throw errors
- Component MUST function normally with session-only state

**Test**:
```typescript
test('Handles localStorage errors gracefully', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('localStorage disabled');
  });
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  // Should not crash, defaults to false
  expect(result.current.isExpanded).toBe(false);
  
  // Should still allow state changes (session-only)
  act(() => {
    result.current.toggleExpanded();
  });
  
  expect(result.current.isExpanded).toBe(true);
});
```

---

## Implementation Contract

### Internal State

```typescript
const [isExpanded, setIsExpanded] = useState<boolean>(() => loadInitialState());
```

**Requirements**:
- Use `useState` with lazy initialization (function form)
- Load initial state from localStorage in initializer function
- Fallback to `false` on any load errors

---

### Load Function

```typescript
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
```

**Requirements**:
- Use `try-catch` to handle all errors
- Validate parsed data with type guard
- Log errors at `debug` level (not `error`)
- Always return boolean (never undefined/null)

---

### Save Function

```typescript
function saveState(expanded: boolean): void {
  try {
    const data: SettingsVisibilityState = { isExpanded: expanded };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.debug('Failed to save settings visibility:', error);
    // Silent failure - don't disrupt user experience
  }
}
```

**Requirements**:
- Use `try-catch` to handle quota exceeded, disabled localStorage, etc.
- Serialize state as JSON object (not raw boolean)
- Log errors at `debug` level
- Don't re-throw errors (silent failure)

---

### Type Guard

```typescript
function isValidSettingsState(data: unknown): data is SettingsVisibilityState {
  return (
    typeof data === 'object' &&
    data !== null &&
    'isExpanded' in data &&
    typeof data.isExpanded === 'boolean'
  );
}
```

**Requirements**:
- Check object type
- Check for required `isExpanded` property
- Validate `isExpanded` is boolean (not truthy/falsy string)

---

### Return Object

```typescript
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
```

**Requirements**:
- Return stable object (functions created on every call, not memoized)
- `toggleExpanded` uses functional state update for safety
- Both functions save state immediately after update
- Don't use `useCallback` (premature optimization for simple hook)

---

## localStorage Contract

### Storage Key

```typescript
const STORAGE_KEY = 'deck-builder:settings-expanded';
```

**Requirements**:
- Use project prefix `deck-builder:` for namespacing
- Use descriptive key name `settings-expanded`
- Consistent with existing `persistenceManager.ts` pattern

---

### Storage Format

**Schema**:
```typescript
interface SettingsVisibilityState {
  isExpanded: boolean;
}
```

**Serialized Example**:
```json
{"isExpanded":true}
```

**Requirements**:
- Store as JSON object (not raw boolean)
- Use object structure for future extensibility
- No version field needed (single boolean, defaults merge safely)

---

### Storage Size

**Estimated**: ~20 bytes (negligible impact on 5-10MB quota)

**Example**:
```
Key: "deck-builder:settings-expanded" (32 bytes)
Value: {"isExpanded":true} (20 bytes)
Total: 52 bytes
```

---

## Performance Contract

### Initialization Performance

- Load from localStorage MUST complete in <10ms
- JSON parse MUST complete in <1ms (tiny payload)
- Hook initialization MUST NOT block component render

**Test**:
```typescript
test('Hook initializes quickly', () => {
  const start = performance.now();
  renderHook(() => useSettingsVisibility());
  const end = performance.now();
  
  expect(end - start).toBeLessThan(10);
});
```

---

### State Update Performance

- `toggleExpanded()` call MUST complete in <5ms
- `setExpanded()` call MUST complete in <5ms
- localStorage write is synchronous but fast (<5ms for small data)

**Note**: localStorage writes are synchronous blocking operations, but 20-byte writes are negligible

---

## Edge Cases & Error Handling

### Corrupted localStorage Data

**Scenario**: localStorage contains invalid JSON or wrong type

**Behavior**:
- `JSON.parse()` throws error → caught by try-catch
- `isValidSettingsState()` returns false → fallback to default
- Hook returns `isExpanded = false`

**Test**:
```typescript
test('Handles corrupted localStorage data', () => {
  localStorage.setItem('deck-builder:settings-expanded', 'not valid JSON');
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  expect(result.current.isExpanded).toBe(false);
});

test('Handles wrong data type in localStorage', () => {
  localStorage.setItem('deck-builder:settings-expanded', '"just a string"');
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  expect(result.current.isExpanded).toBe(false);
});
```

---

### Quota Exceeded

**Scenario**: localStorage quota exceeded (rare for 20-byte writes)

**Behavior**:
- `setItem()` throws QuotaExceededError
- Caught by try-catch in `saveState()`
- State update proceeds (session-only)
- User experience unchanged (no error UI)

**Test**:
```typescript
test('Handles quota exceeded gracefully', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError');
  });
  
  const { result } = renderHook(() => useSettingsVisibility());
  
  // Should not crash
  act(() => {
    result.current.toggleExpanded();
  });
  
  // State updates work (session-only)
  expect(result.current.isExpanded).toBe(true);
});
```

---

### Private Browsing Mode

**Scenario**: Browser in private/incognito mode with restricted storage

**Behavior**:
- localStorage may throw on access
- Hook falls back to session-only state
- Feature works normally within session
- State lost on page reload (acceptable degradation)

---

### Rapid State Updates

**Scenario**: Multiple rapid calls to `toggleExpanded()` or `setExpanded()`

**Behavior**:
- Each call triggers state update
- Each state update triggers localStorage write
- Final state is result of last call
- All writes succeed (no race conditions in synchronous code)

**Test**:
```typescript
test('Handles rapid state updates', () => {
  const { result } = renderHook(() => useSettingsVisibility());
  
  // 10 rapid toggles
  act(() => {
    for (let i = 0; i < 10; i++) {
      result.current.toggleExpanded();
    }
  });
  
  // Even number of toggles, back to false
  expect(result.current.isExpanded).toBe(false);
  
  const saved = JSON.parse(localStorage.getItem('deck-builder:settings-expanded')!);
  expect(saved.isExpanded).toBe(false);
});
```

---

## Testing Contract

### Unit Tests (React Testing Library)

**File**: `tests/unit/useSettingsVisibility.test.ts`

**Required test cases**:

1. **Default state**
   ```typescript
   test('Returns false by default when no saved state', () => {
     localStorage.clear();
     const { result } = renderHook(() => useSettingsVisibility());
     expect(result.current.isExpanded).toBe(false);
   });
   ```

2. **Load saved state**
   ```typescript
   test('Loads saved expanded state', () => {
     localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }));
     const { result } = renderHook(() => useSettingsVisibility());
     expect(result.current.isExpanded).toBe(true);
   });
   ```

3. **Toggle functionality**
   ```typescript
   test('toggleExpanded flips state', () => {
     const { result } = renderHook(() => useSettingsVisibility());
     
     act(() => result.current.toggleExpanded());
     expect(result.current.isExpanded).toBe(true);
     
     act(() => result.current.toggleExpanded());
     expect(result.current.isExpanded).toBe(false);
   });
   ```

4. **Direct set functionality**
   ```typescript
   test('setExpanded sets state directly', () => {
     const { result } = renderHook(() => useSettingsVisibility());
     
     act(() => result.current.setExpanded(true));
     expect(result.current.isExpanded).toBe(true);
     
     act(() => result.current.setExpanded(false));
     expect(result.current.isExpanded).toBe(false);
   });
   ```

5. **Persistence**
   ```typescript
   test('Saves state to localStorage on update', () => {
     const { result } = renderHook(() => useSettingsVisibility());
     
     act(() => result.current.toggleExpanded());
     
     const saved = JSON.parse(localStorage.getItem('deck-builder:settings-expanded')!);
     expect(saved.isExpanded).toBe(true);
   });
   ```

6. **Error handling**
   ```typescript
   test('Handles localStorage errors gracefully', () => {
     jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
       throw new Error('Storage disabled');
     });
     
     const { result } = renderHook(() => useSettingsVisibility());
     expect(result.current.isExpanded).toBe(false);
   });
   ```

---

## Dependencies

### Browser APIs

- `localStorage` - Read/write persistence (optional, degrades gracefully)
- `JSON.parse` / `JSON.stringify` - Data serialization

### React APIs

- `useState` - State management
- `renderHook` from `@testing-library/react` - Testing (dev dependency)

### Project Dependencies

- **TypeScript 5.3.3**: Type safety
- **React 18.2**: Hook framework

### Browser Requirements

- localStorage API support (all modern browsers)
- ES2022 features (optional chaining, nullish coalescing)

---

## State Invariants

The hook MUST maintain these invariants:

1. **Type Safety**: `isExpanded` is always boolean (never undefined/null)
2. **Default Fallback**: Invalid/missing localStorage data returns `false`
3. **Synchronization**: State updates always trigger localStorage save attempts
4. **Error Resilience**: Errors never crash the hook or component
5. **Persistence Format**: localStorage always contains valid JSON object

---

## Success Criteria

From spec.md:

- ✅ **SC-003**: State persists across 100% of reloads
- ✅ **FR-007**: Visibility preference persists across page reloads

---

## References

- **Spec**: [../spec.md](../spec.md) - FR-007, SC-003
- **Data Model**: [../data-model.md](../data-model.md) - SettingsVisibilityState schema
- **Component Contract**: [settings-panel.contract.md](./settings-panel.contract.md) - Consumer of this hook
- **Existing Pattern**: `src/lib/persistenceManager.ts` - localStorage patterns

---

**Contract Status**: ✅ Complete  
**Implementation Target**: `src/hooks/useSettingsVisibility.ts`  
**Next Step**: Quickstart developer guide
