import type { SessionOverride, SessionPreview } from '@gen/core/v1/therapy_pb';

/** Maximum number of months allowed for a generation range. */
export const MAX_MONTHS = 12;

/**
 * Per-session override state derived from the proto-generated SessionOverride.
 * Omits `index` (tracked externally as the map key) and proto internals.
 */
export type OverrideState = Pick<
  SessionOverride,
  'date' | 'startTime' | 'endTime' | 'roomId' | 'isOnline'
>;

/** A SessionPreview row enriched with grid-specific index fields. */
export type SessionRow = SessionPreview & {
  _rowIdx: string;
  _idx: number;
};

export type PreviewMode = 'generate' | 'unlock';

export interface SessionGeneratePreviewProps {
  id?: string;
  therapyId?: string;
  mode?: PreviewMode;
  onCancel?: () => void;
  afterSave?: (formData?: any) => void;
  therapistLabel?: string;
  serviceLabel?: string;
  frequencySummary?: string;
}
