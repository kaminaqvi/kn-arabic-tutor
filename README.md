# KN Arabic Tutor

A free, installable web app (PWA) for English and Urdu speakers to learn to read and speak Arabic in short daily game levels.

- **Paths:** Umrah and Hajj travel (Release 1: Days 1–7). Coming next: Qur'anic Arabic, general reading, everyday conversation.
- **Foundations module** for complete beginners (alphabet and vowel marks), skipped after a short reading check.
- **Daily level:** review → learn → read → listen and tap → speak to unlock → build and say.
- **Memory:** 5-box Leitner schedule (1, 2, 4, 7, 14 days); gaps capped at 4 days in the last 10 days before a goal date.
- **Speaking:** Chrome's speech recognition (`ar-SA`); optional detailed feedback from Gemini with the learner's own free API key.
- **Privacy:** no accounts, no server. Progress stays in the browser (IndexedDB) with export/import backup. The Gemini key is never exported.

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

Qur'an text and recitation (Mishary Alafasy) are loaded at runtime from [AlQuran Cloud](https://alquran.cloud) and cached on the device; they are never retyped by hand. Spoken phrases use Saudi (Hijazi) Arabic, with the textbook form shown where it differs.

## License

Code: MIT. See `LICENSE`.
