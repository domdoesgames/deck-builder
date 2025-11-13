<!--
Sync Impact Report
Version change: <none> -> 1.0.0
Modified principles: Initial population
Added sections: Minimal Operational Constraints; Workflow & Quality Gates
Removed sections: None
Templates requiring updates:
  plan-template.md ✅ Constitution Check will reference 3 principles
  spec-template.md ✅ No change needed (already generic)
  tasks-template.md ✅ Emphasis on asset generation + link validation
  agent-file-template.md ⚠ Pending (will populate once plans exist)
Follow-up TODOs: None
-->
# Deck Builder Prototype Constitution

## Core Principles

### I. Static Asset Simplicity
The prototype MUST remain a purely static site: HTML, CSS, and optional client-side JavaScript with
no server-side runtime, databases, or build-time complexity beyond a single static bundler (if
used). Any proposal introducing dynamic backends, frameworks rendering on the server, or stateful
services is out of scope and REQUIRES a constitution amendment first. Rationale: Preserves speed
of iteration, trivial hosting, and minimal operational burden.

### II. Deterministic Build & Reproducible Output
A single command (`npm run build` or equivalent) MUST produce the full deployable artifact set
into a `dist/` (or `build/`) directory with no side effects (no network calls except package
installation, no environment-dependent branches). Build MUST be runnable offline after initial
dependency install. Rationale: Ensures predictable deployments and easy cache invalidation.

### III. Content Integrity & Accessibility Baseline
Every page MUST: (1) validate without critical HTML errors, (2) include semantic landmarks
(`<header>`, `<main>`, `<footer>` where appropriate), (3) provide alt text for all images, (4)
avoid inaccessible color contrasts (WCAG AA for text), (5) have working internal links (no 404).
New pages MUST include a quick manual checklist in PR description confirming these items. Rationale:
Guarantees usable baseline quality without heavy tooling.

## Minimal Operational Constraints
- Hosting MUST support serving static files over HTTPS.
- Deployment MUST be atomic: replace entire previous artifact set, no partial overwrites.
- No secrets stored in repo; prototype does not consume private APIs.
- Performance target: First meaningful paint under 2s on a standard laptop (Chrome throttled to
"Fast 3G" for measurement) for landing page. If exceeded, optimization task MUST be added.

## Workflow & Quality Gates
Flow: Author content/component → Local build → Link & accessibility quick check → Commit & PR →
Review → Deploy.
Quality gates (all MUST pass before merge):
1. Build succeeds cleanly (no warnings about missing assets).
2. Internal link validation script or manual checklist confirms zero broken links.
3. Accessibility checklist completed for new/changed pages.
4. No introduction of server-side code or runtime dependencies.
5. Dist directory size growth >20% requires justification.

## Governance
Amendments: Any change introducing dynamic functionality (APIs, persistence, server rendering) or
removing a principle REQUIRES a MAJOR version bump proposal PR describing scope, rationale, and
impact. Adding non-breaking tooling (e.g., automated accessibility linter) is MINOR. Clarifying
language or tightening thresholds without changing behavior is PATCH.

Reviewers MUST verify: static-only scope, reproducible build command, accessibility & link checks,
and version bump rationale when constitution modified.

Versioning Policy: Semantic (MAJOR.MINOR.PATCH) per governance rules above. Amendments set
`LAST_AMENDED_DATE` to merge date; `RATIFICATION_DATE` remains original adoption.

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12
