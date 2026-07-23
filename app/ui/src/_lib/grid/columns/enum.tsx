import {GridColumn} from '@gen/grids';
import {enumKeys, enums} from '@gen/enums';
import {defaultColumn} from '~/_lib/grid/columns/default';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import EnumArrayRenderer from "~/components/enum-array";
import {CellRenderer} from "~/_lib/grid/columns/cell_renderers";
import React from "react";
import EnumRenderer from '~/components/enum';

export function enumColumn(col: GridColumn): ReduxStoreColumnDef {
  if (col.type.endsWith("[]")) {
    return enumArrayColumn(col);
  }

  const enumKey = col.type as enumKeys;

  if (enumKey in enums) {
    return {
      id: col.id,
      accessorKey: col.id,
      cellRendererType: 'enum',
      header: col.header,
      visible: col.visible,
      type: col.type,
    };
  } else {
    console.error(`Invalid enum type: ${col.type}`);

    return defaultColumn(col);
  }
}

export const enumCell: (col: ReduxStoreColumnDef) => CellRenderer = (col) => {
  const enumKey = col.type as enumKeys;

  if (enumKey in enums) {
    return function EnumCell({cell}) {
      return (
        <EnumRenderer value={cell.getValue<number>()} enumKey={enumKey}/>
      );
    };
  }

  return undefined;
};


export function enumArrayColumn(c: GridColumn): ReduxStoreColumnDef {
  const type = c.type.slice(0, -2) as enumKeys;
  const enumKey = type as enumKeys;

  if (enumKey in enums) {
    return {
      id: c.id,
      accessorKey: c.id,
      cellRendererType: 'enumArray',
      header: c.header,
      visible: c.visible,
      type: c.type,
    };
  } else {
    return defaultColumn(c);
  }
}

export const enumArrayCell: (col: ReduxStoreColumnDef) => CellRenderer = (col) => {
  const type = col?.type?.slice(0, -2) as enumKeys;

  const enumKey = type as enumKeys;

  if (enumKey in enums) {
    return ({cell}) => EnumArrayRenderer({values: cell.getValue<number[]>(), enumKey: enumKey});
  }

  return undefined;
};
