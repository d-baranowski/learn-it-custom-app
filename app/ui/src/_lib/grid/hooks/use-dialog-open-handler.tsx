import React from 'react';
import { kebabCase } from 'change-case';
import { useTranslation } from 'next-i18next';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';
import { useOpenForm } from '~/_lib/forms/use-open-form';
import { useGridDispatch } from '~/_lib/grid/state/hooks';
import { rowOpened } from '~/_lib/grid/state/recently-opened-slice';

/**
 * Open the configured form for a grid row, using the new forms framework.
 *
 * Flow on row click:
 *  1. `entityId` comes straight from the row's `id` (or null for create) —
 *     it's a typed top-level argument to `openForm`, not stuffed inside
 *     `formProps`. This is the structural fix for the bug class where the
 *     old `formPropsMapper` could overwrite `id` and load the wrong entity.
 *  2. `entityType` defaults to `kebabCase(gridName)` — `gridName` "Therapy"
 *     becomes entity "therapy", "TherapistService" becomes "therapist-service".
 *     A grid can override via `form.entityType` if the convention doesn't fit.
 *  3. `formPropsMapper` (if present) still contributes any non-id props
 *     (e.g., `defaultValues` for create-with-context flows).
 */
function useDialogOpenHandler<O extends Record<string, string>>() {
  const {
    gridName,
    form,
    dialogTitle,
    formPropsMapper,
    dialogFullScreen,
    dialogMaxWidth,
    dialogInitialHeight,
  } = useGridSettings<O>();

  const { openForm } = useOpenForm();
  const dispatch = useGridDispatch();
  const { t } = useTranslation('common');

  // Grid refresh after a windowed save is handled by the grid's own
  // `rpg:window:saved` subscriber (grid/page.tsx, grid/tab.tsx) — no afterSave
  // needed here (and functions in formProps are stripped before Redux anyway).
  const handleOpenDialog = React.useCallback(
    (data?: O, dialogTitlePrefix?: string) => {
      if (!form) {
        return;
      }

      const entityType = form.entityType ?? kebabCase(gridName);
      const entityId = data?.id ?? null;

      if (entityId) {
        dispatch(rowOpened({ gridName, rowId: entityId }));
      }

      const extraFormProps = formPropsMapper ? formPropsMapper(data) : {};
      // The mapper may legacy-style include `id`; the new openForm reads
      // entityId from the typed argument, so strip it from formProps to
      // avoid passing it twice.
      delete (extraFormProps as Record<string, unknown>).id;

      const action = data?.id ? 'Edit' : 'Create';
      const translatedTitle = dialogTitle ? t(dialogTitle) : t('Form');
      const fallbackTitle = `${t(action)} ${translatedTitle}`.trim();
      const compositeTitle = dialogTitle
        ? t(`${action} ${dialogTitle}`, { defaultValue: fallbackTitle })
        : fallbackTitle;
      const finalTitle = dialogTitlePrefix
        ? `${dialogTitlePrefix} ${translatedTitle}`.trim()
        : compositeTitle;

      openForm({
        formName: form.formName,
        entityType,
        entityId,
        title: finalTitle,
        formProps: { ...extraFormProps },
        isFullScreen: dialogFullScreen || false,
        maxWidth: dialogMaxWidth || 'md',
        initialHeight: dialogInitialHeight,
        draggable: true,
      });
    },
    [
      form,
      gridName,
      formPropsMapper,
      dialogTitle,
      dialogFullScreen,
      dialogMaxWidth,
      openForm,
      dispatch,
      t,
    ],
  );

  return handleOpenDialog;
}

export default useDialogOpenHandler;
