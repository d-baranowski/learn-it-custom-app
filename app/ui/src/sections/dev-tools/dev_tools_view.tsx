import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const DevToolsView: React.FC = () => {
  const { t } = useTranslation('common');
  const [env, setEnv] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setEnv(data.env ?? null))
      .catch(() => setEnv(null));
  }, []);

  const isProd = env === 'prod';

  const handleReset = useCallback(async () => {
    setConfirmOpen(false);
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(
        '/api/bootstrap/bootstrap.v1.BootstrapService/ResetDatabase',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus('success');
      setMessage(data.message || 'Database reset and bootstrap completed.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  if (env === null) {
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Card>
        <CardHeader
          title={t('Dev Tools')}
          subheader={isProd ? t('Not available in production') : `${t('Environment')}: ${env}`}
        />
        <CardContent>
          {isProd && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('Database tools are disabled in production.')}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('Resets all database schemas, re-runs migrations, and re-populates with seed data. This typically takes 60-90 seconds.')}
          </Typography>

          <Button
            variant="contained"
            color="error"
            disabled={isProd || status === 'loading'}
            onClick={() => setConfirmOpen(true)}
            startIcon={status === 'loading' ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {status === 'loading' ? t('Resetting...') : t('Reset Database')}
          </Button>

          {status === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          {status === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('Reset Database')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('This will drop all data and re-seed the database. All current data will be lost. Are you sure?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('Cancel')}</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            {t('Reset')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
