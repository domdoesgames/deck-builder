#!/usr/bin/env node
/**
 * Build-Time Preset Deck Validator (Feature 009 - Phase 6)
 * 
 * Validates all preset decks at build time to catch configuration errors early.
 * Exits with code 1 if any preset deck is invalid, preventing deployment of broken configs.
 * 
 * Usage:
 *   npm run validate:presets
 *   node scripts/validate-presets.ts
 */

import { PRESET_DECKS } from '../src/lib/presetDecks.js';
import { validatePresetDeck } from '../src/lib/presetDeckValidator.js';

/**
 * Main validation function
 * Validates all preset decks and reports results
 */
function validateAllPresetDecks(): boolean {
  console.log('🔍 Validating preset decks...\n');
  
  let allValid = true;
  let validCount = 0;
  let invalidCount = 0;
  
  PRESET_DECKS.forEach((preset, index) => {
    const result = validatePresetDeck(preset);
    
    if (result.isValid) {
      validCount++;
      console.log(`✅ [${index + 1}/${PRESET_DECKS.length}] ${preset.name} (${preset.id})`);
    } else {
      invalidCount++;
      allValid = false;
      console.error(`❌ [${index + 1}/${PRESET_DECKS.length}] ${preset.name} (${preset.id})`);
      result.errors.forEach(error => {
        console.error(`   ⚠️  ${error}`);
      });
      console.error('');
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Validation Summary:`);
  console.log(`   Total presets: ${PRESET_DECKS.length}`);
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ❌ Invalid: ${invalidCount}`);
  console.log('='.repeat(60) + '\n');
  
  return allValid;
}

// Run validation
const isValid = validateAllPresetDecks();

if (isValid) {
  console.log('✨ All preset decks are valid!\n');
  process.exit(0);
} else {
  console.error('💥 Preset deck validation failed!');
  console.error('Please fix the errors above before building or deploying.\n');
  process.exit(1);
}
