-- Insert rooms for Nurty Office
-- Polish nomenclature: D (Dol/bottom) 1-4 and G (Gora/top) 5-7
-- English nomenclature: B (Bottom) 1-4 and T (Top) 5-7
INSERT INTO core.room (
    id,
    office_id,
    display_name,
    display_abbreviation,
    display_color,
    description,
    created_at,
    created_by
) VALUES 
(
    '37CP3IF8dckSflCUbQIV4jofcQT',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "B1", "pl": "D1"}',
    'B1',
    '#1976D2',
    '{"en": "Bottom floor room 1", "pl": "Pokój na dolnym piętrze 1"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
(
    '37CP3G428sqVf9v2wXJccAUepmR',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "B2", "pl": "D2"}',
    'B2',
    '#388E3C',
    '{"en": "Bottom floor room 2", "pl": "Pokój na dolnym piętrze 2"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
(
    '37CP3F6Yh4fq0s6hINjvgWvT0HG',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "B3", "pl": "D3"}',
    'B3',
    '#D32F2F',
    '{"en": "Bottom floor room 3", "pl": "Pokój na dolnym piętrze 3"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
(
    '37CP3Fg9vyMipJLyJECTKOJajuK',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "B4", "pl": "D4"}',
    'B4',
    '#F57C00',
    '{"en": "Bottom floor room 4", "pl": "Pokój na dolnym piętrze 4"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
-- Top floor rooms (G5-G7 in Polish, T5-T7 in English)
(
    '37CP3Cd3YbRs3JJLJdMvdlN1xVe',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "T5", "pl": "G5"}',
    'T5',
    '#7B1FA2',
    '{"en": "Top floor room 5", "pl": "Pokój na górnym piętrze 5"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
(
    '37CP3JCH7TL88vidSXgADPGfRJP',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "T6", "pl": "G6"}',
    'T6',
    '#0097A7',
    '{"en": "Top floor room 6", "pl": "Pokój na górnym piętrze 6"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
),
(
    '37CP3CCsSVyrWKY9XbU8qiC06Y4',
    '37CP3DpqnTzJLEzYcEgJdk71pfg',
    '{"en": "T7", "pl": "G7"}',
    'T7',
    '#FBC02D',
    '{"en": "Top floor room 7", "pl": "Pokój na górnym piętrze 7"}',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);
