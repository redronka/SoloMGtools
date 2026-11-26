# SoloMGtools

Polski warsztat generatorów dla Mistrza Gry i do gry solo. Menu **Generatory** pozwala przełączać się między **Tagami** (osiem kategorii i 490 tagów WN-TAGS) oraz **Nazwami planet** (31 typów i 1470 autorskich nazw inspirowanych Travellerem). Wyniki obu narzędzi pozostają zachowane podczas przełączania, do odświeżenia strony.

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

Bezpośrednie adresy to `#tags` oraz `#planets`; działają też dotychczasowe odsyłacze do kategorii tagów, np. `#world`. Przełączanie działa również z przyciskami Wstecz/Dalej przeglądarki.

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

Strona nie zawiera analityki, pikseli śledzących, zewnętrznych skryptów ani Google Fonts. Nie zapisuje identyfikatorów w cookies ani pamięci przeglądarki. Losowanie odbywa się w przeglądarce. Schowek jest zapisywany wyłącznie po naciśnięciu „Kopiuj zestaw” lub „Kopiuj” przy nazwie planety.

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
- `styles.css` — wygląd desktopowy i mobilny.
- `tests/generator.test.js` — testy danych, par tagów i wyników.
- `tests/planets.test.js` — kompletność nazw planet, losowanie i format kopiowania.

Dane WN-TAGS dostarczył właściciel projektu. Nie dodano deklaracji licencji do treści źródłowych. Nazwy planet są autorskimi propozycjami przygotowanymi dla tego projektu.
