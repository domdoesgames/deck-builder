# Quickstart: Deck Mechanics Feature

## Prerequisites
- Node.js >=18
- npm or pnpm

## Install
```bash
npm install
```
(After dependencies added: react, react-dom, pico.css, jest, @testing-library/react)

## Development
```bash
npm run dev    # Vite dev server
```
Open http://localhost:5173

## Build
```bash
npm run build  # Produces dist/ (deterministic)
```
Serve with any static server: `npx serve dist`

## Running Tests
```bash
npm test       # Jest + RTL
```
(Consider future migration: `vitest run`)

## Core Files
- `src/lib/shuffle.ts` Fisher-Yates implementation
- `src/hooks/useDeckState.ts` Encapsulates reducer & API to UI
- `src/components/DeckControls.tsx` Hand/discard size selects + end turn
- `src/components/JsonOverride.tsx` Text area + apply button
- `src/components/HandView.tsx` Displays cards
- `src/components/PileCounts.tsx` Draw/discard/turn indicators
- `src/components/WarningBanner.tsx` Warnings/errors

## Typical Flow
1. User adjusts hand size & discard count.
2. User presses End Turn to cycle hand.
3. When drawPile exhausted mid-deal, automatic reshuffle occurs.
4. User pastes JSON deck override; empty list triggers revert + warning.
5. Mid-turn parameter or deck changes cause immediate reset & re-deal.

## Accessibility Checklist (Manual)
- Landmarks: header/main/footer present
- All interactive elements have discernible text labels
- Focus outline visible for controls
- Color contrast verified (Pico defaults)

## Troubleshooting
- Warning about insufficient cards: deck smaller than requested hand size after reshuffle
- Empty override revert: Confirm default deck loaded
- Duplicate cards appear: expected (feature allows duplicates)

## Next Steps
- Implement tests in `tests/`
- Monitor dist/ size growth (<20% threshold)
