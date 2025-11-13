/**
 * WarningBanner component (US1)
 * Displays warnings and errors with appropriate aria-live regions
 * - Warnings use aria-live="polite" (non-disruptive)
 * - Errors use aria-live="assertive" (immediate attention)
 */

interface WarningBannerProps {
  warning: string | null
  error: string | null
}

export function WarningBanner({ warning, error }: WarningBannerProps) {
  if (!warning && !error) {
    return null
  }

  return (
    <div>
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            border: '1px solid #c00',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {warning && !error && (
        <div 
          role="alert"
          aria-live="polite"
          style={{ 
            padding: '1rem', 
            backgroundColor: '#ffc', 
            border: '1px solid #cc0',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        >
          <strong>Warning:</strong> {warning}
        </div>
      )}
    </div>
  )
}
