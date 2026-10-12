# han river data

A minimal, single-page website for Han River Data. Plain HTML and CSS, with no build step or dependencies.

## Edit

Page copy and styling are in `index.html`. The contact button opens an email to `jonathan@hanriverdata.com`.

## Preview

Run `python3 -m http.server 8000 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:8000`.

## Publish

GitHub Pages serves the root of the `main` branch. Changes pushed to `main` publish automatically. The intended custom domain is `hanriverdata.com`.

Website DNS changes must preserve the Google Workspace MX, SPF, DKIM, and domain-verification records.
