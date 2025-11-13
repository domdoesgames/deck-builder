// Default deck with minimum 20 cards as per FR-001
export const DEFAULT_DECK: string[] = [
  "Ace of Spades",
  "2 of Spades",
  "3 of Spades",
  "4 of Spades",
  "5 of Spades",
  "6 of Spades",
  "7 of Spades",
  "8 of Spades",
  "9 of Spades",
  "10 of Spades",
  "Jack of Spades",
  "Queen of Spades",
  "King of Spades",
  "Ace of Hearts",
  "2 of Hearts",
  "3 of Hearts",
  "4 of Hearts",
  "5 of Hearts",
  "6 of Hearts",
  "7 of Hearts",
  "8 of Hearts",
  "9 of Hearts",
  "10 of Hearts",
  "Jack of Hearts",
  "Queen of Hearts",
  "King of Hearts",
]

export const DEFAULT_HAND_SIZE = 5
export const DEFAULT_DISCARD_COUNT = 2

// Feature 005: Persistence constants
export const STORAGE_KEY = 'deck-builder-state'
export const PERSISTENCE_VERSION = 1

// Validation bounds (Feature 005)
export const MIN_HAND_SIZE = 1
export const MAX_HAND_SIZE = 10
export const MIN_DISCARD_COUNT = 0 // Feature 005: Zero discard is valid
export const MAX_DISCARD_COUNT = 20
