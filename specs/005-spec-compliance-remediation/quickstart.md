# Feature 005: Specification Compliance Remediation - Quickstart

## 🎯 What This Feature Does

Systematically addresses 13 implementation gaps between documented specifications (features 001-004) and the actual codebase, bringing the project to 100% compliance with its contracts and specifications.

## 🚀 Quick Overview

**Problem**: Comprehensive audit revealed critical gaps:
- No localStorage persistence despite contract promises (FR-008, FR-009, FR-020)
- Discard count cannot be set to 0 (blocked by validation)
- Locked cards still respond to clicks/keyboard (not immutable)
- Buttons in wrong component (HandView vs DeckControls)
- Missing phase indicators, wrong accessibility roles, visual mismatches

**Solution**: Implement 42 functional requirements across 4 priority levels (Critical → Low)

**Impact**: 
- ✅ Contracts honored → reliable feature behavior
- ✅ State persistence → better UX
- ✅ Correct immutability → game integrity
- ✅ Proper architecture → maintainability

## 📋 Priority Breakdown

### Critical (P1) - Blocking Issues
1. **Persistence Layer** - localStorage for play order state
2. **Zero Discard Count** - Allow discardCount=0 to skip phase
3. **Locked Immutability** - Truly non-interactive locked cards

### High (P2) - Incorrect Behavior  
4. **Component Responsibility** - Move buttons to DeckControls

### Medium (P2-P3) - Incomplete Features
5. **Phase Status Indicators** - "Planning"/"Executing" badges + ARIA
6. **Accessibility Roles** - Use role="article" per contract
7. **Visual Design** - 80-120px cards, 50% overlap
8. **Locked Styling** - Opacity 0.7, grayscale filter
9. **Disabled States** - Show when max selection reached

### Low (P4) - Minor Deviations
10. **Helper Text Format** - Match contract wording
11. **isDealing Flag Usage** - Currently unused
12. **Card Name Handling** - Line-clamp truncation
13. **ARIA Label Details** - Simplified vs contract

## 🔧 Technical Approach

### Persistence Implementation
```typescript
// Auto-save on every state change
useEffect(() => {
  try {
    localStorage.setItem('deck-state', JSON.stringify(state))
  } catch {
    // Silent fallback to in-memory (FR-003)
  }
}, [state])

// Load on mount with validation
const loadState = () => {
  try {
    const raw = localStorage.getItem('deck-state')
    return raw ? validateAndSanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
```

### Zero Discard Fix
```diff
- const validDiscardCount = Math.max(1, Math.floor(discardCount))
+ const validDiscardCount = Math.max(0, Math.floor(discardCount))

- {[1, 2, 3, ...].map(count => <option>{count}</option>)}
+ {[0, 1, 2, 3, ...].map(count => <option>{count}</option>)}
```

### Locked Card Guard
```typescript
const handleCardClick = (id: string) => {
  if (playOrderLocked) return // Stop here!
  // ... rest of logic
}

<div
  tabIndex={playOrderLocked ? -1 : 0}
  className={playOrderLocked ? 'card--locked' : ''}
  onClick={() => !playOrderLocked && handleCardClick(id)}
>
```

## 📊 Success Metrics

- **SC-001**: 100% state persistence success rate
- **SC-004**: discardCount=0 skips phase in 100% of cases  
- **SC-006**: 0 state changes when interacting with locked cards
- **SC-009**: 100% of buttons in DeckControls (0 in HandView)
- **SC-013**: 100% of cards within 80-120px width range

## 🧪 Testing Strategy

**Unit Tests** (New):
- `persistenceManager.test.ts`
- `stateValidator.test.ts`
- `deckReducer.persistence.test.ts`

**Integration Tests** (New):
- `persistenceFlow.test.tsx` - Full save/load cycle
- `zeroDiscardFlow.test.tsx` - Zero count through turn
- `lockedInteraction.test.tsx` - Comprehensive lock tests

**Updated Tests**:
- `deckReducer.test.ts` - Add zero discard cases
- `HandView.test.tsx` - Update role assertions
- `DeckControls.test.tsx` - Add button tests

## 🎯 User Impact

**Before Fix**:
- User locks play order → refreshes page → **state lost** 😞
- User wants to skip discard → **can't set count to 0** 😞
- User locks order → cards still clickable → **confusing** 😞
- Developer looks for buttons → **in wrong component** 😞

**After Fix**:
- User locks order → refreshes → **exact state restored** ✅
- User sets discard to 0 → **phase skipped smoothly** ✅
- User locks order → cards visibly disabled → **clear & immutable** ✅
- Developer maintains code → **proper component structure** ✅

## 📦 Deliverables

1. **Persistence Layer**
   - `useDeckStatePersistence` hook
   - `loadPersistedState` utility
   - `validateAndSanitize` state validator

2. **Component Updates**
   - `DeckControls.tsx` - Add play order buttons + phase indicator
   - `HandView.tsx` - Remove buttons, fix roles, add locked styling
   - `deckReducer.ts` - Allow zero discard, add persistence

3. **CSS Updates**
   - `.card--locked` styles (opacity, grayscale, cursor)
   - `.card--disabled` styles (max selection state)
   - Card dimension adjustments (80-120px range)

4. **Test Suite**
   - 15+ new test files/suites
   - 100+ new test cases
   - Visual regression snapshots

## 🚦 Definition of Done

- [ ] All 42 FRs implemented
- [ ] All 17 success criteria met
- [ ] 100% test coverage for new code
- [ ] All existing tests pass (updated as needed)
- [ ] Accessibility audit confirms WCAG AA
- [ ] Visual regression tests pass
- [ ] Code reviewed by 2 reviewers
- [ ] Documentation updated

## 🔗 Related Documents

- [spec.md](./spec.md) - Full specification with all requirements
- [plan.md](./plan.md) - Detailed implementation plan
- [tasks.md](./tasks.md) - Task breakdown with estimates
- [data-model.md](./data-model.md) - State/type extensions

## ⏱️ Estimated Timeline

- **Phase 1** (Critical): 3-4 days
- **Phase 2** (High): 1-2 days  
- **Phase 3** (Medium/Low): 3-4 days
- **Phase 4** (Testing): 2-3 days

**Total**: 9-13 days (2-3 weeks with testing buffer)

---

**Status**: Ready for implementation planning  
**Next Step**: Create detailed task breakdown and start with Phase 1 (Critical fixes)
