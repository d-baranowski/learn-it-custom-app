import React from 'react';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import _ from 'lodash';
import {
  create,
  get,
  list,
  update,
  delete$ as deleteTherapistCustomerLink,
} from '@gen/core/v1/therapist_customer-TherapistCustomerLinkService_connectquery';
import {
  TherapistCustomerLink,
  SaveTherapistCustomerLinkRequest,
} from '@gen/core/v1/therapist_customer_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import {
  TherapistFe,
  CustomerFe,
} from '~/components/form/elements/entity-autocompletes';

/** Initial window height (px) for the assign-therapist form — two fields + hint. */
export const ASSIGN_THERAPIST_WINDOW_HEIGHT = 300;

interface Props {
  id?: string;
  therapistId?: string;
  customerId?: string;
  afterSave?: (formData: TherapistCustomerLink) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const TherapistCustomerForm: React.FC<Props> = ({
  id,
  therapistId,
  customerId,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();
  return (
    <Form<SaveTherapistCustomerLinkRequest, TherapistCustomerLink>
      entityType="therapist-customer"
      entityId={id ?? null}
      protoConstructor={SaveTherapistCustomerLinkRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as TherapistCustomerLink)}
      defaultValues={{
        therapistId: therapistId ?? '',
        customerId: customerId ?? '',
      }}
    >
      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary">
          {t('Link a therapist to this client so the therapist can view and manage the client\'s therapies and sessions.')}
        </Typography>
      </Grid>
      <CustomerFe name="customerId" label="Customer" required xs={12} />
      <TherapistFe name="therapistId" label="Therapist" required xs={12} />
      <FormActionsDropdown
        permission={Permissions.TherapistCustomer}
        deleteDescriptor={deleteTherapistCustomerLink}
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
