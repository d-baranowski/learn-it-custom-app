import type { NextPage } from 'next';
import { withTranslations } from '~/utils/with-translations';
import React from 'react';
import { Permissions } from '@gen/permissions';
import { TherapyGrid } from '@gen/grids';
import GridPage from '~/_lib/grid/page';
import {
  list,
  delete$ as deleteTherapy,
} from '@gen/core/v1/therapy-TherapyService_connectquery';
import { TherapyForm } from '~/sections/core/therapy/therapy_form';
import { CoreLayout } from '~/sections/core/layout';
import { useRegisterForm } from '~/hooks/use-form-registry';
import { SessionForm } from '~/sections/core/session/session_form';
import { MenuItem } from '@mui/material';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import { useTranslation } from 'next-i18next';
import { useWindowActions } from '~/_lib/window/state/hooks';
import useSelectedRows from '~/_lib/grid/hooks/use-selected-rows';
import { toast } from 'react-hot-toast';

const UPDATE_PRICES_WINDOW_ID = 'update-session-prices';

const therapyGrid = {
  ...TherapyGrid,
  columns: TherapyGrid.columns.map((column) =>
    column.id === 'therapyDayOfWeeks'
      ? ({
          ...column,
          orderBy: ['therapyDaysFirstDaySort', 'therapyDaysSequenceSort'],
        } as typeof column & { orderBy: string[] })
      : column
  ),
} as typeof TherapyGrid;

const UpdateSessionPricesAction: React.FC = () => {
  const { t } = useTranslation();
  const { openWindow } = useWindowActions();
  const selectedRows = useSelectedRows();

  const handleClick = () => {
    if (selectedRows.count === 0) {
      toast.error(t('No rows selected'));
      return;
    }
    openWindow({
      formName: 'UpdateSessionPrices',
      title: t('Update Session Prices'),
      windowId: UPDATE_PRICES_WINDOW_ID,
      formProps: { therapyIds: selectedRows.ids },
      maxWidth: 'md',
      initialHeight: 700,
    });
  };

  return (
    <MenuItem
      onClick={handleClick}
      disableRipple
      data-testid="update-session-prices-action"
    >
      <PriceChangeIcon />
      {t('Update Session Prices')}
    </MenuItem>
  );
};

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('TherapyForm', TherapyForm);
    registerForm('SessionForm', SessionForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Therapy"
      breadcrumbLabel="Therapy"
      permission={Permissions.Therapy}
      grid={therapyGrid}
      gridType="Therapy"
      listViewMethod={list}
      deleteMethod={deleteTherapy}
      form={{
        formName: 'TherapyForm',
      }}
      layout={CoreLayout}
      dialogMaxWidth={'md'}
      additionalActions={[
        <UpdateSessionPricesAction key="update-session-prices" />,
      ]}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
