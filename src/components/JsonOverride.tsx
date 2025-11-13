import { useState } from 'react'

/**
 * JsonOverride component (US2)
 * Textarea and button for applying custom deck JSON
 */

interface JsonOverrideProps {
  onApplyJsonOverride: (jsonString: string) => void
}

export function JsonOverride({ onApplyJsonOverride }: JsonOverrideProps) {
  const [value, setValue] = useState('')

  const handleApply = () => {
    onApplyJsonOverride(value)
  }

  return (
    <div>
      <h2>JSON Deck Override</h2>
      <label>
        Deck JSON:
        <textarea 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Enter JSON array of card names...' 
          rows={5}
          aria-label="Deck JSON"
        />
      </label>
      <button onClick={handleApply}>Apply Deck</button>
    </div>
  )
}
