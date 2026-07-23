import React from 'react';
import { Chip, Grid, InputAdornment, Link, ListItemText, MenuItem, Typography } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@connectrpc/connect-query';
import { create, get, list, update, delete$ as deleteCustomer } from '@gen/core/v1/customer-CustomerService_connectquery';
import {
  list as listTherapistCustomer,
  delete$ as deleteTherapistCustomerLink,
} from '@gen/core/v1/therapist_customer-TherapistCustomerLinkService_connectquery';
import { Customer, SaveCustomerRequest } from '@gen/core/v1/customer_pb';
import { Permissions } from '@gen/permissions';
import { TherapistCustomerLinkGrid } from '@gen/grids';
import { SelectRequest, WhereOperator } from '@gen/request/v1/base_pb';
import { ASSIGN_THERAPIST_WINDOW_HEIGHT } from '~/sections/core/therapist-customer/therapist_customer_form';
import { WhereBuilder } from '~/request';
import { getInitials } from '~/utils/get-initials';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import GridTab from '~/_lib/grid/tab';
import { SectionLabel } from '~/components/form/elements/section-label';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActions } from '~/_lib/forms/state/hooks';
import { StringFe } from '~/components/form/elements/string-fe';
import { UserFe, LanguageFe } from '~/components/form/elements/entity-autocompletes';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { useWindowActions } from '~/_lib/window/state/hooks';
import { useUserPermissions } from '~/providers/user-permissions';

interface Props {
  id?: string;
  afterSave?: (formData: Customer) => void;
  onCancel?: () => void;
  windowId?: string;
}

const CustomerSubtitle: React.FC = () => {
  const { t, i18n } = useTranslation();
  const formId = useFormId();
  const firstName = useFieldValue<string>(formId, 'firstName');
  const lastName = useFieldValue<string>(formId, 'lastName');
  const createdAt = useFieldValue<string>(formId, 'createdAt');

  const parts: string[] = [];
  const name = [firstName, lastName].filter(Boolean).join(' ');
  if (name) parts.push(name);

  const ms = Number(createdAt);
  if (Number.isFinite(ms) && ms > 0) {
    const formatted = new Intl.DateTimeFormat(i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(ms));
    parts.push(String(t('Client since {{date}}', { date: formatted })));
  }

  if (parts.length === 0) return null;

  return (
    <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
      {parts.join(' · ')}
    </Typography>
  );
};

const TherapistCountChip: React.FC = () => {
  const formId = useFormId();
  const customerId = useFieldValue<string>(formId, 'id');
  const request = React.useMemo(
    () =>
      customerId
        ? new SelectRequest({
            where: new WhereBuilder<'TherapistCustomerLink'>()
              .eq('customerId', customerId)
              .build(),
          })
        : undefined,
    [customerId]
  );
  const { data } = useQuery(listTherapistCustomer, request, { enabled: !!request });
  const count = Number(data?.pagination?.total ?? data?.items?.length ?? 0);
  if (!count) return null;

  return (
    <Chip
      label={count}
      size="small"
      sx={{
        height: 18,
        fontSize: '0.7rem',
        fontWeight: 600,
        bgcolor: '#EFECE4',
        color: '#5F5E5A',
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  );
};

const BasicInformationTab: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const firstName = useFieldValue<string>(formId, 'firstName');
  const lastName = useFieldValue<string>(formId, 'lastName');
  const actions = useFormActions(formId);

  const suggestedInitials = React.useMemo(
    () => getInitials(`${lastName ?? ''} ${firstName ?? ''}`),
    [firstName, lastName]
  );

  const generateInitials = React.useCallback(() => {
    if (suggestedInitials) actions.changeField('displayAbbreviation', suggestedInitials);
  }, [suggestedInitials, actions]);

  return (
    <>
      <SectionLabel>{t('Personal Data')}</SectionLabel>
      <StringFe name="firstName" label="First Name" required />
      <StringFe name="lastName" label="Last Name" required />
      <StringFe
        name="displayAbbreviation"
        label="Display Abbreviation"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Link
                component="button"
                type="button"
                variant="body2"
                disabled={!suggestedInitials}
                onClick={generateInitials}
                data-testid="suggest-display-name-btn"
                sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                {t('Generate initials')}
              </Link>
            </InputAdornment>
          ),
        }}
      />
      <LanguageFe name="languageId" label="Communication Language" />

      <SectionLabel>{t('Contact')}</SectionLabel>
      <StringFe name="email" label="Email" />
      <StringFe name="phoneNumber" label="Phone Number" />
      <StringFe name="address" label="Address" multiline rows={2} />

      <SectionLabel>{t('Account')}</SectionLabel>
      <Grid item xs={12} sx={{ mb: -0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {t('Link an account if the client logs in to view their sessions and payments.')}
        </Typography>
      </Grid>
      <UserFe name="userId" label="Linked User Account (Optional)" xs={12} />
    </>
  );
};

const NotesTab: React.FC = () => (
  <StringFe name="notes" label="Notes" fullWidth multiline rows={6} />
);

const THERAPIST_CUSTOMER_FORM = { formName: 'TherapistCustomerForm' } as const;

const TherapistsTab: React.FC = () => {
  const formId = useFormId();
  const customerId = useFieldValue<string>(formId, 'id');

  const overrideFilters = React.useMemo(
    () => [{ id: 'customerId', value: customerId, operator: WhereOperator.EQ }],
    [customerId]
  );

  // TherapistCustomerForm takes customerId directly (not defaultValues); preset
  // it so assigning from a client's tab locks the row to this client.
  const formPropsMapper = React.useCallback(
    () => ({ customerId }),
    [customerId]
  );

  return (
    <GridTab
      permission={Permissions.TherapistCustomer}
      grid={TherapistCustomerLinkGrid}
      gridType="TherapistCustomerLink"
      listViewMethod={listTherapistCustomer}
      deleteMethod={deleteTherapistCustomerLink}
      form={THERAPIST_CUSTOMER_FORM}
      dialogTitle="Assign Therapist"
      dialogMaxWidth="sm"
      dialogInitialHeight={ASSIGN_THERAPIST_WINDOW_HEIGHT}
      formPropsMapper={formPropsMapper}
      overrideFilters={overrideFilters}
      disableQuickFilters
      extraHeightReduction={60}
    />
  );
};

export const CustomerForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();
  const { openWindow } = useWindowActions();
  const { canCreate } = useUserPermissions();
  return (
    <Form<SaveCustomerRequest, Customer>
      entityType="customer"
      entityId={id ?? null}
      protoConstructor={SaveCustomerRequest}
      permission={Permissions.Customer}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Customer)}
    >
      <FormTabs header={<CustomerSubtitle />} scrollBody>
        <FormTab label="Basic Information" width="md" height={640}>
          <BasicInformationTab />
        </FormTab>
        {id ? (
          <FormTab
            label="Therapists"
            width="lg"
            height={620}
            icon={<TherapistCountChip />}
            noScrollBody
          >
            <TherapistsTab />
          </FormTab>
        ) : null}
        <FormTab label="Notes" width="md" height={380}>
          <NotesTab />
        </FormTab>
      </FormTabs>
      <FormActionsDropdown
        permission={Permissions.Customer}
        deleteDescriptor={deleteCustomer}
        entityId={id}
        onDeleteSuccess={onCancel}
      >
        {id && canCreate(Permissions.TherapistCustomer) ? (
          <MenuItem
            data-testid="customer-form-assign-therapist"
            sx={{ py: 0.75, gap: 0.75 }}
            onClick={() =>
              openWindow({
                formName: 'TherapistCustomerForm',
                title: t('Assign Therapist'),
                windowId: `assign-therapist-${id}`,
                formProps: { customerId: id },
                maxWidth: 'sm',
                initialHeight: ASSIGN_THERAPIST_WINDOW_HEIGHT,
              })
            }
          >
            <PersonAddAltOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <ListItemText primaryTypographyProps={{ fontSize: 13 }}>
              {t('Assign Therapist')}
            </ListItemText>
          </MenuItem>
        ) : null}
      </FormActionsDropdown>

      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
