import type { NextPage } from 'next';
import React from 'react';
import { withTranslations } from '~/utils/with-translations';
import { Permissions } from '@gen/permissions';
import { NotificationTemplateGrid } from '@gen/grids';
import GridPage from '~/_lib/grid/page';
import {
  list,
  softDelete,
} from '@gen/notification/v1/notification_template-NotificationTemplateService_connectquery';
import { NotificationTemplateForm } from '~/sections/core/notification-template/notification_template_form';
import { CoreLayout } from '~/sections/core/layout';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('NotificationTemplateForm', NotificationTemplateForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Notification Templates"
      breadcrumbLabel="Notification Templates"
      permission={Permissions.NotificationTemplate}
      grid={NotificationTemplateGrid}
      gridType="NotificationTemplate"
      listViewMethod={list}
      deleteMethod={softDelete}
      form={{
        formName: 'NotificationTemplateForm',
      }}
      layout={CoreLayout}
      dialogInitialHeight={750}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
