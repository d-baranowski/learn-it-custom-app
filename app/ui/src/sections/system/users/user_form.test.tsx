import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { User } from '@gen/core/v1/user_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { UserService } from '@gen/core/v1/user_connect';
import { configureStore } from '@reduxjs/toolkit';
import { FormsReducer } from '~/_lib/forms/state/forms-slice';
import {
  createTestStore,
  getFormValues,
  createRouterMock,
  setTestLanguage,
  mockNextI18next,
  type TestStore,
} from '~/__test_utils__';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/users') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}));

// ── Test transport ──────────────────────────────────────────────────────────

interface TransportOpts {
  userGetData?: Partial<User>;
}

function createTestTransport(opts: TransportOpts = {}) {
  return createRouterTransport(({ service }) => {
    service(UserService, {
      get: () => new User({
        id: 'user-edit-1',
        username: 'johndoe',
        displayName: 'John Doe',
        email: 'john@example.com',
        displayAbbreviation: 'JD',
        disabled: false,
        avatar: '',
        ...opts.userGetData,
      }),
      create: () => new User(),
      update: () => new User(),
      list: () => ({ items: [], totalCount: 0 }),
      autocomplete: () => new AutocompleteResponse({ items: [] }),
    });
  });
}

function createEditTestStore() {
  return configureStore({
    reducer: {
      forms: FormsReducer,
      grids: (state = { byName: {} }) => state,
      sideNav: () => ({}),
      windows: (state = { windows: {}, nextZIndex: 1400 }) => state,
      optimisticRows: (state = { byGrid: {} }) => state,
      recentlyOpened: (state = { byGrid: {} }) => state,
    },
  });
}

// ── Render helper ───────────────────────────────────────────────────────────

interface RenderOptions extends TransportOpts {
  onCancel?: () => void;
  afterSave?: (formData: User) => void;
  id?: string;
}

type AnyTestStore = TestStore | ReturnType<typeof createEditTestStore>;

function renderUserForm(store: AnyTestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport(opts);
  const UserForm = require('./user-form').UserForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <UserForm
              id={opts.id}
              afterSave={opts.afterSave}
              onCancel={opts.onCancel}
            />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

// ── Behavior tests ──────────────────────────────────────────────────────────

describe('UserForm — behavior', () => {
  it('renders form-entity attribute for user scoping', () => {
    renderUserForm(createTestStore());
    expect(document.querySelector('[data-form-entity="user"]')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderUserForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('form-cancel-btn')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderUserForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders all form fields', () => {
    renderUserForm(createTestStore());
    expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Abbreviation/)).toBeInTheDocument();
  });

  it('renders disabled toggle', () => {
    renderUserForm(createTestStore());
    expect(screen.getByLabelText(/Disabled/)).toBeInTheDocument();
  });

  it('renders avatar section', () => {
    renderUserForm(createTestStore());
    expect(screen.getByText('Avatar')).toBeInTheDocument();
  });
});

// ── Edit mode ───────────────────────────────────────────────────────────────

describe('UserForm — edit mode', () => {
  it('loads user data from get() in edit mode', async () => {
    const store = createEditTestStore();
    renderUserForm(store, {
      id: 'user-edit-1',
      userGetData: {
        username: 'janedoe',
        displayName: 'Jane Doe',
        email: 'jane@test.com',
        displayAbbreviation: 'JD',
        disabled: true,
      },
    });
    await waitFor(() => {
      expect(getFormValues(store).username).toBe('janedoe');
    });
    expect(getFormValues(store).displayName).toBe('Jane Doe');
    expect(getFormValues(store).email).toBe('jane@test.com');
    expect(getFormValues(store).displayAbbreviation).toBe('JD');
    expect(getFormValues(store).disabled).toBe(true);
  });
});

// ── English translations ────────────────────────────────────────────────────

describe('UserForm — English translations', () => {
  beforeEach(() => setTestLanguage('en'));

  it('renders field labels in English', () => {
    renderUserForm(createTestStore());
    expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Abbreviation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Disabled/)).toBeInTheDocument();
  });

  it('renders button labels in English', () => {
    renderUserForm(createTestStore());
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
  });

  it('renders avatar section label in English', () => {
    renderUserForm(createTestStore());
    expect(screen.getByText('Avatar')).toBeInTheDocument();
  });
});

// ── Polish translations ─────────────────────────────────────────────────────

describe('UserForm — Polish translations', () => {
  beforeEach(() => setTestLanguage('pl'));
  afterEach(() => setTestLanguage('en'));

  it('renders field labels in Polish', () => {
    renderUserForm(createTestStore());
    expect(screen.getByLabelText(/Wyświetlana Nazwa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nazwa uzytkownika/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Skrót/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nieaktywny/)).toBeInTheDocument();
  });

  it('renders button labels in Polish', () => {
    renderUserForm(createTestStore());
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
  });
});
