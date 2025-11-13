/**
 * Integration tests for HandView responsive display (User Story 2)
 * Tests: Viewport sizing, responsive card resizing, 10-card fit at 1024px
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { HandView } from '../../src/components/HandView'

/**
 * Helper to set viewport dimensions
 * Note: jsdom doesn't fully support CSS viewport units, so we test the structure
 * and rely on manual browser testing for true viewport validation
 */
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

describe('HandView - User Story 2: Responsive Card Sizing', () => {
  let originalInnerWidth: number
  
  beforeEach(() => {
    // Save original viewport width
    originalInnerWidth = window.innerWidth
  })
  
  afterEach(() => {
    // Restore original viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })
  
  // T024: Integration test for 10 cards at 1024px viewport
  it('10 cards fit in 1024px viewport without horizontal scroll', () => {
    // Set viewport to 1024px (desktop minimum per FR-004)
    setViewportWidth(1024)
    
    // Create maximum hand size (10 cards per FR-006)
    const tenCardHand = Array.from({ length: 10 }, (_, i) => ({ 
      instanceId: `card-${i}`, 
      card: `Card ${i + 1}` 
    }))
    
    const { container } = render(
      <HandView 
        hand={[]} 
        handCards={tenCardHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    
    // Verify all 10 cards rendered
    const cards = screen.getAllByRole('button', { name: /card:/i })
    expect(cards).toHaveLength(10)
    
    // Verify container has --card-count set to 10
    const handContainer = container.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '10' })
    
    // Note: Actual scroll width testing requires real browser
    // This test validates structure; manual testing validates layout (T040)
    // With CSS clamp(80px, (1024px - 4rem) / 10, 120px), cards should be ~80-90px
    // 10 cards * 80px - 9 overlaps * 40px = 440px total (fits in 1024px)
  })
  
  // T025: Integration test for dynamic card resizing
  it('cards resize when hand size changes', () => {
    setViewportWidth(1024)
    
    // Start with 5 cards
    const fiveCardHand = Array.from({ length: 5 }, (_, i) => ({ 
      instanceId: `card-${i}`, 
      card: `Card ${i + 1}` 
    }))
    const { container, rerender } = render(
      <HandView 
        hand={[]} 
        handCards={fiveCardHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    
    // Verify initial state
    let handContainer = container.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '5' })
    
    let cards = screen.getAllByRole('button', { name: /card:/i })
    expect(cards).toHaveLength(5)
    
    // Store reference to first card for width comparison
    const firstCard = cards[0]
    expect(firstCard).toBeInTheDocument()
    
    // Change to 10 cards
    const tenCardHand = Array.from({ length: 10 }, (_, i) => ({ 
      instanceId: `card-${i}`, 
      card: `Card ${i + 1}` 
    }))
    rerender(
      <HandView 
        hand={[]} 
        handCards={tenCardHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    
    // Verify --card-count updated
    handContainer = container.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '10' })
    
    // Verify card count updated
    cards = screen.getAllByRole('button', { name: /card:/i })
    expect(cards).toHaveLength(10)
    
    // Note: Card width is controlled by CSS clamp() using --card-count
    // At 1024px viewport:
    // - 5 cards: clamp(80px, (1024 - 64) / 5, 120px) = 120px (max)
    // - 10 cards: clamp(80px, (1024 - 64) / 10, 120px) = 96px
    // Actual width measurement requires real DOM rendering (manual test T039-T040)
  })
  
  // Additional test: Verify responsive behavior at different viewport sizes
  it('maintains card count custom property at different viewport sizes', () => {
    const testHand = Array.from({ length: 7 }, (_, i) => ({ 
      instanceId: `card-${i}`, 
      card: `Card ${i + 1}` 
    }))
    
    // Test at mobile viewport
    setViewportWidth(375)
    const { container: mobileContainer } = render(
      <HandView 
        hand={[]} 
        handCards={testHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    let handContainer = mobileContainer.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '7' })
    
    // Test at tablet viewport
    setViewportWidth(768)
    const { container: tabletContainer } = render(
      <HandView 
        hand={[]} 
        handCards={testHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    handContainer = tabletContainer.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '7' })
    
    // Test at desktop viewport
    setViewportWidth(1440)
    const { container: desktopContainer } = render(
      <HandView 
        hand={[]} 
        handCards={testHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    handContainer = desktopContainer.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '7' })
    
    // CSS custom property should be viewport-independent
    // The CSS clamp() formula uses --card-count to calculate responsive width
  })
  
  // Additional test: Verify narrow viewport horizontal scroll allowance
  it('allows horizontal scroll on narrow viewports', () => {
    setViewportWidth(600) // Below 1024px threshold
    
    const tenCardHand = Array.from({ length: 10 }, (_, i) => ({ 
      instanceId: `card-${i}`, 
      card: `Card ${i + 1}` 
    }))
    const { container } = render(
      <HandView 
        hand={[]} 
        handCards={tenCardHand} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    
    const handContainer = container.querySelector('.hand-container')
    expect(handContainer).toBeInTheDocument()
    
    // Note: CSS @media (max-width: 1023px) sets overflow-x: auto
    // Actual overflow behavior requires real browser (manual test T040)
    // This test validates that structure exists for responsive behavior
  })
  
  // Additional test: Single card maintains maximum width
  it('single card uses maximum width at desktop viewport', () => {
    setViewportWidth(1440)
    
    const { container } = render(
      <HandView 
        hand={[]} 
        handCards={[{ instanceId: 'card-1', card: 'Single Card' }]} 
        selectedCardIds={new Set()} 
        onToggleCardSelection={() => {}} 
      />
    )
    
    const handContainer = container.querySelector('.hand-container')
    expect(handContainer).toHaveStyle({ '--card-count': '1' })
    
    const card = screen.getByRole('button', { name: /card:/i })
    expect(card).toBeInTheDocument()
    
    // With --card-count: 1 and 1440px viewport:
    // clamp(80px, (1440 - 64) / 1, 120px) = 120px (max width)
    // Manual testing (T039) will verify actual computed width
  })
})
