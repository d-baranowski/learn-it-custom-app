import type { NextPage } from 'next';
import { withTranslations } from '~/utils/with-translations';
import React from 'react';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { useTranslation } from 'next-i18next';
import { Permissions } from '@gen/permissions';
import { CustomerGrid } from '@gen/grids';
import { Customer } from '@gen/core/v1/customer_pb';
import GridPage from '~/_lib/grid/page';
import type { GridContextMenuData } from '~/_lib/grid/pure-grid';
import { list, delete$ as deleteCustomer } from '@gen/core/v1/customer-CustomerService_connectquery';
import { CustomerForm } from '~/sections/core/customer/customer_form';
import {
  TherapistCustomerForm,
  ASSIGN_THERAPIST_WINDOW_HEIGHT,
} from '~/sections/core/therapist-customer/therapist_customer_form';
import { CoreLayout } from '~/sections/core/layout';
import { useRegisterForm } from '~/hooks/use-form-registry';
import { useWindowActions } from '~/_lib/window/state/hooks';
import { useUserPermissions } from '~/providers/user-permissions';

const Page: NextPage = () => {
  const { t } = useTranslation();
  const registerForm = useRegisterForm();
  const { openWindow } = useWindowActions();
  const { canCreate } = useUserPermissions();

  React.useEffect(() => {
    registerForm('CustomerForm', CustomerForm);
    // Opened from the customer row action to assign a therapist, and from the
    // Therapists tab inside the customer form.
    registerForm('TherapistCustomerForm', TherapistCustomerForm);
  }, [registerForm]);

  const contextMenuItems = React.useCallback(
    (data?: GridContextMenuData<Customer>) => {
      const row = data?.row;
      if (!row?.id || !canCreate(Permissions.TherapistCustomer)) return [];
      return [
        {
          testId: 'customer-assign-therapist',
          label: String(t('Assign Therapist')),
          icon: <PersonAddAltOutlinedIcon fontSize="small" />,
          onClick: () => {
            openWindow({
              formName: 'TherapistCustomerForm',
              title: t('Assign Therapist'),
              windowId: `assign-therapist-${row.id}`,
              formProps: { customerId: row.id },
              maxWidth: 'sm',
              initialHeight: ASSIGN_THERAPIST_WINDOW_HEIGHT,
            });
          },
        },
      ];
    },
    [t, openWindow, canCreate]
  );

  return (
    <GridPage
      seoTitle="Customer"
      breadcrumbLabel="Customer"
      permission={Permissions.Customer}
      grid={CustomerGrid}
      gridType="Customer"
      listViewMethod={list}
      deleteMethod={deleteCustomer}
      form={{
        formName: 'CustomerForm',
      }}
      contextMenuItems={contextMenuItems}
      layout={CoreLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
