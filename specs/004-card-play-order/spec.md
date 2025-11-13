# Feature Specification: Card Play Order

**Feature Branch**: `004-card-play-order`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User description: "Once cards are discarded, we want to be able to play the remaining cards in hand in a specific order. Although this prototype doesn't do anything when 'playing' the card, we want to allow selection of the order, and lock it in so it cannot be changed, so that it can be show to another player when playing the game."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sequential Card Order Selection (Priority: P1)

After completing the discard phase, users can arrange their remaining cards into a specific play order by selecting them one at a time in the desired sequence. Each card is numbered as it's selected to show its position in the play order.

**Why this priority**: This is the core mechanic that enables ordered card play. Without the ability to define a play sequence, the feature cannot function. This provides immediate value by letting users make strategic decisions about card order.

**Independent Test**: Can be fully tested by completing a discard phase, selecting cards in a specific order (e.g., card A, then card B, then card C), and verifying each card displays its sequence number. Delivers value by enabling users to plan their strategy.

**Acceptance Scenarios**:

1. **Given** a user has 5 cards remaining after the discard phase, **When** the user clicks on cards in the order: 3rd card, 1st card, 5th card, 2nd card, 4th card, **Then** each card displays its sequence number (1-5) corresponding to the click order
2. **Given** a user has selected 3 out of 5 cards for play order, **When** viewing the interface, **Then** the 3 selected cards show sequence numbers 1, 2, 3, and the 2 unselected cards remain unnumbered
3. **Given** a user has not yet selected any cards for play order, **When** viewing the interface, **Then** all cards are selectable and none display sequence numbers
4. **Given** a user is in the play order selection phase, **When** the user clicks on an already-numbered card, **Then** that card is removed from the sequence and all subsequent cards have their numbers adjusted down (e.g., if card #2 is deselected, the old card #3 becomes #2, old #4 becomes #3, etc.)
5. **Given** a user navigates with keyboard only, **When** tabbing through cards and pressing Space or Enter to select, **Then** cards are selected in sequence, sequence numbers are displayed, and focus indicators are visible with 3:1 contrast ratio (WCAG 2.4.7)

---

### User Story 2 - Order Locking (Priority: P1)

Once all remaining cards have been assigned a play order, users can lock the sequence to prevent further changes. The locked order is permanent for the current turn and cannot be unlocked or modified.

**Why this priority**: Locking is essential to the feature's purpose - ensuring committed strategic decisions that can be shared with other players. Without locking, the order has no finality or trustworthiness.

**Independent Test**: Can be tested by assigning a play order to all remaining cards, clicking a "Lock Order" button, and verifying that cards can no longer be reordered. Delivers value by finalizing strategic decisions.

**Acceptance Scenarios**:

1. **Given** a user has assigned play order to all remaining cards, **When** the user clicks the "Lock Order" button, **Then** all cards become non-interactive and the play order is permanently fixed, and the status indicator transitions from "Planning" to "Executing"
2. **Given** a user has locked the play order, **When** attempting to click on any card, **Then** the card does not respond to clicks and the order remains unchanged
3. **Given** a user has assigned play order to only some cards (e.g., 3 out of 5), **When** viewing the interface, **Then** the "Lock Order" button is disabled or displays a message indicating all cards must be ordered first
4. **Given** a user has locked the play order, **When** viewing the interface, **Then** a visual indicator shows the order is locked (status badge displays "Executing", cards have disabled/locked styling, lock icon may be present)

---

### User Story 3 - Order Display for Sharing (Priority: P2)

After locking the play order, users can view a clear visual display of the locked sequence that can be manually shown to another player. The display automatically appears after locking and shows each card's final position in the execution order.

**Why this priority**: This enables the stated purpose of showing the order to another player through visual display. It provides transparency and verification of the committed strategy without requiring complex sharing infrastructure.

**Independent Test**: Can be tested by locking a play order and verifying the locked sequence is clearly displayed with all cards showing their final position numbers. Delivers value by making the locked order visible and shareable via screen display.

**Acceptance Scenarios**:

1. **Given** a user has locked the play order, **When** viewing the interface, **Then** the locked sequence is clearly displayed with each card showing its final position number (1st, 2nd, 3rd, etc.)
2. **Given** a user has locked the play order, **When** the lock completes, **Then** the display automatically shows the final execution order in a format that can be manually shown to another player (e.g., by physically showing the screen)
3. **Given** another player views the locked play order display, **When** looking at the screen, **Then** they can see the exact sequence of cards in the locked order with clear position indicators

---

### Edge Cases

- **What happens when the discard phase results in only 1 card remaining?** User must still "order" the single card (selecting it assigns it position #1) and lock the order to proceed
- **What happens when all cards are discarded (hand is empty after discard)?** No play order phase occurs; system skips directly to end of turn since there are no cards to order
- **Can the user reset/restart their play order selection before locking?** Yes - a "Clear Order" button allows users to deselect all cards at once and restart the ordering process from scratch before locking
- **What happens if the user refreshes the page during play order selection (before locking)?** The play order selections should be preserved to prevent loss of user work (if persistence is available; otherwise state is lost and user restarts from unlocked Planning phase)
- **What happens if the user refreshes the page after locking the order?** The locked play order must persist and remain locked (if persistence is available; otherwise state is lost and user restarts from unlocked Planning phase)
- **Can the user proceed to the next turn without locking the order?** No - the play order must be fully assigned and locked before the turn can end
- **When does the locked play order get cleared?** The locked order persists throughout the turn and across page refreshes, but automatically clears when a new hand is dealt and the system enters the next Planning phase

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initiate a play order phase immediately after the discard phase completes, when at least 1 card remains in hand
- **FR-002**: System MUST allow users to select cards individually in sequential order to define the play sequence (via mouse click, keyboard, or touch tap)
- **FR-003**: System MUST visually display a sequence number on each card as it is selected (1st card selected shows "1", 2nd shows "2", etc.)
- **FR-004**: System MUST allow users to deselect a previously ordered card, removing it from the sequence and adjusting all subsequent card numbers down by one
- **FR-005**: System MUST track the play order as an ordered list of card instance IDs, maintaining the sequence regardless of visual card position
- **FR-006**: System MUST provide a "Lock Order" action (button or similar) that becomes enabled only when all remaining cards have been assigned a sequence position
- **FR-007**: System MUST make the play order immutable once locked, preventing any further reordering, selection, or deselection of cards
- **FR-008**: System MUST persist the play order selection state across page refreshes before locking, or silently fall back to in-memory state if persistence fails
- **FR-009**: System MUST persist the locked play order across page refreshes after locking, or silently fall back to in-memory state if persistence fails
- **FR-010**: System MUST prevent users from ending their turn until the play order has been fully assigned to all cards and locked
- **FR-011**: System MUST skip the play order phase entirely when the hand is empty after the discard phase (0 cards remaining)
- **FR-012**: System MUST visually indicate when the play order is locked by updating the status badge to "Executing" and applying locked/disabled styling to cards (no major layout changes required)
- **FR-013**: System MUST display the locked play order in a clear, readable format showing each card's final sequence position
- **FR-014**: System MUST support keyboard navigation for play order selection (Tab to navigate cards, Space/Enter to select in sequence)
- **FR-015**: System MUST support basic touch interactions on mobile/tablet devices (tap to select/deselect cards, tap buttons)
- **FR-016**: System MUST provide clear status indicators showing: (a) how many cards have been ordered out of the total, (b) whether all cards are ordered, and (c) whether the order is locked
- **FR-017**: System MUST provide a "Clear Order" action (button or similar) that deselects all cards at once, allowing users to restart the ordering process from scratch before locking
- **FR-018**: System MUST disable the "Clear Order" action once the play order has been locked
- **FR-019**: System MUST automatically clear the locked play order state when a new hand is dealt, resetting to an unlocked Planning phase with no cards ordered
- **FR-020**: System MUST handle persistence failures gracefully by silently falling back to in-memory state without blocking feature functionality

### Key Entities

- **Play Order State**: Represents the current state of the play ordering process, including the ordered sequence of card instance IDs (up to 10 cards), whether all cards have been ordered, and whether the order is locked
- **Card Sequence Position**: Each card in the play order has a numeric position (1-based index) indicating when it will be played
- **Lock Status**: Boolean flag indicating whether the play order has been permanently locked and can no longer be modified

## Clarifications

### Session 2025-11-13

**Q1: Sharing/Display Mechanism for Locked Order**  
How should the locked play order be shared with another player?

**A1**: Visual display only - After locking, the system automatically displays the final execution order in a clear format. Users manually show their screen to another player (e.g., in-person or via screen sharing). No complex sharing infrastructure (URLs, codes, QR codes) is needed for this prototype.

**Q2: Reset/Clear Order Capability**  
Should users be able to quickly clear all play order selections and restart before locking?

**A2**: Yes - provide "Clear Order" button - This allows users to deselect all cards at once and restart the ordering process from scratch before locking, improving user experience when they want to completely reconsider their strategy.

**Q3: Phase Naming/Terminology**  
What should this phase be called in the user interface?

**A3**: Planning/Executing phases - Use "Planning" terminology when users are selecting the play order, and "Executing" terminology after the order is locked to indicate the transition from planning to execution phase.

**Q4: Turn Lifecycle Integration**  
When does the locked play order get cleared or reset in the game flow?

**A4**: Locked order persists until new hand is dealt, then clears when entering next Planning phase - This provides clear state transitions aligned with the game's natural cycle.

**Q5: Maximum Hand Size**  
What is the maximum expected hand size that the play order UI must support?

**A5**: Maximum 10 cards - This provides reasonable headroom beyond the typical 5-card scenario while keeping UI manageable for screen space and interaction design.

**Q6: Touch/Mobile Interaction Support**  
Should the play order feature support touch/mobile interaction patterns?

**A6**: Yes, support basic touch interactions - Tap to select/deselect cards and tap buttons. This ensures the prototype works on common devices without complex gestures, keeping implementation straightforward while maximizing accessibility.

**Q7: Planning-to-Executing Phase Transition**  
Does the UI change significantly when transitioning from "Planning" phase to "Executing" phase after locking?

**A7**: Visual indicator changes only - Status badge updates from "Planning" to "Executing", cards become non-interactive with locked styling. This provides clear feedback about the locked state without requiring complex layout shifts or transitions.

**Q8: Persistence Failure Handling**  
What should happen if the system fails to persist play order state (e.g., localStorage quota exceeded, browser privacy mode)?

**A8**: Silently fall back to in-memory state - No warning displayed, just don't persist. The feature continues to work within the current session.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can assign play order to a typical hand of 5 cards within 15 seconds on average, and to a maximum hand of 10 cards within 30 seconds
- **SC-002**: 100% of turns cannot proceed until the play order is fully assigned and locked, ensuring game rule enforcement
- **SC-003**: The sequence number display updates within 100ms of selecting or deselecting a card
- **SC-004**: 95% of users successfully complete their first play order assignment and locking without errors or confusion
- **SC-005**: Zero play orders can be modified after locking, ensuring order integrity and trustworthiness for sharing with other players
- **SC-006**: Locked play orders persist across page refreshes with 100% accuracy when persistence is available (same card order is restored); feature continues to function in-memory when persistence fails
