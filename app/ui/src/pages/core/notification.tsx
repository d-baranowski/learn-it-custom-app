import type { NextPage } from 'next';
import React from 'react';
import { withTranslations } from '~/utils/with-translations';
import { Permissions } from '@gen/permissions';
import { NotificationGrid } from '@gen/grids';
import GridPage from '~/_lib/grid/page';
import {
  list,
  softDelete,
} from '@gen/notification/v1/notification-NotificationService_connectquery';
import { NotificationForm } from '~/sections/core/notification/notification_form';
import { CoreLayout } from '~/sections/core/layout';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('NotificationForm', NotificationForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Notification"
      breadcrumbLabel="Notification"
      permission={Permissions.Notification}
      grid={NotificationGrid}
      gridType="Notification"
      listViewMethod={list}
      deleteMethod={softDelete}
      form={{
        formName: 'NotificationForm',
      }}
      layout={CoreLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
