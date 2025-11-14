import { useEffect, useRef } from 'react';
import { useSettingsVisibility } from '../hooks/useSettingsVisibility';
import './SettingsPanel.css';

export interface SettingsPanelProps {
  error: string | null;
  children: React.ReactNode;
}

export function SettingsPanel({ error, children }: SettingsPanelProps) {
  const { isExpanded, toggleExpanded, setExpanded } = useSettingsVisibility();
  const errorCountRef = useRef(0);

  // Auto-expand on new errors
  useEffect(() => {
    if (error && !isExpanded) {
      // New error occurred while collapsed
      if (errorCountRef.current === 0) {
        // First error detection - expand panel
        setExpanded(true);
        errorCountRef.current = 1;
      }
      // else: Already saw an error, don't re-expand
    } else if (!error) {
      // Error cleared, reset counter for next error
      errorCountRef.current = 0;
    }
  }, [error, isExpanded, setExpanded]);

  return (
    <div className="settings-panel">
      <button
        className="settings-toggle"
        aria-expanded={isExpanded}
        aria-controls="settings-content"
        type="button"
        onClick={toggleExpanded}
      >
        Settings
        <span className="toggle-icon" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
      
      <div
        id="settings-content"
        className={`settings-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        role="region"
        aria-labelledby="settings-toggle"
      >
        <div className="settings-content__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
