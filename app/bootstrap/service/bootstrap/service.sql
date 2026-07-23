-- Insert therapy services
INSERT INTO core.service (
    id,
    name,
    description,
    default_price,
    display_abbreviation,
    created_at,
    created_by
) VALUES (
    '2svcCBT00000000000000000001',
    '{"en": "Cognitive Behavioral Therapy", "pl": "Psychoterapia poznawczo-behawioralna"}',
    '{"en": "Evidence-based psychotherapy focusing on the relationship between thoughts, feelings, and behaviors", "pl": "Psychoterapia oparta na dowodach naukowych, koncentrująca się na relacji między myślami, emocjami i zachowaniami"}',
    200.00,
    'CBT',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.service (
    id,
    name,
    description,
    default_price,
    display_abbreviation,
    created_at,
    created_by
) VALUES (
    '2svcPsychodynamic0000000002',
    '{"en": "Psychodynamic Therapy", "pl": "Psychoterapia psychodynamiczna"}',
    '{"en": "Therapy exploring unconscious patterns and early life experiences influencing current behavior", "pl": "Terapia eksplorująca nieświadome wzorce i wczesne doświadczenia życiowe wpływające na obecne zachowania"}',
    220.00,
    'Psy',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.service (
    id,
    name,
    description,
    default_price,
    display_abbreviation,
    created_at,
    created_by
) VALUES (
    '2svcSystemic000000000000003',
    '{"en": "Systemic Therapy", "pl": "Psychoterapia systemowa"}',
    '{"en": "Therapy addressing relational and family system patterns", "pl": "Terapia adresująca wzorce relacyjne i systemów rodzinnych"}',
    210.00,
    'Sys',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.service (
    id,
    name,
    description,
    default_price,
    display_abbreviation,
    created_at,
    created_by
) VALUES (
    '2svcPsychodietetics00000004',
    '{"en": "Psychodietetics", "pl": "Psychodietetyka"}',
    '{"en": "Specialized support for eating behaviors and the relationship between emotions and food", "pl": "Specjalistyczne wsparcie w zakresie zachowań żywieniowych i relacji między emocjami a jedzeniem"}',
    180.00,
    'PsyD',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.service (
    id,
    name,
    description,
    default_price,
    display_abbreviation,
    created_at,
    created_by
) VALUES (
    '2svcADHDDiagnosis0000000005',
    '{"en": "ADHD Diagnosis", "pl": "Diagnoza ADHD"}',
    '{"en": "Comprehensive assessment and diagnosis of Attention Deficit Hyperactivity Disorder", "pl": "Kompleksowa ocena i diagnoza Zespołu Nadpobudliwości Psychoruchowej z Deficytem Uwagi"}',
    250.00,
    'ADHD',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);
