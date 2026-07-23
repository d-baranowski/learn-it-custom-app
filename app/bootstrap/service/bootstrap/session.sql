-- Therapy-aware session seeder
--
-- Generates sessions that respect each therapy's configuration:
--   therapist, price, duration, and frequency (days of week, every N weeks).
--
-- Each therapy gets a dedicated room (round-robin from core.room) and a
-- staggered start hour so sessions on the same day never collide.
--
-- Sessions are stored with date (YYYY-MM-DD), start_time (HH:MM),
-- end_time (HH:MM), and timezone (defaults to Europe/Warsaw).

CREATE OR REPLACE FUNCTION core.seed_therapy_sessions(
  p_start_date DATE,
  p_end_date   DATE
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_therapy        RECORD;
  v_freq           jsonb;
  v_day_num        INT;
  v_every          INT;
  v_is_online      BOOL;
  v_effective_room TEXT;
  v_current_date   DATE;
  v_therapy_start  DATE;
  v_session_date   DATE;
  v_start_time     TEXT;
  v_end_time       TEXT;
  v_timezone       TEXT := 'Europe/Warsaw';
  v_room_id        TEXT;
  v_room_ids       TEXT[];
  v_room_count     INT;
  v_therapy_idx    INT := 0;
  v_week_counter   INT;
  v_session_hour   INT;
  v_created_at_ms  BIGINT := (extract(epoch FROM now())::bigint) * 1000;
  v_paid_at_ms     BIGINT;
  v_payment_type   SMALLINT;
  v_payment_types  SMALLINT[] := ARRAY[1, 2, 3];
  v_start_ts       TIMESTAMP;
BEGIN
  -- Cache room IDs for round-robin assignment
  SELECT array_agg(r.id ORDER BY r.id)
    INTO v_room_ids
    FROM core.room r;

  v_room_count := coalesce(array_length(v_room_ids, 1), 0);

  IF v_room_count = 0 THEN
    RAISE NOTICE 'No rooms found – skipping session seeding';
    RETURN;
  END IF;

  -- Process each therapy that has a frequency configuration
  FOR v_therapy IN
    SELECT t.id, t.therapist_id, t.session_price, t.session_duration,
           t.session_frequency, t.start_date
      FROM core.therapy t
     WHERE t.session_frequency IS NOT NULL
       AND jsonb_typeof(t.session_frequency) = 'array'
       AND jsonb_array_length(t.session_frequency) > 0
     ORDER BY t.id
  LOOP
    v_therapy_idx := v_therapy_idx + 1;

    -- Dedicated room per therapy (wraps when more therapies than rooms)
    v_room_id := v_room_ids[((v_therapy_idx - 1) % v_room_count) + 1];

    -- Stagger start hours: 9, 10, 11 (morning) then 13, 14, 15 (afternoon)
    v_session_hour := CASE
      WHEN (v_therapy_idx - 1) < 3 THEN 9 + (v_therapy_idx - 1)
      ELSE 10 + (v_therapy_idx - 1)
    END;

    -- Effective therapy start date (start_date is epoch ms)
    IF v_therapy.start_date IS NOT NULL AND v_therapy.start_date > 0 THEN
      v_therapy_start := to_timestamp(v_therapy.start_date / 1000.0)::date;
    ELSE
      v_therapy_start := p_start_date;
    END IF;

    -- Process each frequency rule in the session_frequency JSON array
    -- Format: [{"every": 1, "unit": 1, "onDay": [2, 4]}]
    FOR v_freq IN SELECT value FROM jsonb_array_elements(v_therapy.session_frequency)
    LOOP
      v_every := coalesce((v_freq->>'every')::int, 1);
      v_is_online := coalesce((v_freq->>'isOnline')::bool, false);
      -- Online sessions are room-less; skip the dedicated room assignment.
      v_effective_room := CASE WHEN v_is_online THEN NULL ELSE v_room_id END;

      -- Process each configured ISO day-of-week (1=Mon .. 7=Sun)
      FOR v_day_num IN SELECT (jsonb_array_elements_text(v_freq->'onDay'))::int
      LOOP
        v_current_date := GREATEST(p_start_date, v_therapy_start);

        -- Advance to the first matching day of week
        WHILE extract(isodow FROM v_current_date)::int != v_day_num
              AND v_current_date <= p_end_date LOOP
          v_current_date := v_current_date + 1;
        END LOOP;

        v_week_counter := 0;

        -- Walk week by week until the end date
        WHILE v_current_date <= p_end_date LOOP
          -- Respect "every N weeks" frequency
          IF v_week_counter % v_every = 0 THEN
            v_session_date := v_current_date;
            v_start_time   := lpad(v_session_hour::text, 2, '0') || ':00';
            v_end_time     := lpad(v_session_hour::text, 2, '0') || ':' ||
                              lpad(v_therapy.session_duration::text, 2, '0');

            -- Calculate end time properly for durations >= 60 min
            v_end_time := to_char(
              (v_current_date::timestamp + (v_session_hour || ' hours')::interval
                + (v_therapy.session_duration || ' minutes')::interval),
              'HH24:MI'
            );

            -- Past sessions are marked as paid
            v_start_ts := v_current_date::timestamp
                          + (v_session_hour || ' hours')::interval;
            IF v_start_ts < now() THEN
              v_paid_at_ms   := (extract(epoch FROM
                                  v_start_ts + (v_therapy.session_duration || ' minutes')::interval
                                )::bigint) * 1000;
              v_payment_type := v_payment_types[((v_therapy_idx - 1) % 3) + 1];
            ELSE
              v_paid_at_ms   := NULL;
              v_payment_type := NULL;
            END IF;

            -- Insert only when no therapist or room time conflict
            -- Conflict detection: same date and overlapping time ranges
            INSERT INTO core.session (
              therapy_id, therapist_id, room_id,
              date, start_time, end_time, timezone,
              price, paid_at, payment_type, is_online, display_name,
              created_at, created_by
            )
            SELECT
              v_therapy.id, v_therapy.therapist_id, v_effective_room,
              to_char(v_session_date, 'YYYY-MM-DD'), v_start_time, v_end_time, v_timezone,
              v_therapy.session_price, v_paid_at_ms, v_payment_type, v_is_online,
              (SELECT display_name FROM core.therapy WHERE id = v_therapy.id),
              v_created_at_ms, '2imfnAVjkbfcwEos1LLLztn1vEP'
            WHERE NOT EXISTS (
              SELECT 1 FROM core.session s
               WHERE s.therapist_id = v_therapy.therapist_id
                 AND s.date = to_char(v_session_date, 'YYYY-MM-DD')
                 AND s.start_time < v_end_time
                 AND s.end_time   > v_start_time
            )
            AND (
              v_is_online OR NOT EXISTS (
                SELECT 1 FROM core.session s
                 WHERE s.room_id = v_room_id
                   AND s.date = to_char(v_session_date, 'YYYY-MM-DD')
                   AND s.start_time < v_end_time
                   AND s.end_time   > v_start_time
              )
            );
          END IF;

          v_current_date := v_current_date + 7;
          v_week_counter := v_week_counter + 1;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- Seed 12 months of history through the end of the current week.
--
-- With the 6 seeded therapies this produces roughly 350-400 sessions:
--   Therapy 1 (Marta, Tue+Thu weekly, 60 min)      ~104 sessions
--   Therapy 2 (Adam, Wed biweekly, 90 min)           ~26 sessions
--   Therapy 3 (Natalia, Mon+Fri weekly, 50 min)     ~104 sessions
--   Therapy 4 (Joanna, Wed weekly, 60 min)            ~52 sessions
--   Therapy 5 (Justyna, Tue weekly, 45 min)           ~52 sessions
--   Therapy 6 (Katarzyna, Thu biweekly, 90 min)       ~26 sessions
--
-- Each session uses the correct therapist, price, and duration from its
-- therapy.  Past sessions are marked as paid with rotating payment types.
SELECT core.seed_therapy_sessions(
  p_start_date => (date_trunc('month', CURRENT_DATE) - interval '12 months')::date,
  p_end_date   => (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
);

-- Backfill core.session_customer from core.therapy_customer so the m2m
-- link the UI reads from is populated for every seeded session. Without
-- this, the Customers column / customer filter on the Session grid is
-- empty for all bootstrap rows.
INSERT INTO core.session_customer (session_id, customer_id, created_at, created_by)
SELECT s.id, tc.customer_id, s.created_at, s.created_by
  FROM core.session s
  JOIN core.therapy_customer tc ON tc.therapy_id = s.therapy_id
 WHERE NOT EXISTS (
   SELECT 1 FROM core.session_customer sc
    WHERE sc.session_id = s.id
      AND sc.customer_id = tc.customer_id
 );
