import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from '../../src/components/SettingsPanel'

/**
 * Unit tests for SettingsPanel component (Feature 008)
 * Tests: Collapse/expand, toggle button, error auto-expansion, ARIA attributes, persistence
 */

describe('SettingsPanel', () => {
  const STORAGE_KEY = 'deck-builder:settings-expanded'

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  // Default State Tests
  it('renders collapsed by default (no saved state)', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('collapsed')
  })

  it('renders with toggle button labeled "Settings"', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toBeInTheDocument()
    expect(button.textContent).toContain('Settings')
  })

  // ARIA Attribute Tests
  it('toggle button has aria-expanded="false" when collapsed', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('settings content is hidden when collapsed', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const content = screen.getByRole('region')
    expect(content).toHaveClass('collapsed')
    expect(content).not.toHaveClass('expanded')
  })

  // Expansion Tests
  it('expands when toggle button clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('expanded')
  })

  it('toggle button has aria-expanded="true" when expanded', async () => {
    const user = userEvent.setup()
    
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('settings content is visible when expanded', async () => {
    const user = userEvent.setup()
    
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    await user.click(button)

    const content = screen.getByRole('region')
    expect(content).toHaveClass('expanded')
    expect(content).not.toHaveClass('collapsed')
  })

  it('collapses when toggle button clicked again', async () => {
    const user = userEvent.setup()
    
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    
    // Expand
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    // Collapse
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('collapsed')
  })

  // Error Auto-Expansion Tests
  it('auto-expands when error occurs while collapsed', () => {
    const { rerender } = render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Initially collapsed
    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Error occurs
    rerender(
      <SettingsPanel error="Test error message">
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Should auto-expand
    expect(button).toHaveAttribute('aria-expanded', 'true')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('expanded')
  })

  it('does not auto-expand when error occurs while already expanded', async () => {
    const user = userEvent.setup()
    
    const { rerender } = render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Manually expand first
    const button = screen.getByRole('button', { name: /settings/i })
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // Error occurs while already expanded
    rerender(
      <SettingsPanel error="Test error message">
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Should remain expanded (no change)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('remains expanded after auto-expansion even when error clears', () => {
    const { rerender } = render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Error occurs - auto-expands
    rerender(
      <SettingsPanel error="Test error message">
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // Error clears
    rerender(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Should remain expanded (doesn't auto-collapse)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  // No Persistence Tests
  it('always starts collapsed (ignores localStorage data)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isExpanded: true }))

    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Should be collapsed even if localStorage says expanded
    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('settings-content')
  })

  it('always starts collapsed even with false in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isExpanded: false }))

    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('settings-content')
  })

  it('loads saved expansion state on mount (collapsed)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isExpanded: false }))

    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    
    const content = screen.getByRole('region')
    expect(content).toHaveClass('collapsed')
  })

  // ARIA Attributes Test
  it('maintains ARIA attributes (aria-controls, role=region)', () => {
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-controls', 'settings-content')

    const content = screen.getByRole('region')
    expect(content).toHaveAttribute('id', 'settings-content')
    expect(content).toHaveAttribute('role', 'region')
  })

  // Resilience Tests
  it('works when localStorage unavailable', async () => {
    const user = userEvent.setup()
    
    // Mock localStorage to throw
    const originalGetItem = localStorage.getItem
    const originalSetItem = localStorage.setItem
    
    localStorage.getItem = jest.fn(() => {
      throw new Error('localStorage unavailable')
    }) as typeof localStorage.getItem
    localStorage.setItem = jest.fn(() => {
      throw new Error('localStorage unavailable')
    }) as typeof localStorage.setItem

    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    // Should render and work normally
    const button = screen.getByRole('button', { name: /settings/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Toggle should still work (in memory)
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // Restore
    localStorage.getItem = originalGetItem
    localStorage.setItem = originalSetItem
  })

  // Rapid Toggle Test
  it('rapid toggle clicks produce consistent state', async () => {
    const user = userEvent.setup()
    
    render(
      <SettingsPanel error={null}>
        <div>Settings Content</div>
      </SettingsPanel>
    )

    const button = screen.getByRole('button', { name: /settings/i })

    // Rapid clicks
    await user.click(button)
    await user.click(button)
    await user.click(button)
    await user.click(button)
    await user.click(button)

    // After 5 clicks (starting from false), should be true
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  // Children Rendering Test
  it('children components render inside panel', () => {
    render(
      <SettingsPanel error={null}>
        <div data-testid="child-component">Child Content</div>
        <button>Child Button</button>
      </SettingsPanel>
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /child button/i })).toBeInTheDocument()
  })
})
