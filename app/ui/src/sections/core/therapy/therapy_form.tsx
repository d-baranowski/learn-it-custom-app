import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  ListItemText,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-hot-toast';
import { useQuery } from '@connectrpc/connect-query';

import {
  create,
  get,
  list as listTherapies,
  update,
  delete$ as deleteTherapy,
} from '@gen/core/v1/therapy-TherapyService_connectquery';
import {
  autocomplete as therapistAutocomplete,
  get as getTherapist,
} from '@gen/core/v1/therapist-TherapistService_connectquery';
import { get as getCustomer } from '@gen/core/v1/customer-CustomerService_connectquery';
import { get as getService } from '@gen/core/v1/service-ServiceService_connectquery';
import {
  list as listSessions,
  delete$ as deleteSession,
} from '@gen/core/v1/session-SessionService_connectquery';
import { Therapy, SaveTherapyRequest } from '@gen/core/v1/therapy_pb';
import { Session } from '@gen/core/v1/session_pb';
import { Permissions } from '@gen/permissions';
import { SessionGrid } from '@gen/grids';
import {
  AutocompleteRequest,
  GetRequest,
  Where_Mode,
  WhereOperator,
} from '@gen/request/v1/base_pb';
import BlockIcon from '@mui/icons-material/Block';
import UndoIcon from '@mui/icons-material/Undo';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { NumberFe } from '~/components/form/elements/number-fe';
import { DateFe } from '~/components/form/elements/date-fe';
import {
  CustomerFe,
  TherapistFe,
  TherapistServiceFe,
} from '~/components/form/elements/entity-autocompletes';
import { SessionFrequencyFe } from '~/components/form/elements/session-frequency-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { SectionLabel } from '~/components/form/elements/section-label';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import {
  useFieldValue,
  useFormActions,
  useFormActiveTabIndex,
  useFormFlags,
  useFormStatus,
} from '~/_lib/forms/state/hooks';
import { useDependentField } from '~/_lib/forms/hooks/use-dependent-field';

import GridTab from '~/_lib/grid/tab';
import type { GridContextMenuData } from '~/_lib/grid/pure-grid';
import { validateTherapyForm } from '~/validation/custom-validations';
import { useWindowActions } from '~/_lib/window/state/hooks';
import {
  dispatchRpgWindowEvent,
  subscribeRpgWindowEvent,
} from '~/_lib/window/window-events';
import { useSession } from '~/auth/session-provider';
import { WhereBuilder } from '~/request';
import { DefaultAutocompleteOrder } from '~/components/form/elements/types';
import { getInitials } from '~/utils/get-initials';
import { SessionCancellationDialog } from '~/sections/core/session/session_cancellation_dialog';

const isWithinGeneratedWindow = (
  at: string | undefined | null,
  till: string | undefined | null
): boolean => {
  if (!at || !till) return false;
  const atMs = Number(at);
  const tillMs = Number(till);
  if (!Number.isFinite(atMs) || !Number.isFinite(tillMs)) return false;
  const today = Date.now();
  return today >= atMs && today <= tillMs;
};

const GENERATE_WINDOW_ID = 'session-generate-preview';
const UNLOCK_WINDOW_ID = 'session-unlock-preview';
const DELETE_FUTURE_WINDOW_ID = 'session-delete-future-preview';
const UPDATE_PRICES_WINDOW_ID = 'session-update-prices';

interface Props {
  id?: string;
  afterSave?: (formData: Therapy) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const TherapyForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();
  const [createdTherapyId, setCreatedTherapyId] = React.useState<string>();
  const [pendingGeneratePrompt, setPendingGeneratePrompt] = React.useState(false);
  const defaultValues = React.useMemo<Record<string, unknown>>(
    () => ({
      sessionDuration: 50,
      startDate: String(new Date().getTime()),
      customerIds: [],
    }),
    []
  );
  const effectiveId = createdTherapyId ?? id;

  const handleSubmitSuccess = React.useCallback(
    (saved: Therapy) => {
      const savedId = saved.id;
      const isCreate = !id;
      const isWindowedCreate = isCreate && !!windowId;

      if (isWindowedCreate && savedId) {
        setCreatedTherapyId(savedId);
        setPendingGeneratePrompt(true);
        dispatchRpgWindowEvent('rpg:window:saved', {
          windowId,
          formName: 'TherapyForm',
          title: 'Therapy',
          data: saved,
        });
        return;
      }

      afterSave(saved);
    },
    [afterSave, id, windowId]
  );

  return (
    <Form<SaveTherapyRequest, Therapy>
      key={effectiveId ?? 'new'}
      entityType="therapy"
      entityId={effectiveId ?? null}
      protoConstructor={SaveTherapyRequest}
      io={{ get, create, update }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => handleSubmitSuccess(saved as Therapy)}
      defaultValues={defaultValues}
      customValidation={validateTherapyForm}
      optimisticList={{ listDescriptor: listTherapies }}
    >
      <TherapySubtitle />
      <FormTabs>
        <FormTab label="Configuration" width="md" height={665}>
          <ConfigurationTab />
        </FormTab>
        <FormTab label="Schedule" width={800} height={650}>
          <SessionFrequencyTab id={effectiveId} />
        </FormTab>
        {effectiveId ? (
          <FormTab
            label="Sessions"
            width="xl"
            height={720}
            icon={pendingGeneratePrompt ? (
              <Tooltip title={t('Sessions need generating — go to Schedule tab')}>
                <InfoOutlinedIcon fontSize="small" color="info" />
              </Tooltip>
            ) : undefined}
          >
            <SessionsTab />
          </FormTab>
        ) : null}
      </FormTabs>
      <TherapyFooter
        onCancel={onCancel}
        sessionsTabIndex={effectiveId ? 2 : -1}
        therapyId={effectiveId}
      />
    </Form>
  );
};


const TherapySubtitle: React.FC = () => {
  const { i18n } = useTranslation();
  const formId = useFormId();
  const therapistId = useFieldValue<string>(formId, 'therapistId');
  const serviceId = useFieldValue<string>(formId, 'serviceId');
  const startDate = useFieldValue<string>(formId, 'startDate');

  const { data: therapistData } = useQuery(
    getTherapist,
    therapistId ? new GetRequest({ ID: therapistId }) : undefined,
    { enabled: !!therapistId }
  );
  const { data: serviceData } = useQuery(
    getService,
    serviceId ? new GetRequest({ ID: serviceId }) : undefined,
    { enabled: !!serviceId }
  );

  const subtitle = React.useMemo(() => {
    const parts: string[] = [];
    const therapistLabel = therapistData?.userLabel;
    if (therapistLabel) parts.push(therapistLabel);
    const serviceLabel =
      i18n.language === 'pl'
        ? serviceData?.name?.pl || serviceData?.name?.en
        : serviceData?.name?.en;
    if (serviceLabel) parts.push(serviceLabel);
    if (startDate) {
      const ms = Number(startDate);
      if (Number.isFinite(ms)) {
        const formatted = new Intl.DateTimeFormat(i18n.language, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(ms));
        parts.push(formatted);
      }
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [therapistData, serviceData, startDate, i18n.language]);

  if (!subtitle) return null;

  return (
    <Grid item xs={12} sx={{ mt: -0.5, mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {subtitle} CI/CD
      </Typography>
    </Grid>
  );
};

const TherapyFooter: React.FC<{
  onCancel: () => void;
  sessionsTabIndex: number;
  therapyId?: string;
}> = ({ onCancel, sessionsTabIndex, therapyId }) => {
  const { t, i18n } = useTranslation();
  const formId = useFormId();
  const active = useFormActiveTabIndex(formId) ?? 0;
  const { openWindow } = useWindowActions();
  const formActions = useFormActions(formId);
  const { isDirty } = useFormFlags(formId);
  const formStatus = useFormStatus(formId);
  const [saveFirstOpen, setSaveFirstOpen] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const therapistId = useFieldValue<string>(formId, 'therapistId');
  const serviceId = useFieldValue<string>(formId, 'serviceId');
  const sessionPrice = useFieldValue<string>(formId, 'sessionPrice');
  const sessionFrequency = useFieldValue<unknown[]>(formId, 'sessionFrequency');
  const sessionsGeneratedAt = useFieldValue<string>(formId, 'sessionsGeneratedAt');
  const sessionsGeneratedTill = useFieldValue<string>(formId, 'sessionsGeneratedTill');
  const [unlockedManually, setUnlockedManually] = useState(false);
  const isLocked = !!therapyId && !unlockedManually &&
    isWithinGeneratedWindow(sessionsGeneratedAt, sessionsGeneratedTill);

  React.useEffect(() => {
    return subscribeRpgWindowEvent('rpg:window:saved', (event) => {
      if (event.detail.windowId === UNLOCK_WINDOW_ID) {
        setUnlockedManually(true);
        toast.success(t('Schedule unlocked — save changes and generate sessions'));
      }
      if (event.detail.windowId === GENERATE_WINDOW_ID) {
        setUnlockedManually(false);
      }
    });
  }, [t]);

  const { data: therapistData } = useQuery(
    getTherapist,
    therapistId ? new GetRequest({ ID: therapistId }) : undefined,
    { enabled: !!therapistId }
  );
  const { data: serviceData } = useQuery(
    getService,
    serviceId ? new GetRequest({ ID: serviceId }) : undefined,
    { enabled: !!serviceId }
  );

  const therapistLabel = therapistData?.userLabel;
  const serviceLabel = i18n.language === 'pl'
    ? serviceData?.name?.pl || serviceData?.name?.en
    : serviceData?.name?.en;
  const frequencySummary = React.useMemo(() => {
    if (!Array.isArray(sessionFrequency) || sessionFrequency.length === 0) return undefined;
    const locale = i18n.language || 'en';
    const isoDayToName = (iso: number) => {
      const base = new Date('2024-01-01');
      base.setDate(base.getDate() + (iso - 1));
      return base.toLocaleDateString(locale, { weekday: 'short' });
    };
    return (sessionFrequency as Array<{ onDay?: number[]; every?: number }>)
      .map((f) => {
        const days = (f.onDay || []).map(isoDayToName).join(', ');
        const every = f.every && f.every > 1 ? t('every {{n}} weeks', { n: f.every }) : '';
        return [days, every].filter(Boolean).join(', ');
      })
      .join('; ');
  }, [sessionFrequency, i18n.language, t]);

  const hasSchedule = Array.isArray(sessionFrequency) && sessionFrequency.length > 0;

  const openGenerate = useCallback(() => {
    openWindow({
      formName: 'SessionGeneratePreview',
      title: t('Generate sessions'),
      windowId: GENERATE_WINDOW_ID,
      formProps: {
        therapyId,
        mode: 'generate',
        therapistLabel,
        serviceLabel,
        frequencySummary,
      },
      maxWidth: 'md',
      initialHeight: 700,
    });
  }, [openWindow, t, therapyId, therapistLabel, serviceLabel, frequencySummary]);

  // Guard generation behind saving: generating off an unsaved therapy would use
  // stale server-side schedule/times and produce wrong sessions.
  const handleGenerateClick = useCallback(() => {
    if (isDirty) {
      setSaveFirstOpen(true);
    } else {
      openGenerate();
    }
  }, [isDirty, openGenerate]);

  const handleSaveAndGenerate = useCallback(() => {
    setSaveFirstOpen(false);
    setPendingGenerate(true);
    formActions.submit();
  }, [formActions]);

  // Once a pending save resolves, continue to generation on success and stand
  // down on validation/server failure (the form surfaces the error itself).
  useEffect(() => {
    if (!pendingGenerate) return;
    if (formStatus === 'submitSuccess') {
      setPendingGenerate(false);
      openGenerate();
    } else if (formStatus === 'submitError') {
      setPendingGenerate(false);
    }
  }, [pendingGenerate, formStatus, openGenerate]);

  if (active === sessionsTabIndex) return null;
  return (
    <>
      <FormActionsDropdown
        permission={Permissions.Therapy}
        deleteDescriptor={deleteTherapy}
        entityId={therapyId}
        onDeleteSuccess={onCancel}
      >
        {therapyId && (
          <>
            <MenuItem
              data-testid="generate-sessions-menu-btn"
              sx={{ py: 0.75, gap: 0.75 }}
              disabled={!hasSchedule}
              onClick={handleGenerateClick}
            >
              <PlayArrowIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0 }} />
              <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Generate Sessions')}</ListItemText>
            </MenuItem>
            {isLocked && (
              <MenuItem
                data-testid="unlock-frequency-menu-btn"
                sx={{ py: 0.75, gap: 0.75 }}
                onClick={() => {
                  openWindow({
                    formName: 'SessionGeneratePreview',
                    title: t('Unlock Schedule'),
                    windowId: UNLOCK_WINDOW_ID,
                    formProps: { therapyId, mode: 'unlock' },
                    maxWidth: 'md',
                    initialHeight: 600,
                  });
                }}
              >
                <LockOpenIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0 }} />
                <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Unlock Schedule')}</ListItemText>
              </MenuItem>
            )}
            <MenuItem
              data-testid="delete-future-sessions-btn"
              sx={{ py: 0.75, gap: 0.75 }}
              onClick={() => {
                openWindow({
                  formName: 'SessionGeneratePreview',
                  title: t('Delete Future Sessions'),
                  windowId: DELETE_FUTURE_WINDOW_ID,
                  formProps: { therapyId, mode: 'unlock' },
                  maxWidth: 'md',
                  initialHeight: 700,
                });
              }}
            >
              <DeleteSweepIcon sx={{ fontSize: 16, color: 'error.main', mr: 0 }} />
              <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Delete Future Sessions')}</ListItemText>
            </MenuItem>
            <MenuItem
              data-testid="update-session-prices-btn"
              sx={{ py: 0.75, gap: 0.75 }}
              onClick={() => {
                openWindow({
                  formName: 'UpdateSessionPrices',
                  title: t('Update Session Prices'),
                  windowId: UPDATE_PRICES_WINDOW_ID,
                  formProps: { therapyIds: [therapyId], defaultPrice: sessionPrice },
                  maxWidth: 'md',
                  initialHeight: 700,
                });
              }}
            >
              <PriceChangeIcon sx={{ fontSize: 16, color: 'secondary.main', mr: 0 }} />
              <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Update Session Prices')}</ListItemText>
            </MenuItem>
          </>
        )}
      </FormActionsDropdown>
      <FormActions withDivider sx={therapyId && active === 1 ? { justifyContent: 'space-between' } : undefined}>
        {therapyId && active === 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isLocked && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<LockOpenIcon />}
                data-testid="unlock-frequency-btn"
                onClick={() => {
                  openWindow({
                    formName: 'SessionGeneratePreview',
                    title: t('Unlock Schedule'),
                    windowId: UNLOCK_WINDOW_ID,
                    formProps: { therapyId, mode: 'unlock' },
                    maxWidth: 'md',
                    initialHeight: 600,
                  });
                }}
              >
                {t('Unlock Schedule')}
              </Button>
            )}
            <Tooltip title={hasSchedule ? '' : t('Set up a schedule before generating sessions')}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  data-testid="generate-sessions-btn"
                  disabled={!hasSchedule}
                  onClick={handleGenerateClick}
                >
                  {t('Generate Sessions')}
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <CancelButton variant="text" onClick={onCancel}>
            {t('Cancel')}
          </CancelButton>
          <SaveButton>{t('Save Changes')}</SaveButton>
        </Box>
      </FormActions>

      <Dialog
        open={saveFirstOpen}
        onClose={() => setSaveFirstOpen(false)}
        maxWidth="xs"
        data-testid="generate-save-first-dialog"
      >
        <DialogTitle>{t('Save changes first?')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t(
              'This therapy has unsaved changes. Save them before generating sessions, otherwise the sessions will be based on the last saved schedule.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSaveFirstOpen(false)}
            data-testid="generate-save-first-cancel"
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAndGenerate}
            data-testid="generate-save-first-confirm"
          >
            {t('Save & generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ConfigurationTab: React.FC = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const formId = useFormId();
  const actions = useFormActions(formId);

  const therapistId = useFieldValue<string>(formId, 'therapistId');
  const serviceId = useFieldValue<string>(formId, 'serviceId');
  const customerIdsRaw = useFieldValue<string[]>(formId, 'customerIds');
  const customerIds = React.useMemo(
    () => customerIdsRaw ?? [],
    [customerIdsRaw]
  );

  useDependentField({
    watch: 'serviceId',
    query: getService,
    buildRequest: (id) => new GetRequest({ ID: id as string }) as never,
    apply: (svc) =>
      svc.defaultPrice !== undefined
        ? { sessionPrice: String(svc.defaultPrice) }
        : {},
  });

  const myTherapistRequest = React.useMemo(() => {
    if (!session?.userId) return undefined;
    const wb = new WhereBuilder<'Therapist'>()
      .setMode(Where_Mode.AND)
      .eq('userId', session.userId);
    return new AutocompleteRequest({
      where: wb.build(),
      order: DefaultAutocompleteOrder,
    });
  }, [session?.userId]);

  const { data: myTherapistData } = useQuery(
    therapistAutocomplete,
    myTherapistRequest ?? undefined,
    { enabled: !!myTherapistRequest }
  );
  const myTherapist = myTherapistData?.items?.[0];

  const newDisplayName = useDeriveDisplayName(
    therapistId,
    serviceId,
    customerIds[0]
  );

  const handleSuggestDisplayName = React.useCallback(() => {
    if (!therapistId || !serviceId || customerIds.length === 0) {
      toast.error(
        t(
          'Please fill in service, therapist and customer to suggest a display name'
        )
      );
      return;
    }
    if (newDisplayName) {
      actions.changeField('displayName', newDisplayName);
    }
  }, [therapistId, serviceId, customerIds, newDisplayName, actions, t]);

  return (
    <>
      <SectionLabel>{t('Participants Section')}</SectionLabel>
      <TherapistFe
        name="therapistId"
        label="Therapist"
        required
        xs={12}
        endAdornment={
          myTherapist ? (
            <Tooltip title={t('Select Myself')}>
              <IconButton
                data-testid="select-myself-therapist-btn"
                size="small"
                onClick={() =>
                  actions.changeField('therapistId', myTherapist.ID)
                }
              >
                <AutoFixNormalIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      />
      <CustomerFe
        name="customerIds"
        label={t('Customers')}
        multiple
        required
        xs={12}
      />

      <SectionLabel>{t('Therapy Section')}</SectionLabel>
      <TherapistServiceFe
        therapistId={therapistId ?? null}
        name="serviceId"
        label="Service"
        required
      />
      <StringFe
        name="displayName"
        label={t('Display Name')}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button
                size="small"
                variant="text"
                disabled={newDisplayName === undefined}
                onClick={handleSuggestDisplayName}
                data-testid="suggest-display-name-btn"
                sx={{ minWidth: 0, px: 1 }}
              >
                {t('Generate')}
              </Button>
            </InputAdornment>
          ),
        }}
      />

      <SectionLabel>{t('Schedule Section')}</SectionLabel>
      <DateFe name="startDate" label="Start Date" required />
      <DateFe name="endDate" label="End Date (Optional)" />
      <NumberFe
        name="sessionDuration"
        label={t('Session Duration')}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography variant="caption" color="text.secondary">
                {t('min')}
              </Typography>
            </InputAdornment>
          ),
        }}
      />
      <StringFe
        name="sessionPrice"
        label={t('Session Price')}
        required
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

const SessionFrequencyTab: React.FC<{ id?: string }> = ({ id }) => {
  const formId = useFormId();
  const sessionDuration = useFieldValue<number>(formId, 'sessionDuration');
  const sessionsGeneratedAt = useFieldValue<string>(formId, 'sessionsGeneratedAt');
  const sessionsGeneratedTill = useFieldValue<string>(formId, 'sessionsGeneratedTill');
  const [unlockedManually, setUnlockedManually] = useState(false);

  const isLocked =
    !!id &&
    !unlockedManually &&
    isWithinGeneratedWindow(sessionsGeneratedAt, sessionsGeneratedTill);

  React.useEffect(() => {
    return subscribeRpgWindowEvent('rpg:window:saved', (event) => {
      if (event.detail.windowId === UNLOCK_WINDOW_ID) {
        setUnlockedManually(true);
      }
      if (event.detail.windowId === GENERATE_WINDOW_ID) {
        setUnlockedManually(false);
      }
    });
  }, []);

  return (
    <SessionFrequencyFe
      name="sessionFrequency"
      label="Schedule"
      disabled={isLocked}
      sessionDuration={sessionDuration ?? undefined}
    />
  );
};

const SESSION_FORM = { formName: 'SessionForm' } as const;

const SessionsTab: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const therapyId = useFieldValue<string>(formId, 'id');
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardMode, setWizardMode] = React.useState<'cancel' | 'undo'>(
    'cancel'
  );
  const [selectedSessionId, setSelectedSessionId] = React.useState<
    string | undefined
  >();
  const overrideFilters = React.useMemo(
    () => [
      {
        id: 'therapyId',
        value: therapyId,
        operator: WhereOperator.EQ,
      },
    ],
    [therapyId],
  );

  const formPropsMapper = React.useCallback(
    () => ({
      defaultValues: { therapyId },
      optimisticList: { listDescriptor: listSessions },
    }),
    [therapyId],
  );

  const contextMenuItems = React.useCallback(
    (data?: GridContextMenuData<Session>) => {
      const row = data?.row;
      if (!row?.id) return [];

      const isCancelled = !!row.cancelledAt;
      return [
        {
          testId: isCancelled ? 'session-undo-cancellation' : 'session-cancel',
          label: isCancelled ? t('Undo Cancellation') : t('Cancel Session'),
          icon: isCancelled ? (
            <UndoIcon fontSize="small" />
          ) : (
            <BlockIcon fontSize="small" />
          ),
          onClick: () => {
            setSelectedSessionId(row.id);
            setWizardMode(isCancelled ? 'undo' : 'cancel');
            setWizardOpen(true);
          },
        },
      ];
    },
    [t]
  );

  return (
    <>
      <GridTab
        permission={Permissions.Session}
        grid={SessionGrid}
        gridType="Session"
        listViewMethod={listSessions}
        deleteMethod={deleteSession}
        form={SESSION_FORM}
        formPropsMapper={formPropsMapper}
        overrideFilters={overrideFilters}
        contextMenuItems={contextMenuItems}
      />
      <SessionCancellationDialog
        open={wizardOpen}
        mode={wizardMode}
        sessionId={selectedSessionId}
        onClose={() => setWizardOpen(false)}
      />
    </>
  );
};

function useDeriveDisplayName(
  therapistId: string | undefined,
  serviceId: string | undefined,
  firstCustomerId: string | undefined
): string | undefined {
  const { data: therapistData } = useQuery(
    getTherapist,
    therapistId ? new GetRequest({ ID: therapistId }) : undefined,
    { enabled: !!therapistId }
  );
  const { data: serviceData } = useQuery(
    getService,
    serviceId ? new GetRequest({ ID: serviceId }) : undefined,
    { enabled: !!serviceId }
  );
  const { data: customerData } = useQuery(
    getCustomer,
    firstCustomerId ? new GetRequest({ ID: firstCustomerId }) : undefined,
    { enabled: !!firstCustomerId }
  );

  return React.useMemo(() => {
    let therapistAbbr = therapistData?.userAbbreviationLabel || '';
    let serviceAbbr = serviceData?.displayAbbreviation || '';
    let customerAbbr = customerData?.displayAbbreviation || '';
    if (!therapistAbbr && therapistData?.userLabel) {
      therapistAbbr = getInitials(therapistData.userLabel) || '';
    }
    if (!serviceAbbr && serviceData?.name?.en) {
      serviceAbbr = serviceData.name.en.slice(0, 3).toUpperCase();
    }
    if (!customerAbbr && (customerData?.firstName || customerData?.lastName)) {
      customerAbbr = getInitials(
        (customerData.lastName ?? '') + ' ' + (customerData.firstName ?? '')
      );
    }
    const parts = [therapistAbbr, serviceAbbr, customerAbbr].filter(Boolean);
    if (parts.length === 3) return parts.join(' - ');
    return undefined;
  }, [therapistData, serviceData, customerData]);
}

