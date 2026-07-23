import {GridColumn} from '@gen/grids';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import {useTranslation} from 'next-i18next';

export function stringArrayColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'stringArray',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const stringArrayCell: (col: ReduxStoreColumnDef) => CellRenderer = () =>
  function StringArrayCell({cell}) {
    const {t} = useTranslation();
    const value = cell.getValue<string[] | null | undefined>() ?? [];
    return <>{value.map((m) => t(m)).join(', ')}</>;
  };

export function numberArrayColumn(col: GridColumn): ReduxStoreColumnDef {
  return {
    id: col.id,
    accessorKey: col.id,
    cellRendererType: 'numberArray',
    header: col.header,
    visible: col.visible,
    type: col.type,
  };
}

export const numberArrayCell: (col: ReduxStoreColumnDef) => CellRenderer = () => ({cell}) => (cell.getValue<number[] | null | undefined>() ?? []).join(', ');
