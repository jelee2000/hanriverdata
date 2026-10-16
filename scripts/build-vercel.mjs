import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = path.join(root, '.vercel/output');
const privateRoot = path.join(root, 'private-brand-kit');
const publicFiles = ['index.html', 'river-mark.svg', 'favicon.svg', 'favicon.ico', 'favicon-32.png', 'icon-512.png', 'apple-touch-icon.png', 'social-preview.png', 'privacy-policy/index.html', 'privacy-policy/ko/index.html', 'privacy-policy/style.css'];
// Explicitly select export types; credentials, scripts, and unrelated local files never ship.
const privateFiles = (await readdir(privateRoot)).filter(name => /^(?:logo-[a-z-]+|mark(?:-reversed)?|wordmark|social-preview|brand-sheet)\.(?:svg|png)$/.test(name) || ['index.html', 'README.txt', 'han-river-data-brand-kit.zip'].includes(name));
for (const required of ['han-river-data-brand-kit.zip', 'logo-square-light.png']) if (!privateFiles.includes(required)) throw new Error(`Missing private asset: ${required}`);
if (!privateFiles.includes('index.html')) privateFiles.push('index.html');
await rm(output, { recursive: true, force: true });
const fn = path.join(output, 'functions/brand.func');
await mkdir(path.join(output, 'static'), { recursive: true });
await mkdir(path.join(fn, 'assets'), { recursive: true });
for (const name of publicFiles) {
  const destination = path.join(output, 'static', name);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, name), destination);
}
for (const name of privateFiles.filter(name => name !== 'index.html')) await cp(path.join(privateRoot, name), path.join(fn, 'assets', name));
let gallery = await readFile(path.join(root, 'server/gallery.html'), 'utf8');
gallery = gallery.replace('</style>', '.signout{margin:0}.signout button{padding:0;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:4px;cursor:pointer}.signout button:focus-visible{outline:2px solid #4e6346;outline-offset:4px}</style>');
gallery = gallery.replace('<a href="../">back to the website</a></footer>', '<form class="signout" method="post" action="/brand/logout"><button type="submit">sign out</button></form></footer>');
await writeFile(path.join(fn, 'assets/index.html'), gallery);
await writeFile(path.join(fn, 'assets/manifest.json'), JSON.stringify(privateFiles));
await cp(path.join(root, 'server/brand.mjs'), path.join(fn, 'index.mjs'));
await writeFile(path.join(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 10 }));
await writeFile(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes: [
  { src: '^/brand(?:/.*)?$', dest: '/brand' },
  { src: '^/$', dest: '/index.html' },
  { src: '^/privacy-policy$', status: 308, headers: { Location: '/privacy-policy/' } },
  { src: '^/privacy-policy/ko$', status: 308, headers: { Location: '/privacy-policy/ko/' } },
  { src: '^/privacy-policy/$', dest: '/privacy-policy/index.html' },
  { src: '^/privacy-policy/ko/$', dest: '/privacy-policy/ko/index.html' },
  { handle: 'filesystem' },
  { src: '/.*', status: 404 }
] }, null, 2));
console.log(`Built public homepage, bilingual privacy policy, and password-gated brand kit (${privateFiles.length} private files).`);
