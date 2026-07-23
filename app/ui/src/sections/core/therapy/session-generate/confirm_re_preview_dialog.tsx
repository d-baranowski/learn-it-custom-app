import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

interface ConfirmRePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmRePreviewDialog: React.FC<ConfirmRePreviewDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      data-testid="session-generate-re-preview-dialog"
    >
      <DialogTitle>{t('Re-generate preview?')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            'You have unsaved changes (edits or exclusions). Generating a new preview will discard them. Are you sure?'
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid="session-generate-re-preview-cancel-btn"
        >
          {t('Cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          autoFocus
          data-testid="session-generate-re-preview-confirm-btn"
        >
          {t('Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
