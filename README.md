# BookShelf — Moja Biblioteka

Aplikacja mobilna do zarządzania osobistą biblioteką książek, stworzona w ramach projektu zaliczeniowego.

**Autor:** Michał Lepak, nr albumu: 21255

---

## O projekcie

BookShelf to aplikacja mobilna napisana w React Native z użyciem frameworka Expo. Umożliwia użytkownikom śledzenie przeczytanych książek, zarządzanie listą lektur oraz przeglądanie aktywności innych czytelników.

### Funkcjonalności

- **Rejestracja i logowanie** — bezpieczna autoryzacja oparta na Supabase Auth
- **Dodawanie książek** — tytuł, autor, status oraz notatki
- **Statusy książek:**
  - Chcę przeczytać
  - Czytam teraz
  - Przeczytana
- **Ocenianie** — system gwiazdek (1–5), dostępny tylko dla książek ze statusem "Przeczytana"
- **Szczegóły książki** — podgląd pełnych informacji, możliwość edycji oceny i usunięcia
- **Inni czytelnicy** — widok innych użytkowników, którzy przeczytali tę samą książkę
- **Obserwowanie** — możliwość obserwowania innych czytelników
- **Statystyki** — liczba przeczytanych książek w danym roku
- **Wyszukiwanie i filtrowanie** — szukanie po tytule/autorze, filtr po statusie
- **Responsywny interfejs** — layout 2-kolumnowy na szerszych ekranach (tablet, web)

### Technologie

| Technologia | Wersja |
|---|---|
| Expo SDK | ~55.0.23 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| TypeScript | ~5.9.2 |
| expo-router | ~55.0.13 |
| Supabase JS | ^2.105.0 |
| Zustand | ^5.0.12 |
| react-native-reanimated | ~4.1.1 |
| lucide-react-native | ^1.11.0 |

### Baza danych

Aplikacja korzysta z backendu **Supabase** (PostgreSQL). Wymagane tabele:
- `profiles` — dane użytkowników (id, username, created_at)
- `books` — biblioteka książek (id, user_id, title, author, status, rating, notes, date_added)
- `user_follows` — relacje obserwowania (follower_id, following_id)

---

## Instrukcja uruchomienia

### Wymagania wstępne

- **Node.js** v18 lub nowszy (zalecany v22+)
- **npm** v9 lub nowszy
- **Expo Go** — aplikacja na telefon ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Konto w serwisie [Supabase](https://supabase.com) (darmowe)

### 1. Klonowanie i instalacja zależności

```bash
git clone <adres-repozytorium>
cd Aplikacje_Mobilne-master
npm install
```

### 2. Konfiguracja Supabase

Utwórz plik `.env` w głównym katalogu projektu i uzupełnij danymi ze swojego projektu Supabase (Settings → API):

```env
EXPO_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=twoj-anon-key
```

### 3. Uruchomienie aplikacji

```bash
npx expo start
```

Po uruchomieniu w terminalu pojawi się kod QR. Zeskanuj go aplikacją **Expo Go** na telefonie, aby otworzyć aplikację.

### Dostępne opcje uruchomienia

| Polecenie | Opis |
|---|---|
| `npx expo start` | Uruchomienie serwera deweloperskiego |
| `npx expo start --android` | Uruchomienie na emulatorze Android |
| `npx expo start --ios` | Uruchomienie na symulatorze iOS (tylko macOS) |
| `npx expo start --web` | Uruchomienie w przeglądarce |

### Uruchomienie na emulatorze Android

1. Zainstaluj [Android Studio](https://developer.android.com/studio)
2. Utwórz wirtualne urządzenie (AVD) w AVD Manager
3. Uruchom emulator
4. W terminalu uruchom `npx expo start --android`

### Uruchomienie w przeglądarce (web)

```bash
npx expo start --web
```

Aplikacja otworzy się automatycznie pod adresem `http://localhost:8081`.

---

## Struktura projektu

```
├── app/
│   ├── (auth)/          # Ekrany logowania i rejestracji
│   ├── (main)/          # Główne ekrany aplikacji (zakładki)
│   │   ├── books.tsx    # Lista książek
│   │   ├── add.tsx      # Dodawanie książki
│   │   ├── following.tsx
│   │   └── statistics.tsx
│   ├── book/[id].tsx    # Szczegóły książki
│   └── user/[id].tsx    # Profil użytkownika
├── assets/images/       # Zasoby graficzne (ikony, gif)
├── components/          # Komponenty wielokrotnego użytku
├── constants/theme.ts   # Kolory, czcionki, odstępy
├── lib/supabase.ts      # Klient Supabase i typy danych
└── store/authStore.ts   # Stan autoryzacji (Zustand)
```
