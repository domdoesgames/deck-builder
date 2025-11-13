# Data Model: Deck Mechanics

## Entities

### Card
- id: string (label displayed)
- (Future) meta: optional object (NOT IN MVP)
Validation: non-empty string

### DeckState
- drawPile: string[] (top is index 0 after shuffle distribution)
- discardPile: string[]
- hand: string[]
- turnNumber: number (>=1)
- handSize: number (1..10)
- discardCount: number (>=1)
Derived:
- totalRemaining: drawPile.length + discardPile.length + hand.length

### UIFlags
- warning: string | null
- error: string | null
- isDealing: boolean

### UserInput
- jsonOverrideRaw: string
- parsedOverride: string[] | null
- validationStatus: 'valid' | 'error'
- errorMessage: string | null

## State Transitions

1. Initialize:
- Set default deck (array of >=20 predefined card ids)
- shuffle drawPile (initial shuffle optional—decision: preserve default order until first reshuffle)
- deal initial hand size H

2. End Turn:
- Move entire hand -> discardPile
- Deal new hand of size H via Draw Process

3. Draw Process:
- For i in 1..H: if drawPile empty -> reshuffle discardPile into new drawPile (Fisher-Yates), continue
- If after reshuffle insufficient cards: deal remaining; set warning

4. Parameter Change Mid-Turn:
- Clear hand, discardPile
- Reset drawPile to existing deck order (current list of remaining + discarded consolidated then reshuffled)
- Update handSize/discardCount
- Deal new hand

5. JSON Override Apply:
- Parse raw
- If empty array: warning; revert to default deck; discard & hand cleared; deal new hand
- If valid non-empty: replace deck list (drawPile), clear discardPile, hand cleared, deal new hand
- If duplicates: keep as-is
- If parse error: set error; no state mutation

## Validation Rules
- handSize: integer 1..10; UI restricts values
- discardCount: integer >=1; note full-hand discard behavior at End Turn independent
- jsonOverride: array of strings; disallow non-string elements
- On empty override: revert + warning

## Invariants
- No card instance exists in both drawPile and discardPile simultaneously
- Hand cards are removed from drawPile upon dealing
- After End Turn hand always empty before new deal
- Warning must clear on successful full hand deal next turn

## Error Cases
- Invalid JSON: show error; keep prior state
- Attempt End Turn while dealing: ignored

## Notes
- Potential future extension: seeded randomness for reproducible sessions
