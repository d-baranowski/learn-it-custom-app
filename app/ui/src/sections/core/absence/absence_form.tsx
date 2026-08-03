import React from 'react';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteAbsence } from '@gen/core/v1/absence-AbsenceService_connectquery';
import { Absence, SaveAbsenceRequest } from '@gen/core/v1/absence_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { TherapistFe } from '~/components/form/elements/entity-autocompletes';
import { DateTimeFe } from '~/components/form/elements/date-time-fe';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: Absence) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const AbsenceForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SaveAbsenceRequest, Absence>
      entityType="absence"
      entityId={id ?? null}
      protoConstructor={SaveAbsenceRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Absence)}
    >
      <TherapistFe
        name="therapistId"
        label="Therapist (leave empty for organization-wide)"
      />
      <DateTimeFe name="fromTime" label="From Date/Time" required />
      <DateTimeFe name="tillTime" label="Till Date/Time" required />
      <StringFe name="reason" label="Reason" fullWidth multiline rows={3} />
      <StringFe name="deleteMe" label="Delete Me" fullWidth multiline rows={3} />
      <FormActionsDropdown
        permission={Permissions.Absence}
        deleteDescriptor={deleteAbsence}
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
