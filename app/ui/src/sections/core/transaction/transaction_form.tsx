import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { create, get, list, update, delete$ as deleteTransaction } from '@gen/core/v1/transaction-TransactionService_connectquery';
import { Transaction, SaveTransactionRequest } from '@gen/core/v1/transaction_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { StringFe } from '~/components/form/elements/string-fe';
import { DateFe } from '~/components/form/elements/date-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';

interface Props {
  id?: string;
  afterSave?: (formData: Transaction) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const TransactionForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();

  return (
    <Form<SaveTransactionRequest, Transaction>
      entityType="transaction"
      entityId={id ?? null}
      protoConstructor={SaveTransactionRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as Transaction)}
    >
      <StringFe name="displayName" label={t('Name')} required fullWidth />
      <StringFe
        name="amount"
        label={t('Amount (negative for expense, positive for income)')}
        required
        fullWidth
      />
      <DateFe name="incurredAt" label={t('Incurred At')} required />
      <FormActionsDropdown
        permission={Permissions.Transaction}
        deleteDescriptor={deleteTransaction}
        entityId={id}
        onDeleteSuccess={onCancel}
      />

      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};
