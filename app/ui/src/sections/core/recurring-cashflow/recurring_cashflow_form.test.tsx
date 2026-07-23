import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { RecurringCashflow, SaveRecurringCashflowRequest } from '@gen/core/v1/recurring_cashflow_pb';
import { RecurringCashflowService } from '@gen/core/v1/recurring_cashflow_connect';
import { configureStore } from '@reduxjs/toolkit';
import { FormsReducer, formsActions } from '~/_lib/forms/state/forms-slice';
import { formValidationMiddleware } from '~/_lib/forms/state/validation-middleware';
import { createRouterMock, mockNextI18next } from '~/__test_utils__';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/recurring-cashflow') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}));

// ── WASM validation simulation (mirrors SaveRecurringCashflowRequest rules) ──

interface WasmResult {
  ok: boolean;
  errors: Array<{ fieldPath: string; message: string; constraintID: string; forKey: boolean }>;
}

function simulateWasmValidateMessage(jsonStr: string): WasmResult {
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  const errors: WasmResult['errors'] = [];

  for (const fieldPath of ['displayName', 'amount']) {
    const value = parsed[fieldPath];
    if (typeof value !== 'string' || value.length < 1) {
      errors.push({
        fieldPath,
        message: 'value length must be at least 1 characters [string.min_len]',
        constraintID: 'string.min_len',
        forKey: false,
      });
    }
  }

  if (!(Number(parsed.startDate ?? 0) > 0)) {
    errors.push({
      fieldPath: 'startDate',
      message: 'value must be greater than 0 [int64.gt]',
      constraintID: 'int64.gt',
      forKey: false,
    });
  }

  return { ok: errors.length === 0, errors };
}

function installWasmMock() {
  (globalThis as Record<string, unknown>).validateMessage = (json: string) =>
    simulateWasmValidateMessage(json);
}

function removeWasmMock() {
  delete (globalThis as Record<string, unknown>).validateMessage;
}

// ── Test transport ──────────────────────────────────────────────────────────

function createTestTransport(createCalls: SaveRecurringCashflowRequest[]) {
  return createRouterTransport(({ service }) => {
    service(RecurringCashflowService, {
      get: () => new RecurringCashflow(),
      create: (req) => {
        createCalls.push(req);
        return new RecurringCashflow({ id: 'rcf-created-1', displayName: req.displayName });
      },
      update: () => new RecurringCashflow(),
      list: () => ({ items: [], totalCount: 0 }),
    });
  });
}

function createValidatingTestStore() {
  return configureStore({
    reducer: {
      forms: FormsReducer,
      grids: (state = { byName: {} }) => state,
      sideNav: () => ({}),
      windows: (state = { windows: {}, nextZIndex: 1400 }) => state,
      optimisticRows: (state = { byGrid: {} }) => state,
      recentlyOpened: (state = { byGrid: {} }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(formValidationMiddleware.middleware),
  });
}

type ValidatingTestStore = ReturnType<typeof createValidatingTestStore>;

// ── Render helper ───────────────────────────────────────────────────────────

interface RenderOptions {
  onCancel?: () => void;
  createCalls?: SaveRecurringCashflowRequest[];
}

function renderRecurringCashflowForm(store: ValidatingTestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport(opts.createCalls ?? []);
  const RecurringCashflowForm = require('./recurring_cashflow_form').RecurringCashflowForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <RecurringCashflowForm onCancel={opts.onCancel} />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

function getSingleFormId(store: ValidatingTestStore): string {
  const formIds = Object.keys(store.getState().forms.byId);
  expect(formIds).toHaveLength(1);
  return formIds[0];
}

function submitForm() {
  fireEvent.submit(screen.getByTestId('tabular-form-wrapper'));
}

function getTabErrorBadge(tabTestId: string): Element | null {
  const tab = screen.getByTestId(tabTestId);
  return tab.closest('.MuiBadge-root')?.querySelector('.MuiBadge-badge') ?? null;
}

function expectFieldError(inputTestId: string) {
  const input = screen.getByTestId(inputTestId);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  const control = input.closest('.MuiFormControl-root');
  expect(control).not.toBeNull();
  expect(
    within(control as HTMLElement).getByText('Must have at least 1 character(s)')
  ).toBeInTheDocument();
}

beforeEach(() => {
  installWasmMock();
  mockToast.success.mockReset();
  mockToast.error.mockReset();
});

afterEach(() => {
  removeWasmMock();
});

// ── Validation (mirrors Cypress RCF_E2E_14 / 15 / 17 / 18) ──────────────────

describe('RecurringCashflowForm — validation', () => {
  it('shows a display-name error and Basic Information tab badge when name is empty but amount is filled', async () => {
    renderRecurringCashflowForm(createValidatingTestStore());

    fireEvent.change(screen.getByTestId('amount'), { target: { value: '500' } });
    submitForm();

    await waitFor(() => {
      expectFieldError('display-name');
    });
    expect(screen.getByTestId('amount')).not.toHaveAttribute('aria-invalid', 'true');

    const badge = getTabErrorBadge('tab-basic-information');
    expect(badge).not.toBeNull();
    expect(badge).not.toHaveClass('MuiBadge-invisible');
  });

  it('shows an amount error when amount is empty but name is filled', async () => {
    renderRecurringCashflowForm(createValidatingTestStore());

    fireEvent.change(screen.getByTestId('display-name'), { target: { value: 'Test Cashflow' } });
    submitForm();

    await waitFor(() => {
      expectFieldError('amount');
    });
    expect(screen.getByTestId('display-name')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts zero amount as valid', async () => {
    const store = createValidatingTestStore();
    const createCalls: SaveRecurringCashflowRequest[] = [];
    renderRecurringCashflowForm(store, { createCalls });

    fireEvent.change(screen.getByTestId('display-name'), { target: { value: 'Zero Amount Test' } });
    fireEvent.change(screen.getByTestId('amount'), { target: { value: '0' } });
    const formId = getSingleFormId(store);
    act(() => {
      store.dispatch(
        formsActions.fieldChanged({ formId, name: 'startDate', value: String(Date.now()) })
      );
    });
    submitForm();

    await waitFor(() => {
      expect(createCalls).toHaveLength(1);
    });
    expect(createCalls[0].amount).toBe('0');
    expect(screen.getByTestId('amount')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderRecurringCashflowForm(createValidatingTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
