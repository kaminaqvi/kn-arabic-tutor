# KN Arabic Tutor

A free, installable web app (PWA) for English and Urdu speakers to learn to read and speak Arabic in short daily game levels.

- **Live app:** https://kaminaqvi.github.io/kn-arabic-tutor/
- **Paths:** Umrah and Hajj travel (27 units, 256 items), Qur'anic Arabic (14 units incl. Al-Fatiha and four short surahs), general reading (MSA, 7 units), everyday conversation (Saudi, 6 units).
- **Foundations module** for complete beginners (alphabet and vowel marks), skipped after a short reading check.
- **Daily level:** review → learn → read → meaning check → read without vowel marks → listen and tap → speak to unlock → build and say. A boss level every 7th day.
- **Role-plays:** 10 scripted scenes (airport, taxi, hotel, restaurant, shopping, directions, Rawdah, help, meeting people, making plans), plus free conversation with Gemini.
- **Final recall test:** type the meaning, no answer choices.
- **Memory:** 5-box Leitner schedule (1, 2, 4, 7, 14 days); gaps capped at 4 days in the last 10 days before a goal date.
- **Speaking:** Chrome's speech recognition (`ar-SA`); optional detailed feedback from Gemini with the learner's own free API key.
- **Privacy:** no accounts, no server. Progress stays in the browser (IndexedDB) with export/import backup. The Gemini key is never exported.

## Kids version

https://kaminaqvi.github.io/kn-arabic-tutor/kids/ — a separate installable app for children with its own saved progress: picture words for every letter, numbers, colours, family, body, Islamic words, little duas and Surah Al-Ikhlas. Stars, a sticker book and Jamal the camel. No accounts, no chat, no AI. Settings sit behind a 2-second hold for parents.

## Run locally

Any static server works:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in Chrome.

## Content

Lessons live in `content/*.json`. Check them with:

```
node tools/validate.mjs
```

Content is generated from the scripts in `tools/src/` (run them from the repo root), then validated.

Qur'an text and recitation (Mishary Alafasy) are loaded at runtime from [AlQuran Cloud](https://alquran.cloud) and cached on the device; they are never retyped by hand. Spoken phrases use Saudi (Hijazi) Arabic, with the textbook form shown where it differs.

## License

Code: MIT. See `LICENSE`.
