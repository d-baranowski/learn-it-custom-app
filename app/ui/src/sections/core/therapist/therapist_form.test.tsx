import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Therapist } from '@gen/core/v1/therapist_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { TherapistService } from '@gen/core/v1/therapist_connect';
import { UserService } from '@gen/core/v1/user_connect';
import { LanguageService } from '@gen/core/v1/language_connect';
import { createTestStore, createRouterMock, mockNextI18next, type TestStore } from '~/__test_utils__';

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockCanUpdateProfitSharing = false;
const mockCan = jest.fn(async () => mockCanUpdateProfitSharing);

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/therapist') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'therapist-user-id' }, logOut: jest.fn() }),
}));
jest.mock('~/providers/user-permissions', () => ({
  useUserPermissions: () => ({
    can: mockCan,
    canAccess: () => true,
    canCreate: () => true,
    canUpdate: () => true,
    canSoftDelete: () => true,
    canDelete: () => true,
    canImport: () => true,
    loading: false,
    error: false,
    ready: true,
  }),
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}));
jest.mock('~/_lib/grid/tab', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'mock-grid-tab' }),
}));
jest.mock('~/components/form/elements/markdown-fe', () => ({
  __esModule: true,
  MarkdownFe: () => React.createElement('div', { 'data-testid': 'mock-markdown-fe' }),
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
    service(TherapistService, {
      get: () => new Therapist({ id: 'therapist-1', userLabel: 'Adam Hanrahan' }),
      create: () => new Therapist(),
      update: () => new Therapist(),
      list: () => ({ items: [], totalCount: 0 }),
      autocomplete: () => new AutocompleteResponse({ items: [] }),
    });
    service(UserService, {
      autocomplete: () => new AutocompleteResponse({ items: [] }),
    });
    service(LanguageService, {
      autocomplete: () => new AutocompleteResponse({ items: [] }),
    });
  });
}

// ── Render helper ───────────────────────────────────────────────────────────

function renderTherapistForm(store: TestStore) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport();
  const TherapistForm = require('./therapist_form').TherapistForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <TherapistForm />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

beforeEach(() => {
  installWasmMock();
  mockCanUpdateProfitSharing = false;
});

afterEach(() => {
  removeWasmMock();
});

// ── Profit sharing permission (mirrors Cypress THR_NONADMIN_E2E_03) ─────────

describe('TherapistForm — profit sharing permission', () => {
  it('renders the profit-sharing input read-only without UpdateProfitSharing permission', async () => {
    renderTherapistForm(createTestStore());

    const input = screen.getByTestId('percentage-profit-sharing');
    expect(input).toHaveAttribute('aria-readonly', 'true');
    expect(input).toBeDisabled();

    await waitFor(() => {
      expect(mockCan).toHaveBeenCalledWith('UpdateProfitSharing', 'Therapist');
    });
    expect(screen.getByTestId('percentage-profit-sharing')).toHaveAttribute('aria-readonly', 'true');
  });

  it('renders the profit-sharing input editable with UpdateProfitSharing permission', async () => {
    mockCanUpdateProfitSharing = true;
    renderTherapistForm(createTestStore());

    await waitFor(() => {
      expect(screen.getByTestId('percentage-profit-sharing')).toBeEnabled();
    });
    expect(screen.getByTestId('percentage-profit-sharing')).not.toHaveAttribute('aria-readonly');
  });
});
