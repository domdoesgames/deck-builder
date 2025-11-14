import { useState } from 'react'

/**
 * JsonOverride component (US2)
 * Textarea and button for applying custom deck JSON
 */

interface JsonOverrideProps {
  onApplyJsonOverride: (jsonString: string) => void
  error: string | null
}

export function JsonOverride({ onApplyJsonOverride, error }: JsonOverrideProps) {
  const [value, setValue] = useState('')

  const handleApply = () => {
    onApplyJsonOverride(value)
  }

  return (
    <div>
      <h2>JSON Deck Override</h2>
      {error && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
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
