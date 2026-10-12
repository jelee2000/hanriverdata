# han river data

A minimal website for Han River Data: a public HTML/CSS homepage and a password-protected brand kit served by a Vercel Node.js function. No third-party runtime dependencies.

## Edit

Page copy and styling are in `index.html`. The closing contact link opens an email to `founders@hanriverdata.com`, a Google Workspace mailing group containing `jonathan@hanriverdata.com` and `kevin@hanriverdata.com`. Both founders own the group. Outside senders can email the group; conversations are visible only to group members, and membership is by invitation.

The existing `contact@hanriverdata.com` alias still delivers to `jonathan@hanriverdata.com`.

## Brand assets

The approved river mark appears in the header, browser icons, and social preview. The website uses its original system font stack.

Only the homepage, river mark (`river-mark.svg`), browser icons, and sharing image (`social-preview.png`) belong in the public static output. `/brand/` and every brand download go through the password-checking server function. Never put brand exports or the ZIP in a public static folder or Git.

The complete kit is stored locally in the Git-ignored `private-brand-kit/` directory. It includes square and banner logos, light/dark/transparent SVG and PNG exports, vector masters, an export script, usage notes, and `han-river-data-brand-kit.zip`. The build copies an allowlist of these files into the private function bundle only. The gallery template is `server/gallery.html`.

The shared password is checked against a scrypt hash in Vercel's `BRAND_PASSWORD_HASH` environment variable. `BRAND_SESSION_SECRET` signs eight-hour sessions. Cookies are Secure, HttpOnly, and SameSite=Strict; all private responses disable caching. Missing credentials fail closed. The plaintext password is stored only in the local ignored `.preview/brand-access.txt` handoff file, not in source code or Vercel. To rotate access, change the password hash and session secret in Vercel, then redeploy.

Earlier public Git history still contains the original exports. The new gate protects current website access; it does not remove historical copies.

## Preview

Run `npm run build`, then `npm test` for the authentication and output-isolation checks. `npm run dev` serves the build at `http://127.0.0.1:8000`; supply the two brand environment variables to test login locally. Without them, the brand route returns 503.

## Publish

Vercel project: https://vercel.com/jelee2000s-projects/hanriverdata (personal workspace only).

Production deployment: https://hanriverdata.vercel.app. Custom domain: `hanriverdata.com`.

Deploy locally with `npm run build` followed by `npx vercel deploy --prebuilt --prod --scope jelee2000s-projects`. Private files travel only in the server-function bundle. Git auto-deployment is deliberately disconnected because the public repository does not contain the brand exports. A fresh checkout needs the ZIP restored and unpacked into `private-brand-kit/` before building.

Namecheap BasicDNS points the website to Vercel. Vercel's project-specific recommended apex A records are `216.198.79.1` and `64.29.17.1`; `www` points to `acc6ee5819757e99.vercel-dns-017.com.`. Retrieve current recommendations with `vercel domains verify` before editing DNS. The previous GitHub Pages A records were `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`, with `www` pointing to `jelee2000.github.io`.

Website DNS changes must preserve the Google Workspace MX, SPF, DKIM, domain-verification, and DMARC records. DMARC is published at `_dmarc` with `v=DMARC1; p=none; rua=mailto:founders@hanriverdata.com`. This initial monitoring policy requests aggregate reports for both founders and does not yet request quarantine or rejection of failing mail.
