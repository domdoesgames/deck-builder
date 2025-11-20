# Feature Specification: Preset Deck Selection

**Feature Branch**: `009-preset-deck-selection`  
**Created**: 2025-11-19  
**Status**: Draft  
**Input**: User description: "As well as the JSON override, I want users to be able to select from a pre-created list of decks. To start with, this will just be one deck, but will grow over time. These decks should be managed within code."

## Clarifications

### Session 2025-11-19

- Q: Where should the preset deck selection interface be located for users to access it? → A: Within the existing settings panel as a new section
- Q: How should detailed deck information be displayed when a user wants to view it? → A: Expandable/collapsible section within the preset deck list entry
- Q: Should the user's last selected preset deck be remembered across browser sessions? → A: Yes, persist to localStorage and restore on application load
- Q: What should users see when no preset decks are available (empty list scenario)? → A: Informative message with guidance
- Q: How should the system handle a preset deck that fails validation (corrupted or invalid card structure)? → A: Provide validation as part of Github actions, so that they must be valid before a deployment. If this gets deployed, use option A (hide the invalid deck from the list entirely)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Preset Deck from List (Priority: P1)

A user wants to quickly start playing with a pre-configured deck without having to manually create or load a JSON configuration. They open the application, navigate to the settings panel, and see a list of available preset decks in a dedicated section, select one, and immediately start playing with that deck configuration.

**Why this priority**: This is the core MVP feature - enabling users to select from curated deck options. It provides immediate value by offering a no-configuration-required gameplay experience and is the foundation for all other preset deck functionality.

**Independent Test**: Can be fully tested by displaying a list of preset decks in the UI, allowing selection of one deck, and loading that deck configuration into the game state. Delivers standalone value by enabling instant gameplay with curated decks.

**Acceptance Scenarios**:

1. **Given** the application loads, **When** the user opens the settings panel, **Then** they see a preset deck selection section with a list of available preset decks showing identifying information (name, description)
2. **Given** a list of preset decks is displayed, **When** the user selects a preset deck, **Then** that deck configuration is loaded into the game state and gameplay begins with the selected deck
3. **Given** a preset deck is selected, **When** the user returns to the settings panel, **Then** the currently active preset deck is indicated (highlighted or marked as active) in the preset deck selection section

---

### User Story 2 - View Preset Deck Details (Priority: P2)

A user wants to understand what cards and configuration a preset deck contains before selecting it. They can preview the deck composition, card types, and quantities by expanding the deck entry to make an informed choice about which deck to play with.

**Why this priority**: This enhances the user experience by providing transparency about deck contents, but the core functionality (P1) can work without detailed previews - users can still select and play with preset decks.

**Independent Test**: Can be tested by clicking on a preset deck entry to expand it and viewing its detailed composition (card list, quantities, descriptions) without loading it into the game. Delivers value by helping users make informed deck choices.

**Acceptance Scenarios**:

1. **Given** a list of preset decks is displayed, **When** the user clicks a deck entry to expand it, **Then** detailed information about the deck is shown in an expanded section (card names, quantities, total card count, deck description)
2. **Given** deck details are displayed in an expanded section, **When** the user decides to use the deck, **Then** they can select it directly from the expanded view
3. **Given** deck details are displayed, **When** the user clicks the deck entry again or clicks another deck, **Then** the expanded section collapses and returns to the compact deck list view

---

### User Story 3 - Switch Between Preset and Custom Decks (Priority: P3)

A user wants the flexibility to switch between using a preset deck and a custom JSON configuration. They can choose a preset deck for quick play, or switch to the JSON override feature for custom configurations, and move back and forth as needed.

**Why this priority**: This ensures preset decks integrate well with existing functionality, but both features can work independently - this is about user experience polish and workflow flexibility.

**Independent Test**: Can be tested by loading a preset deck, then using JSON override to load a custom deck, then selecting a preset deck again. Delivers value by providing workflow flexibility without forcing users into one mode.

**Acceptance Scenarios**:

1. **Given** a preset deck is loaded, **When** the user activates the JSON override feature, **Then** the custom JSON configuration replaces the preset deck
2. **Given** a custom JSON deck is loaded, **When** the user selects a preset deck, **Then** the preset configuration replaces the custom configuration
3. **Given** the user switches between preset and custom decks, **When** they return to a previously used mode or reload the application, **Then** the system restores their last selection in that mode from persistent storage

---

### Edge Cases

- What happens when no preset decks are available (empty list)? System displays an informative message directing users to the JSON override feature
- How does the system handle preset deck data that becomes corrupted or invalid? Invalid decks are filtered out during validation and hidden from the user interface; a build-time validation step prevents invalid decks from being deployed
- What happens if a user tries to modify a preset deck directly?
- How does the system behave when preset decks are added or removed in code updates?
- What happens if a user has a custom deck loaded when preset decks become available?
- What happens if the persisted preset deck identifier no longer exists in the updated code?
- How does the system handle localStorage failures or quota exceeded errors when persisting preset deck selection?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a curated list of preset deck configurations managed in code
- **FR-002**: System MUST display available preset decks within the settings panel with identifying information (name, description at minimum)
- **FR-003**: Users MUST be able to select a preset deck from the available list
- **FR-004**: System MUST load the selected preset deck configuration into the game state, replacing any existing deck
- **FR-005**: System MUST clearly indicate which preset deck (if any) is currently active
- **FR-006**: System MUST start with at least one preset deck available
- **FR-007**: System MUST allow for future expansion to include additional preset decks without architectural changes
- **FR-008**: Preset deck configurations MUST be managed within the codebase (not loaded from external sources)
- **FR-009**: System MUST validate preset deck configurations to ensure they are playable (non-empty, valid card structure); invalid decks MUST be filtered out and hidden from the user interface
- **FR-010**: Users MUST be able to access preset deck selection through the settings panel while maintaining access to existing JSON override functionality
- **FR-011**: System MUST handle transitions between preset decks and custom JSON configurations without data loss
- **FR-012**: System MUST allow users to expand preset deck entries to view detailed card composition information
- **FR-013**: System MUST allow users to collapse expanded preset deck entries to return to the compact list view
- **FR-014**: System MUST persist the user's selected preset deck identifier across browser sessions
- **FR-015**: System MUST restore the user's last selected preset deck on application load if available and valid
- **FR-016**: System MUST display an informative message with guidance to alternative deck loading methods (JSON override) when no preset decks are available
- **FR-017**: Build/deployment pipeline MUST validate all preset deck configurations before deployment to prevent invalid decks from reaching production

### Key Entities

- **Preset Deck**: A pre-configured deck definition managed in code, containing a unique identifier, display name, description, and card configuration (card definitions and quantities)
- **Deck Configuration**: The complete specification of a deck including all cards, quantities, and metadata needed for gameplay
- **Active Deck Source**: An indicator of whether the current deck comes from a preset selection or custom JSON override

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select and load a preset deck in under 10 seconds from application start
- **SC-002**: 100% of preset deck configurations load successfully and are playable without errors
- **SC-003**: Users can identify available preset decks by name and description without confusion
- **SC-004**: System supports adding new preset decks without requiring changes to core deck management logic
- **SC-005**: Users can switch between preset decks and custom JSON configurations without losing their place or experiencing errors

## Assumptions

- Preset decks will use the same card structure and validation rules as custom JSON decks
- The initial preset deck will be suitable for demonstration and basic gameplay
- Preset deck definitions will be stored as code (TypeScript/JavaScript data structures) rather than external files
- The existing deck state management can accommodate preset deck loading without major refactoring
- Users will want to see basic information (name, description) before selecting a preset deck
- Future preset decks will follow the same structural pattern as the initial deck
- GitHub Actions workflow can execute validation logic during the build process
- Invalid preset decks reaching production is an exceptional/rare scenario due to build-time validation

## Dependencies

- Existing deck state management system (from previous features)
- Existing JSON override functionality (to ensure coexistence)
- Card definition and validation logic
- Browser localStorage API for persisting preset deck selection
- GitHub Actions CI/CD pipeline for build-time validation of preset decks

## Out of Scope

- User-created or user-submitted preset decks
- Online/cloud storage of preset decks
- Editing or modifying preset deck configurations through the UI
- Importing preset decks from external sources
- Social features (sharing, rating, commenting on preset decks)
- Advanced filtering or searching of preset decks (relevant only when many decks exist)
