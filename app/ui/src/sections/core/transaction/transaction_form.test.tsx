import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Transaction } from '@gen/core/v1/transaction_pb';
import { TransactionService } from '@gen/core/v1/transaction_connect';
import { createTestStore, createRouterMock, mockNextI18next, type TestStore } from '~/__test_utils__';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/transaction') }));
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
    service(TransactionService, {
      get: () => new Transaction(),
      create: () => new Transaction(),
      update: () => new Transaction(),
      list: () => ({ items: [], totalCount: 0 }),
    });
  });
}

// ── Render helper ───────────────────────────────────────────────────────────

interface RenderOptions {
  onCancel?: () => void;
}

function renderTransactionForm(store: TestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport();
  const TransactionForm = require('./transaction_form').TransactionForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <TransactionForm onCancel={opts.onCancel} />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

beforeEach(() => {
  installWasmMock();
});

afterEach(() => {
  removeWasmMock();
});

// ── Behavior tests (mirrors Cypress TXN_E2E_08) ─────────────────────────────

describe('TransactionForm — behavior', () => {
  it('marks name, amount and incurredAt inputs as required', () => {
    renderTransactionForm(createTestStore());
    expect(screen.getByTestId('display-name')).toBeRequired();
    expect(screen.getByTestId('amount')).toBeRequired();
    expect(screen.getByTestId('incurred-at')).toBeRequired();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderTransactionForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
