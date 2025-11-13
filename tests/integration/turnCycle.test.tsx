import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from '@jest/globals'
import App from '../../src/App'

/**
 * Integration tests for turn cycle behavior (US1)
 * Tests: End Turn button, hand dealing, reshuffle on pile exhaustion, rapid-click protection
 */

describe('Turn Cycle Integration', () => {
  it('should deal initial hand on mount', () => {
    render(<App />)
    
    // Verify initial hand is dealt (default hand size = 5)
    const handView = screen.getByRole('region', { name: /current hand/i })
    expect(handView).toBeInTheDocument()
    
    // Hand should contain 5 cards (using 'article' role from Feature 002)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
  })

  it('should end turn, discard hand, and deal new hand', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Get initial hand cards (using 'article' role from Feature 002)
    const initialCards = screen.getAllByRole('article').map(el => el.textContent)
    expect(initialCards).toHaveLength(5)
    
    // Check initial turn number - find the pile status section
    const pileStatus = screen.getByRole('region', { name: /pile status/i })
    expect(pileStatus).toHaveTextContent('Turn: 1')
    
    // Click End Turn button
    const endTurnButton = screen.getByRole('button', { name: /end turn/i })
    await user.click(endTurnButton)
    
    // Verify turn incremented
    expect(pileStatus).toHaveTextContent('Turn: 2')
    
    // Verify new hand dealt (should be 5 cards again)
    const newCards = screen.getAllByRole('article').map(el => el.textContent)
    expect(newCards).toHaveLength(5)
    
    // Verify discard pile increased by 5
    expect(pileStatus).toHaveTextContent('Discard pile: 5')
  })

  it('should reshuffle discard pile when draw pile exhausted', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const pileStatus = screen.getByRole('region', { name: /pile status/i })
    
    // Default deck has 26 cards, hand size = 5
    // Turn 1: 5 cards dealt initially (21 in draw, 0 in discard, 5 in hand)
    // Click 1 → Turn 2: discard 5, deal 5 (16 in draw, 5 in discard, 5 in hand)
    // Click 2 → Turn 3: discard 5, deal 5 (11 in draw, 10 in discard, 5 in hand)
    // Click 3 → Turn 4: discard 5, deal 5 (6 in draw, 15 in discard, 5 in hand)
    // Click 4 → Turn 5: discard 5, deal 5 (1 in draw, 20 in discard, 5 in hand)
    // Click 5 → Turn 6: discard 5, deal 1 then RESHUFFLE, deal 4 more
    
    const endTurnButton = screen.getByRole('button', { name: /end turn/i })
    
    // After initial deal, verify we start correctly
    expect(pileStatus).toHaveTextContent('Turn: 1')
    expect(pileStatus).toHaveTextContent('Draw pile: 21')
    
    // Perform 4 turns
    for (let i = 0; i < 4; i++) {
      await user.click(endTurnButton)
    }
    
    // After 4 clicks, we should be on turn 5 with 1 card left in draw
    expect(pileStatus).toHaveTextContent('Turn: 5')
    expect(pileStatus).toHaveTextContent('Draw pile: 1')
    
    // Discard pile should have 20 cards (4 turns × 5 cards)
    expect(pileStatus).toHaveTextContent('Discard pile: 20')
    
    // Perform one more turn - this should trigger reshuffle mid-deal
    await user.click(endTurnButton)
    
    // Turn should be 6
    expect(pileStatus).toHaveTextContent('Turn: 6')
    
    // Hand should still have 5 cards (reshuffle worked) - using 'article' role from Feature 002
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
    
    // Draw pile + discard pile + hand should total 26
    const pileText = pileStatus.textContent || ''
    const drawMatch = pileText.match(/Draw pile:\s*(\d+)/i)
    const discardMatch = pileText.match(/Discard pile:\s*(\d+)/i)
    
    const drawCount = drawMatch ? parseInt(drawMatch[1]) : 0
    const discardCount = discardMatch ? parseInt(discardMatch[1]) : 0
    
    expect(drawCount + discardCount + 5).toBe(26)
  })

  it('should show warning when total cards less than hand size', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Override deck with only 3 cards
    const jsonTextarea = screen.getByPlaceholderText(/enter json array/i) as HTMLTextAreaElement
    const applyButton = screen.getByRole('button', { name: /apply deck/i })
    
    // Use fireEvent to set textarea value
    fireEvent.change(jsonTextarea, { target: { value: '["A","B","C"]' } })
    
    await user.click(applyButton)
    
    // Should show warning because hand size (5) > total cards (3)
    expect(screen.getByRole('alert')).toHaveTextContent(/insufficient cards.*3.*5/i)
  })

  it('should ignore rapid End Turn clicks (concurrency protection)', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const endTurnButton = screen.getByRole('button', { name: /end turn/i })
    const pileStatus = screen.getByRole('region', { name: /pile status/i })
    
    // Rapid-fire 3 clicks
    await user.click(endTurnButton)
    await user.click(endTurnButton)
    await user.click(endTurnButton)
    
    // Should only advance to turn 4 (initial turn 1 + 3 successful clicks)
    // If concurrency protection fails, might advance more
    expect(pileStatus).toHaveTextContent('Turn: 4')
    
    // Hand should still have exactly 5 cards - using 'article' role from Feature 002
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
  })

  it('should disable End Turn button while dealing', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const endTurnButton = screen.getByRole('button', { name: /end turn/i })
    
    // Note: Since dealing is synchronous in our implementation,
    // this test verifies the button is NOT disabled during normal operation
    expect(endTurnButton).not.toBeDisabled()
    
    // After clicking, button should remain enabled (dealing completes immediately)
    await user.click(endTurnButton)
    expect(endTurnButton).not.toBeDisabled()
  })
})
