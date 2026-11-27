# SoloMGtools

Polski warsztat narzędzi dla Mistrza Gry i do gry solo. Menu **Generatory** pozwala przełączać się między **Tagami** (osiem kategorii i 490 tagów WN-TAGS), **Nazwami planet** (31 typów i 1470 autorskich nazw inspirowanych Travellerem), **Dekoderem UWP** oraz **Generators** (50 generatorów WN-Generators w 10 grupach). Wyniki narzędzi pozostają zachowane podczas przełączania, do odświeżenia strony.

## Generators

- Otwórz **Generators** lub `#wn-generators`, wybierz grupę i kliknij nazwę generatora. Pierwsze losowanie następuje dopiero po kliknięciu.
- Nagłówek **Kategorie** zwija i rozwija listę kategorii, zachowując widoczne wyniki. W zwiniętym nagłówku widać nazwę wybranej kategorii. **Misje** łączą wszystkie 11 generatorów z dwóch źródłowych grup misji.
- **Postacie** łączą BN jednym rzutem, patronów, postacie cyberpunkowe i pośrednika z dotychczasowych grup „Postacie jednym rzutem”, „Postacie cyberpunkowe” i „Postacie”.
- **Miasta** łączą generatory z dotychczasowych grup „Świat i miasto cyberpunkowe” oraz „Miasto i dzielnice”.
- **Spotkania** łączą osiem generatorów z dotychczasowych grup „Spotkania jednym rzutem” i „Miejsca spotkań”.
- BN jednym rzutem, megakorporacja, gang i szczegółowe typy misji losują wszystkie składniki zestawu jednocześnie. Przyciski **Imię męskie + nazwisko** i **Imię żeńskie + nazwisko** dopisują kolejne osoby. Imię i nazwisko są obok siebie, każde z własną listą wyboru. Nazwiska oraz nazwy miejsc można też losować osobno.
- Ikona kopiowania na końcu wiersza kopiuje wyłącznie aktualne `Imię Nazwisko` (lub samodzielnie wylosowaną nazwę). **Kopiuj zestaw** w karcie imion kopiuje wszystkie jej wiersze, po jednej osobie lub nazwie w linii, z etykietami **Mężczyzna**, **Kobieta**, **Nazwisko** i **Miejsce**. Górny przycisk **Kopiuj wszystkie wyniki** używa tych samych etykiet i scala wpisy danej grupy pod jednym nagłówkiem, np. „Imiona i nazwy arabskie”.
- Każdy wynik otwiera listę wszystkich pozycji z właściwej tabeli. Zmiana pola zachowuje niezależne wyniki; zmiana typu misji lub kategorii miejsca przebudowuje powiązaną gałąź.
- **Kopiuj zestaw** uwzględnia bieżące wybory i pełne opisy wyników w Markdown. Poziom nagłówków wybierasz u góry: `#`, `##` (domyślnie), `###` lub `####`. Podsekcje są zagnieżdżone; poniżej szóstego poziomu nagłówków używamy pogrubienia. Opisy oraz instrukcje z danych są domyślnie zwinięte na wszystkich szerokościach ekranu.
- W nagłówku po prawej stronie tytułu **Generators** są kolejno: **Wyniki w historii**, lista poziomu Markdown i **Kopiuj wszystkie wyniki**. Kopia obejmuje kolejne losowania ze wszystkich narzędzi (Generators, Tagi, Nazwy planet, Dekoder UWP). Imiona i nazwy danej grupy są scalane w miejscu jej pierwszego wyniku; pozostałe wyniki zachowują kolejność generowania. Nagłówki zaczynają się na wybranym poziomie Markdown. Niewygenerowane kategorie są pomijane. Ręczna edycja aktualizuje odpowiedni wpis, a ponowne losowanie dopisuje nowy, zachowując wcześniejszy. Historia jest przechowywana wyłącznie w pamięci do odświeżenia strony.
- **Misja — pełna procedura** losuje dwa różne tagi z istniejącej biblioteki WN-TAGS wraz z inspiracjami, rodzaj misji i wszystkie tabele wybranego rodzaju. Pośrednika można dołączyć polem wyboru. Wynik „rzuć dwa razy” rozwija oba typy misji.
- Rzuty respektują źródłowe zakresy i wagi, z osobnymi k6/k6 w problemach społeczności. Wykonywane są dodatkowe rzuty, warunki, wybór kampanii i wskazane w danych powtórzenia. Przy tworzeniu miasta można wybrać liczbę korporacji i dzielnic, a przy zagrożeniach — osobny typ dla każdego zagrożenia.
- Biblioteka `data/WN_GENERATORS_PL.json` jest kopią danych dostarczonych w `WN_GENERATORS_DATA_PL`: 253 tabele, 3761 wierszy i 142 pełne opisy. Nazwy, treści i identyfikatory zachowano. Definicje znajdują się w `data/WN_GENERATORS_PL.schema.json`. Po zmianie danych uruchom testy i budowanie.

Logika i format kopiowania są w `generators.js`, interfejs w `generators-ui.js`, a testy zakresów, zależności i edycji w `tests/generators.test.js`.

## Dekoder UWP

- Otwórz **Dekoder UWP** lub adres `#uwp`. Wpisz UWP, np. `A593943-A`, i opcjonalne Ix `{ 4 }`, Ex `(D8E+1)` oraz Cx `[6D27]`. Rozszerzenia można odczytać także osobno, bez UWP; nawiasy w ręcznych polach są opcjonalne.
- Rozwiń **Wklej dane z Traveller Map**, wklej dane jednego świata i wybierz **Wczytaj i dekoduj**. Obsługiwane są wiersze z etykietami UWP/Importance/Economics/Culture, sam kod oraz standardowy wiersz sektora. Import zastępuje wszystkie pola, więc brakujące rozszerzenie nie zostanie po poprzednim świecie.
- Wynik zawiera osiem cech UWP, znaczenie regionalne, cztery cechy ekonomii i cztery cechy kultury. eHex jest przeliczany na wartości dziesiętne z pominięciem I oraz O. Formularz **Odczytaj świat z kodu** jest początkowo otwarty i sam zwija się po udanym dekodowaniu; kliknięcie tytułu pozwala ponownie zmienić dane. Przy błędach pozostaje otwarty.
- Obsługiwane są porty gwiezdne A–E/X i lokalne F/G/H/Y, znaki niewiadomej `?` w UWP, ustroje obcych z podstawowej tabeli Second Survey, specjalne prawo S oraz TL do L (20). Dekoder nie obsługuje alternatywnej tabeli ustrojów Wi z The New Era.
- Porty pokazują usługi i cenę dostępnego paliwa (500 Cr/t rafinowanego lub 100 Cr/t nierafinowanego). TL zawiera przykłady wyposażenia, np. holograficzne drony od TL B (11), a także odpowiednie przykłady z niższych poziomów.
- Karty ekonomii, kultury i TL pokazują nazwę oraz kod po prawej. Definicja skali i wyjaśnienie niskich/wysokich wyników są domyślnie zwinięte. Główna treść interpretuje konkretny poziom: osobno jego wpływ na świat i skutki dla przybyszów. Każda wartość ma własny, statyczny opis w `uwp-levels.js`. Są to autorskie interpretacje MG; źródło definiuje głównie skrajne wartości skal Ex/Cx. TL nie gwarantuje lokalnej dostępności każdego urządzenia.
- **Niżej** i **Wyżej** pozwalają przeglądać sąsiednie poziomy na danej karcie, a **Reset** wraca do wartości z odczytanego profilu. Granice skali blokują dalsze przejście. Podgląd nie zmienia pól, kodów rozszerzeń, pozostałych kart ani kopiowanego profilu; jest oznaczony wraz z wartością źródłową. Definicja pozostaje rozwinięta lub zwinięta podczas przeglądania.
- Podgląd i reset są dostępne również we wszystkich ośmiu parametrach UWP: porcie, wielkości, atmosferze, hydrografii, populacji, ustroju, prawie i TL. Kody portów, atmosfery i ustrojów przegląda się przyciskami **Poprzedni / Następny**, ponieważ nie tworzą prostej skali jakości. Obsługiwane są też porty lokalne, ustroje obcych, prawo S oraz powrót do źródłowego znaku `?`. Hydrografia zachowuje kontekst atmosfery wpisanego świata; podgląd innej atmosfery nie zmienia sąsiedniej karty.
- Poziom prawa pokazuje kumulatywną listę ograniczeń z poprzednich poziomów, z bieżącym poziomem pogrubionym. Dla poziomu 0 pokazujemy brak zakazów; dla S i ? nie tworzymy pozornej listy dziedziczonych ograniczeń.
- **Kopiuj opis** zapisuje kompletny odczyt wraz z uwagami i źródłami jako Markdown. Lista obok przycisku pozwala wybrać poziom `#`, `##`, `###` lub `####`; domyślny początek to `## Profil Świata`, z zagnieżdżonymi sekcjami i cechami. **Wczytaj przykład** wypełnia i dekoduje przykład; **Wyczyść** usuwa dane dekodera. Wcześniejsze odczyty pozostają w historii zbiorczej do odświeżenia strony. Po ręcznej zmianie pola wynik wymaga ponownego dekodowania.
- Walidacja wskazuje błędy pól, niewłaściwe zakresy i niejednoznaczny import kilku światów. Kod `A3234112-A` jest błędny: ma osiem znaków przed myślnikiem zamiast siedmiu. Nie usuwamy nadmiarowej cyfry automatycznie. Ostrzeżenia wskazują m.in. sprzeczność populacji UWP z zerowym Cx.

Podstawa kodów: [Traveller Map — Second Survey](https://travellermap.com/doc/secondsurvey). Uzupełnienia: [Mongoose Traveller SRD — paliwo](https://www.traveller-srd.com/core-rules/spacecraft-operations/) i [wyposażenie](https://www.traveller-srd.com/core-rules/equipment/). Dane są odczytywane lokalnie w przeglądarce; dekoder nie wysyła zapytań do Traveller Map.

## Nazwy planet

- Każdy z 31 typów ma własny przycisk losowania, wynik oraz przycisk **Kopiuj** obok niego. Pierwsze losowanie następuje po kliknięciu typu.
- Wynik i schowek mają ten sam format, np. `Szronowa Przystań (Ice World)`.
- Kolejne kliknięcie typu losuje inną nazwę niż poprzednia. Pozostałe typy zachowują swoje wyniki.
- Asteroid Belt World, Big World, Desert World, Ice World i Rad World mają po **60 nazw**, pozostałe typy po **45 nazw**.
- Zachowano wszystkie wcześniejsze 540 nazw i dodano po 30 nazw do każdego typu: łącznie 930 nowych pozycji, w tym 744 nazwy jednowyrazowe, np. `Kaller`, oraz nazwy własne, np. `Pas Kallera`.
- Generator zaczyna się od przycisków typów, bez wstępu ani odsyłaczy do zewnętrznych stron.
- Nazwy mieszają język polski i angielski, kody katalogowe, nazwy poważne i przydomki osadników. Są autorskimi propozycjami do sesji, a nie katalogiem kanonicznych światów.
- Typy i ich kolejność odpowiadają liście „Physical Planetology” na [Traveller Wiki](https://wiki.travellerrpg.com/Planet). Zachowano także osobne pozycje o podobnym znaczeniu, np. Ocean World i Panthallasic World.

Biblioteka jest w `data/PLANET_NAMES_PL.json`: `schema_version: 1`, `source` i tablica `types`. Typ ma stałe `id`, oryginalne `name`, polskie `label` i tablicę `names`. Nowe nazwy dopisuj do tej tablicy; walidator wykrywa puste wpisy i duplikaty w całej bibliotece. Po celowym zwiększeniu liczby nazw zaktualizuj oczekiwane liczby w `tests/planets.test.js`.

## Dodawanie generatorów

W `app.js` rejestr `generators` opisuje pozycje menu, tytuły i funkcje inicjalizujące. Aby dodać narzędzie, dodaj panel w `index.html`, moduł z funkcją `init(container)`, pozycję rejestru i jego pliki do `scripts/build.mjs`. Inicjalizacja następuje dopiero po pierwszym otwarciu generatora. Błąd pobierania jednej biblioteki nie blokuje drugiej. Wspólne elementy interfejsu są w `ui.js`.

Bezpośrednie adresy to `#tags`, `#planets`, `#uwp` oraz `#wn-generators`; działają też dotychczasowe odsyłacze do kategorii tagów, np. `#world`. Przełączanie działa również z przyciskami Wstecz/Dalej przeglądarki.

## Działanie

- **Losuj dwa tagi** wybiera dwa różne tagi w danej kategorii.
- Można również wybrać po jednym tagu z dwóch list. Wybranie drugiego automatycznie tworzy zestaw.
- Strona pokazuje pełne opisy obu tagów i po jednej propozycji z każdego taga dla Wrogów, Przyjaciół, Komplikacji, Rzeczy i Miejsc.
- Każda propozycja jest listą wyboru: można zamienić ją na dowolny inny wpis z tej samej podkategorii tego samego taga. Zmiana jednego pola nie zmienia pozostałych wyników. Kopiowanie uwzględnia ręczne zmiany.
- Na telefonach opisy tagów są domyślnie zwinięte; dotknięcie nazwy rozwija pełny opis. Wszystkie kategorie są dostępne w przewijanym menu.
- **Losuj inspiracje** zachowuje tagi i losuje ponownie tylko propozycje.
- **Kopiuj zestaw** kopiuje opisy i wyniki do schowka.
- Wszystkie kategorie zaczynają z pustymi polami. Wyniki pojawiają się dopiero po losowaniu lub ręcznym wybraniu dwóch tagów.

Losowanie jest jednolite z `tag_table`, bez powtórzeń w parze. Numer na liście jest numerem porządkowym taga w kategorii, nie wynikiem rzutu procentowego. Cały element tablicy `options` jest jedną propozycją, również gdy zawiera przecinki. Zachowano wszystkie treści i przypisania podkategorii z oryginału.

## Dane — wersja 2

Strona używa `data/WN_TAGS_PL_v2.json`. Oryginalny `data/WN_TAGS_PL.json` pozostaje archiwum do porównania; nie jest dołączany do publikacji strony.

Nowy plik ma tylko `schema_version: 2` oraz tablicę `categories`. Każda kategoria zawiera:

- `id_code` — stały identyfikator kategorii, np. `world`.
- `name` — polską nazwę kategorii.
- `tag_table` — tabelę tagów. Każdy wiersz ma `number` (1, 2, 3…), `id_code` oraz `name`.
- `tags` — obiekty tagów pod kluczami zgodnymi z `id_code` w tabeli. Każdy tag zawiera `description` oraz osobne obiekty `Enemies`, `Friends`, `Complications`, `Things`, `Places`. Każdy z nich ma tablicę `options` z pełnymi tekstami propozycji.

Nazwy i numery tagów są zapisane tylko w tabeli. Szczegóły pobierane są przez identyfikator, np. `categories[0].tags["world-abandoned-colony"].Enemies.options`. Numery porządkowe zaczynają się od 1 w każdej kategorii. Przy dodawaniu taga dopisz wiersz tabeli i odpowiadający mu obiekt pod tym samym `id_code`.

Wersja 2 nie zawiera metadanych PDF, angielskich nazw źródłowych, instrukcji, sekcji dodatkowych, tabel rzutów ani powielonej liczby tagów. Polskie etykiety podkategorii są częścią interfejsu w `generator.js`.

Skrypt `scripts/migrate-data-v2.mjs` odtwarza wersję 2 z archiwum wersji 1; bieżące poprawki treści należy wprowadzać bezpośrednio w pliku wersji 2. Testy migracji porównują z archiwum nazwy, identyfikatory, kolejność, opisy i wszystkie opcje; po celowych zmianach treści należy zaktualizować te oczekiwania.

## Praca lokalna

Wymagania: Node.js 24+ i Python 3. Nie trzeba instalować zależności.

```sh
npm run dev
```

Otwórz http://127.0.0.1:5173. Uruchom stronę przez serwer HTTP, ponieważ pobiera JSON przez `fetch`.

```sh
npm test
npm run build
```

Wynik budowania trafia do `dist/`. Strona to HTML, CSS i JavaScript, bez backendu. Używa wyłącznie fontów systemowych i zasobów z własnego adresu.

## Prywatność i widoczność

Strona nie zawiera analityki, pikseli śledzących, zewnętrznych skryptów ani Google Fonts. Nie zapisuje identyfikatorów w cookies ani pamięci przeglądarki. Losowanie i dekodowanie odbywa się w przeglądarce. Schowek jest zapisywany wyłącznie po naciśnięciu „Kopiuj zestaw”, „Kopiuj” przy nazwie planety lub „Kopiuj opis” w dekoderze.

Usunięto opis SEO i metadane promocyjne. Zostawiono kodowanie UTF-8 i ustawienie widoku mobilnego. Dyrektywy `noindex, nofollow, nosnippet, noimageindex` proszą zgodne wyszukiwarki o pominięcie strony. Polityka `no-referrer` wyłącza nagłówek odsyłający, a Content Security Policy ogranicza pobieranie zasobów i połączenia do własnego hosta. Nie ma mapy witryny ani zgłoszenia do wyszukiwarek.

To nadal publiczna strona: dyrektywy wyszukiwarek nie ograniczają dostępu i nie wiążą wszystkich botów. Publiczne repozytorium, jego historia i JSON mogą być odnalezione niezależnie od strony. Hosting GitHub Pages obsługuje żądania niezależnie od kodu aplikacji.

Dokumentacja dyrektyw: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag

## GitHub Pages

Workflow `.github/workflows/pages.yml` uruchamia testy i budowanie. Po włączeniu publikacji wysłanie zmian do `main` publikuje `dist/`. Pull requesty uruchamiają wyłącznie weryfikację.

W repozytorium wybierz **Settings → Pages → Source → GitHub Actions**, a następnie **Settings → Secrets and variables → Actions → Variables** i ustaw zmienną repozytorium `PAGES_ENABLED` na `true`. Uruchom workflow ręcznie lub wyślij kolejny commit. Dopóki zmienna nie jest ustawiona, workflow sprawdza projekt bez próby publikacji.

Obsługa Pages dla prywatnego repozytorium zależy od planu GitHub; projekt nie zmienia widoczności repozytorium.

Dokumentacja: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Pliki

- `data/WN_TAGS_PL_v2.json` — aktualne dane strony w uproszczonym formacie; tutaj aktualizuj treści.
- `data/WN_TAGS_PL.json` — archiwalny oryginał w wersji 1.
- `data/PLANET_NAMES_PL.json` — 31 typów planet i 1470 autorskich nazw.
- `scripts/migrate-data-v2.mjs` — konwersja archiwum do wersji 2.
- `generator.js` — losowanie i weryfikacja danych.
- `app.js` — wybór generatora i obsługa kategorii tagów.
- `ui.js` — wspólne przyciski, ikony i komunikaty.
- `planets.js` — losowanie, formatowanie i weryfikacja nazw planet.
- `planet-ui.js` — interfejs generatora nazw planet.
- `uwp.js` — parser UWP/Ix/Ex/Cx, import z mapy, walidacja i format kopiowania.
- `uwp-data.js` — polskie opisy kodów oraz przykłady technologii.
- `uwp-levels.js` — statyczne interpretacje każdego poziomu ekonomii, kultury i TL.
- `uwp-ui.js` — formularz, import, wyniki i kopiowanie dekodera.
- `styles.css` — wygląd desktopowy i mobilny.
- `tests/generator.test.js` — testy danych, par tagów i wyników.
- `tests/planets.test.js` — kompletność nazw planet, losowanie i format kopiowania.
- `tests/uwp.test.js` — poprawne i błędne kody, zakresy, import, porty, technologia oraz zerowe profile.

Dane WN-TAGS dostarczył właściciel projektu. Nie dodano deklaracji licencji do treści źródłowych. Nazwy planet są autorskimi propozycjami przygotowanymi dla tego projektu.
