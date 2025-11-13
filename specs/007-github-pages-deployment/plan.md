# Implementation Plan: GitHub Pages Public Deployment

**Branch**: `007-github-pages-deployment` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-github-pages-deployment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Configure automated deployment of the deck builder application to GitHub Pages, providing a public HTTPS URL for internet access. This involves setting up a GitHub Actions workflow that builds the application on every push to main, configuring Vite for GitHub Pages base path support, and enabling GitHub Pages in repository settings. The deployment must preserve all existing functionality, support concurrent users, and complete within 10 minutes of code changes.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (ES2022 target)  
**Primary Dependencies**: React 18.2.0, Vite 5.0.8, @picocss/pico 1.5.0  
**Build Tool**: Vite with TypeScript compilation  
**Deployment Target**: GitHub Pages (static file hosting)  
**CI/CD**: GitHub Actions (automatic deployment)  
**Testing**: Jest 29.7.0, @testing-library/react 14.1.2 (existing - no changes)  
**Target Platform**: Modern browsers via HTTPS (Chrome, Firefox, Safari, Edge)  
**Project Type**: Single-page web application (static site, client-side only)  
**Performance Goals**: <3s load time on public URL, <10min deployment time  
**Constraints**: Static site only (no backend), GitHub Pages limitations (no server-side processing), free tier GitHub hosting  
**Scale/Scope**: Public internet access, support 100+ concurrent users, 99.9% uptime target

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Static Asset Simplicity
✅ **PASS** - Feature is purely infrastructure/deployment configuration. No new runtime code, no server-side logic, no databases. GitHub Pages is a static file hosting service that perfectly aligns with the existing static site architecture. Only configuration changes (GitHub Actions workflow, Vite base path).

### Principle II: Deterministic Build & Reproducible Output
✅ **PASS** - GitHub Actions workflow will use pinned versions and deterministic build commands (`npm ci`, `npm run build`). Vite build is deterministic. No network calls during build, no environment-dependent code branches. Base path configuration is static.

### Principle III: Content Integrity & Accessibility Baseline
✅ **PASS** - No changes to application content or UI. Deployment preserves existing HTML structure and accessibility features. Public URL simply serves the same static files that work locally. No accessibility regression risk.

### Operational Constraints Check
✅ **PASS** - GitHub Pages provides free HTTPS hosting with automatic certificate management. No paid services required. No secrets needed (public repository deployment). Performance: GitHub Pages CDN meets <3s load time requirement. Deployment via GitHub Actions (free for public repos).

### Quality Gates Check
✅ **PASS** - Will verify: (1) Build succeeds in CI environment, (2) No broken links (base path correctly configured), (3) No new accessibility requirements (no UI changes), (4) Static files only (GitHub Pages constraint), (5) Dist size unchanged (no new application code).

**Constitution Compliance**: ✅ **ALL GATES PASS** - No violations. This is pure infrastructure configuration aligned with static site principles.

## Project Structure

### Documentation (this feature)

```text
specs/007-github-pages-deployment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0: GitHub Pages configuration research
├── data-model.md        # Phase 1: Configuration schema (workflow YAML, Vite config)
├── quickstart.md        # Phase 1: Deployment verification steps
├── contracts/           # Phase 1: Deployment contracts (build, accessibility, performance)
└── tasks.md             # Phase 2: Implementation tasks (/speckit.tasks command)
```

### Configuration Files (repository root)

```text
.github/
└── workflows/
    └── deploy.yml           # [ADD] GitHub Actions workflow for automated deployment

vite.config.ts               # [MODIFY] Add base path configuration for GitHub Pages
package.json                 # [NO CHANGE] Existing build script works as-is
README.md                    # [MODIFY] Add public URL and deployment status badge

src/                        # [NO CHANGES] Application code unchanged
tests/                      # [NO CHANGES] Tests unchanged (deployment is infrastructure)
dist/                       # [GENERATED] Build output deployed to gh-pages branch
```

**Structure Decision**: Single project with infrastructure configuration layer (GitHub Actions). No architectural changes to application code. Deployment is orthogonal to feature logic:

1. **GitHub Actions workflow** (.github/workflows/deploy.yml) - Build and deploy automation
2. **Vite configuration** (vite.config.ts) - Base path for GitHub Pages routing
3. **Repository settings** - Enable GitHub Pages, configure source branch
4. **Documentation** (README.md) - Add public URL and deployment info

## Complexity Tracking

**No violations detected** - Constitution gates all pass. This is pure infrastructure configuration with no application code changes. No complexity tracking required.

## Implementation Phases

### Phase 0: Research & Discovery

**Objective**: Understand GitHub Pages deployment requirements, GitHub Actions setup, and Vite configuration for base path support.

**Research Questions**:
1. What is the GitHub Pages URL format for repository-based deployments? (Format: `https://<username>.github.io/<repository>/`)
2. How does Vite's `base` configuration work for sub-path deployments?
3. What GitHub Actions workflow steps are needed for Vite + React + TypeScript builds?
4. How does GitHub Pages handle SPA routing (single page app with client-side routing)?
5. What permissions are needed for GitHub Actions to deploy to gh-pages branch?
6. How long does GitHub Pages take to propagate changes after deployment?

**Deliverable**: `research.md` documenting GitHub Pages setup, Vite base path configuration, and GitHub Actions workflow structure.

### Phase 1: Design & Contracts

**Objective**: Design the GitHub Actions workflow, define Vite configuration changes, and establish deployment contracts.

**Design Decisions**:
1. **Base Path Configuration**: Use repository name as base path (e.g., `/deck-builder/`) in `vite.config.ts`
2. **Deployment Branch**: Use `gh-pages` branch for GitHub Pages source (standard convention)
3. **Workflow Triggers**: Deploy on push to `main` branch (automatic updates per FR-005)
4. **Build Artifacts**: Deploy `dist/` directory contents to gh-pages branch root
5. **Cache Strategy**: Cache npm dependencies in GitHub Actions for faster builds
6. **Status Checks**: Ensure build succeeds before deployment, fail workflow on build errors

**Contracts** (specs/007-github-pages-deployment/contracts/):

1. **deployment-workflow.contract.md** - GitHub Actions workflow requirements:
   - C001: Workflow MUST trigger on push to main branch
   - C002: Workflow MUST install dependencies with `npm ci` (deterministic)
   - C003: Workflow MUST run `npm test` and fail deployment if tests fail
   - C004: Workflow MUST run `npm run build` and fail if build errors occur
   - C005: Workflow MUST deploy dist/ contents to gh-pages branch
   - C006: Deployment MUST complete within 10 minutes (SC-004)

2. **vite-config.contract.md** - Vite configuration requirements:
   - C007: Base path MUST be set to `/<repository-name>/`
   - C008: Build output MUST include all assets with correct base path
   - C009: Asset references (JS, CSS) MUST use base path prefix
   - C010: HTML index.html MUST load correctly from sub-path

3. **public-access.contract.md** - Public URL accessibility requirements:
   - C011: Public URL MUST return HTTP 200 for index.html
   - C012: All assets MUST load without 404 errors (SC-007)
   - C013: Application MUST become interactive within 3 seconds (SC-001)
   - C014: localStorage MUST persist across page reloads (FR-007)
   - C015: HTTPS MUST be enforced (FR-008, SC-008)

**Deliverables**:
- `data-model.md` - GitHub Actions workflow schema and Vite configuration structure
- `quickstart.md` - Steps to verify deployment, test public URL, and validate functionality
- `contracts/` directory with deployment, configuration, and access contracts

### Phase 2: Implementation Tasks

**Objective**: Execute deployment configuration, verify public access, and validate all success criteria.

**Tasks** (detailed in `tasks.md` via `/speckit.tasks` command):

1. **T001**: Create GitHub Actions workflow file (.github/workflows/deploy.yml)
   - Set up Node.js environment (version 18 or 20)
   - Install dependencies with `npm ci`
   - Run tests with `npm test`
   - Run build with `npm run build`
   - Deploy dist/ to gh-pages branch using peaceiris/actions-gh-pages@v3 or similar

2. **T002**: Configure Vite for GitHub Pages base path
   - Add `base: '/deck-builder/'` to vite.config.ts (or actual repository name)
   - Test local build with `npm run build` and verify asset paths
   - Test local preview with `npm run preview` (if available)

3. **T003**: Enable GitHub Pages in repository settings
   - Push code to GitHub (if not already remote)
   - Navigate to repository Settings > Pages
   - Set source to "Deploy from a branch"
   - Select "gh-pages" branch and "/ (root)" directory
   - Save configuration

4. **T004**: Validate deployment and public access
   - Trigger workflow by pushing to main branch
   - Monitor GitHub Actions workflow execution
   - Verify deployment succeeds within 10 minutes
   - Access public URL and verify application loads
   - Test all functionality (draw, discard, reset, play order, persistence)

5. **T005**: Add deployment documentation
   - Update README.md with public URL
   - Add GitHub Actions deployment status badge
   - Document how to trigger manual redeployment if needed

6. **T006**: Validate success criteria
   - SC-001: Measure load time with browser DevTools (target: <3s)
   - SC-002: Set up uptime monitoring (optional - external service)
   - SC-003: Test all features on public URL (100% parity checklist)
   - SC-004: Confirm deployment time from GitHub Actions logs (<10min)
   - SC-005: Test concurrent access with multiple browser sessions
   - SC-006: Verify no authentication required
   - SC-007: Check browser console for 404 errors (should be zero)
   - SC-008: Test HTTPS using SSL Labs or browser security indicators

**Testing Strategy**:
- **Unit Tests**: No new unit tests (no application code changes)
- **Integration Tests**: No new integration tests (deployment is infrastructure)
- **Manual Testing**: Public URL functionality verification checklist
- **Contract Validation**: Automated checks in GitHub Actions workflow (build, test, deploy success)

## Deployment Workflow Architecture

```yaml
# .github/workflows/deploy.yml (example structure)

name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write  # Required for gh-pages deployment

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Vite Configuration Changes

```typescript
// vite.config.ts (modified)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/deck-builder/',  // GitHub Pages base path (repository name)
})
```

## Success Validation Checklist

After implementation, validate each success criterion:

- [ ] **SC-001**: Application loads and becomes interactive within 3 seconds
  - Method: Chrome DevTools Network tab, measure "DOMContentLoaded" time
  - Target: <3000ms on standard broadband (5+ Mbps)

- [ ] **SC-002**: Public URL accessible 99.9% of the time
  - Method: GitHub Pages uptime (inherent to service), optional external monitoring
  - Target: 99.9% uptime (GitHub Pages SLA)

- [ ] **SC-003**: 100% feature parity with local development
  - Method: Manual testing checklist (draw hand, discard, reset, play order, persistence)
  - Target: All features work identically

- [ ] **SC-004**: Deployment completes within 10 minutes
  - Method: GitHub Actions workflow execution time
  - Target: <10 minutes from push to live

- [ ] **SC-005**: Supports 100+ concurrent users
  - Method: GitHub Pages handles static file serving at scale
  - Target: No degradation with concurrent access

- [ ] **SC-006**: Zero authentication required
  - Method: Access public URL in incognito mode
  - Target: Application loads without login/auth

- [ ] **SC-007**: Zero 404 errors on asset loading
  - Method: Browser console network tab
  - Target: 0 failed requests (all JS/CSS/assets load)

- [ ] **SC-008**: HTTPS A grade or higher
  - Method: Check HTTPS padlock icon, optional SSL Labs test
  - Target: GitHub Pages provides A-grade HTTPS by default

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Base path configuration error causes 404s | Medium | High | Test build locally with `npm run build && npm run preview`, verify asset paths before deployment |
| GitHub Actions workflow fails on first run | Medium | Low | Test workflow syntax with act (local GitHub Actions runner) or push to test branch first |
| Repository not connected to GitHub remote | High | High | Verify `git remote -v` shows GitHub URL, add remote if missing before workflow push |
| Deployment takes >10 minutes | Low | Medium | GitHub Actions typically fast for small static sites; monitor first deployment time |
| CORS or security issues on public URL | Low | Medium | GitHub Pages handles CORS correctly for static sites; test in browser console |
| SPA routing breaks on direct URL access | Low | Medium | Vite builds SPA correctly; add 404.html fallback if needed (common GitHub Pages pattern) |

## Open Questions

1. **Repository Name**: What is the actual GitHub repository name? (Needed for base path configuration)
   - **Assumption**: Using "deck-builder" as placeholder; will update when repository URL is known
   - **Action**: Check `git remote -v` or create GitHub repository if not exists

2. **GitHub Repository Access**: Does the repository already exist on GitHub?
   - **Assumption**: Repository exists or can be created with admin access
   - **Action**: Verify repository URL and push access before workflow creation

3. **Branch Protection**: Should main branch require PR reviews or allow direct pushes?
   - **Assumption**: Direct pushes to main allowed (triggers deployment)
   - **Action**: Configure branch protection rules if needed (out of scope for this feature)

4. **404 Fallback for SPA**: Does GitHub Pages need a custom 404.html for client-side routing?
   - **Assumption**: Not needed (application is single page, no client-side routing currently)
   - **Action**: Add 404.html → index.html copy if routing issues occur

## Next Steps

1. **Run `/speckit.plan` Phase 0**: Research GitHub Pages configuration and Vite base path setup
2. **Run `/speckit.plan` Phase 1**: Design workflow, create contracts, document deployment process
3. **Run `/speckit.tasks`**: Generate detailed implementation tasks
4. **Execute Implementation**: Create workflow file, configure Vite, enable GitHub Pages, deploy
5. **Validate Deployment**: Test public URL, verify success criteria, document public access

## Dependencies on Other Features

- **Feature 001-006**: No dependencies - deployment is orthogonal to application features
- **Future Features**: Provides foundation for public testing and user feedback on new features

## Performance Considerations

- **Build Time**: TypeScript compilation + Vite build typically <2 minutes
- **Deployment Time**: GitHub Actions upload + GitHub Pages propagation typically 2-5 minutes
- **Total Time**: <10 minutes target (SC-004) well within typical GitHub Pages deployment time
- **Asset Size**: Current build ~200KB (estimated), well within GitHub Pages limits
- **Load Time**: Static site CDN serving meets <3s target (SC-001)

## Security Considerations

- **HTTPS**: GitHub Pages enforces HTTPS by default (FR-008, SC-008)
- **No Secrets**: Application is fully client-side, no API keys or sensitive data
- **Public Access**: Intentionally public (FR-001) - no authentication barriers
- **localStorage**: User data stays in browser, never transmitted (FR-007)

## Rollback Strategy

If deployment fails or breaks functionality:
1. **Immediate**: Revert commit on main branch, workflow will redeploy previous version
2. **Disable**: Disable GitHub Pages in repository settings to take offline
3. **Fix Forward**: Debug base path or workflow issues, push fix to main

## Maintenance Notes

- **Workflow Updates**: Pin GitHub Actions versions, update periodically for security
- **Vite Updates**: Base path configuration stable across Vite versions
- **GitHub Pages Changes**: Monitor GitHub Pages service updates (rare breaking changes)
- **Cost**: Free for public repositories (no maintenance cost)
