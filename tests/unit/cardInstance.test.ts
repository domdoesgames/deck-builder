/**
 * Unit tests for cardInstance utilities
 * Feature 003: Card Discard Mechanic
 */

import { describe, it, expect } from '@jest/globals';
import { generateCardInstance } from '../../src/lib/cardInstance';

describe('generateCardInstance', () => {
  it('should generate a unique CardInstance with instanceId and card', () => {
    const card = 'Card 1';
    const instance = generateCardInstance(card);

    expect(instance).toHaveProperty('instanceId');
    expect(instance).toHaveProperty('card');
    expect(instance.card).toBe(card);
    expect(typeof instance.instanceId).toBe('string');
    expect(instance.instanceId.length).toBeGreaterThan(0);
  });

  it('should generate unique instanceIds for the same card', () => {
    const card = 'Card 1';
    const instance1 = generateCardInstance(card);
    const instance2 = generateCardInstance(card);

    expect(instance1.instanceId).not.toBe(instance2.instanceId);
  });

  it('should generate valid UUID format (v4)', () => {
    const card = 'Card 1';
    const instance = generateCardInstance(card);
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(instance.instanceId).toMatch(uuidRegex);
  });

  it('should handle different card values', () => {
    const cards = ['Card 1', 'Card 2', 'Card 52'];
    const instances = cards.map(generateCardInstance);

    instances.forEach((instance, index) => {
      expect(instance.card).toBe(cards[index]);
      expect(instance.instanceId).toBeTruthy();
    });

    // All should have unique IDs
    const ids = instances.map(i => i.instanceId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(cards.length);
  });
});
