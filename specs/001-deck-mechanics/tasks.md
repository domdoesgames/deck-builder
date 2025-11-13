# Tasks: Deck Mechanics (Feature 001)

**Input**: Design documents in `specs/001-deck-mechanics/` (spec.md, plan.md, research.md, data-model.md, contracts/)
**Prerequisites**: plan.md (present), spec.md (present), research.md (present), data-model.md (present), contracts/ (present)

**Format**: `[ID] [P?] [Story] Description`
- **[P]** marks tasks safe to run in parallel (different files, no ordering dependency)
- **[Story]** one of US1, US2, US3 or `FND` (Foundational) or `SET` (Setup) or `POL` (Polish)
- Include exact file paths

---
## Phase 1: Setup (Shared Infrastructure)
**Purpose**: Initialize project, tooling, scripts. Blocks all subsequent phases.

- [ ] T001 SET Initialize `package.json` with scripts: `dev`, `build`, `test`, `lint`; add dependencies: react, react-dom, pico.css, typescript, @types/react, @types/react-dom, jest, @testing-library/react, @testing-library/jest-dom, ts-jest, @types/jest, eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, vite, @vitejs/plugin-react
- [ ] T002 [P] SET Create `tsconfig.json` (ES2022 target, JSX react-jsx) per plan
- [ ] T003 [P] SET Create `vite.config.ts` enabling React plugin & Pico.css inclusion
- [ ] T004 [P] SET Scaffold directories: `src/components`, `src/hooks`, `src/lib`, `src/state`, `src/styles`, `tests/unit`, `tests/integration`, `tests/contract`
- [ ] T005 [P] SET Add `.eslintrc.cjs` + simple rules (TS/React) & `npm run lint` script
- [ ] T006 [P] SET Add `jest.config.cjs` (ts-jest preset, jsdom env) + setup for RTL
- [ ] T007 SET Verify dev server (`npm run dev`) launches baseline empty app (placeholder `App.tsx`)

---
## Phase 2: Foundational (Blocking Prerequisites)
**Purpose**: Core logic & structural code needed before user stories. No user story tasks may start until these complete.

- [ ] T008 [P] FND Create `src/lib/constants.ts` with default deck array (>=20 string card ids)
- [ ] T009 [P] FND Create `src/lib/types.ts` defining `DeckState`, helper types from contracts (warning/error fields included)
- [ ] T010 [P] FND Implement `src/lib/shuffle.ts` Fisher-Yates using `crypto.getRandomValues` fallback to `Math.random`
- [ ] T011 FND Implement `src/state/deckReducer.ts` with actions: INIT, DEAL_NEXT_HAND, END_TURN, APPLY_JSON_OVERRIDE, CHANGE_PARAMETERS (mid-turn reset flag)
- [ ] T012 FND Implement `src/hooks/useDeckState.ts` wrapping `useReducer` and exposing imperative helpers (dealNextHand, endTurn, applyJsonOverride, changeParameters)
- [ ] T013 [P] FND Create placeholder components with minimal semantic markup: `DeckControls.tsx`, `HandView.tsx`, `PileCounts.tsx`, `JsonOverride.tsx`, `WarningBanner.tsx`
- [ ] T014 [P] FND Add `src/styles/index.css` importing Pico.css and any overrides; ensure landmarks styles possible
- [ ] T015 FND Implement `src/App.tsx` composing placeholder components with semantic `header/main/footer`
- [ ] T016 FND Implement `src/main.tsx` Vite entry mounting `<App />`
- [ ] T017 [P] FND Write initial unit test skeletons using `test.todo('description')` or placeholder `expect(true).toBe(false)` assertions to ensure initial fail: `tests/unit/shuffle.test.ts`, `tests/unit/deckReducer.test.ts`, `tests/unit/useDeckState.test.ts`
- [ ] T018 FND Run `npm run build` to produce initial `dist/`; verify build completes with zero warnings about missing assets; record baseline gzipped size manually in `specs/001-deck-mechanics/size-baseline.txt`
- [ ] T019 FND Update `requirements.md` checklist marking foundational related items partially addressed (FR-001, FR-009 structure started) with inline comments

**Checkpoint**: Foundation complete → User stories may proceed.

---
## Phase 3: User Story 1 - Deal & End Turn (Priority: P1) 🎯 MVP
**Goal**: Enable core loop: deal hand size H, end turn discards full hand, reshuffle discard pile when draw pile depletes.
**Independent Test**: Hand size=5, discard=5; perform turns until draw pile exhaustion; verify reshuffle and exact hand size after reshuffle.

### Tests (write first, ensure FAIL before implementation)
- [ ] T020 [P] US1 Create integration test `tests/integration/turnCycle.test.tsx` (mount app, simulate multiple End Turn presses including rapid-click scenario, assert hand size & reshuffle behavior)
- [ ] T021 [P] US1 Create contract test `tests/contract/deckContracts.test.ts` (dealNextHand, endTurn reshuffle correctness, warning on insufficient deck scenario)

### Implementation
- [ ] T022 [P] US1 Implement `src/lib/dealNextHand.ts` (export function per contract, used by reducer; include warning logic when total cards < handSize per FR-004)
- [ ] T023 [P] US1 Implement `src/lib/endTurn.ts` using reducer-compatible state transitions; verify full-hand discard to discardPile per FR-005
- [ ] T024 US1 Integrate deal/end functions into `deckReducer.ts` actions (DEAL_NEXT_HAND, END_TURN) & ensure warning clearing logic
- [ ] T025 US1 Implement `DeckControls.tsx` (dropdowns for hand size & discard count, End Turn button; disable while dealing)
- [ ] T026 [P] US1 Implement `HandView.tsx` rendering current hand cards with accessible list semantics
- [ ] T027 [P] US1 Implement `PileCounts.tsx` showing draw pile size, discard pile size, turn number
- [ ] T028 US1 Implement `WarningBanner.tsx` (shows warning state; aria-live="polite")
- [ ] T029 US1 Wire components into `App.tsx` replacing placeholders
- [ ] T030 US1 Update `requirements.md` marking FR-001..FR-006, FR-010, FR-011, FR-012 edge cases CHK-EC-005 as implemented; verify FR-004 warning and FR-005 full-hand discard behavior (reference test IDs)

**Checkpoint**: US1 independently functional & tests pass.

---
## Phase 4: User Story 2 - JSON Deck Override (Priority: P2)
**Goal**: Allow user to override deck with JSON array; handle invalid, empty (revert), duplicates.
**Independent Test**: Apply `["A","B","C","D","E","F"]` with hand size=3; verify only given cards used and reshuffle respects list.

### Tests (write first)
- [ ] T031 [P] US2 Create integration test `tests/integration/jsonOverride.test.tsx` (valid override, invalid JSON error, empty list revert warning)
- [ ] T032 [P] US2 Create unit test `tests/unit/jsonOverride.test.ts` (duplicate entries preserved, empty list revert path)

### Implementation
- [ ] T033 [P] US2 Implement `src/lib/applyJsonOverride.ts` parsing & validation (array of strings, empty triggers revert) returning new state fragment
- [ ] T034 US2 Integrate override logic & error/warning handling into `deckReducer.ts` (APPLY_JSON_OVERRIDE action)
- [ ] T035 [P] US2 Implement `JsonOverride.tsx` (textarea, Apply Deck button, error display)
- [ ] T036 US2 Enhance `WarningBanner.tsx` to display JSON parse errors (aria-live="assertive"); ensure deck state unchanged on parse failure per FR-008
- [ ] T037 US2 Update `requirements.md` marking FR-007..FR-009, FR-014, FR-016, CHK-EC-001, CHK-EC-002, CHK-EC-003 items; verify FR-008 error display without deck mutation (reference tests)

**Checkpoint**: US1 + US2 both independent & tests pass.

---
## Phase 5: User Story 3 - Adjustable Parameters UI (Priority: P3)
**Goal**: Change hand size & discard count mid-turn causing immediate reset; otherwise apply next deal.
**Independent Test**: Start hand size=4; after two turns change to 6 mid-turn; verify immediate reset and subsequent hand size=6.

### Tests (write first)
- [ ] T038 [P] US3 Create integration test `tests/integration/parameterChangeReset.test.tsx` (mid-turn change triggers reset, normal change between turns applies next)
- [ ] T039 [P] US3 Create unit test `tests/unit/changeParameters.test.ts` (changeParameters immediateReset flag behavior)

### Implementation
- [ ] T040 [P] US3 Implement `src/lib/changeParameters.ts` handling immediate reset logic per data-model transitions
- [ ] T041 US3 Integrate CHANGE_PARAMETERS action in `deckReducer.ts` resetting piles & dealing new hand when mid-turn
- [ ] T042 US3 Enhance `DeckControls.tsx` to detect mid-turn (state.isDealing or hand not empty) & trigger immediate reset flow when parameters altered
- [ ] T043 US3 Update `requirements.md` marking FR-002, FR-003, FR-013, FR-015, CHK-EC-004 items; reference tests

**Checkpoint**: All three user stories independently functional with passing tests.

---
## Phase 6: Polish & Cross-Cutting Concerns
**Purpose**: Accessibility, performance, documentation, size tracking, success criteria validation.

- [ ] T044 [P] POL Add explicit landmarks & aria attributes in `src/App.tsx`; create accessibility checklist artifact in `docs/accessibility-checklist.md` or PR description per constitution Quality Gate 3; verify items from quickstart.md
- [ ] T045 [P] POL Implement size measurement script `scripts/measure-size.js` (Node.js using zlib default compression level 6 for consistency; gzip dist assets, sum size) & log output; compare against 150KB budget from plan.md
- [ ] T046 [P] POL Optimize `shuffle.ts` (in-place operations, minimal allocations) & add bias inspection comment / micro-test case
- [ ] T047 POL Run full test suite; achieve success criteria SC-001..SC-005; update `requirements.md` CHK-SC-001..CHK-SC-005
- [ ] T048 [P] POL Measure End Turn interaction latency using browser DevTools Performance tab or manual timing; verify <150ms threshold per plan.md performance goals
- [ ] T049 [P] POL Validate internal links in `dist/` output (manual check or simple script); confirm zero 404s per constitution Principle III Quality Gate 2
- [ ] T050 [P] POL Documentation updates: add notes to `quickstart.md` for size script usage, mid-turn reset behavior, and terminology conventions (natural language in spec; camelCase in code)
- [ ] T051 POL Final pass: update `requirements.md` marking all remaining CHK-* items complete with references

---
## Dependencies & Execution Order

### Phase Dependencies
- Setup (Phase 1) → prerequisite for Foundational
- Foundational (Phase 2) → BLOCKS User Stories (Phases 3–5)
- User Stories 3–5 may proceed sequentially by priority or in parallel after Phase 2 (tests for each written before implementation)
- Polish (Phase 6) depends on completion of desired user stories

### User Story Independence
- US1 has no dependency on US2/US3
- US2 depends only on foundational work (override logic isolated)
- US3 depends only on foundational work; integrates parameter reset without altering US2 override semantics

### Parallel Opportunities
- Tasks marked [P] across different files (e.g., T008–T010) can run together
- Test files for a story (e.g., T020 & T021) can be authored in parallel
- Implementation helpers (e.g., dealNextHand, endTurn) can proceed in parallel

### Testing Strategy
- Write tests first per story → confirm initial FAIL → implement → achieve PASS
- Contract tests validate internal logic boundaries (`dealNextHand`, `endTurn`, overrides, parameter changes)

### Size Tracking
- Baseline captured in T018; compare in Polish phase via T045; justify if >20% growth

### Checklist Updating
- Requirements checklist updated after each phase (T019, T030, T037, T043, T047, T049)

---
## Notes
- Avoid cross-story mutable coupling; each story modifies reducer via distinct action types.
- Mid-turn reset clarifies immediate state clearance before new deal (US3) – ensure warnings cleared on successful full hand deal.
- Duplicates preserved; no deduplication logic should appear in override path.
- End Turn concurrency: ensure ignored while `state.isDealing` (covered in reducer & tests).
- Terminology convention: Use natural language (e.g., "discard count") in spec.md; use camelCase (e.g., `discardCount`) in code artifacts (types, contracts, implementation).
- Performance thresholds: End Turn state updates <150ms, JSON override operations <2s (per plan.md and spec.md SC-003/SC-005).
- Bundle size target: <150KB gzipped (plan.md single source of truth; research.md and tasks reference plan.md).
