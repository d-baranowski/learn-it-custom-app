import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransportProvider } from '@connectrpc/connect-query';
import { createRouterTransport } from '@connectrpc/connect';
import { Session } from '@gen/core/v1/session_pb';
import { SessionService } from '@gen/core/v1/session_connect';
import { mockNextI18next } from '~/__test_utils__';

jest.mock('next-i18next', () => mockNextI18next());
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-hot-toast', () => ({ __esModule: true, default: mockToast }));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const updateSpy = jest.fn(() => new Session({ id: 'ses-1' }));
  const transport = createRouterTransport(({ service }) => {
    service(SessionService, {
      get: () => new Session({ id: 'ses-1', price: '200' }),
      update: updateSpy,
    });
  });
  const { SessionCancellationDialog } = require('./session_cancellation_dialog');
  const utils = render(
    <TransportProvider transport={transport}>
      <QueryClientProvider client={queryClient}>
        <SessionCancellationDialog
          open
          mode="cancel"
          sessionId="ses-1"
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    </TransportProvider>
  );
  return { ...utils, updateSpy };
}

describe('SessionCancellationDialog', () => {
  beforeEach(() => {
    mockToast.error.mockClear();
    mockToast.success.mockClear();
  });

  it('defaults the "Cancelled By" actor to Therapist', () => {
    renderDialog();
    expect(screen.getByTestId('session-cancellation-actor')).toBeInTheDocument();
    expect(screen.getByText('Therapist')).toBeInTheDocument();
  });

  it('blocks submit on empty reason but does not require the pre-filled actor', async () => {
    const { updateSpy } = renderDialog();

    fireEvent.click(screen.getByTestId('session-cancellation-confirm'));

    expect(
      await screen.findByText('Cancellation reason is required')
    ).toBeInTheDocument();
    expect(mockToast.error).toHaveBeenCalledWith('Cancellation reason is required');
    expect(mockToast.error).not.toHaveBeenCalledWith(
      expect.stringContaining('actor')
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
