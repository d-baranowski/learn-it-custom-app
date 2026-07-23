import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
} from 'react';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { GenericListResponse } from '~/_lib/grid/types/list-response';
import { ConnectError } from '@connectrpc/connect';
import { Permission } from '@gen/permissions';
import { deleteDescriptor } from '~/_lib/grid/components/delete-action-menu-item';
import { Breakpoint } from '@mui/material';

interface GridSettingsContextType<O extends Record<string, any>> {
  gridName: string;
  rows?: O[];
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<GenericListResponse<O>, ConnectError>>;
  isFetching: boolean;
  permission: Permission;
  deleteMethod?: deleteDescriptor | undefined;
  importConfig?: any;
  form?: {
    formName: string;
    /**
     * Entity grouping for the new forms framework. Defaults to
     * `paramCase(gridName)` (e.g., gridName "TherapistService" → entityType
     * "therapist-service"); override here only when the form's entityType
     * doesn't match the grid name.
     */
    entityType?: string;
    onCancel?: () => void;
    afterSave?: () => void;
  };
  dialogMaxWidth?: Breakpoint | undefined;
  dialogInitialHeight?: number;
  dialogTitle?: string;
  dialogFullScreen?: undefined | boolean;
  formPropsMapper?: (row: O | undefined) => any;
}

export const GridSettingsContext = createContext<GridSettingsContextType<any> | undefined>(
  undefined,
);

interface GridProviderProps<O extends Record<string, any>> {
  gridName: string;
  children?: ReactNode;
  rows?: O[];
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<GenericListResponse<O>, ConnectError>>;
  isFetching: boolean;
  permission: Permission;
  deleteMethod?: deleteDescriptor | undefined;
  importConfig?: any;
  form?: {
    formName: string;
    entityType?: string;
    onCancel?: () => void;
    afterSave?: (row?: O) => void;
  };
  dialogMaxWidth?: Breakpoint | undefined;
  dialogInitialHeight?: number;
  dialogTitle?: string;
  dialogFullScreen?: undefined | boolean;
  formPropsMapper?: (row: O) => any;
}

export const GridSettingsProvider: React.FC<GridProviderProps<any>> = <
  O extends Record<string, any>,
>(
  props: GridProviderProps<O>,
): ReactElement => {
  const { children, ...rest } = props;
  return <GridSettingsContext.Provider value={rest}>{children}</GridSettingsContext.Provider>;
};

export function useGridSettings<
  O extends Record<string, any>,
>(): GridSettingsContextType<O> {
  const context = useContext(GridSettingsContext);
  if (!context) {
    throw new Error('useGridSettings must be used within a GridSettingsProvider');
  }
  return context;
}
