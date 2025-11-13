import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { HandView } from '../../src/components/HandView'

/**
 * Unit tests for HandView component (User Story 1)
 * Tests: Card fan/spread display, visual card elements, empty state
 * Feature 003: Tests card selection for discard mechanic
 */

describe('HandView - User Story 1: Visual Card Hand Display', () => {
  const mockToggleSelection = jest.fn()
  
  // T002: Update existing test for empty state
  it('renders empty state when hand is empty', () => {
    render(
      <HandView 
        hand={[]} 
        handCards={[]} 
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
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
    render(
      <HandView 
        hand={['Ace of Spades']} 
        handCards={[{ instanceId: 'card-1', card: 'Ace of Spades' }]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    // Should use button role (changed from article for interactivity)
    const card = screen.getByRole('button')
    expect(card).toBeInTheDocument()
    expect(card).toHaveTextContent('Ace of Spades')
  })

  // T004: Update existing test for multiple cards
  it('renders multiple cards in order', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: '2 of Hearts' },
      { instanceId: 'card-2', card: '7 of Diamonds' },
      { instanceId: 'card-3', card: 'King of Clubs' },
    ]
    render(
      <HandView 
        hand={['2 of Hearts', '7 of Diamonds', 'King of Clubs']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    // Should render all cards with button role
    const cards = screen.getAllByRole('button')
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
    const testHandCards = [
      { instanceId: 'card-1', card: 'Ace' },
      { instanceId: 'card-2', card: 'King' },
      { instanceId: 'card-3', card: 'Queen' },
    ]
    render(
      <HandView 
        hand={['Ace', 'King', 'Queen']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Each card should have .card class
    cards.forEach(card => {
      expect(card).toHaveClass('card')
    })
  })

  // T006: New test for card__value wrapper
  it('wraps card text in card__value element', () => {
    render(
      <HandView 
        hand={['Jack of Spades']} 
        handCards={[{ instanceId: 'card-1', card: 'Jack of Spades' }]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const card = screen.getByRole('button')
    
    // Card should contain a .card__value element
    const valueElement = card.querySelector('.card__value')
    expect(valueElement).toBeInTheDocument()
    expect(valueElement).toHaveTextContent('Jack of Spades')
  })

  // Additional test for CSS custom properties (from tasks.md T022)
  it('sets CSS custom property for card count', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'A' },
      { instanceId: 'card-2', card: 'B' },
      { instanceId: 'card-3', card: 'C' },
      { instanceId: 'card-4', card: 'D' },
      { instanceId: 'card-5', card: 'E' },
    ]
    render(
      <HandView 
        hand={['A', 'B', 'C', 'D', 'E']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const container = screen.getByRole('region', { name: /current hand/i })
    const handContainer = container.querySelector('.hand-container')
    
    // Should set --card-count to hand.length
    expect(handContainer).toHaveStyle({ '--card-count': '5' })
  })

  // Additional test for card index CSS property
  it('sets CSS custom property for card index on each card', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'A' },
      { instanceId: 'card-2', card: 'B' },
      { instanceId: 'card-3', card: 'C' },
    ]
    render(
      <HandView 
        hand={['A', 'B', 'C']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Each card should have --card-index set to its position
    expect(cards[0]).toHaveStyle({ '--card-index': '0' })
    expect(cards[1]).toHaveStyle({ '--card-index': '1' })
    expect(cards[2]).toHaveStyle({ '--card-index': '2' })
  })

  // Test for accessible structure
  it('has accessible structure with heading and region', () => {
    render(
      <HandView 
        hand={['Test Card']} 
        handCards={[{ instanceId: 'card-1', card: 'Test Card' }]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
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
 * Feature 003: Card Selection States
 */
describe('HandView - User Story 3: Visual Card States', () => {
  const mockToggleSelection = jest.fn()
  
  // T029: Test for hover state CSS classes
  it('card elements have interactive cursor and visual styling', () => {
    render(
      <HandView 
        hand={['Test Card 1', 'Test Card 2']} 
        handCards={[
          { instanceId: 'card-1', card: 'Test Card 1' },
          { instanceId: 'card-2', card: 'Test Card 2' },
        ]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const cards = screen.getAllByRole('button')
    
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
    render(
      <HandView 
        hand={['Interactive Card']} 
        handCards={[{ instanceId: 'card-1', card: 'Interactive Card' }]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const card = screen.getByRole('button')
    
    // Card should have .card class which sets cursor: pointer
    expect(card).toHaveClass('card')
    
    // Note: CSS cursor property testing in jsdom is limited
    // Manual testing will verify cursor changes on hover
  })
  
  // Feature 003: Test for selected state
  it('applies selected class to cards in selectedCardIds set', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'Card 1' },
      { instanceId: 'card-2', card: 'Card 2' },
      { instanceId: 'card-3', card: 'Card 3' },
    ]
    const selectedIds = new Set<string>(['card-1', 'card-3'])
    
    render(
      <HandView 
        hand={['Card 1', 'Card 2', 'Card 3']} 
        handCards={testHandCards}
        selectedCardIds={selectedIds} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Cards 1 and 3 should have selected class
    expect(cards[0]).toHaveClass('selected')
    expect(cards[1]).not.toHaveClass('selected')
    expect(cards[2]).toHaveClass('selected')
  })
  
  // Feature 003: Test for aria-pressed attribute
  it('sets aria-pressed based on selection state', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'Selected' },
      { instanceId: 'card-2', card: 'Not Selected' },
    ]
    const selectedIds = new Set<string>(['card-1'])
    
    render(
      <HandView 
        hand={['Selected', 'Not Selected']} 
        handCards={testHandCards}
        selectedCardIds={selectedIds} 
        onToggleCardSelection={mockToggleSelection} 
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true')
    expect(cards[1]).toHaveAttribute('aria-pressed', 'false')
  })
})

/**
 * Feature 004: Play Order Sequence Display
 */
describe('HandView - Feature 004: Play Order Sequence', () => {
  const mockToggleSelection = jest.fn()
  const mockSelectForPlayOrder = jest.fn()
  const mockDeselectFromPlayOrder = jest.fn()
  
  // Test: Sequence badges render for cards in play order
  it('renders sequence number badges for cards in playOrderSequence', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'Card A' },
      { instanceId: 'card-2', card: 'Card B' },
      { instanceId: 'card-3', card: 'Card C' },
    ]
    const playOrderSequence = ['card-2', 'card-1', 'card-3']
    
    render(
      <HandView 
        hand={['Card A', 'Card B', 'Card C']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection}
        playOrderSequence={playOrderSequence}
        planningPhase={true}
        onSelectForPlayOrder={mockSelectForPlayOrder}
        onDeselectFromPlayOrder={mockDeselectFromPlayOrder}
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Card B should have badge with "1"
    const cardBBadge = cards[1].querySelector('.card__sequence-badge')
    expect(cardBBadge).toBeInTheDocument()
    expect(cardBBadge).toHaveTextContent('1')
    
    // Card A should have badge with "2"
    const cardABadge = cards[0].querySelector('.card__sequence-badge')
    expect(cardABadge).toBeInTheDocument()
    expect(cardABadge).toHaveTextContent('2')
    
    // Card C should have badge with "3"
    const cardCBadge = cards[2].querySelector('.card__sequence-badge')
    expect(cardCBadge).toBeInTheDocument()
    expect(cardCBadge).toHaveTextContent('3')
  })
  
  // Test: Cards not in sequence have no badge
  it('does not render badge for cards not in playOrderSequence', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'Card A' },
      { instanceId: 'card-2', card: 'Card B' },
    ]
    const playOrderSequence = ['card-1']
    
    render(
      <HandView 
        hand={['Card A', 'Card B']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection}
        playOrderSequence={playOrderSequence}
        planningPhase={true}
        onSelectForPlayOrder={mockSelectForPlayOrder}
        onDeselectFromPlayOrder={mockDeselectFromPlayOrder}
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Card A should have badge
    expect(cards[0].querySelector('.card__sequence-badge')).toBeInTheDocument()
    
    // Card B should NOT have badge
    expect(cards[1].querySelector('.card__sequence-badge')).not.toBeInTheDocument()
  })
  
  // Test: Planning phase sets data attribute
  it('sets data-planning-phase attribute when planningPhase is true', () => {
    render(
      <HandView 
        hand={['Card A']} 
        handCards={[{ instanceId: 'card-1', card: 'Card A' }]}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection}
        playOrderSequence={[]}
        planningPhase={true}
        onSelectForPlayOrder={mockSelectForPlayOrder}
        onDeselectFromPlayOrder={mockDeselectFromPlayOrder}
      />
    )
    
    const container = screen.getByRole('region', { name: /current hand/i })
    const handContainer = container.querySelector('.hand-container')
    
    expect(handContainer).toHaveAttribute('data-planning-phase', 'true')
  })
  
  // Test: Accessible labels include play order info
  it('includes play order position in aria-label when card is in sequence', () => {
    const testHandCards = [
      { instanceId: 'card-1', card: 'Fireball' },
      { instanceId: 'card-2', card: 'Shield' },
    ]
    const playOrderSequence = ['card-2', 'card-1']
    
    render(
      <HandView 
        hand={['Fireball', 'Shield']} 
        handCards={testHandCards}
        selectedCardIds={new Set<string>()} 
        onToggleCardSelection={mockToggleSelection}
        playOrderSequence={playOrderSequence}
        planningPhase={true}
        onSelectForPlayOrder={mockSelectForPlayOrder}
        onDeselectFromPlayOrder={mockDeselectFromPlayOrder}
      />
    )
    
    const cards = screen.getAllByRole('button')
    
    // Shield (card-2) is first in sequence
    expect(cards[1]).toHaveAttribute('aria-label', 'Card: Shield, Play order: 1')
    
    // Fireball (card-1) is second in sequence
    expect(cards[0]).toHaveAttribute('aria-label', 'Card: Fireball, Play order: 2')
  })
})
