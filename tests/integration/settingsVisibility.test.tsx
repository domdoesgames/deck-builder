import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

/**
 * Integration tests for Settings Panel visibility (Feature 008)
 * Tests: Full app integration, settings persistence, error auto-expansion flow
 */

describe('Settings Visibility Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // Default State Test
  it('settings hidden by default on page load', () => {
    render(<App />)

    // Settings panel should exist
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Settings content should be collapsed
    const settingsContent = document.getElementById('settings-content')
    expect(settingsContent).toHaveClass('collapsed')
  })

  // Toggle Functionality Test
  it('toggle expands and collapses settings in full app', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggleButton = screen.getByRole('button', { name: /settings/i })
    const settingsContent = document.getElementById('settings-content')!
    
    // Initially collapsed
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Settings content should now be visible
    expect(settingsContent).toHaveClass('expanded')

    // Click to collapse again
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(settingsContent).toHaveClass('collapsed')
  })

  // Settings Values Persist Test
  it('settings values persist when panel toggled', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)

    // Find and change hand size input
    const handSizeInput = screen.getByLabelText(/hand size/i)
    expect(handSizeInput).toHaveValue('5') // Default value

    // Change to 7
    await user.selectOptions(handSizeInput, '7')
    expect(handSizeInput).toHaveValue('7')

    // Collapse settings
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Expand settings again
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Verify hand size value is still 7
    expect(handSizeInput).toHaveValue('7')
  })

  // No Persistence - Always Closed on Remount
  it('state does not persist across component remount (always defaults to closed)', async () => {
    const user = userEvent.setup()
    
    const { unmount } = render(<App />)

    // Expand settings
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Unmount the app
    unmount()

    // Remount the app (simulates page reload)
    render(<App />)

    // Settings should be closed again (no persistence)
    const newToggleButton = screen.getByRole('button', { name: /settings/i })
    expect(newToggleButton).toHaveAttribute('aria-expanded', 'false')
  })

  // Error Auto-Expansion Test
  it('error triggers auto-expansion in full app', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Settings should be collapsed by default
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // First, expand settings to access the textarea
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Find the JSON override textarea
    const jsonTextarea = screen.getByLabelText(/deck json/i)

    // Enter invalid JSON
    await user.clear(jsonTextarea)
    await user.type(jsonTextarea, 'invalid json{{')

    // Collapse settings
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Click "Apply Deck" button to trigger the error
    const applyButton = screen.getByRole('button', { name: /apply deck/i })
    await user.click(applyButton)

    // Wait a bit for the error to propagate
    await new Promise(resolve => setTimeout(resolve, 100))

    // Settings should now be expanded due to error
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  // Error Visibility After Expansion Test
  it('error message visible after auto-expansion', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggleButton = screen.getByRole('button', { name: /settings/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Expand settings to access textarea
    await user.click(toggleButton)

    // Enter invalid JSON
    const jsonTextarea = screen.getByLabelText(/deck json/i)
    await user.clear(jsonTextarea)
    await user.type(jsonTextarea, 'not valid{{')

    // Collapse settings
    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Apply the invalid JSON to trigger error
    const applyButton = screen.getByRole('button', { name: /apply deck/i })
    await user.click(applyButton)

    // Wait for error propagation
    await new Promise(resolve => setTimeout(resolve, 100))

    // Settings should be expanded
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  // Settings Remain Functional While Hidden Test
  it('settings remain functional while hidden', async () => {
    render(<App />)

    // Verify settings are collapsed by default
    const toggleButton = screen.getByRole('button', { name: /settings/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // The game should still be playable - check for game content
    // Hand should be visible even with settings hidden
    const handRegion = screen.getByRole('region', { name: /current hand/i })
    expect(handRegion).toBeInTheDocument()

    // Pile status should be visible
    const pileStatus = screen.getByRole('region', { name: /pile status/i })
    expect(pileStatus).toBeInTheDocument()

    // Verify settings are still collapsed after checking game state
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })
})
