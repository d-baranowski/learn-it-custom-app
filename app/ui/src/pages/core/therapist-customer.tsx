import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {TherapistCustomerLinkGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteTherapistCustomerLink} from '@gen/core/v1/therapist_customer-TherapistCustomerLinkService_connectquery';
import {TherapistCustomerForm} from "~/sections/core/therapist-customer/therapist_customer_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('TherapistCustomerForm', TherapistCustomerForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Therapist Customer"
      breadcrumbLabel="Therapist Customer"
      permission={Permissions.TherapistCustomer}
      grid={TherapistCustomerLinkGrid}
      gridType="TherapistCustomerLink"
      listViewMethod={list}
      deleteMethod={deleteTherapistCustomerLink}
      form={{
        formName: 'TherapistCustomerForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
