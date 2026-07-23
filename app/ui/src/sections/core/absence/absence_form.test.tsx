import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Absence } from '@gen/core/v1/absence_pb';
import { Therapist } from '@gen/core/v1/therapist_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { AbsenceService } from '@gen/core/v1/absence_connect';
import { TherapistService } from '@gen/core/v1/therapist_connect';
import { formsActions } from '~/_lib/forms/state/forms-slice';
import { createTestStore, createRouterMock, mockNextI18next, type TestStore } from '~/__test_utils__';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/absence') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}));

function installWasmMock() {
  (globalThis as Record<string, unknown>).validateMessage = () => ({ ok: true, errors: [] });
}

function removeWasmMock() {
  delete (globalThis as Record<string, unknown>).validateMessage;
}

// ── Test transport ──────────────────────────────────────────────────────────

function createTestTransport() {
  return createRouterTransport(({ service }) => {
    service(AbsenceService, {
      get: () => new Absence(),
      create: () => new Absence(),
      update: () => new Absence(),
      list: () => ({ items: [], totalCount: 0 }),
    });
    service(TherapistService, {
      autocomplete: () =>
        new AutocompleteResponse({ items: [{ ID: 'therapist-1', label: 'Adam H.' }] }),
      get: () => new Therapist({ id: 'therapist-1', userLabel: 'Adam Hanrahan' }),
    });
  });
}

// ── Render helper ───────────────────────────────────────────────────────────

interface RenderOptions {
  onCancel?: () => void;
}

function renderAbsenceForm(store: TestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport();
  const AbsenceForm = require('./absence_form').AbsenceForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <AbsenceForm onCancel={opts.onCancel} />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

function getSingleFormId(store: TestStore): string {
  const formIds = Object.keys(store.getState().forms.byId);
  expect(formIds).toHaveLength(1);
  return formIds[0];
}

beforeEach(() => {
  installWasmMock();
});

afterEach(() => {
  removeWasmMock();
});

// ── Save gating (mirrors Cypress TA_VAL_E2E_01 / 02) ────────────────────────

describe('AbsenceForm — save gating', () => {
  it('renders therapist, from/till time and reason fields', () => {
    renderAbsenceForm(createTestStore());
    expect(screen.getByTestId('therapist-id')).toBeInTheDocument();
    expect(screen.getByTestId('from-time')).toBeInTheDocument();
    expect(screen.getByTestId('till-time')).toBeInTheDocument();
    expect(screen.getByTestId('reason')).toBeInTheDocument();
  });

  it('disables save when the form is empty', () => {
    renderAbsenceForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeDisabled();
  });

  it('enables save after filling therapist, from, till and reason', async () => {
    const store = createTestStore();
    renderAbsenceForm(store);
    expect(screen.getByTestId('form-submit-btn')).toBeDisabled();

    const from = new Date('2026-03-15T08:00:00').getTime();
    const till = new Date('2026-03-15T17:00:00').getTime();
    const formId = getSingleFormId(store);
    act(() => {
      store.dispatch(formsActions.fieldChanged({ formId, name: 'therapistId', value: 'therapist-1' }));
      store.dispatch(formsActions.fieldChanged({ formId, name: 'fromTime', value: String(from) }));
      store.dispatch(formsActions.fieldChanged({ formId, name: 'tillTime', value: String(till) }));
      store.dispatch(formsActions.fieldChanged({ formId, name: 'reason', value: 'Validation test' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-submit-btn')).toBeEnabled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderAbsenceForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
