import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../../src/App'

/**
 * Integration tests for Feature 004 User Story 1: Play Order Selection
 * Tests the full workflow of selecting cards in sequence, deselecting, and keyboard navigation
 */
describe('Play Order Selection Integration', () => {
  /**
   * T034: Integration test - Select 3 cards in sequence, verify badges
   * Tests that clicking cards during planning phase adds them to the sequence
   * and displays the correct sequence number badges
   */
  test('select 3 cards in sequence and verify badges appear with correct numbers', async () => {
    render(<App />)
    
    // Wait for initial hand to be dealt (default handSize=5, discardCount=2)
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5)
    })
    
    // Complete initial discard (discard 2 cards to enter planning phase with 3 remaining)
    let handCards = screen.getAllByTestId(/card-/)
    fireEvent.click(handCards[0])
    fireEvent.click(handCards[1])
    
    const discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    fireEvent.click(discardButton)
    
    // Wait for planning phase to activate (3 cards remaining)
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(3)
    })
    
    // Now we should be in planning phase - verify by checking data attribute
    const handContainer = screen.getByRole('region', { name: /current hand/i }).querySelector('.hand-container')
    expect(handContainer).toHaveAttribute('data-planning-phase', 'true')
    
    // Get remaining cards
    handCards = screen.getAllByTestId(/card-/)
    
    // Click cards in sequence: card 0, card 2, card 1
    fireEvent.click(handCards[0])
    fireEvent.click(handCards[2])
    fireEvent.click(handCards[1])
    
    // Verify sequence badges appear with correct numbers
    await waitFor(() => {
      // Card 0 should have badge with "1"
      const badge0 = handCards[0].querySelector('.card__sequence-badge')
      expect(badge0).toBeInTheDocument()
      expect(badge0).toHaveTextContent('1')
      
      // Card 2 should have badge with "2"
      const badge2 = handCards[2].querySelector('.card__sequence-badge')
      expect(badge2).toBeInTheDocument()
      expect(badge2).toHaveTextContent('2')
      
      // Card 1 should have badge with "3"
      const badge1 = handCards[1].querySelector('.card__sequence-badge')
      expect(badge1).toBeInTheDocument()
      expect(badge1).toHaveTextContent('3')
    })
  })
  
  /**
   * T035: Integration test - Deselect middle card, verify renumbering
   * Tests that clicking a card already in the sequence removes it
   * and remaining cards are renumbered correctly
   */
  test('deselect middle card from sequence and verify remaining cards renumber', async () => {
    render(<App />)
    
    // Wait for initial hand and discard 2 cards to enter planning phase
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5)
    })
    
    let handCards = screen.getAllByTestId(/card-/)
    fireEvent.click(handCards[0])
    fireEvent.click(handCards[1])
    
    const discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    fireEvent.click(discardButton)
    
    // Wait for planning phase (3 cards remaining)
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(3)
    })
    
    handCards = screen.getAllByTestId(/card-/)
    
    // Select all 3 cards in sequence
    fireEvent.click(handCards[0]) // position 1
    fireEvent.click(handCards[1]) // position 2
    fireEvent.click(handCards[2]) // position 3
    
    // Verify all 3 have badges
    await waitFor(() => {
      expect(handCards[0].querySelector('.card__sequence-badge')).toHaveTextContent('1')
      expect(handCards[1].querySelector('.card__sequence-badge')).toHaveTextContent('2')
      expect(handCards[2].querySelector('.card__sequence-badge')).toHaveTextContent('3')
    })
    
    // Click card 1 again to deselect it (middle of sequence)
    fireEvent.click(handCards[1])
    
    // Verify card 1 no longer has badge, and remaining cards renumbered
    await waitFor(() => {
      // Card 0 still has badge "1"
      expect(handCards[0].querySelector('.card__sequence-badge')).toHaveTextContent('1')
      
      // Card 1 should NOT have badge
      expect(handCards[1].querySelector('.card__sequence-badge')).not.toBeInTheDocument()
      
      // Card 2 should now have badge "2" (renumbered from 3)
      expect(handCards[2].querySelector('.card__sequence-badge')).toHaveTextContent('2')
    })
  })
  
  /**
   * T036: Integration test - Keyboard navigation (Tab/Space/Enter)
   * Tests that cards can be selected using keyboard:
   * - Tab to navigate between cards
   * - Space or Enter to toggle selection
   */
  test('use keyboard navigation to select cards for play order', async () => {
    render(<App />)
    
    // Setup: Discard 2 cards to enter planning phase
    await waitFor(() => {
      const handCards = screen.getAllByTestId(/card-/)
      expect(handCards).toHaveLength(5)
    })
    
    let handCards = screen.getAllByTestId(/card-/)
    fireEvent.click(handCards[0])
    fireEvent.click(handCards[1])
    
    const discardButton = screen.getByRole('button', { name: /discard selected cards/i })
    fireEvent.click(discardButton)
    
    await waitFor(() => {
      const remainingCards = screen.queryAllByTestId(/card-/)
      expect(remainingCards).toHaveLength(3)
    })
    
    handCards = screen.getAllByTestId(/card-/)
    
    // Test keyboard interaction: Focus first card and press Space
    handCards[0].focus()
    fireEvent.keyDown(handCards[0], { key: ' ', code: 'Space' })
    
    // Verify card 0 gets badge "1"
    await waitFor(() => {
      expect(handCards[0].querySelector('.card__sequence-badge')).toHaveTextContent('1')
    })
    
    // Test Enter key on second card
    handCards[1].focus()
    fireEvent.keyDown(handCards[1], { key: 'Enter', code: 'Enter' })
    
    // Verify card 1 gets badge "2"
    await waitFor(() => {
      expect(handCards[1].querySelector('.card__sequence-badge')).toHaveTextContent('2')
    })
    
    // Test deselecting with Space key
    handCards[0].focus()
    fireEvent.keyDown(handCards[0], { key: ' ', code: 'Space' })
    
    // Verify card 0 badge removed and card 1 renumbered to "1"
    await waitFor(() => {
      expect(handCards[0].querySelector('.card__sequence-badge')).not.toBeInTheDocument()
      expect(handCards[1].querySelector('.card__sequence-badge')).toHaveTextContent('1')
    })
  })
})
