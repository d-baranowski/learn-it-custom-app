import React from 'react';
import { Box, InputAdornment, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  create,
  get,
  list,
  update,
  delete$ as deleteTherapistServiceLink,
} from '@gen/core/v1/therapist_service-TherapistServiceLinkService_connectquery';
import { get as getService } from '@gen/core/v1/service-ServiceService_connectquery';
import {
  TherapistServiceLink,
  SaveTherapistServiceLinkRequest,
} from '@gen/core/v1/therapist_service_pb';
import { Permissions } from '@gen/permissions';
import { useTranslation } from 'next-i18next';

import { Grid } from '@mui/material';
import { Form } from '~/_lib/forms/components/form';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue } from '~/_lib/forms/state/hooks';
import { NumberFe } from '~/components/form/elements/number-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import {
  TherapistFe,
  ServiceFe,
} from '~/components/form/elements/entity-autocompletes';
import { useDependentField } from '~/_lib/forms/hooks/use-dependent-field';

interface Props {
  id?: string;
  therapistId?: string;
  serviceId?: string;
  afterSave?: (formData: TherapistServiceLink) => void;
  onCancel?: () => void;
  windowId?: string;
}

const TherapistServiceFormFields: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const isEditMode = !!useFieldValue<string>(formId, 'id');

  const { data: serviceData } = useDependentField({
    watch: 'serviceId',
    query: getService,
    apply: (service) => ({
      price: service.defaultPrice,
    }),
  });

  const basePrice = serviceData?.defaultPrice;

  return (
    <>
      <Grid item xs={12} sx={{ mt: -0.5, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('Add a service this therapist offers')}
        </Typography>
      </Grid>
      <TherapistFe name="therapistId" label={t('Therapist')} required fullWidth xs={12} />
      <ServiceFe name="serviceId" label={t('Service')} required fullWidth xs={12} />
      <NumberFe
        xs={12}
        name="price"
        label={t('Price per session')}
        required
        min={0}
        fullWidth
        helperText={
          basePrice !== undefined && basePrice !== null
            ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                {`${t('Base service price')}: ${basePrice} ${t('zł')}`}
                <Tooltip title={t('Base price can be changed in the Core Data > Service section')} arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            )
            : undefined
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography variant="caption" color="text.secondary">
                {t('zł')}
              </Typography>
            </InputAdornment>
          ),
        }}
      />
    </>
  );
};

export const TherapistServiceForm: React.FC<Props> = ({
  id,
  therapistId,
  serviceId,
  afterSave,
  onCancel,
  windowId,
}) => {
  return (
    <Form<SaveTherapistServiceLinkRequest, TherapistServiceLink>
      entityType="therapist-service"
      entityId={id ?? null}
      protoConstructor={SaveTherapistServiceLinkRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave?.(saved as TherapistServiceLink)}
      defaultValues={{
        therapistId: therapistId ?? '',
        serviceId: serviceId ?? '',
      }}
    >
      <TherapistServiceFormFields />
      <FormActionsDropdown
        permission={Permissions.TherapistService}
        deleteDescriptor={deleteTherapistServiceLink}
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
