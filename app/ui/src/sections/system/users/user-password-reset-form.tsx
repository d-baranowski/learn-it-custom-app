/**
 * PasswordResetForm — first form migrated to the Redux-backed forms framework.
 *
 * Compared to the previous implementation:
 *   - useForm + FormProvider replaced by <Form>.
 *   - <TextFieldElement> from rhf-mui replaced by <PasswordFe>.
 *   - wasmResolver invocation moved into <Form>'s `protoConstructor` +
 *     `customValidation` props.
 *   - useFormErrorToast + manual try/catch toasts replaced by the
 *     error-toast listener middleware that watches formSubmitFailed.
 *   - nullToUndefined dropped — the proto-bridge handles it.
 *   - Manual useMutation + onSubmit removed — the framework runs the
 *     mutation through the runtime's submit handler.
 *
 * persistOnDismiss is `false` because passwords should never persist to
 * localStorage as drafts.
 */

import React, { FC } from 'react';
import { Stack } from '@mui/material';
import { toast } from 'react-hot-toast';
import { Empty } from '@bufbuild/protobuf';
import { resetUserPassword } from '@gen/core/v1/user-UserService_connectquery';
import { ResetUserPasswordRequest } from '@gen/core/v1/user_pb';

import { Form } from '~/_lib/forms/components/form';
import { PasswordFe } from '~/components/form/elements/password-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';

interface Props {
  id: string;
  onCancel: () => void;
  afterSave: () => void;
  windowId?: string;
}

const passwordValidation = (
  values: Record<string, unknown>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const password = (values.password as string) ?? '';
  const passwordConfirm = (values.passwordConfirm as string) ?? '';

  if (password.length < 8 || password.length > 50) {
    errors.password = 'Password must be between 8 and 50 characters';
  }
  if (passwordConfirm.length < 8 || passwordConfirm.length > 50) {
    errors.passwordConfirm = 'Password must be between 8 and 50 characters';
  }
  if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Passwords do not match';
  }
  return errors;
};

export const PasswordResetForm: FC<Props> = ({ id, onCancel, afterSave, windowId }) => {
  return (
    <Form<ResetUserPasswordRequest, Empty>
      entityType="user-password-reset"
      entityId={id}
      protoConstructor={ResetUserPasswordRequest}
      io={{ create: resetUserPassword }}
      customValidation={passwordValidation}
      persistOnDismiss={false}
      windowId={windowId}
      onCancel={onCancel}
      defaultValues={{ id, password: '', passwordConfirm: '' }}
      onSubmitSuccess={() => {
        toast.success('User updated successfully');
        afterSave();
      }}
    >
      <PasswordFe name="password" label="Password" fullWidth />
      <PasswordFe name="passwordConfirm" label="Confirm Password" fullWidth />
      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
