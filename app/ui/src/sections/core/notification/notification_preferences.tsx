import React from 'react';
import { useMutation, useQuery } from '@connectrpc/connect-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { SelectRequest } from '@gen/request/v1/base_pb';
import { list as listLanguages } from '@gen/core/v1/language-LanguageService_connectquery';
import {
  listMyNotificationPreferences,
  saveMyNotificationPreferences,
} from '@gen/notification/v1/notification_preference-NotificationPreferenceService_connectquery';
import type {
  IMyNotificationPreference,
  ISaveMyNotificationPreferenceItem,
} from '@gen/interface';
import { NotificationDeliveryMechanism } from '@gen/notification/v1/notification_common_pb';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-hot-toast';
import { useSession } from '~/auth/session-provider';

interface NotificationPreferencesModalProps {
  onClose: () => void;
  open: boolean;
}

interface PreferenceFormState {
  email: string;
  items: Record<string, NotificationDeliveryMechanism[]>;
  languageCode: string;
  phoneNumber: string;
}

interface LanguageOption {
  label: string;
  value: string;
}

const languageRequest = new SelectRequest({
  selectAll: true,
});

const enabledChannelOptions: Array<{
  labelKey: string;
  value: NotificationDeliveryMechanism;
}> = [
  {
    labelKey: 'Email',
    value: NotificationDeliveryMechanism.EMAIL,
  },
  {
    labelKey: 'SMS',
    value: NotificationDeliveryMechanism.SMS,
  },
];

const getLanguageLabel = (
  name: { en?: string; pl?: string } | undefined,
  isoCode: string,
  locale: string,
): string => {
  const translatedName =
    (locale === 'pl' ? name?.pl : name?.en) || name?.en || name?.pl || isoCode;

  return `${translatedName} (${isoCode})`;
};

const normalizeDeliveryMechanisms = (
  deliveryMechanisms: NotificationDeliveryMechanism[] | undefined,
): NotificationDeliveryMechanism[] => {
  const seen = new Set<NotificationDeliveryMechanism>();
  const result: NotificationDeliveryMechanism[] = [];

  for (const value of deliveryMechanisms ?? []) {
    if (
      value !== NotificationDeliveryMechanism.EMAIL &&
      value !== NotificationDeliveryMechanism.SMS
    ) {
      continue;
    }

    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result.sort((left, right) => left - right);
};

const buildStateFromData = (
  items: IMyNotificationPreference[],
  languageCode: string,
  phoneNumber?: string,
  email?: string,
): PreferenceFormState => ({
  email: email ?? '',
  languageCode: languageCode || 'en',
  phoneNumber: phoneNumber ?? '',
  items: items.reduce<Record<string, NotificationDeliveryMechanism[]>>(
    (acc, item) => {
      acc[item.eventTypeKey] = normalizeDeliveryMechanisms(
        item.deliveryMechanisms,
      );
      return acc;
    },
    {},
  ),
});

const normalizeState = (state: PreferenceFormState): string =>
  JSON.stringify({
    email: state.email.trim().toLowerCase(),
    languageCode: state.languageCode,
    phoneNumber: state.phoneNumber.trim(),
    items: Object.entries(state.items)
      .map(([eventTypeKey, values]) => ({
        eventTypeKey,
        values: normalizeDeliveryMechanisms(values),
      }))
      .sort((left, right) =>
        left.eventTypeKey.localeCompare(right.eventTypeKey),
      ),
  });

export const NotificationPreferencesModal: React.FC<
  NotificationPreferencesModalProps
> = ({ onClose, open }) => {
  const { t, i18n } = useTranslation('common');
  const { session } = useSession();
  const { data, error, isLoading, refetch } = useQuery(
    listMyNotificationPreferences,
    {},
    { enabled: open },
  );
  const { data: languages } = useQuery(listLanguages, languageRequest, {
    enabled: open,
  });
  const { mutateAsync: savePreferences, isPending: isSaving } = useMutation(
    saveMyNotificationPreferences,
  );
  const preferenceItems = React.useMemo(() => data?.items ?? [], [data?.items]);

  const [state, setState] = React.useState<PreferenceFormState>({
    email: '',
    languageCode: 'en',
    phoneNumber: '',
    items: {},
  });

  React.useEffect(() => {
    if (!open || !data) {
      return;
    }

    setState(
      buildStateFromData(
        preferenceItems,
        data.languageCode,
        data.phoneNumber,
        data.email ?? session?.user?.email,
      ),
    );
  }, [data, open, preferenceItems, session?.user?.email]);

  const initialState = React.useMemo<PreferenceFormState>(
    () =>
      buildStateFromData(
        preferenceItems,
        data?.languageCode ?? 'en',
        data?.phoneNumber,
        data?.email ?? session?.user?.email,
      ),
    [
      data?.email,
      data?.languageCode,
      data?.phoneNumber,
      preferenceItems,
      session?.user?.email,
    ],
  );

  const isDirty = normalizeState(state) !== normalizeState(initialState);
  const hasEmailChannelSelected = Object.values(state.items).some((value) =>
    value.includes(NotificationDeliveryMechanism.EMAIL),
  );
  const hasSmsChannelSelected = Object.values(state.items).some((value) =>
    value.includes(NotificationDeliveryMechanism.SMS),
  );

  const languageOptions = React.useMemo<LanguageOption[]>(() => {
    return (
      languages?.items.map((language) => ({
        value: language.isoCode,
        label: getLanguageLabel(language.name, language.isoCode, i18n.language),
      })) ?? []
    );
  }, [i18n.language, languages?.items]);

  const handleChannelChange = React.useCallback(
    (eventTypeKey: string, value: NotificationDeliveryMechanism[] | null) => {
      setState((current) => ({
        ...current,
        items: {
          ...current.items,
          [eventTypeKey]: normalizeDeliveryMechanisms(value ?? []),
        },
      }));
    },
    [],
  );

  const handleSave = React.useCallback(async () => {
    if (!state.languageCode) {
      toast.error(t('Language is required'));
      return;
    }

    if (hasEmailChannelSelected && !state.email.trim()) {
      toast.error(t('Email notifications require an email address'));
      return;
    }
    if (hasSmsChannelSelected && !state.phoneNumber.trim()) {
      toast.error(t('SMS notifications require a mobile phone number'));
      return;
    }

    const items: ISaveMyNotificationPreferenceItem[] = preferenceItems.map(
      (item) => ({
        eventTypeKey: item.eventTypeKey,
        deliveryMechanisms: normalizeDeliveryMechanisms(
          state.items[item.eventTypeKey] ?? [],
        ),
      }),
    );

    try {
      await savePreferences({
        email: state.email.trim().toLowerCase(),
        languageCode: state.languageCode,
        phoneNumber: state.phoneNumber.trim(),
        items,
      });
      toast.success(t('Save changes'));
      await refetch();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('Failed to save notification settings');
      toast.error(message || t('Failed to save notification settings'));
    }
  }, [
    preferenceItems,
    hasEmailChannelSelected,
    hasSmsChannelSelected,
    onClose,
    refetch,
    savePreferences,
    state.email,
    state.items,
    state.languageCode,
    state.phoneNumber,
    t,
  ]);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={isSaving ? undefined : onClose}
      open={open}
    >
      <DialogTitle>{t('Notification settings')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('Choose how you want to receive notifications')}
            </Typography>
          </Box>

          {error ? (
            <Alert severity="error">
              {t('Failed to load notification settings')}
            </Alert>
          ) : null}

          <TextField
            select
            fullWidth
            label={t('Language')}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                languageCode: event.target.value,
              }))
            }
            value={state.languageCode}
          >
            {languageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label={t('Notification email')}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder={t('e.g. you@example.com')}
            value={state.email}
          />

          <TextField
            fullWidth
            label={t('Mobile phone number')}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                phoneNumber: event.target.value,
              }))
            }
            placeholder={t('e.g. +15551234567')}
            value={state.phoneNumber}
          />

          {isLoading ? (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 240,
              }}
            >
              <CircularProgress />
            </Box>
          ) : null}

          {!isLoading && preferenceItems.length === 0 ? (
            <Alert severity="info">
              {t('No notification preferences available')}
            </Alert>
          ) : null}

          {!isLoading &&
            preferenceItems.map((item, index) => (
              <Paper
                key={item.eventTypeKey}
                sx={{
                  p: 2,
                }}
                variant="outlined"
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1">
                      {t(item.eventTypeLabel)}
                    </Typography>
                    {item.eventTypeDescription ? (
                      <Typography color="text.secondary" variant="body2">
                        {t(item.eventTypeDescription)}
                      </Typography>
                    ) : null}
                  </Box>

                  <ToggleButtonGroup
                    color="primary"
                    fullWidth
                    onChange={(_, value) =>
                      handleChannelChange(item.eventTypeKey, value)
                    }
                    size="small"
                    value={state.items[item.eventTypeKey] ?? []}
                  >
                    {enabledChannelOptions.map((option) => (
                      <ToggleButton key={option.labelKey} value={option.value}>
                        {t(option.labelKey)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>

                {index < preferenceItems.length - 1 ? (
                  <Divider sx={{ mt: 2 }} />
                ) : null}
              </Paper>
            ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSaving} onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          disabled={!isDirty || isLoading || isSaving}
          onClick={() => void handleSave()}
          variant="contained"
        >
          {t('Save changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
