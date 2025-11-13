# Contract: Specification Compliance Remediation

**Feature**: 005-spec-compliance-remediation  
**Version**: 1.0  
**Status**: Draft

## Overview

This contract defines the expected behavior for remediation fixes across features 001-004. It serves as validation for the 42 functional requirements documented in spec.md.

---

## Persistence Contract (FR-001 to FR-005)

### State Persistence Behavior

**Contract ID**: C-PERSIST-001  
**Description**: DeckState must persist to localStorage after every state change with debouncing

```typescript
Given: Any action is dispatched that changes DeckState
When: 100ms elapses with no further state changes
Then: State is serialized to localStorage at key "deck-builder-state"
And: The following fields are persisted:
  - drawPile, discardPile, hand, handCards
  - turnNumber, handSize, discardCount
  - discardPhase (active, remainingDiscards)
  - planningPhase, playOrderSequence, playOrderLocked
  - warning, error
And: The following fields are NOT persisted (reset to defaults):
  - selectedCardIds (reset to empty Set)
  - isDealing (reset to false)
```

**Test**: `tests/unit/persistenceManager.test.ts` - save() function  
**Invariant**: Persistence never blocks UI (async/debounced)

---

**Contract ID**: C-PERSIST-002  
**Description**: Persisted state must load on initialization and merge with defaults

```typescript
Given: localStorage contains valid serialized state
When: Application initializes (useDeckState hook mounts)
Then: loadPersistedState() is called with key "deck-builder-state"
And: Loaded state is validated and sanitized
And: Valid fields from loaded state override initial defaults
And: Transient fields (selectedCardIds, isDealing) are reset to defaults
And: Missing fields use default values from initializeDeck()
```

**Test**: `tests/integration/persistenceFlow.test.tsx` - full load cycle  
**Invariant**: App never crashes due to corrupted/missing localStorage

---

**Contract ID**: C-PERSIST-003  
**Description**: localStorage failures must be handled silently without user-visible errors

```typescript
Given: localStorage.setItem() throws an exception (quota exceeded, privacy mode)
When: Persistence is attempted
Then: Exception is caught and logged to console.debug()
And: NO error message is shown to the user
And: Application continues to function normally with in-memory state
And: NO warning banner or toast notification appears
```

**Test**: `tests/integration/persistenceFlow.test.tsx` - quota exceeded scenario  
**Invariant**: Persistence failures are transparent to users (silent fallback)

---

**Contract ID**: C-PERSIST-004  
**Description**: Loaded state must be validated and sanitized to prevent corruption

```typescript
Given: localStorage contains state with invalid/corrupted fields
When: loadPersistedState() reads the data
Then: validateAndSanitizeDeckState() is called
And: Type validation occurs for all fields:
  - Arrays must be arrays (filter out non-string elements)
  - Booleans coerced with Boolean()
  - Numbers validated within ranges
And: Out-of-range values are clamped or reset to defaults
And: Missing required fields are added with defaults
And: Extra fields are preserved (forward compatibility)
And: If validation fails entirely, return null (use full defaults)
```

**Test**: `tests/unit/stateValidator.test.ts` - corruption scenarios  
**Invariant**: App never loads invalid state that could break game logic

---

## Zero Discard Count Contract (FR-006 to FR-009)

### Zero Discard Behavior

**Contract ID**: C-ZERO-001  
**Description**: discardCount value of 0 must be accepted and skip discard phase

```typescript
Given: discardCount is set to 0 via changeParameters()
When: DEAL_NEXT_HAND action is dispatched
Then: discardPhase.active is set to false (not true)
And: No discard UI elements are rendered
And: planningPhase is set to false (preserves Feature 001 auto-discard behavior)
And: User can optionally select cards for play order, or end turn immediately
And: END_TURN is allowed immediately (no mandatory play order requirement)
```

**Test**: `tests/integration/turnCycle.test.tsx` - full turn with zero discard  
**Invariant**: discardCount=0 behaves like Feature 001 (auto-discard), play order remains optional

---

**Contract ID**: C-ZERO-002  
**Description**: Discard count dropdown must include 0 as a valid option

```typescript
Given: DeckControls component is rendered
When: Discard count dropdown is visible
Then: Options include: [0, 1, 2, 3, ..., 10]
And: User can select 0 from the dropdown
And: Selected value of 0 is passed to onChangeParameters handler
And: Reducer accepts 0 without validation errors
```

**Test**: `tests/unit/DeckControls.test.tsx` - dropdown options  
**Invariant**: UI allows same range as validation logic (0-20)

---

**Contract ID**: C-ZERO-003  
**Description**: Validation must not clamp discardCount to minimum 1

```typescript
Given: changeParameters() action is dispatched with discardCount=0
When: Validation occurs in reducer
Then: validDiscardCount = Math.max(0, Math.floor(discardCount))
And: NOT validDiscardCount = Math.max(1, Math.floor(discardCount))
And: State is updated with discardCount: 0
```

**Test**: `tests/unit/deckReducer.test.ts` - zero discard validation  
**Invariant**: MIN_DISCARD_COUNT constant is 0 (not 1)

---

## Locked Card Immutability Contract (FR-010 to FR-014)

### Locked Interaction Behavior

**Contract ID**: C-LOCKED-001  
**Description**: Locked cards must be completely non-interactive (mouse, keyboard, touch)

```typescript
Given: playOrderLocked === true
When: User clicks on any card
Then: handleCardClick() returns early (no action dispatched)
And: NO SELECT/DESELECT actions are dispatched
And: selectedCardIds Set remains unchanged
And: playOrderSequence array remains unchanged

When: User presses Space or Enter on focused card
Then: handleKeyPress() returns early (no action dispatched)
And: NO state mutations occur

When: User hovers over card
Then: NO hover transform is applied
And: Cursor shows 'not-allowed' or 'default' (not 'pointer')
```

**Test**: `tests/integration/lockedInteraction.test.tsx` - comprehensive interaction tests  
**Invariant**: playOrderLocked === true means zero state changes from card interactions

---

**Contract ID**: C-LOCKED-002  
**Description**: Locked cards must not be focusable via keyboard navigation

```typescript
Given: playOrderLocked === true
When: Card elements are rendered
Then: Each card has tabIndex={-1} (not tabIndex={0})
And: Pressing Tab key skips over all cards
And: Card cannot receive keyboard focus
And: Screen reader browse mode can still discover cards
```

**Test**: `tests/unit/HandView.test.tsx` - tabIndex assertions  
**Invariant**: Locked cards are removed from tab order entirely

---

**Contract ID**: C-LOCKED-003  
**Description**: Locked cards must have distinct visual styling

```typescript
Given: playOrderLocked === true
When: Cards are rendered
Then: Each card has .card--locked CSS class applied
And: Locked styling includes:
  - opacity: 0.7
  - cursor: not-allowed or default
  - filter: grayscale(20%) (optional)
  - NO hover effects (transform, shadow disabled)
And: Sequence badges use green background (not blue)
And: Transition to locked styling occurs within 100ms
```

**Test**: `tests/unit/HandView.test.tsx` - CSS class and style tests  
**Invariant**: Locked state is visually obvious to users

---

## Component Responsibility Contract (FR-015 to FR-019)

### Component Boundary Enforcement

**Contract ID**: C-COMPONENT-001  
**Description**: DeckControls must render all game control buttons including Lock/Clear Order

```typescript
Given: DeckControls component receives play order props
When: planningPhase === true and playOrderLocked === false
Then: "Lock Order" button is rendered in DeckControls
And: Button is enabled when playOrderSequence.length === handCardsCount
And: Button is disabled when sequence is incomplete
And: Button dispatches onLockPlayOrder handler when clicked

When: planningPhase === true and playOrderSequence.length > 0
Then: "Clear Order" button is rendered in DeckControls
And: Button dispatches onClearPlayOrder handler when clicked
And: Button is hidden when playOrderLocked === true
```

**Test**: `tests/unit/DeckControls.test.tsx` - button rendering tests  
**Invariant**: All control actions originate from DeckControls, not HandView

---

**Contract ID**: C-COMPONENT-002  
**Description**: HandView must NOT render any control buttons (display only)

```typescript
Given: HandView component is rendered with play order props
When: Component renders
Then: NO "Lock Order" button is present in HandView
And: NO "Clear Order" button is present in HandView
And: HandView ONLY renders:
  - Card elements
  - Discard phase helper text (if applicable)
  - Play order phase helper text (if applicable)
And: HandView ONLY handles card interaction events:
  - onToggleCardSelection (discard phase)
  - onSelectForPlayOrder (planning phase)
  - onDeselectFromPlayOrder (planning phase)
```

**Test**: `tests/unit/HandView.test.tsx` - negative assertions (buttons NOT present)  
**Invariant**: HandView is a pure display component with card-level interactions only

---

**Contract ID**: C-COMPONENT-003  
**Description**: DeckControls must display phase status indicator

```typescript
Given: DeckControls receives planningPhase and playOrderLocked props
When: planningPhase === true and playOrderLocked === false
Then: Phase indicator displays "Planning" badge
And: Badge has blue/info styling
And: Badge is visible above or near control buttons

When: playOrderLocked === true
Then: Phase indicator displays "Executing" badge
And: Badge has green/success styling
And: Badge is visible above or near control buttons

When: discardPhase.active === true
Then: Phase indicator is hidden (discard status shown elsewhere)
```

**Test**: `tests/unit/DeckControls.test.tsx` - phase badge rendering  
**Invariant**: Current phase is always visually indicated to user

---

## Phase Status Contract (FR-020 to FR-023)

### ARIA Live Announcements

**Contract ID**: C-PHASE-001  
**Description**: Phase transitions must be announced to screen readers

```typescript
Given: ARIA live region exists in DeckControls
When: planningPhase transitions from false to true
Then: Live region announces: "Planning phase started. Select cards in your desired play order."
And: Announcement uses aria-live="polite" (not "assertive")
And: Announcement uses aria-atomic="true"

When: playOrderLocked transitions from false to true
Then: Live region announces: "Play order locked. Entering executing phase."
And: Previous planning announcement is replaced (not appended)
```

**Test**: `tests/unit/DeckControls.test.tsx` - ARIA live region content  
**Invariant**: Screen reader users are informed of phase changes

---

## Accessibility Contract (FR-024 to FR-026)

### Semantic Role Enforcement

**Contract ID**: C-A11Y-001  
**Description**: Cards must use semantic role="article" (not role="button")

```typescript
Given: HandView renders cards
When: Card elements are created
Then: Each card has role="article" attribute
And: NOT role="button" (previous incorrect implementation)
And: Card ARIA label follows format: "Card: {value}"
  - Example: "Card: 7♠"
And: If card is in play order, supplementary info appended:
  - "Card: 7♠, play order position 2"
And: Screen readers announce cards as articles during browse mode
```

**Test**: `tests/unit/HandView.test.tsx` - role and aria-label assertions  
**Invariant**: Cards are semantic content items, not interactive buttons

---

## Visual Design Contract (FR-027 to FR-031)

### Card Dimension Specifications

**Contract ID**: C-VISUAL-001  
**Description**: Card dimensions must match contract specifications exactly

```typescript
Given: HandView renders cards
When: CSS is applied
Then: Card width uses: clamp(80px, 12vw, 120px)
  - Minimum: 80px
  - Maximum: 120px
  - Responsive: 12vw
And: Card aspect ratio is 2:3 (height = 1.5 × width)
And: Cards overlap by 50% of card width (not gap spacing):
  - .card { margin-left: -50%; }
  - .card:first-child { margin-left: 0; }
And: 10-card hand fits without horizontal scroll on 1024px+ viewports
```

**Test**: `tests/integration/handDisplay.test.tsx` - dimension measurements  
**Invariant**: Visual design matches documented contract specifications

---

## State Invariants (Cross-Cutting)

### Invariant Validation

**Contract ID**: C-INVARIANT-001  
**Description**: State consistency rules must hold at all times

```typescript
Invariant 1: playOrderLocked === true => planningPhase === true
  - Cannot lock without being in planning phase
  
Invariant 2: playOrderLocked === true => playOrderSequence.length === handCards.length
  - Locked order must be complete
  
Invariant 3: discardPhase.active === true => planningPhase === false
  - Cannot be in both discard and planning phases
  
Invariant 4: playOrderSequence.length <= handCards.length
  - Cannot order more cards than exist in hand
  
Invariant 5: selectedCardIds ⊆ handCards (all IDs exist in hand)
  - Cannot select cards not in hand
  
Invariant 6: discardCount >= 0 (NEW: Feature 005)
  - Zero discard count is valid
  
Invariant 7: If playOrderLocked === true, then persistedState.playOrderLocked === true after save
  - Locked state must persist correctly
```

**Test**: `tests/contract/deckContracts.test.ts` - invariant validation suite  
**Enforcement**: All actions in reducer must maintain these invariants

---

## Definition of Compliance

**100% Contract Compliance** means:
- All 15 contracts (C-PERSIST-001 through C-INVARIANT-001) pass validation
- All 42 functional requirements (FR-001 through FR-042) are met
- All 17 success criteria (SC-001 through SC-017) achieve targets
- All 44 acceptance scenarios across 10 user stories pass
- Zero regressions in existing tests
- WCAG AA accessibility compliance confirmed

---

**Status**: Contract defined, ready for implementation and validation  
**Enforcement**: All contracts must be validated via automated tests before feature completion
