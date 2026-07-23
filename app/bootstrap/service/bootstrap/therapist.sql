-- Insert sample therapists for Cypress testing
INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('2testTherapist001XyZ12345',
        '2therapistUser001XyZ12345',
        '#1E88E5',
        '{"en": "Clinical Psychologist", "pl": "Psycholog Kliniczny"}',
        '{"en": "Specialized in cognitive behavioral therapy and anxiety disorders", "pl": "Specjalizuje się w terapii poznawczo-behawioralnej i zaburzeniach lękowych"}',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N", "34tGCReab2xRBh9tOnVkyzBiAWq"}',
        true,
        true,
        true,
        'dr-anna-kowalska',
        '{"en": "Expert clinical psychologist specializing in CBT", "pl": "Ekspert psycholog kliniczny specjalizujący się w CBT"}',
        'anna.kowalska@example.com',
        1725824055,
        40,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            contact_phone,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('2testTherapist002XyZ98765',
        '2therapistUser002XyZ98765',
        '#43A047',
        '{"en": "Family Therapist", "pl": "Terapeuta Rodzinny"}',
        '{"en": "Helping families navigate difficult transitions and improve communication", "pl": "Pomoc rodzinom w nawigacji w trudnych przejściach i poprawie komunikacji"}',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N", "34tGCReab2xRBh9tOnVkyzBiAWq", "34tGCQfR8R75qwKcmXWgHLubkx4"}',
        true,
        false,
        true,
        'jan-nowak-family-therapy',
        '{"en": "Experienced family therapist helping families thrive", "pl": "Doświadczony terapeuta rodzinny pomagający rodzinom prosperować"}',
        'jan.nowak@example.com',
        '+48 123 456 789',
        1725824055,
        40,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('2testTherapist003XyZ11122',
        '2therapistUser003XyZ11122',
        '#E53935',
        '{"en": "Child Psychologist", "pl": "Psycholog Dziecięcy"}',
        '{"en": "Supporting children and adolescents through emotional and behavioral challenges", "pl": "Wspieranie dzieci i młodzieży przez wyzwania emocjonalne i behawioralne"}',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N", "34tGCReab2xRBh9tOnVkyzBiAWq"}',
        false,
        true,
        false,
        'maria-wisniewski-child-psych',
        '{"en": "Child psychologist specializing in developmental issues", "pl": "Psycholog dziecięcy specjalizujący się w problemach rozwojowych"}',
        'maria.wisniewski@example.com',
        1725824055,
        40,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Marta Kuczek
INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            contact_phone,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('37A2DsWyvK8MkkAOlBn9v4NzzDt',
        '37A2DuqbLObIGm0ntN8CSyeK1Sp',
        '#6D4C41',
        '{
          "en": "Cognitive Behavioral Therapist",
          "pl": "Terapeutka Poznawczo-Behawioralna"
        }',
        '{
          "en": "## Cognitive-Behavioral Psychologist and Psychotherapist\nPsychologist, certified cognitive-behavioral psychotherapist (Certificate of Cognitive-Behavioral Psychotherapist of the Polish Society for Cognitive and Behavioral Therapy No. 945).\n\nShe completed a four-year training program recommended by the Polish Society for Cognitive and Behavioral Therapy. She graduated with a degree in psychology from the Jagiellonian University, where she specialized in clinical psychology. She is also currently a doctoral candidate at the Institute of Psychology at the Faculty of Philosophy of the Jagiellonian University.\n\nShe gained clinical experience at various locations, including the University Hospital and the L. Rydygier Hospital in Krakow, as well as working as a community psychologist. Her professional interests include the treatment of affective and anxiety disorders. She regularly supervises her work and actively participates in scientific conferences and training courses in psychotherapy. In my therapeutic work, I utilize techniques from classic cognitive behavioral therapy, as well as methods related to schema therapy and ACT.\n\n\"For me, the therapeutic process is a partnership in which both the patient and the therapist work together to develop solutions to the problems presented. Therefore, I place great importance on my own work between sessions. In my therapeutic practice, I strive to best adapt therapeutic interventions and techniques to the difficulties the patient is experiencing.\"",
          "pl": "## Psycholog i psychoterapeutka poznawczo-behawioralna\nPsycholog, certyfikowana psychoterapeutka poznawczo-behawioralna (Certyfikat Psychoterapeuty Poznawczo-Behawioralnego Polskiego Towarzystwa Terapii Poznawczej i Behawioralnej nr 945).\n\nUkończyła czteroletnie szkolenie rekomendowane przez Polskie Towarzystwo Terapii Poznawczej i Behawioralnej. Absolwentka psychologii na Uniwersytecie Jagiellońskim, gdzie realizowała ścieżkę specjalizacyjną z psychologii klinicznej. Obecnie również doktorantka w Instytucie Psychologii na Wydziale Filozoficznym UJ.\n\nDoświadczenie kliniczne zdobywała m.in. w Szpitalu Uniwersyteckim oraz w Szpitalu im. L. Rydygiera w Krakowie, a także pracując jako psycholog środowiskowy. Zawodowo interesuje się terapią zaburzeń afektywnych i lękowych. Swoją pracę poddaje regularnej superwizji, aktywnie uczestniczy również w konferencjach naukowych oraz szkoleniach z zakresu psychoterapii. W pracy terapeutycznej stosuje techniki klasycznej terapii poznawczo-behawioralnej oraz metody związane z terapią schematów i terapią ACT.\n\n\"Proces terapeutyczny wiąże się dla mnie z partnerstwem, w którym zarówno pacjent, jak i terapeuta starają się wspólnie wypracować rozwiązanie dla wniesionych problemów. W związku z tym dużą wagę przykładam do pracy własnej, wykonywanej pomiędzy sesjami. W praktyce terapeutycznej staram się jak najlepiej dopasować oddziaływania i techniki terapeutyczne do trudności przejawianych przez pacjenta.\""
        }',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
        true,
        true,
        true,
        'dr-marta-kuczek',
        '{
          "en": "Experienced cognitive-behavioral psychologist and psychotherapist specializing in the treatment of affective and anxiety disorders, integrating CBT, schema therapy, and ACT.",
          "pl": "Doświadczona psycholog i psychoterapeutka poznawczo-behawioralna, specjalizująca się w terapii zaburzeń afektywnych i lękowych, łącząca CBT, terapię schematów oraz ACT."
        }',
        'marta.kuczek@gmail.com',
        '+48786907645',
        1725824055,
        0,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Katarzyna Kowara
INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            contact_phone,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('37A59rkAmWqYRz9HtgYtGhITdSl',
        '37A59voVWpAVpBwm7jdKpZn2jDx',
        '#546E7A',
        '{"en":"Psychoanalytic Therapist","pl":"Terapeutka Psychoanalityczna"}',
        '{
          "en": "## Psychoanalytic Psychologist and Psychotherapist\nPsychologist, sexologist, and certified psychotherapist of the Polish Psychiatric Association (certificate number 968).\n\nShe practices psychodynamic, psychoanalytical, and integrative psychotherapy. She graduated in psychology from the Faculty of Philosophy of the Jagiellonian University. She is currently also participating in the Psychotherapy Course for Sexual Disorders.\n\nIn her daily clinical practice, she provides individual psychotherapy for adults and adolescents, as well as sex therapy and assessment for adults and couples.\n\nShe has four years of experience working at the Clinical Department of Adult Psychiatry at the Jagiellonian University Medical College in Krakow and has also worked at the \"Feniks\" Day Care Unit for Personality Disorders in Katowice.\n\nShe currently collaborates with the Synteza Therapy Center. She works individually and with groups.\n\nShe also specializes in integrating psychedelic experiences and psychoeducation, as well as sex education.\n\nShe is a member of the Scientific Section of Psychotherapy of the Polish Psychiatric Association and places particular emphasis on professional ethics and substantive, evidence-based work methods.\n\nShe regularly supervises her work. She is currently participating in Level I Training in Jungian Analysis.\n\nShe specializes in the treatment of individuals with ADHD and offers training in psychotherapy.\n\n\"I believe that psychoanalytic psychotherapy is a method that leads to gaining or regaining freedom. Freedom in accepting one''s history and conditioning, and freedom from the compulsion to repeat situations that cause suffering. Analysis helps create a vessel in which one can know and accept one''s whole self.\"",
          "pl": "## Psycholożka i psychoterapeutka psychoanalityczna\nPsycholożka, seksuolożka i certyfikowana psychoterapeutka Polskiego Towarzystwa Psychiatrycznego (numer certyfikatu 968).\n\nPracuje psychodynamicznie, psychoanalitycznie i integracyjnie. Jest absolwentką psychologii na Wydziale Filozoficznym Uniwersytetu Jagiellońskiego. Obecnie uczestniczy także w Kursie Psychoterapii Zaburzeń Seksualnych.\n\nW swojej codziennej praktyce klinicznej zajmuje się psychoterapią indywidualną dorosłych i młodzieży, terapią i diagnostyką seksuologiczną osób dorosłych i par.\n\nMa 4 letnie doświadczenie pracy na Oddziale Klinicznym Psychiatrii Dorosłych CM UJ w Krakowie, pracowała także w Oddziale Dziennym Leczenia Zaburzeń Osobowości „Feniks” w Katowicach.\n\nObecnie współpracuje z Centrum Terapii Synteza. Pracuje indywidualnie i z grupami.\n\nZajmuje się także integracją doświadczeń psychodelicznych oraz psychoedukacją, a także edukacją seksualną.\n\nJest członkinią Sekcji Naukowej Psychoterapii Polskiego Towarzystwa Psychiatrycznego i kładzie szczególny nacisk na etykę zawodową oraz merytoryczne, oparte na dowodach metody pracy.\n\nSwoją pracę poddaje regularnej superwizji. Obecnie uczestniczy w Szkoleniu I stopnia w Analizie Jungowskiej.\n\nTerapeutka zajmuje się terapią osób z ADHD oraz przyjmuje na psychoterapię treningową.\n\n\"Uważam, że psychoterapia psychoanalityczna to metoda prowadząca do uzyskania lub odzyskania wolności. Wolności w przyjęciu swojej historii i uwarunkowań oraz wolności od przymusu powtarzania sytuacji wywołujących cierpienie. Analiza pomaga stworzyć naczynie w którym można poznać i przyjąć całą/całego siebie.\""
        }',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
        true,
        true,
        true,
        'katarzyna-kowara',
        '{
          "en": "Certified psychoanalytic psychotherapist and sexologist (PPA No. 968) offering psychodynamic, psychoanalytic and integrative therapy for adults and adolescents, including sex therapy and ADHD-focused work.",
          "pl": "Certyfikowana psychoterapeutka psychoanalityczna i seksuolożka (PTP nr 968), prowadząca terapię psychodynamiczną, psychoanalityczną i integracyjną dla dorosłych i młodzieży, w tym terapię seksuologiczną oraz pracę z osobami z ADHD."
        }',
        'katkowara@gmail.com',
        '+48786907645',
        1725824055,
        0,
        '2imfnAVjkbfcwEos1LLLztn1vEP');


-- Natalia Wójcik
INSERT INTO core.therapist (id,
                            user_id,
                            display_color,
                            professional_title,
                            description,
                            language_ids,
                            in_person_therapy_format,
                            online_therapy_format,
                            is_accepting_new_clients,
                            slug,
                            meta_description,
                            contact_email,
                            contact_phone,
                            created_at,
                            percentage_profit_sharing,
                            created_by)
VALUES ('37A9iijLsh4gMdDmje6ajqstr6o',
        '37A9ikRTZcmhUJv0ydgEtJnnfJZ',
        '#7CB342',
        '{"en":"Cognitive Behavioral Therapist","pl":"Terapeutka Poznawczo-Behawioralna"}',
        '{
          "en": "## Psychologist, Cognitive-Behavioral and Schema Therapist\nPsychotherapist and PhD in Psychology. She graduated in Psychology from the Jagiellonian University in Krakow, where she also earned her PhD in the field.\n\nShe is currently an assistant professor at SWPS University of Social Sciences and Humanities. She completed a comprehensive 4-year training program in accordance with the standards of the European Association for Behavioral and Cognitive Psychotherapies and obtained PTTPB Certificate No. 1378. She also completed comprehensive training in Schema Therapy recommended by ISST. She has also trained in ACT therapy. She is currently undergoing comprehensive training in Somatic Experiencing (SE). She has also trained in the integration of psychedelic experiences. She is a member of the Polish Association for Cognitive and Behavioral Therapy (PTTPB). She regularly supervises her work individually and in groups within cognitive-behavioral therapy, schema therapy, and SE.\n\nShe gained clinical experience at institutions including the University Hospital and Babinski Hospital in Krakow. She is actively involved in research and teaching (SWPS University of Social Sciences and the University of Social Sciences), and has authored and co-authored scientific publications (including \"Psychological Science\" and \"Personality and Individual Differences\").\n\nShe embraces a humanistic and neurobiological approach to therapy. She is particularly interested in topics related to self-regulation, bonding, traumatic experiences, and neurodiversity. Privately, she enjoys hiking in the mountains and forests, taking photos and collages, and spending time with loved ones and her cat.\n\n\"An individualized approach to each patient, based on committed collaboration, is crucial to me. While accepting the patient''s whole self at every stage of the relationship and deepening understanding of the problem, consistent work toward change is crucial for me, aiming to improve functioning in areas that have previously been associated with suffering.\"",
          "pl": "## Psycholożka, psychoterapeutka poznawczo-behawioralna i schematów\nPsychoterapeutka i doktor psychologii. Ukończyła psychologię na Uniwersytecie Jagiellońskim w Krakowie, gdzie również obroniła doktorat w tej dziedzinie.\n\nAktualnie jest adiunktką na Uniwersytecie SWPS. Ukończyła całościowe 4-letnie szkolenie zgodne ze standardami European Association for Behavioural and Cognitive Psychotherapies i uzyskała Certyfikat PTTPB nr 1378. Ukończyła również całościowe szkolenie z Terapii Schematu rekomendowane przez ISST. Szkoliła się także w terapii ACT. Aktualnie jest w trakcie całościowego szkolenia z metody Somatic Experiencing (SE). Szkoliła się również w zakresie integracji doświadczeń psychodelicznych. Jest członkinią Polskiego Towarzystwa Terapii Poznawczej i Behawioralnej (PTTPB). Swoją pracę poddaje regularnym superwizjom indywidualnym i grupowym w nurcie poznawczo-behawioralnym, terapii schematów i SE.\n\nDoświadczenie kliniczne zdobywała między innymi w Szpitalu Uniwersyteckim oraz Szpitalu im. Babińskiego w Krakowie. Aktywnie pracuje naukowo i dydaktycznie (Uniwersytet SWPS), jest autorką i współautorką publikacji naukowych (m.in. w „Psychological Science”, „Personality and Individual Differences”).\n\nBliskie jest jej humanistyczne i neurobiologiczne podejście do terapii. Interesuje się w szczególności tematami związanymi z samoregulacją, więzią, doświadczeniami traumatycznymi i neuroróżnorodnością. Prywatnie zwolenniczka chodzenia po górach i lasach, robienia zdjęć i kolaży oraz spędzania czasu z bliskimi ludźmi i kotem.\n\n\"Bardzo istotne jest dla mnie indywidualne podejście do pacjenta, które polega na zaangażowanej współpracy. Przy akceptacji całej osoby pacjenta w każdym momencie relacji i pogłębianiu rozumienia problemu, ważna jest dla mnie konsekwentna praca w kierunku zmiany, której celem jest polepszenie funkcjonowania w sferach, które do tej pory wiązały się z cierpieniem\""
        }',
        '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
        true,
        true,
        true,
        'natalia-wojcik',
        '{
          "en": "PhD psychologist and certified CBT and schema therapist integrating ACT and Somatic Experiencing, combining clinical practice with academic research and teaching.",
          "pl": "Doktor psychologii oraz certyfikowana terapeutka CBT i terapii schematów, integrująca ACT i Somatic Experiencing, łącząca praktykę kliniczną z pracą naukową i dydaktyczną."
        }',
        'nwojcik.psychoterapia@gmail.com',
        '+48786907645',
        1725824055,
        0,
        '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Eliza Mleczek
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C5PPIYtSLKpIc4zjd89rHliS1',
           '37C4QrDAGfRePpSeZNIFokcvqsg',
           '#F4511E',
           '{"en":"Systemic and Psychodynamic Therapist","pl":"Terapeutka Systemowa i Psychodynamiczna"}',
           '{
             "en": "## Psychologist, Systemic and Psychodynamic Therapist\nPsychologist, graduate of applied psychology at Jagiellonian University. Currently, she is completing a comprehensive, 5-year psychotherapy course with the Foundation for the Development of Family Therapy \"Na Szlaku,\" preparing for certification by the Polish Psychiatric Association.\n\nShe works based on psychodynamic and systemic approaches. She collaborates with the Municipal Social Welfare Center and the Krakow Institute of Psychotherapy. Her work is regularly supervised.\n\n\"For me, psychotherapy is a process in which, through collaborative work, it is possible to gain a new understanding of oneself and apply this knowledge in various areas of life – especially those related to suffering and dissatisfaction. Creating a safe and respectful atmosphere that facilitates the development of an authentic therapeutic relationship is important to me.\"",
             "pl": "## Psycholożka, terapeutka systemowa i psychodynamiczna\nPsycholożka, absolwentka psychologii stosowanej na Uniwersytecie Jagiellońskim. Obecnie w trakcie całościowego, 5-letniego kursu psychoterapii Fundacji Rozwoju Terapii Rodzin „Na Szlaku”, przygotowującego do uzyskania certyfikatu Polskiego Towarzystwa Psychiatrycznego.\n\nPracuje w oparciu o podejścia psychodynamiczne oraz systemowe. Współpracuje z Gminnym Ośrodkiem Pomocy Społecznej oraz z Krakowskim Instytutem Psychoterapii. Swoją pracę poddaje regularnej superwizji.\n\n\"Psychoterapia jest dla mnie procesem, w którym, dzięki wspólnej pracy, możliwe jest uzyskanie nowego rozumienia siebie i wykorzystanie tej wiedzy w różnych obszarach życia – zwłaszcza tych, które wiążą się z cierpieniem i niezadowoleniem. Ważne jest dla mnie tworzenie bezpiecznej i pełnej szacunku atmosfery, która umożliwia budowanie autentycznej relacji terapeutycznej.\""
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'eliza-mleczek',
           '{
             "en": "Psychologist and systemic–psychodynamic therapist in training, offering supervised psychotherapy grounded in relational and family-systems approaches.",
             "pl": "Psycholożka oraz terapeutka systemowa i psychodynamiczna w trakcie szkolenia, prowadząca superwizowaną psychoterapię w nurcie relacyjnym i systemowym."
           }',
           'tarkaeliza@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Adam Hałaczkiewicz (data: fundacjabezklamek.pl/adam-halaczkiewicz) :contentReference[oaicite:0]{index=0}
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C790fDP85gbzfMvsrBWwLFozZ',
           '37C6yuezOh2tMDfwLqmgWoKS0tD',
           '#5E35B1',
           '{"en":"CBT Therapist (in training)","pl":"Psychoterapeuta poznawczo-behawioralny (w trakcie szkolenia)"}',
           '{
             "en": "## Psychologist, CBT Therapist (in training)\nPsychologist (Jagiellonian University) and cognitive-behavioral psychotherapist in training. He gained clinical experience, among others, at the Józef Babiński Clinical Hospital in Kraków, where he currently works as a psychologist.\n\nHe works with adults who experience relationship and emotion-regulation difficulties, as well as those struggling with depression, anxiety disorders, or obsessive-compulsive disorder. His professional interests include schizophrenia-spectrum disorders, altered states of consciousness, themes related to death and grief, and approaches based on mindfulness and acceptance.\n\nHe sees psychotherapy as a process of preparing to meet oneself; the therapist’s role is to help create a safe space and accompany the person with mindful presence and authentic engagement.",
             "pl": "## Psycholog, psychoterapeuta poznawczo-behawioralny\nPsycholog (Uniwersytet Jagielloński), psychoterapeuta poznawczo-behawioralny w trakcie szkolenia. Doświadczenie kliniczne zdobywał m.in. w Szpitalu Klinicznym im. Józefa Babińskiego w Krakowie, gdzie pracuje obecnie jako psycholog.\n\nPracuje z osobami dorosłymi, które mają trudności w relacjach i regulacji emocji, zmagają się z depresją, zaburzeniami lękowymi, czy obsesyjno-kompulsyjnymi. Zawodowo interesuje się zaburzeniami z kręgu schizofrenii, odmiennymi stanami świadomości, zagadnieniami z obszarów śmierci i żałoby oraz metodami pracy z uważnością oraz akceptacją.\n\nRozumie terapię jako proces przygotowania do spotkania z samym sobą; rolą terapeuty jest tworzenie bezpiecznej przestrzeni i towarzyszenie w poznawaniu siebie poprzez uważną obecność i autentyczne zaangażowanie."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'adam-halaczkiewicz',
           '{
             "en": "Psychologist and CBT therapist in training working with adults on relationships, emotion regulation, depression, anxiety and OCD, using mindfulness and acceptance-oriented methods.",
             "pl": "Psycholog i terapeuta CBT w trakcie szkolenia, pracujący z dorosłymi nad relacjami i regulacją emocji oraz w obszarze depresji, lęku i OCD, z wykorzystaniem uważności i akceptacji."
           }',
           'adameusz.halaczkiewicz@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Kinga Wołoszyn-Hohol
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C7ZVq9oG42k8ofNu8OPUl0Yuw',
           '37C7ZTHn6XnIOAAQ1pqws9dXNzT',
           '#00897B',
           '{"en":"Cognitive-Behavioral Therapist (in training)","pl":"Terapeutka poznawczo-behawioralna (w trakcie szkolenia)"}',
           '{
             "en": "## Psychologist and CBT Therapist (in training)\nDr. psychologii, psychoterapeutka w trakcie czteroletniego szkolenia w nurcie poznawczo-behawioralnym (CBT) w Instytucie Poznawczym w Krakowie, rekomendowanym przez Polskie Towarzystwo Terapii Poznawczej i Behawioralnej. Absolwentka psychologii na Uniwersytecie Jagiellońskim. Pracowała m.in. w Szpitalu Uniwersyteckim w Krakowie.\n\nInteresuje się terapią zaburzeń nastroju, zaburzeń lękowych oraz zaburzeń odżywiania u dorosłych. Łączy klasyczną terapię poznawczo-behawioralną z technikami „trzeciej fali”, w tym terapią schematu i ACT. Rozumie terapię jako proces balansu pomiędzy akceptacją trudności a zmianą prowadzącą do życia bardziej satysfakcjonującego i pełnego.",
             "pl": "## Psycholożka i terapeutka poznawczo-behawioralna (w trakcie szkolenia)\nDr psychologii, psychoterapeutka w trakcie czteroletniego szkolenia w nurcie CBT w Instytucie Poznawczym w Krakowie, rekomendowanym przez PTTPB. Absolwentka psychologii Uniwersytetu Jagiellońskiego, z doświadczeniem klinicznym zdobytym m.in. w Szpitalu Uniwersyteckim w Krakowie.\n\nPracuje z dorosłymi z zaburzeniami nastroju, lękowymi i odżywiania, łącząc klasyczne CBT z elementami terapii schematu i ACT. Uważa, że skuteczna terapia to połączenie akceptacji trudności i pracy nad zmianą."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'kinga-woloszyn-hohol',
           '{
             "en":"Dr psychologii and CBT therapist in training combining classic CBT with third-wave methods (schema therapy & ACT), focused on mood, anxiety and eating disorders.",
             "pl":"Dr psychologii oraz terapeutka CBT w trakcie szkolenia, łącząca klasyczne CBT z metodami trzeciej fali (terapia schematu i ACT), pracująca z zaburzeniami nastroju, lękowymi i odżywiania."
           }',
           'kinga.b.woloszyn@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Agnieszka Kliber-Bukańska
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8719FZGmedPIX74sI5QOeEmG',
           '37C875jQIRZtfdNGQN4fsaCAZyJ',
           '#C0CA33',
           '{"en":"Cognitive Behavioral Therapist","pl":"Terapeutka Poznawczo-Behawioralna"}',
           '{
             "en": "## Psychologist and CBT therapist (in training)\nPsychologist, coach, and psychotherapist in a 4-year training program recommended by the Polish Association for Cognitive and Behavioral Therapy.\n\nShe works with adults experiencing mood difficulties, anxiety, obsessive-compulsive symptoms, eating-related difficulties, as well as burnout and stress-related challenges. In her practice she uses classic CBT techniques and third-wave approaches, especially schema therapy and ACT. She is also developing her competence in integrating psychedelic experiences.\n\nShe gained clinical experience at the Dr. Józef Babiński Clinical Hospital in Kraków (where she began her psychotherapy training), the psychiatric ward of the Specialist Hospital in Nowy Sącz, and the Pro Vita outpatient clinic in Kraków.\n\n\"My path to psychotherapy led from a fascination with psychoanalysis to the cognitive-behavioral approach. The most important lesson I took from that journey is that the foundation of a good process is the relationship—authentic, supportive, empathic, and partnership-based. The rest are tools—limited without a strong relationship, and life-changing with it.\"",
             "pl": "## Psycholożka, psychoterapeutka poznawczo-behawioralna\nPsycholożka, coachka i psychoterapeutka w trakcie 4-letniego szkolenia rekomendowanego przez Polskie Towarzystwo Terapii Poznawczej i Behawioralnej.\n\nPracuje z osobami dorosłymi z zaburzeniami nastroju, lękami, zaburzeniami obsesyjno-kompulsywnymi, odżywiania, a także doświadczającymi wypalenia zawodowego czy trudności w radzeniu sobie ze stresem. W swojej pracy wykorzystuje zarówno klasyczne techniki terapii poznawczo – behawioralnej, jak i podejścia tzw. trzeciej fali, szczególnie terapię schematów oraz ACT. Interesuje się i pogłębia swoją wiedzę w obszarze integracji doświadczeń psychodelicznych.\n\nDoświadczenie w pracy z pacjentami zdobywała w Szpitalu Klinicznym im. dr. Józefa Babińskiego w Krakowie (gdzie rozpoczęła swoje kształcenie psychoterapeutyczne), na Oddziale Psychiatrycznym Szpitala Specjalistycznego w Nowym Sączu oraz w krakowskiej poradni Pro Vita.\n\n\"Moja droga ku psychoterapii wiodła od fascynacji psychoanalizą i kształcenia w tym nurcie, po – uważany za jej skrajne przeciwieństwo – nurt poznawczo – behawioralny. Najcenniejszą nauką, jaką wyniosłam z tego okresu jest przekonanie, że fundamentem dobrego procesu jest przede wszystkim relacja – autentyczna, wspierająca, empatyczna i partnerska. Reszta to tylko i aż narzędzia – tylko, bo bez dobrej relacji niewiele zdziałają i aż, bo z nią mogą zmienić życie.\""
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'agnieszka-kliber-bukanska',
           '{
             "en": "Psychologist and CBT therapist in training working with adults on mood, anxiety, OCD, eating difficulties and burnout, integrating CBT with schema therapy and ACT.",
             "pl": "Psycholożka i terapeutka CBT w trakcie szkolenia, pracująca z dorosłymi w obszarze nastroju, lęku, OCD, trudności z jedzeniem oraz wypalenia, łącząca CBT z terapią schematów i ACT."
           }',
           'bukanskaagnieszka@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Karolina Skrobol-Bojarczuk
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G4GeAIdLa5vN69ATFOj3TJz',
           '37C8G2YZPQfpTrBJVDq6GvVoWsi',
           '#FFB300',
           '{"en":"Cognitive-Behavioral Therapist (in training)","pl":"Terapeutka poznawczo-behawioralna (w trakcie szkolenia)"}',
           '{
             "en": "## Psychologist and CBT Therapist (in training)\nPsychologist, psychotherapist in the 4-year training program recommended by the Polish Association for Cognitive and Behavioral Therapy. She is a doctoral candidate at CM UJ and completed psychology studies at the Jagiellonian University. She also holds postgraduate training in Clinical Neuropsychology and Neuropsychological Diagnosis at SWPS.\n\nShe conducts cognitive-behavioral psychotherapy with adolescents and adults experiencing mental health challenges, stress, crises, and somatic conditions. She also works with individuals with cognitive difficulties, including patients after accidents, strokes, or with neurodegenerative conditions. She gained clinical experience at the University Hospital in Kraków and various clinics and rehabilitation centers. She continually expands her competencies via workshops and supervision.",
             "pl": "## Psycholożka i terapeutka poznawczo-behawioralna (w trakcie szkolenia)\nPsycholożka, psychoterapeutka w trakcie 4-letniego szkolenia rekomendowanego przez Polskie Towarzystwo Terapii Poznawczej i Behawioralnej. Doktorantka w Szkole Doktorskiej CM UJ, absolwentka psychologii na Uniwersytecie Jagiellońskim oraz studiów podyplomowych z Neuropsychologii Klinicznej i Diagnozy Neuropsychologicznej na SWPS.\n\nProwadzi psychoterapię poznawczo-behawioralną młodzieży i dorosłych z trudnościami emocjonalnymi, kryzysami oraz problemami adaptacyjnymi, a także diagnozę i terapię neuropsychologiczną. Doświadczenie zdobywała w Szpitalu Uniwersyteckim w Krakowie i poradniach klinicznych, pracując jednocześnie pod stałą superwizją."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'karolina-skrobol-bojarczuk',
           '{
             "en":"Psychologist and CBT therapist in training working with adolescents and adults on mental health, stress and cognitive issues, integrating classic CBT and neuropsychological approaches.",
             "pl":"Psycholożka i terapeutka CBT w trakcie szkolenia, pracująca z młodzieżą i dorosłymi nad zdrowiem psychicznym, stresem i funkcjami poznawczymi, łącząca klasyczne CBT z podejściem neuropsychologicznym."
           }',
           'skrobol.karolinaa@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Joanna Stasielak
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G6AduZeUnCYZXXlDCCObwyC',
           '37C8G5G0r6cyQkPHh88qnomlqMF',
           '#E91E63',
           '{"en":"Systemic and Psychodynamic Therapist","pl":"Terapeutka systemowa i psychodynamiczna"}',
           '{
             "en": "## Psychologist, Systemic and Psychodynamic Therapist\nPsychologist and psychodynamic/systemic psychotherapist in training. She graduated in psychology from SWPS University of Social Sciences and Humanities and the Academy of Physical Education in Kraków. She is completing a 5-year training program in systemic and psychodynamic psychotherapy with the Foundation for the Development of Family Therapy \"Na Szlaku.\" She is also pursuing a specialization in clinical psychology at the University Clinical Hospital at the Jagiellonian University in Kraków. She is a member of the Scientific Section of Family Therapy of the Polish Psychiatric Association.\n\nShe is associated with the Child and Adolescent Psychological Clinic at the Rydygier Hospital in Kraków and has extensive experience from working in schools. She provides psychotherapy to both adolescents and adults, gaining experience through clinical internships at the Family Therapy Outpatient Clinic and the Adult, Child and Adolescent Psychiatry Department at the University Clinical Hospital in Kraków.\n\n\"For me, psychotherapy is accompanying and following the person in discovering themselves, their needs, and values. In this personal — often very challenging — journey, psychotherapy becomes a space where one can be authentic, and through rediscovering oneself, find peace, balance, and hope.\"",
             "pl": "## Psycholożka, Terapeutka systemowa i psychodynamiczna\nPsycholożka i psychoterapeutka systemowa oraz psychodynamiczna w trakcie szkolenia. Absolwentka psychologii na Uniwersytecie SWPS oraz Akademii Wychowania Fizycznego w Krakowie. Realizuje 5-letnie szkolenie z psychoterapii psychodynamicznej i systemowej w Fundacji Rozwoju Terapii Rodzin \"Na Szlaku\". Aktualnie specjalizuje się w psychologii klinicznej w Klinice Uniwersyteckiej UJ w Krakowie. Jest członkinią Sekcji Naukowej Terapii Rodzin Polskiego Towarzystwa Psychiatrycznego.\n\nZwiązana jest z Poradnią Psychologiczną dla Dzieci i Młodzieży w Szpitalu im. Rydygiera w Krakowie. Przez wiele lat pracowała w szkole. Prowadzi psychoterapię młodzieży oraz dorosłych, zdobywając doświadczenie m.in. na stażach w Ambulatorium Terapii Rodzin oraz na Oddziale Klinicznym Psychiatrii Dorosłych, Dzieci i Młodzieży Szpitala Uniwersyteckiego w Krakowie.\n\n\"Psychoterapia jest dla mnie towarzyszeniem i podążaniem za człowiekiem w odkrywaniu siebie, swoich potrzeb i wartości. W tej osobistej — często bardzo trudnej — drodze psychoterapia staje się przestrzenią, w której można być autentycznym i odnaleźć spokój, równowagę i nadzieję.\""
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'joanna-stasielak',
           '{
             "en":"Psychologist and systemic/psychodynamic therapist in training working with adolescents and adults to support self-discovery, balance, and hope.",
             "pl":"Psycholożka oraz terapeutka systemowa i psychodynamiczna w trakcie szkolenia, pracująca z młodzieżą i dorosłymi nad rozwojem autentyczności, równowagi i nadziei."
           }',
           'joanna.stasielak@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Iwona Jeziorska
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G7Qa5bQ34Nt7xpJlxowdB1C',
           '37C8G2m417AQm8dODkpUoBrEyin',
           '#3949AB',
           '{"en":"CBT and Schema Therapist","pl":"Terapeutka poznawczo-behawioralna i schematów"}',
           '{
             "en": "## CBT and Schema Therapist\nEducator (pedagogue) and cognitive-behavioral psychotherapist (completed a comprehensive 4-year training; PTTPB certificate No. 2240). Motivational interviewing therapist and community-therapy specialist. She graduated in pedagogy at the Maria Grzegorzewska University (Academy of Special Education) in Warsaw. She gained clinical and professional experience across more than 25 years of work, including at the Institute of Psychiatry and Neurology in Warsaw (First Psychiatric Clinic) and in NGOs supporting people with mental health difficulties.\n\nFor many years she served as head of a Community Therapy Center, promoting and supporting the development of community psychiatry. She is currently in schema therapy training at an ISST-recommended center.\n\nIn individual work she primarily uses CBT techniques, motivational interviewing, and third-wave methods, as well as other approaches supporting quality-of-life change and resource-based work. She helps rebuild areas of life that have been disrupted by crisis. She supports adults experiencing depression, anxiety disorders, low self-esteem, burnout, relationship difficulties, and people after psychotic crises.\n\nShe works under continuous supervision (individual and group) of certified CBT supervisors and actively participates in trainings and conferences in psychiatry and psychotherapy.\n\n> In therapeutic work, methods, techniques and strategies learned over years are helpful, but above all the most important is the person. In a meeting of one person with another there is a force that drives change and opens new possibilities.",
             "pl": "## Terapeutka poznawczo-behawioralna i schematów\nPedagog, psychoterapeutka poznawczo-behawioralna (ukończyła 4-letnie całościowe szkolenie, Certyfikat PTTPB nr 2240), terapeutka dialogu motywującego, specjalista terapii środowiskowej. Ukończyła pedagogikę na Akademii Pedagogiki Specjalnej w Warszawie. Doświadczenie kliniczne i zawodowe zdobywała w ponad 25-letniej pracy między innymi w Instytucie Psychiatrii i Neurologii w Warszawie (I Klinika Psychiatryczna) oraz organizacjach pozarządowych działających na rzecz osób z zaburzeniami psychicznymi.\n\nPrzez wiele lat pełniła funkcję kierownika Ośrodka Terapii w Środowisku, propagując i wspierając idee związane z rozwojem psychiatrii środowiskowej. Aktualnie jest w trakcie szkolenia z terapii schematów w ośrodku rekomendowanym przez ISST.\n\nW pracy indywidualnej wykorzystuje przede wszystkim techniki terapii poznawczo-behawioralnej, dialogu motywującego i metody III fali oraz inne mające znaczenie w procesie zmiany jakości życia i wykorzystujące zasoby. Pomaga w pracy nad odbudowaniem tych obszarów życia, które zostały naruszone lub zniszczone przez szeroko rozumiany kryzys. Wspiera dorosłe osoby, które zmagają się z depresją, zaburzeniami lękowymi, niską samooceną, wypaleniem, trudnościami w relacjach oraz osoby po kryzysach psychotycznych.\n\nPracuje pod stałą superwizją (indywidualną i grupową) certyfikowanych superwizorów poznawczo-behawioralnych oraz aktywnie uczestniczy w szkoleniach, konferencjach z zakresu psychiatrii i psychoterapii, starając się cały czas podnosić swoje kompetencje zawodowe.\n\n> W pracy terapeutycznej ważne i pomocne są wszelkie metody, techniki oraz strategie, których uczymy się przez wiele lat, ale przede wszystkim najważniejszy jest człowiek. Człowiek, który przychodzi na spotkanie w jakimś celu i z jakiś powodów, najczęściej do czegoś dąży, potrzebuje i czegoś nie może, nie jest w stanie, nie potrafi. W spotkaniu człowieka z człowiekiem jest siła napędzająca zmianę i otwierająca nowe możliwości."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'iwona-jeziorska',
           '{
             "en":"CBT psychotherapist (PTTPB No. 2240) and schema-therapy trainee integrating motivational interviewing and third-wave methods, supporting adults in depression, anxiety, burnout, relationships and post-psychotic crises.",
             "pl":"Psychoterapeutka CBT (PTTPB nr 2240) i terapeutka schematów w trakcie szkolenia, łącząca dialog motywujący i metody III fali; wspiera dorosłych w depresji, lęku, wypaleniu, trudnościach relacyjnych i po kryzysach psychotycznych."
           }',
           'ij1977@wp.pl',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Justyna Krupa
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G4uSjx2XJJGJfyZLnXHqBoH',
           '37C8G49o4r4x9kuB7ybuRVyh1sC',
           '#039BE5',
           '{"en":"Psychodietitian","pl":"Psychodietetyk"}',
           '{
             "en": "## Psychodietitian\nPsychodietetics specialist, a postgraduate graduate of SWPS University and a six-month intern at the National Center for Eating Disorders in Wrocław.\n\nShe supports people struggling with overeating, compulsive eating, and eating in response to stress and emotions. She provides psycho-dietetic education, plans balanced nutrition programs tailored to preferences, and supports returning to a healthier relationship with food.\n\n\"In my work I focus on restoring balance between eating and emotions. I support rebuilding a healthy relationship with food and help free oneself from overeating by strengthening motivation for lasting change in eating habits. I mainly use techniques and tools from motivational interviewing.\"",
             "pl": "## Psychodietetyk\nSpecjalistka psychodietetyki, absolwentka studiów podyplomowych na Uniwersytecie SWPS oraz sześciomiesięcznego stażu w Ogólnopolskim Centrum Zaburzeń Odżywiania we Wrocławiu.\n\nPomaga w problemach związanych z objadaniem się, kompulsywnym jedzeniem, zajadaniem stresu i emocji. Prowadzi edukację psychodietetyczną, planuje zbilansowane, dobrane do upodobań i preferencji programy żywieniowe oraz wspiera w powrocie na właściwą ścieżkę odżywiania.\n\n\"W swojej pracy skupiam się na próbie przywrócenia równowagi między jedzeniem i emocjami. Wspieram proces przywracania prawidłowej relacji z jedzeniem, pomagam uwolnić się od objadania się wspólnie pracując nad wzmocnieniem motywacji do trwałej zmiany przyzwyczajeń żywieniowych. Na co dzień korzystam głównie z technik i narzędzi zaczerpniętych z dialogu motywującego.\""
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'justyna-krupa',
           '{
             "en":"Psychodietitian supporting people with overeating and compulsive eating, focusing on the link between emotions and food, using motivational interviewing and tailored nutrition plans.",
             "pl":"Psychodietetyczka wspierająca osoby z objadaniem się i kompulsywnym jedzeniem, pracująca nad relacją jedzenie–emocje, z wykorzystaniem dialogu motywującego i dopasowanych planów żywieniowych."
           }',
           'kontakt@fundacjabezklamek.pl',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Sarnecka
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G5lD7YO2efVWeYeALEA6L14',
           '37C8G6CNhTalG7T0eO6jbDz828q',
           '#00BCD4',
           '{"en":"Cognitive-Behavioral Therapist in training","pl":"Terapeutka poznawczo-behawioralna (w trakcie szkolenia)"}',
           '{
             "en": "## CBT & Schema Therapist in Training\nPsychologist and cognitive-behavioral psychotherapist in training (completing a 4-year course recommended by PTTPiB), member of the Polish Association for Cognitive and Behavioral Therapy, certified in Motivational Interviewing and Social Skills Training. She graduated in Psychology from the Jagiellonian University (Clinical and Health Psychology), and works with adults facing emotional difficulties, anxiety, worries, mood fluctuations, perfectionism and life transitions, using CBT, schema therapy elements, ACT and compassion-focused methods under ongoing supervision.\n\nShe emphasizes an authentic therapeutic relationship, acceptance and partnership to help clients understand themselves better and facilitate meaningful, values-aligned change.",
             "pl": "## Terapeutka poznawczo-behawioralna (w trakcie szkolenia)\nPsycholożka i psychoterapeutka poznawczo-behawioralna w trakcie całościowego 4-letniego szkolenia rekomendowanego przez PTTPiB, członkini Polskiego Towarzystwa Terapii Poznawczej i Behawioralnej, certyfikowana w dialogu motywującym i treningu umiejętności społecznych. Ukończyła Psychologię na Uniwersytecie Jagiellońskim (Psychologia Kliniczna i Zdrowia). Pracuje z dorosłymi osobami doświadczającymi trudności emocjonalnych, lęku, wahań nastroju, trudności w relacjach, pracoholizmu i zmiany życiowej, wykorzystując CBT, elementy terapii schematu, ACT i metody skoncentrowane na współczuciu pod stałą superwizją.\n\nW swojej pracy szczególnie ceni autentyczną relację terapeutyczną, akceptację i partnerstwo, które wspierają lepsze poznanie siebie i wprowadzenie zmian zgodnych z osobistymi celami i wartościami."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'anna-sarnecka',
           '{
             "en":"CBT & Schema therapist in advanced training working with adults on emotional regulation, anxiety, life transitions and self-understanding.",
             "pl":"Terapeutka CBT i terapii schematu w trakcie szkolenia, pracująca z dorosłymi nad regulacją emocji, lękiem, zmianami życiowymi i lepszym poznaniem siebie."
           }',
           'psycholog.anna.sarnecka@gmail.com',
           '+48510656957',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Adam Kovalcsik
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G9uwRtnfEhcElH6Pn5UkZOz',
           '37C8G81n41hGchEibWLJ1ZHLEVT',
           '#009688',
           '{"en":"Psychodynamic Therapist","pl":"Psychoterapeuta psychodynamiczny"}',
           '{
             "en": "## Psychologist and Psychodynamic Psychotherapist\nPsychotherapist and psychologist working in a psychodynamic, psychoanalytic and integrative approach. He gained experience through internships at the University Hospital in Kraków and an Occupational Therapy Workshop. He graduated in Applied Psychology at the Jagiellonian University and completed a comprehensive Psychotherapy Course organized by CM UJ, recommended by the Polish Psychiatric Association. He regularly supervises his work.\n\nHe works individually with adults experiencing emotional crisis, anxiety, loneliness or emptiness; struggling with neurotic, mood or personality disorders; difficulties building stable relationships; and those who want to understand themselves better.\n\nTHERAPY IN ENGLISH: Mr Kovalcsik conducts therapy in English.",
             "pl": "## Psycholog i psychoterapeuta psychodynamiczny\nPsychoterapeuta i psycholog, pracuje w podejściu psychodynamicznym, psychoanalitycznym i integracyjnym. Doświadczenie zdobywał na stażach w Szpitalu Uniwersyteckim w Krakowie i Warsztacie Terapii Zajęciowej. Jest absolwentem psychologii stosowanej na Uniwersytecie Jagiellońskim, ukończył całościowy Kurs Psychoterapii, organizowany przez CM UJ, rekomendowany przez Polskie Towarzystwo Psychiatryczne. Swoją pracę poddaje regularnej superwizji.\n\nPracuje indywidualnie z osobami dorosłymi które znajdują się w kryzysie emocjonalnym, doznają poczucia lęku, osamotnienia, pustki. Zmagają się z zaburzeniami nerwicowymi, nastroju, osobowości, przeżywają trudności w stworzeniu stabilnych relacji, chcą siebie lepiej poznać i zrozumieć.\n\nTHERAPY IN ENGLISH. Mr Kovalcsik conducts therapy in English. If you need more details please contact us via e-mail or call us."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'adam-kovalcsik',
           '{
             "en":"Psychodynamic, psychoanalytic and integrative psychotherapist working with adults in emotional crisis, anxiety, loneliness, and relationship difficulties; therapy available in English.",
             "pl":"Psychoterapeuta psychodynamiczny (psychoanalitycznie i integracyjnie) pracujący z dorosłymi w kryzysie emocjonalnym, lęku, poczuciu osamotnienia i trudnościach relacyjnych; prowadzi terapię także po angielsku."
           }',
           'kovalcsik.adam703@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Maria Smykla
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C8G93iaVRVXgPGD25cgRwu7ft',
           '37C8G8Q8vqasz9sbg5u8y87Kfyg',
           '#4CAF50',
           '{"en":"Psychodynamic Therapist","pl":"Terapeutka Psychodynamiczna"}',
           '{
             "en": "## Psychologist and Psychodynamic Therapist\nPsychologist (Applied Psychology, Jagiellonian University) and psychodynamic psychotherapist. She completed a comprehensive psychotherapy course at the School of Psychodynamic Psychotherapy at the Krakow Psychodynamic Center. She works in the psychodynamic approach using Transference-Focused Psychotherapy (TFP) and regularly supervises her work.\n\nShe continuously develops her competencies through psychological trainings and scientific conferences accredited by the Polish Psychological Association and is a member of the Polish Society of Psychodynamic Psychotherapy. She gained experience, among others, at the Department of Psychotherapy (Jagiellonian University Medical College), the Krakow Institute of Psychotherapy, the Maria Skłodowska-Curie National Research Institute of Oncology, and the Polish Red Cross.\n\nShe invites adults to individual psychotherapy who experience difficulties with emotions, building close relationships, or who struggle with difficult life events. She works with people suffering from depression, anxiety disorders, personality disorders, and those who have experienced domestic and sexual violence.\n\n\"Psychotherapy offers the possibility of getting to know yourself better and understanding your needs. Through joint work with the therapist, a person can notice, understand and modify their patterns of functioning, which influences how they see themselves, relate to others and experience emotions.\"",
             "pl": "## Psycholożka, psychoterapeutka psychodynamiczna\nPsycholożka, absolwentka Psychologii Stosowanej na Uniwersytecie Jagiellońskim oraz psychoterapeutka, ukończyła całościowy kurs psychoterapeutyczny prowadzony przez Szkołę Psychoterapii Psychodynamicznej w Krakowskim Centrum Psychodynamicznym. Pracuje w nurcie psychodynamicznym, stosując metodę Psychoterapii Skoncentrowanej na Przeniesieniu (TFP). Swoją pracę poddaje regularnej superwizji.\n\nStale zdobywa nową wiedzę i podnosi swoje kwalifikacje uczestnicząc w szkoleniach psychologicznych i konferencjach naukowych akredytowanych przez Polskie Towarzystwo Psychologiczne. Jest członkinią Polskiego Towarzystwa Psychoterapii Psychodynamicznej. Swoje doświadczenie zawodowe zdobywała m.in w Katedrze Psychoterapii UJ CM, Krakowskim Instytucie Psychoterapii, w Narodowym Instytucie Onkologii im. Marii Skłodowskiej-Curie oraz Polskim Czerwonym Krzyżu.\n\nNa psychoterapię indywidualną zaprasza osoby dorosłe, które doświadczają trudności w przeżywaniu emocji, budowaniu bliskich relacji lub zmagają się z trudnymi wydarzeniami życiowymi. Pracuje z osobami cierpiącymi z powodu depresji, zaburzeń lękowych, zaburzeń osobowości, doświadczających przemocy domowej i seksualnej.\n\n\"Psychoterapia daje możliwość lepszego poznania siebie i zrozumienia własnych potrzeb. Poprzez wspólną pracę z terapeutą, pacjent jest w stanie dostrzec, zrozumieć i zmodyfikować swoje wzorce funkcjonowania, co przekłada się na to jak postrzega siebie, wchodzi w relacje czy przeżywa emocje.\""
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'maria-smykla',
           '{
             "en":"Psychodynamic therapist (TFP) offering supervised individual psychotherapy for adults, supporting difficulties with emotions and relationships, depression, anxiety, personality disorders and experiences of domestic or sexual violence.",
             "pl":"Psychoterapeutka psychodynamiczna (TFP) prowadząca superwizowaną psychoterapię indywidualną dorosłych; wspiera w trudnościach emocjonalnych i relacyjnych oraz w depresji, lęku, zaburzeniach osobowości i doświadczeniach przemocy."
           }',
           'smykla.maria@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Stafiej
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C9YUd6kPA8VtQACtopWnk6cs8',
           '37C9YY8RNjYqXiBhEwOTjbWkHml',
           '#FF5722',
           '{"en":"Cognitive Behavioral Therapist","pl":"Terapeutka poznawczo-behawioralna"}',
           '{
             "en": "## Psychologist and CBT Therapist\nPsychologist and cognitive-behavioral therapist in training recommended by PTTPB. She completed psychology studies at the Jagiellonian University and is advancing her CBT training under supervision. She works with adults facing emotional challenges, anxiety, stress and difficulties in relationships, using classical CBT and third-wave techniques to support meaningful change.\n\nShe emphasizes an authentic therapeutic relationship and a collaborative process to facilitate understanding, resilience, and personal growth.",
             "pl": "## Psycholożka i terapeutka poznawczo-behawioralna\nPsycholożka oraz terapeutka poznawczo-behawioralna w trakcie szkolenia rekomendowanym przez PTTPB. Ukończyła psychologię na Uniwersytecie Jagiellońskim i rozwija swoje kompetencje kliniczne pod stałą superwizją. Pracuje z dorosłymi doświadczającymi trudności emocjonalnych, lęku, stresu i problemów w relacjach, wykorzystując klasyczne CBT oraz techniki tzw. trzeciej fali, by wspierać proces zmiany.\n\nW swojej pracy kładzie nacisk na autentyczną relację terapeutyczną oraz współpracę, które ułatwiają lepsze zrozumienie siebie, budowanie odporności i rozwój osobisty."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'anna-stafiej',
           '{
             "en":"Psychologist and CBT therapist in training, supporting adults with emotional challenges, anxiety and stress through evidence-based CBT and collaborative therapy.",
             "pl":"Psycholożka i terapeutka CBT w trakcie szkolenia, wspierająca dorosłych w trudnościach emocjonalnych, lęku i stresie przy użyciu CBT oraz partnerskiej pracy terapeutycznej."
           }',
           'stafiej.anna@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );


-- Julia Hodurek-Ptak
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C9YVH1AtV729RoHNq3ViS4QWr',
           '37C9YSjqR8w14MYeByv2UWBoTXc',
           '#9C27B0',
           '{"en":"Psychodynamic and Integrative Therapist","pl":"Terapeutka psychodynamiczna i integracyjna"}',
           '{
             "en": "## Psychologist, Psychodynamic and Integrative Therapist\nPsychologist (graduate of psychology) and psychotherapist working in psychodynamic and integrative approaches. She completed a comprehensive psychotherapy training program with the Foundation for the Development of Family Therapy \"Na Szlaku\". She has experience working with individuals across a range of emotional and relational difficulties, including anxiety, low self-esteem, identity concerns, and life transitions.\n\nIn her work she emphasizes building an authentic and safe therapeutic relationship to support clients in understanding and processing difficult emotions and relational patterns. She collaborates with adults seeking insight, emotional regulation, and improved interpersonal functioning.",
             "pl": "## Psycholożka, terapeutka psychodynamiczna i integracyjna\nPsycholożka oraz psychoterapeutka pracująca w nurcie psychodynamicznym i integracyjnym. Ukończyła całościowe szkolenie psychoterapeutyczne w Fundacji Rozwoju Terapii Rodzin \"Na Szlaku\". Doświadczenie w pracy z dorosłymi zdobywała przy wsparciu osób z różnymi trudnościami emocjonalnymi i relacyjnymi, w tym lękiem, niską samooceną, kwestiami tożsamości oraz zmianami życiowymi.\n\nW swojej pracy kładzie nacisk na budowanie autentycznej i bezpiecznej relacji terapeutycznej, która wspiera zrozumienie i pracę z trudnymi emocjami oraz wzorami relacyjnymi. Współpracuje z dorosłymi szukającymi zrozumienia, regulacji emocji i poprawy funkcjonowania interpersonalnego."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'julia-hodurek-ptak',
           '{
             "en":"Psychodynamic and integrative therapist focusing on emotional understanding, relational patterns and therapeutic insight.",
             "pl":"Terapeutka psychodynamiczna i integracyjna koncentrująca się na emocjach, wzorach relacyjnych i pracy wglądowej."
           }',
           'hodurekjulia@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );

-- Anna Radecka
INSERT INTO core.therapist (
  id,
  user_id,
  display_color,
  professional_title,
  description,
  language_ids,
  in_person_therapy_format,
  online_therapy_format,
  is_accepting_new_clients,
  slug,
  meta_description,
  contact_email,
  contact_phone,
  created_at,
  percentage_profit_sharing,
  created_by
) VALUES (
           '37C9YXwat1yqVRBS2WE44TE53fY',
           '37C9YThOEVpAIMfgPLZMl2Z0aUo',
           '#FF9800',
           '{"en":"Psychodynamic and Systemic Therapist","pl":"Terapeutka psychodynamiczna i systemowa"}',
           '{
             "en": "## Psychodynamic and Systemic Therapist\nPsychologist and psychotherapist working with adults in a psychodynamic and systemic framework. She completed her psychology studies and a comprehensive psychotherapy training with the Foundation for the Development of Family Therapy \"Na Szlaku.\" She works with individuals facing emotional struggles, relational difficulties, life transitions, and identity concerns.\n\nHer therapeutic approach emphasizes creating a safe and respectful space for clients to explore patterns of feelings and behaviours. She supports adults in understanding and processing emotional themes, improving relationships, and building resilience.",
             "pl": "## Terapeutka psychodynamiczna i systemowa\nPsycholożka i psychoterapeutka pracująca z dorosłymi w nurcie psychodynamicznym i systemowym. Ukończyła studia z psychologii oraz całościowe szkolenie psychoterapeutyczne w Fundacji Rozwoju Terapii Rodzin \"Na Szlaku.\" Pracuje z osobami dorosłymi, które doświadczają trudności emocjonalnych, problemów w relacjach międzyludzkich, zmian życiowych oraz kwestii tożsamości.\n\nJej podejście terapeutyczne opiera się na tworzeniu bezpiecznej i pełnej szacunku przestrzeni, w której klient może badać wzorce uczuć i zachowań. Wspiera dorosłych w zrozumieniu i pracy z tematami emocjonalnymi, poprawie relacji oraz budowaniu odporności psychicznej."
           }',
           '{"34tGCTRFFu4D4RA87Ag2McaV92N","34tGCReab2xRBh9tOnVkyzBiAWq"}',
           true,
           true,
           true,
           'anna-radecka',
           '{
             "en":"Psychodynamic and systemic therapist supporting adults with emotional issues, relationships, life transitions and identity exploration.",
             "pl":"Terapeutka psychodynamiczna i systemowa wspierająca dorosłych w trudnościach emocjonalnych, relacyjnych, zmianach życiowych i tożsamościowych."
           }',
           'annaradecka123@gmail.com',
           '+48786907645',
           1725824055,
           40,
           '2imfnAVjkbfcwEos1LLLztn1vEP'
         );
