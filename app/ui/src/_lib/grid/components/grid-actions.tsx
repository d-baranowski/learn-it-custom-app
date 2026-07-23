import React, { useImperativeHandle } from 'react';
import { Button, MenuItem, SvgIcon } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteActionMenuItem from '~/_lib/grid/components/delete-action-menu-item';
import { useUserPermissions } from '~/providers/user-permissions';
import AddIcon from '@mui/icons-material/Add';
import GridActionsMenuButton from './grid-actions-menu-button';
import { useTranslation } from 'next-i18next';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';
import useDialogOpenHandler from '~/_lib/grid/hooks/use-dialog-open-handler'; // Define the ref interface for the exposed methods

interface Props {
  additonalActions?: React.ReactElement[];
}

// Define the component as a generic function
function GridActionsComponent<O extends Record<string, string>>(
  props: Props,
) {
  const { additonalActions } = props;

  const {
    refetch,
    permission,
    deleteMethod,
    importConfig,
    form,
  } = useGridSettings<O>();

  const { t } = useTranslation('common');


  const { canCreate, canImport } = useUserPermissions();
  const [importOpen, setImportOpen] = React.useState<boolean>(false);

  const handleOpenDialog = useDialogOpenHandler<O>();

  const actions = [
    !!(canImport(permission) && importConfig) && (
      <MenuItem
        key="import-item"
        disableRipple
        onClick={() => {
          setImportOpen(true);
        }}
      >
        <ArrowUpwardIcon />
        Import
      </MenuItem>
    ),
    !!deleteMethod && (
      <DeleteActionMenuItem
        key="delete-item"
        permission={permission}
        deleteDescriptor={deleteMethod}
        refetch={refetch}
      />
    ),
    ...(additonalActions || []),
  ].filter((a) => !!a);

  return (
    <>
      {form && canCreate(permission) && (
        <Button
          onClick={() => handleOpenDialog(undefined)}
          data-testid="create-item-btn"
          startIcon={
            <SvgIcon>
              <AddIcon />
            </SvgIcon>
          }
          variant="contained"
        >
          {t('New')}
        </Button>
      )}
      <GridActionsMenuButton key="action-button-menu">
        {...actions as unknown as any}
      </GridActionsMenuButton>
      {/* Grid Page Dialogs */}
      {/*{importConfig && (*/}
      {/*  <SpreadsheetImport<any>*/}
      {/*    open={importOpen}*/}
      {/*    onSubmit={async (data) => {*/}
      {/*      console.log(data);*/}
      {/*    }}*/}
      {/*    onClose={() => {*/}
      {/*      setImportOpen(false);*/}
      {/*    }}*/}
      {/*    config={importConfig}*/}
      {/*  />*/}
      {/*)}*/}
    </>
  );
}

export default GridActionsComponent;
