-- Insert sample customers for testing
INSERT INTO core.customer (
    id,
    user_id,
    first_name,
    last_name,
    display_abbreviation,
    address,
    email,
    phone_number,
    notes,
    language_id,
    created_at,
    created_by
) VALUES (
    '2testCustomer001XyZ12345',
    NULL,
    'John',
    'Doe',
    'JD',
    '123 Main Street, Warsaw',
    'john.doe@example.com',
    '+48 123 456 789',
    'Regular client, prefers morning sessions',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    user_id,
    first_name,
    last_name,
    display_abbreviation,
    address,
    email,
    phone_number,
    notes,
    language_id,
    created_at,
    created_by
) VALUES (
    '2testCustomer002XyZ98765',
    NULL,
    'Jane',
    'Smith',
    'JS',
    '456 Oak Avenue, Krakow',
    'jane.smith@example.com',
    '+48 987 654 321',
    'Couples therapy with partner',
    '34tGCReab2xRBh9tOnVkyzBiAWq',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    user_id,
    first_name,
    last_name,
    address,
    email,
    phone_number,
    notes,
    language_id,
    created_at,
    created_by
) VALUES (
    '2testCustomer003XyZ11122',
    NULL,
    'Mike',
    'Johnson',
    '789 Pine Road, Gdansk',
    'mike.johnson@example.com',
    '+48 555 123 456',
    'Evening sessions preferred',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- Partner for customer 002 (couples therapy)
INSERT INTO core.customer (
    id,
    user_id,
    first_name,
    last_name,
    display_abbreviation,
    address,
    email,
    phone_number,
    notes,
    language_id,
    created_at,
    created_by
) VALUES (
    '2testCustomer004XyZ33344',
    NULL,
    'Robert',
    'Brown',
    'RB',
    '456 Oak Avenue, Krakow',
    'robert.brown@example.com',
    '+48 987 654 322',
    'Couples therapy with Jane Smith',
    '34tGCReab2xRBh9tOnVkyzBiAWq',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

-- 100 Polish customers generated with @faker-js/faker (Polish locale, seed 42)
INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'CVa2bA4wxoI6gR7U2uGfJWXBymw',
    'Wiktor',
    'Niedźwiecki',
    'WN',
    'wiktor.niedzwiecki@gmail.com',
    '+48 670 982 113',
    'rondo Nowicki 334, Suchowola',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'M7rcK3JKjdtT7ilYlUWQ161dJVu',
    'Magnus',
    'Burzyński',
    'MB',
    'magnus.burzynski32@gmail.com',
    '+48 283 251 809',
    'szosa Szafrański 77c, Bukowno',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'PD7KwKWhMyxFUIH2bV3HuE8UzFf',
    'Igor',
    'Grzelak',
    'IG',
    'igor.grzelak@gmail.com',
    '+48 868 818 588',
    'os. Król 80c, Nowa Sól',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'vsFeoYWE5ttdLLjtsmd5Atb06f0',
    'Edwin',
    'Kolasa',
    'EK',
    'edwin_kolasa53@hotmail.com',
    '+48 831 056 052',
    'skwer Kot 2/4, Czaplinek',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'CiH1eAwxuM0vQxxqINqJAYwhZ6c',
    'Krzysztof',
    'Piechota',
    'KP',
    'krzysztof_piechota23@gmail.com',
    '+48 768 650 322',
    'wyspa Pakuła 55c, Myślibórz',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'SXHa12pM7WlDc53WXdjyWKnGR41',
    'Bertram',
    'Urbański',
    'BU',
    'bertram_urbanski70@yahoo.com',
    '+48 288 895 576',
    'skwer Karczewski 15a, Bieżuń',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '6UTAQOcd2NcVreA4d1awZOdSXwN',
    'Salwator',
    'Kołodziejski',
    'SK',
    'salwator.ko8yodziejski@gmail.com',
    '+48 762 975 642',
    'os. Cieślak 187, Mogielnica',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'PNmLvrQkk6tVpJtO0u5JwwZdRIK',
    'Tomasz',
    'Borkowski',
    'TB',
    'tomasz.borkowski@gmail.com',
    '+48 038 082 166',
    'wyb. Janik 78, Żerków',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'owzkN5mYQu6U0T377ekaxNHrDx0',
    'Porfiriusz',
    'Staniszewski',
    'PS',
    'porfiriusz.staniszewski@gmail.com',
    '+48 483 117 610',
    'skwer Rogala 193, Kuźnia Raciborska',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'a4yzhXJogAuowicPvr21Noz9aNy',
    'Alfred',
    'Marszałek',
    'AM',
    'alfred.marsza8yek@yahoo.com',
    '+48 566 465 902',
    'wyspa Orzechowski 24, Krośniewice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'WlWqYYsP81kchD80LaORuLVmOcr',
    'Salwator',
    'Krawiec',
    'SK',
    'salwator.krawiec@gmail.com',
    '+48 995 798 241',
    'wyspa Piątkowski 41b, Radzionków',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'AHA57SCMVg2nc5sv3HnkBCMUcMS',
    'Bertrand',
    'Lipski',
    'BL',
    'bertrand.lipski98@gmail.com',
    '+48 362 011 116',
    'droga Lach 21c, Błaszki',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'akQ7HMeZMzbE69F9BHAt4WPy6Oy',
    'Aleksy',
    'Rosa',
    'AR',
    'aleksy_rosa53@yahoo.com',
    '+48 452 230 323',
    'bulw. Popławski 50c, Ogrodzieniec',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '3zJoFglaTPLvpx7jwB4jZq8nCAA',
    'Roman',
    'Dąbkowski',
    'RD',
    'roman_dabkowski@yahoo.com',
    '+48 271 345 216',
    'os. Lesiak 13b, Darłowo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'cXtm9JFk2ZlsLo6q7On9EiidhXF',
    'Natanael',
    'Klimek',
    'NK',
    'natanael.klimek81@yahoo.com',
    '+48 343 752 835',
    'wyb. Węgrzyn 41b, Suraż',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'R7zq7vrWaO3Kn0KOXvLLjSDS8AU',
    'Cyryl',
    'Mróz',
    'CM',
    'cyryl.mroz94@hotmail.com',
    '+48 556 089 569',
    'skwer Nowacki 79a, Wolbórz',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'SWROY9BrwNGdP19ie1DEf16nBeE',
    'Wacław',
    'Mroczkowski',
    'WM',
    'wac8yaw.mroczkowski66@hotmail.com',
    '+48 914 095 507',
    'droga Frankowski 550, Strzegom',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'PYRIwl8rUtnQ1GXdF8pzWAG1u7Z',
    'Efraim',
    'Tomaszewski',
    'ET',
    'efraim.tomaszewski66@yahoo.com',
    '+48 280 020 154',
    'wyb. Głąb 62a, Połczyn-Zdrój',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'MiIZTfwjD1Ga3UbKl64jUgQFonh',
    'Ksawery',
    'Szeląg',
    'KS',
    'ksawery.szelag@gmail.com',
    '+48 856 619 435',
    'al. Buczyński 33b, Kędzierzyn-Koźle',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'u2hIvywTrqJp2aE74hLi4JXnJcs',
    'Lucjan',
    'Bąkowski',
    'LB',
    'lucjan.bakowski95@yahoo.com',
    '+48 158 786 682',
    'pl. Zaborowski 791, Ostrzeszów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'IE21zQNgDwm5PswScAzEwebVEAD',
    'Edward',
    'Urban',
    'EU',
    'edward_urban@gmail.com',
    '+48 793 744 689',
    'szosa Siedlecki 13, Kcynia',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'roeY5PNGiU5Dg4qUTapLgZGsneq',
    'Rajmund',
    'Biernat',
    'RB',
    'rajmund_biernat@yahoo.com',
    '+48 137 618 225',
    'rynek Urbański 28, Zamość',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'dXm6lXxLdv6wg4Ih4aLc2syyk8l',
    'Oskar',
    'Radecki',
    'OR',
    'oskar_radecki75@yahoo.com',
    '+48 880 813 718',
    'ul. Janowski 96b, Jelenia Góra',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'OHzPtED1eMrTyBrmlqlc82vcnT7',
    'Alan',
    'Leśniewski',
    'AL',
    'alan_lesniewski44@yahoo.com',
    '+48 944 176 206',
    'skwer Drozd 94a, Pruszcz Gdański',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '8UchY0KW5L24O8ZgnCA6dh1w3Xh',
    'Olaf',
    'Gajewski',
    'OG',
    'olaf.gajewski58@hotmail.com',
    '+48 734 003 462',
    'skwer Bednarek 12a, Żarki',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'YiEzyeCg41FSrjkQLNz2rZRiUst',
    'Pankracy',
    'Karpiński',
    'PK',
    'pankracy.karpinski@yahoo.com',
    '+48 846 570 021',
    'wyb. Karaś 86, Nasielsk',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'yGeKl8ySE4AWKpQFchAA2jfTqna',
    'Erwin',
    'Wojtczak',
    'EW',
    'erwin_wojtczak@gmail.com',
    '+48 179 129 184',
    'ogród Malinowski 61a, Lipsk',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '81JhCfy5fRrAgpwgUcrZ1vgfDeO',
    'Dionizy',
    'Jagielski',
    'DJ',
    'dionizy_jagielski93@gmail.com',
    '+48 149 350 199',
    'al. Turek 54a, Radomsko',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'OhORENE4bfcSNrWT1LNOZXbloix',
    'Arystarch',
    'Żyła',
    'AŻ',
    'arystarch_zy8ya@gmail.com',
    '+48 757 843 687',
    'ul. Cybulski 13b, Kudowa-Zdrój',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'BWh6ZFxTnY2dwbosEDbPqtLEmHp',
    'Dawid',
    'Pawłowski',
    'DP',
    'dawid.paw8yowski92@yahoo.com',
    '+48 931 422 385',
    'os. Jagodziński 21a, Recz',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'gz76iZG45tBKEM4W4nEXseXKKfz',
    'Nazariusz',
    'Ossowski',
    'NO',
    'nazariusz_ossowski@hotmail.com',
    '+48 820 066 523',
    'rynek Czyż 44c, Siechnice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Wc5k7pmh2IGM5wYIORbVvUzqCv7',
    'Ksenofont',
    'Kwieciński',
    'KK',
    'ksenofont_kwiecinski95@gmail.com',
    '+48 625 047 367',
    'wyb. Drozdowski 9/5, Tarczyn',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'M418xYxQJVR6dDce93mS3z3hyE8',
    'Hilarion',
    'Twardowski',
    'HT',
    'hilarion_twardowski30@yahoo.com',
    '+48 416 396 818',
    'wyb. Sobczyk 53, Dobra',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '1Gl8XD0EynxU6XSq6U9KjTNOSmt',
    'Filip',
    'Puchalski',
    'FP',
    'filip_puchalski@gmail.com',
    '+48 636 541 841',
    'park Sadowski 14c, Mrągowo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '0xjLILmfBA6elG15yIlcNC7cmdW',
    'Rajnold',
    'Przybył',
    'RP',
    'rajnold.przyby8y84@hotmail.com',
    '+48 946 686 605',
    'droga Porębski 170, Brzostek',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'orquFkSqjmeBXzw2A8joDVqjXaV',
    'Witalis',
    'Jaros',
    'WJ',
    'witalis_jaros@yahoo.com',
    '+48 861 392 344',
    'rynek Cygan 86, Kąty Wrocławskie',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '2kCxMK9IszMRisaOPh0cMn5aTd4',
    'Kwintyn',
    'Urbaniak',
    'KU',
    'kwintyn_urbaniak16@hotmail.com',
    '+48 027 904 825',
    'szosa Kita 50c, Starachowice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'vdQdm7PqNZaBMK11pGWIwGQsqBn',
    'Kwintyn',
    'Niewiadomski',
    'KN',
    'kwintyn_niewiadomski@yahoo.com',
    '+48 400 377 754',
    'droga Burzyński 67, Żyrardów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'm4U23u8XPLt1fxYw3PGjyFeCZSy',
    'Justyn',
    'Buczkowski',
    'JB',
    'justyn.buczkowski@yahoo.com',
    '+48 716 176 900',
    'ogród Wnuk 37, Mielec',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'X3VnS3mCGAKkWCssrERzl14SuXU',
    'Grzegorz',
    'Drozd',
    'GD',
    'grzegorz.drozd@gmail.com',
    '+48 518 707 504',
    'pl. Tarnowski 54c, Pszów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'CBte9Rc5snVxPzfdAsQA0YWit4j',
    'Natan',
    'Kos',
    'NK',
    'natan_kos@yahoo.com',
    '+48 275 673 951',
    'skwer Tomczak 3/9, Dębica',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'qTyd7fKg4ArEpHdhVID2Iewslmf',
    'Sergiusz',
    'Maćkowiak',
    'SM',
    'sergiusz.mackowiak@yahoo.com',
    '+48 434 831 781',
    'ogród Kula 66c, Krosno Odrzańskie',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'IpHs6hX5E0TIbIIk2tqfatB4En2',
    'Tomasz',
    'Mikołajczak',
    'TM',
    'tomasz.miko8yajczak@gmail.com',
    '+48 539 140 792',
    'wyb. Skowron 19c, Siewierz',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'hEV6NUewbkVd4FMT28HyKTCbHCW',
    'Łazarz',
    'Marczak',
    'ŁM',
    '8xazarz_marczak59@gmail.com',
    '+48 096 885 543',
    'pl. Wilczyński 66a, Piekary Śląskie',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'uibJpxo0d3F3bg7NSM7Pk44Lwfg',
    'Abraham',
    'Bartosik',
    'AB',
    'abraham.bartosik@gmail.com',
    '+48 529 306 135',
    'wyb. Żmuda 334, Łabiszyn',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'gQfHImRnoruQJaNbhgNAQ8tL91e',
    'Ludwik',
    'Panek',
    'LP',
    'ludwik_panek@yahoo.com',
    '+48 190 510 424',
    'rynek Mika 76a, Tarnów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    't7xJtbpzHxONLX9YXlpRIGC3LGx',
    'Gilbert',
    'Kołodziejski',
    'GK',
    'gilbert_ko8yodziejski60@gmail.com',
    '+48 294 614 059',
    'park Kotowski 174, Kępice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'n7nHsw9SyTraNHClNVUZryPplZx',
    'Gonsalwy',
    'Dec',
    'GD',
    'gonsalwy_dec48@hotmail.com',
    '+48 986 562 304',
    'rondo Wojtas 58c, Czyżew',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'zfpI0jpj8klelqc5U4PP4L6ow4x',
    'Atanazy',
    'Kuc',
    'AK',
    'atanazy_kuc@yahoo.com',
    '+48 456 904 676',
    'bulw. Stolarczyk 29, Baranów Sandomierski',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'tVRac4gEionYW8mGUH8d3kJ0V2H',
    'Filemon',
    'Mackiewicz',
    'FM',
    'filemon_mackiewicz5@yahoo.com',
    '+48 422 289 493',
    'pl. Łukaszewski 46b, Czerniejewo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'AifxlwhI6md2MxVQSCMM3lPoqDe',
    'Ansgary',
    'Adamek',
    'AA',
    'ansgary_adamek31@gmail.com',
    '+48 328 378 493',
    'wyspa Lis 67a, Andrychów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '17PUPWa0SxWgJllWy71lo7G1IlW',
    'Sylwester',
    'Polak',
    'SP',
    'sylwester.polak@hotmail.com',
    '+48 736 371 823',
    'al. Jabłoński 1/4, Kowary',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Xx4MDC8cmZ9odOfGLuITth390dR',
    'Herman',
    'Jaworski',
    'HJ',
    'herman_jaworski84@hotmail.com',
    '+48 877 433 022',
    'pl. Biernat 9/8, Żmigród',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'ziyZGRa4cyBnuwxWykATiFdfAZl',
    'Wilhelm',
    'Gwóźdź',
    'WG',
    'wilhelm_gwozdz7@hotmail.com',
    '+48 845 401 420',
    'ul. Tokarski 91, Zakopane',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'uwZMmFYMeEBu6VD22ArHwaRZWlH',
    'Adam',
    'Klimczak',
    'AK',
    'adam.klimczak63@yahoo.com',
    '+48 387 040 461',
    'os. Żuk 733, Solec Kujawski',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '9sXHQ27l0PW3yEIIE0jxDfjqQIK',
    'Teodor',
    'Wilczyński',
    'TW',
    'teodor_wilczynski47@hotmail.com',
    '+48 251 382 009',
    'rondo Szwed 77, Puszczykowo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'VVMvphiSvhjrGoCLKyrhjYwUNAm',
    'Roman',
    'Konieczny',
    'RK',
    'roman_konieczny@yahoo.com',
    '+48 356 057 175',
    'wyspa Niemiec 77, Chorzów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'sfnFcZpu0f3YHJLcKjP4mHQgK3N',
    'Hilary',
    'Szymański',
    'HS',
    'hilary_szymanski97@gmail.com',
    '+48 278 590 578',
    'droga Kowalski 813, Kępice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'TGHeyb44wI5bceG0xFfhbJGbrw6',
    'Mikołaj',
    'Palacz',
    'MP',
    'miko8yaj.palacz75@gmail.com',
    '+48 224 905 191',
    'park Kruszewski 42a, Gostyń',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'QGQi0acdFi5Csj0FDGF3Sjbf5wp',
    'Wawrzyniec',
    'Wasiak',
    'WW',
    'wawrzyniec_wasiak@gmail.com',
    '+48 405 249 381',
    'skwer Adamowicz 17a, Witnica',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'ew3pIR1IV3Uv6lPeG994Bfsog6H',
    'Rudolf',
    'Małek',
    'RM',
    'rudolf_ma8yek@gmail.com',
    '+48 503 955 238',
    'skwer Pająk 74, Marki',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'kRb9fBhE7A0ijVA51AtEL6DWbF3',
    'Eleazar',
    'Matysiak',
    'EM',
    'eleazar.matysiak@hotmail.com',
    '+48 399 335 981',
    'park Frątczak 7/8, Trzcińsko-Zdrój',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'CVP1n4TYcgF0iXpoqUKnRBrsS4O',
    'Edward',
    'Zawadzki',
    'EZ',
    'edward_zawadzki41@hotmail.com',
    '+48 567 154 865',
    'bulw. Karczewski 723, Wągrowiec',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'h0DfU0nlY4lamknW8fckACtkulb',
    'Tobiasz',
    'Bogusz',
    'TB',
    'tobiasz.bogusz@yahoo.com',
    '+48 060 384 953',
    'ogród Borek 57a, Pyrzyce',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'wdKGBhDaGfomlB5hMQ1G2sFY2fK',
    'Szymon',
    'Palacz',
    'SP',
    'szymon.palacz71@gmail.com',
    '+48 232 249 510',
    'skwer Pietrzak 36c, Józefów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'eE0lcl2pcYcraazkRhOEbvvLWDz',
    'Szymon',
    'Wiącek',
    'SW',
    'szymon_wiacek84@yahoo.com',
    '+48 500 937 889',
    'ogród Czech 475, Kolonowskie',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'A1mbhpnxXUO9ZHvaaM31Q5bsseD',
    'Modest',
    'Rosiński',
    'MR',
    'modest.rosinski@hotmail.com',
    '+48 639 156 662',
    'droga Fijałkowski 56c, Świeradów-Zdrój',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'TG6A9ylyRHnKIE8FMf3Do9Lr95U',
    'Szczepan',
    'Siedlecki',
    'SS',
    'szczepan_siedlecki99@gmail.com',
    '+48 869 480 309',
    'ul. Budzyński 12a, Hel',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'ztNCUjUTpMrPKSl7CwAZZUdEYNf',
    'Kwintyn',
    'Czyż',
    'KC',
    'kwintyn_czyz@hotmail.com',
    '+48 240 438 044',
    'szosa Sowiński 3/5, Świnoujście',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'G0rnck9SL5Uv2ICEuTSl9UQbzlO',
    'Laurenty',
    'Janiak',
    'LJ',
    'laurenty.janiak82@gmail.com',
    '+48 995 137 305',
    'ul. Piłat 28, Jastrowie',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'nOk7lEfZvO41pWmEL1xfvGbgJqw',
    'Cezary',
    'Gawron',
    'CG',
    'cezary_gawron@hotmail.com',
    '+48 550 054 810',
    'pl. Rutkowski 621, Lewin Brzeski',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'yRVFTfkkZuok30DfPOstuJgGBBL',
    'Paweł',
    'Janik',
    'PJ',
    'pawe8y.janik@yahoo.com',
    '+48 693 304 238',
    'wyspa Wypych 115, Dobrzyń nad Wisłą',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'pn6ZS7yD4aj2eX6AZIwoyGyQL33',
    'Salomon',
    'Sawicki',
    'SS',
    'salomon.sawicki49@hotmail.com',
    '+48 541 159 376',
    'wyspa Pietras 4/3, Barcin',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Iv7vgW2TP9eyYi4P7bwf4LYOpob',
    'Jerzy',
    'Olczak',
    'JO',
    'jerzy_olczak@gmail.com',
    '+48 843 383 204',
    'pl. Kosiński 83c, Międzyzdroje',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'ddOkWgQjp9pXqQNuFqUVJZK2G0y',
    'Eliasz',
    'Kisiel',
    'EK',
    'eliasz_kisiel65@hotmail.com',
    '+48 311 804 185',
    'ogród Zawada 89, Władysławowo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Pkt5O61fbAE1py8ErvQ32ZO1a0m',
    'Horacy',
    'Kaszuba',
    'HK',
    'horacy_kaszuba94@yahoo.com',
    '+48 729 066 619',
    'droga Jurkowski 41b, Ełk',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Dk3URKOWAZnl99GMPg32OhBdGst',
    'Alfred',
    'Koza',
    'AK',
    'alfred_koza@yahoo.com',
    '+48 293 504 882',
    'ogród Błaszczyk 48a, Bytów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'cPQKYqCvgpYm1o2tzIDlFr67yfq',
    'Edmund',
    'Gwoździk',
    'EG',
    'edmund_gwozdzik@yahoo.com',
    '+48 317 362 091',
    'wyspa Pietrzak 82b, Miłosław',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'S05G1dQXAIfx3tZYV45bLuP8iIW',
    'Nestor',
    'Niewiadomski',
    'NN',
    'nestor_niewiadomski42@yahoo.com',
    '+48 726 267 201',
    'rynek Sadowski 59a, Koszalin',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Ojm70iMF0XqxZV5YNbOE5J5AzRW',
    'Tobiasz',
    'Podgórski',
    'TP',
    'tobiasz_podgorski29@yahoo.com',
    '+48 226 650 736',
    'rondo Błaszczyk 96c, Choszczno',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'cqC7x6TaX536aXEdo2UgFJctoaj',
    'Łazarz',
    'Surma',
    'ŁS',
    '8xazarz.surma@gmail.com',
    '+48 631 615 677',
    'wyb. Olszewski 12, Maszewo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'LVAezSLO7sPOeRe3owex9TbaOK7',
    'Mikołaj',
    'Frankowski',
    'MF',
    'miko8yaj_frankowski@yahoo.com',
    '+48 030 773 637',
    'pl. Górny 693, Brusy',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    '4TdpmHw7syAi2PWawfTow1y5oH8',
    'Błażej',
    'Gałązka',
    'BG',
    'b8yazej_ga8yazka@gmail.com',
    '+48 538 505 932',
    'droga Niedziela 975, Środa Wielkopolska',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'cZB3blWEf4RABCN3OVTNq9V34ZZ',
    'Miron',
    'Bielski',
    'MB',
    'miron_bielski38@hotmail.com',
    '+48 408 853 758',
    'rynek Krawczyk 5/6, Grudziądz',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Y40fdPUP1KA6xbjJOE6BngXTv4H',
    'Ksenofont',
    'Biedrzyński',
    'KB',
    'ksenofont.biedrzynski@gmail.com',
    '+48 609 820 111',
    'rondo Żak 91c, Lębork',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'z8fO89wsuzCMfTPMaZATYZDk1Lm',
    'Rajmund',
    'Gwoździk',
    'RG',
    'rajmund_gwozdzik22@yahoo.com',
    '+48 491 737 458',
    'ul. Puchalski 454, Nowogard',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'YPWtC1rZtboQkuZBGCFIYaQc55A',
    'Emil',
    'Milewski',
    'EM',
    'emil_milewski61@yahoo.com',
    '+48 124 552 042',
    'szosa Włodarczyk 50, Poniatowa',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'FD8rVfEklJPDyevImlgxO8fjZCV',
    'Donald',
    'Kozieł',
    'DK',
    'donald.kozie8y@yahoo.com',
    '+48 790 184 566',
    'wyspa Janowski 1/3, Wejherowo',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Irrl9gwgKVeV7Jnr8xKfkowJr8h',
    'Izajasz',
    'Sitek',
    'IS',
    'izajasz.sitek26@gmail.com',
    '+48 793 788 193',
    'os. Cichocki 38, Tykocin',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'si6Ps2xgdGFwImO80XyMMLWRsVV',
    'Nestor',
    'Urbaniak',
    'NU',
    'nestor.urbaniak71@gmail.com',
    '+48 831 851 756',
    'pl. Rojek 866, Krzeszowice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'PD0uqkA74ivQ7VLNci62zE3B2On',
    'Zachary',
    'Bożek',
    'ZB',
    'zachary_bozek41@hotmail.com',
    '+48 718 644 275',
    'os. Kubica 4/1, Gostynin',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'p0JEE4BYIPNsuUK6x3IIJAm7d74',
    'Janusz',
    'Majka',
    'JM',
    'janusz_majka@yahoo.com',
    '+48 494 972 598',
    'bulw. Adamiec 38a, Kowary',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'AJVnje9X5NP2GxxL2BOw8l6yNmL',
    'Daniel',
    'Małek',
    'DM',
    'daniel_ma8yek@gmail.com',
    '+48 180 579 988',
    'droga Kopeć 51a, Ruda Śląska',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'pCTnB6sLg1gJ3bEN49I5u0T7JvA',
    'Dariusz',
    'Wąsik',
    'DW',
    'dariusz_wasik@yahoo.com',
    '+48 033 631 583',
    'bulw. Jaworski 66b, Krzeszowice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'LxRULuZloLQqMnwcjnqO3OfRkMd',
    'Dionizy',
    'Michalak',
    'DM',
    'dionizy_michalak53@yahoo.com',
    '+48 193 373 975',
    'wyb. Kwieciński 79, Łęczyca',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Y9jbjlyZLe4t7KobOTqLr5mqBQA',
    'Polikarp',
    'Gawron',
    'PG',
    'polikarp_gawron48@gmail.com',
    '+48 979 448 572',
    'pl. Adamczak 926, Świętochłowice',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'cyjvlaBfcbUWKWCnB5ReRHYLvvV',
    'Korneli',
    'Furman',
    'KF',
    'korneli.furman@gmail.com',
    '+48 864 979 520',
    'szosa Matuszak 61b, Lewin Brzeski',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Z723p72RqGQ2RZZKJ6M6lxyrbhH',
    'Paweł',
    'Laskowski',
    'PL',
    'pawe8y_laskowski@hotmail.com',
    '+48 740 956 244',
    'bulw. Guzik 57, Brusy',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'Z7alPsetc8JCulfIBkTDc2KT9zC',
    'Jeremiasz',
    'Skrzypczak',
    'JS',
    'jeremiasz.skrzypczak92@gmail.com',
    '+48 496 523 855',
    'bulw. Kopeć 16b, Wołów',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

INSERT INTO core.customer (
    id,
    first_name,
    last_name,
    display_abbreviation,
    email,
    phone_number,
    address,
    language_id,
    created_at,
    created_by
) VALUES (
    'lvCnj3OHIydiyNnQrBwDKkObRkE',
    'Demetriusz',
    'Krzemiński',
    'DK',
    'demetriusz.krzeminski3@hotmail.com',
    '+48 880 593 819',
    'szosa Knapik 3/3, Ryki',
    '34tGCTRFFu4D4RA87Ag2McaV92N',
    1725824055,
    '2imfnAVjkbfcwEos1LLLztn1vEP'
);

