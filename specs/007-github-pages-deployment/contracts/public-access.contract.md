# Public Access Contract

**Feature**: GitHub Pages Public Deployment  
**Component**: Deployment Accessibility  
**Created**: 2025-11-13

## Purpose

This contract defines the requirements for public accessibility of the deployed deck builder application, ensuring users can access and use the application without barriers.

## Contracts

### C011: Public URL HTTP 200 Response

**Contract**: The public URL (`https://<username>.github.io/deck-builder/`) MUST return HTTP 200 status code for the index.html file.

**Validation**:
- Access public URL in web browser
- Check browser DevTools Network tab - index.html returns 200
- No redirects, no 404 errors, no 500 errors

**Rationale**: Basic accessibility requirement - users must be able to load the application entry point.

---

### C012: Zero Asset Loading Errors

**Contract**: All application assets (JavaScript files, CSS files, images) MUST load successfully with HTTP 200 status codes, with zero 404 errors.

**Validation**:
- Open public URL in browser
- Open DevTools Network tab
- Filter by "All" or "JS/CSS"
- Count failed requests (Status 404, 500, etc.)
- Expected: 0 failed requests

**Success Criteria**: SC-007 requires zero 404 errors on asset loading.

**Test Cases**:
1. JavaScript bundles load successfully (`/deck-builder/assets/*.js`)
2. CSS stylesheets load successfully (`/deck-builder/assets/*.css`)
3. No broken asset references in console

---

### C013: Interactive Load Time Under 3 Seconds

**Contract**: The application MUST become interactive (DOMContentLoaded + React hydration complete) within 3 seconds for users on standard broadband connections (5+ Mbps).

**Validation**:
- Open public URL in Chromium browser
- Open DevTools Performance tab
- Record page load
- Measure time from navigation start to "First Contentful Paint" and "Time to Interactive"
- Expected: < 3000ms

**Success Criteria**: SC-001 requires <3s load time.

**Test Environment**:
- Network: Throttle to "Fast 3G" or "Regular 3G" for worst-case testing
- Browser: Chrome/Edge latest version
- Cache: Disabled for initial load test

---

### C014: localStorage Persistence Across Reloads

**Contract**: User data saved in browser localStorage MUST persist across page reloads when accessing the public deployment.

**Validation**:
1. Open public URL
2. Perform user actions (draw hand, change settings, play cards)
3. Reload page (F5 or Ctrl+R)
4. Verify game state is restored (hand size, discard count, deck state)

**Functional Requirement**: FR-007 requires localStorage to work on public deployment.

**Test Cases**:
- Hand size setting persists after reload
- Discard count setting persists after reload
- Deck state (draw/discard piles) persists after reload

**Known Limitation**: localStorage is browser-specific; state does not sync across devices or browsers.

---

### C015: HTTPS Enforced

**Contract**: The public URL MUST be served over HTTPS (not HTTP) with a valid SSL/TLS certificate.

**Validation**:
- Access `https://<username>.github.io/deck-builder/`
- Check browser address bar for padlock icon
- Click padlock - verify "Connection is secure"
- Certificate issued by GitHub Pages (valid chain of trust)

**Success Criteria**: SC-008 requires A grade or higher SSL Labs assessment; FR-008 requires HTTPS.

**Test Methods**:
1. **Manual**: Check browser security indicator
2. **Automated**: `curl -I https://<username>.github.io/deck-builder/` returns HTTPS headers
3. **SSL Labs** (optional): Test at https://www.ssllabs.com/ssltest/ (should receive A or A+)

**GitHub Pages Default**: GitHub Pages provides HTTPS by default with automatic certificate renewal.

---

## Validation Checklist

**Pre-Deployment Validation**:
- [ ] GitHub Pages enabled in repository settings
- [ ] Deployment source set to `gh-pages` branch
- [ ] Repository is public (or Pro account for private repo Pages)

**Post-Deployment Validation**:
- [ ] Public URL loads without errors (HTTP 200)
- [ ] All assets load successfully (zero 404s in Network tab)
- [ ] Application becomes interactive in < 3 seconds
- [ ] localStorage saves and restores state across reloads
- [ ] HTTPS enforced (padlock icon visible)
- [ ] All application features work identically to local development

## Test Strategy

**Automated Validation**:
- Lighthouse CI (optional): Run Lighthouse performance audit in CI
- Uptime monitoring (optional): External service like UptimeRobot

**Manual Validation**:
- Browser DevTools Network tab for asset loading
- DevTools Performance tab for load time measurement
- Manual feature testing checklist (draw, discard, reset, play order)
- localStorage persistence test (reload page after state changes)

## Success Criteria Mapping

| Contract | Success Criterion |
|----------|------------------|
| C011 | SC-002 (99.9% uptime) - URL must be accessible |
| C012 | SC-007 (zero 404 errors) - All assets load |
| C013 | SC-001 (<3s load time) - Fast interactive load |
| C014 | FR-007 (localStorage persistence) - State saves |
| C015 | SC-008 (A grade HTTPS), FR-008 (HTTPS required) - Secure connection |

## Error Handling

**404 Errors**:
- Cause: Incorrect base path or missing files in gh-pages branch
- Resolution: Verify `vite.config.ts` base path matches repository name

**Slow Load Times**:
- Cause: Large bundle size, network latency, GitHub Pages CDN propagation
- Resolution: Optimize bundle (code splitting), wait for CDN propagation (up to 10 minutes)

**localStorage Failures**:
- Cause: Browser privacy settings, incognito mode
- Resolution: Application should gracefully fall back to in-memory state (already implemented)

**HTTPS Issues**:
- Cause: GitHub Pages HTTPS not yet provisioned
- Resolution: Wait 10-15 minutes after enabling Pages, check repository settings

## Dependencies

- GitHub Pages hosting service (HTTPS, CDN, uptime SLA)
- Modern web browser with localStorage support
- Internet connection (5+ Mbps for < 3s load time)

## Browser Compatibility

**Supported Browsers** (per FR-006):
- Chrome/Chromium (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

**Requirements**:
- ES2022 JavaScript support
- localStorage API support
- Modern CSS (Flexbox, Grid)

## Performance Benchmarks

**Target Metrics**:
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Total Bundle Size**: < 300KB (gzipped)
- **Lighthouse Performance Score**: > 90

**Actual Metrics** (measured after deployment):
- TBD: Measure and document actual load times
- TBD: Document bundle size from build output

## Rollback Strategy

If public URL fails accessibility validation:
1. **Immediate**: Revert to previous commit on main branch (triggers redeployment)
2. **Quick Fix**: Fix base path or configuration, push to main
3. **Disable**: Turn off GitHub Pages in repository settings (takes site offline)

## Monitoring (Optional)

**Uptime Monitoring**:
- UptimeRobot or similar service
- Monitor: `https://<username>.github.io/deck-builder/`
- Alert: Email notification on downtime
- Target: 99.9% uptime (SC-002)

**Performance Monitoring**:
- Google Lighthouse CI (automated audits)
- WebPageTest.org (manual testing)
- Target: Lighthouse Performance score > 90
