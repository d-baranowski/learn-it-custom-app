-- Insert therapist-service links based on real-world data

-- Test therapists (for compatibility with other test data)
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('2testTherServ001XyZ123456', '2testTherapist001XyZ12345', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('2testTherServ002XyZ789012', '2testTherapist001XyZ12345', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('2testTherServ003XyZ345678', '2testTherapist002XyZ98765', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('2testTherServ004XyZ901234', '2testTherapist003XyZ11122', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Real therapists
-- Psychoterapia poznawczo-behawioralna (CBT)

-- Adam Hałaczkiewicz - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts00AdamHalaczkiewiczCBT1', '37C790fDP85gbzfMvsrBWwLFozZ', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Iwona Jeziorska - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts01IwonaJeziorskaCBT0001', '37C8G7Qa5bQ34Nt7xpJlxowdB1C', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Agnieszka Kliber-Bukańska - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts02AgnieszkaKliberCBT001', '37C8719FZGmedPIX74sI5QOeEmG', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Marta Kuczek - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts03MartaKuczekCBT0000001', '37A2DsWyvK8MkkAOlBn9v4NzzDt', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Anna Radecka - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts04AnnaRadeckaCBT000001', '37C9YXwat1yqVRBS2WE44TE53fY', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Anna Sarnecka - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts05AnnaSarneckaCBT00001', '37C8G5lD7YO2efVWeYeALEA6L14', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Karolina Skrobol-Bojarczuk - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts06KarolinaSkrobolCBT01', '37C8G4GeAIdLa5vN69ATFOj3TJz', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Anna Stafiej - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts07AnnaStafiejCBT000001', '37C9YUd6kPA8VtQACtopWnk6cs8', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Kinga Wołoszyn-Hohol - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts08KingaWoloszynCBT0001', '37C7ZVq9oG42k8ofNu8OPUl0Yuw', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Natalia Wójcik - CBT
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts09NataliaWojcikCBT0001', '37A9iijLsh4gMdDmje6ajqstr6o', '2svcCBT00000000000000000001', 200.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Psychoterapia psychodynamiczna

-- Julia Hodurek-Ptak - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts10JuliaHodurekPsycho01', '37C9YVH1AtV729RoHNq3ViS4QWr', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Adam Kovalcsik - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts11AdamKovalcsikPsycho1', '37C8G9uwRtnfEhcElH6Pn5UkZOz', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Katarzyna Kowara - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts12KatarzynaKowaraPsyc1', '37A59rkAmWqYRz9HtgYtGhITdSl', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Eliza Mleczek - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts13ElizaMleczekPsycho01', '37C5PPIYtSLKpIc4zjd89rHliS1', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Maria Smykla - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts14MariaSmyklaPsycho001', '37C8G93iaVRVXgPGD25cgRwu7ft', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Joanna Stasielak - Psychodynamic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts15JoannaStasielakPsyc1', '37C8G6AduZeUnCYZXXlDCCObwyC', '2svcPsychodynamic0000000002', 220.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Psychoterapia systemowa

-- Julia Hodurek-Ptak - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts16JuliaHodurekSystem01', '37C9YVH1AtV729RoHNq3ViS4QWr', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Adam Kovalcsik - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts17AdamKovalcsikSystem1', '37C8G9uwRtnfEhcElH6Pn5UkZOz', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Katarzyna Kowara - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts18KatarzynaKowaraSyst1', '37A59rkAmWqYRz9HtgYtGhITdSl', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Eliza Mleczek - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts19ElizaMleczekSystem01', '37C5PPIYtSLKpIc4zjd89rHliS1', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Maria Smykla - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts20MariaSmyklaSystem001', '37C8G93iaVRVXgPGD25cgRwu7ft', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Joanna Stasielak - Systemic
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts21JoannaStasielakSyst1', '37C8G6AduZeUnCYZXXlDCCObwyC', '2svcSystemic000000000000003', 210.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Psychodietetyka

-- Justyna Krupa - Psychodietetics
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts22JustynaKrupaPsycho01', '37C8G4uSjx2XJJGJfyZLnXHqBoH', '2svcPsychodietetics00000004', 180.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Diagnoza ADHD

-- Katarzyna Kowara - ADHD Diagnosis
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts23KatarzynaKowaraADHD1', '37A59rkAmWqYRz9HtgYtGhITdSl', '2svcADHDDiagnosis0000000005', 250.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Marta Kuczek - ADHD Diagnosis
INSERT INTO core.therapist_service (id, therapist_id, service_id, price, created_at, created_by)
VALUES ('3ts24MartaKuczekADHD00001', '37A2DsWyvK8MkkAOlBn9v4NzzDt', '2svcADHDDiagnosis0000000005', 250.00, 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');
