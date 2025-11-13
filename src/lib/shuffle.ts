/**
 * Fisher-Yates shuffle algorithm using crypto.getRandomValues with fallback to Math.random
 * Returns a new shuffled array (does not mutate input)
 * 
 * Implementation note: Uses unbiased shuffle for fair card distribution.
 * No seeded reproducibility required for MVP (see data-model.md future extension).
 */
export function shuffle(cards: string[]): string[] {
  const result = [...cards]
  
  for (let i = result.length - 1; i > 0; i--) {
    // Generate random index from 0 to i (inclusive)
    const j = randomInt(i + 1)
    
    // Swap elements
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  
  return result
}

/**
 * Generate a random integer in range [0, max)
 * Uses crypto.getRandomValues for cryptographic randomness with Math.random fallback
 */
function randomInt(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % max
  }
  
  // Fallback to Math.random
  return Math.floor(Math.random() * max)
}
