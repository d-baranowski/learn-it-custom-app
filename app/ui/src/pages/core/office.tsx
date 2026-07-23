import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {OfficeGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteOffice} from '@gen/core/v1/office-OfficeService_connectquery';
import {OfficeForm} from "~/sections/core/office/office_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('OfficeForm', OfficeForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Office"
      breadcrumbLabel="Office"
      permission={Permissions.Office}
      grid={OfficeGrid}
      gridType="Office"
      listViewMethod={list}
      deleteMethod={deleteOffice}
      form={{
        formName: 'OfficeForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
