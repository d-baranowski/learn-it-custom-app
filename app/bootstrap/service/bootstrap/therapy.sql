-- Insert sample therapies based on real services and therapists
-- Therapy 1: CBT therapy with Marta Kuczek for customer 001
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy01MartaKuczekCBT1',
    '37A2DsWyvK8MkkAOlBn9v4NzzDt',
    '2svcCBT00000000000000000001',
    'Cognitive Behavioral Therapy - Individual',
    1735689600000,
    NULL,
    200.00,
    60,
    '[{"every": 1, "unit": 1, "onDay": [2, 4], "roomId": "37CP3IF8dckSflCUbQIV4jofcQT"}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 2: Psychodynamic therapy with Adam Kovalcsik for couple (customers 002 and 004)
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy02AdamKovalcsikPs',
    '37C8G9uwRtnfEhcElH6Pn5UkZOz',
    '2svcPsychodynamic0000000002',
    'Psychodynamic Therapy - Couples',
    1733097600000,
    NULL,
    220.00,
    90,
    '[{"every": 2, "unit": 1, "onDay": [3], "roomId": "37CP3G428sqVf9v2wXJccAUepmR"}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 3: CBT therapy with Natalia Wójcik for customer 003
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy03NataliaWojcikCB',
    '37A9iijLsh4gMdDmje6ajqstr6o',
    '2svcCBT00000000000000000001',
    'Cognitive Behavioral Therapy - Anxiety',
    1736899200000,
    NULL,
    200.00,
    50,
    '[{"every": 1, "unit": 1, "onDay": [1, 5], "roomId": "37CP3F6Yh4fq0s6hINjvgWvT0HG"}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 4: Systemic therapy with Joanna Stasielak for customer 001
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy04JoannaStasielak',
    '37C8G6AduZeUnCYZXXlDCCObwyC',
    '2svcSystemic000000000000003',
    'Systemic Therapy - Family Patterns',
    1738108800000,
    NULL,
    210.00,
    60,
    '[{"every": 1, "unit": 1, "onDay": [3], "roomId": "37CP3Fg9vyMipJLyJECTKOJajuK"}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 5: Psychodietetics with Justyna Krupa for customer 002
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy05JustynaKrupa001',
    '37C8G4uSjx2XJJGJfyZLnXHqBoH',
    '2svcPsychodietetics00000004',
    'Psychodietetics - Emotional Eating',
    1735689600000,
    NULL,
    180.00,
    45,
    '[{"every": 1, "unit": 1, "onDay": [2], "roomId": "37CP3Cd3YbRs3JJLJdMvdlN1xVe"}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 6: ADHD Diagnosis with Katarzyna Kowara for customer 003
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy06KatarzynaKowara',
    '37A59rkAmWqYRz9HtgYtGhITdSl',
    '2svcADHDDiagnosis0000000005',
    'ADHD Diagnosis - Assessment',
    1736294400000,
    NULL,
    250.00,
    90,
    '[{"every": 2, "unit": 1, "onDay": [4], "roomId": "37CP3JCH7TL88vidSXgADPGfRJP"}]'::jsonb,
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 7: Online CBT with Marta Kuczek - Customer 001 (online regression coverage for UTR-000113)
INSERT INTO core.therapy (
    id,
    therapist_id,
    service_id,
    display_name,
    start_date,
    end_date,
    session_price,
    session_duration,
    session_frequency,
    created_at,
    created_by
) VALUES (
    '3therapy07MartaOnlineCBTv',
    '37A2DsWyvK8MkkAOlBn9v4NzzDt',
    '2svcCBT00000000000000000001',
    'Online CBT - Virtual',
    1735689600000,
    NULL,
    200.00,
    50,
    '[{"every": 1, "unit": 1, "onDay": [3], "isOnline": true}]'::jsonb,
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy-Customer relationships
-- Therapy 1: CBT with Marta Kuczek - Customer 001
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc01MartaKuczekCust001abc',
    '3therapy01MartaKuczekCBT1',
    '2testCustomer001XyZ12345',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 2: Psychodynamic with Adam Kovalcsik - Customers 002 and 004 (couple)
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc02AdamKovalcsikCust002',
    '3therapy02AdamKovalcsikPs',
    '2testCustomer002XyZ98765',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc03AdamKovalcsikCust004',
    '3therapy02AdamKovalcsikPs',
    '2testCustomer004XyZ33344',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 3: CBT with Natalia Wójcik - Customer 003
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc04NataliaWojcikCust003',
    '3therapy03NataliaWojcikCB',
    '2testCustomer003XyZ11122',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 4: Systemic with Joanna Stasielak - Customer 001
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc05JoannaStasielakCust1',
    '3therapy04JoannaStasielak',
    '2testCustomer001XyZ12345',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 5: Psychodietetics with Justyna Krupa - Customer 002
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc06JustynaKrupaCust002ab',
    '3therapy05JustynaKrupa001',
    '2testCustomer002XyZ98765',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 6: ADHD Diagnosis with Katarzyna Kowara - Customer 003
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc07KatarzynaKowaraCust3',
    '3therapy06KatarzynaKowara',
    '2testCustomer003XyZ11122',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Therapy 7: Online CBT with Marta Kuczek - Customer 001
INSERT INTO core.therapy_customer (
    id,
    therapy_id,
    customer_id,
    created_at,
    created_by
) VALUES (
    '3tc08MartaOnlineCust001xy',
    '3therapy07MartaOnlineCBTv',
    '2testCustomer001XyZ12345',
    1725824055000,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);
