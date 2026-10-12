# han river data

A minimal, single-page website for Han River Data. Plain HTML and CSS, with no build step or dependencies.

## Edit

Page copy and styling are in `index.html`. The closing contact link opens an email to `founders@hanriverdata.com`, a Google Workspace mailing group containing `jonathan@hanriverdata.com` and `kevin@hanriverdata.com`. Both founders own the group. Outside senders can email the group; conversations are visible only to group members, and membership is by invitation.

The existing `contact@hanriverdata.com` alias still delivers to `jonathan@hanriverdata.com`.

## Brand assets

The approved river mark appears in the header, browser icons, and social preview. The original website font stack and copy remain unchanged.

`brand/index.html` is the public brand kit at `/brand/`. It includes a downloadable ZIP, square logos (1024 × 1024), banners (2000 × 600), tightly cropped horizontal logos, stacked logos, and a 1200 × 630 social card. Light, dark, and transparent variants are supplied as SVG and PNG. See `brand/README.txt` for usage notes.

The editable vector masters are `brand/mark.svg` and `brand/wordmark.svg`; the wordmark lettering is outlined. Run `node scripts/export-brand.cjs` with the `sharp` package available to regenerate the matching exports and root browser icons. Rebuild `brand/han-river-data-brand-kit.zip` after any asset changes; include the SVGs, PNGs, and usage notes, excluding the ZIP itself.

## Preview

Run `python3 -m http.server 8000 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:8000`.

## Publish

GitHub Pages serves the root of the `main` branch. Changes pushed to `main` publish automatically. The custom domain is `hanriverdata.com`, configured in GitHub Pages and the `CNAME` file.

Namecheap BasicDNS points the apex domain (`@`) to GitHub Pages using four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. The `www` CNAME points to `jelee2000.github.io`.

Website DNS changes must preserve the Google Workspace MX, SPF, DKIM, and domain-verification records.
