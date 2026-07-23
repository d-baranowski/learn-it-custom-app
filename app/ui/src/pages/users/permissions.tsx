import React from 'react';
import {Permissions} from '@gen/permissions';
import {delete$, list} from '@gen/core/v1/permission-PermissionService_connectquery';
import GridPage from '~/_lib/grid/page';
import {PermissionGrid} from '@gen/grids';
import {SystemLayout} from '~/sections/system/layout';
import {PermissionForm} from '~/sections/system/users/permission-form';
import {withTranslations} from '~/utils/with-translations';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('PermissionForm', PermissionForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Permissions"
      permission={Permissions.Permission}
      grid={PermissionGrid}
      gridType="Permission"
      listViewMethod={list}
      deleteMethod={delete$}
      form={{
        formName: 'PermissionForm',
      }}
      layout={SystemLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
