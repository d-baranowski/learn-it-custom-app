import React from 'react';
import {Permissions} from "@gen/permissions";
import {delete$, list} from "@gen/core/v1/role-RoleService_connectquery";
import GridPage from '~/_lib/grid/page';
import {RoleGrid} from "@gen/grids";
import {SystemLayout} from '~/sections/system/layout';
import {RoleForm} from '~/sections/system/users/role-form';
import {withTranslations} from '~/utils/with-translations';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('RoleForm', RoleForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Roles"
      permission={Permissions.Role}
      grid={RoleGrid}
      gridType="Role"
      listViewMethod={list}
      deleteMethod={delete$}
      form={{
        formName: 'RoleForm',
      }}
      layout={SystemLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
