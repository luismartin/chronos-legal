# Chronos — Legal

Public legal documents for the Chronos Android app, published at
[legal.chronosintelligentalarm.com](https://legal.chronosintelligentalarm.com/).

- [Privacy Policy](https://legal.chronosintelligentalarm.com/) — `index.html` (9 languages: `#en` `#es` `#fr` `#de` `#pt` `#it` `#zh` `#ja` `#ko`)
- [Delete your account](https://legal.chronosintelligentalarm.com/delete-account.html) — `delete-account.html` (same 9 languages)

Source of truth lives in the main (private) Chronos repo at `docs/legal/`; copy changes here to republish.

## Republishing updated text

The design is applied at runtime by `legal.css` and `legal.js`, so the legal text stays a
verbatim copy of the source. To republish:

1. Open `index.html` (or `delete-account.html`) and find the `<!-- LEGAL:BEGIN -->` … `<!-- LEGAL:END -->` markers.
2. Replace everything between them with the updated language blocks — from `<h1 id="en">` to the
   end of the last block — exactly as they are in the source. Keep the `<h1 id="xx">`, the
   `<p class="muted">` that follows it, the `<h2>`s, lists and tables as they are; no extra markup is needed.
3. Nothing else in the file needs to change.

`legal.js` picks the language from the URL hash, wraps each block in a section, builds the table of
contents from the `<h2>`s and moves the title and date into the header area. Without JavaScript the
page shows all languages stacked, as before. File names (`index.html`, `delete-account.html`) are
declared in Play Console and must not change; `CNAME` sets the custom domain.
