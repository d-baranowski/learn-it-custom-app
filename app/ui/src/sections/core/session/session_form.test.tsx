import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport, ConnectError, Code } from '@connectrpc/connect';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Session } from '@gen/core/v1/session_pb';
import { Therapy } from '@gen/core/v1/therapy_pb';
import { AutocompleteResponse } from '@gen/request/v1/base_pb';
import { SessionService } from '@gen/core/v1/session_connect';
import { TherapyService } from '@gen/core/v1/therapy_connect';
import { TherapistService } from '@gen/core/v1/therapist_connect';
import { RoomService } from '@gen/core/v1/room_connect';
import {
  createTestStore,
  getFormValues,
  createRouterMock,
  setTestLanguage,
  mockNextI18next,
  type TestStore,
} from '~/__test_utils__';

// ── Mocks — only framework SSR context, NOT network ─────────────────────────

jest.mock('next-i18next', () => mockNextI18next());
jest.mock('next/router', () => ({ useRouter: () => createRouterMock('/core/session') }));
jest.mock('~/auth/session-provider', () => ({
  useSession: () => ({ session: { userId: 'admin-user-id' }, logOut: jest.fn() }),
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

// ── Test transport ───────────────────────────────────────────────────────────

interface TransportOpts {
  myTherapistId?: string;
  therapyData?: Partial<Therapy>;
  findRoomResult?: 'found' | 'empty' | 'error';
  availableRoomId?: string;
  sessionGetData?: Partial<Session>;
  addPaymentLinkResult?: Partial<Session>;
}

function createTestTransport(opts: TransportOpts = {}) {
  return createRouterTransport(({ service }) => {
    service(SessionService, {
      get: () => new Session({
        id: 'ses-edit-1',
        price: '200',
        ...opts.sessionGetData,
      }),
      create: () => new Session(),
      update: () => new Session(),
      addPaymentLink: () => new Session({
        paymentLink: 'https://pay.test/link-1',
        paymentStatus: 'READY',
        ...opts.addPaymentLinkResult,
      }),
    });
    service(TherapyService, {
      get: () => new Therapy({
        therapistId: 'th-adam',
        sessionPrice: '200',
        displayName: 'CBT Session',
        ...opts.therapyData,
      }),
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
    });
    service(RoomService, {
      findAvailableRoom: () => {
        if (opts.findRoomResult === 'error') {
          throw new ConnectError('Service unavailable', Code.Unavailable);
        }
        if (opts.findRoomResult === 'empty') {
          return { roomId: '' };
        }
        return { roomId: opts.availableRoomId ?? 'rm-found' };
      },
    });
  });
}

// ── Render helper ────────────────────────────────────────────────────────────

interface RenderOptions extends TransportOpts {
  defaultValues?: Partial<Session>;
  onCancel?: () => void;
  afterSave?: () => void;
  id?: string;
}

function renderSessionForm(store: TestStore, opts: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const transport = createTestTransport(opts);
  const SessionForm = require('./session_form').SessionForm;
  return render(
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <SessionForm
              id={opts.id}
              defaultValues={opts.defaultValues}
              onCancel={opts.onCancel}
              afterSave={opts.afterSave}
            />
          </QueryClientProvider>
        </TransportProvider>
      </LocalizationProvider>
    </Provider>
  );
}

// ── Behavior tests ───────────────────────────────────────────────────────────

describe('SessionForm — behavior', () => {
  it('renders the form with session-form testid', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByTestId('session-form')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByTestId('form-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('form-cancel-btn')).toBeInTheDocument();
  });

  it('toggling online switch dispatches fieldChanged', () => {
    const store = createTestStore();
    renderSessionForm(store);
    fireEvent.click(screen.getByTestId('is-online'));
    expect(getFormValues(store).isOnline).toBe(true);
  });

  it('toggling online switch off sets isOnline to false', () => {
    const store = createTestStore();
    renderSessionForm(store, { defaultValues: { isOnline: true } as Partial<Session> });
    fireEvent.click(screen.getByTestId('is-online'));
    expect(getFormValues(store).isOnline).toBe(false);
  });

  it('autofill button sets end time to start + 50 minutes', () => {
    const store = createTestStore();
    renderSessionForm(store, { defaultValues: { startTime: '09:00' } as Partial<Session> });
    fireEvent.click(screen.getByTestId('session-end-datetime-autofill-btn'));
    expect(getFormValues(store).endTime).toBe('09:50');
  });

  it('autofill button is a no-op when startTime is not set', () => {
    const store = createTestStore();
    renderSessionForm(store);
    fireEvent.click(screen.getByTestId('session-end-datetime-autofill-btn'));
    expect(getFormValues(store).endTime).toBeUndefined();
  });

  it('renders duration when start and end times are set', () => {
    renderSessionForm(createTestStore(), {
      defaultValues: { startTime: '10:00', endTime: '10:50' } as Partial<Session>,
    });
    expect(screen.getByText(/50 min/)).toBeInTheDocument();
  });

  it('does not render duration when times are missing', () => {
    renderSessionForm(createTestStore());
    expect(screen.queryByText(/\d+ min/)).not.toBeInTheDocument();
  });

  it('find-available-room button is disabled without date/time', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByTestId('find-available-room-btn')).toBeDisabled();
  });

  it('find-available-room button enables when date and times are set', () => {
    renderSessionForm(createTestStore(), {
      defaultValues: {
        date: '2026-05-27', startTime: '10:00', endTime: '10:50', isOnline: false,
      } as Partial<Session>,
    });
    expect(screen.getByTestId('find-available-room-btn')).not.toBeDisabled();
  });

  it('find-available-room button is disabled when online', () => {
    renderSessionForm(createTestStore(), {
      defaultValues: {
        date: '2026-05-27', startTime: '10:00', endTime: '10:50', isOnline: true,
      } as Partial<Session>,
    });
    expect(screen.getByTestId('find-available-room-btn')).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderSessionForm(createTestStore(), { onCancel });
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders two tabs: Details and Payment', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByRole('tab', { name: /Details/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Payment/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Cancellation/i })).not.toBeInTheDocument();
  });

  it('renders form-entity attribute for session scoping', () => {
    renderSessionForm(createTestStore());
    expect(document.querySelector('[data-form-entity="session"]')).toBeInTheDocument();
  });
});

// ── Dependent field: therapy → therapist/price/displayName ───────────────────

describe('SessionForm — useDependentField', () => {
  it('populates price, therapistId, displayName when therapyId is set', async () => {
    const store = createTestStore();
    renderSessionForm(store, {
      defaultValues: { therapyId: 'therapy-1' } as Partial<Session>,
      therapyData: { therapistId: 'th-adam', sessionPrice: '200', displayName: 'CBT Session' },
    });

    await waitFor(() => {
      const values = getFormValues(store);
      expect(values.price).toBe('200');
    });

    const values = getFormValues(store);
    expect(values.therapistId).toBe('th-adam');
    expect(values.displayName).toBe('CBT Session');
  });
});

// ── Select Myself ────────────────────────────────────────────────────────────

describe('SessionForm — Select Myself therapist', () => {
  it('renders select-myself button when therapist data is available', async () => {
    renderSessionForm(createTestStore(), { myTherapistId: 'th-admin' });
    await waitFor(() => {
      expect(screen.getByTestId('select-myself-therapist-btn')).toBeInTheDocument();
    });
  });

  it('clicking select-myself sets therapistId in form state', async () => {
    const store = createTestStore();
    renderSessionForm(store, { myTherapistId: 'th-admin' });
    await waitFor(() => {
      expect(screen.getByTestId('select-myself-therapist-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('select-myself-therapist-btn'));
    expect(getFormValues(store).therapistId).toBe('th-admin');
  });

  it('does not render select-myself button when no therapist data', () => {
    renderSessionForm(createTestStore());
    expect(screen.queryByTestId('select-myself-therapist-btn')).not.toBeInTheDocument();
  });
});

// ── Find Available Room — all branches ───────────────────────────────────────

describe('SessionForm — Find Available Room', () => {
  const withDateTimes = {
    date: '2026-05-27', startTime: '10:00', endTime: '10:50', isOnline: false,
  } as Partial<Session>;

  it('sets roomId when room is found', async () => {
    const store = createTestStore();
    renderSessionForm(store, {
      defaultValues: withDateTimes,
      availableRoomId: 'rm-found',
    });
    fireEvent.click(screen.getByTestId('find-available-room-btn'));
    await waitFor(() => {
      expect(getFormValues(store).roomId).toBe('rm-found');
    });
  });

  it('shows toast when no room is available', async () => {
    renderSessionForm(createTestStore(), {
      defaultValues: withDateTimes,
      findRoomResult: 'empty',
    });
    fireEvent.click(screen.getByTestId('find-available-room-btn'));
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('No available rooms')
      );
    });
  });

  it('shows toast when findAvailableRoom throws', async () => {
    renderSessionForm(createTestStore(), {
      defaultValues: withDateTimes,
      findRoomResult: 'error',
    });
    fireEvent.click(screen.getByTestId('find-available-room-btn'));
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to find available room')
      );
    });
  });
});

// ── Payment Tab ──────────────────────────────────────────────────────────────

describe('SessionForm — Payment Tab (edit mode)', () => {
  async function renderEditForm(
    store: TestStore,
    overrides: Partial<RenderOptions> = {},
  ) {
    renderSessionForm(store, {
      id: 'ses-edit-1',
      sessionGetData: { id: 'ses-edit-1', price: '200' },
      ...overrides,
    });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Payment/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('tab', { name: /Payment/i }));
  }

  it('shows Create Payment Link button in edit mode without existing link', async () => {
    await renderEditForm(createTestStore());
    expect(screen.getByTestId('create-payment-link')).toBeInTheDocument();
  });

  it('does not show Create Payment Link in create mode', () => {
    renderSessionForm(createTestStore());
    fireEvent.click(screen.getByRole('tab', { name: /Payment/i }));
    expect(screen.queryByTestId('create-payment-link')).not.toBeInTheDocument();
  });

  it('clicking Create Payment Link dispatches payment fields', async () => {
    const store = createTestStore();
    await renderEditForm(store);
    fireEvent.click(screen.getByTestId('create-payment-link'));

    await waitFor(() => {
      const values = getFormValues(store);
      expect(values.paymentLink).toBe('https://pay.test/link-1');
      expect(values.paymentStatus).toBe('READY');
    });
  });

  it('shows payment link display when payment link exists', async () => {
    await renderEditForm(createTestStore(), {
      sessionGetData: {
        id: 'ses-edit-1',
        price: '200',
        paymentLink: 'https://pay.test/existing',
        paymentStatus: 'READY',
      },
    });
    expect(screen.queryByTestId('create-payment-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('refresh-payment-link-btn')).toBeInTheDocument();
  });

  it('shows Retry button when payment status is FAILED', async () => {
    await renderEditForm(createTestStore(), {
      sessionGetData: {
        id: 'ses-edit-1',
        price: '200',
        paymentStatus: 'FAILED',
      },
    });
    expect(screen.getByTestId('retry-payment-link')).toBeInTheDocument();
  });

  it('does not show Retry button when payment status is PENDING', async () => {
    await renderEditForm(createTestStore(), {
      sessionGetData: {
        id: 'ses-edit-1',
        price: '200',
        paymentStatus: 'PENDING',
      },
    });
    expect(screen.queryByTestId('retry-payment-link')).not.toBeInTheDocument();
  });
});

// ── Translation tests ────────────────────────────────────────────────────────

describe('SessionForm — English translations', () => {
  beforeEach(() => setTestLanguage('en'));

  it('renders online switch labels in English', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByText('Online Session')).toBeInTheDocument();
    expect(screen.getByText('Room will be disabled.')).toBeInTheDocument();
  });

  it('renders duration in English', () => {
    renderSessionForm(createTestStore(), {
      defaultValues: { startTime: '10:00', endTime: '11:30' } as Partial<Session>,
    });
    expect(screen.getByText('Duration: 90 min')).toBeInTheDocument();
  });

  it('renders button labels in English', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});

describe('SessionForm — Polish translations', () => {
  beforeEach(() => setTestLanguage('pl'));
  afterEach(() => setTestLanguage('en'));

  it('renders online switch labels in Polish', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByText('Sesja online')).toBeInTheDocument();
    expect(screen.getByText('Pokój zostanie wyłączony.')).toBeInTheDocument();
  });

  it('renders duration in Polish', () => {
    renderSessionForm(createTestStore(), {
      defaultValues: { startTime: '10:00', endTime: '11:30' } as Partial<Session>,
    });
    expect(screen.getByText('Czas trwania: 90 min')).toBeInTheDocument();
  });

  it('renders button labels in Polish', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
    expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
  });

  it('renders create form tab and field labels in Polish', () => {
    renderSessionForm(createTestStore());
    expect(screen.getByRole('tab', { name: 'Szczegóły' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Płatność' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Terapia/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Terapeuta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cena/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Klienci/)).toBeInTheDocument();
  });
});
