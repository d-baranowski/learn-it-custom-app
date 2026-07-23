import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { create, get, list, update, delete$ as deleteUser } from '@gen/core/v1/user-UserService_connectquery';
import { User, SaveUserRequest } from '@gen/core/v1/user_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActions } from '~/_lib/forms/state/hooks';
import { StringFe } from '~/components/form/elements/string-fe';
import { BooleanFe } from '~/components/form/elements/switch-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import DividerLabel from '~/components/divider-label';
import AvatarInput from '~/components/avatar-input/avatar-input';

interface Props {
  id?: string;
  afterSave?: (formData: User) => void;
  onCancel?: () => void;
  windowId?: string;
}

const UserFormFields: React.FC = () => {
  const { t } = useTranslation('common');
  const formId = useFormId();
  const avatar = useFieldValue<string>(formId, 'avatar');
  const actions = useFormActions(formId);

  return (
    <>
      <DividerLabel>{t('Avatar')}</DividerLabel>
      <AvatarInput
        src={avatar ?? '#'}
        onSave={(base64) => actions.changeField('avatar', base64)}
      />
      <StringFe name="displayName" required fullWidth />
      <StringFe name="displayAbbreviation" label="Abbreviation" fullWidth />
      <StringFe name="username" required fullWidth />
      <StringFe name="email" required fullWidth />
      <BooleanFe name="disabled" />
    </>
  );
};

export const UserForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SaveUserRequest, User>
      entityType="user"
      entityId={id ?? null}
      protoConstructor={SaveUserRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as User)}
    >
      <UserFormFields />
      <FormActionsDropdown
        permission={Permissions.User}
        deleteDescriptor={deleteUser}
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
