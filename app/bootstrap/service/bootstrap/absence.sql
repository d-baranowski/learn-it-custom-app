-- Insert sample absences for therapists
-- Timestamps in milliseconds format

-- Individual therapist absences with varying reasons

-- Therapist 1 vacation: December 23-31, 2024  
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId001XyZ12345678', '2testTherapist001XyZ12345', 1734912000000, 1735603200000, 'Annual vacation', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 2 illness: January 15-17, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId002XyZ12345678', '2testTherapist002XyZ98765', 1736899200000, 1737158400000, 'Illness', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 3 conference: February 10-12, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId003XyZ12345678', '2testTherapist003XyZ11122', 1739145600000, 1739404800000, 'Professional conference', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 4: Marta Kuczek - Training: Jan 20-22, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37A2DabsenceId001XyZ1234', '37A2DsWyvK8MkkAOlBn9v4NzzDt', 1737331200000, 1737504000000, 'Professional training', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 5: Katarzyna Kowara - Vacation: Mar 1-7, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37A59absenceId001XyZ1234', '37A59rkAmWqYRz9HtgYtGhITdSl', 1740787200000, 1741392000000, 'Vacation', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 6: Natalia Wójcik - Sick leave: Jan 8-10, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37A9iabsenceId001XyZ1234', '37A9iijLsh4gMdDmje6ajqstr6o', 1736294400000, 1736467200000, 'Sick leave', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 7: Eliza Mleczek - Personal day: Jan 27, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C5PabsenceId001XyZ1234', '37C5PPIYtSLKpIc4zjd89rHliS1', 1737936000000, 1738022400000, 'Personal day', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 8: Adam Hałaczkiewicz - Conference: Feb 5-7, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C79absenceId001XyZ1234', '37C790fDP85gbzfMvsrBWwLFozZ', 1738713600000, 1738886400000, 'Academic conference', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 9: Kinga Wołoszyn-Hohol - Research: Jan 13-15, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C7ZabsenceId001XyZ1234', '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 1736726400000, 1736899200000, 'Research work', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 10: Agnieszka Kliber-Bukańska - Supervision: Feb 14, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C87absenceId001XyZ1234', '37C8719FZGmedPIX74sI5QOeEmG', 1739491200000, 1739577600000, 'Supervision training', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 11: Karolina Skrobol-Bojarczuk - Medical appointment: Jan 24, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8GabsenceId001XyZ1234', '37C8G4GeAIdLa5vN69ATFOj3TJz', 1737676800000, 1737763200000, 'Medical appointment', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 12: Joanna Stasielak - Workshop: Mar 10-12, 2025  
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G6absenceId001XyZ123', '37C8G6AduZeUnCYZXXlDCCObwyC', 1741564800000, 1741737600000, 'Clinical workshop', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 13: Iwona Jeziorska - Vacation: Feb 17-21, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G7absenceId001XyZ123', '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 1739750400000, 1740096000000, 'Vacation', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 14: Justyna Krupa - Course: Jan 30-31, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G4absenceId001XyZ123', '37C8G4uSjx2XJJGJfyZLnXHqBoH', 1738195200000, 1738281600000, 'Professional development course', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 15: Anna Sarnecka - Family emergency: Feb 3-4, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G5absenceId001XyZ123', '37C8G5lD7YO2efVWeYeALEA6L14', 1738540800000, 1738627200000, 'Family emergency', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 16: Adam Kovalcsik - Continuing education: Mar 3-5, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G9absenceId001XyZ123', '37C8G9uwRtnfEhcElH6Pn5UkZOz', 1740960000000, 1741132800000, 'Continuing education', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 17: Maria Smykla - Illness: Jan 21-23, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C8G93absenceId001XyZ12', '37C8G93iaVRVXgPGD25cgRwu7ft', 1737417600000, 1737590400000, 'Illness', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 18: Anna Stafiej - Training: Feb 25-27, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C9YabsenceId001XyZ1234', '37C9YUd6kPA8VtQACtopWnk6cs8', 1740441600000, 1740614400000, 'Professional training', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 19: Julia Hodurek-Ptak - Personal leave: Mar 13-14, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C9YVabsenceId001XyZ123', '37C9YVH1AtV729RoHNq3ViS4QWr', 1741824000000, 1741910400000, 'Personal leave', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 20: Anna Radecka - Workshop: Feb 19-20, 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('37C9YXabsenceId001XyZ123', '37C9YXwat1yqVRBS2WE44TE53fY', 1739923200000, 1740009600000, 'Therapeutic workshop', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Organization-wide absences (null therapist_id means all therapists)
-- Christmas Day 2024
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId004XyZ12345678', NULL, 1735084800000, 1735171200000, 'Christmas Day - Public Holiday', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- New Year's Day 2025
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId005XyZ12345678', NULL, 1735689600000, 1735776000000, 'New Year''s Day - Public Holiday', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Easter Monday 2025 (April 21)
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('2absenceId006XyZ12345678', NULL, 1745193600000, 1745280000000, 'Easter Monday - Public Holiday', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Constitution Day 2025 (May 3)
INSERT INTO core.absence (id, therapist_id, from_time, till_time, reason, created_at, created_by) VALUES
    ('absenceId007allPublicHol', NULL, 1746230400000, 1746316800000, 'Constitution Day - Public Holiday', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');
