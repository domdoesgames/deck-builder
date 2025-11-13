# Implementation Plan: Specification Compliance Remediation

**Branch**: `005-spec-compliance-remediation` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-spec-compliance-remediation/spec.md`

## Summary

Systematically address 13 implementation gaps between documented specifications (features 001-004) and actual codebase to achieve 100% contract compliance. This remediation includes critical fixes (persistence, zero discard, locked immutability), architectural corrections (component responsibility), and polish items (accessibility, visual design).

## Technical Context

**Language/Version**: TypeScript 5.3.3, ES2022 target  
**Primary Dependencies**: React 18.2.0, Vite 5.0.8, @picocss/pico 1.5.0  
**Storage**: localStorage (with silent fallback to in-memory on failure)  
**Testing**: Jest 29.7.0, @testing-library/react 14.1.2  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Single-page web application (static site)  
**Performance Goals**: 
- Persistence save/load <100ms (FR-003, SC-003)
- No user-visible delay during localStorage failures (silent fallback)
- Locked state styling applies within 100ms (SC-008)
- Phase transitions update UI within 100ms (SC-011)

**Constraints**: 
- Must maintain static-only architecture (no server runtime)
- localStorage failures must never block functionality (FR-003)
- Zero discard count must work identically to non-zero counts
- All existing contracts from features 001-004 must remain valid
- 100% backward compatibility with existing state structure

**Scale/Scope**: 
- Fixes span 4 previous features (001: deck mechanics, 002: hand display, 003: discard, 004: play order)
- 42 functional requirements across 4 priority levels (P1-P4)
- Minimal new state (persistence metadata only)
- Primary focus: correcting existing implementations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I - Static Asset Simplicity**: ✅ PASS
- Feature adds localStorage persistence (client-side only, no server runtime)
- Silent fallback to in-memory state maintains static nature
- No build complexity, external services, or network dependencies introduced
- All fixes are client-side TypeScript/React adjustments

**Principle II - Deterministic Build & Reproducible Output**: ✅ PASS
- No changes to build process (`npm test && npm run lint` continues to work)
- No new environment dependencies or configuration
- localStorage is browser API only (deterministic read/write behavior)
- All changes are source code modifications, bundled by existing Vite setup

**Principle III - Content Integrity & Accessibility Baseline**: ⚠️ REQUIRES ATTENTION
- Accessibility fixes required: role="article" instead of role="button" (FR-024, FR-025)
- Phase status indicators must include ARIA live announcements (FR-022)
- Locked card state must be announced to screen readers (FR-013)
- Focus management for disabled/locked cards needs tabIndex={-1} (FR-011)
- **Action items**: Validate WCAG AA compliance after accessibility fixes, test with NVDA/JAWS

## Project Structure

### Documentation (this feature)

```text
specs/005-spec-compliance-remediation/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - fixes vs new research)
├── data-model.md        # Already exists (state extensions documented)
├── quickstart.md        # Already exists (implementation overview)
├── spec.md              # Already exists (requirements complete)
├── contracts/           # Phase 1 output (validation contracts)
│   └── remediation.contract.md
├── checklists/
│   └── requirements.md  # Validation checklist for 42 FRs
└── tasks.md             # Phase 2 output (detailed task breakdown)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── HandView.tsx           # MODIFY: Fix roles, add locked styling, remove buttons
│   ├── HandView.css           # MODIFY: Add locked/disabled card styles
│   ├── DeckControls.tsx       # MODIFY: Add Lock/Clear buttons, phase indicator
│   └── [existing components]
├── hooks/
│   ├── useDeckState.ts        # MODIFY: Add persistence hook integration
│   └── useDeckStatePersistence.ts  # NEW: Auto-save/load hook
├── lib/
│   ├── types.ts               # MODIFY: Add PersistedDeckState, ValidationResult
│   ├── constants.ts           # MODIFY: MIN_DISCARD_COUNT = 0
│   ├── persistenceManager.ts  # NEW: localStorage save/load utilities
│   ├── stateValidator.ts      # NEW: Validation for loaded state
│   └── [existing libs]
├── state/
│   └── deckReducer.ts         # MODIFY: Allow discardCount=0, interaction guards
└── [existing structure]

tests/
├── contract/
│   ├── deckContracts.test.ts        # UPDATE: Add persistence tests
│   ├── discardContracts.test.ts     # UPDATE: Add zero discard tests
│   ├── playOrderContracts.test.ts   # UPDATE: Add locked immutability tests
│   └── [existing contract tests]
├── integration/
│   ├── persistenceFlow.test.tsx     # NEW: Save/load cycle testing
│   ├── zeroDiscardFlow.test.tsx     # NEW: Zero count through turn cycle
│   ├── lockedInteraction.test.tsx   # NEW: Locked card interaction tests
│   └── [existing integration tests]
└── unit/
    ├── persistenceManager.test.ts   # NEW: localStorage utility tests
    ├── stateValidator.test.ts       # NEW: Validation logic tests
    ├── deckReducer.test.ts          # UPDATE: Add zero discard cases
    ├── HandView.test.tsx            # UPDATE: Role assertions, locked styling
    └── [existing unit tests]
```

**Structure Decision**: Single project structure - This feature extends existing state management (DeckState/deckReducer) and corrects UI components (HandView, DeckControls) without requiring new architectural patterns. Persistence layer is added as a new hook and utility modules.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | All changes maintain constitutional principles |

## Phase Breakdown

### Phase 0: Research (Minimal)
**Estimated**: 0.5-1 hour  
**Purpose**: Validate contract gaps, review browser localStorage API edge cases

Since this is a remediation feature addressing documented gaps, research is minimal:
1. Review all contracts from features 001-004 (already identified 13 gaps)
2. Document localStorage quota limits and failure modes (privacy mode, quota exceeded)
3. Verify React 18 useEffect cleanup patterns for persistence
4. Review WCAG AA requirements for disabled/locked states

**Output**: research.md with localStorage failure scenarios and accessibility standards

---

### Phase 1: Design & Contracts
**Estimated**: 1-2 hours  
**Purpose**: Define persistence schema, validation rules, component migration strategy

1. **Persistence Schema** (already in data-model.md):
   - `PersistedDeckState` type definition
   - `ValidationResult` structure
   - Storage key convention (`deck-builder-state`)
   
2. **Validation Rules** (already in data-model.md):
   - `validateAndSanitizeDeckState()` function spec
   - Type guards for loaded state
   - Sanitization logic for corrupted data

3. **Component Contracts** (contracts/remediation.contract.md):
   - DeckControls responsibilities (Lock/Clear buttons, phase indicator)
   - HandView responsibilities (card display only, no control buttons)
   - Phase status indicator contract
   - Locked card interaction contract

**Output**: contracts/remediation.contract.md, checklists/requirements.md

---

### Phase 2: Critical Fixes (P1)
**Estimated**: 3-4 days  
**Priority**: Must complete before other phases  
**Purpose**: Fix blocking issues that violate core contracts

#### 2.1 Persistence Layer (FR-001 to FR-005)
1. Create `src/lib/persistenceManager.ts` with save/load functions
2. Create `src/lib/stateValidator.ts` with validation logic
3. Create `src/hooks/useDeckStatePersistence.ts` hook
4. Integrate persistence hook in `useDeckState.ts`
5. Write unit tests for persistence utilities
6. Write integration tests for full save/load cycle

**Checkpoint**: State persists and loads correctly across page refresh

#### 2.2 Zero Discard Count (FR-006 to FR-009)
1. Update `MIN_DISCARD_COUNT = 0` in `src/lib/constants.ts`
2. Fix validation in `deckReducer.ts` changeParameters action
3. Add 0 to discard count dropdown in `DeckControls.tsx`
4. Update discard phase logic to skip when `discardCount === 0`
5. Write unit tests for zero discard validation
6. Write integration tests for zero discard through turn cycle

**Checkpoint**: Users can set discard count to 0 and discard phase is skipped

#### 2.3 Locked Card Immutability (FR-010 to FR-014)
1. Add interaction guard in `HandView.tsx` handleCardClick
2. Set `tabIndex={-1}` when `playOrderLocked === true`
3. Add locked card CSS styles (opacity, cursor, no hover)
4. Prevent all action dispatches when locked
5. Write unit tests for interaction guards
6. Write integration tests for locked state interactions

**Checkpoint**: Locked cards are completely non-interactive

---

### Phase 3: Component Architecture (P2)
**Estimated**: 1-2 days  
**Purpose**: Migrate buttons to correct component per contracts

#### 3.1 Component Migration (FR-015 to FR-019)
1. Add Lock/Clear button props to `DeckControls` interface
2. Implement buttons in `DeckControls.tsx`
3. Remove buttons from `HandView.tsx`
4. Update `App.tsx` wiring
5. Update component unit tests
6. Write integration tests for button locations

**Checkpoint**: All play order buttons render in DeckControls

#### 3.2 Phase Status Indicator (FR-020 to FR-023)
1. Add phase status badge component
2. Implement phase text computation (Planning/Executing)
3. Add ARIA live region for announcements
4. Style phase indicator per contract
5. Write tests for phase transitions

**Checkpoint**: Phase indicators display and announce correctly

---

### Phase 4: Polish & Compliance (P3-P4)
**Estimated**: 3-4 days  
**Purpose**: Accessibility, visual design, and minor fixes

#### 4.1 Accessibility Fixes (FR-024 to FR-026)
1. Change card role from "button" to "article"
2. Update ARIA labels to contract format
3. Test with screen readers (NVDA/JAWS)
4. Verify keyboard navigation

#### 4.2 Visual Design (FR-027 to FR-031)
1. Adjust card width formula (80-120px range)
2. Implement 50% overlap layout (negative margins)
3. Fix aspect ratio (2:3 height to width)
4. Update sequence badge styling

#### 4.3 Locked Styling (FR-032 to FR-035)
1. Add locked card opacity (0.7)
2. Optional grayscale filter
3. Update locked badge colors
4. Verify cursor changes

#### 4.4 Disabled States (FR-036 to FR-039)
1. Add disabled styling for max selection
2. Implement disabled interaction guards
3. Update ARIA attributes

#### 4.5 Helper Text (FR-040 to FR-042)
1. Update discard helper text format
2. Update play order helper text format
3. Add checkmark prefix when ready

---

### Phase 5: Testing & Validation
**Estimated**: 2-3 days  
**Purpose**: Comprehensive testing and verification

1. Run all existing tests (ensure no regressions)
2. Run all new contract tests
3. Run all new integration tests
4. Visual regression testing (card dimensions, styling)
5. Accessibility audit with automated tools
6. Manual testing with screen readers
7. Cross-browser validation (Chrome, Firefox, Safari, Edge)
8. Performance testing (persistence speed, render times)
9. Validate all 17 success criteria from spec.md
10. Complete requirements checklist (42 FRs)

**Checkpoint**: All tests pass, all success criteria met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Research)**: No dependencies - can start immediately
- **Phase 1 (Design)**: Depends on Research completion
- **Phase 2 (Critical)**: Depends on Design completion - BLOCKS later phases
- **Phase 3 (Architecture)**: Depends on Critical completion (uses persistence)
- **Phase 4 (Polish)**: Depends on Architecture completion (uses migrated components)
- **Phase 5 (Testing)**: Depends on all implementation phases

### Within Phase 2 (Critical Fixes)

- **Persistence (2.1)**: No dependencies - can start first
- **Zero Discard (2.2)**: Independent - can run parallel to persistence
- **Locked Immutability (2.3)**: Independent - can run parallel to others

**Parallel Opportunities**: All three critical fixes can be developed simultaneously by different developers or in parallel branches.

### Within Phase 4 (Polish)

- **Accessibility (4.1)**: No dependencies
- **Visual Design (4.2)**: Independent
- **Locked Styling (4.3)**: Depends on 2.3 (locked state exists)
- **Disabled States (4.4)**: Independent
- **Helper Text (4.5)**: Independent

**Parallel Opportunities**: Sections 4.1, 4.2, 4.4, 4.5 can run in parallel.

---

## Implementation Strategy

### MVP Approach (Critical Fixes Only)

1. Complete Phase 0: Research (0.5-1 hour)
2. Complete Phase 1: Design (1-2 hours)
3. Complete Phase 2.1: Persistence (1-1.5 days)
4. **VALIDATE**: Test persistence across refresh
5. Complete Phase 2.2: Zero Discard (0.5-1 day)
6. **VALIDATE**: Test zero discard flow
7. Complete Phase 2.3: Locked Immutability (0.5-1 day)
8. **VALIDATE**: Test locked interactions
9. Deploy/demo if ready (critical gaps resolved)

**Total MVP Time**: 3-4 days

### Full Feature Delivery

1. Complete MVP (Phases 0-2) → Critical fixes done
2. Add Phase 3: Architecture (1-2 days) → Component structure correct
3. Add Phase 4: Polish (3-4 days) → Full contract compliance
4. Add Phase 5: Testing (2-3 days) → Production-ready quality

**Total Full Delivery**: 9-13 days (2-3 weeks)

### Single Developer Strategy

Work sequentially through phases with checkpoints:
1. Research + Design (2-3 hours)
2. Persistence layer (1-1.5 days)
3. Zero discard fix (0.5-1 day)
4. Locked immutability (0.5-1 day)
5. **CHECKPOINT**: Test critical fixes
6. Component migration (1-2 days)
7. **CHECKPOINT**: Test architecture
8. Polish items (3-4 days)
9. Comprehensive testing (2-3 days)

**Stop at any checkpoint to validate independently**

---

## Risk Assessment

### High Risk Items

1. **localStorage Failures**: Mitigation = silent fallback, extensive error scenario testing
2. **Component Migration Breaking Tests**: Mitigation = update tests atomically with migration
3. **Persistence Performance**: Mitigation = debounce saves, measure load times
4. **Backward Compatibility**: Mitigation = migration function for old state format

### Medium Risk Items

1. **Visual Design Changes**: Mitigation = visual regression tests, gradual rollout
2. **Accessibility Regressions**: Mitigation = automated a11y tests + manual screen reader testing
3. **Zero Discard Edge Cases**: Mitigation = comprehensive integration tests

### Low Risk Items

1. Helper text format changes (cosmetic only)
2. Phase indicator styling (additive feature)

---

## Success Metrics

### Definition of Done

- [ ] All 42 functional requirements implemented and verified
- [ ] All 17 success criteria met with measured validation
- [ ] 100% test coverage for new persistence logic
- [ ] All existing tests updated and passing (0 regressions)
- [ ] Visual regression tests pass for card styling changes
- [ ] Accessibility audit confirms WCAG AA compliance
- [ ] Cross-browser validation complete (Chrome, Firefox, Safari, Edge)
- [ ] Performance benchmarks met (persistence <100ms, no visible delays)
- [ ] Documentation updated (AGENTS.md if needed)
- [ ] Code review completed with sign-off

### Validation Checklist (from spec.md)

All 10 user stories must pass acceptance scenarios:
- US1: Persistent play order state (4 scenarios)
- US2: Zero discard count behavior (4 scenarios)
- US3: Locked cards immutability (5 scenarios)
- US4: Component responsibility alignment (4 scenarios)
- US5: Phase status indicators (5 scenarios)
- US6: Accessibility role corrections (4 scenarios)
- US7: Visual design compliance (5 scenarios)
- US8: Locked card styling (5 scenarios)
- US9: Disabled state for max selection (4 scenarios)
- US10: Progress indicator format consistency (4 scenarios)

**Total**: 44 acceptance scenarios to validate

---

## Notes

- This is a remediation feature - most "implementation" is correcting existing code
- Extensive testing required due to cross-cutting changes (affects 4 features)
- Persistence is the most complex new addition (new code vs fixes)
- Component migration requires careful test updates to avoid false regressions
- All changes must maintain 100% backward compatibility with existing state
- Zero tolerance for breaking existing functionality (all tests must pass)
- Reference quickstart.md for implementation patterns and code examples
- Reference data-model.md for type definitions and validation logic
- Contract tests must validate all 19 state invariants (6 from feature 004 + new persistence invariants)

---

**Next Step**: Create tasks.md with detailed task breakdown and dependencies
