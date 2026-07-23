-- Insert sample working hours slots for all therapists
-- Format: Day of week (1=Monday, 2=Tuesday, ..., 7=Sunday)
-- Times use 24-hour HH:MM:SS format
-- Timestamps in milliseconds

-- Therapist 1: Dr. Anna Kowalska - Available Monday to Friday, 9am-5pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '2testTherapist001XyZ12345', 1, '09:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 1, '13:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 2, '09:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 2, '13:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 3, '09:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 3, '13:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 4, '09:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 4, '13:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 5, '09:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist001XyZ12345', 5, '13:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 2: Jan Nowak - Available Monday, Wednesday, Friday 10am-6pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '2testTherapist002XyZ98765', 1, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist002XyZ98765', 1, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist002XyZ98765', 3, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist002XyZ98765', 3, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist002XyZ98765', 5, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist002XyZ98765', 5, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 3: Maria Wisniewski - Available Tuesday and Thursday 14:00-20:00 (evening sessions)
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '2testTherapist003XyZ11122', 2, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist003XyZ11122', 2, '17:30:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist003XyZ11122', 4, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '2testTherapist003XyZ11122', 4, '17:30:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 4: Marta Kuczek - Available Mon-Fri 8am-4pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 1, '08:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 1, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 2, '08:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 2, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 3, '08:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 3, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 4, '08:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 4, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 5, '08:00:00', '12:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A2DsWyvK8MkkAOlBn9v4NzzDt', 5, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 5: Katarzyna Kowara - Available Tue-Thu 10am-7pm, Sat 9am-2pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 2, '10:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 2, '14:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 3, '10:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 3, '14:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 4, '10:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 4, '14:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A59rkAmWqYRz9HtgYtGhITdSl', 6, '09:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 6: Natalia Wójcik - Available Mon, Wed, Fri 11am-7pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 1, '11:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 1, '15:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 3, '11:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 3, '15:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 5, '11:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37A9iijLsh4gMdDmje6ajqstr6o', 5, '15:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 7: Eliza Mleczek - Available Tue-Fri 9am-5pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 2, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 2, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 3, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 3, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 4, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 4, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 5, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C5PPIYtSLKpIc4zjd89rHliS1', 5, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 8: Adam Hałaczkiewicz - Available Mon, Wed, Thu 13:00-20:00 (afternoon/evening)
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 1, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 1, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 3, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 3, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 4, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C790fDP85gbzfMvsrBWwLFozZ', 4, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 9: Kinga Wołoszyn-Hohol - Available Mon-Thu 10am-6pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 1, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 1, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 2, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 2, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 3, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 3, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 4, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C7ZVq9oG42k8ofNu8OPUl0Yuw', 4, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 10: Agnieszka Kliber-Bukańska - Available Tue-Sat 12pm-8pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8719FZGmedPIX74sI5QOeEmG', 2, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 2, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 3, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 3, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 4, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 4, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 5, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 5, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8719FZGmedPIX74sI5QOeEmG', 6, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 11: Karolina Skrobol-Bojarczuk - Available Mon-Fri 9am-3pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G4GeAIdLa5vN69ATFOj3TJz', 1, '09:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4GeAIdLa5vN69ATFOj3TJz', 2, '09:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4GeAIdLa5vN69ATFOj3TJz', 3, '09:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4GeAIdLa5vN69ATFOj3TJz', 4, '09:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4GeAIdLa5vN69ATFOj3TJz', 5, '09:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 12: Joanna Stasielak - Available Mon, Wed, Fri 14:00-20:00
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 1, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 1, '18:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 3, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 3, '18:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 5, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G6AduZeUnCYZXXlDCCObwyC', 5, '18:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 13: Iwona Jeziorska - Available Mon-Thu 10am-6pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 1, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 1, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 2, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 2, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 3, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 3, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 4, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G7Qa5bQ34Nt7xpJlxowdB1C', 4, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 14: Justyna Krupa (Psychodietitian) - Available Tue, Thu, Sat 10am-4pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G4uSjx2XJJGJfyZLnXHqBoH', 2, '10:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4uSjx2XJJGJfyZLnXHqBoH', 4, '10:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G4uSjx2XJJGJfyZLnXHqBoH', 6, '10:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 15: Anna Sarnecka - Available Mon-Fri 11am-7pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 1, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 1, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 2, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 2, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 3, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 3, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 4, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 4, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 5, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G5lD7YO2efVWeYeALEA6L14', 5, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 16: Adam Kovalcsik - Available Tue-Thu 12pm-8pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 2, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 2, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 3, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 3, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 4, '12:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G9uwRtnfEhcElH6Pn5UkZOz', 4, '17:00:00', '20:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 17: Maria Smykla - Available Mon, Wed, Fri 10am-6pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 1, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 1, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 3, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 3, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 5, '10:00:00', '14:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C8G93iaVRVXgPGD25cgRwu7ft', 5, '15:00:00', '18:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 18: Anna Stafiej - Available Mon-Fri 9am-5pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 1, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 1, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 2, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 2, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 3, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 3, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 4, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 4, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 5, '09:00:00', '13:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YUd6kPA8VtQACtopWnk6cs8', 5, '14:00:00', '17:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 19: Julia Hodurek-Ptak - Available Tue, Thu, Sat 11am-7pm
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 2, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 2, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 4, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 4, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 6, '11:00:00', '15:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YVH1AtV729RoHNq3ViS4QWr', 6, '16:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Therapist 20: Anna Radecka - Available Mon-Thu 13:00-19:00
INSERT INTO core.working_hours (therapist_id, day_of_week, from_time, till_time, created_at, created_by) VALUES
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 1, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 1, '17:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 2, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 2, '17:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 3, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 3, '17:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 4, '13:00:00', '16:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
    ( '37C9YXwat1yqVRBS2WE44TE53fY', 4, '17:00:00', '19:00:00', 1725824055000, '2imfnAVjkbfcwEos1LLLztn1vEP');
