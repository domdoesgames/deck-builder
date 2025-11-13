# Feature Specification: Card Discard Mechanic

**Feature Branch**: `003-card-discard-mechanic`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User description: "We now need the discard mechanic to work. After being dealt a hand equal to the count of the hand size, the user must choose the number of cards specified in the discard count to remove from their hand."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Card Discard (Priority: P1)

After receiving a full hand of cards, users must select and discard the required number of cards before proceeding to the next turn. The system enforces the discard count requirement and provides clear feedback about selection progress.

**Why this priority**: This is the core mechanic that enables the game loop to function. Without the ability to discard cards, users cannot complete a turn cycle, making this the foundation for all subsequent features.

**Independent Test**: Can be fully tested by dealing a hand, requiring the user to select the specified number of cards to discard, and verifying the turn cannot end until the requirement is met. Delivers immediate value by completing the turn cycle.

**Acceptance Scenarios**:

1. **Given** a user has been dealt a full hand and the discard count is 3, **When** the user selects 3 cards and confirms the discard, **Then** those cards are removed from the hand and moved to the discard pile
2. **Given** a user has been dealt a full hand and the discard count is 2, **When** the user attempts to end their turn without selecting 2 cards, **Then** the system prevents the turn from ending and displays a message indicating how many cards must be discarded
3. **Given** a user has selected 1 card for discard and the discard count is 3, **When** viewing the interface, **Then** the system clearly shows "1 of 3 cards selected" or similar progress indicator
4. **Given** a user has selected 3 cards and the discard count is 3, **When** the user attempts to select a 4th card, **Then** the system prevents the selection and all unselected cards remain unselectable until a selected card is deselected

---

### User Story 2 - Card Selection Toggle (Priority: P2)

Users can select and deselect cards for discard, allowing them to change their mind before confirming the discard action. This provides flexibility in decision-making during the discard phase.

**Why this priority**: Enhances user experience by allowing thoughtful decision-making. Users should be able to reconsider their choices before committing to the discard.

**Independent Test**: Can be tested by selecting a card (marking it for discard), then deselecting it, and verifying the card is no longer marked. Delivers value by improving user control and reducing mistakes.

**Acceptance Scenarios**:

1. **Given** a user has selected 2 cards for discard, **When** the user clicks on one of the selected cards again, **Then** that card is deselected and the selection count decreases to 1
2. **Given** a user has reached the maximum discard count (e.g., 3 cards selected), **When** the user attempts to select a 4th card, **Then** the system prevents the selection and the 4th card remains unselected
3. **Given** a user has selected cards for discard, **When** the user has not yet confirmed the discard, **Then** selected cards are visually distinct from non-selected cards (e.g., highlighted border, opacity change, or similar visual indicator)

---

### User Story 3 - Discard Confirmation (Priority: P2)

Users must explicitly confirm their discard selection before cards are permanently removed from their hand. This prevents accidental discards and gives users a final review opportunity.

**Why this priority**: Prevents user errors and provides a clear action boundary between selection and execution. Important for user confidence but not blocking the core mechanic.

**Independent Test**: Can be tested by selecting the required number of cards, clicking a "Discard" or "Confirm" button, and verifying the cards are only removed after explicit confirmation. Delivers value by preventing mistakes.

**Acceptance Scenarios**:

1. **Given** a user has selected the required number of cards for discard, **When** the user clicks the "Discard" button, **Then** the selected cards are moved to the discard pile and removed from the hand
2. **Given** a user has selected the required number of cards, **When** viewing the interface, **Then** a "Discard" or "Confirm" button is enabled and clearly visible
3. **Given** a user has not yet selected the required number of cards, **When** viewing the interface, **Then** the "Discard" button is disabled or displays a message indicating more cards must be selected

---

### Edge Cases

- **What happens when the discard count equals the hand size?** User must discard all cards in hand, leaving an empty hand after the discard phase
- **What happens when the discard count is 0?** No discard phase occurs; user proceeds directly to the end of turn
- **What happens when the discard count exceeds the hand size?** System should cap the maximum discards at the current hand size (cannot discard more cards than you have)
- **What happens if the user refreshes the page during the discard phase?** The game state should persist, maintaining the current hand and discard requirement, but card selections are cleared (user must re-select cards)
- **Can the user draw more cards before completing the discard phase?** No - the discard phase must be completed before any other game actions are allowed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce a discard phase immediately after dealing a hand when the discard count is greater than 0
- **FR-002**: System MUST allow users to select individual cards from their hand for discard
- **FR-003**: System MUST visually distinguish selected cards from non-selected cards during the discard phase
- **FR-004**: System MUST display the current selection progress (e.g., "2 of 3 cards selected")
- **FR-005**: System MUST prevent users from ending their turn until exactly the required number of cards has been selected and discarded
- **FR-006**: System MUST allow users to deselect previously selected cards before confirming the discard
- **FR-007**: System MUST provide a confirmation action (button or similar) to finalize the discard of selected cards
- **FR-008**: System MUST move discarded cards from the hand to the discard pile when the discard is confirmed
- **FR-009**: System MUST handle edge cases where discard count is 0 (skip discard phase), equals hand size (discard all), or exceeds hand size (cap at hand size)
- **FR-010**: System MUST disable or hide the discard confirmation action until the exact required number of cards is selected
- **FR-011**: System MUST preserve game state (hand contents and discard requirement) across page refreshes, but card selections are cleared and must be re-selected
- **FR-012**: System MUST prevent the maximum selection from exceeding the discard count requirement
- **FR-013**: System MUST support keyboard navigation for card selection (Tab to navigate, Space/Enter to toggle selection)
- **FR-014**: System MUST provide multiple clear indicators of the discard phase state, including status text showing the requirement, interactive card states, and disabled non-discard actions

### Key Entities

- **Discard Phase State**: Represents the current state of the discard process, including which cards are selected for discard, how many cards must be discarded, and whether the discard requirement has been met
- **Card Selection**: Tracks individual cards marked for removal during the discard phase as a set of selected card instance IDs (unique identifiers that persist regardless of card position in the hand)
- **Card Instance ID**: Each card in the hand has a unique identifier assigned when dealt, enabling robust selection tracking across state changes

## Clarifications

### Session 2025-11-13

**Q1: State Recovery During Discard Phase**  
If a user refreshes the browser during the discard phase, what should happen to their card selections?

**A1**: Clear selections on refresh - The hand contents and discard requirement are preserved, but the user must re-select which cards to discard. This is simpler to implement and prevents potential state corruption issues.

**Q2: Card Unique Identification**  
How should cards be uniquely identified for selection tracking?

**A2**: Unique card instance IDs - Each card dealt has a unique instance ID that persists regardless of position. This provides robust tracking across state changes and easier debugging as the game mechanics grow more complex.

**Q3: Accessibility Requirements**  
What accessibility requirements should be included for the discard mechanic?

**A3**: Keyboard navigation support - Cards can be navigated and selected using keyboard (Tab, Space/Enter). This covers keyboard-only users and provides significant accessibility improvement. Full ARIA/screen reader support can be added later as a separate enhancement.

**Q4: Visual Phase Indicator**  
How should the system indicate to users that they are currently in the discard phase?

**A4**: Combined approach - Status text + card interaction states + disable other actions. Multiple indicators provide the clearest user experience, ensuring users immediately understand they're in a special phase with specific requirements.

**Q5: Cancel/Restart Selection Ability**  
Should users have the ability to quickly clear all selected cards and restart their selection?

**A5**: No "clear all" feature - Users can only deselect cards one at a time by toggling individual selections. This keeps the implementation simpler while still providing full control over the selection.

**Q6: Effective Discard Count Calculation**  
How should the system handle cases where the discard count exceeds the current hand size?

**A6**: Effective discard count formula - The system calculates the effective discard count as `Math.min(discardCount, handCards.length)`. This ensures users can never be required to discard more cards than they have in hand, automatically capping the requirement when necessary (e.g., if discardCount=5 but hand size=3, effective discard count=3).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the discard phase (select and discard required cards) within 10 seconds on average for a typical hand of 5-10 cards
- **SC-002**: 100% of turn cycles cannot proceed until the discard requirement is satisfied, ensuring game rule enforcement
- **SC-003**: 95% of users successfully complete their first discard action without errors or confusion
- **SC-004**: The selection state (which cards are selected) updates visually within 100ms of user interaction
- **SC-005**: Zero cards are discarded accidentally (all discards require explicit confirmation)
