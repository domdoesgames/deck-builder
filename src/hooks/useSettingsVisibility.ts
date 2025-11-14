import { useState } from 'react';

export interface UseSettingsVisibilityReturn {
  isExpanded: boolean;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export function useSettingsVisibility(): UseSettingsVisibilityReturn {
  // Always default to closed (false), no persistence
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return {
    isExpanded,
    toggleExpanded: () => {
      setIsExpanded(prev => !prev);
    },
    setExpanded: (expanded: boolean) => {
      setIsExpanded(expanded);
    }
  };
}
