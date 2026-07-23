/**
 * success-toast-middleware — surface successful form saves as a "Saved" toast.
 *
 * Mirrors error-toast-middleware. Listens for `formSubmitSucceeded`, which is
 * dispatched by validation-middleware only after the mutation resolves —
 * so the toast is a true happy-path signal, never optimistic.
 *
 * Restores behaviour BaseForm had pre-UTR-000139/140 migration; the original
 * port only carried the error path over.
 */

import { createListenerMiddleware } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import i18n from 'i18next';
import type { RootState } from '~/_lib/grid/state/store';
import { formsActions } from './forms-slice';

export const formSuccessToastMiddleware = createListenerMiddleware();

const start = formSuccessToastMiddleware.startListening.withTypes<RootState, any>();

start({
  actionCreator: formsActions.formSubmitSucceeded,
  effect: () => {
    const message = i18n.isInitialized
      ? i18n.t('Saved', { ns: 'common', defaultValue: 'Saved' })
      : 'Saved';
    toast.success(message);
  },
});
