/**
 * PaymentLinkForm — read-only viewer for a PaymentLink entity.
 *
 * The legacy version misused the form framework (`create: get as any`,
 * `hideActionsTabs={[0]}`) just to get a tab + read-only TextFields. The new
 * version drops the form abstraction entirely and renders a plain display
 * component fetching with useQuery. Same component name + registration so
 * the window manager opens it identically.
 */

import React from 'react';
import _ from 'lodash';
import { Box, Stack, TextField } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@connectrpc/connect-query';

import { PaymentLink } from '@gen/payment/v1/payment_link_pb';
import { get } from '@gen/payment/v1/payment_link-PaymentService_connectquery';
import PaymentLinkDisplay from '~/components/form/elements/payment-link-display';

interface Props {
  id?: string;
  afterSave?: (formData?: PaymentLink) => void;
  onCancel?: () => void;
}

const ReadOnlyField: React.FC<{
  label: string;
  value: string | undefined;
  multiline?: boolean;
  rows?: number;
}> = ({ label, value, multiline, rows }) => (
  <TextField
    label={label}
    value={value ?? ''}
    fullWidth
    multiline={multiline}
    rows={rows}
    InputProps={{ readOnly: true }}
  />
);

export const PaymentLinkForm: React.FC<Props> = ({ id }) => {
  const { t } = useTranslation('common');
  const { data } = useQuery(get, id ? { ID: id } : undefined, { enabled: !!id });

  return (
    <Box sx={{ pt: 2 }}>
      <Stack spacing={2}>
        <PaymentLinkDisplay
          paymentLink={data?.url}
          paymentStatus={data?.status}
          xs={12}
        />
        <Stack direction="row" spacing={2}>
          <ReadOnlyField label={t('Provider')} value={data?.provider} />
          <ReadOnlyField
            label={t('Provider Reference')}
            value={data?.providerReference}
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <ReadOnlyField label={t('Amount')} value={String(data?.amount ?? '')} />
          <ReadOnlyField label={t('Currency')} value={data?.currency} />
        </Stack>
        <ReadOnlyField
          label={t('Description')}
          value={data?.description}
          multiline
          rows={3}
        />
        <ReadOnlyField
          label={t('Error Message')}
          value={data?.errorMessage}
          multiline
          rows={3}
        />
      </Stack>
    </Box>
  );
};

export default PaymentLinkForm;
