# Implementation Plan: Card Discard Mechanic

**Branch**: `003-card-discard-mechanic` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-card-discard-mechanic/spec.md`

## Summary

Implement client-side card selection and discard mechanic that enforces discard count requirements during the turn cycle. Users select cards from their hand using mouse/keyboard (Tab, Space/Enter), see visual feedback and selection progress, and confirm discard via button. Selected cards are moved to discard pile on confirmation, blocking turn end until requirement is met.

**Technical Approach**:
- **State Extension**: Add `selectedCards: Set<string>`, `discardPhase: boolean` to DeckState
- **Card Identity**: Generate unique instance IDs when dealing cards (UUIDs or timestamp-based)
- **Selection Logic**: Toggle selection in state, prevent exceeding discard count
- **Phase Control**: Activate discard phase after deal, disable "End Turn" until complete
- **UI Feedback**: Multiple indicators (status text, visual selection, disabled states)
- **Accessibility**: Keyboard navigation via `tabIndex`, `onKeyDown` handlers

## Technical Context

**Language/Version**: TypeScript (ES2022 target)  
**Primary Dependencies**: React 18.2, Vite 5.0, Pico CSS 1.5  
**Storage**: N/A (client-side state only, persists via existing state management)  
**Testing**: Jest + React Testing Library  
**Target Platform**: Modern web browsers (Chrome 79+, Safari 13.1+, Firefox 75+)  
**Project Type**: Single-page web application (static site)  
**Performance Goals**: 
- Selection state update <100ms (SC-004)
- Complete discard phase <10s average for 5-10 cards (SC-001)
- Visual feedback transition <200ms (CSS)

**Constraints**: 
- Static-only (no server/database changes)
- Must preserve game state across refresh (hand/discard count preserved, selections cleared)
- Zero accidental discards (explicit confirmation required)
- Keyboard navigation required (Tab/Space/Enter)

**Scale/Scope**: 
- Modify 3 existing files (deckReducer.ts, HandView.tsx, DeckControls.tsx)
- Update 1 existing file (types.ts, HandView.css)
- Add ~8 new unit tests, 3 integration tests
- ~200 lines of new code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

✅ **I. Static Asset Simplicity**  
- Pure client-side React state management extension
- No server-side runtime, databases, or new external dependencies
- Uses existing Vite bundler (no new tools)
- Card instance IDs generated client-side (no external ID service)

✅ **II. Deterministic Build & Reproducible Output**  
- No new dependencies or build steps
- State logic changes bundled with existing `npm run build`
- Selection state is transient (cleared on refresh per A1)
- No network calls or external state

✅ **III. Content Integrity & Accessibility Baseline**  
- Maintains semantic HTML structure from Feature 002
- Adds keyboard navigation (Tab, Space, Enter) per A3
- Preserves ARIA labels from HandView
- Status text provides clear phase indicators per A4
- Color contrast maintained (existing Pico CSS variables)
- No content truncation (cards expand to show selection state)

**Result**: All principles compliant. Proceed to Phase 0 research.

---

### Re-check (After Phase 1 Design)

✅ **I. Static Asset Simplicity**  
- Confirmed: State changes in deckReducer.ts + UI in HandView/DeckControls
- No server-side changes
- UUID generation via `crypto.randomUUID()` (built-in browser API, no library)

✅ **II. Deterministic Build & Reproducible Output**  
- Confirmed: No new dependencies added
- Build remains `npm run build` (Vite bundles all changes)
- State persistence via existing localStorage pattern (hand/discard count only)
- Selections cleared on refresh (deterministic behavior per A1)

✅ **III. Content Integrity & Accessibility Baseline**  
- Confirmed: Semantic HTML maintained (cards remain `<article>` elements)
- Enhanced: `tabIndex={0}` + `onKeyDown` handlers for keyboard selection
- Status text: `<div role="status">` for selection progress indicator
- Visual selection: CSS class toggle (`.selected`) with border/opacity changes
- Disabled states: Button disabled + visual feedback when requirements not met

**Result**: All principles compliant. Proceed to Phase 2 (tasks).

## Project Structure

### Documentation (this feature)

```text
specs/003-card-discard-mechanic/
├── plan.md                              # This file (/speckit.plan output)
├── spec.md                              # Feature specification (completed)
├── research.md                          # Phase 0: Selection patterns, keyboard nav
├── data-model.md                        # Phase 1: Discard Phase State, Card Instance
├── quickstart.md                        # Phase 1: Developer implementation guide
├── contracts/
│   ├── discard-phase.contract.md       # Discard phase behavior contract
│   └── card-selection.contract.md      # Selection tracking contract
└── checklists/
    └── requirements.md                 # Quality validation checklist (from spec)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── HandView.tsx                    # MODIFY: Add selection handlers, keyboard nav
│   ├── HandView.css                    # MODIFY: Add .selected styles, phase indicators
│   ├── DeckControls.tsx                # MODIFY: Add "Discard" button, disable "End Turn"
│   └── [other components]              # EXISTING: No changes
├── hooks/
│   └── useDeckState.ts                 # MODIFY: Add selection action dispatchers
├── lib/
│   ├── types.ts                        # MODIFY: Extend DeckState, add actions
│   ├── cardInstance.ts                 # CREATE: UUID generation for card instances
│   └── [other libs]                    # EXISTING: No changes
├── state/
│   └── deckReducer.ts                  # MODIFY: Add selection/discard logic
└── App.tsx                             # EXISTING: No changes needed

tests/
├── unit/
│   ├── deckReducer.test.ts             # MODIFY: Add 5 tests (selection, discard phase)
│   ├── HandView.test.tsx               # MODIFY: Add 3 tests (keyboard, visual selection)
│   └── cardInstance.test.ts            # CREATE: Test UUID generation
├── integration/
│   ├── discardFlow.test.tsx            # CREATE: Complete discard phase flow
│   ├── keyboardSelection.test.tsx      # CREATE: Keyboard navigation full flow
│   └── edgeCases.test.tsx              # CREATE: 0/equals/exceeds hand size cases
└── contract/
    └── discardContracts.test.ts        # CREATE: Contract verification tests
```

**Structure Decision**: Single project structure (Option 1). This is a purely front-end feature extending existing state management and component behavior. All changes within `src/` and `tests/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations. All principles compliant.

## Visual Design Specifications

### Card Selection Indicators (per research.md findings)

**Selection State Styling** (`.card.selected` class):
- **Border**: 3px solid primary color (`var(--primary, #0066cc)`)
- **Opacity**: 0.85 (indicates "used" state)
- **Transform**: `translateY(-4px)` (subtle upward lift, differentiate from hover)
- **Z-index**: 5 (ensure visibility)
- **Box Shadow**: `0 4px 8px rgba(0, 0, 0, 0.15)` (maintain depth)
- **Background**: Optional subtle color shift `var(--card-selected-background, rgba(0, 102, 204, 0.05))`

**Transitions** (smooth feedback):
- Properties: `border, opacity, transform, box-shadow, background`
- Duration: 200ms
- Easing: `ease`

**Accessibility Compliance**:
- Color contrast: WCAG AA Level (3:1 minimum for UI components)
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables transitions
- Multiple indicators: Border + opacity + transform (don't rely on color alone)
- Screen reader support: `aria-pressed="true"` on selected cards

**Focus Management**:
- Non-selected focus: `outline: 3px solid var(--primary-focus, #0066cc)`, `outline-offset: 4px`
- Selected focus: `outline-style: double` (distinct from non-selected)
- `:focus-visible` support: Hide outline on mouse click, show on keyboard navigation
- WCAG 2.4.7 Level AA compliance: Visible focus indicator, sufficient contrast (3:1)

## Data Model Changes

### Extended Types (src/lib/types.ts)

```typescript
export interface CardInstance {
  id: string          // Unique instance ID (UUID)
  value: string       // Card name/value (original string from deck)
}

export interface DeckState {
  // Existing fields
  drawPile: string[]
  discardPile: string[]
  hand: string[]                    // DEPRECATED in favor of handCards
  handCards: CardInstance[]         // NEW: Replaces hand with instance IDs
  turnNumber: number
  handSize: number
  discardCount: number
  warning: string | null
  error: string | null
  isDealing: boolean
  
  // New fields for discard mechanic
  selectedCardIds: Set<string>      // NEW: IDs of cards selected for discard
  discardPhase: boolean             // NEW: True when user must select cards
}

export type DeckAction =
  | { type: 'INIT' }
  | { type: 'DEAL_NEXT_HAND' }
  | { type: 'END_TURN' }
  | { type: 'APPLY_JSON_OVERRIDE'; payload: string }
  | { type: 'CHANGE_PARAMETERS'; payload: { handSize: number; discardCount: number; immediateReset: boolean } }
  | { type: 'TOGGLE_CARD_SELECTION'; payload: string }  // NEW: Toggle card by ID
  | { type: 'CONFIRM_DISCARD' }                         // NEW: Move selected to discard pile
```

### Key Entities

- **Card Instance**: Represents a single card dealt into hand with unique ID + value
- **Discard Phase State**: Boolean flag indicating user must select cards before ending turn
- **Card Selection**: Set of card instance IDs marked for discard (cleared on refresh per A1)

## Implementation Phases

### Phase 0: Research *(1-2 hours)*

**Goal**: Investigate selection patterns, keyboard navigation, and state persistence strategies.

**Research Questions**:
1. How to generate unique IDs for card instances (crypto.randomUUID browser support, fallback?)
2. What React keyboard event patterns work best for Tab + Space/Enter navigation?
3. How do existing features persist state (localStorage)? Can we extend for hand cards?
4. What CSS patterns provide clear selection feedback (border, opacity, checkmark icon?)
5. How to manage focus states for keyboard users (focus rings, aria-pressed)?

**Output**: `research.md` with findings + recommendations

---

### Phase 1: Design *(2-3 hours)*

**Goal**: Define contracts, data model, and quickstart guide.

**Deliverables**:
1. **data-model.md**: CardInstance type, DeckState extensions, selection state diagram
2. **contracts/discard-phase.contract.md**: Phase activation/completion rules, edge cases
3. **contracts/card-selection.contract.md**: Selection toggle logic, max limit enforcement
4. **quickstart.md**: Step-by-step developer guide for implementing selection + discard

**Key Decisions**:
- Card ID format (UUID vs timestamp-based)
- Selection state structure (Set vs Array)
- Phase transition triggers (when to enter/exit discard phase)
- Keyboard event handling approach (component-level vs global listener)

---

### Phase 2: Tasks *(via /speckit.tasks)*

**Goal**: Break down implementation into atomic, testable tasks.

**Task Categories** (to be generated):
1. **State Management** (deckReducer.ts, types.ts)
   - Add CardInstance type
   - Extend DeckState with selection fields
   - Implement TOGGLE_CARD_SELECTION action
   - Implement CONFIRM_DISCARD action
   - Update DEAL_NEXT_HAND to generate card instances
   - Update END_TURN to enforce discard phase completion

2. **Card Instance Generation** (lib/cardInstance.ts)
   - Create generateCardInstance() utility
   - Add UUID generation with fallback
   - Add tests for uniqueness

3. **UI Components** (HandView.tsx, DeckControls.tsx, HandView.css)
   - Add card click handlers to HandView
   - Add keyboard event handlers (Tab, Space, Enter)
   - Add .selected CSS class with visual feedback
   - Add selection progress indicator (e.g., "2 of 3 selected")
   - Add "Discard" button to DeckControls
   - Disable "End Turn" button during discard phase
   - Add phase status text

4. **Testing**
   - Unit tests for selection toggle logic
   - Unit tests for discard confirmation
   - Integration test: Complete discard flow
   - Integration test: Keyboard navigation
   - Edge case tests (0 count, equals hand size, exceeds hand size)
   - Contract verification tests

**Output**: `tasks.md` with full task breakdown, dependencies, and test scenarios

---

### Phase 3: Implementation *(4-6 hours)*

**Goal**: Execute tasks, write code, write tests.

**Workflow**:
1. Start with state management (types, reducer actions)
2. Add card instance generation utility
3. Update UI components (HandView, DeckControls)
4. Add CSS styling for selection states
5. Write unit tests (TDD where possible)
6. Write integration tests
7. Run full test suite + lint

**Completion Criteria**:
- All 12 functional requirements (FR-001 to FR-014) implemented
- All 5 success criteria (SC-001 to SC-005) testable
- All edge cases handled
- 100% test pass rate
- 0 lint errors

---

### Phase 4: Validation *(1 hour)*

**Goal**: Verify against specification acceptance scenarios.

**Manual Testing Checklist**:
- [ ] User Story 1, Scenario 1: Select 3, confirm, verify moved to discard pile
- [ ] User Story 1, Scenario 2: Attempt turn end without selection, verify blocked
- [ ] User Story 1, Scenario 3: Verify "X of Y selected" indicator updates
- [ ] User Story 1, Scenario 4: Select max count, attempt 4th selection, verify blocked
- [ ] User Story 2, Scenario 1: Select, then deselect card, verify count decreases
- [ ] User Story 2, Scenario 2: Reach max count, attempt selection, verify prevented
- [ ] User Story 2, Scenario 3: Verify visual distinction for selected cards
- [ ] User Story 3, Scenario 1: Confirm discard, verify cards removed from hand
- [ ] User Story 3, Scenario 2: Select required count, verify button enabled
- [ ] User Story 3, Scenario 3: Under-select, verify button disabled
- [ ] Edge Case: Discard count = 0, verify phase skipped
- [ ] Edge Case: Discard count = hand size, verify all cards discarded
- [ ] Edge Case: Discard count > hand size, verify capped at hand size
- [ ] Edge Case: Refresh during discard phase, verify selections cleared
- [ ] Keyboard Navigation: Tab to cards, Space to select, Enter to confirm

**Automated Validation**:
- Run full test suite (`npm test`)
- Run lint (`npm run lint`)
- Build check (`npm run build`)

**Output**: All checkboxes complete, tests passing, feature ready for merge

## Test Strategy

### Unit Tests (8 new tests)

**deckReducer.test.ts** (5 tests):
1. TOGGLE_CARD_SELECTION adds card ID to selectedCardIds
2. TOGGLE_CARD_SELECTION removes card ID if already selected (deselect)
3. TOGGLE_CARD_SELECTION prevents exceeding discard count
4. CONFIRM_DISCARD moves selected cards to discard pile
5. DEAL_NEXT_HAND enters discard phase when discardCount > 0

**HandView.test.tsx** (3 tests):
1. Clicking card toggles selection state
2. Pressing Space on focused card toggles selection
3. Selected cards display .selected CSS class

**cardInstance.test.ts** (3 tests):
1. generateCardInstance creates unique IDs
2. generateCardInstance preserves card value
3. Calling multiple times produces different IDs

### Integration Tests (3 new tests)

**discardFlow.test.tsx**:
- Full flow: Deal hand → Select required cards → Confirm discard → Verify discard pile + hand state

**keyboardSelection.test.tsx**:
- Tab through cards → Space to select → Enter to confirm → Verify selection state

**edgeCases.test.tsx**:
- Discard count = 0 (phase skipped)
- Discard count = hand size (all cards discarded)
- Discard count > hand size (capped at hand size)

### Contract Tests (1 new file)

**discardContracts.test.ts**:
- Verify FR-001 through FR-014 compliance
- Verify edge case behaviors match spec
- Verify state persistence rules (A1)

## Success Metrics Verification

**How to verify each success criterion**:

- **SC-001** (10s average completion): Manual user testing with timer (not automated)
- **SC-002** (100% turn block enforcement): Integration test verifies "End Turn" disabled until requirement met
- **SC-003** (95% first-time success): Manual user testing (not automated in MVP)
- **SC-004** (100ms visual update): Unit test with `act()` + immediate state assertion
- **SC-005** (Zero accidental discards): Integration test verifies cards only move on CONFIRM_DISCARD action

## Dependencies & Migration

**Dependencies**: None (feature builds on existing Features 001 & 002)

**Migration Path**:
1. **Backward compatibility**: Must support existing deck state from Features 001/002
2. **Data migration**: Convert `hand: string[]` to `handCards: CardInstance[]` on first load
3. **localStorage update**: Extend persistence to include handCards (value + ID)
4. **Deprecated field**: Keep `hand` field temporarily, mark as deprecated, remove in future feature

**Migration Strategy**:
- Add `handCards` field to DeckState (initially empty)
- Update DEAL_NEXT_HAND to populate `handCards` with instances
- Keep `hand` field synced (map handCards to values) for 1 release cycle
- Update all components to read `handCards` instead of `hand`
- Remove `hand` field in Feature 004 (breaking change, versioned)

## Risk Assessment

**Technical Risks**:

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| UUID browser support gaps | Low | Medium | Use crypto.randomUUID with fallback to timestamp + random |
| Keyboard focus management conflicts | Medium | Medium | Test extensively, use React synthetic events |
| Performance degradation with large hands | Low | Low | Selection uses Set (O(1) lookup), max hand size = 10 |
| State sync issues (hand vs handCards) | Medium | High | Thorough integration tests, migration plan |

**UX Risks**:

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by discard phase | Medium | High | Multiple indicators per A4 (text + states + disabled actions) |
| Accidental deselection | Medium | Medium | Clear visual feedback, confirmation required |
| Keyboard users miss navigation | Low | Medium | Visible focus rings, Tab order follows visual layout |

## Next Steps

1. **Run `/speckit.tasks`** to generate detailed task breakdown
2. **Create research.md** (Phase 0) - Investigate UUID generation, keyboard patterns
3. **Create data-model.md** (Phase 1) - Define CardInstance, state diagrams
4. **Create contracts/** (Phase 1) - Discard phase + selection contracts
5. **Begin implementation** (Phase 2) - Start with state management tasks

---

**Plan Status**: ✅ Complete  
**Ready for**: `/speckit.tasks` (Phase 2 task generation)
