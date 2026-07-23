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
import { Therapy, SessionFrequencyEntry } from '@gen/core/v1/therapy_pb';
import { Service } from '@gen/core/v1/service_pb';
import { Therapist } from '@gen/core/v1/therapist_pb';
import { Customer } from '@gen/core/v1/customer_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { TranslatedString } from '@gen/core/v1/translated_string_pb';
import { TherapyService } from '@gen/core/v1/therapy_connect';
import { TherapistService } from '@gen/core/v1/therapist_connect';
import { ServiceService } from '@gen/core/v1/service_connect';
import { CustomerService } from '@gen/core/v1/customer_connect';
import { SessionService } from '@gen/core/v1/session_connect';
import { RoomService } from '@gen/core/v1/room_connect';
import { configureStore } from '@reduxjs/toolkit';
import { FormsReducer, formsActions } from '~/_lib/forms/state/forms-slice';
import { formValidationMiddleware } from '~/_lib/forms/state/validation-middleware';
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
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/therapy') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
}));
const mockToast = { success: jest.fn(), error: jest.fn(), custom: jest.fn(), dismiss: jest.fn() };
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
  myTherapistId?: string;
  therapyGetData?: Partial<Therapy>;
  therapyCreateData?: Partial<Therapy>;
  serviceGetData?: Partial<Service>;
  therapistGetData?: Partial<Therapist>;
  customerGetData?: Partial<Customer>;
}

function createTestTransport(opts: TransportOpts = {}) {
  return createRouterTransport(({ service }) => {
    service(TherapyService, {
      get: () => new Therapy({
        id: 'th-edit-1',
        displayName: 'CBT Therapy',
        therapistId: 'therapist-1',
        sessionPrice: '200',
        sessionDuration: 50,
        ...opts.therapyGetData,
      }),
      create: () => new Therapy({
        id: 'th-created-1',
        displayName: 'Created Therapy',
        therapistId: 'therapist-1',
        serviceId: 'svc-1',
        customerIds: ['cust-1'],
        sessionPrice: '200',
        sessionDuration: 50,
        startDate: BigInt(new Date('2024-01-01').getTime()),
        ...opts.therapyCreateData,
      }),
      update: () => new Therapy(),
      list: () => ({ items: [], totalCount: 0 }),
      dryRunGenerateSessions: () => ({ sessions: [], clashes: [] }),
      generateSessions: () => ({ generatedCount: 0 }),
      getFutureGeneratedSessions: () => ({ sessions: [] }),
      deleteFutureGeneratedSessions: () => ({ deletedCount: 0 }),
      getLastSessionDate: () => ({ lastSessionDate: '' }),
    });
    service(TherapistService, {
      autocomplete: () => {
        if (opts.myTherapistId) {
          return new AutocompleteResponse({
            items: [{ ID: opts.myTherapistId, label: 'Adam H.' }],
          });
        }
        return new AutocompleteResponse({ items: [] });
      },
      get: () => new Therapist({
        id: 'therapist-1',
        userLabel: 'Adam Hanrahan',
        userAbbreviationLabel: 'AH',
        ...opts.therapistGetData,
      }),
    });
    service(ServiceService, {
      get: () => new Service({
        id: 'svc-1',
        name: new TranslatedString({ en: 'CBT', pl: 'TPC' }),
        defaultPrice: 250,
        displayAbbreviation: 'CBT',
        ...opts.serviceGetData,
      }),
    });
    service(CustomerService, {
      get: () => new Customer({
        id: 'cust-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        displayAbbreviation: 'JK',
        ...opts.customerGetData,
      }),
    });
    service(SessionService, {
      list: () => ({ items: [], totalCount: 0 }),
      delete: () => ({}),
    });
    service(RoomService, {
      autocomplete: () => new AutocompleteResponse({ items: [] }),
    });
  });
}

function createEditTestStore({ realWindows = false } = {}) {
  const windowsReducer = realWindows
    ? require('~/_lib/window/state/windows-slice').WindowsReducer
    : (state = { windows: {}, nextZIndex: 1400 }) => state;
  return configureStore({
    reducer: {
      forms: FormsReducer,
      grids: (state = { byName: {} }) => state,
      sideNav: () => ({}),
      windows: windowsReducer,
      optimisticRows: (state = { byGrid: {} }) => state,
      recentlyOpened: (state = { byGrid: {} }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(formValidationMiddleware.middleware),
  });
}

// ── Render helper ───────────────────────────────────────────────────────────

interface RenderOptions extends TransportOpts {
  onCancel?: () => void;
  afterSave?: (formData: Therapy) => void;
  id?: string;
  windowId?: string;
}

type AnyTestStore = TestStore | ReturnType<typeof createEditTestStore>;

function renderTherapyForm(store: AnyTestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport(opts);
  const TherapyForm = require('./therapy_form').TherapyForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <TherapyForm
              id={opts.id}
              afterSave={opts.afterSave}
              onCancel={opts.onCancel}
              windowId={opts.windowId}
            />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

function getSingleFormId(store: AnyTestStore): string {
  const formIds = Object.keys((store.getState() as any).forms.byId);
  expect(formIds).toHaveLength(1);
  return formIds[0];
}

function fillValidTherapyCreateValues(store: AnyTestStore) {
  const formId = getSingleFormId(store);
  act(() => {
    store.dispatch(formsActions.fieldChanged({ formId, name: 'therapistId', value: 'therapist-1' }));
    store.dispatch(formsActions.fieldChanged({ formId, name: 'serviceId', value: 'svc-1' }));
    store.dispatch(formsActions.fieldChanged({ formId, name: 'customerIds', value: ['cust-1'] }));
    store.dispatch(formsActions.fieldChanged({ formId, name: 'displayName', value: 'AH - CBT - JK' }));
    store.dispatch(formsActions.fieldChanged({ formId, name: 'sessionPrice', value: '200' }));
    store.dispatch(formsActions.fieldChanged({
      formId,
      name: 'sessionFrequency',
      value: [{ onDay: [1], every: 1, isOnline: true }],
    }));
  });
}

async function submitValidTherapyCreate(store: AnyTestStore) {
  await waitFor(() => {
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
  });
  fillValidTherapyCreateValues(store);
  await waitFor(() => {
    expect(screen.getByTestId('form-submit-btn')).toBeEnabled();
  });
  fireEvent.submit(screen.getByTestId('tabular-form-wrapper'));
}

function renderPromptToast() {
  const renderer = mockToast.custom.mock.calls.at(-1)?.[0] as (toast: {
    id: string;
  }) => React.ReactElement;
  expect(renderer).toEqual(expect.any(Function));
  return render(renderer({ id: 'toast-1' }));
}

function installWasmMock() {
  (globalThis as Record<string, unknown>).validateMessage = () => ({ ok: true, errors: [] });
}

function removeWasmMock() {
  delete (globalThis as Record<string, unknown>).validateMessage;
}

beforeEach(() => {
  installWasmMock();
  mockToast.success.mockReset();
  mockToast.error.mockReset();
  mockToast.custom.mockReset();
  mockToast.dismiss.mockReset();
});

afterEach(() => {
  removeWasmMock();
});

// ── Behavior tests ──────────────────────────────────────────────────────────

describe('TherapyForm — behavior', () => {
  it('renders form-entity attribute for therapy scoping', () => {
    renderTherapyForm(createTestStore());
    expect(document.querySelector('[data-form-entity="therapy"]')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('form-cancel-btn')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderTherapyForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('sets default sessionDuration to 50', () => {
    const store = createTestStore();
    renderTherapyForm(store);
    expect(getFormValues(store).sessionDuration).toBe(50);
  });

  it('sets default customerIds to empty array', () => {
    const store = createTestStore();
    renderTherapyForm(store);
    expect(getFormValues(store).customerIds).toEqual([]);
  });

  it('sets default startDate to current timestamp', () => {
    const store = createTestStore();
    const before = Date.now();
    renderTherapyForm(store);
    const after = Date.now();
    const startDate = Number(getFormValues(store).startDate);
    expect(startDate).toBeGreaterThanOrEqual(before);
    expect(startDate).toBeLessThanOrEqual(after);
  });
});

// ── Create flow ──────────────────────────────────────────────────────────────

describe('TherapyForm — create flow', () => {
  const createdTherapyGetData = {
    id: 'th-created-1',
    displayName: 'Created Therapy',
    therapistId: 'therapist-1',
    serviceId: 'svc-1',
    customerIds: ['cust-1'],
    sessionPrice: '200',
    sessionDuration: 50,
    startDate: BigInt(new Date('2024-01-01').getTime()),
  };

  it('dispatches rpg:window:saved after windowed create success', async () => {
    const afterSave = jest.fn();
    const store = createEditTestStore({ realWindows: true });
    const savedEvents: Array<any> = [];
    const handleSaved = (event: Event) => {
      savedEvents.push((event as CustomEvent).detail);
    };
    document.addEventListener('rpg:window:saved', handleSaved);

    renderTherapyForm(store, {
      afterSave,
      windowId: 'therapy-window-1',
      therapyGetData: createdTherapyGetData,
    });

    await submitValidTherapyCreate(store);

    await waitFor(() => {
      expect(savedEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            formName: 'TherapyForm',
            windowId: 'therapy-window-1',
            data: expect.objectContaining({ id: 'th-created-1' }),
          }),
        ])
      );
    });

    expect(afterSave).not.toHaveBeenCalled();

    document.removeEventListener('rpg:window:saved', handleSaved);
  });

  it('still calls afterSave for create submits outside a window', async () => {
    const afterSave = jest.fn();
    const store = createEditTestStore({ realWindows: true });

    renderTherapyForm(store, {
      afterSave,
      therapyCreateData: { ...createdTherapyGetData, id: 'th-created-plain-1' },
    });

    await submitValidTherapyCreate(store);

    await waitFor(() => {
      expect(afterSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'th-created-plain-1' }));
    });
  });
});

// ── Tabs ────────────────────────────────────────────────────────────────────

describe('TherapyForm — tabs', () => {
  it('renders Configuration and Schedule tabs in create mode', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('tab-configuration')).toBeInTheDocument();
    expect(screen.getByTestId('tab-schedule')).toBeInTheDocument();
  });

  it('does not render Sessions tab in create mode', () => {
    renderTherapyForm(createTestStore());
    expect(screen.queryByTestId('tab-sessions')).not.toBeInTheDocument();
  });

  it('renders Sessions tab in edit mode', async () => {
    renderTherapyForm(createEditTestStore(), { id: 'th-edit-1' });
    await waitFor(() => {
      expect(screen.getByTestId('tab-configuration')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tab-sessions')).toBeInTheDocument();
  });
});

// ── Footer visibility ───────────────────────────────────────────────────────

describe('TherapyForm — footer', () => {
  it('shows save/cancel on Configuration tab', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('form-cancel-btn')).toBeInTheDocument();
  });

  it('shows save/cancel on Schedule tab', () => {
    renderTherapyForm(createTestStore());
    fireEvent.click(screen.getByTestId('tab-schedule'));
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
  });

  it('hides footer on Sessions tab in edit mode', async () => {
    renderTherapyForm(createEditTestStore(), { id: 'th-edit-1' });
    await waitFor(() => {
      expect(screen.getByTestId('tab-sessions')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-sessions'));
    expect(screen.queryByTestId('form-submit-btn')).not.toBeInTheDocument();
  });
});

// ── Select Myself therapist ─────────────────────────────────────────────────

describe('TherapyForm — Select Myself therapist', () => {
  it('renders select-myself button when therapist data is available', async () => {
    renderTherapyForm(createTestStore(), { myTherapistId: 'th-admin' });
    await waitFor(() => {
      expect(screen.getByTestId('select-myself-therapist-btn')).toBeInTheDocument();
    });
  });

  it('clicking select-myself sets therapistId in form state', async () => {
    const store = createTestStore();
    renderTherapyForm(store, { myTherapistId: 'th-admin' });
    await waitFor(() => {
      expect(screen.getByTestId('select-myself-therapist-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('select-myself-therapist-btn'));
    expect(getFormValues(store).therapistId).toBe('th-admin');
  });

  it('does not render select-myself button when no therapist data', () => {
    renderTherapyForm(createTestStore());
    expect(screen.queryByTestId('select-myself-therapist-btn')).not.toBeInTheDocument();
  });
});

// ── Dependent field: serviceId → sessionPrice ───────────────────────────────

describe('TherapyForm — useDependentField', () => {
  it('populates sessionPrice from service defaultPrice in edit mode', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, {
      id: 'th-edit-1',
      therapyGetData: { serviceId: 'svc-1', sessionPrice: '' },
      serviceGetData: { defaultPrice: 300 },
    });
    await waitFor(() => {
      expect(getFormValues(store).sessionPrice).toBe('300');
    });
  });

  it('does not overwrite sessionPrice when service has no defaultPrice', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, {
      id: 'th-edit-1',
      therapyGetData: { serviceId: 'svc-1', sessionPrice: '150' },
      serviceGetData: { defaultPrice: undefined },
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-configuration')).toBeInTheDocument();
    });
    expect(getFormValues(store).sessionPrice).toBe('150');
  });
});

// ── Suggest display name ────────────────────────────────────────────────────

describe('TherapyForm — suggest display name', () => {
  it('generate button is disabled when fields are empty', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('suggest-display-name-btn')).toBeDisabled();
  });

  it('generates display name in edit mode when all fields are present', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, {
      id: 'th-edit-1',
      therapyGetData: {
        therapistId: 'therapist-1',
        serviceId: 'svc-1',
        customerIds: ['cust-1'],
        displayName: '',
      },
      therapistGetData: { userAbbreviationLabel: 'AH' },
      serviceGetData: { displayAbbreviation: 'CBT' },
      customerGetData: { displayAbbreviation: 'JK' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('suggest-display-name-btn')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('suggest-display-name-btn'));

    await waitFor(() => {
      expect(getFormValues(store).displayName).toBe('AH - CBT - JK');
    });
  });

  it('generates display name in create mode when fields are filled', async () => {
    const store = createTestStore();
    renderTherapyForm(store, {
      therapistGetData: { userAbbreviationLabel: 'JN' },
      serviceGetData: { displayAbbreviation: 'Sys' },
      customerGetData: { displayAbbreviation: 'MD' },
    });

    const formId = getSingleFormId(store);
    act(() => {
      store.dispatch(formsActions.fieldChanged({ formId, name: 'therapistId', value: 'therapist-1' }));
      store.dispatch(formsActions.fieldChanged({ formId, name: 'serviceId', value: 'svc-1' }));
      store.dispatch(formsActions.fieldChanged({ formId, name: 'customerIds', value: ['cust-1'] }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('suggest-display-name-btn')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('suggest-display-name-btn'));

    await waitFor(() => {
      const displayName = getFormValues(store).displayName as string;
      const parts = displayName.split(' - ');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('JN');
      expect(parts[1]).toBe('Sys');
      expect(parts[2]).toBe('MD');
    });
  });

  it('falls back to initials when abbreviations are missing', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, {
      id: 'th-edit-1',
      therapyGetData: {
        therapistId: 'therapist-1',
        serviceId: 'svc-1',
        customerIds: ['cust-1'],
        displayName: '',
      },
      therapistGetData: {
        userAbbreviationLabel: '',
        userLabel: 'Adam Hanrahan',
      },
      serviceGetData: {
        displayAbbreviation: '',
        name: new TranslatedString({ en: 'Cognitive Behavioral', pl: 'TPC' }),
      },
      customerGetData: {
        displayAbbreviation: '',
        firstName: 'Jan',
        lastName: 'Kowalski',
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('suggest-display-name-btn')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('suggest-display-name-btn'));

    await waitFor(() => {
      const displayName = getFormValues(store).displayName as string;
      expect(displayName).toBeDefined();
      const parts = displayName.split(' - ');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('AH');
      expect(parts[1]).toBe('COG');
      expect(parts[2]).toBe('KJ');
    });
  });
});

// ── Schedule tab — edit mode controls ──────────────────────────────

describe('TherapyForm — Schedule tab (edit mode)', () => {
  async function goToFrequencyTab(store: ReturnType<typeof createEditTestStore>, opts: RenderOptions = {}) {
    renderTherapyForm(store, { id: 'th-edit-1', ...opts });
    await waitFor(() => {
      expect(screen.getByTestId('tab-schedule')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-schedule'));
  }

  it('renders Generate Sessions button in footer on frequency tab', async () => {
    const store = createEditTestStore();
    await goToFrequencyTab(store);
    expect(screen.getByTestId('generate-sessions-btn')).toBeInTheDocument();
  });

  it('does not render edit-mode controls in create mode', () => {
    renderTherapyForm(createTestStore());
    fireEvent.click(screen.getByTestId('tab-schedule'));
    expect(screen.queryByTestId('generate-sessions-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unlock-frequency-btn')).not.toBeInTheDocument();
  });

  it('shows Unlock Schedule button in footer when within generated window', async () => {
    const now = Date.now();
    const store = createEditTestStore();
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionsGeneratedAt: BigInt(now - 86400000),
        sessionsGeneratedTill: BigInt(now + 86400000),
      },
    });
    expect(screen.getByTestId('unlock-frequency-btn')).toBeInTheDocument();
  });

  it('hides Unlock Schedule when not within generated window', async () => {
    const now = Date.now();
    const store = createEditTestStore();
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionsGeneratedAt: BigInt(now - 86400000 * 30),
        sessionsGeneratedTill: BigInt(now - 86400000),
      },
    });
    expect(screen.queryByTestId('unlock-frequency-btn')).not.toBeInTheDocument();
  });

  it('hides Unlock Schedule when no generated timestamps', async () => {
    const store = createEditTestStore();
    await goToFrequencyTab(store);
    expect(screen.queryByTestId('unlock-frequency-btn')).not.toBeInTheDocument();
  });

  it('clicking Generate Sessions in footer opens a window', async () => {
    const store = createEditTestStore({ realWindows: true });
    // Seed the schedule via loaded data so the button is enabled and the form
    // stays pristine — a clean form generates directly without the save prompt.
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionFrequency: [new SessionFrequencyEntry({ onDay: [1], every: 1, isOnline: true })],
      },
    });
    fireEvent.click(screen.getByTestId('generate-sessions-btn'));
    const windows = (store.getState() as any).windows.windows;
    expect(Object.keys(windows).length).toBe(1);
  });

  it('clicking Generate Sessions with unsaved changes warns to save first and does not open a window', async () => {
    const store = createEditTestStore({ realWindows: true });
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionFrequency: [new SessionFrequencyEntry({ onDay: [1], every: 1, isOnline: true })],
      },
    });
    // Make an unsaved edit so the form is dirty.
    act(() => {
      store.dispatch(
        formsActions.fieldChanged({
          formId: getSingleFormId(store),
          name: 'sessionPrice',
          value: '999',
        })
      );
    });
    fireEvent.click(screen.getByTestId('generate-sessions-btn'));
    expect(screen.getByTestId('generate-save-first-confirm')).toBeInTheDocument();
    const windows = (store.getState() as any).windows.windows;
    expect(Object.keys(windows).length).toBe(0);
  });

  // Delete Future Sessions and Update Session Prices are in the FormActionsDropdown
  // (dialog header kebab menu), which requires dialog context to render.
  // Their presence is verified via the kebab menu in integration/E2E tests.

  it('clicking Unlock Schedule in footer opens a window when locked', async () => {
    const now = Date.now();
    const store = createEditTestStore({ realWindows: true });
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionsGeneratedAt: BigInt(now - 86400000),
        sessionsGeneratedTill: BigInt(now + 86400000),
      },
    });
    fireEvent.click(screen.getByTestId('unlock-frequency-btn'));
    const windows = (store.getState() as any).windows.windows;
    expect(Object.keys(windows).length).toBe(1);
  });

  it('rpg:window:saved event for unlock window sets frequency unlocked', async () => {
    const now = Date.now();
    const store = createEditTestStore();
    await goToFrequencyTab(store, {
      therapyGetData: {
        sessionsGeneratedAt: BigInt(now - 86400000),
        sessionsGeneratedTill: BigInt(now + 86400000),
      },
    });
    expect(screen.getByTestId('unlock-frequency-btn')).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(
        new CustomEvent('rpg:window:saved', {
          detail: {
            windowId: 'session-unlock-preview',
            formName: 'SessionGeneratePreview',
            title: 'Unlock',
          },
        })
      );
    });

    expect(screen.queryByTestId('unlock-frequency-btn')).not.toBeInTheDocument();
  });
});

// ── English translations ────────────────────────────────────────────────────

describe('TherapyForm — English translations', () => {
  beforeEach(() => setTestLanguage('en'));

  it('renders section labels in English', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Therapy')).toBeInTheDocument();
    // "Schedule" is also a tab label — ignore the tab button so this matches
    // the Configuration-tab section header only.
    expect(screen.getByText('Schedule', { ignore: 'button' })).toBeInTheDocument();
  });

  it('renders field labels in English', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Session Duration')).toBeInTheDocument();
    expect(screen.getByText('Session Price')).toBeInTheDocument();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
  });

  it('renders button labels in English', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('renders tab names in English', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('tab-configuration')).toHaveTextContent('Configuration');
    expect(screen.getByTestId('tab-schedule')).toHaveTextContent('Schedule');
  });

  it('renders unit suffixes in English', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('zł')).toBeInTheDocument();
  });

  it('renders Generate Sessions button label in English', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, { id: 'th-edit-1' });
    await waitFor(() => {
      expect(screen.getByTestId('tab-schedule')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-schedule'));
    expect(screen.getByText('Generate Sessions')).toBeInTheDocument();
  });
});

// ── Polish translations ─────────────────────────────────────────────────────

describe('TherapyForm — Polish translations', () => {
  beforeEach(() => setTestLanguage('pl'));
  afterEach(() => setTestLanguage('en'));

  it('renders section labels in Polish', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Uczestnicy')).toBeInTheDocument();
    expect(screen.getByText('Terapia')).toBeInTheDocument();
    expect(screen.getByText('Termin')).toBeInTheDocument();
  });

  it('renders field labels in Polish', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Czas trwania sesji')).toBeInTheDocument();
    expect(screen.getByText('Cena sesji')).toBeInTheDocument();
    expect(screen.getByText('Wyświetlana Nazwa')).toBeInTheDocument();
    expect(screen.getByText('Klienci')).toBeInTheDocument();
  });

  it('renders button labels in Polish', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
    expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
    expect(screen.getByText('Generuj')).toBeInTheDocument();
  });

  it('renders tab names in Polish', () => {
    renderTherapyForm(createTestStore());
    expect(screen.getByTestId('tab-configuration')).toHaveTextContent('Konfiguracja');
    expect(screen.getByTestId('tab-schedule')).toHaveTextContent('Harmonogram');
  });

  it('renders Generate Sessions button label in Polish', async () => {
    const store = createEditTestStore();
    renderTherapyForm(store, { id: 'th-edit-1' });
    await waitFor(() => {
      expect(screen.getByTestId('tab-schedule')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('tab-schedule'));
    expect(screen.getByText('Generuj sesje')).toBeInTheDocument();
  });
});
