# Data Model: Specification Compliance Remediation

**Feature**: 005-spec-compliance-remediation  
**Created**: 2025-11-13  
**Status**: Draft

## Overview

This feature introduces minimal new state (primarily persistence layer) while correcting validation logic and component architecture. Most changes involve fixing existing implementations to match documented contracts rather than adding new data structures.

---

## Type Extensions

### Persistence Types

```typescript
/**
 * Subset of DeckState that is persisted to localStorage
 * Excludes transient fields like selectedCardIds
 */
export interface PersistedDeckState {
  // Core deck state
  drawPile: string[]
  discardPile: string[]
  hand: string[]
  handCards: CardInstance[]
  
  // Game parameters
  turnNumber: number
  handSize: number
  discardCount: number // NOTE: Now allows 0 (validation fix)
  
  // Phase state
  discardPhase: DiscardPhase
  planningPhase: boolean
  playOrderSequence: string[]
  playOrderLocked: boolean
  
  // Warnings/errors (restore user context)
  warning: string | null
  error: string | null
  
  // Metadata
  persistenceVersion: number // For future migration support
  lastSaved: number // Timestamp for debugging
}

/**
 * Result of state validation after loading from localStorage
 */
export interface ValidationResult {
  isValid: boolean
  sanitizedState: Partial<DeckState> | null
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  reason: string
  severity: 'error' | 'warning'
}
```

### Configuration Types

```typescript
/**
 * Configuration for persistence behavior
 */
export interface PersistenceConfig {
  storageKey: string
  debounceMs: number // Debounce rapid state changes
  maxRetries: number
  fallbackToSessionStorage: boolean
  
  // Which fields to persist (allows opt-out for sensitive data)
  includedFields: (keyof DeckState)[]
  excludedFields: (keyof DeckState)[]
}

export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  storageKey: 'deck-builder-state',
  debounceMs: 100, // Avoid excessive writes
  maxRetries: 3,
  fallbackToSessionStorage: false,
  
  includedFields: [
    'drawPile', 'discardPile', 'hand', 'handCards',
    'turnNumber', 'handSize', 'discardCount',
    'discardPhase', 'planningPhase', 'playOrderSequence', 'playOrderLocked',
    'warning', 'error'
  ],
  
  excludedFields: [
    'selectedCardIds', // Transient - don't persist
    'isDealing', // Runtime flag
  ]
}
```

---

## State Modifications

### DeckState Changes

```typescript
export interface DeckState {
  // ... existing fields (no changes to structure)
  
  // Validation changes (not new fields, just relaxed constraints):
  
  /**
   * Discard count per turn
   * CHANGED: Now allows 0 (was minimum 1)
   * Range: [0, 20] (0 = skip discard phase)
   */
  discardCount: number
  
  // NOTE: All other fields remain unchanged
  // This feature fixes implementations, not data model
}
```

### Component Props Extensions

#### DeckControls Props (Feature 005)

```typescript
export interface DeckControlsProps {
  state: DeckState
  onEndTurn: () => void
  onChangeParameters: (handSize: number, discardCount: number, immediateReset: boolean) => void
  
  // NEW: Feature 005 - Play order controls migrated here
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  handCardsCount: number
  onLockPlayOrder: () => void
  onClearPlayOrder: () => void
  
  // NEW: Phase status display
  currentPhase: 'discard' | 'planning' | 'executing' | 'idle'
}
```

#### HandView Props (Feature 005)

```typescript
export interface HandViewProps {
  hand: string[]
  handCards: CardInstance[]
  selectedCardIds: Set<string>
  onToggleCardSelection: (instanceId: string) => void
  
  // Discard phase props (existing)
  discardPhaseActive?: boolean
  remainingDiscards?: number
  onConfirmDiscard?: () => void
  
  // Play order props (existing, unchanged)
  playOrderSequence?: string[]
  planningPhase?: boolean
  playOrderLocked?: boolean
  onSelectForPlayOrder?: (instanceId: string) => void
  onDeselectFromPlayOrder?: (instanceId: string) => void
  
  // REMOVED: These now belong to DeckControls (FR-015, FR-016)
  // onLockPlayOrder?: () => void
  // onClearPlayOrder?: () => void
}
```

---

## Validation Rules

### State Validation (for loaded state)

```typescript
/**
 * Validates loaded state from localStorage
 * Fixes common corruption issues automatically
 */
export function validateAndSanitizeDeckState(
  loaded: unknown
): ValidationResult {
  const errors: ValidationError[] = []
  
  // Type guard
  if (typeof loaded !== 'object' || loaded === null) {
    return {
      isValid: false,
      sanitizedState: null,
      errors: [{ field: 'root', reason: 'Not an object', severity: 'error' }]
    }
  }
  
  const state = loaded as Partial<DeckState>
  const sanitized: Partial<DeckState> = {}
  
  // Validate arrays
  if (Array.isArray(state.drawPile)) {
    sanitized.drawPile = state.drawPile.filter(c => typeof c === 'string')
  } else {
    errors.push({ field: 'drawPile', reason: 'Not an array', severity: 'error' })
  }
  
  if (Array.isArray(state.discardPile)) {
    sanitized.discardPile = state.discardPile.filter(c => typeof c === 'string')
  } else {
    errors.push({ field: 'discardPile', reason: 'Not an array', severity: 'error' })
  }
  
  // Validate hand
  if (Array.isArray(state.hand)) {
    sanitized.hand = state.hand.filter(c => typeof c === 'string')
  } else {
    errors.push({ field: 'hand', reason: 'Not an array', severity: 'error' })
  }
  
  // Validate handCards
  if (Array.isArray(state.handCards)) {
    sanitized.handCards = state.handCards.filter(c => 
      c && typeof c.instanceId === 'string' && typeof c.card === 'string'
    )
  } else {
    errors.push({ field: 'handCards', reason: 'Not an array', severity: 'error' })
  }
  
  // Validate numbers
  if (typeof state.turnNumber === 'number' && state.turnNumber >= 1) {
    sanitized.turnNumber = Math.floor(state.turnNumber)
  } else {
    sanitized.turnNumber = 1
    errors.push({ field: 'turnNumber', reason: 'Invalid, reset to 1', severity: 'warning' })
  }
  
  if (typeof state.handSize === 'number') {
    sanitized.handSize = Math.max(1, Math.min(10, Math.floor(state.handSize)))
  } else {
    sanitized.handSize = DEFAULT_HAND_SIZE
    errors.push({ field: 'handSize', reason: 'Invalid, using default', severity: 'warning' })
  }
  
  // Feature 005: Allow discardCount = 0
  if (typeof state.discardCount === 'number') {
    sanitized.discardCount = Math.max(0, Math.floor(state.discardCount))
  } else {
    sanitized.discardCount = DEFAULT_DISCARD_COUNT
    errors.push({ field: 'discardCount', reason: 'Invalid, using default', severity: 'warning' })
  }
  
  // Validate booleans
  sanitized.planningPhase = Boolean(state.planningPhase)
  sanitized.playOrderLocked = Boolean(state.playOrderLocked)
  
  // Validate play order sequence
  if (Array.isArray(state.playOrderSequence)) {
    sanitized.playOrderSequence = state.playOrderSequence.filter(id => typeof id === 'string')
  } else {
    sanitized.playOrderSequence = []
    errors.push({ field: 'playOrderSequence', reason: 'Not an array, reset', severity: 'warning' })
  }
  
  // Validate discard phase
  if (state.discardPhase && typeof state.discardPhase === 'object') {
    sanitized.discardPhase = {
      active: Boolean(state.discardPhase.active),
      remainingDiscards: typeof state.discardPhase.remainingDiscards === 'number'
        ? Math.max(0, Math.floor(state.discardPhase.remainingDiscards))
        : 0
    }
  } else {
    sanitized.discardPhase = { active: false, remainingDiscards: 0 }
    errors.push({ field: 'discardPhase', reason: 'Invalid, reset', severity: 'warning' })
  }
  
  // Always reset transient fields (per contract)
  sanitized.selectedCardIds = new Set()
  sanitized.isDealing = false
  
  // Strings (nullable)
  sanitized.warning = typeof state.warning === 'string' ? state.warning : null
  sanitized.error = typeof state.error === 'string' ? state.error : null
  
  // Consider valid if no errors (warnings are OK)
  const isValid = !errors.some(e => e.severity === 'error')
  
  return {
    isValid,
    sanitizedState: isValid ? sanitized : null,
    errors
  }
}
```

---

## Derived Values

### Phase Computation

```typescript
/**
 * Compute current game phase for UI display
 * Feature 005: Used for phase status indicator (FR-020, FR-021)
 */
export function computeCurrentPhase(state: DeckState): 
  'discard' | 'planning' | 'executing' | 'idle' {
  
  if (state.discardPhase.active) {
    return 'discard'
  }
  
  if (state.planningPhase) {
    return 'planning'
  }
  
  if (state.playOrderLocked) {
    return 'executing'
  }
  
  return 'idle'
}

/**
 * Get display text for phase indicator
 */
export function getPhaseDisplayText(phase: ReturnType<typeof computeCurrentPhase>): string {
  switch (phase) {
    case 'discard': return 'Discard Phase'
    case 'planning': return 'Planning'
    case 'executing': return 'Executing'
    case 'idle': return ''
  }
}

/**
 * Get ARIA announcement for phase transitions
 */
export function getPhaseAnnouncement(
  oldPhase: ReturnType<typeof computeCurrentPhase>,
  newPhase: ReturnType<typeof computeCurrentPhase>
): string | null {
  
  if (oldPhase === newPhase) return null
  
  if (newPhase === 'planning') {
    return 'Planning phase started. Select cards in your desired play order.'
  }
  
  if (newPhase === 'executing') {
    return 'Play order locked. Entering executing phase.'
  }
  
  if (newPhase === 'discard') {
    return 'Discard phase started. Select cards to discard.'
  }
  
  return null
}
```

### Card Visual State

```typescript
/**
 * Determine visual state of a card for styling
 * Feature 005: Supports locked, disabled, selected, and ordered states
 */
export function getCardVisualState(
  instanceId: string,
  state: DeckState
): {
  isSelected: boolean
  isOrdered: boolean
  isLocked: boolean
  isDisabled: boolean
  sequenceNumber: number | null
  canInteract: boolean
} {
  
  const isSelected = state.selectedCardIds.has(instanceId)
  const sequenceIndex = state.playOrderSequence.indexOf(instanceId)
  const isOrdered = sequenceIndex >= 0
  const sequenceNumber = isOrdered ? sequenceIndex + 1 : null
  const isLocked = state.playOrderLocked
  
  // Feature 005: Disable unselected cards when max selection reached (FR-036)
  const isDisabled = 
    state.discardPhase.active &&
    !isSelected &&
    state.selectedCardIds.size >= state.discardPhase.remainingDiscards
  
  // Feature 005: Locked cards cannot interact (FR-010)
  const canInteract = !isLocked && !isDisabled
  
  return {
    isSelected,
    isOrdered,
    isLocked,
    isDisabled,
    sequenceNumber,
    canInteract
  }
}
```

---

## Storage Schema

### localStorage Structure

```typescript
/**
 * Stored in localStorage at key "deck-builder-state"
 */
interface StoredState {
  version: 1 // Schema version for future migrations
  timestamp: number // When saved (ISO string)
  state: {
    // All persisted fields (see PersistedDeckState above)
    drawPile: string[]
    discardPile: string[]
    hand: string[]
    handCards: { instanceId: string; card: string }[]
    turnNumber: number
    handSize: number
    discardCount: number // Can be 0
    discardPhase: { active: boolean; remainingDiscards: number }
    planningPhase: boolean
    playOrderSequence: string[]
    playOrderLocked: boolean
    warning: string | null
    error: string | null
  }
}

/**
 * Example serialized value:
 */
const exampleStoredState: StoredState = {
  version: 1,
  timestamp: 1699888888888,
  state: {
    drawPile: ['7♠', 'J♥', 'A♦'],
    discardPile: ['2♣'],
    hand: ['K♠', '9♥', '4♦'],
    handCards: [
      { instanceId: 'abc-123', card: 'K♠' },
      { instanceId: 'def-456', card: '9♥' },
      { instanceId: 'ghi-789', card: '4♦' }
    ],
    turnNumber: 3,
    handSize: 3,
    discardCount: 1,
    discardPhase: { active: false, remainingDiscards: 0 },
    planningPhase: true,
    playOrderSequence: ['abc-123', 'ghi-789'], // 2 of 3 ordered
    playOrderLocked: false,
    warning: null,
    error: null
  }
}
```

---

## Migration Strategy

### Forward Compatibility

```typescript
/**
 * Handle loading state from older versions (no playOrder fields)
 */
export function migrateLoadedState(loaded: any): PersistedDeckState {
  const migrated = { ...loaded }
  
  // Version 0 (before Feature 004): Add play order fields
  if (!migrated.playOrderSequence) {
    migrated.playOrderSequence = []
    migrated.playOrderLocked = false
    migrated.planningPhase = false
  }
  
  // Version 0.5 (before Feature 005): Ensure discardCount can be 0
  if (typeof migrated.discardCount === 'number' && migrated.discardCount < 0) {
    migrated.discardCount = 0
  }
  
  return migrated
}
```

---

## Constants Updates

```typescript
// src/lib/constants.ts

// CHANGED: Allow 0 discard count (was minimum 1)
export const DEFAULT_DISCARD_COUNT = 1 // Still default to 1
export const MIN_DISCARD_COUNT = 0 // NEW: Allow 0
export const MAX_DISCARD_COUNT = 20

// NEW: Persistence configuration
export const STORAGE_KEY = 'deck-builder-state'
export const PERSISTENCE_DEBOUNCE_MS = 100
export const PERSISTENCE_VERSION = 1
```

---

## Type Guards

```typescript
/**
 * Type guard for DeckState
 */
export function isDeckState(value: unknown): value is DeckState {
  if (typeof value !== 'object' || value === null) return false
  
  const state = value as Partial<DeckState>
  
  return (
    Array.isArray(state.drawPile) &&
    Array.isArray(state.discardPile) &&
    Array.isArray(state.hand) &&
    Array.isArray(state.handCards) &&
    typeof state.turnNumber === 'number' &&
    typeof state.handSize === 'number' &&
    typeof state.discardCount === 'number' &&
    typeof state.planningPhase === 'boolean' &&
    typeof state.playOrderLocked === 'boolean' &&
    Array.isArray(state.playOrderSequence)
  )
}

/**
 * Type guard for CardInstance
 */
export function isCardInstance(value: unknown): value is CardInstance {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CardInstance).instanceId === 'string' &&
    typeof (value as CardInstance).card === 'string'
  )
}
```

---

## Summary of Changes

| Change Type | Description | Impact |
|------------|-------------|--------|
| **Validation** | Allow `discardCount = 0` | Fixes FR-006, FR-007 |
| **Persistence** | Add `PersistedDeckState`, `StoredState` types | Implements FR-001 to FR-005 |
| **Props** | Migrate play order props to `DeckControls` | Fixes FR-015 to FR-019 |
| **Derived** | Add `computeCurrentPhase`, `getCardVisualState` | Supports FR-020 to FR-039 |
| **Validation** | Add `validateAndSanitizeDeckState` | Ensures FR-005 |
| **Migration** | Add `migrateLoadedState` for forward compatibility | Future-proofs storage |

---

**Status**: Ready for implementation  
**Next**: Create persistence manager module and update reducer
