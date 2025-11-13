/**
 * Card instance utilities for generating unique card instances in the hand.
 * Each card dealt from the deck gets a unique instance ID for selection tracking.
 */

import type { Card, CardInstance } from './types';

/**
 * Generates a unique UUID using crypto.randomUUID() with fallback.
 * Fallback implementation for browsers that don't support crypto.randomUUID().
 */
function generateUUID(): string {
  // Modern browsers support crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a CardInstance from a Card with a unique instance ID.
 * @param card - The card data to wrap
 * @returns A new CardInstance with unique ID
 */
export function generateCardInstance(card: Card): CardInstance {
  return {
    instanceId: generateUUID(),
    card,
  };
}
