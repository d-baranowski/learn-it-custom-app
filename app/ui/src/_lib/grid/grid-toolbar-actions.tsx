import React from 'react';
import {
  MRT_RowData,
  MRT_TableInstance,
} from 'material-react-table';
import Box from '@mui/material/Box';
import ColumnManagerBtn from '~/_lib/grid/column-manager/column-manager-btn';
import FilterModalToggleBtn from '~/_lib/grid/components/filter-modal-toggle-btn';
import ClearAllFiltersBtn from '~/_lib/grid/components/clear-all-filters-btn';
import DeletedStateToggleBtn from '~/_lib/grid/components/deleted-state-toggle-btn';
import ShareBtn from '~/_lib/grid/components/share_btn';
import RefreshGridBtn from '~/_lib/grid/components/refresh_grid_btn';
import ResetGridBtn from '~/_lib/grid/components/reset_grid_btn';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';
import { useUserPermissions } from '~/providers/user-permissions';
import useDialogOpenHandler from '~/_lib/grid/hooks/use-dialog-open-handler';
import DeleteActionMenuItem from '~/_lib/grid/components/delete-action-menu-item';
import AddItemGridBtn from '~/_lib/grid/components/add_item_grid_btn';

interface Props<T extends MRT_RowData> {
  hasQuickFilters?: boolean;
  hasMoreFilters?: boolean;
  table: MRT_TableInstance<T>;
  refetch: () => void;
}

const iconBtnStyle = {
  height: '30px',
  width: '30px',
  padding: '5px',
  marginRight: 1,
};

function GridToolbarActions<T extends MRT_RowData>(props: Props<T>) {
  const {
    refetch,
    isFetching,
    permission,
    deleteMethod,
    form: FormComponent,
  } = useGridSettings<T>();
  const { canCreate } = useUserPermissions();
  const handleOpenForm = useDialogOpenHandler();
  return (
    <Box
      sx={{
        height: props.hasQuickFilters ? '63.13px' : '100%',
        display: 'flex',
        direction: 'row',
        alignItems: 'center',
      }}
    >
      <>
        {FormComponent && canCreate(permission) && (
          <AddItemGridBtn onClick={handleOpenForm} sx={{...iconBtnStyle}} />
        )}
        {!!deleteMethod && (
          <DeleteActionMenuItem
            key="delete-item"
            permission={permission}
            deleteDescriptor={deleteMethod}
            refetch={refetch}
            hideLabel={true}
            sx={iconBtnStyle}
          />
        )}
      </>
      {props.hasMoreFilters && <FilterModalToggleBtn sx={iconBtnStyle} />}
      {props.hasMoreFilters && <ClearAllFiltersBtn sx={iconBtnStyle} />}
      <ColumnManagerBtn sx={iconBtnStyle} />
      {/*<DeletedStateToggleBtn sx={iconBtnStyle} /> TODO this should really be controlled by a setting sent from the backend allow enabling or disabling soft delete */}
      <ShareBtn sx={iconBtnStyle} />
      <RefreshGridBtn refetch={props.refetch} sx={iconBtnStyle} isFetching={isFetching} />
      <ResetGridBtn sx={iconBtnStyle} />
    </Box>
  );
}

export default GridToolbarActions;
