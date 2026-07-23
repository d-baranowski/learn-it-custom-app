import React from 'react';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteOffice } from '@gen/core/v1/office-OfficeService_connectquery';
import {
  list as listRooms,
  delete$ as deleteRoom,
} from '@gen/core/v1/room-RoomService_connectquery';
import { Office, SaveOfficeRequest } from '@gen/core/v1/office_pb';
import { Permissions } from '@gen/permissions';
import { RoomGrid } from '@gen/grids';
import { WhereOperator } from '@gen/request/v1/base_pb';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActiveTabIndex } from '~/_lib/forms/state/hooks';
import GridTab from '~/_lib/grid/tab';

const ROOMS_TAB_HEIGHT = 800;

interface Props {
  id?: string;
  afterSave?: (formData: Office) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const OfficeForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SaveOfficeRequest, Office>
      entityType="office"
      entityId={id ?? null}
      protoConstructor={SaveOfficeRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Office)}
    >
      <FormTabs>
        <FormTab label="English">
          <StringFe name="displayName.en" label="Name (English)" required fullWidth />
        </FormTab>
        <FormTab label="Polish">
          <StringFe name="displayName.pl" label="Name (Polish)" required fullWidth />
        </FormTab>
        {id && (
          <FormTab label="Rooms" width="xl" height={ROOMS_TAB_HEIGHT}>
            <RoomsTab officeId={id} />
          </FormTab>
        )}
      </FormTabs>
      <OfficeBottomFields editMode={!!id} onCancel={onCancel} officeId={id} />
    </Form>
  );
};

const OfficeBottomFields: React.FC<{ editMode: boolean; onCancel: () => void; officeId?: string }> = ({
  editMode,
  onCancel,
  officeId,
}) => {
  const formId = useFormId();
  const active = useFormActiveTabIndex(formId) ?? 0;
  // English=0, Polish=1, Rooms=2 (Rooms only exists in edit mode).
  const roomsTabIndex = editMode ? 2 : -1;
  if (active === roomsTabIndex) return null;
  return (
    <>
      <StringFe name="address" label="Address" required fullWidth multiline rows={4} />
      <FormActionsDropdown
        permission={Permissions.Office}
        deleteDescriptor={deleteOffice}
        entityId={officeId}
        onDeleteSuccess={onCancel}
      />

      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </>
  );
};

const ROOM_FORM = { formName: 'RoomForm' } as const;

const RoomsTab: React.FC<{ officeId: string }> = ({ officeId: officeIdProp }) => {
  const formId = useFormId();
  const officeId = useFieldValue<string>(formId, 'id') ?? officeIdProp;

  const formPropsMapper = React.useCallback(
    () => ({
      defaultValues: { officeId },
      optimisticList: { listDescriptor: listRooms },
    }),
    [officeId],
  );

  const overrideFilters = React.useMemo(
    () => [
      {
        id: 'officeId',
        value: officeId,
        operator: WhereOperator.EQ,
      },
    ],
    [officeId],
  );

  return (
    <GridTab
      permission={Permissions.Room}
      grid={RoomGrid}
      gridType="Room"
      listViewMethod={listRooms}
      deleteMethod={deleteRoom}
      form={ROOM_FORM}
      formPropsMapper={formPropsMapper}
      overrideFilters={overrideFilters}
    />
  );
};
