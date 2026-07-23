import {Grid as GeneratedGrid, GridColumn} from '@gen/grids';
import {defaultColumn} from '~/_lib/grid/columns/default';
import {booleanColumn} from './boolean';
import {enumColumn} from './enum';
import {numberArrayColumn, stringArrayColumn,} from '~/_lib/grid/columns/array';
import {ReduxStoreColumnDef} from '~/_lib/grid/columns/types';
import {GridColumnDef} from '~/_lib/grid/types/column';
import cell_renderers from '~/_lib/grid/columns/cell_renderers';
import {anyColumn} from './any';
import {googleTimestampColumn} from '~/_lib/grid/columns/google_timestamp';
import {dateTimeColumn} from '~/_lib/grid/columns/date_time_column';
import {dateColumn} from '~/_lib/grid/columns/date';
import {dateStringColumn} from '~/_lib/grid/columns/date_string';
import {timeColumn} from '~/_lib/grid/columns/time';
import {imageColumn} from './image';
import {hourMinutesColumn} from './hour_minute';
import {imageMultipleColumn} from './image_multiple';
import {translatedStringColumn} from "~/_lib/grid/columns/translated_string";
import {translatedStringArrayColumn} from "~/_lib/grid/columns/translated_string_array";
import {colorColumn} from './color';
import {profilePictureColumn} from "~/_lib/grid/columns/profile_picture";
import {therapyDaysColumn} from '~/_lib/grid/columns/therapy_days';
import {roomOrOnlineColumn} from '~/_lib/grid/columns/room_or_online';
import {notificationStatusColumn} from '~/_lib/grid/columns/notification_status';
import {notificationRecipientColumn} from '~/_lib/grid/columns/notification_recipient';

export function columnBuilder(grid: GeneratedGrid): ReduxStoreColumnDef[] {
  const colTypes: Record<string, (col: GridColumn) => ReduxStoreColumnDef> = {
    boolean: booleanColumn,
    'number[]': numberArrayColumn,
    'string[]': stringArrayColumn,
    bigint: dateTimeColumn,
    date: dateColumn,
    dateString: dateStringColumn,
    time: timeColumn,
    image: imageColumn,
    imageMultiple: imageMultipleColumn,
    color: colorColumn,
    ITimestamp: googleTimestampColumn,
    ITranslatedString: translatedStringColumn,
    hourMinutes: hourMinutesColumn,
    translatedStringArray: translatedStringArrayColumn,
    profilePicture: profilePictureColumn,
    therapyDays: therapyDaysColumn,
    roomOrOnline: roomOrOnlineColumn,
    notificationStatus: notificationStatusColumn,
    notificationRecipient: notificationRecipientColumn,
  };

  const result: ReduxStoreColumnDef[] = [];

  for (const col of grid.columns) {
    const gridColumn = col as GridColumn & { orderBy?: string[] };
    let builtColumn: ReduxStoreColumnDef;

    if (col.type == 'any') {
      builtColumn = anyColumn(col);
    } else if (col.columnRendererType && col.columnRendererType in colTypes) {
      builtColumn = colTypes[col.columnRendererType](col);
    } else if (col.enum) {
      builtColumn = enumColumn(col);
    } else if (col.type in colTypes) {
      builtColumn = colTypes[col.type](col);
    } else {
      builtColumn = defaultColumn(col);
    }

    if (gridColumn.orderBy) {
      builtColumn.orderBy = gridColumn.orderBy;
    }

    if (col.filterField) {
      builtColumn.filterField = col.filterField;
    }

    result.push(builtColumn);
  }

  return result;
}

export function toMrtColumnDev<T extends Record<string, any>>(
  col: ReduxStoreColumnDef,
  t: (key: string) => string
): GridColumnDef<T> {
  let cellRenderer = undefined;
  if (col.cellRendererType) {
    const cellRendererGenerator = cell_renderers[col.cellRendererType];
    if (cellRendererGenerator) {
      cellRenderer = cellRendererGenerator(col);
    }
  }

  return {
    id: col.id,
    accessorKey: col.id,
    orderBy: col.orderBy,
    header: t(col.header),
    visible: col.visible,
    Cell: cellRenderer as unknown as any,
    enableSorting: col.enableSorting,
    filterField: col.filterField,
    type: col.type,
    cellRendererType: col.cellRendererType,
  };
}
