import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { HandView } from '../../src/components/HandView'

/**
 * Unit tests for HandView component (User Story 1)
 * Tests: Card fan/spread display, visual card elements, empty state
 */

describe('HandView - User Story 1: Visual Card Hand Display', () => {
  // T002: Update existing test for empty state
  it('renders empty state when hand is empty', () => {
    render(<HandView hand={[]} />)
    
    // Verify empty state structure
    const container = screen.getByRole('region', { name: /current hand/i })
    expect(container).toBeInTheDocument()
    
    // Should have empty modifier class on hand-container
    const handContainer = container.querySelector('.hand-container--empty')
    expect(handContainer).toBeInTheDocument()
    
    // Should display empty message in <p> element
    const emptyMessage = screen.getByText(/no cards in hand/i)
    expect(emptyMessage).toBeInTheDocument()
    expect(emptyMessage.tagName).toBe('P')
  })

  // T003: Update existing test for single card
  it('renders single card centered', () => {
    render(<HandView hand={['Ace of Spades']} />)
    
    // Should use article role instead of list item
    const card = screen.getByRole('article')
    expect(card).toBeInTheDocument()
    expect(card).toHaveTextContent('Ace of Spades')
  })

  // T004: Update existing test for multiple cards
  it('renders multiple cards in order', () => {
    const testHand = ['2 of Hearts', '7 of Diamonds', 'King of Clubs']
    render(<HandView hand={testHand} />)
    
    // Should render all cards with article role
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(3)
    
    // Verify each card has correct aria-label
    expect(cards[0]).toHaveAttribute('aria-label', 'Card: 2 of Hearts')
    expect(cards[1]).toHaveAttribute('aria-label', 'Card: 7 of Diamonds')
    expect(cards[2]).toHaveAttribute('aria-label', 'Card: King of Clubs')
    
    // Verify cards appear in order
    expect(cards[0]).toHaveTextContent('2 of Hearts')
    expect(cards[1]).toHaveTextContent('7 of Diamonds')
    expect(cards[2]).toHaveTextContent('King of Clubs')
  })

  // T005: New test for card CSS class
  it('applies card class to each card element', () => {
    const testHand = ['Ace', 'King', 'Queen']
    render(<HandView hand={testHand} />)
    
    const cards = screen.getAllByRole('article')
    
    // Each card should have .card class
    cards.forEach(card => {
      expect(card).toHaveClass('card')
    })
  })

  // T006: New test for card__value wrapper
  it('wraps card text in card__value element', () => {
    render(<HandView hand={['Jack of Spades']} />)
    
    const card = screen.getByRole('article')
    
    // Card should contain a .card__value element
    const valueElement = card.querySelector('.card__value')
    expect(valueElement).toBeInTheDocument()
    expect(valueElement).toHaveTextContent('Jack of Spades')
  })

  // Additional test for CSS custom properties (from tasks.md T022)
  it('sets CSS custom property for card count', () => {
    const testHand = ['A', 'B', 'C', 'D', 'E']
    render(<HandView hand={testHand} />)
    
    const container = screen.getByRole('region', { name: /current hand/i })
    const handContainer = container.querySelector('.hand-container')
    
    // Should set --card-count to hand.length
    expect(handContainer).toHaveStyle({ '--card-count': '5' })
  })

  // Additional test for card index CSS property
  it('sets CSS custom property for card index on each card', () => {
    const testHand = ['A', 'B', 'C']
    render(<HandView hand={testHand} />)
    
    const cards = screen.getAllByRole('article')
    
    // Each card should have --card-index set to its position
    expect(cards[0]).toHaveStyle({ '--card-index': '0' })
    expect(cards[1]).toHaveStyle({ '--card-index': '1' })
    expect(cards[2]).toHaveStyle({ '--card-index': '2' })
  })

  // Test for accessible structure
  it('has accessible structure with heading and region', () => {
    render(<HandView hand={['Test Card']} />)
    
    // Should have region with labelledby
    const region = screen.getByRole('region', { name: /current hand/i })
    expect(region).toBeInTheDocument()
    
    // Should have heading
    const heading = screen.getByRole('heading', { name: /current hand/i, level: 2 })
    expect(heading).toBeInTheDocument()
    
    // Container should be labelled by heading
    expect(region).toHaveAttribute('aria-labelledby', 'hand-heading')
    expect(heading).toHaveAttribute('id', 'hand-heading')
  })
})

/**
 * User Story 3: Visual Card States (Hover)
 */
describe('HandView - User Story 3: Visual Card States', () => {
  // T029: Test for hover state CSS classes
  it('card elements have interactive cursor and visual styling', () => {
    render(<HandView hand={['Test Card 1', 'Test Card 2']} />)
    
    const cards = screen.getAllByRole('article')
    
    // Verify cards have .card class which includes hover styles
    cards.forEach(card => {
      expect(card).toHaveClass('card')
    })
    
    // Note: CSS pseudo-classes like :hover cannot be directly tested in jsdom
    // The actual hover behavior (transform, z-index, box-shadow) is validated through:
    // 1. CSS file includes .card:hover rules (HandView.css:157-166)
    // 2. Transition property set (HandView.css:138-141) with 200ms duration (< SC-005 requirement)
    // 3. will-change: transform for performance (HandView.css:144)
    // 4. Manual testing (T037-T038) will verify hover states visually
    
    // We can verify the base structure that enables hover:
    expect(cards[0]).toHaveClass('card')
    expect(cards[1]).toHaveClass('card')
  })
  
  // Additional test: Verify cards are interactive elements
  it('cards have pointer cursor indicating interactivity', () => {
    render(<HandView hand={['Interactive Card']} />)
    
    const card = screen.getByRole('article')
    
    // Card should have .card class which sets cursor: pointer
    expect(card).toHaveClass('card')
    
    // Note: CSS cursor property testing in jsdom is limited
    // Manual testing will verify cursor changes on hover
  })
})
