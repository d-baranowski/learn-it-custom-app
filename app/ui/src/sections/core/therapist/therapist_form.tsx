import React from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import {
  create,
  get,
  list as listTherapists,
  update,
  delete$ as deleteTherapist,
} from '@gen/core/v1/therapist-TherapistService_connectquery';
import {
  list as listTherapistCustomerLinks,
  delete$ as deleteTherapistCustomerLink,
} from '@gen/core/v1/therapist_customer-TherapistCustomerLinkService_connectquery';
import {
  list as listTherapistServiceLinks,
  delete$ as deleteTherapistServiceLink,
} from '@gen/core/v1/therapist_service-TherapistServiceLinkService_connectquery';
import { Therapist, SaveTherapistRequest } from '@gen/core/v1/therapist_pb';
import { Permissions } from '@gen/permissions';
import { TherapistCustomerLinkGrid, TherapistServiceLinkGrid } from '@gen/grids';
import { WhereOperator } from '@gen/request/v1/base_pb';
import { useUserPermissions } from '~/providers/user-permissions';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { NumberFe } from '~/components/form/elements/number-fe';
import { SwitchRowFe } from '~/components/form/elements/switch-fe';
import { MarkdownFe } from '~/components/form/elements/markdown-fe';
import { ImageFe } from '~/components/form/elements/image-fe';
import { LanguageFe, UserFe } from '~/components/form/elements/entity-autocompletes';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { SectionLabel } from '~/components/form/elements/section-label';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useFieldValue, useFormActiveTabIndex } from '~/_lib/forms/state/hooks';
import GridTab from '~/_lib/grid/tab';

interface Props {
  id?: string;
  afterSave?: (formData: Therapist) => void;
  onCancel?: () => void;
  windowId?: string;
}

const therapistColorOptions = ['#534AB7', '#2E8B57', '#C56B3F', '#B83A6A', '#4A8AB8', '#888780'];
const filledFieldProps = {
  variant: 'filled' as const,
  size: 'small' as const,
  InputProps: { disableUnderline: true },
};
const autocompleteTextFieldProps = {
  variant: 'filled' as const,
  size: 'small' as const,
  InputProps: { disableUnderline: true },
};
const therapistSwitchProps = {
  sx: {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#FFFFFF',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#534AB7',
      opacity: 1,
    },
    '& .MuiSwitch-track': {
      backgroundColor: '#D3D1C7',
      opacity: 1,
    },
  },
};


export const TherapistForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();
  const { can } = useUserPermissions();
  const [canEditProfitSharing, setCanEditProfitSharing] = React.useState(false);

  React.useEffect(() => {
    can('UpdateProfitSharing', 'Therapist').then(setCanEditProfitSharing);
  }, [can]);

  return (
    <Form<SaveTherapistRequest, Therapist>
      entityType="therapist"
      entityId={id ?? null}
      protoConstructor={SaveTherapistRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: listTherapists }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Therapist)}
    >
      <FormTabs>
        <FormTab label="Profile">
          <ProfileTab />
        </FormTab>
        <FormTab label="Settings">
          <SettingsTab canEditProfitSharing={canEditProfitSharing} />
        </FormTab>
        {id ? (
          <FormTab label={t('Services')} width="xl" height={720}>
            <TherapistServicesTab therapistId={id} />
          </FormTab>
        ) : null}
        {id ? (
          <FormTab label={t('Therapist Customer')} width="xl" height={720}>
            <TherapistCustomersTab therapistId={id} />
          </FormTab>
        ) : null}
      </FormTabs>
      <TherapistFooter onCancel={onCancel} gridTabIndices={id ? [2, 3] : []} therapistId={id} />
    </Form>
  );
};

const ProfileTab: React.FC = () => {
  const { t } = useTranslation();
  const [language, setLanguage] = React.useState<'en' | 'pl'>('en');

  return (
    <>
      <SectionLabel>{t('Profile Image')}</SectionLabel>
      <ImageFe
        name="profileImage"
        label="Profile Image"
        aspect={1}
        circularCrop
        hideLabel
        layout="therapist-profile"
        cropDialogMaxWidth="lg"
        cropDialogPaperSx={{ height: 'min(82vh, 860px)', maxHeight: 'min(82vh, 860px)' }}
        cropDialogBodySx={{ alignItems: 'center', minHeight: 'min(62vh, 620px)', overflow: 'auto' }}
      />

      <Grid item xs={12} sx={{ my: 1 }}>
        <Divider />
      </Grid>

      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 1,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="overline" sx={{ lineHeight: 1.2 }}>
            {t('Profile Content')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Both languages are required to publish.')}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            p: 0.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <LanguageSwitchButton
            label="English"
            code="EN"
            active={language === 'en'}
            onClick={() => setLanguage('en')}
          />
          <LanguageSwitchButton
            label="Polish"
            code="PL"
            active={language === 'pl'}
            onClick={() => setLanguage('pl')}
          />
        </Stack>
      </Grid>

      <LanguagePanel hidden={language !== 'en'}>
        <StringFe
          name="professionalTitle.en"
          label="Professional Title (English)"
          required
          fullWidth
          {...filledFieldProps}
        />
        <MarkdownFe name="description.en" label="Description (English)" required />
        <StringFe
          name="metaDescription.en"
          label="Meta Description (English)"
          fullWidth
          multiline
          rows={3}
          {...filledFieldProps}
        />
      </LanguagePanel>

      <LanguagePanel hidden={language !== 'pl'}>
        <StringFe
          name="professionalTitle.pl"
          label="Professional Title (Polish)"
          required
          fullWidth
          {...filledFieldProps}
        />
        <MarkdownFe name="description.pl" label="Description (Polish)" required />
        <StringFe
          name="metaDescription.pl"
          label="Meta Description (Polish)"
          fullWidth
          multiline
          rows={3}
          {...filledFieldProps}
        />
      </LanguagePanel>
    </>
  );
};

const SettingsTab: React.FC<{ canEditProfitSharing: boolean }> = ({
  canEditProfitSharing,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <SettingsSection title={t('Account')}>
        <UserFe
          name="userId"
          label="User"
          textFieldProps={autocompleteTextFieldProps}
        />
        <LanguageFe
          name="languageIds"
          label="Languages"
          multiple
          textFieldProps={autocompleteTextFieldProps}
        />
      </SettingsSection>

      <SettingsSection title={t('Contact')}>
        <StringFe name="contactEmail" label="Contact Email" required fullWidth {...filledFieldProps} />
        <StringFe name="contactPhone" label="Contact Phone" fullWidth {...filledFieldProps} />
      </SettingsSection>

      <SettingsSection title={t('Public Profile')}>
        <StringFe name="slug" label="URL Slug" required fullWidth {...filledFieldProps} />
        <DisplayColorField />
      </SettingsSection>

      <SettingsSection title={t('Availability & Billing')}>
        <Grid item xs={12}>
          <Box
            sx={{
              backgroundColor: '#F6F4EE',
              borderRadius: 2,
              px: 1.5,
            }}
          >
            <Grid container>
              <SwitchRowFe
                name="onlineTherapyFormat"
                label={t('Online Therapy')}
                description={t('Sessions delivered via video link.')}
                switchProps={therapistSwitchProps}
                divider
              />
              <SwitchRowFe
                name="inPersonTherapyFormat"
                label={t('In-Person Therapy')}
                description={t('Sessions held in a physical room.')}
                switchProps={therapistSwitchProps}
                divider
              />
              <SwitchRowFe
                name="isAcceptingNewClients"
                label={t('Accepting New Clients')}
                description={t('Visible to potential clients on the public site.')}
                switchProps={therapistSwitchProps}
              />
            </Grid>
          </Box>
        </Grid>
        <NumberFe
          name="percentageProfitSharing"
          label="Profit Sharing %"
          disabled={!canEditProfitSharing}
          min={0}
          max={100}
          step={0.01}
          xs={12}
          {...filledFieldProps}
        />
      </SettingsSection>
    </>
  );
};

const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <>
    <SectionLabel>{title}</SectionLabel>
    {children}
  </>
);

const DisplayColorField: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const { field } = useFormController<string | undefined>({ formId, name: 'displayColor' });
  const selected = field.value ?? therapistColorOptions[0];
  const hasPresetMatch = therapistColorOptions.some(
    (color) => color.toLowerCase() === selected.toLowerCase()
  );

  return (
    <Grid item xs={12} md={6}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: 'text.secondary' }}>
        {t('Calendar Color')}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {therapistColorOptions.map((color) => {
          const isActive = selected.toLowerCase() === color.toLowerCase();
          return (
            <Box
              key={color}
              component="button"
              type="button"
              onClick={() => field.onChange(color)}
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #fff',
                boxShadow: isActive ? `0 0 0 1.5px ${color}` : '0 0 0 1px #E0DED5',
                cursor: 'pointer',
                p: 0,
              }}
            />
          );
        })}
        <Box
          sx={{
            position: 'relative',
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: hasPresetMatch ? '1px dashed #C8C5B9' : '2px solid #fff',
            boxShadow: hasPresetMatch ? '0 0 0 1px #E0DED5' : `0 0 0 1.5px ${selected}`,
            backgroundColor: hasPresetMatch ? '#FFFFFF' : selected,
            color: hasPresetMatch ? '#888780' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          title={hasPresetMatch ? t('Custom Color') : selected}
        >
          <AddIcon sx={{ fontSize: 14, pointerEvents: 'none', opacity: hasPresetMatch ? 1 : 0 }} />
          <Box
            component="input"
            type="color"
            value={selected || '#534AB7'}
            onChange={(e) => field.onChange(e.target.value)}
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              border: 0,
              p: 0,
            }}
          />
        </Box>
      </Stack>
    </Grid>
  );
};

const LanguageSwitchButton: React.FC<{
  label: string;
  code: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, code, active, onClick }) => (
  <Button
    type="button"
    variant="text"
    onClick={onClick}
    sx={{
      px: 1.5,
      py: 0.75,
      borderRadius: 1.5,
      color: active ? 'text.primary' : 'text.secondary',
      bgcolor: active ? 'background.paper' : 'transparent',
      boxShadow: active ? 1 : 0,
      textTransform: 'none',
      minWidth: 0,
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        component="span"
        sx={{
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: active ? 'text.primary' : 'transparent',
          color: active ? 'background.paper' : 'text.secondary',
          border: active ? 'none' : '1px solid',
          borderColor: 'divider',
          lineHeight: 1.2,
        }}
      >
        {code}
      </Box>
      <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>
        {label}
      </Typography>
    </Stack>
  </Button>
);

const LanguagePanel: React.FC<{
  hidden: boolean;
  children: React.ReactNode;
}> = ({ hidden, children }) => (
  <Grid item xs={12} sx={{ display: hidden ? 'none' : 'block' }}>
    <Grid container spacing={1}>
      {children}
    </Grid>
  </Grid>
);

const TherapistFooter: React.FC<{
  onCancel: () => void;
  gridTabIndices: number[];
  therapistId?: string;
}> = ({ onCancel, gridTabIndices, therapistId }) => {
  const formId = useFormId();
  const active = useFormActiveTabIndex(formId) ?? 0;
  if (gridTabIndices.includes(active)) return null;
  return (
    <>
      <FormActionsDropdown
        permission={Permissions.Therapist}
        deleteDescriptor={deleteTherapist}
        entityId={therapistId}
        onDeleteSuccess={onCancel}
      />
      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </>
  );
};

const THERAPIST_SERVICE_FORM = { formName: 'TherapistServiceForm' } as const;

const TherapistServicesTab: React.FC<{ therapistId: string }> = ({ therapistId: therapistIdProp }) => {
  const formId = useFormId();
  const therapistId = useFieldValue<string>(formId, 'id') ?? therapistIdProp;

  const formPropsMapper = React.useCallback(
    () => ({ therapistId }),
    [therapistId],
  );

  const overrideFilters = React.useMemo(
    () => [
      {
        id: 'therapistId',
        value: therapistId,
        operator: WhereOperator.EQ,
      },
    ],
    [therapistId],
  );

  return (
    <GridTab
      permission={Permissions.TherapistService}
      grid={TherapistServiceLinkGrid}
      gridType="TherapistServiceLink"
      listViewMethod={listTherapistServiceLinks}
      deleteMethod={deleteTherapistServiceLink}
      dialogTitle="Assign service"
      form={THERAPIST_SERVICE_FORM}
      formPropsMapper={formPropsMapper}
      overrideFilters={overrideFilters}
    />
  );
};

const THERAPIST_CUSTOMER_FORM = { formName: 'TherapistCustomerForm' } as const;

const TherapistCustomersTab: React.FC<{ therapistId: string }> = ({ therapistId: therapistIdProp }) => {
  const formId = useFormId();
  const therapistId = useFieldValue<string>(formId, 'id') ?? therapistIdProp;

  const formPropsMapper = React.useCallback(
    () => ({ therapistId }),
    [therapistId],
  );

  const overrideFilters = React.useMemo(
    () => [
      {
        id: 'therapistId',
        value: therapistId,
        operator: WhereOperator.EQ,
      },
    ],
    [therapistId],
  );

  return (
    <GridTab
      permission={Permissions.TherapistCustomer}
      grid={TherapistCustomerLinkGrid}
      gridType="TherapistCustomerLink"
      listViewMethod={listTherapistCustomerLinks}
      deleteMethod={deleteTherapistCustomerLink}
      form={THERAPIST_CUSTOMER_FORM}
      formPropsMapper={formPropsMapper}
      overrideFilters={overrideFilters}
    />
  );
};
