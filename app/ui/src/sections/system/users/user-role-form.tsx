import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteUserRole } from '@gen/core/v1/user_role-UserRoleService_connectquery';
import { UserRole, SaveUserRoleRequest } from '@gen/core/v1/user_role_pb';
import { Permissions } from '@gen/permissions';
import { FormProps } from '~/components/form/form-props';

import { Form } from '~/_lib/forms/components/form';
import { UserFe, RoleFe } from '~/components/form/elements/entity-autocompletes';
import { DateTimeFe } from '~/components/form/elements/date-time-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

export const UserRoleForm: React.FC<FormProps<UserRole> & { windowId?: string }> = (props) => {
  const { id, afterSave = _.noop, onCancel = _.noop, windowId } = props;
  return (
    <Form<SaveUserRoleRequest, UserRole>
      entityType="user-role"
      entityId={id ?? null}
      protoConstructor={SaveUserRoleRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as UserRole)}
    >
      <UserFe name="userId" label="User" required disabled={!!id} />
      <RoleFe name="roleId" label="Role" required disabled={!!id} />
      <DateTimeFe name="expiresAt" label="Expires At" />
      <FormActionsDropdown
        permission={Permissions.Role}
        deleteDescriptor={deleteUserRole}
        entityId={id}
        onDeleteSuccess={onCancel}
      />

      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
