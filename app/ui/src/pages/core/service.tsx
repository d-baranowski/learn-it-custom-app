import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {ServiceGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteService} from '@gen/core/v1/service-ServiceService_connectquery';
import {ServiceForm} from "~/sections/core/service/service_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('ServiceForm', ServiceForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Service"
      breadcrumbLabel="Service"
      permission={Permissions.Service}
      grid={ServiceGrid}
      gridType="Service"
      listViewMethod={list}
      deleteMethod={deleteService}
      form={{
        formName: 'ServiceForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
