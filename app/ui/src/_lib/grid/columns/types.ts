// This needs to be JSON encodable so we can't have functions for cell renderers etc
import {CellRendererName} from '~/_lib/grid/columns/cell_renderers';

export interface ReduxStoreColumnDef {
  id: string;
  accessorKey: string;
  cellRendererType?: CellRendererName;
  type: string;
  header: string;
  visible: boolean;
  enableSorting?: boolean;
  orderBy?: string[];
  filterField?: string;
}
