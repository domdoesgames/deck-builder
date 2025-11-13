# Feature Specification: Deck Reset

**Feature Branch**: `006-deck-reset`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User description: "add a button to reset the entire system. On new page load and on reset, shuffle the deck before dealing the hand"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual System Reset (Priority: P1)

A user is testing different game scenarios and wants to quickly return the entire system to its initial state without reloading the page.

**Why this priority**: Core functionality requested by user. Enables rapid iteration during development and testing. Essential for any "start new game" workflow.

**Independent Test**: Can be fully tested by clicking a reset button and verifying all game state returns to initial conditions (fresh shuffled deck, new hand dealt, no cards selected/locked/played).

**Acceptance Scenarios**:

1. **Given** a game in progress with cards drawn, discarded, and play order selected, **When** user clicks the reset button, **Then** all cards return to a freshly shuffled deck and a new hand is dealt
2. **Given** user has modified hand size or discard count settings, **When** user clicks reset, **Then** these settings are preserved but all game state resets
3. **Given** cards are in play order locked state, **When** user resets, **Then** play order is cleared and cards return to normal interactive state
4. **Given** persisted state exists in localStorage, **When** user resets, **Then** persisted state is cleared and replaced with fresh initial state

---

### User Story 2 - Automatic Shuffle on Page Load (Priority: P1)

A user loads the application for the first time or refreshes the page, expecting a randomized deck rather than a predictable card order.

**Why this priority**: Core functionality explicitly requested. Without shuffle on load, every session starts with identical card order, breaking game immersion and testing value.

**Independent Test**: Can be fully tested by loading the page multiple times and verifying the initial hand contains different cards in different orders across loads.

**Acceptance Scenarios**:

1. **Given** user loads the page for the first time, **When** the application initializes, **Then** the deck is shuffled before the initial hand is dealt
2. **Given** user refreshes the page mid-game, **When** the application initializes, **Then** a fresh shuffled deck is created and dealt
3. **Given** no persisted state exists, **When** page loads, **Then** shuffle operation completes before any UI renders the hand

---

### User Story 3 - Reset Performance and Feedback (Priority: P2)

A user clicks reset and expects immediate visual feedback that the operation completed successfully.

**Why this priority**: Enhances user experience but not critical to core functionality. The reset will work without explicit feedback, but user confidence improves with clear confirmation.

**Independent Test**: Can be tested by measuring reset operation completion time and observing UI state changes.

**Acceptance Scenarios**:

1. **Given** user clicks reset button, **When** reset operation executes, **Then** operation completes in under 500ms
2. **Given** reset button is clicked, **When** operation is in progress, **Then** button is disabled to prevent double-clicks
3. **Given** reset completes successfully, **When** new state is ready, **Then** UI immediately reflects fresh hand with no stale data

---

### Edge Cases

- What happens when reset is triggered while animations are in progress (card selection, discard, etc.)?
- How does system handle reset if localStorage write fails?
- What happens if user rapidly clicks reset multiple times?
- What if shuffle operation is interrupted during page load (user navigates away)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a user-accessible button to trigger complete system reset
- **FR-002**: System MUST reset all game state to initial conditions when reset is triggered (deck, hand, discard pile, play pile, card selection, play order)
- **FR-003**: System MUST preserve user configuration settings during reset (hand size, discard count, any UI preferences)
- **FR-004**: System MUST shuffle the deck before dealing the initial hand on every page load
- **FR-005**: System MUST shuffle the deck before dealing a fresh hand on every manual reset
- **FR-006**: System MUST clear persisted state from localStorage when reset is triggered
- **FR-007**: System MUST disable reset button during reset operation to prevent concurrent resets
- **FR-008**: System MUST complete reset operation in under 500ms for standard 52-card deck
- **FR-009**: System MUST use existing shuffle algorithm (src/lib/shuffle.ts) for consistency
- **FR-010**: Reset button MUST be clearly labeled and positioned in DeckControls component
- **FR-011**: System MUST unlock any locked play order state when reset is triggered
- **FR-012**: System MUST clear any active card selections when reset is triggered
- **FR-013**: Initial shuffle on page load MUST complete before hand is rendered to user

### Key Entities

- **Reset Operation**: Represents the complete state transition from current game state to fresh initial state, including deck shuffle, hand dealing, pile clearing, and persistence updates
- **Initial State**: The canonical starting point for all game sessions - empty piles, unselected cards, unlocked play order, freshly shuffled and dealt deck

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can trigger system reset via single button click
- **SC-002**: Reset operation completes in under 500ms (measurable via performance timing)
- **SC-003**: Loading the page 10 times produces 10 different initial hands (verifies shuffle randomness)
- **SC-004**: After reset, all game state matches fresh page load state (no residual selections, locks, or cards in piles)
- **SC-005**: User settings (hand size, discard count) survive reset operation
- **SC-006**: Reset button becomes disabled during operation and re-enables on completion
- **SC-007**: Persisted localStorage state is cleared and replaced with fresh state after reset
- **SC-008**: Existing 106 tests continue to pass after reset feature implementation (no regressions)

## Assumptions

- No confirmation dialog is needed before reset (user can always reset again if accidental)
- Reset button will be placed in DeckControls component alongside other deck management controls
- Shuffle algorithm at src/lib/shuffle.ts is sufficient for both page load and reset scenarios
- "Entire system" means all game state, not user preferences (hand size, discard count preserved)
- Reset is a synchronous operation (no server communication required)
- Existing persistence manager handles localStorage operations (no new storage mechanisms needed)
