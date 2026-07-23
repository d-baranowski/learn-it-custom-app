import React from 'react';
import { Stack, Alert } from '@mui/material';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { create, get, list, update } from '@gen/core/v1/permission-PermissionService_connectquery';
import { Permission, SavePermissionRequest } from '@gen/core/v1/permission_pb';

import { Form } from '~/_lib/forms/components/form';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue } from '~/_lib/forms/state/hooks';
import {
  UserFe,
  RoleFe,
} from '~/components/form/elements/entity-autocompletes';
import {
  PermissionFe,
  AbilityFe,
} from '~/components/form/elements/permission-fe';
import { EnumFe } from '~/components/form/elements/enum-fe';
import { SwitchFe } from '~/components/form/elements/switch-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';

interface Props {
  id?: string;
  afterSave?: (formData: Permission) => void;
  onCancel?: () => void;
  windowId?: string;
}

const PermissionFormFields: React.FC = () => {
  const { t } = useTranslation('common');
  const formId = useFormId();
  const userId = useFieldValue<string>(formId, 'userId');
  const roleId = useFieldValue<string>(formId, 'roleId');
  const permissionKey = useFieldValue<string>(formId, 'key');

  return (
    <>
      <UserFe name="userId" label={t('User')} disabled={!!roleId} />
      <RoleFe name="roleId" label={t('Role')} disabled={!!userId} />
      <PermissionFe name="key" label={t('Permission')} />
      <AbilityFe
        name="abilities"
        label={t('Abilities')}
        permission={permissionKey}
        multiple
      />
      <EnumFe name="scope" label={t('Scope')} enumKey="PermissionScope" />
      <SwitchFe name="revoke" label={t('Revoke')} />
      <Alert severity="warning">
        {t('Allow 60 seconds for the changes to take effect due to caching')}
      </Alert>
    </>
  );
};

export const PermissionForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SavePermissionRequest, Permission>
      entityType="permission"
      entityId={id ?? null}
      protoConstructor={SavePermissionRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Permission)}
    >
      <PermissionFormFields />
      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
