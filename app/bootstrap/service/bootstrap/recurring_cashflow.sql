-- Insert Recurring Cashflows for Office Expenses, Cleaning, and Utility Bills

-- Office Rent - Monthly recurring expense
INSERT INTO core.recurring_cashflow (
    id,
    display_name,
    amount,
    start_date,
    end_date,
    frequency,
    created_at,
    created_by
) VALUES (
    '3RecCashOfficeRent123456',
    'Office Rent',
    -2500.00,
    1704067200000, -- 2024-01-01 00:00:00
    NULL,
    '[{"every": 1, "unit": 2, "onDay": [1], "startTimeMs": 0}]'::jsonb, -- Every month on Monday
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Cleaning Service - Bi-weekly recurring expense
INSERT INTO core.recurring_cashflow (
    id,
    display_name,
    amount,
    start_date,
    end_date,
    frequency,
    created_at,
    created_by
) VALUES (
    '3RecCashCleaning1234567',
    'Cleaning Service',
    -300.00,
    1704067200000, -- 2024-01-01 00:00:00
    NULL,
    '[{"every": 2, "unit": 1, "onDay": [5], "startTimeMs": 0}]'::jsonb, -- Every 2 weeks on Friday
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Electricity Bill - Monthly recurring expense
INSERT INTO core.recurring_cashflow (
    id,
    display_name,
    amount,
    start_date,
    end_date,
    frequency,
    created_at,
    created_by
) VALUES (
    '3RecCashElectricity12345',
    'Electricity Bill',
    -450.00,
    1704067200000, -- 2024-01-01 00:00:00
    NULL,
    '[{"every": 1, "unit": 2, "onDay": [3], "startTimeMs": 0}]'::jsonb, -- Every month on Wednesday
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Water Bill - Monthly recurring expense
INSERT INTO core.recurring_cashflow (
    id,
    display_name,
    amount,
    start_date,
    end_date,
    frequency,
    created_at,
    created_by
) VALUES (
    '3RecCashWater123456789',
    'Water Bill',
    -150.00,
    1704067200000, -- 2024-01-01 00:00:00
    NULL,
    '[{"every": 1, "unit": 2, "onDay": [3], "startTimeMs": 0}]'::jsonb, -- Every month on Wednesday
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Internet Bill - Monthly recurring expense
INSERT INTO core.recurring_cashflow (
    id,
    display_name,
    amount,
    start_date,
    end_date,
    frequency,
    created_at,
    created_by
) VALUES (
    '3RecCashInternet1234567',
    'Internet Bill',
    -120.00,
    1704067200000, -- 2024-01-01 00:00:00
    NULL,
    '[{"every": 1, "unit": 2, "onDay": [2], "startTimeMs": 0}]'::jsonb, -- Every month on Tuesday
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Sample Transactions for the first month
-- Office Rent - January
INSERT INTO core.transaction (
    id,
    recurring_cashflow_id,
    display_name,
    amount,
    incurred_at,
    created_at,
    created_by
) VALUES (
    '3TxnOfficeRent0124Jan01',
    '3RecCashOfficeRent123456',
    'Office Rent - January 2024',
    -2500.00,
    1704067200000, -- 2024-01-01
    1704067200000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Cleaning Service - First week of January
INSERT INTO core.transaction (
    id,
    recurring_cashflow_id,
    display_name,
    amount,
    incurred_at,
    created_at,
    created_by
) VALUES (
    '3TxnCleaning012405Jan05',
    '3RecCashCleaning1234567',
    'Cleaning Service - January 5, 2024',
    -300.00,
    1704412800000, -- 2024-01-05 (Friday)
    1704412800000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Electricity Bill - January
INSERT INTO core.transaction (
    id,
    recurring_cashflow_id,
    display_name,
    amount,
    incurred_at,
    created_at,
    created_by
) VALUES (
    '3TxnElectricity0Jan0103',
    '3RecCashElectricity12345',
    'Electricity Bill - January 2024',
    -450.00,
    1704240000000, -- 2024-01-03 (Wednesday)
    1704240000000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Water Bill - January
INSERT INTO core.transaction (
    id,
    recurring_cashflow_id,
    display_name,
    amount,
    incurred_at,
    created_at,
    created_by
) VALUES (
    '3TxnWater01240103Jan03',
    '3RecCashWater123456789',
    'Water Bill - January 2024',
    -150.00,
    1704240000000, -- 2024-01-03 (Wednesday)
    1704240000000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Internet Bill - January
INSERT INTO core.transaction (
    id,
    recurring_cashflow_id,
    display_name,
    amount,
    incurred_at,
    created_at,
    created_by
) VALUES (
    '3TxnInternet0124Jan0102',
    '3RecCashInternet1234567',
    'Internet Bill - January 2024',
    -120.00,
    1704153600000, -- 2024-01-02 (Tuesday)
    1704153600000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);
