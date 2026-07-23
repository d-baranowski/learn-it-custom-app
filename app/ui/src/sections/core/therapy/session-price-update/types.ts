import type { SessionPriceUpdatePreview } from '@gen/core/v1/session_pb';

/** A SessionPriceUpdatePreview row enriched with grid-specific index fields. */
export type PriceUpdateRow = SessionPriceUpdatePreview & {
  _rowIdx: string;
  _idx: number;
};

export interface UpdateSessionPricesProps {
  /** Therapy IDs to update session prices for. */
  therapyIds?: string[];
  /** Default price to pre-fill (therapy sessionPrice when single therapy). */
  defaultPrice?: string;
  onCancel?: () => void;
  afterSave?: (formData?: any) => void;
}
