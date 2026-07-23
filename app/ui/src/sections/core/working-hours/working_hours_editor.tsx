import React from 'react';
import clsx from 'clsx';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  LinearProgress,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { createConnectQueryKey, useMutation, useQuery } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import { autocomplete as therapistAutocomplete } from '@gen/core/v1/therapist-TherapistService_connectquery';
import {
  list as listWorkingHours,
  replaceTherapistWeek,
} from '@gen/core/v1/working_hours-WorkingHoursService_connectquery';
import {
  ReplaceTherapistWeekRequest,
  WorkingHours,
  WorkingHoursWeekSlot,
} from '@gen/core/v1/working_hours_pb';
import { SelectRequest, Where_Mode } from '@gen/request/v1/base_pb';
import { useAutocompleteOptions } from '~/components/form/elements/use-autocomplete-options';
import { TherapistPicker } from '~/components/therapist-picker/therapist_picker';
import BreadcrumbsRenderer from '~/components/breadcrumb/breadcrumb-renderer';
import { WhereBuilder } from '~/request';

import styles from './working_hours_editor.module.css';
import {
  WORKING_HOURS_AXIS_START,
  WORKING_HOURS_DAYS,
  WORKING_HOURS_MIN_BLOCK_MINUTES,
  WORKING_HOURS_SNAP_MINUTES,
  WORKING_HOURS_TEMPLATES,
  WORKING_HOURS_TOTAL_MINUTES,
  WorkingHoursDraftBlock,
  WorkingHoursDraftWeek,
  applyTemplateDraft,
  buildBlockLabel,
  buildDraftWeek,
  canPlaceRange,
  clampMinutes,
  cloneDraftWeek,
  createDraftBlock,
  createEmptyDraftWeek,
  duplicateDraftBlock,
  findDraftBlock,
  formatDurationLabel,
  formatMinutes,
  getActiveDayCount,
  getDraftWeekSignature,
  getTotalMinutes,
  moveDraftBlock,
  parseTimeToMinutes,
  replaceDayBlocks,
  replaceDayWithSource,
  removeDraftBlock,
  resizeDraftBlock,
  resolveNearestAvailableStart,
  serializeDraftWeek,
  snapMinutes,
  splitDraftBlock,
  upsertDraftBlock,
} from './working_hours_editor_utils';

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm?: () => void;
};

type InteractionState =
  | {
      mode: 'draw';
      dayOfWeek: number;
      anchorMinutes: number;
      trackRect: DOMRect;
    }
  | {
      mode: 'move';
      blockId: string;
      dayOfWeek: number;
      pointerOffsetMinutes: number;
      trackRect: DOMRect;
    }
  | {
      mode: 'resize';
      blockId: string;
      dayOfWeek: number;
      edge: 'left' | 'right';
      trackRect: DOMRect;
    };

function buildTherapistWeekRequest(therapistId: string) {
  return new SelectRequest({
    where: new WhereBuilder<'WorkingHours'>()
      .setMode(Where_Mode.AND)
      .eq('therapistId', therapistId)
      .build(),
  });
}

function minuteToPercent(minutes: number) {
  return ((minutes - WORKING_HOURS_AXIS_START) / WORKING_HOURS_TOTAL_MINUTES) * 100;
}

function pointToMinutes(clientX: number, rect: DOMRect) {
  const ratio = clampMinutes((clientX - rect.left) / rect.width, 0, 1);
  return WORKING_HOURS_AXIS_START + ratio * WORKING_HOURS_TOTAL_MINUTES;
}

function formatHoursSummary(totalMinutes: number) {
  if (totalMinutes === 0) return '0h';
  return formatDurationLabel(totalMinutes);
}

function isWeekEmpty(week: WorkingHoursDraftWeek) {
  return WORKING_HOURS_DAYS.every((day) => (week[day.value] ?? []).length === 0);
}

function UndoToast({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={styles.undoToast} data-testid="working-hours-undo-toast">
      <span>{message}</span>
      <button
        type="button"
        className={styles.undoToastButton}
        onClick={onAction}
        data-testid="working-hours-undo-delete"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export const WorkingHoursEditor: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { options: therapistOptions } = useAutocompleteOptions(therapistAutocomplete);
  const { mutateAsync: fetchWorkingHours } = useMutation(listWorkingHours);
  const { mutateAsync: replaceWeek, isPending: isSaving } = useMutation(replaceTherapistWeek);

  const [therapistId, setTherapistId] = React.useState<string | undefined>(undefined);
  const [loadedTherapistId, setLoadedTherapistId] = React.useState<string | undefined>(undefined);
  const [draftWeek, setDraftWeek] = React.useState<WorkingHoursDraftWeek>(createEmptyDraftWeek());
  const [baselineWeek, setBaselineWeek] = React.useState<WorkingHoursDraftWeek>(createEmptyDraftWeek());
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [interaction, setInteraction] = React.useState<InteractionState | null>(null);
  const [ghostBlock, setGhostBlock] = React.useState<WorkingHoursDraftBlock | null>(null);
  const [editAnchorEl, setEditAnchorEl] = React.useState<HTMLElement | null>(null);
  const [editFromTime, setEditFromTime] = React.useState('');
  const [editTillTime, setEditTillTime] = React.useState('');
  const [editError, setEditError] = React.useState<string | null>(null);
  const [copyDayAnchorEl, setCopyDayAnchorEl] = React.useState<HTMLElement | null>(null);
  const [copyDaySource, setCopyDaySource] = React.useState<number | null>(null);
  const [copyDayTargets, setCopyDayTargets] = React.useState<number[]>([]);
  const [templateAnchorEl, setTemplateAnchorEl] = React.useState<HTMLElement | null>(null);
  const [copyFromDialogOpen, setCopyFromDialogOpen] = React.useState(false);
  const [copyFromTherapistId, setCopyFromTherapistId] = React.useState<string | undefined>();
  const [copyFromLoading, setCopyFromLoading] = React.useState(false);
  // Covers the whole save operation, not just the replaceWeek mutation: the
  // post-save invalidateQueries refetches re-fire the baseline effect, and the
  // form is not truly settled until they resolve. Without this the "Saving…"
  // state clears early and a follow-up edit races the refetch.
  const [savingWeek, setSavingWeek] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
  });

  const trackRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const draftWeekRef = React.useRef(draftWeek);
  React.useEffect(() => {
    draftWeekRef.current = draftWeek;
  }, [draftWeek]);

  const therapistRequest = React.useMemo(
    () => (therapistId ? buildTherapistWeekRequest(therapistId) : undefined),
    [therapistId]
  );

  const { data: workingHoursData, isLoading } = useQuery(
    listWorkingHours,
    therapistRequest,
    { enabled: !!therapistRequest }
  );

  const copyFromSelected = React.useMemo(
    () =>
      (copyFromTherapistId &&
        therapistOptions.find((option) => option.id === copyFromTherapistId)) ||
      undefined,
    [copyFromTherapistId, therapistOptions]
  );

  const workingHoursItems = React.useMemo(
    () => workingHoursData?.items ?? [],
    [workingHoursData]
  );
  const draftSignature = React.useMemo(() => getDraftWeekSignature(draftWeek), [draftWeek]);
  const baselineSignature = React.useMemo(
    () => getDraftWeekSignature(baselineWeek),
    [baselineWeek]
  );
  const isDirty = draftSignature !== baselineSignature;

  React.useEffect(() => {
    if (!therapistId) {
      setBaselineWeek(createEmptyDraftWeek());
      setDraftWeek(createEmptyDraftWeek());
      setLoadedTherapistId(undefined);
      setSelectedBlockId(null);
      return;
    }

    if (isLoading) return;

    if (therapistId !== loadedTherapistId || !isDirty) {
      const nextWeek = buildDraftWeek(workingHoursItems as WorkingHours[]);
      setBaselineWeek(nextWeek);
      setDraftWeek(cloneDraftWeek(nextWeek));
      setLoadedTherapistId(therapistId);
      setSelectedBlockId(null);
    }
  }, [therapistId, loadedTherapistId, workingHoursItems, isLoading, isDirty]);

  const loadedTherapistLabel = React.useMemo(
    () => therapistOptions.find((option) => option.id === loadedTherapistId)?.label ?? '',
    [therapistOptions, loadedTherapistId]
  );

  const totalMinutes = React.useMemo(() => getTotalMinutes(draftWeek), [draftWeek]);
  const activeDayCount = React.useMemo(() => getActiveDayCount(draftWeek), [draftWeek]);
  const selectedBlockInfo = React.useMemo(
    () => (selectedBlockId ? findDraftBlock(draftWeek, selectedBlockId) : null),
    [draftWeek, selectedBlockId]
  );

  const openConfirm = React.useCallback((state: Omit<ConfirmState, 'open'>) => {
    setConfirmState({ ...state, open: true });
  }, []);

  const closeConfirm = React.useCallback(() => {
    setConfirmState((current) => ({ ...current, open: false }));
  }, []);

  const handleSelectTherapist = React.useCallback(
    (nextTherapistId: string | undefined) => {
      if (nextTherapistId === therapistId) return;
      if (isDirty) {
        openConfirm({
          title: String(t('Switch therapist?')),
          message: String(t('You have unsaved changes. Switching therapists will discard the current draft.')),
          confirmLabel: String(t('Discard changes')),
          destructive: true,
          onConfirm: () => setTherapistId(nextTherapistId),
        });
        return;
      }
      setTherapistId(nextTherapistId);
    },
    [isDirty, openConfirm, t, therapistId]
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedBlockId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const handleRouteChangeStart = () => {
      if (!isDirty) return;
      const shouldLeave = window.confirm(
        String(t('You have unsaved changes. Leave this page?'))
      );
      if (shouldLeave) return;
      router.events.emit('routeChangeError');
      const abortError = new Error('Route change aborted by unsaved changes prompt');
      (abortError as Error & { cancelled?: boolean }).cancelled = true;
      throw abortError;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [isDirty, router.events, t]);

  const handlePointerMove = React.useCallback((event: PointerEvent) => {
    setGhostBlock((currentGhost) => {
      if (!interaction || interaction.mode !== 'draw') {
        return currentGhost;
      }
      const currentMinutes = snapMinutes(pointToMinutes(event.clientX, interaction.trackRect));
      return {
        id: 'ghost',
        dayOfWeek: interaction.dayOfWeek,
        startMinutes: Math.min(interaction.anchorMinutes, currentMinutes),
        endMinutes: Math.max(interaction.anchorMinutes, currentMinutes),
      };
    });

    if (!interaction || interaction.mode === 'draw') {
      return;
    }

    const pointMinutes = snapMinutes(pointToMinutes(event.clientX, interaction.trackRect));
    if (interaction.mode === 'move') {
      const desiredStart = pointMinutes - interaction.pointerOffsetMinutes;
      const nextDraft = moveDraftBlock(
        draftWeekRef.current,
        interaction.blockId,
        desiredStart,
        WORKING_HOURS_SNAP_MINUTES
      );
      if (nextDraft) {
        setDraftWeek(nextDraft);
      }
      return;
    }

    const nextDraft = resizeDraftBlock(
      draftWeekRef.current,
      interaction.blockId,
      interaction.edge,
      pointMinutes
    );
    if (nextDraft) {
      setDraftWeek(nextDraft);
    }
  }, [interaction]);

  const handlePointerUp = React.useCallback(() => {
    if (interaction?.mode === 'draw' && ghostBlock) {
      const duration = ghostBlock.endMinutes - ghostBlock.startMinutes;
      if (duration >= WORKING_HOURS_MIN_BLOCK_MINUTES) {
        const dayBlocks = draftWeekRef.current[ghostBlock.dayOfWeek] ?? [];
        let startMinutes = ghostBlock.startMinutes;
        let endMinutes = ghostBlock.endMinutes;
        if (!canPlaceRange(dayBlocks, startMinutes, endMinutes)) {
          const resolvedStart = resolveNearestAvailableStart(
            dayBlocks,
            startMinutes,
            duration,
            { step: WORKING_HOURS_SNAP_MINUTES }
          );
          if (resolvedStart == null) {
            toast.error(String(t('That block overlaps existing hours.')));
          } else {
            startMinutes = resolvedStart;
            endMinutes = resolvedStart + duration;
          }
        }

        if (canPlaceRange(dayBlocks, startMinutes, endMinutes)) {
          const nextWeek = replaceDayBlocks(draftWeekRef.current, ghostBlock.dayOfWeek, [
            ...dayBlocks,
            createDraftBlock(ghostBlock.dayOfWeek, startMinutes, endMinutes),
          ]);
          setDraftWeek(nextWeek);
        }
      }
    }

    setInteraction(null);
    setGhostBlock(null);
  }, [ghostBlock, interaction?.mode, t]);

  React.useEffect(() => {
    if (!interaction) return;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp, interaction]);

  const openEditPopover = React.useCallback((anchorEl: HTMLElement) => {
    if (!selectedBlockInfo) return;
    setEditAnchorEl(anchorEl);
    setEditFromTime(formatMinutes(selectedBlockInfo.block.startMinutes));
    setEditTillTime(formatMinutes(selectedBlockInfo.block.endMinutes));
    setEditError(null);
  }, [selectedBlockInfo]);

  const savePreciseEdit = React.useCallback(() => {
    if (!selectedBlockInfo) return;

    const nextStart = parseTimeToMinutes(editFromTime);
    const nextEnd = parseTimeToMinutes(editTillTime);
    if (nextStart == null || nextEnd == null) {
      setEditError(String(t('Enter valid times in HH:MM format.')));
      return;
    }
    if (nextEnd <= nextStart) {
      setEditError(String(t('Till time must be after from time.')));
      return;
    }
    const dayBlocks = draftWeek[selectedBlockInfo.dayOfWeek] ?? [];
    if (!canPlaceRange(dayBlocks, nextStart, nextEnd, selectedBlockInfo.block.id)) {
      setEditError(String(t('That time range overlaps another block or falls outside the editable window.')));
      return;
    }

    setDraftWeek(
      upsertDraftBlock(draftWeek, {
        ...selectedBlockInfo.block,
        startMinutes: nextStart,
        endMinutes: nextEnd,
      })
    );
    setEditAnchorEl(null);
  }, [draftWeek, editFromTime, editTillTime, selectedBlockInfo, t]);

  const handleCopyDayOpen = React.useCallback((dayOfWeek: number, anchorEl: HTMLElement) => {
    setCopyDaySource(dayOfWeek);
    setCopyDayTargets([]);
    setCopyDayAnchorEl(anchorEl);
  }, []);

  const applyCopyDay = React.useCallback(() => {
    if (!copyDaySource || copyDayTargets.length === 0) {
      setCopyDayAnchorEl(null);
      return;
    }
    setDraftWeek(replaceDayWithSource(draftWeek, copyDaySource, copyDayTargets));
    setCopyDayAnchorEl(null);
  }, [copyDaySource, copyDayTargets, draftWeek]);

  const applyTemplate = React.useCallback((templateId: string) => {
    const template = WORKING_HOURS_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;

    const doApply = () => {
      setDraftWeek(applyTemplateDraft(template));
      setSelectedBlockId(null);
    };

    if (isWeekEmpty(draftWeek)) {
      doApply();
    } else {
      openConfirm({
        title: String(t('Apply template?')),
        message: String(t('Applying a template replaces the entire current week.')),
        confirmLabel: String(t('Apply template')),
        destructive: true,
        onConfirm: doApply,
      });
    }
    setTemplateAnchorEl(null);
  }, [draftWeek, openConfirm, t]);

  const clearAll = React.useCallback(() => {
    openConfirm({
      title: String(t('Clear all working hours?')),
      message: String(t('This removes every block from the current weekly draft.')),
      confirmLabel: String(t('Clear all')),
      destructive: true,
      onConfirm: () => {
        setDraftWeek(createEmptyDraftWeek());
        setSelectedBlockId(null);
      },
    });
  }, [openConfirm, t]);

  const removeBlockWithUndo = React.useCallback(
    (block: WorkingHoursDraftBlock) => {
      setDraftWeek((current) => removeDraftBlock(current, block.id));
      setSelectedBlockId(null);
      toast(
        (toastState) => (
          <UndoToast
            message={String(t('Block removed.'))}
            actionLabel={String(t('Undo'))}
            onAction={() => {
              setDraftWeek((current) => upsertDraftBlock(current, block));
              toast.dismiss(toastState.id);
            }}
          />
        ),
        { duration: 4000 }
      );
    },
    [t]
  );

  const copyFromAnotherTherapist = React.useCallback(async () => {
    if (!copyFromTherapistId) {
      toast.error(String(t('Select a therapist first.')));
      return;
    }

    setCopyFromLoading(true);
    try {
      const result = await fetchWorkingHours(buildTherapistWeekRequest(copyFromTherapistId));
      setDraftWeek(buildDraftWeek(result.items as WorkingHours[]));
      setSelectedBlockId(null);
      setCopyFromDialogOpen(false);
      toast.success(String(t('Schedule copied into the current draft.')));
    } catch (error) {
      console.error(error);
      toast.error(String(t('Failed to copy the other therapist schedule.')));
    } finally {
      setCopyFromLoading(false);
    }
  }, [copyFromTherapistId, fetchWorkingHours, t]);

  const saveWeek = React.useCallback(async () => {
    if (!therapistId) {
      toast.error(String(t('Select a therapist before saving.')));
      return;
    }

    const request = new ReplaceTherapistWeekRequest({
      therapistId,
      slots: serializeDraftWeek(draftWeek).map(
        (slot) =>
          new WorkingHoursWeekSlot({
            dayOfWeek: slot.dayOfWeek,
            fromTime: slot.fromTime,
            tillTime: slot.tillTime,
          })
      ),
    });

    setSavingWeek(true);
    try {
      const saved = await replaceWeek(request);
      const nextWeek = buildDraftWeek(saved.items as WorkingHours[]);
      setBaselineWeek(nextWeek);
      setDraftWeek(cloneDraftWeek(nextWeek));
      setSelectedBlockId(null);
      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey(listWorkingHours, therapistRequest as SelectRequest),
      });
      await queryClient.invalidateQueries();
      toast.success(String(t('Working hours saved.')));
    } catch (error) {
      console.error(error);
      toast.error(String(t('Failed to save working hours.')));
    } finally {
      setSavingWeek(false);
    }
  }, [draftWeek, queryClient, replaceWeek, t, therapistId, therapistRequest]);

  const cancelChanges = React.useCallback(() => {
    setDraftWeek(cloneDraftWeek(baselineWeek));
    setSelectedBlockId(null);
    setGhostBlock(null);
    setInteraction(null);
  }, [baselineWeek]);

  const renderSelectedToolbar = (dayOfWeek: number) => {
    if (!selectedBlockInfo || selectedBlockInfo.dayOfWeek !== dayOfWeek) return null;
    const block = selectedBlockInfo.block;
    const left = minuteToPercent((block.startMinutes + block.endMinutes) / 2);
    return (
      <div
        className={styles.selectedToolbar}
        style={{ left: `${left}%` }}
        data-testid="working-hours-selected-toolbar"
      >
        <Tooltip title={t('Edit times')} arrow>
          <IconButton
            size="small"
            className={styles.toolbarIcon}
            data-testid="working-hours-toolbar-edit"
            aria-label={String(t('Edit times'))}
            onClick={(event) => openEditPopover(event.currentTarget)}
          >
            <EditOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Split block')} arrow>
          <IconButton
            size="small"
            className={styles.toolbarIcon}
            data-testid="working-hours-toolbar-split"
            aria-label={String(t('Split block'))}
            onClick={() => {
              const next = splitDraftBlock(draftWeek, block.id);
              if (!next) {
                toast.error(String(t('That block is too small to split with the configured gap.')));
                return;
              }
              setDraftWeek(next);
              setSelectedBlockId(null);
            }}
          >
            <CallSplitOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Duplicate')} arrow>
          <IconButton
            size="small"
            className={styles.toolbarIcon}
            data-testid="working-hours-toolbar-duplicate"
            aria-label={String(t('Duplicate'))}
            onClick={() => {
              const next = duplicateDraftBlock(draftWeek, block.id);
              if (!next) {
                toast.error(String(t('No free slot is available for duplication on that day.')));
                return;
              }
              setDraftWeek(next);
            }}
          >
            <ContentCopyOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <div className={styles.toolbarDivider} />
        <Tooltip title={t('Delete')} arrow>
          <IconButton
            size="small"
            className={clsx(styles.toolbarIcon, styles.toolbarDanger)}
            data-testid="working-hours-toolbar-delete"
            aria-label={String(t('Delete'))}
            onClick={() => removeBlockWithUndo(block)}
          >
            <DeleteOutlineIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>
    );
  };

  const ticks = React.useMemo(() => {
    const values: number[] = [];
    for (let hour = 6; hour <= 22; hour += 2) {
      values.push(hour * 60);
    }
    return values;
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbBar}>
        <BreadcrumbsRenderer />
      </div>
      <div className={styles.shell}>
        <div
          className={styles.card}
          data-testid="working-hours-editor"
          data-loaded-therapist={loadedTherapistLabel}
        >
          <div className={styles.header}>
            <div className={styles.selectorRow}>
              <TherapistPicker
                multiselect={false}
                autoSelectSelf
                selectedIds={therapistId ? [therapistId] : []}
                onChange={(ids) => handleSelectTherapist(ids[0])}
                dataTestId="working-hours-therapist"
              />
            </div>
          </div>

          {therapistId ? (
            <>
              <div className={styles.toolbar}>
                <div className={styles.toolbarActions}>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={clearAll}
                    data-testid="working-hours-clear-all"
                  >
                    <LayersClearOutlinedIcon fontSize="inherit" />
                    {t('Clear all')}
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => {
                      setCopyFromTherapistId(undefined);
                      setCopyFromDialogOpen(true);
                    }}
                    data-testid="working-hours-copy-from-therapist-btn"
                  >
                    <ContentCopyOutlinedIcon fontSize="inherit" />
                    {t('Copy from another therapist')}
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={(event) => setTemplateAnchorEl(event.currentTarget)}
                    data-testid="working-hours-apply-template-btn"
                  >
                    <AutoAwesomeOutlinedIcon fontSize="inherit" />
                    {t('Apply template')}
                  </button>
                  <button
                    type="button"
                    className={clsx(styles.toolButton, styles.toolbarPushRight)}
                    onClick={cancelChanges}
                    disabled={!isDirty || isSaving || savingWeek}
                    data-testid="working-hours-cancel"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={saveWeek}
                    disabled={!therapistId || !isDirty || isSaving || savingWeek}
                    data-testid="working-hours-save"
                  >
                    <SaveOutlinedIcon fontSize="inherit" />
                    {isSaving || savingWeek ? t('Saving...') : t('Save changes')}
                  </button>
                </div>
                <div className={styles.toolbarHint}>
                  <InfoOutlinedIcon fontSize="inherit" />
                  <span>{t('Drag in an empty row to add hours. Click a block to edit or remove it.')}</span>
                </div>
              </div>
              {isLoading && <LinearProgress />}
            </>
          ) : null}

          {!therapistId ? (
            <div className={styles.emptyState}>
              <Typography variant="body1">
                {t('Select a therapist to start editing the weekly schedule.')}
              </Typography>
            </div>
          ) : isLoading && loadedTherapistId !== therapistId ? (
            <div className={styles.loadingState}>
              <Typography variant="body1">{t('Loading working hours...')}</Typography>
            </div>
          ) : (
            <>
              <div className={styles.timeline}>
                <div className={styles.axisRow} aria-hidden="true">
                  <div />
                  <div className={styles.axis}>
                    {ticks.map((minute, index) => (
                      <div
                        key={minute}
                        className={clsx(styles.tick, index === ticks.length - 1 && styles.tickRight)}
                        style={{ left: `${minuteToPercent(minute)}%` }}
                      >
                        {formatMinutes(minute)}
                      </div>
                    ))}
                  </div>
                </div>

                {WORKING_HOURS_DAYS.map((day) => {
                  const blocks = draftWeek[day.value] ?? [];
                  const isOff = blocks.length === 0;
                  return (
                    <div className={styles.dayRow} key={day.value}>
                      <div className={clsx(styles.dayLabel, isOff && styles.dayLabelOff)}>
                        <span className={styles.dayName}>{t(day.labelKey)}</span>
                        <Tooltip title={t('Copy this day')} arrow>
                          <span>
                            <button
                              type="button"
                              className={clsx(styles.copyDayButton, isOff && styles.copyDayButtonDisabled)}
                              disabled={isOff}
                              onClick={(event) => handleCopyDayOpen(day.value, event.currentTarget)}
                              data-testid={`working-hours-copy-day-${day.value}`}
                              aria-label={String(t('Copy this day'))}
                            >
                              <ContentCopyOutlinedIcon fontSize="inherit" />
                            </button>
                          </span>
                        </Tooltip>
                      </div>

                      <div
                        ref={(node) => {
                          trackRefs.current[day.value] = node;
                        }}
                        className={clsx(styles.track, isOff && styles.trackOff)}
                        data-testid={`working-hours-track-${day.value}`}
                        onPointerDown={(event) => {
                          if (event.button !== 0 || event.target !== event.currentTarget) {
                            return;
                          }
                          const trackRect = event.currentTarget.getBoundingClientRect();
                          const anchorMinutes = snapMinutes(
                            pointToMinutes(event.clientX, trackRect)
                          );
                          setSelectedBlockId(null);
                          setInteraction({
                            mode: 'draw',
                            dayOfWeek: day.value,
                            anchorMinutes,
                            trackRect,
                          });
                          setGhostBlock({
                            id: 'ghost',
                            dayOfWeek: day.value,
                            startMinutes: anchorMinutes,
                            endMinutes: anchorMinutes,
                          });
                        }}
                      >
                        {renderSelectedToolbar(day.value)}

                        {blocks.map((block, index) => {
                          const isSelected = selectedBlockId === block.id;
                          const left = minuteToPercent(block.startMinutes);
                          const width = minuteToPercent(block.endMinutes) - left;
                          return (
                            <div
                              key={block.id}
                              className={clsx(styles.block, isSelected && styles.blockSelected)}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                const track = trackRefs.current[day.value];
                                if (!track) return;
                                const trackRect = track.getBoundingClientRect();
                                const pointerMinutes = pointToMinutes(event.clientX, trackRect);
                                setSelectedBlockId(block.id);
                                setInteraction({
                                  mode: 'move',
                                  blockId: block.id,
                                  dayOfWeek: day.value,
                                  pointerOffsetMinutes: pointerMinutes - block.startMinutes,
                                  trackRect,
                                });
                              }}
                              data-testid={`working-hours-block-${day.value}-${index}`}
                            >
                              <div
                                className={clsx(styles.resizeHandle, styles.resizeLeft)}
                                data-testid={`working-hours-resize-left-${day.value}-${index}`}
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                  const track = trackRefs.current[day.value];
                                  if (!track) return;
                                  setSelectedBlockId(block.id);
                                  setInteraction({
                                    mode: 'resize',
                                    blockId: block.id,
                                    dayOfWeek: day.value,
                                    edge: 'left',
                                    trackRect: track.getBoundingClientRect(),
                                  });
                                }}
                              />
                              <span className={styles.blockLabel}>{buildBlockLabel(block)}</span>
                              <div
                                className={clsx(styles.resizeHandle, styles.resizeRight)}
                                data-testid={`working-hours-resize-right-${day.value}-${index}`}
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                  const track = trackRefs.current[day.value];
                                  if (!track) return;
                                  setSelectedBlockId(block.id);
                                  setInteraction({
                                    mode: 'resize',
                                    blockId: block.id,
                                    dayOfWeek: day.value,
                                    edge: 'right',
                                    trackRect: track.getBoundingClientRect(),
                                  });
                                }}
                              />
                            </div>
                          );
                        })}

                        {ghostBlock?.dayOfWeek === day.value && ghostBlock.endMinutes > ghostBlock.startMinutes ? (
                          <div
                            className={clsx(styles.block, styles.blockGhost)}
                            style={{
                              left: `${minuteToPercent(ghostBlock.startMinutes)}%`,
                              width: `${minuteToPercent(ghostBlock.endMinutes) - minuteToPercent(ghostBlock.startMinutes)}%`,
                            }}
                            data-testid={`working-hours-ghost-${day.value}`}
                          >
                            <span className={styles.blockLabel}>{buildBlockLabel(ghostBlock)}</span>
                          </div>
                        ) : null}

                        {isOff ? (
                          <span className={styles.offHint}>
                            {day.value === 6
                              ? t('Off - click and drag to add hours')
                              : t('Off')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.totalBar} data-testid="working-hours-total-bar">
                <div>
                  {t('Total')}: <strong data-testid="working-hours-total-hours">{formatHoursSummary(totalMinutes)}</strong>{' '}
                  {t('across')} <strong data-testid="working-hours-total-days">{activeDayCount}</strong>{' '}
                  {t('days')}
                </div>
                <div className={styles.snapLabel}>{t('Snap')}: 30 {t('min')}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <Popover
        open={Boolean(editAnchorEl)}
        anchorEl={editAnchorEl}
        onClose={() => setEditAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2">{t('Edit times')}</Typography>
          <TextField
            label={t('From')}
            type="time"
            value={editFromTime}
            onChange={(event) => setEditFromTime(event.target.value)}
            inputProps={{ step: 300, 'data-testid': 'working-hours-precise-from' }}
          />
          <TextField
            label={t('Till')}
            type="time"
            value={editTillTime}
            onChange={(event) => setEditTillTime(event.target.value)}
            inputProps={{ step: 300, 'data-testid': 'working-hours-precise-till' }}
          />
          {editError ? <Alert severity="error">{editError}</Alert> : null}
          <Button variant="contained" onClick={savePreciseEdit} data-testid="working-hours-precise-save">
            {t('Apply')}
          </Button>
        </Stack>
      </Popover>

      <Popover
        open={Boolean(copyDayAnchorEl)}
        anchorEl={copyDayAnchorEl}
        onClose={() => setCopyDayAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2">{t('Copy day to')}</Typography>
          <FormGroup>
            {WORKING_HOURS_DAYS.filter((day) => day.value !== copyDaySource).map((day) => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox
                    inputProps={
                      { 'data-testid': `working-hours-copy-day-target-${day.value}` } as React.InputHTMLAttributes<HTMLInputElement>
                    }
                    checked={copyDayTargets.includes(day.value)}
                    onChange={(_event, checked) => {
                      setCopyDayTargets((current) =>
                        checked
                          ? [...current, day.value].sort((a, b) => a - b)
                          : current.filter((value) => value !== day.value)
                      );
                    }}
                  />
                }
                label={t(day.labelKey)}
              />
            ))}
          </FormGroup>
          <Button
            variant="contained"
            onClick={applyCopyDay}
            disabled={copyDayTargets.length === 0}
            data-testid="working-hours-copy-day-submit"
          >
            {t('Copy day')}
          </Button>
        </Stack>
      </Popover>

      <Popover
        open={Boolean(templateAnchorEl)}
        anchorEl={templateAnchorEl}
        onClose={() => setTemplateAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          root: {
            sx: {
              '& .MuiBackdrop-root': {
                backgroundColor: 'transparent',
                backdropFilter: 'none',
              },
            },
          },
          paper: { className: styles.templateSheet },
        }}
      >
        <div className={styles.templateHeader}>
          <div>
            <h2 className={styles.templateTitle}>{t('Choose template')}</h2>
            <p className={styles.templateSubtitle}>
              {t('Overwrites the current schedule. You can refine it afterwards.')}
            </p>
          </div>
          <IconButton
            size="small"
            className={styles.templateClose}
            onClick={() => setTemplateAnchorEl(null)}
            aria-label={String(t('Close'))}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className={styles.templateList}>
          {WORKING_HOURS_TEMPLATES.map((template) => {
            const activeDays = new Set(template.blocks.map((block) => block.dayOfWeek));
            const totalMinutes = template.blocks.reduce(
              (sum, block) => sum + (block.endMinutes - block.startMinutes),
              0
            );
            return (
              <button
                key={template.id}
                type="button"
                className={styles.templateRow}
                onClick={() => applyTemplate(template.id)}
                data-testid={`working-hours-template-${template.id}`}
              >
                <span className={styles.templateRowText}>
                  <span className={styles.templateName}>{t(template.labelKey)}</span>
                  <span className={styles.templateDesc}>
                    {t(template.descriptionKey)} · {formatHoursSummary(totalMinutes)}
                  </span>
                </span>
                <span className={styles.templateDays} aria-hidden="true">
                  {WORKING_HOURS_DAYS.map((day) => (
                    <span
                      key={day.value}
                      className={clsx(
                        styles.templateDayChip,
                        activeDays.has(day.value) ? styles.templateDayOn : styles.templateDayOff
                      )}
                    >
                      {String(t(day.labelKey)).charAt(0).toUpperCase()}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Popover>

      <Dialog
        open={copyFromDialogOpen}
        onClose={() => setCopyFromDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        data-testid="working-hours-copy-from-dialog"
      >
        <DialogTitle>{t('Copy from another therapist')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('This replaces the current draft with another therapist weekly schedule.')}
            </Typography>
            <Autocomplete
              options={therapistOptions.filter((option) => option.id !== therapistId)}
              value={copyFromSelected}
              onChange={(_event, next) => setCopyFromTherapistId(next?.id)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('Therapist')}
                  inputProps={{
                    ...params.inputProps,
                    'data-testid': 'working-hours-copy-from-therapist',
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCopyFromDialogOpen(false)}
            data-testid="working-hours-copy-from-cancel"
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={copyFromAnotherTherapist}
            disabled={copyFromLoading}
            data-testid="working-hours-copy-from-submit"
          >
            {copyFromLoading ? t('Loading...') : t('Replace week')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmState.open} onClose={closeConfirm} fullWidth maxWidth="xs">
        <DialogTitle>{confirmState.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmState.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} data-testid="working-hours-confirm-cancel">
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            color={confirmState.destructive ? 'error' : 'primary'}
            onClick={() => {
              const callback = confirmState.onConfirm;
              closeConfirm();
              callback?.();
            }}
            data-testid="working-hours-confirm-submit"
          >
            {confirmState.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
