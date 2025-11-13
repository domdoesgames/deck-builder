/**
 * CSS Custom Property Type Augmentation
 * Extends React.CSSProperties to support custom CSS properties used in HandView
 */

import 'react'

declare module 'react' {
  interface CSSProperties {
    '--card-count'?: number | string
    '--card-index'?: number | string
  }
}
