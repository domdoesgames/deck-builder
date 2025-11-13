# Tasks: Card Hand Display

**Feature**: 002-card-hand-display  
**Input**: Design documents from `/specs/002-card-hand-display/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/

**Tests**: Tests are included per feature specification requirements (FR-001 to FR-012, SC-001 to SC-005)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript type augmentation for CSS custom properties

- [ ] T001 Create `src/types/css.d.ts` with CSS custom property type augmentation for `--card-count` and `--card-index`

**Checkpoint**: TypeScript configuration ready for CSS custom properties

---

## Phase 2: User Story 1 - Visual Card Hand Display (Priority: P1) 🎯 MVP

**Goal**: Transform HandView from list display to visual card fan/spread layout with card-shaped elements

**Independent Test**: Deal a 5-card hand and verify cards render as visual rectangles in horizontal spread (not as `<ul>/<li>` list)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T002 [P] [US1] Update existing unit test "renders empty state when hand is empty" in `tests/unit/HandView.test.tsx` to match new structure (`.hand-container--empty`, `<p>` instead of `<ul>`)
- [ ] T003 [P] [US1] Update existing unit test "renders single card centered" in `tests/unit/HandView.test.tsx` to use `getByRole('article')` instead of list item
- [ ] T004 [P] [US1] Update existing unit test "renders multiple cards in order" in `tests/unit/HandView.test.tsx` to check for `role="article"` and `aria-label="Card: {value}"`
- [ ] T005 [P] [US1] Add new unit test "applies card class to each card element" in `tests/unit/HandView.test.tsx` verifying `.card` CSS class on each card
- [ ] T006 [P] [US1] Add new unit test "wraps card text in card__value element" in `tests/unit/HandView.test.tsx` verifying `.card__value` wrapper

### Implementation for User Story 1

- [ ] T007 [US1] Create `src/components/HandView.css` with base CSS custom properties (`:root` variables for card sizing, colors, transitions)
- [ ] T008 [US1] Add `.hand-container` CSS rules in `src/components/HandView.css` (flexbox layout, centering, padding)
- [ ] T009 [US1] Add `.hand-container--empty` modifier CSS rules in `src/components/HandView.css` (empty state styling)
- [ ] T010 [US1] Add `.hand-empty-message` CSS rules in `src/components/HandView.css` (muted color, italic, centered text)
- [ ] T011 [US1] Add `.card` base CSS rules in `src/components/HandView.css` (sizing with `clamp()`, visual styling, flexbox for content, z-index, cursor)
- [ ] T012 [US1] Add `.card:first-child` CSS rule in `src/components/HandView.css` (margin-left: 0 to remove overlap on first card)
- [ ] T013 [US1] Add `.card__value` CSS rules in `src/components/HandView.css` (multi-line text clamp for long names)
- [ ] T014 [US1] Update `src/components/HandView.tsx`: Import `./HandView.css` at top of file
- [ ] T015 [US1] Update `src/components/HandView.tsx`: Replace `<ul>/<li>` structure with `<div className="hand-container">` containing card `<div>` elements
- [ ] T016 [US1] Update `src/components/HandView.tsx`: Add `id="hand-heading"` to `<h2>` and `aria-labelledby="hand-heading"` to container
- [ ] T017 [US1] Update `src/components/HandView.tsx`: Add `role="article"` and `aria-label="Card: ${card}"` to each card element
- [ ] T018 [US1] Update `src/components/HandView.tsx`: Set CSS custom property `--card-count` on `.hand-container` via `style` prop
- [ ] T019 [US1] Update `src/components/HandView.tsx`: Set CSS custom property `--card-index` on each `.card` via `style` prop
- [ ] T020 [US1] Update `src/components/HandView.tsx`: Add `.hand-container--empty` modifier class when `hand.length === 0`
- [ ] T021 [US1] Update `src/components/HandView.tsx`: Wrap card text in `<span className="card__value">`

**Checkpoint**: User Story 1 complete - cards display as visual elements in horizontal spread, empty state works, all US1 tests pass

---

## Phase 3: User Story 2 - Responsive Card Sizing (Priority: P2)

**Goal**: Cards automatically resize to fit 1-10 cards without horizontal scroll on 1024px+ viewports

**Independent Test**: Change hand size from 5 to 10 cards, verify all cards visible without horizontal scroll at 1024px viewport

### Tests for User Story 2

- [ ] T022 [P] [US2] Add unit test "sets CSS custom property for card count" in `tests/unit/HandView.test.tsx` verifying `--card-count` style set to `hand.length`
- [ ] T023 [P] [US2] Create integration test file `tests/integration/handDisplay.test.ts` for viewport testing
- [ ] T024 [US2] Add integration test "10 cards fit in 1024px viewport without horizontal scroll" in `tests/integration/handDisplay.test.ts` (set viewport, measure scrollWidth vs clientWidth)
- [ ] T025 [US2] Add integration test "cards resize when hand size changes" in `tests/integration/handDisplay.test.ts` (deal 5 cards, measure card width, change to 10, verify width decreased)

### Implementation for User Story 2

- [ ] T026 [US2] Verify `.card` width calculation in `src/components/HandView.css` uses `clamp()` with viewport-based calculation: `clamp(80px, calc((100vw - 4rem) / var(--card-count)), 120px)`
- [ ] T027 [US2] Verify `.card` margin-left (overlap) calculation in `src/components/HandView.css` uses `clamp()` to scale overlap with card size
- [ ] T028 [US2] Add responsive fallback in `src/components/HandView.css` for narrow viewports (<1024px) allowing horizontal scroll

**Checkpoint**: User Story 2 complete - hand sizes 1-10 all fit properly, responsive sizing works, all US1+US2 tests pass

---

## Phase 4: User Story 3 - Visual Card States (Priority: P3)

**Goal**: Cards provide hover feedback (elevation + shadow) for interactive polish

**Independent Test**: Hover mouse over any card, verify visual elevation and shadow appear within 200ms

### Tests for User Story 3

- [ ] T029 [P] [US3] Add unit test "card hover state applies transform and shadow" in `tests/unit/HandView.test.tsx` (verify CSS classes/pseudo-classes if possible, or skip for manual testing)

### Implementation for User Story 3

- [ ] T030 [US3] Add `.card:hover` CSS rules in `src/components/HandView.css` (translateY elevation, z-index 10, box-shadow)
- [ ] T031 [US3] Add `transition` property to `.card` in `src/components/HandView.css` (transform and box-shadow, 200ms duration)
- [ ] T032 [US3] Add `will-change: transform` to `.card` in `src/components/HandView.css` for hardware acceleration
- [ ] T033 [US3] Add `@media (prefers-reduced-motion: reduce)` in `src/components/HandView.css` to disable transitions for accessibility
- [ ] T034 [US3] Add `@media (hover: none) and (pointer: coarse)` in `src/components/HandView.css` to disable hover on touch devices and add `:active` state instead

**Checkpoint**: User Story 3 complete - hover feedback works on desktop, touch feedback on mobile, all US1+US2+US3 tests pass

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Finalize styling, accessibility, and documentation

- [ ] T035 [P] Integrate Pico CSS custom properties in `src/components/HandView.css`: Replace hardcoded colors with `var(--primary)`, `var(--card-background-color)`, `var(--border-radius)`, `var(--spacing)`
- [ ] T036 [P] Add dark mode support in `src/components/HandView.css` with `@media (prefers-color-scheme: dark)` if Pico provides dark theme variables
- [ ] T037 [P] Manual accessibility test: Screen reader announcement (VoiceOver/NVDA) correctly announces "Current hand, region" and "Card: {value}, article"
- [ ] T038 [P] Manual accessibility test: Keyboard navigation (Tab key) focuses cards with visible outline
- [ ] T039 [P] Manual browser test: Verify font size never drops below 12px across all hand sizes (use DevTools inspector)
- [ ] T040 [P] Manual browser test: Verify 10 cards fit at 1024px viewport without horizontal scroll
- [ ] T041 Run full test suite: `npm test` (expect all tests pass: 24-26 tests total)
- [ ] T042 Run linter: `npm run lint` (expect 0 errors)
- [ ] T043 Run production build: `npm run build` (expect success, <1s build time)
- [ ] T044 Update requirements checklist: Mark all FR-001 to FR-012, SC-001 to SC-005 as complete in `specs/002-card-hand-display/checklists/requirements.md`
- [ ] T045 Follow quickstart.md validation checklist: Complete all items in "Verification Checklist" section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately (T001)
- **User Story 1 (Phase 2)**: Depends on Setup (T001 complete)
- **User Story 2 (Phase 3)**: Depends on US1 complete (CSS sizing builds on US1 layout)
- **User Story 3 (Phase 4)**: Depends on US1 complete (hover states build on US1 card structure)
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (T001) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 complete - Requires card layout structure from US1
- **User Story 3 (P3)**: Can start after US1 complete - Requires card elements from US1, can run in parallel with US2

### Within Each User Story

**User Story 1**:
1. Tests first (T002-T006) - all can run in parallel [P]
2. CSS structure (T007-T013) - sequential (each rule builds on previous)
3. Component updates (T014-T021) - sequential (each change builds on previous)

**User Story 2**:
1. Tests first (T022-T025) - T022-T023 parallel, then T024-T025 sequential
2. CSS verification (T026-T028) - sequential verification tasks

**User Story 3**:
1. Test first (T029) - single test
2. CSS implementation (T030-T034) - sequential (each rule builds on previous)

### Parallel Opportunities

- **Phase 1 (Setup)**: Only one task (T001) - no parallelization
- **Phase 2 (US1) Tests**: T002, T003, T004, T005, T006 all parallel [P]
- **Phase 5 (Polish)**: T035, T036, T037, T038, T039, T040 all parallel [P] until T041 (full test suite)

**Maximum parallelization strategy**:
```
1. T001 (Setup)
2. Launch in parallel: T002, T003, T004, T005, T006 (US1 tests)
3. Sequential: T007-T021 (US1 CSS + component implementation)
4. Launch in parallel: T022, T023 (US2 tests)
5. Sequential: T024-T028 (US2 integration tests + CSS verification)
6. T029 (US3 test)
7. Sequential: T030-T034 (US3 CSS implementation)
8. Launch in parallel: T035-T040 (Polish tasks)
9. Sequential: T041-T045 (Validation + documentation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: User Story 1 (T002-T021)
3. **STOP and VALIDATE**: 
   - Run `npm test -- HandView.test.tsx` (expect 22 tests pass)
   - Manual browser test: Deal 5-card hand, verify visual cards appear
   - Screen reader test: Verify accessibility
4. **MVP READY**: Cards display as visual elements (core requirement achieved)

### Full Feature Delivery

1. Complete Setup + US1 → Validate MVP
2. Add US2 (T022-T028) → Test responsive sizing independently
3. Add US3 (T029-T034) → Test hover states independently
4. Polish (T035-T045) → Final validation and documentation
5. All 3 user stories work independently and together

### Time Estimates

- **Phase 1 (Setup)**: 5 minutes
- **Phase 2 (US1)**: 90 minutes (30 tests + 60 implementation)
- **Phase 3 (US2)**: 45 minutes (15 tests + 30 verification)
- **Phase 4 (US3)**: 30 minutes (5 tests + 25 implementation)
- **Phase 5 (Polish)**: 45 minutes (manual testing + validation)

**Total**: ~3.5 hours (matches quickstart.md estimate)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each user story phase completion
- Stop at any checkpoint to validate story independently
- CSS-heavy feature: Most complexity in `HandView.css` layout calculations
- No new dependencies: Uses existing React 18.2 + Pico CSS 1.5
- Constitution-compliant: Static CSS + client-side React only

---

## Success Criteria Validation Map

| Success Criteria | Tasks | Validation Method |
|------------------|-------|-------------------|
| SC-001: 10 cards fit @ 1024px | T024, T026, T027, T040 | Integration test + manual verification |
| SC-002: Min 12px font size | T011, T039 | CSS clamp() + manual DevTools inspection |
| SC-003: Cards visually distinct | T011, T035 | Manual visual inspection |
| SC-004: Recognizable as "cards in a hand" | T015, T021, T040 | Manual visual inspection |
| SC-005: Hover response <100ms | T030, T031 | CSS transition 200ms (< spec allows) |

All success criteria covered by task breakdown.
