'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {useTranslation} from 'next-i18next';
import {useWindowSize} from '@uidotdev/usehooks';

interface MonthData {
  month: string;
  income: number;
}

interface MonthBarChartProps {
  data: MonthData[];
  selectedMonthIndex: number | null;
  onMonthSelect: (index: number) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}

export const MonthBarChart: React.FC<MonthBarChartProps> = ({
  data,
  selectedMonthIndex,
  onMonthSelect,
  onPreviousMonth,
  onNextMonth,
  isLoading,
  formatCurrency,
}) => {
  const theme = useTheme();
  const {t} = useTranslation('common');
  const {height: windowHeight} = useWindowSize();

  // Calculate responsive chart height based on viewport
  // Use 20% of viewport height, with min 200px and max 350px
  const chartHeight = React.useMemo(() => {
    if (!windowHeight) return 250; // Default fallback
    const calculatedHeight = Math.floor(windowHeight * 0.2);
    return Math.max(200, Math.min(350, calculatedHeight));
  }, [windowHeight]);

  const handleBarClick = (data: any, index: number) => {
    onMonthSelect(index === selectedMonthIndex ? -1 : index);
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6">{t('Monthly Income Overview')}</Typography>
          <Box>
            <IconButton onClick={onPreviousMonth} size="small" aria-label={t('Previous month')}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={onNextMonth} size="small" aria-label={t('Next month')}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
        {isLoading ? (
          <Box sx={{height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Typography>{t('Loading...')}</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{top: 20, right: 30, left: 20, bottom: 5}}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar
                dataKey="income"
                onClick={handleBarClick}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === selectedMonthIndex
                        ? theme.palette.primary.dark
                        : theme.palette.primary.main
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
