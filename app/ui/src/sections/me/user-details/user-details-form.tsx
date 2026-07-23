/**
 * UserDetailsForm — second form migrated to the Redux-backed forms framework.
 *
 * Adds the entity-load flow on top of what PasswordResetForm proved.
 * Note: the parent component (`user-details.tsx`) keeps owning the
 * useQuery for the user record (it also drives the read-mode card). This
 * form receives `initialValues` from the parent and mounts as a "create"-
 * shaped form (no io.get) — the values are the defaults; submitting calls
 * the update mutation.
 *
 * formId is "me:self" — singleton entity scoped to the authenticated user.
 * That gives us draft persistence: if the user starts editing, dismisses,
 * and returns later, their in-progress edits are restored.
 *
 * Bug fix: the previous implementation had `name="name"` but the proto
 * field is `displayName` (`UpdateMeRequest.displayName`). The form
 * silently ignored every edit because protobuf-es drops unknown fields.
 * The migrated form uses `displayName` correctly.
 */

import { FC } from 'react';
import { Stack } from '@mui/material';
import { toast } from 'react-hot-toast';
import { update } from '@gen/core/me/v1/me-MeService_connectquery';
import { UpdateMeRequest } from '@gen/core/me/v1/me_pb';
import { User } from '@gen/core/v1/user_pb';

import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';

export interface UserProfileFormData {
  displayName?: string;
}

interface UserDetailsFormProps {
  initialValues?: UserProfileFormData;
  onCancel: () => void;
  /** Called after the update mutation succeeds. */
  onSubmitSuccess: () => void;
}

export const UserDetailsForm: FC<UserDetailsFormProps> = ({
  initialValues,
  onCancel,
  onSubmitSuccess,
}) => {
  return (
    <Form<UpdateMeRequest, User>
      entityType="me"
      entityId="self"
      protoConstructor={UpdateMeRequest}
      io={{ create: update }}
      defaultValues={(initialValues ?? {}) as Record<string, unknown>}
      onCancel={onCancel}
      onSubmitSuccess={() => {
        toast.success('Contact updated successfully');
        onSubmitSuccess();
      }}
    >
      <StringFe name="displayName" label="Name" fullWidth />
      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
