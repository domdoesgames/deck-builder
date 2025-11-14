# Tasks: Collapsible Settings Panel

**Feature**: 008-settings-panel  
**Input**: Design documents from `/specs/008-settings-panel/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Estimated Time**: 2-3 hours

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/` at repository root
- Tests: `tests/` at repository root

---

## Phase 1: Core Hook Implementation (45 minutes)

**Purpose**: Create settings visibility state management hook

### Hook Implementation

- [X] T001 [P] [US1,US2] Add `SettingsVisibilityState` type to `src/lib/types.ts`:
  - Add `interface SettingsVisibilityState { isExpanded: boolean; }`
  - Add to exports
  - **Contracts**: useSettingsVisibility.contract.md - Storage Format

- [X] T002 [US1,US2,US3] Create `useSettingsVisibility` hook in `src/hooks/useSettingsVisibility.ts`:
  - Implement storage key constant: `STORAGE_KEY = 'deck-builder:settings-expanded'`
  - Implement `loadInitialState()`: reads from localStorage, validates with type guard, defaults to `false`
  - Implement `saveState(expanded: boolean)`: writes to localStorage with try-catch
  - Implement `isValidSettingsState()` type guard
  - Implement hook with `useState` (lazy initialization), `toggleExpanded()`, `setExpanded()`
  - **Contracts**: useSettingsVisibility.contract.md - full interface
  - **Requirements**: FR-007 (persistence), FR-001 (default hidden)

**Checkpoint**: Hook can be tested via direct import

---

## Phase 2: Settings Panel Component (1 hour)

**Purpose**: Create collapsible wrapper component for settings

### Component Implementation

- [X] T003 [P] [US1,US2,US4] Create `SettingsPanel` component in `src/components/SettingsPanel.tsx`:
  - Define `SettingsPanelProps` interface: `{ error: string | null; children: React.ReactNode; }`
  - Use `useSettingsVisibility()` hook for state
  - Implement error auto-expansion logic with `useRef` for error tracking
  - Render toggle button with proper ARIA attributes (`aria-expanded`, `aria-controls`)
  - Render collapsible content container with `id="settings-content"` and `role="region"`
  - **Contracts**: settings-panel.contract.md - full component behavior
  - **Requirements**: FR-002, FR-003, FR-004, FR-006, FR-008, FR-009, FR-010, FR-012

- [X] T004 [P] [US1,US2] Add CSS styles to `src/components/HandView.css` or create `src/components/SettingsPanel.css`:
  - Style `.settings-toggle` button (full-width, proper spacing, hover state, focus-visible outline)
  - Style `.toggle-icon` with transition
  - Style `.settings-content` with CSS Grid animation (grid-template-rows: 0fr → 1fr)
  - Add `.settings-content.expanded` state
  - Add `@media (prefers-reduced-motion: reduce)` for accessibility
  - **Contracts**: settings-panel.contract.md - Visual Contract section
  - **Requirements**: FR-012 (expand/collapse in place)

### App Integration

- [X] T005 [US1,US4] Update `src/App.tsx` to use `SettingsPanel`:
  - Import `SettingsPanel` component
  - Extract `state.error` from `useDeckState()`
  - Wrap `<DeckControls />` and `<JsonOverride />` components in `<SettingsPanel error={state.error}>...</SettingsPanel>`
  - Remove any direct rendering of settings components outside the panel
  - **Requirements**: FR-001, FR-005, FR-008

**Checkpoint**: Settings panel renders, can toggle visibility manually

---

## Phase 3: Unit Testing (45 minutes)

**Purpose**: Verify hook and component behavior in isolation

### Hook Tests

- [X] T006 [P] [US2,US3] Create `tests/unit/useSettingsVisibility.test.ts`:
  - Test: "Returns false by default when no saved state"
  - Test: "Loads saved expanded state from localStorage"
  - Test: "Loads saved collapsed state from localStorage"
  - Test: "toggleExpanded flips state from false to true"
  - Test: "toggleExpanded flips state from true to false"
  - Test: "setExpanded sets state directly to true"
  - Test: "setExpanded sets state directly to false"
  - Test: "Saves state to localStorage on toggleExpanded"
  - Test: "Saves state to localStorage on setExpanded"
  - Test: "Handles localStorage unavailable gracefully"
  - Test: "Handles corrupted localStorage data"
  - Test: "Handles wrong data type in localStorage"
  - Test: "Handles quota exceeded gracefully"
  - Test: "Handles rapid state updates"
  - **Contracts**: useSettingsVisibility.contract.md - Testing Contract

### Component Tests

- [X] T007 [P] [US1,US2,US3,US4] Create `tests/unit/SettingsPanel.test.tsx`:
  - Test: "Renders collapsed by default (no saved state)"
  - Test: "Renders with toggle button labeled 'Settings'"
  - Test: "Toggle button has aria-expanded='false' when collapsed"
  - Test: "Settings content is hidden when collapsed"
  - Test: "Expands when toggle button clicked"
  - Test: "Toggle button has aria-expanded='true' when expanded"
  - Test: "Settings content is visible when expanded"
  - Test: "Collapses when toggle button clicked again"
  - Test: "Auto-expands when error occurs while collapsed"
  - Test: "Does not auto-expand when error occurs while already expanded"
  - Test: "Remains expanded after auto-expansion even when error clears"
  - Test: "Loads saved expansion state on mount (expanded)"
  - Test: "Loads saved expansion state on mount (collapsed)"
  - Test: "Maintains ARIA attributes (aria-controls, role=region)"
  - Test: "Works when localStorage unavailable"
  - Test: "Rapid toggle clicks produce consistent state"
  - Test: "Children components render inside panel"
  - **Contracts**: settings-panel.contract.md - Testing Contract

**Checkpoint**: All unit tests passing

---

## Phase 4: Integration Testing (30 minutes)

**Purpose**: Verify settings panel integrates with existing features

### Integration Tests

- [X] T008 [P] [US1,US2,US3] Create `tests/integration/settingsVisibility.test.tsx`:
  - Test: "Settings hidden by default on page load" (render full App, verify settings not visible)
  - Test: "Toggle expands and collapses settings in full app" (render App, click toggle, verify)
  - Test: "Settings values persist when panel toggled" (change hand size, collapse, expand, verify value unchanged)
  - Test: "State persists across component remount" (expand, unmount, remount, verify expanded)
  - Test: "Error triggers auto-expansion in full app" (render App, enter invalid JSON while collapsed, verify expansion)
  - Test: "Error message visible after auto-expansion" (trigger error, verify error displayed)
  - Test: "Settings remain functional while hidden" (collapse panel, verify game still playable)
  - **Contracts**: settings-panel.contract.md - Integration Tests section
  - **Requirements**: FR-005, FR-007, FR-008

**Checkpoint**: All integration tests passing

---

## Phase 5: Manual Verification (20 minutes)

**Purpose**: Manually verify all requirements and success criteria

### Functional Requirements Verification

- [ ] T009 [US1] **FR-001 Verification**: Load page, verify all settings controls hidden by default
- [ ] T010 [US1] **FR-002 Verification**: Verify toggle control labeled "Settings" at top of settings area
- [ ] T011 [US1] **FR-003 Verification**: Click toggle once, verify settings expand
- [ ] T012 [US1] **FR-004 Verification**: Click toggle again, verify settings collapse
- [ ] T013 [US1] **FR-005 Verification**: Change hand size, toggle panel, verify value preserved
- [ ] T014 [US1] **FR-006 Verification**: Verify toggle shows clear visual state (icon changes, aria-expanded)
- [ ] T015 [US2] **FR-007 Verification**: Expand settings, reload page, verify settings remain expanded
- [ ] T016 [US4] **FR-008 Verification**: Collapse settings, enter invalid JSON, verify auto-expansion
- [ ] T017 [US1] **FR-009 Verification**: Verify toggle control always visible (when settings collapsed and expanded)
- [ ] T018 [US1] **FR-010 Verification**: Tab to toggle, press Enter/Space, verify keyboard accessible
- [ ] T019 [US4] **FR-011 Verification**: Auto-expand due to error, clear error, verify settings stay expanded
- [ ] T020 [US1] **FR-012 Verification**: Toggle settings, verify expansion/collapse happens in place (no layout shift)

### Success Criteria Verification

- [ ] T021 [US1] **SC-001 Verification**: Measure visible elements when collapsed vs full UI, verify 50%+ reduction
- [ ] T022 [US1] **SC-002 Verification**: Count clicks needed to toggle (must be 1)
- [ ] T023 [US2] **SC-003 Verification**: Expand settings, reload 5 times, verify state persists 100%
- [ ] T024 [US1] **SC-004 Verification**: Change all settings, toggle visibility multiple times, verify no data loss
- [ ] T025 [US1] **SC-005 Verification**: Ask colleague to identify toggle state without instruction
- [ ] T026 [US4] **SC-006 Verification**: Open DevTools Performance, trigger error expansion, verify <100ms response

**Checkpoint**: All requirements and success criteria manually verified

---

## Phase 6: Accessibility & Polish (20 minutes)

**Purpose**: Ensure accessibility compliance and UX polish

### Accessibility Testing

- [ ] T027 [P] [US1] Keyboard navigation test:
  - Tab through page to toggle button
  - Press Enter to expand
  - Tab into settings controls
  - Press Escape (verify no action - settings don't auto-collapse)
  - Tab back to toggle, press Space to collapse
  - **Requirement**: FR-010

- [ ] T028 [P] [US1] Screen reader test (or use browser accessibility tools):
  - Focus toggle button, verify announcement: "Settings, button, collapsed/expanded"
  - Expand settings, verify content region announced
  - Verify icon has `aria-hidden="true"` (not announced)

- [ ] T029 [P] [US1] Visual accessibility test:
  - Verify focus outline visible on toggle button (FR-010)
  - Verify sufficient color contrast for toggle button text
  - Verify hover state clearly indicates interactivity
  - Verify reduced motion preference respected (test with `prefers-reduced-motion: reduce`)

### UX Polish

- [ ] T030 [US1] Animation smoothness test:
  - Toggle settings multiple times at different speeds
  - Verify expansion animation smooth (<300ms)
  - Verify no visual glitches or content jumps
  - Verify animation works across different content sizes

- [ ] T031 [US4] Error expansion UX test:
  - Trigger multiple different errors while collapsed
  - Verify auto-expansion smooth
  - Verify error message immediately visible after expansion
  - Clear error, verify settings stay expanded (doesn't auto-collapse)

**Checkpoint**: Accessibility and UX validated

---

## Phase 7: Quality Gates & Final Validation (15 minutes)

**Purpose**: Final checks before feature completion

### Code Quality

- [X] T032 [P] Run linter: `npm run lint` - Verify 0 errors
- [X] T033 [P] Run full test suite: `npm test` - Verify all existing tests still pass + new tests pass
- [X] T034 [P] Run production build: `npm run build` - Verify build succeeds
- [X] T035 [P] Check bundle size: Verify feature adds minimal size (estimate ~3KB for component + hook + CSS)

### Final Manual Test Flow

- [ ] T036 Complete user journey test:
  - Load page (settings hidden by default)
  - Click toggle (settings expand)
  - Change hand size to 7
  - Click toggle (settings collapse)
  - Play a turn (verify game works with settings hidden)
  - Click toggle (settings expand, hand size still 7)
  - Enter invalid JSON (trigger error)
  - Click toggle to collapse, change JSON back to valid
  - Observe settings collapse state
  - Change JSON to invalid again
  - Verify settings auto-expand to show error
  - Reload page
  - Verify settings remain expanded (persistence)
  - **Validates**: FR-001, FR-003, FR-004, FR-005, FR-007, FR-008, SC-001, SC-002, SC-003, SC-004

### Success Criteria Final Check

- [ ] T037 Verify all 6 success criteria from spec.md:
  - ✅ **SC-001**: Visual elements reduced 50%+ when collapsed
  - ✅ **SC-002**: Single click toggles visibility
  - ✅ **SC-003**: Preference persists 100% of reloads
  - ✅ **SC-004**: Settings values unchanged when toggling
  - ✅ **SC-005**: Toggle state clearly visible
  - ✅ **SC-006**: Error expansion <100ms

**Checkpoint**: Feature complete and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Hook)**: No dependencies - start immediately
  - T001 can be done in parallel with T002
  - T002 must complete before Phase 2

- **Phase 2 (Component)**: Depends on Phase 1 (T002 complete)
  - T003 and T004 can be done in parallel
  - T005 depends on T003 and T004 complete

- **Phase 3 (Unit Tests)**: Can start after Phase 1 (T002 for hook tests)
  - T006 (hook tests) can start after T002
  - T007 (component tests) can start after T003 and T004
  - T006 and T007 can be done in parallel (different files)

- **Phase 4 (Integration)**: Depends on Phase 1 + Phase 2 (T005 complete)
  - T008 can be done in parallel (single test file with multiple tests)

- **Phase 5 (Manual)**: Depends on Phase 1 + Phase 2 (feature functional)
  - T009-T026 can be done in parallel (independent manual tests)

- **Phase 6 (Accessibility)**: Depends on Phase 1 + Phase 2
  - T027-T029 can be done in parallel (independent accessibility checks)
  - T030-T031 can be done in parallel (independent UX checks)

- **Phase 7 (Quality)**: Depends on all previous phases
  - T032-T035 can be done in parallel (independent quality checks)
  - T036-T037 are sequential final validation

### Critical Path

Fastest path to working feature:

1. **Core (Phase 1)**: T001 → T002 (45 minutes)
2. **Component (Phase 2)**: T003 || T004 → T005 (1 hour)
3. **Integration (Phase 4)**: T008 (15 minutes)
4. **Manual Test (Phase 7)**: T036 (10 minutes)

**Minimum Viable Feature**: 2 hours 10 minutes

### Parallel Opportunities

**Maximum Parallelization** (with 2 developers):

- **Developer A**: 
  - Phase 1 (T001 || T002) → 45 min
  - Phase 2 (T003 || T004 → T005) → 1 hour
  - Phase 5 (T009-T020) → 15 min
  - Phase 7 (T036-T037) → 15 min
  - **Total**: ~2 hours 15 min

- **Developer B**: 
  - Phase 3 (T006 || T007) - starts after T002, T003 → 45 min
  - Phase 4 (T008) - starts after T005 → 30 min
  - Phase 6 (T027-T031) - starts after T005 → 20 min
  - Phase 7 (T032-T035) → 15 min
  - **Total**: ~1 hour 50 min

Both converge at Phase 7 final validation.

---

## Implementation Strategy

### Recommended Approach: Sequential MVP First

1. **Complete Phase 1**: Hook implementation (45 minutes)
   - STOP: Test hook in isolation with React Testing Library
   
2. **Complete Phase 2**: Component implementation (1 hour)
   - STOP: Click toggle button in browser, verify it works
   
3. **Complete Phase 3**: Unit tests (45 minutes)
   - STOP: Run `npm test`, verify all unit tests pass
   
4. **Complete Phase 4**: Integration tests (30 minutes)
   - STOP: Run `npm test`, verify all integration tests pass
   
5. **Complete Phase 5**: Manual verification (20 minutes)
   - STOP: Verify all functional requirements satisfied
   
6. **Complete Phase 6**: Accessibility & polish (20 minutes)
   - STOP: Verify keyboard, screen reader, and UX quality
   
7. **Complete Phase 7**: Final validation (15 minutes)
   - STOP: Feature complete and ready for production

**Total Time**: 2-3 hours (as estimated)

### Alternative: Test-First Approach

If you prefer TDD:

1. **Phase 3 first**: Write unit tests (they will fail)
2. **Phase 1**: Implement hook (hook tests pass)
3. **Phase 2**: Implement component (component tests pass)
4. **Phase 4**: Integration tests (full feature works)
5. **Phase 5-7**: Validation and polish

---

## User Story Mapping

### User Story 1 - Hide Settings by Default (P1) 🎯 MVP

**Tasks**: T001, T002, T003, T004, T005, T007 (tests 1-8), T008 (tests 1-2, 7), T009-T014, T017-T020, T021-T025, T027-T030, T032-T037

**Independent Test**: 
- Load page → Verify settings hidden and only game interface visible → Click toggle → Verify settings appear
- **Validation Task**: T009, T036

### User Story 2 - Toggle Settings Visibility (P1) 🎯 MVP

**Tasks**: T001, T002, T003, T004, T005, T007 (all tests), T008 (tests 2-4), T009-T015, T021-T025, T027-T030, T032-T037

**Independent Test**:
- Click toggle → Verify settings appear → Click again → Verify settings hide → Change settings → Toggle → Verify values preserved
- **Validation Task**: T011, T012, T013, T036

### User Story 3 - Persist Settings Visibility Preference (P2)

**Tasks**: T001, T002, T003, T005, T006 (persistence tests), T007 (persistence tests), T008 (test 4), T015, T023, T032-T037

**Independent Test**:
- Expand settings → Reload page → Verify settings remain expanded
- **Validation Task**: T015, T023, T036

### User Story 4 - Error-Triggered Settings Expansion (P1) 🎯 MVP

**Tasks**: T002, T003, T005, T007 (error tests), T008 (test 5-6), T016, T019, T026, T031, T032-T037

**Independent Test**:
- Collapse settings → Enter invalid JSON → Verify settings auto-expand and error visible
- **Validation Task**: T016, T019, T031, T036

---

## Notes

- **[P] tasks**: Different files or independent operations - can run in parallel
- **Unit tests** (T006-T007): Write BEFORE manual verification for test-driven development
- **Integration testing** (T008): Critical for verifying error auto-expansion flow
- **Commit strategy**: Commit after each phase for easy rollback
- **Stop at checkpoints**: Validate feature works before moving to next phase
- **CSS Animation**: Use CSS Grid `grid-template-rows` technique for smooth expansion
- **Error tracking**: Use `useRef` to prevent re-expansion on same error
- **localStorage**: Graceful degradation if unavailable (session-only state)
- **Test count**: Existing tests + ~30 new tests (14 hook tests + 17 component tests + integration tests)

---

## Success Checklist

Before marking feature complete, verify:

### Implementation Complete
- [ ] `SettingsVisibilityState` type added to `src/lib/types.ts`
- [ ] `useSettingsVisibility` hook created in `src/hooks/useSettingsVisibility.ts`
- [ ] `SettingsPanel` component created in `src/components/SettingsPanel.tsx`
- [ ] CSS styles added for settings panel (toggle button, expansion animation, reduced motion)
- [ ] `App.tsx` updated to wrap settings in `SettingsPanel`
- [ ] Settings hidden by default
- [ ] Toggle button always visible with proper ARIA attributes
- [ ] Error auto-expansion implemented

### Testing Complete
- [ ] All 14 hook unit tests written and passing
- [ ] All 17 component unit tests written and passing
- [ ] All 7 integration tests written and passing
- [ ] All existing tests still passing (no regressions)
- [ ] All 12 functional requirements manually verified (T009-T020)
- [ ] All 6 success criteria manually verified (T021-T026)

### Quality Gates
- [ ] Linter passes with 0 errors
- [ ] Production build succeeds
- [ ] Bundle size impact acceptable (~3KB)
- [ ] Keyboard accessibility verified (Tab, Enter, Space)
- [ ] Screen reader compatibility verified
- [ ] Animation smoothness verified (<300ms)
- [ ] Reduced motion preference respected
- [ ] Error expansion performance verified (<100ms)

### Success Criteria (from spec.md)
- [ ] SC-001: 50%+ reduction in visible elements when collapsed
- [ ] SC-002: Single click toggles visibility
- [ ] SC-003: State persists across 100% of page reloads
- [ ] SC-004: Settings values unchanged when toggling
- [ ] SC-005: Toggle state clearly indicated
- [ ] SC-006: Error expansion within 100ms

---

## Summary

**Total Tasks**: 37 tasks across 7 phases  
**Estimated Time**: 2-3 hours  
**Complexity**: Low-Medium (new component pattern, but straightforward)  
**Risk**: Low (isolated feature, no changes to core game logic)  
**Test Coverage**: ~30 new tests (14 hook + 17 component + integration)  

**Files Modified**: 2 files
1. `src/lib/types.ts` (add SettingsVisibilityState type)
2. `src/App.tsx` (wrap settings in SettingsPanel)

**Files Created**: 4 files
3. `src/hooks/useSettingsVisibility.ts` (visibility hook)
4. `src/components/SettingsPanel.tsx` (wrapper component)
5. `src/components/SettingsPanel.css` (or add to HandView.css - styles)
6. `tests/unit/useSettingsVisibility.test.ts` (hook tests)
7. `tests/unit/SettingsPanel.test.tsx` (component tests)
8. `tests/integration/settingsVisibility.test.tsx` (integration tests)

**Ready for Implementation**: ✅
