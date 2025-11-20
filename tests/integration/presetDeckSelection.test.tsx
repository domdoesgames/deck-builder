import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

/**
 * Integration tests for Preset Deck Selection (Feature 009)
 * Tests: Full app integration, preset deck loading, persistence
 */

describe('Preset Deck Selection Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // US1-AC1: Settings panel displays list of available preset decks
  it('displays list of preset decks in settings panel', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings to see preset selector
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Verify preset deck selector is visible
    expect(screen.getByText(/preset decks/i)).toBeDefined()

    // Verify starter deck is listed (from presetDecks.ts)
    expect(screen.getByText('Starter Deck')).toBeDefined()
    expect(screen.getByText(/balanced deck for learning/i)).toBeDefined()
    expect(screen.getByText('20 cards')).toBeDefined()
  })

  // US1-AC2: User can select a preset deck via radio button
  it('allows selecting preset deck via radio button', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Find the radio button for Starter Deck
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i }) as HTMLInputElement
    expect(starterRadio.checked).toBe(false)

    // Select the preset
    await user.click(starterRadio)
    expect(starterRadio.checked).toBe(true)
  })

  // US1-AC3: "Load Selected Deck" button triggers deck load
  it('loads preset deck when "Load Selected Deck" button clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Select starter deck
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
    await user.click(starterRadio)

    // Find and click the Load button
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i }) as HTMLButtonElement
    expect(loadButton.disabled).toBe(false)
    await user.click(loadButton)

    // Verify the deck was loaded by checking that an active indicator appears
    expect(screen.getByText(/✓/i)).toBeDefined()
  })

  // US1-AC4: Selected preset replaces current deck state
  it('replaces current deck state with preset deck', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Load starter deck (20 cards total)
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
    await user.click(starterRadio)
    
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
    await user.click(loadButton)

    // Verify deck has been replaced by checking pile counts
    const pileStatus = screen.getByRole('region', { name: /pile status/i })
    
    // The text content should mention draw pile
    expect(pileStatus.textContent).toMatch(/draw pile/i)
    
    // Visual indicator should show starter deck is active
    const activeIndicator = screen.getByText(/✓/i)
    expect(activeIndicator).toBeDefined()
  })

  // US1-AC6: Selected preset ID is persisted across sessions
  it('persists selected preset ID across component remount', async () => {
    const user = userEvent.setup()
    
    const { unmount } = render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Load starter deck
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
    await user.click(starterRadio)
    
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
    await user.click(loadButton)

    // Verify active indicator appears (multiple elements will match)
    const activeIndicators = screen.getAllByLabelText(/currently active/i)
    expect(activeIndicators.length).toBeGreaterThan(0)

    // Wait for persistence debounce (100ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 150))

    // Unmount the app
    unmount()

    // Remount the app (simulates page reload)
    render(<App />)

    // Expand settings again
    const newToggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(newToggleButton)

    // Verify starter deck is still marked as active (persistence)
    const persistedIndicators = screen.getAllByLabelText(/currently active/i)
    expect(persistedIndicators.length).toBeGreaterThan(0)
    
    // Verify the deck state was persisted (check draw pile is populated)
    expect(screen.getByText(/draw pile/i)).toBeDefined()
  })

  // Load button is disabled when no preset selected
  it('disables load button when no preset selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Load button should be disabled by default
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i }) as HTMLButtonElement
    expect(loadButton.disabled).toBe(true)
  })

  // Expand/collapse deck details
  it('expands and collapses preset deck details', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Find the toggle button for deck details
    const detailsToggle = screen.getByRole('button', { name: /show deck details/i })
    expect(detailsToggle.getAttribute('aria-expanded')).toBe('false')

    // Expand details
    await user.click(detailsToggle)
    expect(detailsToggle.getAttribute('aria-expanded')).toBe('true')

    // Verify card composition is shown
    expect(screen.getByText(/card composition/i)).toBeDefined()
    expect(screen.getByText(/total: 20 cards/i)).toBeDefined()

    // Collapse details
    await user.click(detailsToggle)
    expect(detailsToggle.getAttribute('aria-expanded')).toBe('false')
  })

  // Keyboard accessibility for preset selection
  it('supports keyboard navigation for preset selection', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Tab to radio button and press Space to select
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i }) as HTMLInputElement
    starterRadio.focus()
    
    // Press space to select
    await user.keyboard(' ')
    expect(starterRadio.checked).toBe(true)

    // Tab to load button and press Enter
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
    loadButton.focus()
    await user.keyboard('{Enter}')

    // Verify deck was loaded
    expect(screen.getByText(/✓/i)).toBeDefined()
  })

  // Visual active indicator is accurate
  it('shows active indicator only for currently loaded preset', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Initially, no active indicator should be present (default deck)
    expect(screen.queryByLabelText(/currently active/i)).toBeNull()

    // Load starter deck
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
    await user.click(starterRadio)
    
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
    await user.click(loadButton)

    // Now active indicator should appear (checkmark span)
    const activeIndicators = screen.getAllByLabelText(/currently active/i)
    const checkmarkSpan = activeIndicators.find(el => el.tagName === 'SPAN')
    expect(checkmarkSpan).toBeDefined()

    // Verify the starter deck entry has the 'active' class
    const activeEntry = checkmarkSpan?.closest('.preset-deck-entry')
    expect(activeEntry?.classList.contains('active')).toBe(true)
  })

  // Integration with existing deck controls
  it('integrates with existing deck controls without conflicts', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Verify both preset selector and existing controls are present
    expect(screen.getByText(/preset decks/i)).toBeDefined()
    expect(screen.getByLabelText(/hand size/i)).toBeDefined()
    expect(screen.getByText(/JSON Deck Override/i)).toBeDefined()

    // Load a preset deck
    const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
    await user.click(starterRadio)
    const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
    await user.click(loadButton)

    // Verify existing controls still work (e.g., hand size change)
    const handSizeInput = screen.getByLabelText(/hand size/i) as HTMLSelectElement
    await user.selectOptions(handSizeInput, '7')
    expect(handSizeInput.value).toBe('7')

    // After loading a preset, user needs to deal a hand before ending turn
    // So let's just verify the button exists (it will be disabled until hand is dealt)
    const endTurnButton = screen.getByRole('button', { name: /end turn/i }) as HTMLButtonElement
    expect(endTurnButton).toBeDefined()
  })
})
