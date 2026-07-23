import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteRoom } from '@gen/core/v1/room-RoomService_connectquery';
import { Room, SaveRoomRequest } from '@gen/core/v1/room_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { ColorFe } from '~/components/form/elements/color-fe';
import { MarkdownFe } from '~/components/form/elements/markdown-fe';
import { OfficeFe } from '~/components/form/elements/entity-autocompletes';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: Room) => void;
  onCancel?: () => void;
  windowId?: string;
  defaultValues?: Record<string, unknown>;
}

export const RoomForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
  defaultValues,
}) => {
  return (
    <Form<SaveRoomRequest, Room>
      entityType="room"
      entityId={id ?? null}
      protoConstructor={SaveRoomRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      defaultValues={defaultValues}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Room)}
    >
      <FormTabs>
        <FormTab label="English">
          <StringFe name="displayName.en" label="Name (English)" required fullWidth />
          <MarkdownFe name="description.en" label="Description (English)" />
        </FormTab>
        <FormTab label="Polish">
          <StringFe name="displayName.pl" label="Name (Polish)" required fullWidth />
          <MarkdownFe name="description.pl" label="Description (Polish)" />
        </FormTab>
      </FormTabs>
      <OfficeFe name="officeId" label="Office" required />
      <StringFe name="displayAbbreviation" label="Abbreviation" fullWidth />
      <ColorFe name="displayColor" label="Color" />
      <FormActionsDropdown
        permission={Permissions.Room}
        deleteDescriptor={deleteRoom}
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
