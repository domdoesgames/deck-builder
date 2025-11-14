import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { useSettingsVisibility } from '../../src/hooks/useSettingsVisibility'

/**
 * Unit tests for useSettingsVisibility hook (Feature 008)
 * Tests: State management (no persistence - always defaults to closed)
 */

describe('useSettingsVisibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // Default State Tests
  it('returns false by default (always closed on mount)', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    expect(result.current.isExpanded).toBe(false)
  })

  it('ignores any localStorage data and always defaults to closed', () => {
    // Even if there's data in localStorage, should still default to closed
    localStorage.setItem('deck-builder:settings-expanded', JSON.stringify({ isExpanded: true }))
    
    const { result } = renderHook(() => useSettingsVisibility())
    
    expect(result.current.isExpanded).toBe(false)
  })

  // Toggle Tests
  it('toggleExpanded flips state from false to true', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    expect(result.current.isExpanded).toBe(false)
    
    act(() => {
      result.current.toggleExpanded()
    })
    
    expect(result.current.isExpanded).toBe(true)
  })

  it('toggleExpanded flips state from true to false', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    // First open it
    act(() => {
      result.current.toggleExpanded()
    })
    expect(result.current.isExpanded).toBe(true)
    
    // Then close it
    act(() => {
      result.current.toggleExpanded()
    })
    
    expect(result.current.isExpanded).toBe(false)
  })

  // Direct Set Tests
  it('setExpanded sets state directly to true', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    expect(result.current.isExpanded).toBe(false)
    
    act(() => {
      result.current.setExpanded(true)
    })
    
    expect(result.current.isExpanded).toBe(true)
  })

  it('setExpanded sets state directly to false', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    // First open it
    act(() => {
      result.current.setExpanded(true)
    })
    expect(result.current.isExpanded).toBe(true)
    
    // Then close it
    act(() => {
      result.current.setExpanded(false)
    })
    
    expect(result.current.isExpanded).toBe(false)
  })

  // No Persistence Tests
  it('does not save state to localStorage on toggleExpanded', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    act(() => {
      result.current.toggleExpanded()
    })
    
    // localStorage should not contain settings state
    const saved = localStorage.getItem('deck-builder:settings-expanded')
    expect(saved).toBeNull()
  })

  it('does not save state to localStorage on setExpanded', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    act(() => {
      result.current.setExpanded(true)
    })
    
    // localStorage should not contain settings state
    const saved = localStorage.getItem('deck-builder:settings-expanded')
    expect(saved).toBeNull()
  })

  // Rapid Updates Test
  it('handles rapid state updates', () => {
    const { result } = renderHook(() => useSettingsVisibility())
    
    act(() => {
      result.current.toggleExpanded()
      result.current.toggleExpanded()
      result.current.toggleExpanded()
      result.current.toggleExpanded()
      result.current.toggleExpanded()
    })
    
    // After 5 toggles (starting from false), should be true
    expect(result.current.isExpanded).toBe(true)
  })

  // Remount Test
  it('always starts closed on remount (no persistence)', () => {
    const { result, unmount } = renderHook(() => useSettingsVisibility())
    
    // Open settings
    act(() => {
      result.current.setExpanded(true)
    })
    expect(result.current.isExpanded).toBe(true)
    
    // Unmount
    unmount()
    
    // Remount - should default to closed again
    const { result: result2 } = renderHook(() => useSettingsVisibility())
    expect(result2.current.isExpanded).toBe(false)
  })
})
