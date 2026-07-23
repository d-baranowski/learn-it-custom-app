import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteWorkingHours } from '@gen/core/v1/working_hours-WorkingHoursService_connectquery';
import { WorkingHours, SaveWorkingHoursRequest } from '@gen/core/v1/working_hours_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { TherapistFe } from '~/components/form/elements/entity-autocompletes';
import { EnumFe } from '~/components/form/elements/enum-fe';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: WorkingHours) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const WorkingHoursForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SaveWorkingHoursRequest, WorkingHours>
      entityType="working-hours"
      entityId={id ?? null}
      protoConstructor={SaveWorkingHoursRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as WorkingHours)}
    >
      <TherapistFe name="therapistId" label="Therapist" required />
      <EnumFe
        name="dayOfWeek"
        label="Day of Week"
        enumKey="DayOfWeek"
        required
        sortByLabel={false}
      />
      <StringFe name="fromTime" label="From Time (HH:MM:SS)" required fullWidth />
      <StringFe name="tillTime" label="Till Time (HH:MM:SS)" required fullWidth />
      <FormActionsDropdown
        permission={Permissions.WorkingHours}
        deleteDescriptor={deleteWorkingHours}
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
