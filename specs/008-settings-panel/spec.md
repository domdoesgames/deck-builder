# Feature Specification: Collapsible Settings Panel

**Feature Branch**: `008-settings-panel`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "I want the page to be cleaner, and the user to only access the settings when they need to."

## Clarifications

### Session 2025-11-14

- Q: When an error occurs while settings are hidden, should the system automatically expand the settings panel, or display the error separately while keeping settings collapsed? → A: Auto-expand settings panel - Automatically open the settings panel to show the error in its original context near the JSON input
- Q: Where should the settings toggle control be positioned on the page? → A: Top of settings area - Toggle appears just above where settings panel would be (collapsed/expanded in place)
- Q: What text should appear on the toggle control to label it? → A: Settings

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide Settings by Default (Priority: P1)

Users can view the main game interface without visual clutter from configuration controls, allowing them to focus on gameplay.

**Why this priority**: This is the core value proposition - reducing visual noise on the page. Most users spend the majority of their time playing, not adjusting settings.

**Independent Test**: Can be fully tested by loading the page and verifying that settings controls (hand size, discard count, reset button, JSON override) are hidden by default, and the main game elements are prominently displayed.

**Acceptance Scenarios**:

1. **Given** a user loads the page for the first time, **When** the page renders, **Then** the settings controls are not visible and the game interface is clean
2. **Given** a user is playing the game, **When** they look at the page, **Then** only the essential game elements (hand, pile counts, end turn button) are visible

---

### User Story 2 - Toggle Settings Visibility (Priority: P1)

Users can show and hide settings controls with a single click, accessing configuration when needed without permanent screen real estate cost.

**Why this priority**: This enables the core functionality - users must be able to access settings when they need them. Without this, P1 would make settings inaccessible.

**Independent Test**: Can be fully tested by clicking the settings toggle control and verifying that settings appear/disappear, and the toggle state is visually indicated.

**Acceptance Scenarios**:

1. **Given** settings are hidden, **When** user clicks the settings toggle, **Then** all settings controls become visible
2. **Given** settings are visible, **When** user clicks the settings toggle again, **Then** all settings controls are hidden
3. **Given** settings are visible, **When** user makes configuration changes, **Then** the changes persist even after hiding settings
4. **Given** settings are toggled multiple times, **When** checking the toggle control, **Then** it clearly indicates the current state (open/closed)

---

### User Story 3 - Persist Settings Visibility Preference (Priority: P2)

Users' choice to show or hide settings persists across page reloads, so they don't need to re-toggle their preference every session.

**Why this priority**: Quality of life improvement that respects user preference, but the feature is functional without it.

**Independent Test**: Can be fully tested by toggling settings visibility, reloading the page, and verifying the settings visibility matches the user's last choice.

**Acceptance Scenarios**:

1. **Given** user has expanded settings, **When** they reload the page, **Then** settings remain expanded
2. **Given** user has collapsed settings, **When** they reload the page, **Then** settings remain collapsed
3. **Given** user has never toggled settings, **When** they load the page, **Then** settings default to collapsed

---

### User Story 4 - Error-Triggered Settings Expansion (Priority: P1)

When an error occurs while settings are hidden, the system automatically expands the settings panel to show the error in context, helping users quickly identify and fix the issue.

**Why this priority**: Critical for usability - users need to see errors in context to understand what went wrong and how to fix it.

**Independent Test**: Can be fully tested by entering invalid JSON while settings are collapsed, triggering an error, and verifying the settings panel automatically expands to reveal the error message.

**Acceptance Scenarios**:

1. **Given** settings are hidden and user triggers a validation error, **When** the error occurs, **Then** the settings panel automatically expands to show the error in context
2. **Given** settings auto-expanded due to an error, **When** user fixes the error, **Then** settings remain expanded until user manually collapses them
3. **Given** settings are already visible, **When** an error occurs, **Then** settings remain visible (no change in state)

---

### Edge Cases

- What happens when settings are hidden but a validation error occurs (e.g., invalid JSON entered before hiding)? → Settings automatically expand to show error in context
- How does the toggle control behave on very small screens where space is limited?
- What if a user has settings expanded and the page layout changes (e.g., window resize)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hide all settings controls (hand size, discard count, reset button, JSON override) by default on page load
- **FR-002**: System MUST provide a toggle control labeled "Settings" positioned at the top of the settings area (just above where settings panel appears)
- **FR-003**: Users MUST be able to expand settings with a single click/tap
- **FR-004**: Users MUST be able to collapse settings with a single click/tap
- **FR-005**: System MUST preserve all setting values when toggling visibility (hiding settings does not reset them)
- **FR-006**: System MUST clearly indicate whether settings are currently visible or hidden through the toggle control's appearance
- **FR-007**: System MUST persist the user's settings visibility preference across page reloads
- **FR-008**: System MUST automatically expand the settings panel when an error occurs while settings are hidden, showing the error in its original context
- **FR-009**: Settings toggle control MUST remain accessible and visible at all times regardless of settings visibility state
- **FR-010**: System MUST maintain keyboard accessibility for the settings toggle control
- **FR-011**: System MUST keep settings expanded after auto-expansion due to error until user manually collapses them
- **FR-012**: Settings panel MUST expand and collapse in place directly below the toggle control

### Key Entities

- **Settings Panel State**: Boolean flag indicating whether settings are visible or hidden, stored in browser storage for persistence
- **Settings Group**: Collection of all configuration controls (Deck Controls and JSON Override components)
- **Toggle Control**: Interactive element labeled "Settings", positioned at the top of the settings area, always visible, indicating current state through appearance

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page load displays only essential game controls, reducing visual elements by at least 50% when settings are hidden
- **SC-002**: Users can toggle settings visibility in a single interaction (one click)
- **SC-003**: Settings visibility preference persists across 100% of page reloads
- **SC-004**: All setting values remain unchanged when toggling visibility (no data loss)
- **SC-005**: Toggle control state clearly indicates settings visibility status to users
- **SC-006**: Error-triggered settings expansion occurs within 100 milliseconds of error detection
