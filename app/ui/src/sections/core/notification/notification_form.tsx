import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { get, softDelete as deleteNotification } from '@gen/notification/v1/notification-NotificationService_connectquery';
import { send } from '@gen/notification/v1/notification_send-NotificationSendService_connectquery';
import { Notification } from '@gen/notification/v1/notification_pb';
import { SendNotificationRequest } from '@gen/notification/v1/notification_send_pb';
import { NotificationDeliveryMechanism } from '@gen/notification/v1/notification_common_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActions } from '~/_lib/forms/state/hooks';
import { StringFe } from '~/components/form/elements/string-fe';
import { EnumFe } from '~/components/form/elements/enum-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: Notification) => void;
  onCancel?: () => void;
  windowId?: string;
}

const EMAIL = NotificationDeliveryMechanism.EMAIL;
const SMS = NotificationDeliveryMechanism.SMS;

const FormBody: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const mechanism = useFieldValue<number>(formId, 'deliveryMechanism');
  const idempotencyKey = useFieldValue<string>(formId, 'idempotencyKey');
  const actions = useFormActions(formId);

  React.useEffect(() => {
    if (!mechanism) {
      actions.changeField('deliveryMechanism', EMAIL);
    }
    if (!idempotencyKey) {
      const fresh =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `ui-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      actions.changeField('idempotencyKey', fresh);
    }
  }, [mechanism, idempotencyKey, actions]);

  const isEmail = mechanism === EMAIL;
  const isSMS = mechanism === SMS;

  return (
    <>
      <EnumFe
        name="deliveryMechanism"
        label={t('Channel')}
        enumKey="NotificationDeliveryMechanism"
        required
      />
      <StringFe
        name="recipientLabel"
        label={t('Recipient Label')}
        fullWidth
      />
      {isEmail && (
        <>
          <StringFe name="recipientEmail" label={t('To Address')} required fullWidth />
          <StringFe name="subject" label={t('Subject')} required fullWidth />
        </>
      )}
      {isSMS && (
        <StringFe name="recipientPhone" label={t('To Phone')} required fullWidth />
      )}
      <StringFe
        name="body"
        label={t('Body')}
        required
        fullWidth
        multiline
        rows={6}
      />
    </>
  );
};

export const NotificationForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SendNotificationRequest, Notification>
      entityType="notification"
      entityId={id ?? null}
      protoConstructor={SendNotificationRequest}
      permission={Permissions.NotificationSend}
      io={{ get, create: send }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Notification)}
    >
      <FormBody />
      <FormActionsDropdown
        permission={Permissions.Notification}
        deleteDescriptor={deleteNotification}
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
