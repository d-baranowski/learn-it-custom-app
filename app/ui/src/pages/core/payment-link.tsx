import type { NextPage } from 'next';
import React from 'react';
import { withTranslations } from '~/utils/with-translations';
import { Permissions } from '@gen/permissions';
import { PaymentLinkGrid } from '@gen/grids';
import GridPage from '~/_lib/grid/page';
import { list } from '@gen/payment/v1/payment_link-PaymentService_connectquery';
import { PaymentLinkForm } from '~/sections/core/payment-link/payment_link_form';
import { CoreLayout } from '~/sections/core/layout';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();

  React.useEffect(() => {
    registerForm('PaymentLinkForm', PaymentLinkForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Payment Link"
      breadcrumbLabel="Payment Link"
      permission={Permissions.PaymentLink}
      grid={PaymentLinkGrid}
      gridType="PaymentLink"
      listViewMethod={list}
      form={{
        formName: 'PaymentLinkForm',
      }}
      hideActions
      dialogTitle="Payment Link"
      layout={CoreLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
