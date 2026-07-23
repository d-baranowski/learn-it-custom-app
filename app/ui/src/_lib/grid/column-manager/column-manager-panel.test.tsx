// NOTE: `jest` is used as a global here (not imported from '@jest/globals').
// next/jest's SWC transform only hoists `jest.mock` above imports when `jest`
// is the implicit global; importing it breaks hoisting and the mock silently
// never applies. The i18n mock is inlined for the same hoisting reason.
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts
        ? key.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) =>
            String(opts[k] ?? ''),
          )
        : key,
    i18n: { language: 'en' },
  }),
}));

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import ColumnManagerPanel, {
  ColumnManagerItem,
} from './column-manager-panel';

function makeColumns(): ColumnManagerItem[] {
  return [
    { id: 'date', label: 'Date', visible: true },
    { id: 'start', label: 'Start', visible: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'paymentStatus', label: 'Payment status', visible: false },
    { id: 'paymentType', label: 'Payment type', visible: false },
    { id: 'cancelledAt', label: 'Cancelled at', visible: false },
  ];
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof ColumnManagerPanel>> = {}) {
  const handlers = {
    onToggleVisibility: jest.fn(),
    onReorderVisible: jest.fn(),
    onShowAll: jest.fn(),
    onHideAll: jest.fn(),
    onReset: jest.fn(),
    onClose: jest.fn(),
  };
  render(
    <ColumnManagerPanel columns={makeColumns()} {...handlers} {...overrides} />,
  );
  return handlers;
}

describe('ColumnManagerPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists visible and hidden columns with totals', () => {
    renderPanel();
    expect(screen.getByTestId('column-manager-visible-count')).toHaveTextContent('3');
    expect(screen.getByTestId('column-manager-hidden-count')).toHaveTextContent('3');
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Payment status')).toBeInTheDocument();
  });

  it('toggles a visible column off via its hide button', () => {
    const h = renderPanel();
    fireEvent.click(screen.getByTestId('column-toggle-date'));
    expect(h.onToggleVisibility).toHaveBeenCalledWith('date');
  });

  it('toggles a hidden column on via its row', () => {
    const h = renderPanel();
    fireEvent.click(screen.getByTestId('column-toggle-paymentStatus'));
    expect(h.onToggleVisibility).toHaveBeenCalledWith('paymentStatus');
  });

  it('filters both sections and shows "match of total" counts when searching', () => {
    renderPanel();
    fireEvent.change(screen.getByTestId('column-manager-search'), {
      target: { value: 'pay' },
    });
    // 0 of 3 visible match, 2 of 3 hidden match
    expect(screen.getByTestId('column-manager-visible-count')).toHaveTextContent('0 of 3');
    expect(screen.getByTestId('column-manager-hidden-count')).toHaveTextContent('2 of 3');
    expect(screen.getByTestId('column-row-paymentStatus')).toBeInTheDocument();
    expect(screen.getByTestId('column-row-paymentType')).toBeInTheDocument();
    expect(screen.queryByTestId('column-row-cancelledAt')).not.toBeInTheDocument();
  });

  it('shows an empty message when no visible columns match the query', () => {
    renderPanel();
    fireEvent.change(screen.getByTestId('column-manager-search'), {
      target: { value: 'pay' },
    });
    expect(screen.getByTestId('column-manager-visible-empty')).toBeInTheDocument();
  });

  it('highlights the matched substring in results', () => {
    renderPanel();
    fireEvent.change(screen.getByTestId('column-manager-search'), {
      target: { value: 'pay' },
    });
    const row = screen.getByTestId('column-row-paymentStatus');
    const marks = within(row).getAllByTestId('column-match-highlight');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0]).toHaveTextContent(/pay/i);
  });

  it('wires footer and close actions', () => {
    const h = renderPanel();
    fireEvent.click(screen.getByTestId('column-manager-hide-all'));
    fireEvent.click(screen.getByTestId('column-manager-show-all'));
    fireEvent.click(screen.getByTestId('column-manager-reset'));
    fireEvent.click(screen.getByTestId('column-manager-close'));
    expect(h.onHideAll).toHaveBeenCalledTimes(1);
    expect(h.onShowAll).toHaveBeenCalledTimes(1);
    expect(h.onReset).toHaveBeenCalledTimes(1);
    expect(h.onClose).toHaveBeenCalledTimes(1);
  });

  it('clears the search via the clear button', () => {
    renderPanel();
    const search = screen.getByTestId('column-manager-search') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'pay' } });
    expect(search.value).toBe('pay');
    fireEvent.click(screen.getByTestId('column-manager-search-clear'));
    expect(search.value).toBe('');
  });
});
