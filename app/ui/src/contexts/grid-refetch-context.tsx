import { useContext } from 'react';
import { GridSettingsContext } from '~/_lib/grid/context/grid-settings-context';

interface GridRefetchContextType {
  refetch: () => void;
}

export const useGridRefetch = (): GridRefetchContextType => {
  const context = useContext(GridSettingsContext);
  if (!context) {
    throw new Error('useGridRefetch must be used within a GridRefetchProvider');
  }
  return { refetch: context.refetch };
};
