import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../../src/App'

describe('Discard Flow Integration', () => {
  test('full flow: deal hand, select required cards, confirm discard, verify state', async () => {
    render(<App />)

    // Initial hand is dealt automatically with discardCount=2
    // To avoid planning phase complexity, we'll change discardCount to 5 FIRST,
    // then discard ALL 5 cards initially
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5) // default handSize is 5
    })
    
    // Change discardCount to 5 BEFORE selecting cards
    const discardCountSelect = screen.getByLabelText(/discard count/i)
    fireEvent.change(discardCountSelect, { target: { value: '5' } })
    
    // Now select all 5 cards for discard
    let handCards = screen.getAllByTestId(/card-/)
    handCards.forEach(card => fireEvent.click(card))
    
    // Wait for all cards to be selected
    let discardButton: HTMLElement
    await waitFor(() => {
      discardButton = screen.getByRole('button', { name: /discard selected cards/i })
      expect(discardButton).not.toBeDisabled()
    })
    
    // Confirm initial discard
    discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    fireEvent.click(discardButton)
    
    // Wait for hand to be empty AND discard pile to update
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(0)
      const pileSection = screen.getByLabelText(/pile status/i)
      const fullText = pileSection.textContent || ''
      // Extract discard pile number: match "Discard pile: X" pattern
      const match = fullText.match(/discard pile:\s*(\d+)/i)
      const count = match ? parseInt(match[1], 10) : 0
      expect(count).toBe(5)
    })
    
    // After discarding all cards, End Turn should be enabled
    const endTurnButton = screen.getByText(/end turn/i)
    expect(endTurnButton).not.toBeDisabled()
    
    // discardCount is already 5 from earlier
    // End turn to deal fresh hand with discardCount=5
    fireEvent.click(endTurnButton)
    
    // Wait for new hand to be dealt with discard phase active
    await waitFor(() => {
      handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5)
      // Verify discard button is present (meaning discard phase is active)
      discardButton = screen.queryByRole('button', { name: /discard selected cards/i }) as HTMLElement
      expect(discardButton).toBeInTheDocument()
    })

    // Verify discard phase is active (End Turn should be disabled)
    expect(endTurnButton).toBeDisabled()

    // Select all 5 cards for discard
    handCards = screen.getAllByTestId(/card-/)
    handCards.forEach(card => fireEvent.click(card))

    // Verify all cards are selected
    await waitFor(() => {
      handCards.forEach(card => {
        expect(card).toHaveClass('selected')
      })
    })

    // Discard button should now be enabled (5 cards selected, discardCount=5)
    discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    expect(discardButton).not.toBeDisabled()

    // Confirm discard
    fireEvent.click(discardButton)

    // Verify hand is now empty (all 5 cards discarded)
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(0)
    })

    // Verify discard pile increased by 5 (was 5, now 10 total)
    await waitFor(() => {
      const pileSection = screen.getByLabelText(/pile status/i)
      const fullText = pileSection.textContent || ''
      // Extract discard pile number: match "Discard pile: X" pattern
      const match = fullText.match(/discard pile:\s*(\d+)/i)
      const newDiscardCount = match ? parseInt(match[1], 10) : 0
      expect(newDiscardCount).toBe(10) // 5 from initial discard + 5 from this discard
    })

    // Verify End Turn is now enabled (discard phase complete)
    expect(endTurnButton).not.toBeDisabled()
  })

  test('discard phase blocks turn end until discard confirmed', async () => {
    render(<App />)

    // Initial hand is dealt automatically with default discardCount=2
    // Wait for hand to be dealt
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards.length).toBeGreaterThan(0)
    })

    // Verify End Turn is disabled during discard phase
    const endTurnButton = screen.getByText(/end turn/i)
    expect(endTurnButton).toBeDisabled()

    // Attempt to click it (should be ignored)
    const turnNumber = screen.getByText(/turn:/i)
    const initialTurn = parseInt(turnNumber.textContent?.match(/\d+/)?.[0] || '1')
    
    fireEvent.click(endTurnButton)

    // Turn should not increment
    const currentTurn = parseInt(turnNumber.textContent?.match(/\d+/)?.[0] || '1')
    expect(currentTurn).toBe(initialTurn)
  })

  test('discard phase allows turn end after confirming discard', async () => {
    render(<App />)

    // NOTE: This test is affected by Feature 004 (planning phase)
    // With discardCount < handSize, we enter planning phase after discard
    // which also blocks turn end. To isolate discard phase behavior,
    // we test with discardCount = handSize (discard all cards)
    
    // Wait for initial hand
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5)
    })
    
    // Change discardCount to 5 to allow selecting all 5 cards
    const discardCountSelect = screen.getByLabelText(/discard count/i)
    fireEvent.change(discardCountSelect, { target: { value: '5' } })
    
    // Select all 5 cards to discard (avoiding planning phase)
    const handCards = screen.getAllByTestId(/card-/)
    handCards.forEach(card => fireEvent.click(card))
    
    // Wait for discard button to be enabled
    let discardButton: HTMLElement
    await waitFor(() => {
      discardButton = screen.getByRole('button', { name: /discard selected cards/i })
      expect(discardButton).not.toBeDisabled()
    })
    
    // Confirm discard
    discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    fireEvent.click(discardButton)
    
    // Wait for hand to be empty (all cards discarded, no planning phase)
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(0)
    })
    
    // End Turn button should be enabled (discard complete, no planning phase)
    const endTurnButton = screen.getByText(/end turn/i)
    expect(endTurnButton).not.toBeDisabled()
    
    // Discard button should not be shown (we're past discard phase)
    const discardButtonCheck = screen.queryByRole('button', { name: /discard selected cards/i })
    expect(discardButtonCheck).not.toBeInTheDocument()
  })
})
