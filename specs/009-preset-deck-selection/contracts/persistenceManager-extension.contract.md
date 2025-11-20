# Contract: Persistence Manager Extension

**Module**: `persistenceManager`  
**File**: `src/lib/persistenceManager.ts`  
**Purpose**: Extension for persisting active preset deck selection

## Interface Contract

### New Functions

```typescript
/**
 * Saves the active preset deck ID to localStorage
 * 
 * @param presetId - Unique identifier of active preset deck (null to clear)
 * 
 * Behavior:
 * - If presetId is null, removes the localStorage key
 * - If presetId is string, saves to localStorage
 * - Silent failure on localStorage errors (quota, disabled, etc.)
 * 
 * Storage Key: 'deck-builder:activePresetId'
 */
export function saveActivePresetId(presetId: string | null): void;

/**
 * Loads the active preset deck ID from localStorage
 * 
 * @returns Stored preset deck ID, or null if not found or error
 * 
 * Behavior:
 * - Returns stored string value if key exists
 * - Returns null if key does not exist
 * - Returns null on localStorage errors (silent failure)
 * 
 * Storage Key: 'deck-builder:activePresetId'
 */
export function loadActivePresetId(): string | null;

/**
 * Clears the active preset deck ID from localStorage
 * 
 * Convenience wrapper around saveActivePresetId(null)
 * 
 * Behavior:
 * - Removes localStorage key
 * - Silent failure on localStorage errors
 * 
 * Storage Key: 'deck-builder:activePresetId'
 */
export function clearActivePresetId(): void;
```

---

## Implementation Contract

### Storage Key

**MUST** use key: `'deck-builder:activePresetId'`

**Rationale**:
- Namespaced with `deck-builder:` prefix (consistent with existing keys)
- Descriptive name indicating purpose
- Separate from main deck state key (`deck-builder:state`)

---

### saveActivePresetId Implementation

```typescript
export function saveActivePresetId(presetId: string | null): void {
  try {
    if (presetId === null) {
      localStorage.removeItem('deck-builder:activePresetId');
    } else {
      localStorage.setItem('deck-builder:activePresetId', presetId);
    }
  } catch (error) {
    // Silent failure - feature degrades gracefully to session-only state
    // Optional: Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to save active preset ID:', error);
    }
  }
}
```

**MUST**:
- Accept `string | null` parameter
- Remove key when `presetId` is null
- Store plain string (no JSON serialization needed)
- Catch and suppress all errors
- NOT throw errors to caller

**MAY**:
- Log warnings in development mode only
- Track persistence failures for analytics (if added later)

---

### loadActivePresetId Implementation

```typescript
export function loadActivePresetId(): string | null {
  try {
    const value = localStorage.getItem('deck-builder:activePresetId');
    return value; // null if key doesn't exist, string if it does
  } catch (error) {
    // Silent failure - return null as if no saved value
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to load active preset ID:', error);
    }
    return null;
  }
}
```

**MUST**:
- Return `string | null` (never undefined)
- Return null if key does not exist
- Return null on any error
- NOT throw errors to caller

**MUST NOT**:
- Parse or validate the returned string (caller's responsibility)
- Attempt to fix or migrate old values
- Cache results (storage could be modified externally)

---

### clearActivePresetId Implementation

```typescript
export function clearActivePresetId(): void {
  saveActivePresetId(null);
}
```

**MUST**:
- Delegate to `saveActivePresetId(null)`
- Provide same silent failure behavior

**Rationale**: Convenience function for clearer intent in calling code.

---

## Behavior Contract

### localStorage Availability

**Scenarios where localStorage may fail**:
1. Private browsing mode (some browsers)
2. Storage quota exceeded
3. localStorage disabled by user/policy
4. Browser does not support localStorage (very old browsers)
5. Storage access restricted by security policy

**Required Behavior**:
- All functions MUST handle these cases gracefully
- No errors thrown or propagated
- Feature degrades to session-only state
- Application remains functional

---

### Interaction with Existing Persistence

**Existing System** (Feature 005):
- `saveDeckState(state: DeckState)` - Saves full deck state
- `loadDeckState()` - Loads full deck state
- Uses key: `'deck-builder:state'`

**New System** (Feature 009):
- `saveActivePresetId(id: string | null)` - Saves only preset ID
- `loadActivePresetId()` - Loads only preset ID
- Uses key: `'deck-builder:activePresetId'`

**Independence**:
- Both systems operate separately
- No shared data structures
- Both can fail independently

**Coordination**:
- When preset deck loaded:
  1. `saveDeckState()` called (saves full state with `activePresetId`)
  2. `saveActivePresetId()` called (saves standalone ID for restoration)
- When custom JSON loaded:
  1. `saveDeckState()` called (saves full state with `activePresetId: null`)
  2. `clearActivePresetId()` called (removes standalone ID)

**Why Both?**:
- Full state includes current game progress (hand, discard pile, turn number)
- Standalone ID enables restoring "fresh" preset deck (reload preset data)
- Standalone ID survives even if full state becomes corrupted

---

## Usage Contract

### Usage in useDeckState Hook

```typescript
// src/hooks/useDeckState.ts

// Effect for persisting active preset ID
useEffect(() => {
  if (state.activePresetId) {
    saveActivePresetId(state.activePresetId);
  } else {
    clearActivePresetId();
  }
}, [state.activePresetId]);
```

**Behavior**:
- Runs after every render where `state.activePresetId` changes
- Saves non-null IDs
- Clears null IDs

---

### Usage in Initialization

```typescript
// src/hooks/useDeckState.ts - lazy initializer

const [state, dispatch] = useReducer(deckReducer, null, () => {
  // Try to restore persisted deck state first
  const persistedState = loadDeckState();
  
  if (persistedState) {
    return persistedState;
  }
  
  // No persisted state, check for active preset ID
  const presetId = loadActivePresetId();
  
  if (presetId) {
    // Load preset deck
    return deckReducer(
      {} as DeckState,
      { type: 'LOAD_PRESET_DECK', payload: { presetId } }
    );
  }
  
  // Default initialization
  return deckReducer({} as DeckState, { type: 'INIT' });
});
```

**Behavior**:
- Restoration happens once during hook initialization
- Preset ID checked only if no persisted state
- Falls back to default if preset loading fails

---

## Testing Contract

### Unit Test Requirements

1. **saveActivePresetId stores string value**
   - Call `saveActivePresetId('test-id')`
   - Verify `localStorage.getItem('deck-builder:activePresetId')` returns `'test-id'`

2. **saveActivePresetId removes key when null**
   - Set key first: `localStorage.setItem('deck-builder:activePresetId', 'test-id')`
   - Call `saveActivePresetId(null)`
   - Verify `localStorage.getItem('deck-builder:activePresetId')` returns `null`

3. **loadActivePresetId returns stored value**
   - Set key: `localStorage.setItem('deck-builder:activePresetId', 'stored-id')`
   - Call `loadActivePresetId()`
   - Verify returns `'stored-id'`

4. **loadActivePresetId returns null when key missing**
   - Ensure key removed: `localStorage.removeItem('deck-builder:activePresetId')`
   - Call `loadActivePresetId()`
   - Verify returns `null`

5. **saveActivePresetId handles localStorage errors silently**
   - Mock `localStorage.setItem` to throw error
   - Call `saveActivePresetId('test-id')`
   - Verify no error thrown (function completes)

6. **loadActivePresetId handles localStorage errors silently**
   - Mock `localStorage.getItem` to throw error
   - Call `loadActivePresetId()`
   - Verify returns `null` (no error thrown)

7. **clearActivePresetId removes key**
   - Set key: `localStorage.setItem('deck-builder:activePresetId', 'test-id')`
   - Call `clearActivePresetId()`
   - Verify `localStorage.getItem('deck-builder:activePresetId')` returns `null`

---

### Integration Test Requirements

1. **Preset ID persists across hook re-initialization**
   - Create hook instance, load preset deck (ID saved)
   - Unmount and remount hook
   - Verify preset deck restored from saved ID

2. **Clearing activePresetId removes localStorage entry**
   - Load preset deck (ID saved)
   - Load custom JSON deck (ID cleared)
   - Verify localStorage key removed

---

## Error Handling Contract

### All Errors Suppressed

**MUST** catch and suppress:
- `QuotaExceededError` - Storage quota exceeded
- `SecurityError` - Access denied (private browsing, etc.)
- `TypeError` - localStorage not available
- Any other unexpected errors

**MUST NOT**:
- Throw errors to caller
- Re-throw errors
- Propagate errors to UI

**Rationale**: Persistence is a non-critical feature. Application should continue working without it.

---

### Development Mode Logging

**MAY** log warnings in development:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn('Failed to save active preset ID:', error);
}
```

**MUST NOT** log in production:
- Avoids console noise for users
- Prevents potential security info leaks

---

## Performance Contract

**Time Complexity**: O(1) - direct localStorage access

**Acceptable Use**:
- On user action (load preset deck)
- On app initialization (restore preset ID)
- On side effect (state.activePresetId changes)

**NOT Acceptable**:
- In render loops
- In tight loops
- On every state change (only when activePresetId specifically changes)

---

## Security Contract

### Data Stored

**Stored Value**: Plain string preset deck ID only (e.g., `'starter-deck'`)

**NOT Stored**:
- User data
- Sensitive information
- Authentication tokens
- Personal information

**Risk Level**: Minimal - ID is public knowledge (defined in code)

---

### Storage Access

**MUST**:
- Use same-origin localStorage (automatic browser behavior)
- Validate restored preset ID before using (caller's responsibility)
- Handle corrupted or tampered data gracefully

**MUST NOT**:
- Trust restored data without validation
- Store secrets or sensitive data
- Use as authentication mechanism

---

## Backward Compatibility Contract

### Migration from No Persistence

**First-time users** (no existing localStorage):
- `loadActivePresetId()` returns `null`
- Normal default initialization occurs
- No migration needed

### Migration from Custom Deck Only

**Users with existing `deck-builder:state`** but no preset ID:
- `loadActivePresetId()` returns `null`
- Full state restored normally
- No impact

### Future Schema Changes

**If preset ID format changes**:
- Functions should validate format before using
- Invalid formats treated as `null` (reset to default)
- Old valid formats should continue working if possible

---

## Dependencies

### External Dependencies

- `localStorage` Web API (assumed available)

### Internal Dependencies

- None (pure utility functions)

### Consumers

- `useDeckState` hook (main consumer)
- Potentially test utilities

---

## Version

**Contract Version**: 1.0.0  
**Created**: 2025-11-19  
**Status**: Draft (Phase 1)

**Breaking Changes Policy**: Changes to function signatures, storage key name, or error handling behavior require MAJOR version bump.
