# Data Model: Collapsible Settings Panel

**Feature**: 008-settings-panel  
**Date**: 2025-11-14  
**Status**: Complete

## Overview

The collapsible settings panel feature introduces minimal new state to the application. The primary data entity is a boolean flag tracking panel visibility, persisted to browser storage.

## Entities

### SettingsVisibilityState

**Purpose**: Tracks whether the settings panel is currently expanded or collapsed.

**Attributes**:

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `isExpanded` | `boolean` | Yes | `false` | Whether settings panel is currently visible |

**Validation Rules**:
- Must be a boolean value (true/false)
- No null or undefined values allowed
- Defaults to `false` (collapsed) on initial load

**Persistence**:
- Stored in localStorage under key `deck-builder:settings-expanded`
- Serialized as JSON boolean
- Loaded on component mount
- Saved on every state change
- Gracefully handles localStorage failures (fallback to default)

**State Transitions**:

```
Initial Load
  ↓
[Check localStorage]
  ↓
  ├─→ Found: Load saved value → isExpanded = saved value
  └─→ Not found/Error: Use default → isExpanded = false
      ↓
[User Interaction or Error Trigger]
      ↓
      ├─→ User clicks toggle → isExpanded = !isExpanded → Save to localStorage
      ├─→ New error occurs while collapsed → isExpanded = true → Save to localStorage
      └─→ User manually collapses after auto-expansion → isExpanded = false → Save to localStorage
```

### ErrorState (Existing - Modified Behavior)

**Purpose**: Existing error state from parent components, triggers auto-expansion behavior.

**Attributes** (no changes to structure):

| Attribute | Type | Description |
|-----------|------|-------------|
| `error` | `string \| null` | Error message from deck state |

**New Behavior**:
- When error transitions from `null` to non-null while panel is collapsed → trigger auto-expansion
- Error count tracked via `useRef` to detect new errors (not just presence)
- Panel remains expanded after auto-expansion until user manually collapses

## Relationships

```
App (DeckState)
  │
  ├─→ state.error: string | null
  │     │
  │     └─→ triggers expansion ────┐
  │                                  │
  └─→ SettingsPanel                 │
        │                            │
        ├─→ isExpanded: boolean ←───┘
        │     │
        │     ├─→ saved to localStorage
        │     └─→ controlled by useSettingsVisibility hook
        │
        └─→ children: ReactNode
              │
              ├─→ DeckControls (existing)
              └─→ JsonOverride (existing)
```

## Storage Schema

### localStorage

**Key**: `deck-builder:settings-expanded`

**Value**: JSON-serialized SettingsVisibilityState

**Example**:
```json
{"isExpanded":true}
```

**Versioning**: 
- No version field needed for single boolean
- Future additions can merge with defaults: `{ ...DEFAULT_SETTINGS, ...loaded }`
- Schema evolution handled by default merge pattern

**Size**: ~20 bytes (minimal impact on 5-10MB quota)

## Type Definitions

```typescript
// New type for settings visibility
interface SettingsVisibilityState {
  isExpanded: boolean
}

// Hook return type
interface UseSettingsVisibilityReturn {
  isExpanded: boolean
  toggleExpanded: () => void
  setExpanded: (expanded: boolean) => void
}

// Component props
interface SettingsPanelProps {
  error: string | null
  children: React.ReactNode
}
```

## Integration with Existing State

**No changes required to existing DeckState type**. The settings panel:
- Consumes `state.error` from existing DeckState (read-only)
- Manages its own `isExpanded` state independently
- Does not modify deck state in any way

**Existing components wrapped**:
- `DeckControls`: No prop changes, simply wrapped as child
- `JsonOverride`: No prop changes, simply wrapped as child

**Data flow**:
```
useDeckState() hook
  ↓
state.error → App → SettingsPanel → (auto-expand logic)
                         ↓
                    useSettingsVisibility hook
                         ↓
                    localStorage ←→ isExpanded state
```

## Validation & Constraints

### Runtime Validation

```typescript
// Type guard for loaded data
function isValidSettingsState(data: unknown): data is SettingsVisibilityState {
  return (
    typeof data === 'object' &&
    data !== null &&
    'isExpanded' in data &&
    typeof data.isExpanded === 'boolean'
  )
}

// Load with validation
function loadSettings(): SettingsVisibilityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    
    const parsed = JSON.parse(raw)
    if (!isValidSettingsState(parsed)) {
      console.debug('Invalid settings data, using defaults')
      return DEFAULT_SETTINGS
    }
    
    return parsed
  } catch (error) {
    console.debug('Failed to load settings:', error)
    return DEFAULT_SETTINGS
  }
}
```

### Business Rules

1. **Default collapsed**: Settings always start collapsed unless user previously expanded them
2. **Auto-expand on error**: New errors auto-expand panel, but user can still manually collapse
3. **Preserve user choice**: Manual collapse/expand preference persists across reloads
4. **No reset on error clear**: Panel remains expanded after error is fixed, respects user's last action
5. **Graceful storage failures**: App functions normally even if localStorage is unavailable

## Data Lifecycle

### Component Mount
1. useSettingsVisibility hook initializes
2. Attempts to load from localStorage
3. Falls back to default (collapsed) on any error
4. Sets initial state

### User Interaction
1. User clicks toggle button
2. State updates: `isExpanded = !isExpanded`
3. New state saved to localStorage (best effort)
4. Component re-renders with new state

### Error Detection
1. Parent error state changes (null → string)
2. useEffect detects error count increase
3. Auto-expands: `setExpanded(true)`
4. New state saved to localStorage
5. Component re-renders showing panel + error

### Component Unmount
- No cleanup needed
- localStorage persists independently
- State will be restored on next mount

## Migration Considerations

**Initial Release**: No migration needed (new feature)

**Future Changes**:
- Adding new settings fields: Merge pattern handles gracefully
- Changing storage key: Read both old and new, write to new
- Removing localStorage: Feature degrades to session-only state

## Performance Considerations

- **Storage operations**: Minimal overhead (~20 bytes JSON)
- **State updates**: Single boolean flag, no complex objects
- **Re-renders**: Only SettingsPanel and children re-render on state change
- **Memory**: Negligible impact (one boolean in memory)
