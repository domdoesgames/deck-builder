# Internal Interaction Contracts: Deck Mechanics

## Overview
No external network API (static site). Contracts define internal function signatures.

## Functions

### shuffle(cards: string[]): string[]
- Returns new array shuffled using Fisher-Yates.
- Deterministic per call given Math.random/crypto state.

### dealNextHand(state: DeckState): DeckState
- Consumes state.drawPile; reshuffles discardPile when needed.
- Sets warning if insufficient cards.

### endTurn(state: DeckState): DeckState
- Moves full hand to discardPile then calls dealNextHand.

### applyJsonOverride(raw: string, state: DeckState): DeckState
- Parses JSON; on empty array revert to default deck; on error returns state with error flag.

### changeParameters(handSize: number, discardCount: number, state: DeckState, immediateReset: boolean): DeckState
- If immediateReset true, clears piles & hand then deals new hand.

## Type Definitions (TypeScript)
```ts
export interface DeckState {
  drawPile: string[];
  discardPile: string[];
  hand: string[];
  turnNumber: number;
  handSize: number;
  discardCount: number;
  warning: string | null;
  error: string | null;
  isDealing: boolean;
}
```

## Events (UI)
- UserAction: EndTurn
- UserAction: ApplyDeckOverride
- UserAction: ChangeHandSize
- UserAction: ChangeDiscardCount

Mapped to reducer actions with payload validation.
