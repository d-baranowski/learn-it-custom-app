import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { createConnectQueryKey, useMutation } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';

import { get, update } from '@gen/core/v1/session-SessionService_connectquery';
import {
  SaveSessionRequest,
  Session,
  SessionCancellationActor,
} from '@gen/core/v1/session_pb';

type CancellationMode = 'cancel' | 'undo';

interface Props {
  open: boolean;
  mode: CancellationMode;
  sessionId?: string;
  onClose: () => void;
  onSuccess?: (session: Session) => void;
}

function toSaveSessionRequest(session: Session): SaveSessionRequest {
  return new SaveSessionRequest({
    id: session.id,
    therapyId: session.therapyId,
    therapistId: session.therapistId,
    roomId: session.roomId,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    timezone: session.timezone,
    price: session.price,
    paidAt: session.paidAt,
    paymentType: session.paymentType,
    cancelledAt: session.cancelledAt,
    cancellationReason: session.cancellationReason,
    cancellationActor: session.cancellationActor,
    customerIds: session.customerIds,
    therapySessionFrequencyRef: session.therapySessionFrequencyRef,
    isOnline: session.isOnline,
    displayName: session.displayName,
  });
}

export const SessionCancellationDialog: React.FC<Props> = ({
  open,
  mode,
  sessionId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { mutateAsync: getSession } = useMutation(get);
  const { mutateAsync: updateSession } = useMutation(update);

  const [reason, setReason] = React.useState('');
  const [reasonError, setReasonError] = React.useState(false);
  const [actor, setActor] = React.useState<SessionCancellationActor | ''>(
    SessionCancellationActor.THERAPIST
  );
  const [actorError, setActorError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setReason('');
    setReasonError(false);
    setActor(SessionCancellationActor.THERAPIST);
    setActorError(false);
    setSubmitting(false);
    setSubmitError(null);
  }, [open, mode]);

  const handleConfirm = async () => {
    if (!sessionId) return;

    const trimmedReason = reason.trim();
    if (mode === 'cancel') {
      const reasonMissing = trimmedReason.length === 0;
      const actorMissing = actor === '';
      setReasonError(reasonMissing);
      setActorError(actorMissing);
      if (reasonMissing || actorMissing) {
        const messages: string[] = [];
        if (reasonMissing)
          messages.push(String(t('Cancellation reason is required')));
        if (actorMissing)
          messages.push(String(t('Cancellation actor is required')));
        toast.error(messages.join('\n'));
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const current = await getSession({ ID: sessionId });
      const payload = toSaveSessionRequest(current);

      if (mode === 'cancel') {
        payload.cancelledAt = BigInt(Date.now());
        payload.cancellationReason = trimmedReason;
        payload.cancellationActor = actor as SessionCancellationActor;
      } else {
        payload.cancelledAt = undefined;
        payload.cancellationReason = undefined;
        payload.cancellationActor = undefined;
      }

      const updated = await updateSession(payload);

      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey(get, { ID: sessionId }),
      });
      await queryClient.invalidateQueries();

      onSuccess?.(updated);
      toast.success(
        mode === 'cancel'
          ? t('Session cancelled')
          : t('Session cancellation undone')
      );
      onClose();
    } catch (error) {
      console.error('Failed to update session cancellation state:', error);
      setSubmitError(String(t('Failed to update session cancellation')));
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'cancel' ? t('Cancel Session') : t('Undo Cancellation');

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {mode === 'cancel' ? (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label={t('Cancellation Reason')}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(false);
              }}
              error={reasonError}
              helperText={
                reasonError ? t('Cancellation reason is required') : undefined
              }
              multiline
              minRows={3}
              fullWidth
              required
              data-testid="session-cancellation-reason"
            />
            <TextField
              label={t('Cancelled By')}
              value={actor}
              onChange={(event) => {
                setActor(
                  Number(event.target.value) as SessionCancellationActor
                );
                if (actorError) setActorError(false);
              }}
              error={actorError}
              helperText={
                actorError ? t('Cancellation actor is required') : undefined
              }
              fullWidth
              required
              select
              data-testid="session-cancellation-actor"
            >
              <MenuItem value={SessionCancellationActor.CUSTOMER}>
                {t('Customer')}
              </MenuItem>
              <MenuItem value={SessionCancellationActor.THERAPIST}>
                {t('Therapist')}
              </MenuItem>
              <MenuItem value={SessionCancellationActor.OTHER}>
                {t('Other')}
              </MenuItem>
            </TextField>
          </Stack>
        ) : (
          <Typography sx={{ mt: 0.5 }}>
            {t(
              'This will clear cancellation date, reason, and cancelled by information.'
            )}
          </Typography>
        )}
        {submitError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={submitting || !sessionId}
          data-testid="session-cancellation-confirm"
        >
          {submitting ? t('Saving...') : t('Ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
