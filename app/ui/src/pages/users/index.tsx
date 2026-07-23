import React from 'react';
import {Permissions} from "@gen/permissions";
import {list, delete$ as deleteUser} from "@gen/core/v1/user-UserService_connectquery";
import GridPage from '~/_lib/grid/page';
import {UserGrid} from "@gen/grids";
import {SystemLayout} from '~/sections/system/layout';
import {UserForm} from '~/sections/system/users/user-form';
import {withTranslations} from '~/utils/with-translations';
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('UserForm', UserForm);
  }, [registerForm]);

  return (
  <GridPage
    seoTitle="Users"
    permission={Permissions.User}
    grid={UserGrid}
    gridType="User"
    listViewMethod={list}
    deleteMethod={deleteUser}
    form={{
      formName: 'UserForm',
    }}
    layout={SystemLayout}
    />
)};

export const getServerSideProps = withTranslations();

export default Page;
