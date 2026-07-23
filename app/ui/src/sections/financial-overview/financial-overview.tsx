'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Grid } from '@mui/material';
import { useQuery } from '@connectrpc/connect-query';
import { getFinancialOverview } from '@gen/core/v1/financial_dashboard-FinancialDashboardService_connectquery';
import { MonthBarChart } from './month-bar-chart';
import { MonthDetailBreakdown } from './month-detail-breakdown';
import { useTranslation } from 'next-i18next';

interface FinancialOverviewProps {
  initialMonth?: Date;
}

// Currency formatting helper
// TODO: Make currency configurable based on user settings/locale
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
};

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  initialMonth = new Date(),
}) => {
  const { t } = useTranslation('common');
  const [referenceMonth, setReferenceMonth] = useState(() => {
    // Normalize to start of month
    const normalized = new Date(initialMonth);
    normalized.setDate(1);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );

  // Format date to MM-YYYY string
  const formatMonthString = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${month}-${year}`;
  };

  // Fetch financial data
  const { data, isLoading, error } = useQuery(
    getFinancialOverview,
    {
      referenceMonth: formatMonthString(referenceMonth),
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    if (!data?.months) return [];
    return data.months.map((month) => ({
      month: month.monthLabel,
      income: Math.round(month.totalIncome * 100) / 100,
      monthData: month,
    }));
  }, [data]);

  const handlePreviousMonth = () => {
    setReferenceMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedMonthIndex(null);
  };

  const handleNextMonth = () => {
    setReferenceMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedMonthIndex(null);
  };

  const handleMonthSelect = (index: number) => {
    setSelectedMonthIndex(index === -1 ? null : index);
  };

  return (
    <Grid container spacing={2} sx={{ padding: 2 }}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('Failed to load financial data')}: {error.message}
          </Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <MonthBarChart
          data={barChartData}
          selectedMonthIndex={selectedMonthIndex}
          onMonthSelect={handleMonthSelect}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
        />
      </Grid>

      <Grid item xs={12}>
        {selectedMonthIndex !== null && barChartData[selectedMonthIndex] && (
          <MonthDetailBreakdown
            monthData={barChartData[selectedMonthIndex].monthData}
            formatCurrency={formatCurrency}
          />
        )}
      </Grid>
    </Grid>
  );
};
