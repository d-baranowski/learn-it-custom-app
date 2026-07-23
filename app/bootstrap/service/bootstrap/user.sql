-- Therapist users
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('2therapistUser001XyZ12345', 'annakowalska', 'Dr. Anna Kowalska', 'AK', 'anna.kowalska@example.com', NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2', NULL, false, 1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('2therapistUser002XyZ98765', 'jannowak', 'Jan Nowak', 'JN', 'jan.nowak@example.com', NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2', NULL, false, 1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('2therapistUser003XyZ11122', 'mariawisniewski', 'Maria Wisniewski', 'MW', 'maria.wisniewski@example.com', NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2', NULL, false, 1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Regular users

-- Marta Kuczek
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37A2DuqbLObIGm0ntN8CSyeK1Sp',
        'martakuczek',
        'Dr. Marta Kuczek',
        'MK',
        'marta.kuczek@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Katarzyna Kowara
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37A59voVWpAVpBwm7jdKpZn2jDx',
        'katarzynakowara',
        'Katarzyna Kowara',
        'KK',
        'katkowara@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Natalia Wójcik
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37A9ikRTZcmhUJv0ydgEtJnnfJZ',
        'nataliawojcik',
        'Natalia Wójcik',
        'NW',
        'nwojcik.psychoterapia@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Eliza Mleczek
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37C4QrDAGfRePpSeZNIFokcvqsg',
        'elizamleczek',
        'Eliza Mleczek',
        'EM',
        'tarkaeliza@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Adam Halaczkiewicz
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37C6yuezOh2tMDfwLqmgWoKS0tD',
        'adamhalaczkiewicz',
        'Adam Hałaczkiewicz',
        'AH',
        'adameusz.halaczkiewicz@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Kinga Wołoszyn-Hohol
INSERT INTO core.user (id, username, display_name, display_abbreviation, email, external_id, password_hash, avatar, disabled, created_at,
                       created_by)
VALUES ('37C7ZTHn6XnIOAAQ1pqws9dXNzT',
        'kingawoloszyn',
        'Kinga Wołoszyn-Hohol',
        'KWH',
        'kinga.b.woloszyn@gmail.com',
        NULL,
        '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
        NULL,
        false,
        1725824055,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Agnieszka Kliber-Bukańska
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C875jQIRZtfdNGQN4fsaCAZyJ',
           'agnieszkakliber',
           'Agnieszka Kliber-Bukańska',
           'AKB',
           'bukanskaagnieszka@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Karolina Skrobol-Bojarczuk
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G2YZPQfpTrBJVDq6GvVoWsi',
           'karolinaskrobolbojarczuk',
           'Karolina Skrobol-Bojarczuk',
           'KSB',
           'skrobol.karolinaa@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Joanna Stasielak
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G5G0r6cyQkPHh88qnomlqMF',
           'joannastasielak',
           'Joanna Stasielak',
           'JS',
           'joanna.stasielak@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Iwona Jeziorska
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G2m417AQm8dODkpUoBrEyin',
           'iwonajeziorska',
           'Iwona Jeziorska',
           'IJ',
           'ij1977@wp.pl',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Justyna Krupa
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G49o4r4x9kuB7ybuRVyh1sC',
           'justynakrupa',
           'Justyna Krupa',
           'JK',
           'kontakt@fundacjabezklamek.pl',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Sarnecka
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G6CNhTalG7T0eO6jbDz828q',
           'annasarnecka',
           'Anna Sarnecka',
           'AS',
           'psycholog.anna.sarnecka@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Adam Kovalcsik
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G81n41hGchEibWLJ1ZHLEVT',
           'adamkovalcsik',
           'Adam Kovalcsik',
           'AK1',
           'kovalcsik.adam703@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Maria Smykla
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C8G8Q8vqasz9sbg5u8y87Kfyg',
           'mariasmykla',
           'Maria Smykla',
           'MS',
           'smykla.maria@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Stafiej
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C9YY8RNjYqXiBhEwOTjbWkHml',
           'annastafiej',
           'Anna Stafiej',
           'AS1',
           'stafiej.anna@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Julia Hodurek-Ptak
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C9YSjqR8w14MYeByv2UWBoTXc',
           'juliahodurekptak',
           'Julia Hodurek-Ptak',
           'JHP',
           'hodurekjulia@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Radecka
INSERT INTO core.user (
  id,
  username,
  display_name,
  display_abbreviation,
  email,
  external_id,
  password_hash,
  avatar,
  disabled,
  created_at,
  created_by
) VALUES (
           '37C9YThOEVpAIMfgPLZMl2Z0aUo',
           'annaradecka',
           'Anna Radecka',
           'AR',
           'annaradecka123@gmail.com',
           NULL,
           '$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2',
           NULL,
           false,
           1725824055,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );
