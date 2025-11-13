describe('deckReducer', () => {
  test.todo('INIT action should initialize deck state')
  
  test.todo('DEAL_NEXT_HAND should deal correct number of cards')
  
  test.todo('END_TURN should move hand to discard pile')
  
  test.todo('APPLY_JSON_OVERRIDE should replace deck')
  
  test.todo('CHANGE_PARAMETERS with immediateReset should reset state')
  
  test('placeholder test to ensure initial failure', () => {
    expect(true).toBe(false) // Intentionally failing
  })
})

describe('dealNextHand', () => {
  test.todo('should reshuffle discard pile when draw pile is empty')
  
  test.todo('should set warning when insufficient cards')
})

describe('endTurn', () => {
  test.todo('should ignore action when isDealing is true')
  
  test.todo('should increment turn number')
})
