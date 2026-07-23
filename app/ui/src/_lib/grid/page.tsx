import React, { FC, ReactElement, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { deleteDescriptor } from '~/_lib/grid/components/delete-action-menu-item';
import Breadcrumb from '~/components/breadcrumb/breadcrumb';
import { Permission } from '@gen/permissions';
import { Seo } from '~/components/seo';
import { messages } from '@gen/factory';
import type { MethodUnaryDescriptor } from '@connectrpc/connect-query';
import { Breakpoint } from '@mui/material';
import { Grid as GeneratedGrid } from '@gen/grids';
import { capitalCase } from 'change-case';
import GridActions from '~/_lib/grid/components/grid-actions';
import { StaticGridContainer } from '~/_lib/grid/components/grid-container';
import GridTopToolbar from '~/_lib/grid/components/grid-top-toolbar';
import Grid from './grid';
import { GridSettingsProvider } from '~/_lib/grid/context/grid-settings-context';
import useShareToken from '~/_lib/grid/hooks/use-share-token';
import useGridViewBootstrap from '~/_lib/grid/hooks/use-grid-view-bootstrap';
import useGridInitialise from '~/_lib/grid/hooks/use-grid-initialise';
import useGridWithStore from '~/_lib/grid/hooks/use-grid-with-store';
import { GenericListResponse } from '~/_lib/grid/types/list-response';
import { NextPage } from 'next';
import { WhereOperator } from '@gen/request/v1/base_pb';
import { useGridDispatch, useGridSelector } from './state/hooks';
import { filtersClear, overrideFiltersSet } from './state/grids-slice';
import {
  makeListKey,
  OptimisticRow,
  optimisticRowsActions,
} from '~/_lib/forms/optimistic/optimistic-rows-slice';
import {
  OPTIMISTIC_PENDING_FIELD,
} from '~/_lib/forms/optimistic/optimistic-list';
import { useTranslation } from 'next-i18next';
import { GridColumnDef } from './types/column';
import { GridContextMenuItems } from '~/_lib/grid/pure-grid';
import { subscribeRpgWindowEvent } from '~/_lib/window/window-events';

interface LayoutProps {
  children?: ReactNode;
}
interface BackgroundOption {
  columnName: string;
  color: string;
  compareValue: any;
}

interface GridPageProps<
  K extends keyof typeof messages,
  ItemType extends Record<string, any>,
> {
  seoTitle?: string;
  breadcrumbLabel?: string;
  permission: Permission;
  grid: GeneratedGrid;
  gridType: K;
  listViewMethod: MethodUnaryDescriptor<any, GenericListResponse<ItemType>>;
  deleteMethod?: deleteDescriptor;
  form?: {
    formName: string;
    /** Override entityType for the new forms framework; defaults to paramCase(gridType). */
    entityType?: string;
    onCancel?: () => void;
    afterSave?: (formData?: any) => void;
  };
  importConfig?: any;
  // todo: importMethod
  layout: FC<LayoutProps>;

  hideBreadcrumb?: boolean;
  hideActions?: boolean;
  dialogMaxWidth?: Breakpoint;
  dialogInitialHeight?: number;
  dialogTitle?: string;
  dialogFullScreen?: boolean;
  formPropsMapper?: (row: ItemType) => any;
  ignoreLayout?: boolean;
  backgroundOptions?: BackgroundOption[];
  statusCellNumber?: number;
  overrideFilters?: {
    id: string;
    value: any;
    operator: WhereOperator;
  }[];
  extraColumns?: GridColumnDef<any>;
  additionalActions?: ReactElement[];
  contextMenuItems?: GridContextMenuItems<ItemType>;
}

const GridPage: NextPage<GridPageProps<any, any>> = <
  K extends keyof typeof messages,
  O extends Record<string, any>,
>(
  props: GridPageProps<K, O>,
): ReactElement => {
  const {
    seoTitle = 'HRMS',
    breadcrumbLabel,

    grid: gridDef,
    gridType,
    listViewMethod,

    dialogTitle,

    permission,
    deleteMethod,
    form,
    importConfig,
    layout: LayoutComponent,
    backgroundOptions,
    statusCellNumber,

    dialogFullScreen,
    formPropsMapper,
    overrideFilters,
    extraColumns,
    additionalActions,
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
    }
    // in case override filter already do something with the filter state
    else {
      dispatch(filtersClear({ gridName: gridDef.name }));
    }
  }, [overrideFilters, dispatch, gridDef.name]);

  // Parses the grid state from the URL if present
  useShareToken(gridDef.name);
  // Activates the favourite view on first mount when nothing else applies.
  useGridViewBootstrap(gridDef.name);

  const { data, isLoading, isFetching, refetch } = useGridWithStore<K, O>({
    list: props.listViewMethod,
    name: gridDef.name,
    type: gridType,
  });

  const { t } = useTranslation('common');
  const Wrapper = props.ignoreLayout ? React.Fragment : LayoutComponent;

  // Keep refetch and form callbacks in refs so the (long-lived) event listeners
  // always call the latest versions without needing to re-subscribe on every render.
  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Subscribe ONCE on mount and clean up on unmount. Previously the
  // subscribe calls lived in the render body which leaked listeners on every
  // re-render and held stale refetch closures, causing the grid not to refresh
  // after a form save (e2e flake: TA_E2E_03/05, SES_E2E_04, SES_E2E_08, etc.)
  React.useEffect(() => {
    const unsubSaved = subscribeRpgWindowEvent("rpg:window:saved", (event) => {
      const f = formRef.current;
      if (event.detail.formName === f?.formName) {
        refetchRef.current();
        f?.afterSave?.(event.detail.data);
      }
    });

    const unsubClosed = subscribeRpgWindowEvent("rpg:window:closed", (event) => {
      const f = formRef.current;
      if (event.detail.formName === f?.formName) {
        f?.onCancel?.();
      }
    });

    return () => {
      unsubSaved();
      unsubClosed();
    };
  }, []);

  return (
    <Wrapper>
      <GridSettingsProvider
        gridName={gridDef.name}
        rows={data?.items || []}
        refetch={refetch}
        isFetching={isFetching}
        permission={permission}
        deleteMethod={deleteMethod}
        importConfig={importConfig}
        form={form}
        dialogMaxWidth={props.dialogMaxWidth}
        dialogInitialHeight={props.dialogInitialHeight}
        dialogTitle={dialogTitle ?? capitalCase(gridType)}
        dialogFullScreen={dialogFullScreen}
        formPropsMapper={formPropsMapper}
      >
        <Seo title={t(seoTitle)} />
        {!props.hideBreadcrumb && <Breadcrumb label={breadcrumbLabel ?? seoTitle ?? ''} />}
        <Box
          component="main"
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <StaticGridContainer>
            {!props.hideActions && (
              <GridTopToolbar>
                <GridActions additonalActions={additionalActions} />
              </GridTopToolbar>
            )}
            <GridWithOptimisticRows
              data={data?.items || []}
              isLoading={isLoading}
              gridDef={gridDef}
              refetch={refetch}
              extraColumns={extraColumns}
              backgroundOptions={backgroundOptions}
              statusCellNumber={statusCellNumber}
              listServiceTypeName={(listViewMethod as MethodUnaryDescriptor<any, any>).service.typeName}
              listMethodName={(listViewMethod as MethodUnaryDescriptor<any, any>).name}
              contextMenuItems={contextMenuItems}
            />
          </StaticGridContainer>
        </Box>
      </GridSettingsProvider>
    </Wrapper>
  );
};

Object.defineProperty(GridPage, 'permission', {
  value: (props: GridPageProps<any, any>) => props.permission,
  writable: false,
});

interface GridWithOptimisticRowsProps {
  data: Array<Record<string, any>>;
  isLoading: boolean;
  gridDef: GeneratedGrid;
  refetch: () => void;
  extraColumns?: GridColumnDef<any>;
  backgroundOptions?: BackgroundOption[];
  statusCellNumber?: number;
  listServiceTypeName: string;
  listMethodName: string;
  contextMenuItems?: GridContextMenuItems<any>;
}

// Prepends in-flight optimistic Create rows from the Redux slice into the
// rendered grid data. Pure-grid renders these with `data-optimistic-pending="true"`
// and a striped overlay; click/dblclick on pending rows is a no-op.
//
// Stale temp entries are drained when the grid's `data` reference changes
// (a refetch landed and the real entity is now in cache).
const GridWithOptimisticRows: FC<GridWithOptimisticRowsProps> = ({
  data,
  listServiceTypeName,
  listMethodName,
  ...rest
}) => {
  const listKey = makeListKey(listServiceTypeName, listMethodName);
  const optRows = useGridSelector(
    (s) => s.optimisticRows?.byList?.[listKey] ?? [],
  );
  const realIds = React.useMemo(
    () => new Set(data.map((r) => (r as { id?: string }).id)),
    [data],
  );
  const merged = React.useMemo(() => {
    if (optRows.length === 0) return data;
    const tempRows = optRows
      .filter((r: OptimisticRow) => !realIds.has(r.id))
      .map((r: OptimisticRow) => ({
        ...r.data,
        id: r.id,
        [OPTIMISTIC_PENDING_FIELD]: true,
      }));
    return tempRows.length > 0 ? [...tempRows, ...data] : data;
  }, [data, optRows, realIds]);
  const dispatch = useGridDispatch();
  const prevDataRef = React.useRef(data);
  React.useEffect(() => {
    if (prevDataRef.current !== data && optRows.length > 0) {
      for (const r of optRows) {
        dispatch(
          optimisticRowsActions.optimisticRowRemoved({ listKey, id: r.id }),
        );
      }
    }
    prevDataRef.current = data;
  }, [data, optRows, listKey, dispatch]);
  return <Grid data={merged} {...rest} />;
};

export default React.memo(GridPage, () => true);
