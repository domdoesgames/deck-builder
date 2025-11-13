# Requirements Checklist: Specification Compliance Remediation

**Feature**: 005-spec-compliance-remediation  
**Version**: 1.0  
**Status**: Pending Implementation

## Purpose

This checklist validates that all 42 functional requirements from spec.md have been implemented and tested. Each requirement must be verified before marking the feature as complete.

---

## Critical Priority (P1) - 14 Requirements

### Persistence (FR-001 to FR-005)

- [ ] **FR-001**: System MUST persist `playOrderSequence`, `playOrderLocked`, and `planningPhase` to localStorage after every state mutation
  - **Validation**: Check localStorage after state change, verify fields present
  - **Test**: `tests/unit/persistenceManager.test.ts` - save() function
  - **Contract**: C-PERSIST-001

- [ ] **FR-002**: System MUST restore persisted play order state on page load, maintaining exact sequence and lock status
  - **Validation**: Refresh page, verify state restored identically
  - **Test**: `tests/integration/persistenceFlow.test.tsx` - load cycle
  - **Contract**: C-PERSIST-002

- [ ] **FR-003**: System MUST handle localStorage failures gracefully with silent fallback to in-memory state (no error display to user)
  - **Validation**: Fill localStorage quota, verify no error UI shown
  - **Test**: `tests/integration/persistenceFlow.test.tsx` - quota exceeded
  - **Contract**: C-PERSIST-003

- [ ] **FR-004**: System MUST persist discard phase state (`handCards`, `discardPhase.active`, `discardCount`) but clear selection state (`selectedCardIds`) on refresh per contract
  - **Validation**: Check localStorage, verify selectedCardIds excluded
  - **Test**: `tests/unit/persistenceManager.test.ts` - field exclusion
  - **Contract**: C-PERSIST-001

- [ ] **FR-005**: System MUST validate and sanitize loaded state to prevent corruption from manual localStorage edits
  - **Validation**: Manually corrupt localStorage JSON, verify app handles gracefully
  - **Test**: `tests/unit/stateValidator.test.ts` - corruption scenarios
  - **Contract**: C-PERSIST-004

### Zero Discard Count (FR-006 to FR-009)

- [ ] **FR-006**: System MUST accept discardCount value of 0 in changeParameters() without clamping to minimum 1
  - **Validation**: Call changeParameters({handSize: 5, discardCount: 0}), verify state.discardCount === 0
  - **Test**: `tests/unit/deckReducer.test.ts` - zero validation
  - **Contract**: C-ZERO-003

- [ ] **FR-007**: System MUST include 0 as an option in discard count dropdown UI
  - **Validation**: Render DeckControls, verify dropdown includes <option value="0">
  - **Test**: `tests/unit/DeckControls.test.tsx` - dropdown options
  - **Contract**: C-ZERO-002

- [ ] **FR-008**: System MUST skip discard phase entirely when discardCount === 0, proceeding directly to planning phase or END_TURN
  - **Validation**: Set discardCount=0, deal hand, verify discardPhase.active === false
  - **Test**: `tests/integration/zeroDiscardFlow.test.tsx` - phase skip
  - **Contract**: C-ZERO-001

- [ ] **FR-009**: System MUST not display discard UI elements (button, helper text) when discardCount === 0
  - **Validation**: Render with discardCount=0, verify no discard button/text
  - **Test**: `tests/integration/zeroDiscardFlow.test.tsx` - UI hidden
  - **Contract**: C-ZERO-001

### Locked Cards Immutability (FR-010 to FR-014)

- [ ] **FR-010**: System MUST prevent all card interactions when `playOrderLocked === true` (clicks, keyboard, touch)
  - **Validation**: Lock order, attempt clicks/keyboard, verify no state change
  - **Test**: `tests/integration/lockedInteraction.test.tsx` - interaction blocking
  - **Contract**: C-LOCKED-001

- [ ] **FR-011**: System MUST set card `tabIndex={-1}` when locked to prevent keyboard focus
  - **Validation**: Inspect card elements when locked, verify tabIndex={-1}
  - **Test**: `tests/unit/HandView.test.tsx` - tabIndex assertions
  - **Contract**: C-LOCKED-002

- [ ] **FR-012**: System MUST not dispatch any SELECT/DESELECT actions when cards are in locked state
  - **Validation**: Monitor action dispatches, verify none occur when locked
  - **Test**: `tests/integration/lockedInteraction.test.tsx` - no actions
  - **Contract**: C-LOCKED-001

- [ ] **FR-013**: System MUST apply locked visual styling (opacity 0.7, grayscale filter, cursor change) when `playOrderLocked === true`
  - **Validation**: Inspect card styles when locked, verify CSS properties
  - **Test**: `tests/unit/HandView.test.tsx` - CSS class application
  - **Contract**: C-LOCKED-003

- [ ] **FR-014**: System MUST disable hover effects (transform, shadow) on locked cards
  - **Validation**: Hover over locked cards, verify no transform applied
  - **Test**: `tests/integration/lockedInteraction.test.tsx` - hover disabled
  - **Contract**: C-LOCKED-003

---

## High Priority (P2) - 5 Requirements

### Component Responsibility Alignment (FR-015 to FR-019)

- [ ] **FR-015**: Lock Order button MUST be rendered in DeckControls component, not HandView
  - **Validation**: Inspect DOM, verify button in DeckControls section
  - **Test**: `tests/unit/DeckControls.test.tsx` - button rendering
  - **Contract**: C-COMPONENT-001

- [ ] **FR-016**: Clear Order button MUST be rendered in DeckControls component, not HandView
  - **Validation**: Inspect DOM, verify button in DeckControls section
  - **Test**: `tests/unit/DeckControls.test.tsx` - button rendering
  - **Contract**: C-COMPONENT-001

- [ ] **FR-017**: Phase status indicator (Planning/Executing) MUST be rendered in DeckControls component
  - **Validation**: Verify phase badge appears in DeckControls area
  - **Test**: `tests/unit/DeckControls.test.tsx` - phase indicator
  - **Contract**: C-COMPONENT-003

- [ ] **FR-018**: DeckControls MUST receive `onLockPlayOrder` and `onClearPlayOrder` props as specified in contract
  - **Validation**: Check DeckControlsProps interface definition
  - **Test**: TypeScript compilation (type safety)
  - **Contract**: C-COMPONENT-001

- [ ] **FR-019**: HandView MUST only handle card display and card interaction events (not control buttons)
  - **Validation**: Verify HandView component has no button elements
  - **Test**: `tests/unit/HandView.test.tsx` - negative assertions
  - **Contract**: C-COMPONENT-002

---

## Medium Priority (P2-P3) - 19 Requirements

### Phase Status Indicators (FR-020 to FR-023)

- [ ] **FR-020**: System MUST display "Planning" status badge when `planningPhase === true` with blue/info styling
  - **Validation**: Enter planning phase, verify "Planning" badge visible
  - **Test**: `tests/unit/DeckControls.test.tsx` - phase badge
  - **Contract**: C-COMPONENT-003

- [ ] **FR-021**: System MUST display "Executing" status badge when `playOrderLocked === true` with green/success styling
  - **Validation**: Lock order, verify "Executing" badge visible
  - **Test**: `tests/unit/DeckControls.test.tsx` - phase badge
  - **Contract**: C-COMPONENT-003

- [ ] **FR-022**: System MUST provide ARIA live region announcements for phase transitions (Planning → Executing)
  - **Validation**: Use screen reader, verify announcements occur
  - **Test**: `tests/unit/DeckControls.test.tsx` - ARIA live region
  - **Contract**: C-PHASE-001

- [ ] **FR-023**: System MUST hide phase status indicator when discard phase is active
  - **Validation**: Enter discard phase, verify phase badge hidden
  - **Test**: `tests/unit/DeckControls.test.tsx` - conditional rendering
  - **Contract**: C-COMPONENT-003

### Accessibility Role Corrections (FR-024 to FR-026)

- [ ] **FR-024**: Card elements MUST use `role="article"` as specified in HandView.contract.md
  - **Validation**: Inspect card elements, verify role attribute
  - **Test**: `tests/unit/HandView.test.tsx` - role assertions
  - **Contract**: C-A11Y-001

- [ ] **FR-025**: Card ARIA labels MUST follow format "Card: {value}" per contract, with supplementary play order info appended if applicable
  - **Validation**: Inspect aria-label attributes, verify format
  - **Test**: `tests/unit/HandView.test.tsx` - ARIA label format
  - **Contract**: C-A11Y-001

- [ ] **FR-026**: System MUST maintain screen reader navigation structure as specified in contract
  - **Validation**: Navigate with screen reader, verify structure correct
  - **Test**: Manual accessibility audit
  - **Contract**: C-A11Y-001

### Visual Design Compliance (FR-027 to FR-031)

- [ ] **FR-027**: Card width MUST be clamped to min 80px, max 120px per HandView.contract.md CSS specifications
  - **Validation**: Measure card widths across viewport sizes, verify bounds
  - **Test**: `tests/integration/handDisplay.test.tsx` - dimension tests
  - **Contract**: C-VISUAL-001

- [ ] **FR-028**: Cards MUST overlap by 50% of card width (negative margin-left), not use gap spacing
  - **Validation**: Inspect CSS, verify margin-left: -50% on non-first cards
  - **Test**: `tests/integration/handDisplay.test.tsx` - overlap calculation
  - **Contract**: C-VISUAL-001

- [ ] **FR-029**: Card aspect ratio MUST be 2:3 (height = 1.5 × width) per contract
  - **Validation**: Measure card dimensions, verify aspect ratio
  - **Test**: `tests/integration/handDisplay.test.tsx` - aspect ratio
  - **Contract**: C-VISUAL-001

- [ ] **FR-030**: Sequence number badge MUST match contract position (top-right), size (min 36px), and styling specifications
  - **Validation**: Inspect badge CSS, verify position and size
  - **Test**: `tests/unit/HandView.test.tsx` - badge styling
  - **Contract**: C-VISUAL-001

- [ ] **FR-031**: Ten-card hands MUST fit without horizontal scroll on 1024px+ viewports (SC-001)
  - **Validation**: Render 10 cards at 1024px viewport, verify no scroll
  - **Test**: `tests/integration/handDisplay.test.tsx` - 10-card test
  - **Contract**: C-VISUAL-001

### Locked Card Styling (FR-032 to FR-035)

- [ ] **FR-032**: Locked cards MUST have CSS `opacity: 0.7` applied
  - **Validation**: Inspect computed styles when locked, verify opacity
  - **Test**: `tests/unit/HandView.test.tsx` - style assertions
  - **Contract**: C-LOCKED-003

- [ ] **FR-033**: Locked cards MAY have `filter: grayscale(20%)` applied (optional enhancement)
  - **Validation**: Inspect computed styles, verify filter if implemented
  - **Test**: Optional - manual inspection
  - **Contract**: C-LOCKED-003

- [ ] **FR-034**: Locked cards MUST show `cursor: not-allowed` or `cursor: default` (not `pointer`)
  - **Validation**: Inspect computed styles when locked, verify cursor
  - **Test**: `tests/unit/HandView.test.tsx` - style assertions
  - **Contract**: C-LOCKED-003

- [ ] **FR-035**: Locked card sequence badges MUST use different color than planning phase (e.g., green vs blue)
  - **Validation**: Compare badge colors in planning vs locked state
  - **Test**: `tests/unit/HandView.test.tsx` - badge color
  - **Contract**: C-LOCKED-003

### Disabled State for Max Selection (FR-036 to FR-039)

- [ ] **FR-036**: Unselected cards MUST show disabled styling when `selectedCardIds.size === discardPhase.remainingDiscards`
  - **Validation**: Select max cards, verify unselected cards show disabled style
  - **Test**: `tests/unit/HandView.test.tsx` - disabled class
  - **Contract**: Not explicitly contracted (FR feature)

- [ ] **FR-037**: Disabled cards MUST not respond to click or keyboard interactions
  - **Validation**: Click disabled card, verify no state change
  - **Test**: `tests/integration/discardFlow.test.tsx` - disabled interaction
  - **Contract**: Not explicitly contracted (FR feature)

- [ ] **FR-038**: Disabled cards MUST have `tabIndex={-1}` or `aria-disabled="true"`
  - **Validation**: Inspect disabled card attributes
  - **Test**: `tests/unit/HandView.test.tsx` - tabIndex/aria
  - **Contract**: Not explicitly contracted (FR feature)

- [ ] **FR-039**: Disabled state MUST be removed immediately when selection count drops below maximum
  - **Validation**: Deselect card, verify disabled state clears instantly
  - **Test**: `tests/integration/discardFlow.test.tsx` - state clearing
  - **Contract**: Not explicitly contracted (FR feature)

---

## Low Priority (P4) - 4 Requirements

### Progress Indicator Format (FR-040 to FR-042)

- [ ] **FR-040**: Discard helper text MUST match contract format specification
  - **Validation**: Render discard phase, verify text format
  - **Test**: `tests/unit/HandView.test.tsx` - text content
  - **Contract**: Minor - semantic equivalence acceptable

- [ ] **FR-041**: Play order helper text MUST match contract format specification
  - **Validation**: Render planning phase, verify text format
  - **Test**: `tests/unit/HandView.test.tsx` - text content
  - **Contract**: Minor - semantic equivalence acceptable

- [ ] **FR-042**: Helper text MUST use checkmark (✓) prefix when requirements are met
  - **Validation**: Meet discard/planning requirements, verify checkmark appears
  - **Test**: `tests/unit/HandView.test.tsx` - text content
  - **Contract**: Minor - visual enhancement

---

## Validation Summary

**Total Requirements**: 42

- **Critical (P1)**: 14 requirements
- **High (P2)**: 5 requirements
- **Medium (P2-P3)**: 19 requirements
- **Low (P4)**: 4 requirements

**Completion Criteria**:
- [ ] All 42 checkboxes marked complete
- [ ] All referenced tests passing (0 failures)
- [ ] All contracts validated (C-PERSIST-001 through C-INVARIANT-001)
- [ ] Manual accessibility audit completed with WCAG AA compliance
- [ ] Cross-browser validation completed (Chrome, Firefox, Safari, Edge)
- [ ] All 17 success criteria met (SC-001 through SC-017 from spec.md)

---

## Testing Validation

### Automated Tests

- [ ] Unit tests pass: `npm test tests/unit/`
- [ ] Integration tests pass: `npm test tests/integration/`
- [ ] Contract tests pass: `npm test tests/contract/`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

### Manual Tests

- [ ] Screen reader navigation (NVDA or JAWS)
- [ ] Keyboard-only navigation (Tab, Space, Enter)
- [ ] Touch interactions (mobile/tablet)
- [ ] Private browsing mode (localStorage fallback)
- [ ] localStorage quota exceeded (fill storage manually)
- [ ] Cross-browser validation (4 browsers)
- [ ] Visual regression (card dimensions, overlap)

---

**Status**: Requirements checklist ready for implementation tracking  
**Updated**: Mark checkboxes as requirements are completed and verified  
**Final Validation**: All checkboxes must be marked before merging to main branch
