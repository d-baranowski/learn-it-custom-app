import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteRole } from '@gen/core/v1/role-RoleService_connectquery';
import { Role, SaveRoleRequest } from '@gen/core/v1/role_pb';
import { Permissions } from '@gen/permissions';
import { FormProps } from '~/components/form/form-props';

import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

export const RoleForm: React.FC<FormProps<Role> & { windowId?: string }> = (props) => {
  const { id, afterSave = _.noop, onCancel = _.noop, windowId } = props;
  return (
    <Form<SaveRoleRequest, Role>
      entityType="role"
      entityId={id ?? null}
      protoConstructor={SaveRoleRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Role)}
    >
      <StringFe name="name" required fullWidth />
      <StringFe name="description" required fullWidth />
      <FormActionsDropdown
        permission={Permissions.Role}
        deleteDescriptor={deleteRole}
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
