# Ugovori MGSI (v1.0, offline)

Aplikacija za internu evidenciju **Ugovora, Okvirnih sporazuma i Narudžbenica** sa:
- 🌓 Light/Dark tema (pamti izbor)
- 🇷🇸/🇬🇧 SR/EN interfejs (pamti izbor)
- 🗂️ Arhiva (soft delete + restore)
- 📝 Log aktivnosti
- 🔐 Login (offline, LocalStorage) — default korisnik: **stefan / mgsi123**
- 💾 Export/Import podataka (JSON)
- 🖨️ Izbor pisma pri izvozu dokumenata: **Ćirilica/Latinica** (placeholder u v1.0)
- 📴 Potpuno **offline** (LocalStorage)

## Pokretanje
Otvorite `index.html` duplim klikom (nije potreban server).

## Napomene
- Svi podaci se čuvaju u LocalStorage vašeg pregledača. Napravite **Export** (JSON) kao bekap.
- Placeholder-i za Word/Excel šablone nalaze se u `templates/` — u v1.0 se samo uvoze/imenjuju.
- Generisanje PDF/Word sa izborom pisma planirano je za v1.1 (stub je prisutan).

Autor: Stefan & GPT-5 — 2025-10-08
