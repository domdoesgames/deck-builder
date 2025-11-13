# Feature Specification: Deck Mechanics

**Feature Branch**: `001-deck-mechanics`  
**Created**: 2025-11-12  
**Status**: Final  
**Input**: User description: "Deck Building: This app is designed to provide a decks of cards from a hardcoded list, with the ability to override the list using JSON input into a text area. The user will be able to select from a dropdown how many cards are dealt into a hand per turn, and how many are to be discarded per turn into a discard pile. The player can end a turn by pressing an \"end turn\" button, which will cause the hand to be discarded. If the player does not have enough cards in their draw pile, upon drawing enough cards to reach 0 cards in the draw pile, the discard pile is shuffled, and becomes the new draw pile, with the system dealing as many remaining cards needed to meet the number of cards that must be dealt."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deal & End Turn (Priority: P1)
Player loads the app (with default hardcoded deck) and sets hand size (cards dealt per turn) and discard count per turn; presses "End Turn" which discards the current hand and deals a new hand respecting reshuffle of discard pile when draw pile exhausted.

**Why this priority**: Core loop delivers immediate interactive value; without it the app does not demonstrate deck cycling.

**Independent Test**: Configure hand size=5, discard count=5, perform turns until draw pile exhaustion; verify reshuffle and continued dealing of exact hand size.

**Acceptance Scenarios**:
1. **Given** a fresh session with default deck of N cards, **When** player selects hand size H and presses End Turn first time, **Then** H distinct cards appear in hand and draw pile size reduces by H.
2. **Given** draw pile has fewer than H cards remaining (k < H), **When** player triggers deal for next turn, **Then** system deals k, reshuffles discard pile, continues dealing remaining H-k cards from new draw pile, resulting in full H-card hand.
3. **Given** a completed turn, **When** player presses End Turn, **Then** current hand cards move to discard pile and a new hand is dealt as per rules.

---

### User Story 2 - JSON Deck Override (Priority: P2)
User pastes a JSON array of card objects in a text area and applies it to replace the current deck before starting or mid-session (discard & draw piles reset, hand re-dealt from new deck).

**Why this priority**: Enables user customization beyond default deck; extends usefulness.

**Independent Test**: Provide JSON `["A","B","C","D","E","F"]`, hand size=3, verify sequences and reshuffle behavior match new set values only.

**Acceptance Scenarios**:
1. **Given** valid JSON list of M card identifiers (duplicates allowed), **When** user clicks "Apply Deck", **Then** draw pile resets to that list in defined initial order and discard pile clears.
2. **Given** invalid JSON (syntax error), **When** user clicks "Apply Deck", **Then** an error message appears and previous deck remains unchanged.
3. **Given** JSON with duplicate entries, **When** applied, **Then** duplicates are preserved (policy: duplicates ALLOWED; counts treated independently during shuffle/deal).
4. **Given** an empty JSON list, **When** applied, **Then** system shows warning and reverts to default deck list (policy: empty list not usable for play but does not error fatally).

---

### User Story 3 - Adjustable Parameters UI (Priority: P3)
User can change hand size and discard count dropdowns between turns; next deal uses new values without breaking card cycling integrity.

**Why this priority**: Parameter tuning enhances experimentation; not required for base loop.

**Independent Test**: Start with hand size=4; after two turns change to 6; verify next hand has 6 cards and reshuffle rules still apply.

**Acceptance Scenarios**:
1. **Given** hand size changed to H2 before a turn begins, **When** new hand is dealt, **Then** exactly H2 cards appear.
2. **Given** discard count D different from hand size H, **When** End Turn pressed, **Then** ENTIRE hand is discarded regardless of D (policy: discard count applies only to immediate pre-turn discard selection; end turn always discards full hand).
3. **Given** user changes hand size or discard count mid-turn (after cards shown), **When** change applied, **Then** current turn resets immediately: hand cleared, piles reset according to new parameters, fresh hand dealt from current deck state (policy: immediate reset for mid-turn changes).

---

### Edge Cases
- Applying JSON override mid-turn: immediate reset of hand and piles; new hand dealt from override deck (policy confirmed).
- Empty JSON list provided → system reverts to default deck with warning (policy confirmed).
- Discard count greater than hand size → entire hand discarded (consistent with full-hand discard policy).
- Hand size greater than remaining cards + discard pile total → After reshuffle still insufficient; final hand size < selected (MUST show warning).
- Rapid consecutive End Turn presses → Must not double-discard or skip dealing.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST initialize with a default hardcoded deck list (minimum 20 cards).
- **FR-002**: System MUST allow user to set hand size (integer >=1) via dropdown before a turn deals.
- **FR-003**: System MUST allow user to set discard count (integer >=1) via dropdown before End Turn.
- **FR-004**: System MUST deal exactly hand size H cards each turn unless total remaining + reshuffle insufficient; then MUST deal all remaining and show user notice.
- **FR-005**: System MUST discard hand cards per rule at End Turn and append them to discard pile (always full hand discard).
- **FR-006**: System MUST detect draw pile exhaustion mid-deal and reshuffle entire discard pile into a new draw pile seamlessly.
- **FR-007**: System MUST support deck override by valid JSON list input and reset draw + discard piles accordingly.
- **FR-008**: System MUST validate JSON and show error feedback for invalid syntax without altering current deck.
- **FR-009**: System MUST provide unbiased reshuffle using Fisher-Yates (or equivalent pseudo-random) shuffle algorithm; output varies per session (no seeded reproducibility required for MVP).
- **FR-010**: System MUST prevent overlapping turn operations (ignore End Turn while dealing in progress).
- **FR-011**: System MUST display counts: draw pile size, discard pile size, turn number.
- **FR-012**: System MUST provide clear warning if desired hand size cannot be met even after reshuffle.
- **FR-013**: System MUST allow parameter changes (hand size, discard count) effective immediately if changed mid-turn via reset; otherwise next deal only.
- **FR-014**: System MUST allow duplicate cards in override deck; duplicates treated as independent instances.
- **FR-015**: System MUST cap maximum hand size at a reasonable limit (e.g., 10) to avoid UI overflow.
- **FR-016**: System MUST revert to default deck with warning when empty JSON list provided.

### Key Entities *(include if feature involves data)*
- **Card**: Identifier (string); no intrinsic attributes for prototype beyond label.
- **DeckState**: drawPile (ordered list), discardPile (ordered list), hand (list), turnNumber (int), handSize (int), discardCount (int).
- **UserInput**: jsonOverride (raw text), validationStatus (enum valid|error), errorMessage (string).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: User completes 15 consecutive turns with no errors or stuck states.
- **SC-002**: Reshuffle occurs correctly when draw pile depleted in 100% of observed depletion scenarios (manual test suite covering at least 3 different hand sizes).
- **SC-003**: JSON override accepted within 2 seconds and deck resets immediately thereafter.
- **SC-004**: All acceptance tests for clarification decisions pass (0 failing cases).
- **SC-005**: Empty JSON list attempt results in visible warning and default deck restoration within 2 seconds.

### Assumptions
- Prototype runs client-side only; no persistence beyond session memory.
- Random shuffle does not require seed reproducibility for MVP.
- UI framework unspecified; any implementation fulfilling interactions acceptable.

### Closed Clarifications
1. Discard behavior when discard count < hand size: End Turn always discards full hand; discard count applies only to pre-turn immediate discard selection phase (future enhancement may use partial discard).
2. Duplicate cards policy: Allowed; duplicates treated as independent instances throughout dealing and shuffling.
3. Mid-turn JSON override or parameter changes: Immediate reset of hand and piles; new configuration applied instantly.
4. Empty JSON list: Allowed input triggers warning and automatic revert to default deck.
