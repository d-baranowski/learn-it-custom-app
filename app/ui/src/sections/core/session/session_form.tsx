import React from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Grid,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Popover,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import BlockIcon from '@mui/icons-material/Block';
import UndoIcon from '@mui/icons-material/Undo';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import toast from 'react-hot-toast';
import {
  createConnectQueryKey,
  useMutation,
  useQuery,
} from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';

import {
  addPaymentLink,
  create,
  get,
  update,
  delete$ as deleteSession,
} from '@gen/core/v1/session-SessionService_connectquery';
import {
  autocomplete as therapistAutocomplete,
} from '@gen/core/v1/therapist-TherapistService_connectquery';
import { get as getTherapy } from '@gen/core/v1/therapy-TherapyService_connectquery';
import { findAvailableRoom } from '@gen/core/v1/room-RoomService_connectquery';
import { FindAvailableRoomRequest } from '@gen/core/v1/room_pb';
import { Session, SaveSessionRequest, SessionCancellationActor } from '@gen/core/v1/session_pb';
import { AutocompleteRequest, Where_Mode } from '@gen/request/v1/base_pb';
import { Permissions } from '@gen/permissions';

import { Form, OptimisticListConfig } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { DateTimeFe } from '~/components/form/elements/date-time-fe';
import { EnumFe } from '~/components/form/elements/enum-fe';
import { DateStringFe } from '~/components/form/elements/date-string-fe';
import { TimeStringFe } from '~/components/form/elements/time-string-fe';
import { TimezoneFe } from '~/components/form/elements/timezone-fe';
import {
  CustomerFe,
  RoomFe,
  TherapistFe,
  TherapyFe,
} from '~/components/form/elements/entity-autocompletes';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { SectionLabel } from '~/components/form/elements/section-label';
import PaymentLinkDisplay from '~/components/form/elements/payment-link-display';
import { SessionCancellationDialog } from './session_cancellation_dialog';

import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActions } from '~/_lib/forms/state/hooks';
import { useDependentField } from '~/_lib/forms/hooks/use-dependent-field';
import { useOpenForm, OpenFormArgs } from '~/_lib/forms/use-open-form';

import { validateSessionForm } from '~/validation/custom-validations';
import { useSession } from '~/auth/session-provider';
import { WhereBuilder } from '~/request';
import { DefaultAutocompleteOrder } from '~/components/form/elements/types';
import { detectBrowserTimezone } from '~/utils/date';
import { addMinutesToTime, diffMinutes } from './session_time_utils';

const DEFAULT_TIMEZONE = detectBrowserTimezone();

export interface OpenSessionFormArgs
  extends Pick<OpenFormArgs<Session>, 'maxWidth' | 'initialHeight' | 'initialWidth'> {
  /** null = create a new session; otherwise edit that session id. */
  entityId: string | null;
  /** Window title. */
  title: string;
  /** Prefilled session fields (e.g. from a calendar slot). */
  defaultValues?: Partial<Session>;
  /** Runs after each successful save with the saved `Session`. */
  afterSave?: (saved: Session) => void;
}

/**
 * Opens the SessionForm window with `formName`/`entityType` pre-bound and a
 * fully `Session`-typed argument surface. Prefer this over calling `useOpenForm`
 * directly so callers get real type-checking on `defaultValues`/`afterSave`.
 */
export function useOpenSessionForm() {
  const { openForm } = useOpenForm();
  return React.useCallback(
    ({
      entityId,
      title,
      defaultValues,
      afterSave,
      maxWidth,
      initialHeight,
      initialWidth,
    }: OpenSessionFormArgs) =>
      openForm<Session>({
        formName: 'SessionForm',
        entityType: 'session',
        entityId,
        title,
        maxWidth,
        initialHeight,
        initialWidth,
        formProps: { defaultValues },
        afterSave,
      }),
    [openForm]
  );
}

interface Props {
  id?: string;
  afterSave?: (savedData?: Session) => void;
  onCancel?: () => void;
  defaultValues?: Partial<Session>;
  windowId?: string;
  /**
   * If provided, the form patches the matching session-list grid cache
   * optimistically. Set when SessionForm is opened from a grid context
   * (e.g. the Sessions tab inside Therapy). Calendar callers leave this
   * unset — the calendar manages its own optimistic state.
   */
  optimisticList?: OptimisticListConfig<Session>;
  /** When set, replaces the backend save with a local callback. */
  customSubmitHandler?: (values: Record<string, unknown>, isUpdate: boolean) => Promise<Session>;
}

export const SessionForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  defaultValues,
  windowId,
  optimisticList,
  customSubmitHandler,
}) => {
  const mergedDefaults = React.useMemo(
    () => ({ timezone: DEFAULT_TIMEZONE, ...defaultValues }) as Record<string, unknown>,
    [defaultValues]
  );

  const resolvedSubmitHandler = React.useMemo(() => {
    if (customSubmitHandler) return customSubmitHandler;
    if (windowId) {
      const { consumeOverrideSubmitHandler } = require('~/sections/core/therapy/session-generate/override_submit_store');
      return consumeOverrideSubmitHandler(windowId) as typeof customSubmitHandler;
    }
    return undefined;
  }, [customSubmitHandler, windowId]);

  return (
    <div data-testid="session-form">
      <Form<SaveSessionRequest, Session>
        entityType="session"
        entityId={id ?? null}
        protoConstructor={SaveSessionRequest}
        io={{ get, create, update }}
        windowId={windowId}
        onCancel={onCancel}
        onSubmitSuccess={(saved) => afterSave(saved as Session)}
        defaultValues={mergedDefaults}
        customValidation={validateSessionForm}
        optimisticList={optimisticList}
        customSubmitHandler={resolvedSubmitHandler}
      >
        <SessionSubtitle />
        <FormTabs>
          <FormTab label="Details" height={735}>
            <SessionDetailsTab id={id} />
          </FormTab>
          <FormTab label="Payment" height={420}>
            <PaymentTab id={id} />
          </FormTab>
        </FormTabs>
        <CancellationReadOnlySection />
        <SessionFooter
        onCancel={onCancel}
          fallbackSessionId={id}
          onSessionChanged={afterSave}
      />
      </Form>
    </div>
  );
};

const SessionSubtitle: React.FC = () => {
  const { i18n } = useTranslation();
  const formId = useFormId();
  const date = useFieldValue<string>(formId, 'date');
  const startTime = useFieldValue<string>(formId, 'startTime');

  const subtitle = React.useMemo(() => {
    if (!date) return null;
    const parsed = new Date(`${date}T${startTime ?? '00:00'}:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    const datePart = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
    return startTime ? `${datePart} · ${startTime}` : datePart;
  }, [date, startTime, i18n.language]);

  if (!subtitle) return null;

  return (
    <Grid item xs={12} sx={{ mt: -0.5, mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Grid>
  );
};

const SessionDetailsTab: React.FC<{ id?: string }> = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const formId = useFormId();
  const actions = useFormActions(formId);

  const date = useFieldValue<string>(formId, 'date');
  const startTime = useFieldValue<string>(formId, 'startTime');
  const endTime = useFieldValue<string>(formId, 'endTime');
  const isOnline = useFieldValue<boolean>(formId, 'isOnline');

  useDependentField({
    watch: 'therapyId',
    query: getTherapy,
    apply: (therapy) => ({
      price: therapy.sessionPrice,
      therapistId: therapy.therapistId,
      displayName: therapy.displayName,
    }),
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

  const { mutateAsync: findAvailableRoomFn } = useMutation(findAvailableRoom);

  const duration = diffMinutes(startTime, endTime);

  return (
    <>
      <SectionLabel>{t('Session Section')}</SectionLabel>
      <TherapyFe name="therapyId" label={t('Therapy')} />
      <TherapistFe
        name="therapistId"
        label={t('Therapist')}
        required
        endAdornment={
          myTherapist ? (
            <Tooltip title={t('Select Myself')}>
              <IconButton
                data-testid="select-myself-therapist-btn"
                size="small"
                onClick={() => actions.changeField('therapistId', myTherapist.ID)}
              >
                <AutoFixNormalIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      />
      <CustomerFe name="customerIds" label={t('Customers')} multiple />
      <StringFe
        name="displayName"
        label={t('Calendar Label')}
        dataTestId="session-display-name"
      />

      <SectionLabel>{t('Schedule Section')}</SectionLabel>
      <DateStringFe name="date" label={t('Date')} required dataTestId="session-date" xs={6} />
      <TimeStringFe
        name="startTime"
        label={t('Start')}
        required
        dataTestId="session-start-time"
        xs={3}
      />
      <TimeStringFe
        name="endTime"
        label={t('End')}
        required
        dataTestId="session-end-time"
        xs={3}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              data-testid="session-end-datetime-autofill-btn"
              onClick={() => {
                if (startTime) {
                  actions.changeField('endTime', addMinutesToTime(startTime, 50));
                }
              }}
              size="small"
              title={t('Auto-fill: Start time + 50 minutes')}
            >
              <AutoFixHighIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        }
      />
      <Grid item xs={12} sx={{ mt: 0.5, mb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TimezoneEditor />
          {duration !== null && duration >= 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('Duration: {{minutes}} min', { minutes: duration })}
            </Typography>
          ) : null}
        </Stack>
      </Grid>

      <SectionLabel>{t('Location And Payment Section')}</SectionLabel>
      <RoomFe
        name="roomId"
        label={t('Room')}
        disabled={isOnline}
        endAdornment={
          <Tooltip title={t('Find available room')}>
            <span>
              <IconButton
                data-testid="find-available-room-btn"
                onClick={async () => {
                  if (!date || !startTime || !endTime) {
                    toast.error(t('Please set date, start time and end time first'));
                    return;
                  }
                  try {
                    const response = await findAvailableRoomFn(
                      new FindAvailableRoomRequest({ date, startTime, endTime })
                    );
                    if (response.roomId) {
                      actions.changeField('roomId', response.roomId);
                    } else {
                      toast.error(
                        t('No available rooms for the selected time slot')
                      );
                    }
                  } catch (error) {
                    console.error('Failed to find available room:', error);
                    toast.error(t('Failed to find available room'));
                  }
                }}
                size="small"
                disabled={!date || !startTime || !endTime || isOnline}
              >
                <AutoFixHighIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
      />
      <StringFe name="price" label={t('Price')} required />
      <OnlineSwitchRow />
    </>
  );
};

const TimezoneEditor: React.FC = () => {
  const formId = useFormId();
  const timezone = useFieldValue<string>(formId, 'timezone');
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          color: 'text.secondary',
          fontSize: '0.875rem',
          fontWeight: 400,
          textTransform: 'none',
          borderRadius: 1,
          px: 0.5,
          '&:hover': { color: 'text.primary' },
        }}
        data-testid="session-timezone-trigger"
      >
        {timezone || DEFAULT_TIMEZONE}
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1.5, width: 320 } } }}
      >
        <Grid container spacing={1}>
          <TimezoneFe name="timezone" xs={12} dataTestId="session-timezone" />
        </Grid>
      </Popover>
    </>
  );
};

const OnlineSwitchRow: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const actions = useFormActions(formId);
  const isOnline = useFieldValue<boolean>(formId, 'isOnline');

  return (
    <Grid item xs={12} sx={{ mt: 0.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          backgroundColor: '#F6F4EE',
          borderRadius: 1,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t('Online Session')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('Room will be disabled.')}
          </Typography>
        </Box>
        <Switch
          checked={!!isOnline}
          onChange={(e) => actions.changeField('isOnline', e.target.checked)}
          inputProps={
            { 'data-testid': 'is-online' } as React.InputHTMLAttributes<HTMLInputElement>
          }
      />
      </Stack>
    </Grid>
  );
};

function cancellationActorLabel(
  actor: SessionCancellationActor | number | undefined,
  t: (key: string) => unknown
): string {
  if (actor === SessionCancellationActor.CUSTOMER) {
    return String(t('Customer'));
  }
  if (actor === SessionCancellationActor.THERAPIST) {
    return String(t('Therapist'));
  }
  if (actor === SessionCancellationActor.OTHER) {
    return String(t('Other'));
  }
  return String(t('Unknown'));
}

const CancellationReadOnlySection: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const cancelledAt = useFieldValue<string | bigint | number | undefined>(
    formId,
    'cancelledAt'
  );
  const cancellationActor = useFieldValue<
    SessionCancellationActor | number | undefined
  >(formId, 'cancellationActor');
  const cancelledByUserLabel = useFieldValue<string | undefined>(
    formId,
    'cancelledByUserLabel'
  );

  if (!cancelledAt) return null;

  return (
    <>
      <SectionLabel>{t('Cancellation')}</SectionLabel>
      <DateTimeFe name="cancelledAt" label={t('Cancelled At')} disabled />
      <Grid item xs={6}>
        <TextField
          label={t('Cancelled By')}
          value={cancellationActorLabel(cancellationActor, t)}
          fullWidth
          disabled
          InputProps={{ readOnly: true }}
          inputProps={{ 'data-testid': 'session-cancelled-by' }}
      />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label={t('Cancelled By (user)')}
          value={cancelledByUserLabel ?? ''}
          fullWidth
          disabled
          InputProps={{ readOnly: true }}
          inputProps={{ 'data-testid': 'session-cancelled-by-user' }}
      />
      </Grid>
      <StringFe
        name="cancellationReason"
        label={t('Cancellation Reason')}
        fullWidth
        multiline
        rows={3}
        disabled
      />
    </>
  );
};

const SessionFooter: React.FC<{
  onCancel?: () => void;
  fallbackSessionId?: string;
  onSessionChanged?: (savedData?: Session) => void;
}> = ({ onCancel, fallbackSessionId, onSessionChanged }) => {
  const { t } = useTranslation();
  const formId = useFormId();
  const actions = useFormActions(formId);
  const sessionId =
    useFieldValue<string | undefined>(formId, 'id') ?? fallbackSessionId;
  const cancelledAt = useFieldValue<string | bigint | number | undefined>(
    formId,
    'cancelledAt'
  );

  const [wizardOpen, setWizardOpen] = React.useState(false);

  const isCancelled = !!cancelledAt;

  return (
    <>
      <FormActionsDropdown
        permission={Permissions.Session}
        deleteDescriptor={deleteSession}
        entityId={sessionId}
        onDeleteSuccess={onCancel}
      >
        <MenuItem
          data-testid={isCancelled ? 'form-undo-cancellation' : 'form-cancel-session'}
          onClick={() => setWizardOpen(true)}
          disabled={!sessionId}
          sx={{ py: 0.75, gap: 0.75 }}
        >
          <ListItemIcon>
            {isCancelled ? (
              <UndoIcon fontSize="small" />
            ) : (
              <BlockIcon fontSize="small" color="warning" />
            )}
          </ListItemIcon>
          <ListItemText>
            {isCancelled ? t('Undo Cancellation') : t('Cancel Session')}
          </ListItemText>
        </MenuItem>
      </FormActionsDropdown>
      <FormActions withDivider>
        <CancelButton variant="text" onClick={onCancel}>
          {t('Cancel')}
        </CancelButton>
        <SaveButton>{t('Save Changes')}</SaveButton>
      </FormActions>
      <SessionCancellationDialog
        open={wizardOpen}
        mode={cancelledAt ? 'undo' : 'cancel'}
        sessionId={sessionId}
        onClose={() => setWizardOpen(false)}
        onSuccess={(saved) => {
          actions.changeField('cancelledAt', saved.cancelledAt);
          actions.changeField('cancellationReason', saved.cancellationReason);
          actions.changeField('cancellationActor', saved.cancellationActor);
          onSessionChanged?.(saved);
        }}
      />
    </>
  );
};

const PaymentTab: React.FC<{ id?: string }> = ({ id }) => {
  const { t } = useTranslation();
  const formId = useFormId();
  const actions = useFormActions(formId);

  const price = useFieldValue<string>(formId, 'price');
  const paymentLink = useFieldValue<string>(formId, 'paymentLink');
  const paymentStatus = useFieldValue<string>(formId, 'paymentStatus');

  const [creatingPaymentLink, setCreatingPaymentLink] = React.useState(false);
  const { mutateAsync: addPaymentLinkFn } = useMutation(addPaymentLink);
  const queryClient = useQueryClient();
  const {
    refetch: refetchSession,
    isFetching: refreshingPaymentLink,
  } = useQuery(get, id ? { ID: id } : undefined, { enabled: false });

  const isEditMode = !!id;
  const hasPaymentLink = !!paymentLink;
  const hasPaymentStatus = !!paymentStatus;
  const isPending = paymentStatus === 'PENDING';
  const isFailed = paymentStatus === 'FAILED';

  const handleCreatePaymentLink = async () => {
    if (!id || !price) return;
    actions.changeField('paymentType', 3);
    setCreatingPaymentLink(true);
    try {
      const response = await addPaymentLinkFn({ sessionId: id });
      if (response) {
        actions.changeField('paymentLink', response.paymentLink);
        actions.changeField('paymentStatus', response.paymentStatus);
        actions.changeField('paymentType', response.paymentType);
        toast.success(
          response.paymentStatus === 'PENDING'
            ? t('Payment link request queued')
            : t('Payment link updated')
        );
      }
      queryClient.invalidateQueries({
        queryKey: createConnectQueryKey(get, { ID: id }),
      });
    } catch (error) {
      console.error('Failed to create payment link:', error);
    } finally {
      setCreatingPaymentLink(false);
    }
  };

  const handleRefreshPaymentLink = async () => {
    if (!id) return;
    try {
      const response = await refetchSession();
      if (response.isError || !response.data) {
        toast.error(t('Failed to refresh payment link'));
        return;
      }
      actions.changeField('paymentLink', response.data.paymentLink);
      actions.changeField('paymentStatus', response.data.paymentStatus);
    } catch (error) {
      console.error('Failed to refresh payment link:', error);
      toast.error(t('Failed to refresh payment link'));
    }
  };

  return (
    <>
      <DateTimeFe name="paidAt" label={t('Paid At')} />
      <EnumFe name="paymentType" label={t('Payment Type')} enumKey="SessionPaymentType" />
      {!hasPaymentLink && !hasPaymentStatus && isEditMode ? (
        <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2, paddingLeft: 1 }}>
          <Button
            variant="contained"
            color="primary"
            disabled={creatingPaymentLink || !price}
            onClick={handleCreatePaymentLink}
            data-testid="create-payment-link"
          >
            {creatingPaymentLink ? t('Creating...') : t('Create Payment Link')}
          </Button>
        </Stack>
      ) : hasPaymentLink || hasPaymentStatus ? (
        <>
          <PaymentLinkDisplay
            paymentLink={paymentLink}
            paymentStatus={paymentStatus}
            onRefresh={handleRefreshPaymentLink}
            refreshing={refreshingPaymentLink}
            xs={12}
          />
          {isEditMode && !isPending && isFailed ? (
            <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2, paddingLeft: 1 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={creatingPaymentLink || !price}
                onClick={handleCreatePaymentLink}
                data-testid="retry-payment-link"
              >
                {creatingPaymentLink ? t('Retrying...') : t('Retry Payment Link')}
              </Button>
            </Stack>
          ) : null}
        </>
      ) : null}
    </>
  );
};
