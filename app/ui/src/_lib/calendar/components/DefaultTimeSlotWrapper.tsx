import React, { PropsWithChildren, useCallback, useContext } from "react";
import { Box, IconButton } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from "react-i18next";
import { ResourceDataContext } from "~/_lib/calendar/components/ResourceDataContext";
import moment from 'moment';

const SLOT_DURATION_MS = 60 * 60 * 1000;

export const DefaultTimeSlotWrapper: React.FC<PropsWithChildren<{ resource: string; value: Date }>> = (props) => {
  const { resourceDataMap, handleSlotCreate } = useContext(ResourceDataContext);
  const { t } = useTranslation();
  const resourceData = resourceDataMap.get(props.resource);

  let backgroundColor = 'transparent';

  if (resourceData && (resourceData.availabilitySlots || resourceData.absenceSlots)) {
    const slotTime = props.value;
    const slotTimestamp = slotTime.getTime();
    const dayOfWeek = slotTime.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const timeString = slotTime.toTimeString().substring(0, 5);

    if (resourceData.absenceSlots) {
      const isAbsent = resourceData.absenceSlots.some(absence => {
        return slotTimestamp >= absence.fromTime && slotTimestamp < absence.tillTime;
      });
      if (isAbsent) {
        backgroundColor = '#FBECEC';
      }
    }

    if (backgroundColor === 'transparent' && resourceData.availabilitySlots) {
      const isDuringWorkingHours = resourceData.availabilitySlots.some(availability => {
        if (availability.dayOfWeek !== adjustedDayOfWeek) return false;
        const fromTimeMoment = moment.parseZone(availability.fromTime, "HH:mm:ss");
        const tillTimeMoment = moment.parseZone(availability.tillTime, "HH:mm:ss");
        const valueTimeMoment = moment.parseZone(timeString, "HH:mm");
        return valueTimeMoment.isSameOrAfter(fromTimeMoment) && valueTimeMoment.isBefore(tillTimeMoment);
      });
      if (isDuringWorkingHours) {
        backgroundColor = '#EEF1E3';
      }
    }
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!handleSlotCreate) return;
    const start = new Date(props.value);
    const end = new Date(start.getTime() + SLOT_DURATION_MS);
    handleSlotCreate({
      start,
      end,
      resourceId: props.resource,
      slots: [start],
      action: 'click' as const,
    });
  }, [handleSlotCreate, props.value, props.resource]);

  return (
    <Box
      className="rpg-time-slot-wrapper"
      // backgroundColor stays inline so WH_E2E_06 (and any other test that
      // queries `[style*="background"]`) can detect working-hours slots.
      style={{ backgroundColor, flex: 1, position: 'relative' }}
      sx={{
        '&:hover .rpg-slot-create-btn': { opacity: 0.5 },
      }}
    >
      {props.children}
      {handleSlotCreate && props.resource && (
        <IconButton
          className="rpg-slot-create-btn"
          onClick={handleClick}
          data-testid="calendar-slot-create"
          aria-label={t('Create Session')}
          disableRipple
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 0,
            opacity: 0,
            borderRadius: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.9)',
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 1)' },
            transition: 'opacity 120ms ease',
            zIndex: 2,
          }}
        >
          <AddIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </Box>
  );
};
