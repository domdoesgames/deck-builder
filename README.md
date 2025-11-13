# Deck Builder

A card game deck management application with draw, discard, and play order mechanics.

![Deployment Status](https://github.com/<username>/deck-builder/actions/workflows/deploy.yml/badge.svg)

## Live Demo

**Public URL**: `https://<username>.github.io/deck-builder/`

*Note: Replace `<username>` with the GitHub username when the repository is pushed to GitHub.*

## Features

- **Draw System**: Deal hands from a shuffled deck with configurable hand size
- **Discard Mechanic**: Select and discard cards during discard phase
- **Play Order**: Sequence cards for play with visual ordering
- **Deck Reset**: Reset to initial state while preserving user settings
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
npm run build    # Build for production
npm test         # Run test suite (Jest)
npm run lint     # Run ESLint
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
│   └── WarningBanner.tsx
├── hooks/           # Custom React hooks
│   ├── useDeckState.ts
│   └── useDeckStatePersistence.ts
├── lib/             # Core game logic
│   ├── constants.ts
│   ├── types.ts
│   ├── shuffle.ts
│   ├── cardInstance.ts
│   ├── persistenceManager.ts
│   └── stateValidator.ts
├── state/           # State management
│   └── deckReducer.ts
└── App.tsx          # Root component

tests/
├── contract/        # Contract validation tests
├── integration/     # Integration tests
└── unit/           # Unit tests

specs/              # Feature specifications
├── 001-deck-mechanics/
├── 002-card-hand-display/
├── 003-card-discard-mechanic/
├── 004-card-play-order/
├── 005-spec-compliance-remediation/
├── 006-deck-reset/
└── 007-github-pages-deployment/
```

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Deployment Process

1. **Push to Main**: Merge changes to the main branch
2. **GitHub Actions**: Workflow runs tests, linter, and builds production assets
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

---

**Note**: This README will be updated with the actual GitHub username and public URL once the repository is pushed to GitHub.
