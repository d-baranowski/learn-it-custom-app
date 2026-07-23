import React, { ReactElement } from 'react';
import { deleteDescriptor } from '~/_lib/grid/components/delete-action-menu-item';
import { Permission } from '@gen/permissions';
import { messages } from '@gen/factory';
import type { MethodUnaryDescriptor } from '@connectrpc/connect-query';
import { Box, Breakpoint } from '@mui/material';
import { Grid as GeneratedGrid } from '@gen/grids';
import { capitalCase } from 'change-case';
import Grid from './grid';
import type { GridContextMenuItems } from './pure-grid';
import { GridSettingsProvider } from '~/_lib/grid/context/grid-settings-context';
import useShareToken from '~/_lib/grid/hooks/use-share-token';
import useGridViewBootstrap from '~/_lib/grid/hooks/use-grid-view-bootstrap';
import useGridInitialise from '~/_lib/grid/hooks/use-grid-initialise';
import useGridWithStore from '~/_lib/grid/hooks/use-grid-with-store';
import { GenericListResponse } from '~/_lib/grid/types/list-response';
import { NextPage } from 'next';
import { WhereOperator } from '@gen/request/v1/base_pb';
import { useGridDispatch } from './state/hooks';
import { filtersClear, overrideFiltersSet } from './state/grids-slice';
import { GridColumnDef } from './types/column';
import { useDialog2Size } from '~/components/dialog/dialog2-size-context';
import { subscribeRpgWindowEvent } from '~/_lib/window/window-events';
import { isEqual } from 'lodash';

interface BackgroundOption {
  columnName: string;
  color: string;
  compareValue: any;
}

export interface GridTabForm {
  formName: string;
  entityType?: string;
  onCancel?: () => void;
  afterSave?: (formData?: any) => void;
}

export interface GridTabOverrideFilter {
  id: string;
  value: any;
  operator: WhereOperator;
}

export interface GridTabProps<
  K extends keyof typeof messages,
  ItemType extends Record<string, any>,
> {
  permission: Permission;
  grid: GeneratedGrid;
  gridType: K;
  listViewMethod: MethodUnaryDescriptor<any, GenericListResponse<ItemType>>;
  deleteMethod?: deleteDescriptor;
  form?: GridTabForm;
  dialogMaxWidth?: Breakpoint;
  dialogInitialHeight?: number;
  dialogTitle?: string;
  dialogFullScreen?: boolean;
  formPropsMapper?: (row: ItemType) => any;
  backgroundOptions?: BackgroundOption[];
  statusCellNumber?: number;
  overrideFilters?: GridTabOverrideFilter[];
  extraColumns?: GridColumnDef<any>;
  additionalActions?: ReactElement[];
  contextMenuItems?: GridContextMenuItems<ItemType>;
  disableQuickFilters?: boolean;
  extraHeightReduction?: number;
}

function GridTab<
  K extends keyof typeof messages,
  O extends Record<string, any>,
>(props: GridTabProps<K, O>): ReactElement {
  const {
    grid: gridDef,
    gridType,
    dialogTitle,
    permission,
    deleteMethod,
    form,
    backgroundOptions,
    statusCellNumber,
    dialogFullScreen,
    formPropsMapper,
    overrideFilters,
    extraColumns,
    contextMenuItems,
  } = props;
  const dispatch = useGridDispatch();

  useGridInitialise(gridDef);

  React.useEffect(() => {
    if (overrideFilters) {
      dispatch(
        overrideFiltersSet({
          gridName: gridDef.name,
          overrideFilters: overrideFilters,
        }),
      );
    } else {
      dispatch(filtersClear({ gridName: gridDef.name }));
    }
  }, [overrideFilters, dispatch, gridDef.name]);

  useShareToken(gridDef.name);
  useGridViewBootstrap(gridDef.name);

  const { data, isLoading, isFetching, refetch } = useGridWithStore<K, O>({
    list: props.listViewMethod,
    name: gridDef.name,
    type: gridType,
  });

  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);
  React.useEffect(() => {
    const unsubSaved = subscribeRpgWindowEvent('rpg:window:saved', (event) => {
      const f = formRef.current;
      if (event.detail.formName === f?.formName) {
        refetchRef.current();
        f?.afterSave?.(event.detail.data);
      }
    });
    return () => {
      unsubSaved();
    };
  }, []);

  // Extra vertical space to leave below the grid — use it when the form keeps a
  // footer (Save/Cancel) on the grid tab, which the default reservation assumes
  // is absent.
  const extraHeightReduction = props.extraHeightReduction ?? 0;
  const size = useDialog2Size();
  let width = `calc(${size.width}px - 50px)`;
  let height = `calc(${size.height}px - ${170 + extraHeightReduction}px)`;
  if (size.isFullScreen) {
    width = `calc(100vw - 80px)`;
    height = `calc(100vh - ${230 + extraHeightReduction}px)`;
  }

  const resolvedDialogTitle = dialogTitle ?? capitalCase(gridType);

  return (
    <GridSettingsProvider
      gridName={gridDef.name}
      rows={data?.items || []}
      refetch={refetch}
      isFetching={isFetching}
      permission={permission}
      deleteMethod={deleteMethod}
      importConfig={undefined}
      form={form}
      dialogMaxWidth={props.dialogMaxWidth}
      dialogInitialHeight={props.dialogInitialHeight}
      dialogTitle={resolvedDialogTitle}
      dialogFullScreen={dialogFullScreen}
      formPropsMapper={formPropsMapper}
    >
      <Box
        sx={{
          width,
          height,
          minHeight: 0,
        }}
      >
        <Grid
          data={data?.items || []}
          isLoading={isLoading}
          gridDef={gridDef}
          refetch={refetch}
          extraColumns={extraColumns}
          backgroundOptions={backgroundOptions}
          statusCellNumber={statusCellNumber}
          contextMenuItems={contextMenuItems}
          disableQuickFilters={props.disableQuickFilters}
          customHeightReduction={120}
        />
      </Box>
    </GridSettingsProvider>
  );
}

const MemoizedGridTab = React.memo(GridTab, (prevProps, nextProps) => {
  console.log('DEBUG GridTab: Memoization check', prevProps.gridType);

  if (prevProps.permission !== nextProps.permission) {
    console.log('DEBUG GridTab: permission changed');
    return false;
  }

  if (prevProps.grid !== nextProps.grid) {
    console.log('DEBUG GridTab: grid changed');
    return false;
  }

  if (prevProps.gridType !== nextProps.gridType) {
    console.log('DEBUG GridTab: gridType changed');
    return false;
  }

  if (prevProps.listViewMethod !== nextProps.listViewMethod) {
    console.log('DEBUG GridTab: listViewMethod changed');
    return false;
  }

  if (prevProps.deleteMethod !== nextProps.deleteMethod) {
    console.log('DEBUG GridTab: deleteMethod changed');
    return false;
  }

  if (!isEqual(prevProps.form, nextProps.form)) {
    console.log('DEBUG GridTab: form changed');
    return false;
  }

  if (prevProps.dialogMaxWidth !== nextProps.dialogMaxWidth) {
    console.log('DEBUG GridTab: dialogMaxWidth changed');
    return false;
  }

  if (prevProps.dialogInitialHeight !== nextProps.dialogInitialHeight) {
    return false;
  }

  if (prevProps.dialogTitle !== nextProps.dialogTitle) {
    console.log('DEBUG GridTab: dialogTitle changed');
    return false;
  }

  if (prevProps.dialogFullScreen !== nextProps.dialogFullScreen) {
    console.log('DEBUG GridTab: dialogFullScreen changed');
    return false;
  }

  if (prevProps.formPropsMapper !== nextProps.formPropsMapper) {
    console.log('DEBUG GridTab: formPropsMapper changed');
    return false;
  }

  if (!isEqual(prevProps.backgroundOptions, nextProps.backgroundOptions)) {
    console.log('DEBUG GridTab: backgroundOptions changed');
    return false;
  }

  if (prevProps.statusCellNumber !== nextProps.statusCellNumber) {
    console.log('DEBUG GridTab: statusCellNumber changed');
    return false;
  }

  if (!isEqual(prevProps.overrideFilters, nextProps.overrideFilters)) {
    console.log('DEBUG GridTab: overrideFilters changed');
    return false;
  }

  if (prevProps.extraColumns !== nextProps.extraColumns) {
    console.log('DEBUG GridTab: extraColumns changed');
    return false;
  }

  if (!isEqual(prevProps.additionalActions, nextProps.additionalActions)) {
    console.log('DEBUG GridTab: additionalActions changed');
    return false;
  }

  if (prevProps.disableQuickFilters !== nextProps.disableQuickFilters) {
    return false;
  }

  if (prevProps.extraHeightReduction !== nextProps.extraHeightReduction) {
    return false;
  }

  return true;
}) as <K extends keyof typeof messages, O extends Record<string, any>>(
  props: GridTabProps<K, O>,
) => ReactElement;

Object.defineProperty(MemoizedGridTab, 'permission', {
  value: (props: GridTabProps<any, any>) => props.permission,
  writable: false,
});

export default MemoizedGridTab;
