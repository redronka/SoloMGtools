# SoloMGtools

Polski generator inspiracji dla Mistrza Gry i do gry solo. Osiem kategorii i 490 tagów z pliku WN-TAGS. Wszystkie kategorie są dostępne na jednej stronie, jedna pod drugą.

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

Strona nie zawiera analityki, pikseli śledzących, zewnętrznych skryptów ani Google Fonts. Nie zapisuje identyfikatorów w cookies ani pamięci przeglądarki. Losowanie odbywa się w przeglądarce. Schowek jest zapisywany wyłącznie po naciśnięciu „Kopiuj zestaw”.

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
- `scripts/migrate-data-v2.mjs` — konwersja archiwum do wersji 2.
- `generator.js` — losowanie i weryfikacja danych.
- `app.js` — interfejs i obsługa kategorii.
- `styles.css` — wygląd desktopowy i mobilny.
- `tests/generator.test.js` — testy danych, par tagów i wyników.

Dane dostarczył właściciel projektu. Nie dodano deklaracji licencji do treści źródłowych.
