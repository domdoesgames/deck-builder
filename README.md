# Deck Builder

A card game deck management application with draw, discard, and play order mechanics.

![Deployment Status](https://github.com/domdoesgames/deck-builder/actions/workflows/deploy.yml/badge.svg)

## Live Demo

**Public URL**: `https://domdoesgames.github.io/deck-builder/`

## Features

- **Draw System**: Deal hands from a shuffled deck with configurable hand size
- **Discard Mechanic**: Select and discard cards during discard phase
- **Play Order**: Sequence cards for play with visual ordering
- **Deck Reset**: Reset to initial state while preserving user settings
- **Preset Decks**: Quick deck selection from curated preset configurations
- **Custom Decks**: JSON override for loading custom deck definitions
- **Persistence**: Game state saved to browser localStorage
- **Turn Tracking**: Monitor turn count and deck status

## Development

### Prerequisites

- Node.js 18+ (tested with Node.js 20)
- npm 8+

### Installation

```bash
npm install
```

### Available Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production (includes preset deck validation)
npm test         # Run test suite (Jest)
npm run lint     # Run ESLint
npm run validate:presets  # Validate preset deck definitions
```

### Testing

The project includes comprehensive test coverage:
- **Contract Tests**: Validate core game mechanics contracts
- **Integration Tests**: Test full user flows (draw, discard, play order)
- **Unit Tests**: Test individual components and utilities

Run tests with:

```bash
npm test
```

### Project Structure

```
src/
├── components/       # React UI components
│   ├── DeckControls.tsx
│   ├── HandView.tsx
│   ├── PileCounts.tsx
│   ├── PresetDeckSelector.tsx
│   ├── SettingsPanel.tsx
│   ├── JsonOverride.tsx
│   └── WarningBanner.tsx
├── hooks/           # Custom React hooks
│   ├── useDeckState.ts
│   ├── useDeckStatePersistence.ts
│   └── useSettingsVisibility.ts
├── lib/             # Core game logic
│   ├── constants.ts
│   ├── types.ts
│   ├── shuffle.ts
│   ├── cardInstance.ts
│   ├── persistenceManager.ts
│   ├── stateValidator.ts
│   ├── presetDecks.ts
│   └── presetDeckValidator.ts
├── state/           # State management
│   └── deckReducer.ts
└── App.tsx          # Root component

tests/
├── contract/        # Contract validation tests
├── integration/     # Integration tests
└── unit/           # Unit tests

scripts/
└── validate-presets.ts  # Build-time preset deck validation

specs/              # Feature specifications
├── 001-deck-mechanics/
├── 002-card-hand-display/
├── 003-card-discard-mechanic/
├── 004-card-play-order/
├── 005-spec-compliance-remediation/
├── 006-deck-reset/
├── 007-github-pages-deployment/
├── 008-settings-panel/
└── 009-preset-deck-selection/
```

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Deployment Process

1. **Push to Main**: Merge changes to the main branch
2. **GitHub Actions**: Workflow validates preset decks, runs tests, linter, and builds production assets
3. **Deploy**: Artifacts are deployed to GitHub Pages
4. **Live**: Updates appear at the public URL within 5-10 minutes

### Manual Deployment

To trigger a manual deployment:
1. Go to the repository's Actions tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button

### Local Preview

To preview the production build locally:

```bash
npm run build
npx vite preview --port 4173
```

Open `http://localhost:4173/deck-builder/` to view the production build with the correct base path.

## Adding New Preset Decks

Preset decks are defined in `src/lib/presetDecks.ts` and validated at build time. To add a new preset deck:

1. **Edit** `src/lib/presetDecks.ts` and add a new entry to the `PRESET_DECKS` array
2. **Follow the structure**:
   ```typescript
   {
     id: 'my-deck',              // Unique kebab-case ID
     name: 'My Deck',            // Display name (max 50 chars)
     description: 'Description', // Brief description (max 200 chars)
     cards: ['Card 1', 'Card 2'] // Array of card names (min 1 card)
   }
   ```
3. **Validate** by running `npm run validate:presets`
4. **Build** to ensure validation passes: `npm run build`

The build will fail if any preset deck is invalid, preventing deployment of broken configurations.

## Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Language**: TypeScript 5.3.3 (ES2022 target)
- **Styling**: Pico CSS 1.5.0
- **Testing**: Jest 29.7.0, React Testing Library 14.1.2
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages (static site)

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

Requires modern browser with ES2022 support and localStorage.

## Architecture

The application follows a unidirectional data flow pattern:
- **State**: Centralized in `deckReducer` using reducer pattern
- **Actions**: Dispatched from components via `useDeckState` hook
- **Persistence**: Automatic localStorage sync on state changes
- **Validation**: Contract-based validation for game rules

See individual feature specs in `specs/` for detailed documentation.

## Contributing

This is a learning/demonstration project. Feature development follows a specification-driven workflow:

1. **Specify**: Create feature spec with user stories and acceptance criteria
2. **Plan**: Design implementation with technical contracts
3. **Implement**: Build feature following contracts
4. **Validate**: Test against success criteria

See `specs/` directory for examples.

## License

MIT License - See LICENSE file for details (if applicable)
