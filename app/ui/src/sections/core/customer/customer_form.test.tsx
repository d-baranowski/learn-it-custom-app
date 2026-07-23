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
import { Customer } from '@gen/core/v1/customer_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { CustomerService } from '@gen/core/v1/customer_connect';
import { UserService } from '@gen/core/v1/user_connect';
import { LanguageService } from '@gen/core/v1/language_connect';
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
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/customer') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
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

// ── Test transport ──────────────────────────────────────────────────────────

interface TransportOpts {
  customerGetData?: Partial<Customer>;
}

function createTestTransport(opts: TransportOpts = {}) {
  return createRouterTransport(({ service }) => {
    service(CustomerService, {
      get: () => new Customer({
        id: 'cust-edit-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        displayAbbreviation: 'KJ',
        email: 'jan@example.com',
        phoneNumber: '+48123456789',
        ...opts.customerGetData,
      }),
      create: () => new Customer(),
      update: () => new Customer(),
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
  afterSave?: (formData: Customer) => void;
  id?: string;
}

type AnyTestStore = TestStore | ReturnType<typeof createEditTestStore>;

function renderCustomerForm(store: AnyTestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport(opts);
  const CustomerForm = require('./customer_form').CustomerForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <CustomerForm
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

describe('CustomerForm — behavior', () => {
  it('renders form-entity attribute for customer scoping', () => {
    renderCustomerForm(createTestStore());
    expect(document.querySelector('[data-form-entity="customer"]')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('form-cancel-btn')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderCustomerForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── Tabs ────────────────────────────────────────────────────────────────────

describe('CustomerForm — tabs', () => {
  it('renders Basic Information and Notes tabs', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByRole('tab', { name: /Basic Information/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notes/i })).toBeInTheDocument();
  });

  it('shows notes field when Notes tab is clicked', () => {
    renderCustomerForm(createTestStore());
    fireEvent.click(screen.getByRole('tab', { name: /Notes/i }));
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });
});

// ── Suggest Display Abbreviation ────────────────────────────────────────────

describe('CustomerForm — suggest display abbreviation', () => {
  it('renders suggest button', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByTestId('suggest-display-name-btn')).toBeInTheDocument();
  });

  it('generates initials from last name + first name', async () => {
    const store = createEditTestStore();
    renderCustomerForm(store, {
      id: 'cust-edit-1',
      customerGetData: {
        firstName: 'Jan',
        lastName: 'Kowalski',
        displayAbbreviation: '',
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('suggest-display-name-btn')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('suggest-display-name-btn'));

    await waitFor(() => {
      expect(getFormValues(store).displayAbbreviation).toBe('KJ');
    });
  });
});

// ── Edit mode ───────────────────────────────────────────────────────────────

describe('CustomerForm — edit mode', () => {
  it('loads customer data from get() in edit mode', async () => {
    const store = createEditTestStore();
    renderCustomerForm(store, {
      id: 'cust-edit-1',
      customerGetData: {
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@test.com',
        phoneNumber: '+48987654321',
      },
    });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Basic Information/i })).toBeInTheDocument();
    });
    expect(getFormValues(store).firstName).toBe('Anna');
    expect(getFormValues(store).lastName).toBe('Nowak');
    expect(getFormValues(store).email).toBe('anna@test.com');
    expect(getFormValues(store).phoneNumber).toBe('+48987654321');
  });
});

// ── English translations ────────────────────────────────────────────────────

describe('CustomerForm — English translations', () => {
  beforeEach(() => setTestLanguage('en'));

  it('renders field labels in English', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Abbreviation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
  });

  it('renders tab names in English', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByRole('tab', { name: /Basic Information/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notes/i })).toBeInTheDocument();
  });

  it('renders button labels in English', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

// ── Polish translations ─────────────────────────────────────────────────────

describe('CustomerForm — Polish translations', () => {
  beforeEach(() => setTestLanguage('pl'));
  afterEach(() => setTestLanguage('en'));

  it('renders field labels in Polish', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByLabelText(/Imię/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nazwisko/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Skrót wyświetlany/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Numer telefonu/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres/)).toBeInTheDocument();
  });

  it('renders tab names in Polish', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByRole('tab', { name: /Informacje podstawowe/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notatki/i })).toBeInTheDocument();
  });

  it('renders button labels in Polish', () => {
    renderCustomerForm(createTestStore());
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
    expect(screen.getByText('Zapisz')).toBeInTheDocument();
  });
});
