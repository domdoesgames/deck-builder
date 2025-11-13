# Deployment Workflow Contract

**Feature**: GitHub Pages Public Deployment  
**Component**: GitHub Actions CI/CD Pipeline  
**Created**: 2025-11-13

## Purpose

This contract defines the required behavior for the automated deployment workflow that builds and deploys the deck builder application to GitHub Pages.

## Contracts

### C001: Automatic Trigger on Main Branch

**Contract**: The workflow MUST trigger automatically on every push to the `main` branch.

**Validation**:
- GitHub Actions workflow includes `on: push: branches: [main]`
- Pushing to `main` initiates workflow execution within 1 minute
- Workflow appears in repository's Actions tab with correct trigger

**Rationale**: Enables automatic deployment per FR-005 (automatic deployment on main branch changes).

---

### C002: Deterministic Dependency Installation

**Contract**: The workflow MUST install dependencies using `npm ci` (not `npm install`) to ensure deterministic, reproducible builds.

**Validation**:
- Workflow uses `npm ci` command in installation step
- Dependencies match `package-lock.json` exactly
- Build is reproducible across multiple workflow runs

**Rationale**: Ensures constitution compliance (Principle II: Deterministic Build & Reproducible Output).

---

### C003: Test Gate Before Deployment

**Contract**: The workflow MUST run the full test suite (`npm test`) and MUST fail the entire workflow if any tests fail.

**Validation**:
- Workflow includes `npm test` step before build
- Test failures prevent deployment (workflow status: failed)
- Deployment only occurs when all 133 tests pass

**Rationale**: Prevents broken code from reaching production (quality gate).

---

### C004: Build Success Requirement

**Contract**: The workflow MUST run `npm run build` and MUST fail if the build produces any TypeScript errors, linting errors, or build failures.

**Validation**:
- Workflow includes `npm run build` step
- TypeScript compilation errors fail the workflow
- Build step completes with exit code 0 for success

**Rationale**: Ensures only valid, compile-passing code is deployed.

---

### C005: Deployment to gh-pages Branch

**Contract**: The workflow MUST deploy the contents of the `dist/` directory to the `gh-pages` branch as the source for GitHub Pages.

**Validation**:
- Workflow uses GitHub Pages deployment action
- `dist/` directory contents are published to `gh-pages` branch
- `gh-pages` branch contains built static files (HTML, JS, CSS)

**Rationale**: Follows GitHub Pages standard deployment pattern for build artifacts.

---

### C006: Deployment Time Limit

**Contract**: The entire workflow (install, test, build, deploy) MUST complete within 10 minutes from push to live deployment.

**Validation**:
- Measure workflow execution time in GitHub Actions logs
- Total duration < 10 minutes (600 seconds)
- GitHub Pages propagation included in measurement

**Success Criteria**: SC-004 requires <10 minute deployment time.

---

## Validation Checklist

**Pre-Deployment Validation**:
- [ ] Workflow file exists at `.github/workflows/deploy.yml`
- [ ] Workflow syntax is valid (no YAML errors)
- [ ] Workflow includes all required steps (checkout, setup, install, test, lint, build, deploy)
- [ ] Workflow uses `npm ci` (not `npm install`)
- [ ] Workflow has correct permissions (`contents: read`, `pages: write`, `id-token: write`)

**Post-Deployment Validation**:
- [ ] First push to `main` triggers workflow execution
- [ ] Test failures prevent deployment
- [ ] Build errors prevent deployment
- [ ] Successful build creates `gh-pages` branch
- [ ] GitHub Pages serves content from `gh-pages` branch
- [ ] Workflow completes in <10 minutes

## Test Strategy

**Automated Validation**:
- Workflow executes tests automatically (`npm test`)
- Workflow executes linter automatically (`npm run lint`)
- Workflow fails fast on any error

**Manual Validation**:
- Monitor first deployment in GitHub Actions tab
- Verify `gh-pages` branch created after successful deployment
- Check deployment time in workflow logs
- Test workflow failure scenarios (introduce failing test, verify deployment blocked)

## Error Handling

**Build Failures**: Workflow fails, deployment does not occur, developer notified via email/GitHub notification

**Test Failures**: Workflow fails at test step, build and deployment skipped

**Deployment Failures**: Workflow retries (GitHub Actions default), if persistent failure, developer intervention required

## Dependencies

- GitHub Actions service availability
- `npm ci` command (requires `package-lock.json`)
- `npm test` command (Jest test suite)
- `npm run lint` command (ESLint)
- `npm run build` command (TypeScript + Vite)
- GitHub Pages deployment action (peaceiris/actions-gh-pages@v3 or actions/deploy-pages@v4)

## Breaking Changes

**Workflow will fail if**:
- `package-lock.json` is missing or out of sync
- Any test fails
- TypeScript compilation errors exist
- ESLint warnings/errors exceed threshold
- Build process fails

**Recovery**: Fix the issue in code, push to `main` to retrigger deployment.
