import React, {useState} from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import { Autocomplete, TextField } from '@mui/material';
import { autocomplete as therapistAutocomplete } from '@gen/core/v1/therapist-TherapistService_connectquery';
import { useAutocompleteOptions } from '~/components/form/elements/use-autocomplete-options';
import {useQuery} from '@connectrpc/connect-query';
import {list as listWorkingHours} from '@gen/core/v1/working_hours-WorkingHoursService_connectquery';
import {list as listAbsence} from '@gen/core/v1/absence-AbsenceService_connectquery';
import {SelectRequest, Where_Mode} from '@gen/request/v1/base_pb';
import {WhereBuilder} from '~/request';
import {useTranslation} from 'react-i18next';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WorkingHoursView: React.FC = () => {
  const {t} = useTranslation();
  const [therapistId, setTherapistId] = useState<string | undefined>(undefined);
  const { options: therapistOptions } = useAutocompleteOptions(therapistAutocomplete);
  const therapistSelected =
    (therapistId && therapistOptions.find((o) => o.id === therapistId)) || null;

  // Fetch working hours slots for the selected therapist
  const {data: workingHoursData} = useQuery(
    listWorkingHours,
    therapistId
      ? new SelectRequest({
          where: new WhereBuilder<'WorkingHours'>()
            .setMode(Where_Mode.AND)
            .eq('therapistId', therapistId)
            .build(),
        })
      : undefined,
    { enabled: !!therapistId }
  );

  // Fetch absences for the selected therapist (including org-wide)
  const {data: absenceData} = useQuery(
    listAbsence,
    therapistId
      ? new SelectRequest({
          where: new WhereBuilder<'Absence'>()
            .setMode(Where_Mode.OR)
            .eq('therapistId', therapistId)
            .isnull('therapistId')
            .build(),
        })
      : undefined,
    { enabled: !!therapistId }
  );

  // Group working hours by day of week
  const workingHoursByDay = React.useMemo(() => {
    const grouped: Record<number, Array<{from: string; till: string}>> = {};

    if (workingHoursData?.items) {
      for (const slot of workingHoursData.items) {
        if (!grouped[slot.dayOfWeek]) {
          grouped[slot.dayOfWeek] = [];
        }
        grouped[slot.dayOfWeek].push({
          from: slot.fromTime,
          till: slot.tillTime,
        });
      }
    }

    return grouped;
  }, [workingHoursData]);

  // Format absences for display
  const formattedAbsences = React.useMemo(() => {
    if (!absenceData?.items) return [];

    return absenceData.items.map(absence => ({
      from: new Date(Number(absence.fromTime)),
      till: new Date(Number(absence.tillTime)),
      reason: absence.reason || t('No reason provided'),
      isOrgWide: !absence.therapistId,
    }));
  }, [absenceData, t]);

  return (
    <Box sx={{p: 3}}>
      <Card>
        <CardHeader
          title={t('Therapist Weekly Working Hours')}
          subheader={t('View therapist working hours and absences')}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={therapistOptions}
                value={therapistSelected}
                onChange={(_e, next) => setTherapistId(next?.id)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                getOptionLabel={(opt) => opt.label}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('Select Therapist')}
                    required
                    inputProps={{
                      ...params.inputProps,
                      'data-testid': 'therapist-id',
                    }}
                  />
                )}
              />
            </Grid>

            {therapistId && (
              <>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    {t('Weekly Schedule')}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>{t('Day')}</strong></TableCell>
                          <TableCell><strong>{t('Working Hours')}</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dayNames.map((day, index) => {
                          const dayNum = index + 1;
                          const slots = workingHoursByDay[dayNum] || [];

                          return (
                            <TableRow key={day}>
                              <TableCell>{t(day)}</TableCell>
                              <TableCell>
                                {slots.length > 0 ? (
                                  <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    {slots.map((slot, i) => (
                                      <Chip
                                        key={i}
                                        label={`${slot.from} - ${slot.till}`}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    {t('Not Working')}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    {t('Upcoming Absences')}
                  </Typography>
                  {formattedAbsences.length > 0 ? (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                      {formattedAbsences.map((absence, index) => (
                        <Card key={index} variant="outlined">
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {absence.from.toLocaleDateString()} - {absence.till.toLocaleDateString()}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {absence.reason}
                            </Typography>
                            {absence.isOrgWide && (
                              <Chip
                                label={t('Organization-wide')}
                                color="warning"
                                size="small"
                              />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t('No upcoming absences')}
                    </Typography>
                  )}
                </Grid>
              </>
            )}

            {!therapistId && (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" align="center" sx={{py: 4}}>
                  {t('Please select a therapist to view their working hours')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
