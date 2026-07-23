import React from 'react';
import { useQuery } from '@connectrpc/connect-query';
import { useTranslation } from 'next-i18next';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import {
  get,
  update,
  getHistory,
} from '@gen/core/v1/system_settings-SystemSettingsService_connectquery';
import type { SystemSettings } from '@gen/core/v1/system_settings_pb';
import { SaveSystemSettingsRequest } from '@gen/core/v1/system_settings_pb';

import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { NumberFe } from '~/components/form/elements/number-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';

export const SystemSettingsView: React.FC = () => {
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = React.useState(false);
  const { data, isLoading, refetch } = useQuery(get, {});
  const { data: historyData, refetch: refetchHistory } = useQuery(getHistory, {
    limit: 10,
    offset: 0,
  });

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={t('System Settings')}
          subheader={data ? `${t('Version')} ${data.version}` : ''}
          action={
            !isEditing ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditing(true)}
              >
                {t('Edit')}
              </Button>
            ) : undefined
          }
        />
        <Divider />
        <CardContent>
          <Form<SaveSystemSettingsRequest, SystemSettings>
            entityType="system-settings"
            entityId={null}
            singleton
            protoConstructor={SaveSystemSettingsRequest}
            io={{ get, update }}
            onSubmitSuccess={() => {
              setIsEditing(false);
              refetch();
              refetchHistory();
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StringFe
                  name="systemTimezone"
                  label={t('System Timezone')}
                  required
                  fullWidth
                  disabled={!isEditing}
                  helperText={t('IANA timezone format (e.g. Europe/Warsaw)')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberFe
                  name="sessionDefaultDurationMinutes"
                  label={t('Default Session Duration (minutes)')}
                  required
                  min={1}
                  max={480}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
            {isEditing && (
              <CardActions sx={{ justifyContent: 'flex-end', mt: 2, px: 0 }}>
                <Stack direction="row" spacing={1}>
                  <CancelButton onClick={() => setIsEditing(false)}>
                    {t('Cancel')}
                  </CancelButton>
                  <SaveButton>{t('Save')}</SaveButton>
                </Stack>
              </CardActions>
            )}
          </Form>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader
          title={t('Version History')}
          subheader={t('Previous settings changes')}
        />
        <Divider />
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('Version')}</TableCell>
                <TableCell>{t('Timezone')}</TableCell>
                <TableCell>{t('Duration (min)')}</TableCell>
                <TableCell>{t('Changed By')}</TableCell>
                <TableCell>{t('Changed At')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData?.items?.map((item: SystemSettings) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Chip
                      label={`v${item.version}`}
                      size="small"
                      color={
                        item.version === data?.version ? 'primary' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{item.systemTimezone}</TableCell>
                  <TableCell>{item.sessionDefaultDurationMinutes}</TableCell>
                  <TableCell>{item.createdByLabel || '-'}</TableCell>
                  <TableCell>
                    {item.createdAt
                      ? format(
                          new Date(Number(item.createdAt)),
                          'dd/MM/yyyy HH:mm'
                        )
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {(!historyData?.items || historyData.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('No history available')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};
