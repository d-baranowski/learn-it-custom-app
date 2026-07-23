'use client';

import React from 'react';
import {Box, Card, CardContent, Typography, Grid, useTheme, alpha} from '@mui/material';
import {PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip} from 'recharts';
import type {MonthlyFinancialData} from '@gen/core/v1/financial_dashboard_pb';
import {useTranslation} from 'next-i18next';
import {useWindowSize} from '@uidotdev/usehooks';
import {usePrettyPrintDate} from '~/utils/date';

interface MonthDetailBreakdownProps {
  monthData: MonthlyFinancialData;
  formatCurrency: (value: number) => string;
}

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
  abbreviation?: string;
}

// Minimal interface for pie chart label props - only using index
// The recharts library provides additional properties (cx, cy, midAngle, etc.)
// but we only need the index to look up our data
interface PieChartLabelProps {
  index: number;
}

export const MonthDetailBreakdown: React.FC<MonthDetailBreakdownProps> = ({
  monthData,
  formatCurrency,
}) => {
  const theme = useTheme();
  const {t} = useTranslation('common');
  const prettyDate = usePrettyPrintDate();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const {height: windowHeight} = useWindowSize();

  // Calculate responsive dimensions based on viewport
  // Pie chart: use 45% of viewport height, with min 300px and max 600px
  // Inner/outer radius: scale proportionally to chart height
  const chartDimensions = React.useMemo(() => {
    if (!windowHeight) {
      return { height: 400, innerRadius: 90, outerRadius: 130 }; // Default fallback when viewport size unavailable (SSR or initial render)
    }
    const calculatedHeight = Math.floor(windowHeight * 0.45);
    const height = Math.max(300, Math.min(600, calculatedHeight));
    // Scale radius proportionally: baseline is 400px height with 90/130 innerRadius/outerRadius
    const scale = height / 400;
    return {
      height,
      innerRadius: Math.floor(90 * scale),
      outerRadius: Math.floor(130 * scale),
    };
  }, [windowHeight]);

  // Prepare pie chart data - group transactions by recurring cashflow for visualization
  const pieChartData: PieChartDataItem[] = React.useMemo(() => {
    const therapistData = monthData.therapistIncomes.map((therapist) => ({
      name: therapist.therapistName || t('Unknown Therapist'),
      value: therapist.income,
      color: therapist.therapistColor,
      abbreviation: therapist.therapistAbbreviation,
    }));

    // Group transactions by recurring cashflow ID for pie chart
    const transactionGroups = new Map<string, { name: string; value: number }>();
    
    monthData.transactions.forEach((transaction) => {
      // Use recurring cashflow ID as key if present, otherwise use transaction ID
      const key = transaction.recurringCashflowId || transaction.transactionId;
      // Use recurring cashflow name if available, otherwise use transaction name
      const name = transaction.recurringCashflowName || transaction.displayName;
      
      if (transactionGroups.has(key)) {
        // Sum amounts for same recurring cashflow
        const existing = transactionGroups.get(key)!;
        existing.value += transaction.amount;
      } else {
        transactionGroups.set(key, {
          name,
          value: transaction.amount,
        });
      }
    });

    const transactionData = Array.from(transactionGroups.values());

    return [...therapistData, ...transactionData];
  }, [monthData.therapistIncomes, monthData.transactions, t]);

  const pieTotal = React.useMemo(() => {
    if (!pieChartData.length) return 0;
    // Percent-of-pie should be based on absolute slice sizes (transactions can be negative)
    return pieChartData.reduce((sum, item) => sum + Math.abs(Number(item.value) || 0), 0);
  }, [pieChartData]);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  // Helper function to get color for a pie chart slice
  const getSliceColor = (item: PieChartDataItem, index: number): string => {
    return item.color || COLORS[index % COLORS.length];
  };

  // Custom label renderer to show abbreviations on pie slices
  const renderLabel = (entry: PieChartLabelProps) => {
    const dataEntry = pieChartData[entry.index];
    // Only show abbreviation if it exists
    return dataEntry?.abbreviation || '';
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom legend renderer to highlight active item
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
        {payload.map((entry: any, index: number) => (
          <Box
            key={`legend-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 1,
              backgroundColor: activeIndex === index ? alpha(entry.color, 0.15) : 'transparent',
              transition: 'background-color 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(entry.color, 0.1),
              },
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                marginRight: 0.4,
                borderRadius: '2px',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: activeIndex === index ? 600 : 400,
                transition: 'font-weight 0.3s ease',
              }}
            >
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Grid container spacing={2}>
      {/* Pie Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('Income Breakdown')}
            </Typography>
            <ResponsiveContainer width="100%" height={chartDimensions.height}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  innerRadius={chartDimensions.innerRadius}
                  outerRadius={chartDimensions.outerRadius}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSliceColor(entry, index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => {
                    const v = Number(value) || 0;
                    const abs = Math.abs(v);
                    const pct = pieTotal > 0 ? (abs / pieTotal) * 100 : 0;
                    return `${formatCurrency(v)} (${pct.toFixed(1)}%)`;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 8 }}
                  content={renderLegend}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Panel */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent sx={{ height: chartDimensions.height + 80, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('Month Summary')}
            </Typography>
            <Box sx={{mb: 2}}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('Total Income')}
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatCurrency(monthData.totalIncome)}
              </Typography>
            </Box>

            {monthData.therapistIncomes.length > 0 && (
              <Box sx={{mb: 1}}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {t('Income by Therapist')}
                </Typography>
                {monthData.therapistIncomes.map((therapist) => (
                  <Box
                    key={therapist.therapistId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        {therapist.therapistName || t('Unknown')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {therapist.sessionCount} {t('sessions')}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{formatCurrency(therapist.income)}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {monthData.transactions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {t('Transactions')}
                </Typography>
                {monthData.transactions.map((transaction) => (
                  <Box
                    key={transaction.transactionId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2">{transaction.displayName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {prettyDate(BigInt(transaction.incurredAt))}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
