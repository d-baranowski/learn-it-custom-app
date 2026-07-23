import React from 'react';
import {Permissions} from '@gen/permissions';
import {delete$, list} from '@gen/core/v1/user_role-UserRoleService_connectquery';
import GridPage from '~/_lib/grid/page';
import {UserRoleGrid} from '@gen/grids';
import {SystemLayout} from '~/sections/system/layout';
import {UserRoleForm} from '~/sections/system/users/user-role-form';
import {withTranslations} from '~/utils/with-translations';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('UserRoleForm', UserRoleForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="User Roles"
      permission={Permissions.Role}
      grid={UserRoleGrid}
      gridType="UserRole"
      listViewMethod={list}
      deleteMethod={delete$}
      form={{
        formName: 'UserRoleForm',
      }}
      layout={SystemLayout}
    />
  );
};

export const getServerSideProps = withTranslations();

export default Page;
