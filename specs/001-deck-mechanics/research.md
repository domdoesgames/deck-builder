# Research: Deck Mechanics Feature

## Decisions & Rationale

### Bundler Choice
- Decision: Vite
- Rationale: Fast dev server, minimal config, optimized static build; aligns with deterministic single-command build; supports TypeScript and React out-of-the-box.
- Alternatives Considered: CRA (deprecated maintenance), Parcel (good zero-config but less granular control), Webpack (more configuration overhead).

### Lightweight CSS Library
- Decision: Pico.css
- Rationale: Minimal semantic class usage, small bundle size (~10KB gzipped), accessibility-friendly defaults, easier to override. Tailwind viable but larger config footprint; Vanilla Extract requires build-time CSS-in-TS complexity.
- Alternatives Considered: Tailwind (utility speed but config + potential bloat), Vanilla Extract (type-safe style but adds complexity), Plain CSS Modules (acceptable but less accessible defaults).

### Testing Stack
- Decision: Jest + React Testing Library + Vitest migration option later
- Rationale: Wide ecosystem adoption; RTL focuses on user interactions. Vite integrates with Vitest; initial Jest acceptable; consider switch to Vitest for faster TS integration—documented as follow-up.
- Alternatives: Pure Vitest (simpler with Vite; chosen later if performance needed), Cypress (for e2e—out of scope MVP), Playwright (future for mobile interaction).

### Mobile Minimum Versions
- Decision: iOS 15+, Android Chrome 110+ (approx last 2 years) 
- Rationale: Ensures modern ES2022 & flexbox/grid support; reduces need for polyfills. 
- Alternatives: Support older (iOS 12) increases testing complexity and possible layout regressions.

### Accessibility Specifics
- Decision: Text-only cards (no images) for MVP; alt text need deferred until images introduced. Use semantic landmarks `header/main/footer`. Focus states visible (Pico default). Color contrast enforced via Pico palette.
- Alternatives: Image-based cards increases asset management overhead; deferred.

### Baseline Dist Size Measurement
- Decision: Record initial `dist/` gzipped size after first build; track growth percentage in PRs manually.
- Alternatives: Automated size budget tooling (Webpack Bundle Analyzer) adds config complexity; can add later if growth exceeds 20% frequently.

### Bundle Size Threshold
- Decision: Initial target <150KB gzipped main + CSS.
- Rationale: Fast 3G FMP <2s; deck logic minimal.
- Alternatives: 200KB (looser) but reduces discipline.

### Mobile Interaction Considerations
- Decision: Ensure touch targets >=44px height; use passive listeners; avoid hover-only UI.
- Alternatives: Smaller targets harms accessibility.

### Randomness & Determinism
- Decision: Fisher-Yates implemented in `shuffle.ts` with `crypto.getRandomValues` fallback to `Math.random` when unavailable.
- Alternatives: Seeded PRNG (not required MVP).

### State Management Strategy
- Decision: Local reducer (`useReducer`) + custom hook `useDeckState`; avoids external libraries.
- Alternatives: Zustand/Redux (overkill for single feature).

### JSON Validation Approach
- Decision: Try/catch parse; enforce array of strings; fallback to default deck with warning for empty array.
- Alternatives: Schema validator (Zod) adds dependency; not needed MVP.

## Resolved Clarifications Summary
- Bundler: Vite
- CSS: Pico.css
- Testing: Jest + RTL (with future Vitest option)
- Mobile versions: iOS 15+, Android Chrome 110+
- Bundler size baseline measurement: manual log
- Accessibility image alt text: deferred (text-only cards)
- Bundle threshold: <150KB gzipped

## Follow-Up Tasks (Non-blocking)
- Consider switch to Vitest for native Vite integration
- Add automated size budget check script if >20% growth occurs twice
- Evaluate adding Playwright for touch interaction regression tests in future

## Removed NEEDS CLARIFICATION Items
All previously marked items resolved; none remain blocking Phase 1.
