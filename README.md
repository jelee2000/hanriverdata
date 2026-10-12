# han river data

A minimal, single-page website for Han River Data. Plain HTML and CSS, with no build step or dependencies.

## Edit

Page copy and styling are in `index.html`. The closing contact link opens an email to `founders@hanriverdata.com`, a Google Workspace mailing group containing `jonathan@hanriverdata.com` and `kevin@hanriverdata.com`. Both founders own the group. Outside senders can email the group; conversations are visible only to group members, and membership is by invitation.

The existing `contact@hanriverdata.com` alias still delivers to `jonathan@hanriverdata.com`.

## Brand assets

The approved river mark appears in the header, browser icons, and social preview. The original website font stack and copy remain unchanged.

Only the website's river mark (`river-mark.svg`), browser icons, and sharing image (`social-preview.png`) belong in the published site. Do not publish a brand-kit page or downloadable asset collection.

The complete kit is stored locally in the Git-ignored `private-brand-kit/` directory for sharing through the team's Drive. It includes square and banner logos, light/dark/transparent SVG and PNG exports, editable vector masters, an export script, usage notes, and `han-river-data-brand-kit.zip`. Keep those files out of Git and deployment artifacts.

## Preview

Run `python3 -m http.server 8000 --bind 127.0.0.1` from this directory and open `http://127.0.0.1:8000`.

## Publish

GitHub Pages serves the root of the `main` branch. Changes pushed to `main` publish automatically. The custom domain is `hanriverdata.com`, configured in GitHub Pages and the `CNAME` file.

Namecheap BasicDNS points the apex domain (`@`) to GitHub Pages using four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. The `www` CNAME points to `jelee2000.github.io`.

Website DNS changes must preserve the Google Workspace MX, SPF, DKIM, and domain-verification records.
