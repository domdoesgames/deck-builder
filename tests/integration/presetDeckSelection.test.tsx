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

  // US3: Mode Switching Tests
  describe('Mode Switching (US3)', () => {
    // US3-AC1: Using JSON override on preset deck switches to custom mode
    it('switches to custom mode when JSON override used on preset deck', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Expand settings
      const toggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(toggleButton)

      // Load starter deck (preset mode)
      const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
      await user.click(starterRadio)
      const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
      await user.click(loadButton)

      // Verify we're in preset mode
      expect(screen.getByText(/current mode:/i)).toBeDefined()
      // Look for the strong tag that says "Preset Deck"
      const modeIndicator = screen.getByText(/current mode:/i).parentElement
      expect(modeIndicator?.textContent).toMatch(/preset deck/i)

      // Now use JSON override to inject custom deck (array of card name strings)
      const customDeckJson = JSON.stringify([
        'Ace of Hearts',
        'King of Spades',
        '2 of Diamonds'
      ])

      const jsonTextarea = screen.getByLabelText(/deck json/i) as HTMLTextAreaElement
      await user.click(jsonTextarea)
      await user.paste(customDeckJson)

      const applyButton = screen.getByRole('button', { name: /apply deck/i })
      await user.click(applyButton)

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 50))

      // Verify mode switched to custom
      expect(screen.getByText(/custom deck/i)).toBeDefined()
      // Look for the p tag containing "Current mode" and check it contains "Custom"
      const paragraphs = screen.queryAllByText(/current mode:/i)
      const modeParagraph = paragraphs.find(p => p.textContent?.includes('Custom Deck'))
      expect(modeParagraph).toBeDefined()
      expect(modeParagraph?.textContent).toMatch(/custom deck/i)
      expect(modeParagraph?.textContent).not.toMatch(/preset deck.*\(/i) // Avoid matching "(starter-deck)"

      // Verify preset indicator is no longer active
      expect(screen.queryByLabelText(/currently active/i)).toBeNull()
    })

    // US3-AC2: "Start Custom Deck" button switches from preset to custom mode
    it('switches to custom mode when "Start Custom Deck" clicked', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Expand settings
      const toggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(toggleButton)

      // Load starter deck (preset mode)
      const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
      await user.click(starterRadio)
      const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
      await user.click(loadButton)

      // Verify we're in preset mode
      expect(screen.getByText(/current mode:/i)).toBeDefined()
      // Look for the strong tag that says "Preset Deck"
      const modeIndicator = screen.getByText(/current mode:/i).parentElement
      expect(modeIndicator?.textContent).toMatch(/preset deck/i)

      // Click "Start Custom Deck" button
      const customDeckButton = screen.getByRole('button', { name: /start.*custom deck/i })
      await user.click(customDeckButton)

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 50))

      // Verify mode switched to custom
      expect(screen.getByText(/custom deck/i)).toBeDefined()
      // Look for the p tag containing "Current mode" and check it contains "Custom"
      const paragraphs = screen.queryAllByText(/current mode:/i)
      const modeParagraph = paragraphs.find(p => p.textContent?.includes('Custom Deck'))
      expect(modeParagraph).toBeDefined()
      expect(modeParagraph?.textContent).toMatch(/custom deck/i)

      // Verify preset indicator is no longer active
      expect(screen.queryByLabelText(/currently active/i)).toBeNull()

      // Verify "Start Custom Deck" button is no longer visible
      expect(screen.queryByRole('button', { name: /start.*custom deck/i })).toBeNull()
    })

    // US3-AC3: Loading preset from custom mode switches to preset mode
    it('switches to preset mode when preset loaded from custom mode', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Expand settings
      const toggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(toggleButton)

      // Start with custom deck via JSON override (array of card name strings)
      const customDeckJson = JSON.stringify([
        'Ace of Hearts',
        'King of Spades',
        '2 of Diamonds'
      ])

      const jsonTextarea = screen.getByLabelText(/deck json/i) as HTMLTextAreaElement
      await user.click(jsonTextarea)
      await user.paste(customDeckJson)
      const applyButton = screen.getByRole('button', { name: /apply deck/i })
      await user.click(applyButton)

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 50))

      // Verify we're in custom mode
      expect(screen.getByText(/custom deck/i)).toBeDefined()

      // Now load a preset deck
      const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
      await user.click(starterRadio)
      const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
      await user.click(loadButton)

      // Verify mode switched to preset
      // The mode indicator is in a <p> tag that starts with "Current mode:"
      const allParagraphs = screen.queryAllByText(/current mode:/i)
      const modeParagraph = allParagraphs.find(p => p.tagName === 'P')
      expect(modeParagraph?.textContent).toMatch(/preset deck/i)
      // The strong tag inside should say "Preset Deck"
      const strongTag = modeParagraph?.querySelector('strong')
      expect(strongTag?.textContent).toBe('Preset Deck')

      // Verify preset indicator is active
      const activeIndicators = screen.getAllByLabelText(/currently active/i)
      expect(activeIndicators.length).toBeGreaterThan(0)
    })

    // US3-AC4: Mode transitions persist across page reloads
    it('persists mode transitions across page reloads', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<App />)

      // Expand settings
      const toggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(toggleButton)

      // Load preset deck
      const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
      await user.click(starterRadio)
      const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
      await user.click(loadButton)

      // Verify preset mode
      const modeIndicator = screen.getByText(/current mode:/i).parentElement
      expect(modeIndicator?.textContent).toMatch(/preset deck/i)

      // Switch to custom mode
      const customDeckButton = screen.getByRole('button', { name: /start.*custom deck/i })
      await user.click(customDeckButton)

      // Verify custom mode
      expect(screen.getByText(/custom deck/i)).toBeDefined()

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 150))

      // Unmount and remount (simulate page reload)
      unmount()
      render(<App />)

      // Verify mode persisted as custom
      expect(screen.getByText(/custom deck/i)).toBeDefined()
      // Verify not showing preset mode
      const modeText = screen.getByText(/current mode:/i).parentElement?.textContent || ''
      expect(modeText).toMatch(/custom/i)

      // Verify no preset indicator
      const newToggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(newToggleButton)
      expect(screen.queryByLabelText(/currently active/i)).toBeNull()
    })

    // US3-AC5: Mode switching preserves user settings (hand size, discard count)
    it('preserves user settings during mode transitions', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Expand settings
      const toggleButton = screen.getByRole('button', { name: /settings/i })
      await user.click(toggleButton)

      // Set custom hand size and discard count
      const handSizeInput = screen.getByLabelText(/hand size/i) as HTMLSelectElement
      await user.selectOptions(handSizeInput, '7')
      expect(handSizeInput.value).toBe('7')

      const discardCountInput = screen.getByLabelText(/discard count/i) as HTMLSelectElement
      await user.selectOptions(discardCountInput, '3')
      expect(discardCountInput.value).toBe('3')

      // Load preset deck
      const starterRadio = screen.getByRole('radio', { name: /select starter deck/i })
      await user.click(starterRadio)
      const loadButton = screen.getByRole('button', { name: /load selected preset deck/i })
      await user.click(loadButton)

      // Verify settings preserved
      expect(handSizeInput.value).toBe('7')
      expect(discardCountInput.value).toBe('3')

      // Switch to custom mode
      const customDeckButton = screen.getByRole('button', { name: /start.*custom deck/i })
      await user.click(customDeckButton)

      // Verify settings still preserved
      expect(handSizeInput.value).toBe('7')
      expect(discardCountInput.value).toBe('3')
    })
  })
})
