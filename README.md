# SoloMGtools

Polski generator inspiracji dla Mistrza Gry i do gry solo. Osiem kategorii i 490 tagów z pliku WN-TAGS. Wszystkie kategorie są dostępne na jednej stronie, jedna pod drugą.

## Działanie

- **Losuj dwa tagi** wybiera dwa różne tagi w danej kategorii.
- Można również wybrać po jednym tagu z dwóch list. Wybranie drugiego automatycznie tworzy zestaw.
- Strona pokazuje pełne opisy obu tagów i po jednej propozycji z każdego taga dla Wrogów, Przyjaciół, Komplikacji, Rzeczy i Miejsc.
- **Losuj inspiracje** zachowuje tagi i losuje ponownie tylko propozycje.
- **Kopiuj zestaw** kopiuje opisy i wyniki do schowka.
- Pierwsza kategoria pokazuje przykładową parę: 1. Opuszczona kolonia i 50. Minimalny kontakt.

Losowanie jest jednolite z `tags`, bez powtórzeń w parze. Źródłowy JSON dopuszcza ten sposób obok tabel rzutów. Numer na liście jest pozycją taga w kategorii, nie wynikiem rzutu procentowego. Cały element tablicy jest jedną propozycją, również gdy zawiera przecinki. Zachowano przypisania podkategorii ze źródła, w tym anomalię opisaną w `source_anomalies`.

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

Wynik budowania trafia do `dist/`. Strona to HTML, CSS i JavaScript, bez backendu. Kroje DM Sans i Manrope pobierane są z Google Fonts; przy braku sieci działają systemowe zamienniki.

## GitHub Pages

Workflow `.github/workflows/pages.yml` uruchamia testy i budowanie. Po włączeniu publikacji wysłanie zmian do `main` publikuje `dist/`. Pull requesty uruchamiają wyłącznie weryfikację.

W repozytorium wybierz **Settings → Pages → Source → GitHub Actions**, a następnie **Settings → Secrets and variables → Actions → Variables** i ustaw zmienną repozytorium `PAGES_ENABLED` na `true`. Uruchom workflow ręcznie lub wyślij kolejny commit. Dopóki zmienna nie jest ustawiona, workflow sprawdza projekt bez próby publikacji.

Obsługa Pages dla prywatnego repozytorium zależy od planu GitHub; projekt nie zmienia widoczności repozytorium.

Dokumentacja: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Pliki

- `data/WN_TAGS_PL.json` — pełna, niezmieniona kopia danych użytkownika; tutaj aktualizuj treści.
- `generator.js` — losowanie i weryfikacja danych.
- `app.js` — interfejs i obsługa kategorii.
- `styles.css` — wygląd desktopowy i mobilny.
- `tests/generator.test.js` — testy danych, par tagów i wyników.

Dane dostarczył właściciel projektu. Nie dodano deklaracji licencji do treści źródłowych.
