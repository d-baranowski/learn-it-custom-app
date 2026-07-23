import React, { useState } from 'react';
import {
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  alpha,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import BareGridItem from '~/components/bare-grid-item';
import { useTranslation } from 'next-i18next';

interface PaymentLinkDisplayProps {
  label?: string;
  paymentLink?: string;
  paymentStatus?: string;
  xs?: number;
  bare?: boolean;
  hide?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  PENDING: 'warning',
  READY: 'info',
  PAID: 'success',
  FAILED: 'error',
};

function PaymentLinkDisplay({
  label,
  paymentLink,
  paymentStatus,
  xs = 12,
  bare = false,
  hide = false,
  onRefresh,
  refreshing = false,
}: PaymentLinkDisplayProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const resolvedLabel = label ?? t('Payment Link');

  const handleCopy = async () => {
    if (paymentLink) {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (hide) {
    return null;
  }

  return (
    <>
      <BareGridItem bare={bare} xs={xs}>
        <TextField
          label={resolvedLabel}
          value={paymentLink || ''}
          placeholder={
            paymentStatus === 'PENDING'
              ? t('Payment link is being generated')
              : ''
          }
          fullWidth
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                {onRefresh ? (
                  <Tooltip title={t('Refresh payment link')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={onRefresh}
                        aria-label={t('Refresh payment link')}
                        disabled={refreshing}
                        data-testid="refresh-payment-link-btn"
                      >
                        {refreshing ? (
                          <CircularProgress size={18} />
                        ) : (
                          <RefreshIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
                {paymentLink ? (
                  <>
                    <Tooltip title={copied ? t('Copied!') : t('Copy')}>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        aria-label={t('Copy payment link')}
                        data-testid="copy-payment-link-btn"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Open in new tab')}>
                      <IconButton
                        size="small"
                        onClick={handleOpenLink}
                        aria-label={t('Open payment link')}
                        data-testid="open-payment-link-btn"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : null}
              </InputAdornment>
            ),
          }}
          inputProps={{
            'data-testid': 'payment-link',
          }}
          sx={{
            '& .MuiInputBase-input': {
              color: 'text.primary',
            },
            '& .MuiInputLabel-root': {
              color: 'text.secondary',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: alpha('#000', 0.12),
              },
            },
          }}
        />
      </BareGridItem>
      {paymentStatus && (
        <BareGridItem bare={bare} xs={xs}>
          <Chip
            label={t(paymentStatus)}
            color={statusColor[paymentStatus] ?? 'default'}
            variant="outlined"
            size="medium"
            data-testid="payment-status"
            sx={{ fontWeight: 500, fontSize: '0.875rem' }}
          />
          {paymentStatus === 'FAILED' && (
            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'text.secondary' }}>
              {t('Payment link creation failed. Create it again to retry.')}
            </span>
          )}
        </BareGridItem>
      )}
    </>
  );
}

export default PaymentLinkDisplay;
