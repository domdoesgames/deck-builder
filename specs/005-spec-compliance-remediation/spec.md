# Feature Specification: Specification Compliance Remediation

**Feature Branch**: `005-spec-compliance-remediation`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: Comprehensive audit revealed 13 gaps between specifications (features 001-004) and actual implementation requiring systematic remediation to achieve 100% compliance.

## Context

This feature addresses implementation gaps identified through comprehensive specification auditing. The gaps span four priority levels: critical (blocking functionality), high (incorrect behavior), medium (incomplete features), and low (minor deviations). All gaps must be resolved to ensure the codebase fully matches its documented contracts and specifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persistent Play Order State (Priority: P1 - Critical)

After selecting a play order and locking it, if I refresh my browser, the locked play order persists and remains immutable, maintaining game state integrity across sessions.

**Why this priority**: Core requirement explicitly documented in FR-008, FR-009, FR-020 and play-order-state.contract.md. Without persistence, the feature violates its primary contract promise and breaks user trust in the system's reliability.

**Independent Test**: Select play order with 3 cards, lock it, note the sequence, refresh page, verify exact sequence restored and remains locked. Can be tested in isolation from other features.

**Acceptance Scenarios**:

1. **Given** I have selected a play order sequence (e.g., card B→A→C) but not locked it, **When** I refresh the page, **Then** the sequence is restored and I can continue editing or lock it
2. **Given** I have locked a play order sequence, **When** I refresh the page, **Then** the locked sequence is restored exactly as it was, cards display "Executing" phase, and no modifications are possible
3. **Given** localStorage fails (privacy mode, quota exceeded), **When** I perform play order operations, **Then** the feature continues to work with in-memory state without displaying errors
4. **Given** I have a locked play order from a previous session, **When** I load the page, **Then** the End Turn button is enabled (not blocked by missing state)

---

### User Story 2 - Zero Discard Count Behavior (Priority: P1 - Critical)

When I set the discard count to 0, the discard phase is skipped entirely and I proceed directly to play order selection or turn end, matching the documented contract behavior.

**Why this priority**: Critical functional requirement (FR-009 in feature 003, discard-phase.contract.md Edge Case 1). Current implementation blocks users from using discard count of 0, violating the spec.

**Independent Test**: Set discard count to 0, deal hand, verify no discard phase occurs and play order phase begins immediately (or End Turn is available if no cards remain).

**Acceptance Scenarios**:

1. **Given** I set discard count to 0 before dealing, **When** a hand is dealt, **Then** the discard phase does not activate and I enter planning phase immediately (if cards exist)
2. **Given** discard count is 0, **When** viewing the discard count dropdown, **Then** 0 is a selectable option in the list
3. **Given** discard count is 0, **When** changing parameters, **Then** `changeParameters()` accepts 0 without clamping to minimum 1
4. **Given** discard count is 0 in config, **When** a new turn begins, **Then** no "Discard Selected Cards" button appears and no discard helper text is shown

---

### User Story 3 - Locked Cards Immutability (Priority: P1 - Critical)

After locking my play order, cards become truly non-interactive - they do not respond to clicks, keyboard input, or any selection logic from the discard phase, ensuring the locked state is immutable as documented.

**Why this priority**: Critical contract violation. Locked cards must be immutable per FR-007 (feature 004). Current implementation allows discard selection logic to trigger on locked cards, breaking the locked state guarantee.

**Independent Test**: Lock play order, attempt to click cards with various interaction methods (mouse, keyboard, touch), verify no state changes occur and no visual feedback suggests interactivity.

**Acceptance Scenarios**:

1. **Given** play order is locked (playOrderLocked = true), **When** I click on any card, **Then** no action is dispatched and no selection state changes
2. **Given** play order is locked, **When** I press Space or Enter while a card is focused, **Then** no action is dispatched and focus visual remains static
3. **Given** play order is locked, **When** I hover over cards, **Then** no hover elevation effect occurs (cursor shows `not-allowed` or `default`)
4. **Given** play order is locked, **When** checking card tabIndex, **Then** all cards have `tabIndex={-1}` making them unfocusable
5. **Given** play order is locked, **When** viewing cards, **Then** opacity is reduced (0.7) and/or grayscale filter applied per contract

---

### User Story 4 - Component Responsibility Alignment (Priority: P2 - High)

The Lock Order and Clear Order buttons appear in the DeckControls component (not HandView), matching the documented contract and maintaining proper separation of concerns.

**Why this priority**: High-priority architectural deviation from documented contract (play-order-ui.contract.md Component Responsibilities). Impacts maintainability and violates the agreed-upon component structure.

**Independent Test**: Verify Lock/Clear Order buttons render in DeckControls component, not HandView. Check component props and DOM structure match contract specifications.

**Acceptance Scenarios**:

1. **Given** I am in planning phase, **When** viewing the UI, **Then** "Lock Order" and "Clear Order" buttons appear in the DeckControls section, not below the card hand
2. **Given** DeckControls component is rendered, **When** examining props, **Then** it receives `onLockPlayOrder` and `onClearPlayOrder` handler props as specified in contract
3. **Given** HandView component is rendered, **When** examining its responsibilities, **Then** it only handles card display and interaction, not control buttons
4. **Given** planning phase is active, **When** viewing the page layout, **Then** phase status indicator appears in DeckControls area

---

### User Story 5 - Phase Status Indicators (Priority: P2 - Medium)

During play order workflow, I see clear visual indicators showing "Planning" when selecting order and "Executing" when locked, with screen reader announcements for accessibility as documented in the UI contract.

**Why this priority**: Medium priority - enhances UX and accessibility per documented requirements (play-order-ui.contract.md Phase Status Indicator, FR-012). Missing feature impacts usability but doesn't break core functionality.

**Independent Test**: Enter planning phase, verify "Planning" badge visible; lock order, verify badge changes to "Executing"; use screen reader to verify ARIA live announcements occur.

**Acceptance Scenarios**:

1. **Given** I enter planning phase after discarding, **When** viewing the UI, **Then** a status badge displays "Planning" with appropriate styling (blue/info color)
2. **Given** planning phase is active, **When** navigating with screen reader, **Then** an ARIA live region announces "Planning phase started. Select cards in your desired play order."
3. **Given** I lock the play order, **When** the lock completes, **Then** status badge changes to "Executing" with success color (green) and lock icon (optional)
4. **Given** play order is locked, **When** navigating with screen reader, **Then** ARIA live region announces "Play order locked. Entering executing phase."
5. **Given** I am in discard phase, **When** viewing status area, **Then** planning/executing indicators are hidden (show discard status instead)

---

### User Story 6 - Accessibility Role Corrections (Priority: P2 - Medium)

Cards display with `role="article"` and proper ARIA labels matching the Feature 002 contract, improving navigation for screen reader users as originally specified.

**Why this priority**: Medium priority - documented accessibility requirement (HandView.contract.md Accessibility Contract). Current `role="button"` conflicts with contract specification and accessibility best practices for card display.

**Independent Test**: Render hand, inspect card elements, verify `role="article"` and `aria-label="Card: {value}"` format matches contract exactly.

**Acceptance Scenarios**:

1. **Given** cards are displayed in hand, **When** inspecting card elements, **Then** each card has `role="article"` (not `role="button"`)
2. **Given** a card with value "7♠", **When** screen reader announces it, **Then** announcement includes "Card: 7♠, article" matching contract format
3. **Given** a card is selected for play order (position 2), **When** screen reader announces it, **Then** label includes ", play order position 2" as supplementary info
4. **Given** navigating with screen reader, **When** entering hand region, **Then** cards are navigable as article elements maintaining contract-specified structure

---

### User Story 7 - Visual Design Compliance (Priority: P3 - Medium)

Cards render with dimensions and spacing matching the visual contract: 80-120px width, 50% overlap layout, and sequence badges sized per specification.

**Why this priority**: Medium priority - visual consistency and contract compliance. Current implementation uses gaps instead of overlap, and different size ranges than documented (100-160px vs 80-120px).

**Independent Test**: Measure card widths across different hand sizes (1, 5, 10 cards), verify min/max bounds and overlap behavior match contract CSS specifications.

**Acceptance Scenarios**:

1. **Given** I have 5 cards in hand, **When** measuring card width, **Then** width is clamped between 80px minimum and 120px maximum as specified
2. **Given** I have multiple cards in hand, **When** viewing the layout, **Then** cards overlap by 50% of card width (not separated by gaps)
3. **Given** I have 10 cards in hand at 1024px viewport, **When** viewing the hand, **Then** all cards fit without horizontal scroll per SC-001
4. **Given** a card displays a sequence number badge, **When** measuring the badge, **Then** size, position (top-right), and styling match contract specifications
5. **Given** cards are displayed, **When** checking aspect ratio, **Then** height is 1.5x width (2:3 aspect ratio) per contract

---

### User Story 8 - Locked Card Styling (Priority: P3 - Medium)

When play order is locked, cards display with reduced opacity (0.7) and/or grayscale filter, clearly indicating their non-interactive locked state as specified in the UI contract.

**Why this priority**: Medium priority - visual feedback requirement (play-order-ui.contract.md State 3: Locked Card). Missing styling reduces user clarity about locked state.

**Independent Test**: Lock play order, inspect card CSS, verify opacity and/or filter properties applied; observe visual distinction from planning phase.

**Acceptance Scenarios**:

1. **Given** play order is locked, **When** viewing cards, **Then** cards have CSS `opacity: 0.7` applied
2. **Given** play order is locked, **When** viewing cards, **Then** cards may have `filter: grayscale(20%)` applied (optional enhancement)
3. **Given** play order is locked, **When** hovering over cards, **Then** no hover transform occurs (locked styling prevents it)
4. **Given** play order is locked, **When** viewing cursor, **Then** cursor shows `not-allowed` or `default` (not `pointer`)
5. **Given** transitioning from planning to locked, **When** lock completes, **Then** locked styling applies within 100ms per performance contract

---

### User Story 9 - Disabled State for Max Selection (Priority: P3 - Medium)

During discard phase, when I've selected the maximum number of cards, unselected cards become clearly non-interactive, preventing over-selection attempts.

**Why this priority**: Medium priority - UX enhancement implied by FR-012 (max selection enforcement). Current behavior silently ignores clicks; explicit disabled state is clearer.

**Independent Test**: Select discard count of 3, select 3 cards, verify remaining unselected cards show disabled styling and don't respond to interaction.

**Acceptance Scenarios**:

1. **Given** discard count is 3 and I have selected 3 cards, **When** viewing unselected cards, **Then** they display disabled styling (reduced opacity, different cursor)
2. **Given** max discard selection reached, **When** clicking an unselected card, **Then** click is visually ignored (no hover effect, no state change)
3. **Given** max discard selection reached, **When** using keyboard, **Then** unselected cards have `tabIndex={-1}` or `aria-disabled="true"`
4. **Given** I deselect one card (freeing a slot), **When** viewing previously disabled cards, **Then** they return to normal interactive state immediately

---

### User Story 10 - Progress Indicator Format Consistency (Priority: P4 - Low)

Helper text during discard and play order phases displays in the exact format specified in contracts (e.g., "X of Y cards selected"), ensuring consistency with documentation.

**Why this priority**: Low priority - cosmetic text difference. Current format conveys same information, just worded differently than contract examples.

**Independent Test**: Enter discard phase, verify helper text format; enter planning phase, verify format matches contract specifications exactly.

**Acceptance Scenarios**:

1. **Given** discard phase with 2 of 3 cards selected, **When** reading helper text, **Then** text displays "Select 3 cards to discard (2 of 3 selected)" or contract-specified format
2. **Given** planning phase with 3 of 5 cards ordered, **When** reading helper text, **Then** text displays "3 of 5 cards ordered" matching contract format
3. **Given** discard requirement met, **When** reading helper text, **Then** text shows "✓ Ready to discard X card(s)" with checkmark prefix
4. **Given** play order complete but not locked, **When** reading helper text, **Then** text shows "✓ All X cards ordered - ready to lock"

---

### Edge Cases

**Persistence Failure Handling**:
- What happens if localStorage.setItem() throws (quota exceeded)? → Silent fallback to in-memory state, no error shown (per FR-020)
- What happens if localStorage data is corrupted? → Fall back to initial state with no error display

**Locked State Interactions**:
- Can keyboard navigation focus locked cards? → No, `tabIndex={-1}` prevents focus entirely
- What if user inspects and manually changes playOrderLocked in devtools? → State mismatch handled gracefully, lock state wins

**Zero Discard Count Edge Cases**:
- What if discardCount=0 and handSize=0? → Skip both discard and planning phases, allow immediate END_TURN
- Can user change from discardCount=2 to 0 mid-discard? → Yes, triggers immediate reset per changeParameters contract

**Component Responsibility Migration**:
- What happens to existing tests after moving buttons to DeckControls? → Update test file locations, maintain coverage
- How do we handle intermediate states during migration? → Atomic component update in single commit

## Requirements *(mandatory)*

### Functional Requirements

**Persistence (Critical Priority)**

- **FR-001**: System MUST persist `playOrderSequence`, `playOrderLocked`, and `planningPhase` to localStorage after every state mutation (FR-008, FR-009, FR-020 from feature 004)
- **FR-002**: System MUST restore persisted play order state on page load, maintaining exact sequence and lock status
- **FR-003**: System MUST handle localStorage failures gracefully with silent fallback to in-memory state (no error display to user)
- **FR-004**: System MUST persist discard phase state (`handCards`, `discardPhase.active`, `discardCount`) but clear selection state (`selectedCardIds`) on refresh per contract
- **FR-005**: System MUST validate and sanitize loaded state to prevent corruption from manual localStorage edits

**Zero Discard Count (Critical Priority)**

- **FR-006**: System MUST accept discardCount value of 0 in changeParameters() without clamping to minimum 1
- **FR-007**: System MUST include 0 as an option in discard count dropdown UI
- **FR-008**: System MUST skip discard phase entirely when discardCount === 0, proceeding directly to planning phase or END_TURN
- **FR-009**: System MUST not display discard UI elements (button, helper text) when discardCount === 0

**Locked Cards Immutability (Critical Priority)**

- **FR-010**: System MUST prevent all card interactions when `playOrderLocked === true` (clicks, keyboard, touch)
- **FR-011**: System MUST set card `tabIndex={-1}` when locked to prevent keyboard focus
- **FR-012**: System MUST not dispatch any SELECT/DESELECT actions when cards are in locked state
- **FR-013**: System MUST apply locked visual styling (opacity 0.7, grayscale filter, cursor change) when `playOrderLocked === true`
- **FR-014**: System MUST disable hover effects (transform, shadow) on locked cards

**Component Responsibility Alignment (High Priority)**

- **FR-015**: Lock Order button MUST be rendered in DeckControls component, not HandView
- **FR-016**: Clear Order button MUST be rendered in DeckControls component, not HandView
- **FR-017**: Phase status indicator (Planning/Executing) MUST be rendered in DeckControls component
- **FR-018**: DeckControls MUST receive `onLockPlayOrder` and `onClearPlayOrder` props as specified in contract
- **FR-019**: HandView MUST only handle card display and card interaction events (not control buttons)

**Phase Status Indicators (Medium Priority)**

- **FR-020**: System MUST display "Planning" status badge when `planningPhase === true` with blue/info styling
- **FR-021**: System MUST display "Executing" status badge when `playOrderLocked === true` with green/success styling
- **FR-022**: System MUST provide ARIA live region announcements for phase transitions (Planning → Executing)
- **FR-023**: System MUST hide phase status indicator when discard phase is active

**Accessibility Role Corrections (Medium Priority)**

- **FR-024**: Card elements MUST use `role="article"` as specified in HandView.contract.md
- **FR-025**: Card ARIA labels MUST follow format "Card: {value}" per contract, with supplementary play order info appended if applicable
- **FR-026**: System MUST maintain screen reader navigation structure as specified in contract

**Visual Design Compliance (Medium Priority)**

- **FR-027**: Card width MUST be clamped to min 80px, max 120px per HandView.contract.md CSS specifications
- **FR-028**: Cards MUST overlap by 50% of card width (negative margin-left), not use gap spacing
- **FR-029**: Card aspect ratio MUST be 2:3 (height = 1.5 × width) per contract
- **FR-030**: Sequence number badge MUST match contract position (top-right), size (min 36px), and styling specifications
- **FR-031**: Ten-card hands MUST fit without horizontal scroll on 1024px+ viewports (SC-001)

**Locked Card Styling (Medium Priority)**

- **FR-032**: Locked cards MUST have CSS `opacity: 0.7` applied
- **FR-033**: Locked cards MAY have `filter: grayscale(20%)` applied (optional enhancement)
- **FR-034**: Locked cards MUST show `cursor: not-allowed` or `cursor: default` (not `pointer`)
- **FR-035**: Locked card sequence badges MUST use different color than planning phase (e.g., green vs blue)

**Disabled State for Max Selection (Medium Priority)**

- **FR-036**: Unselected cards MUST show disabled styling when `selectedCardIds.size === discardPhase.remainingDiscards`
- **FR-037**: Disabled cards MUST not respond to click or keyboard interactions
- **FR-038**: Disabled cards MUST have `tabIndex={-1}` or `aria-disabled="true"`
- **FR-039**: Disabled state MUST be removed immediately when selection count drops below maximum

**Progress Indicator Format (Low Priority)**

- **FR-040**: Discard helper text MUST match contract format specification
- **FR-041**: Play order helper text MUST match contract format specification
- **FR-042**: Helper text MUST use checkmark (✓) prefix when requirements are met

### Key Entities

**Persistence Layer**:
- **StorageManager**: Handles localStorage serialization/deserialization with fallback logic
- **StateValidator**: Validates loaded state structure and sanitizes corrupted data
- **PersistenceConfig**: Defines which state fields are persisted vs transient

**Visual State Extensions**:
- **CardVisualState**: Enum of possible card visual states (unordered, ordered, locked, disabled)
- **PhaseIndicator**: Component showing current phase (Planning/Executing) with ARIA live announcements
- **LockedCardStyle**: CSS module for locked card visual styling

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Persistence**:
- **SC-001**: 100% of play order state (sequence, locked status, planning phase) persists and restores correctly across page refreshes
- **SC-002**: 0 user-visible errors when localStorage fails (silent fallback to in-memory state)
- **SC-003**: Persisted state loads and renders within 100ms on page initialization

**Zero Discard Count**:
- **SC-004**: discardCount=0 successfully skips discard phase in 100% of test cases
- **SC-005**: Users can select and apply discardCount=0 from UI dropdown

**Locked Cards Immutability**:
- **SC-006**: 0 state changes occur when interacting with locked cards (100+ interaction attempts)
- **SC-007**: Locked cards have `tabIndex={-1}` and do not receive keyboard focus
- **SC-008**: Locked card styling applies within 100ms of lock action

**Component Alignment**:
- **SC-009**: 100% of play order control buttons render in DeckControls (0 in HandView)
- **SC-010**: All component tests pass after responsibility migration

**Phase Status Indicators**:
- **SC-011**: Phase indicators display and update within 100ms of phase transitions
- **SC-012**: Screen reader announcements occur for 100% of phase transitions (verified with NVDA/JAWS)

**Visual Design**:
- **SC-013**: 100% of card measurements fall within contract-specified ranges (80-120px width)
- **SC-014**: 10-card hands fit without horizontal scroll on 1024px+ viewports
- **SC-015**: Card overlap calculations match contract formula (50% of card width)

**Accessibility**:
- **SC-016**: 100% of cards use `role="article"` (0 use `role="button"`)
- **SC-017**: ARIA labels match contract format for 100% of cards

### Assumptions

- Pico CSS variables remain available for theming (opacity, colors, spacing)
- React 18.2 features (useEffect, useState, useMemo) available for persistence hooks
- localStorage API available in all target browsers (graceful degradation for privacy mode)
- Existing test infrastructure supports async storage testing

### Testing Strategy

**Unit Tests** (New):
- `persistenceManager.test.ts`: localStorage serialization, deserialization, error handling
- `stateValidator.test.ts`: Validation logic for loaded state
- `deckReducer.persistence.test.ts`: Persistence integration with reducer

**Unit Tests** (Updated):
- `deckReducer.test.ts`: Add zero discard count tests
- `HandView.test.tsx`: Update role assertions, locked state tests
- `DeckControls.test.tsx`: Add button rendering tests

**Integration Tests** (New):
- `persistenceFlow.test.tsx`: Full persistence cycle (save → refresh → load)
- `zeroDiscardFlow.test.tsx`: Zero discard count through full turn cycle
- `lockedInteraction.test.tsx`: Comprehensive locked state interaction tests

**Contract Tests** (Updated):
- `deckContracts.test.ts`: Add persistence contract tests
- `discardContracts.test.ts`: Add zero discard tests
- `playOrderContracts.test.ts`: Update lock immutability tests

**Visual Regression** (New):
- Screenshot tests for card dimensions, overlap, and locked styling
- Phase indicator appearance tests

### Closed Clarifications

**Q1: Persistence Scope**  
Should we persist all DeckState or only play order fields?

**A1**: Persist all game state fields (drawPile, discardPile, handCards, playOrder, etc.) but clear transient fields (selectedCardIds) per existing contracts. This provides full session recovery.

**Q2: Zero Discard Validation**  
Should zero discard count be validated/warned in UI?

**A2**: No warning needed. Zero is a valid value per contract specification. Treat it as a normal option with no special UI treatment beyond skipping the phase.

**Q3: Locked Card Accessibility**  
Should locked cards be completely removed from tab order?

**A3**: Yes, `tabIndex={-1}` removes them from tab order entirely. This prevents confusion as they're non-interactive. Screen readers can still discover them via browse mode.

**Q4: Component Migration Strategy**  
Should we migrate buttons in phases or all at once?

**A4**: Atomic migration in single commit. Move all play order buttons from HandView to DeckControls simultaneously to avoid partial states and simplify testing.

**Q5: Visual Design Priority**  
Which visual gaps are mandatory vs nice-to-have?

**A5**: Card dimensions (80-120px) and overlap layout are mandatory (contract compliance). Sequence badge exact size/position is medium priority. Grayscale filter is optional enhancement.

**Q6: Progress Indicator Exact Format**  
Must helper text match contract word-for-word?

**A6**: No, semantic equivalence is acceptable. "2 of 3 selected" vs "2/3 selected" are equivalent. Priority is clarity and information accuracy, not exact wording.

---

## Implementation Notes

### Persistence Implementation Pattern

```typescript
// Hook for automatic state persistence
function useDeckStatePersistence(state: DeckState) {
  useEffect(() => {
    try {
      const serialized = JSON.stringify({
        ...state,
        selectedCardIds: undefined, // Don't persist transient selections
      })
      localStorage.setItem('deck-builder-state', serialized)
    } catch (error) {
      // Silent fallback per FR-003
      console.debug('Persistence failed, continuing with in-memory state')
    }
  }, [state])
}

// Load persisted state on initialization
function loadPersistedState(): Partial<DeckState> | null {
  try {
    const raw = localStorage.getItem('deck-builder-state')
    if (!raw) return null
    
    const loaded = JSON.parse(raw)
    return validateAndSanitize(loaded) // FR-005
  } catch (error) {
    return null // Silent failure
  }
}
```

### Component Responsibility Migration

```typescript
// DeckControls.tsx (new props)
interface DeckControlsProps {
  // Existing props...
  
  // Feature 005: Play order controls migrated here
  playOrderSequence: string[]
  playOrderLocked: boolean
  planningPhase: boolean
  handCardsCount: number
  onLockPlayOrder: () => void
  onClearPlayOrder: () => void
}

// HandView.tsx (removed props)
// Remove: onLockPlayOrder, onClearPlayOrder
// Remove: Lock/Clear button rendering
// Keep: Card display, card interaction handlers
```

### Zero Discard Count Fix

```typescript
// deckReducer.ts - changeParameters()
function changeParameters(...) {
  // OLD: const validDiscardCount = Math.max(1, Math.floor(discardCount))
  // NEW: Allow zero
  const validDiscardCount = Math.max(0, Math.floor(discardCount))
  
  // ... rest of function
}

// DeckControls.tsx - dropdown options
{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
  <option key={count} value={count}>{count}</option>
))}
```

### Locked Card Interaction Guard

```typescript
// HandView.tsx
const handleCardClick = (instanceId: string) => {
  // Feature 005: Block all interactions when locked (FR-010)
  if (playOrderLocked) return
  
  if (planningPhase) {
    // ... play order logic
  } else if (discardPhaseActive) {
    // ... discard logic
  }
}

// JSX
<div
  className={`card ${isLocked ? 'card--locked' : ''}`}
  tabIndex={playOrderLocked ? -1 : 0} // FR-011
  onClick={() => !playOrderLocked && handleCardClick(instanceId)}
  // ...
>
```

---

## Dependencies

### From Previous Features
- Feature 001: DeckState structure, reducer pattern
- Feature 002: HandView component architecture
- Feature 003: Discard phase contracts
- Feature 004: Play order state management contracts

### External Libraries
- React 18.2: useEffect for persistence, state hooks
- TypeScript 5.3.3: Type validation for loaded state
- Jest: Testing persistence and state validation

### Browser APIs
- localStorage: Primary persistence mechanism
- sessionStorage: Alternative fallback if localStorage full (optional)

---

## Migration Path

### Phase 1: Critical Fixes (Week 1)
1. Implement persistence layer (FR-001 to FR-005)
2. Fix zero discard count (FR-006 to FR-009)
3. Implement locked card immutability (FR-010 to FR-014)

### Phase 2: Component Architecture (Week 1)
4. Migrate buttons to DeckControls (FR-015 to FR-019)
5. Add phase status indicators (FR-020 to FR-023)

### Phase 3: Polish & Compliance (Week 2)
6. Fix accessibility roles (FR-024 to FR-026)
7. Adjust visual design (FR-027 to FR-031)
8. Add locked styling (FR-032 to FR-035)
9. Implement disabled states (FR-036 to FR-039)
10. Update helper text (FR-040 to FR-042)

### Phase 4: Testing & Validation
11. Add comprehensive test coverage
12. Visual regression testing
13. Accessibility audit with NVDA/JAWS
14. Cross-browser validation

---

## Definition of Done

- [ ] All 42 functional requirements implemented and verified
- [ ] All 17 success criteria met with measured validation
- [ ] 100% test coverage for new persistence logic
- [ ] All existing tests updated and passing
- [ ] Visual regression tests pass for card styling changes
- [ ] Accessibility audit confirms WCAG AA compliance
- [ ] Documentation updated to reflect changes
- [ ] Code review completed with sign-off from two reviewers
- [ ] Feature branch merged to main without conflicts

---

**Next Steps**: Create detailed implementation plan (plan.md), data model extensions (data-model.md), and task breakdown (tasks.md).
