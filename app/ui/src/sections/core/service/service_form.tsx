import React from 'react';
import { Stack } from '@mui/material';
import _ from 'lodash';
import { create, get, list, update, delete$ as deleteService } from '@gen/core/v1/service-ServiceService_connectquery';
import { Service, SaveServiceRequest } from '@gen/core/v1/service_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { NumberFe } from '~/components/form/elements/number-fe';
import { MarkdownFe } from '~/components/form/elements/markdown-fe';
import { ImageFe } from '~/components/form/elements/image-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: Service) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const ServiceForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  return (
    <Form<SaveServiceRequest, Service>
      entityType="service"
      entityId={id ?? null}
      protoConstructor={SaveServiceRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Service)}
    >
      <FormTabs>
        <FormTab label="English">
          <StringFe name="name.en" label="Name (English)" required fullWidth />
          <MarkdownFe name="description.en" label="Description (English)" required />
        </FormTab>
        <FormTab label="Polish">
          <StringFe name="name.pl" label="Name (Polish)" required fullWidth />
          <MarkdownFe name="description.pl" label="Description (Polish)" required />
        </FormTab>
        <FormTab label="Images">
          <ImageFe name="backdropPhoto" label="Backdrop Photo" aspect={21 / 9} />
          <ImageFe name="heroPhoto" label="Hero Photo" aspect={16 / 9} />
        </FormTab>
      </FormTabs>
      <NumberFe name="defaultPrice" label="Default Price" min={0} fullWidth />
      <StringFe name="displayAbbreviation" label="Display Abbreviation" fullWidth />
      <FormActionsDropdown
        permission={Permissions.Service}
        deleteDescriptor={deleteService}
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
