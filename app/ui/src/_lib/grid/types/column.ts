import type {MRT_ColumnDef} from "material-react-table";
import type {CellRendererName} from "~/_lib/grid/columns/cell_renderers";

export interface GridColumnDef<T extends Record<string, any>> extends MRT_ColumnDef<T> {
  id: string;
  orderBy?: string[];
  entityID?: string;
  visible?: boolean;
  filterField?: string;
  type?: string;
  cellRendererType?: CellRendererName;
}
