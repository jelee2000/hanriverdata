import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { randomBytes, scryptSync } from 'node:crypto';
import { createHandler } from '../server/brand.mjs';

let server, base, folder, env;
let time = Date.now();
const password = randomBytes(18).toString('base64url');
const privateContents = Buffer.from('private brand kit fixture');
before(async () => {
  folder = await mkdtemp(`${tmpdir()}/hrd-brand-test-`);
  await writeFile(`${folder}/manifest.json`, JSON.stringify(['index.html', 'kit.zip']));
  await writeFile(`${folder}/index.html`, '<h1>private gallery</h1>');
  await writeFile(`${folder}/kit.zip`, privateContents);
  const salt = randomBytes(16).toString('hex');
  env = { BRAND_SESSION_SECRET: randomBytes(32).toString('hex'), BRAND_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 32).toString('hex')}` };
  server = http.createServer(createHandler({ env, assets: pathToFileURL(`${folder}/`), now: () => time }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(folder, { recursive: true }); });
async function login(value = password, origin = base) {
  return fetch(`${base}/brand/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password: value }), redirect: 'manual' });
}
async function session() { return (await login()).headers.get('set-cookie').split(';')[0]; }

test('logged-out visitors see only the login page; direct and HEAD downloads are denied', async () => {
  const page = await fetch(`${base}/brand/`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /type="password"/);
  assert.doesNotMatch(html, /private gallery/);
  for (const method of ['GET', 'HEAD']) {
    const file = await fetch(`${base}/brand/kit.zip`, { method });
    assert.equal(file.status, 401);
    assert.match(file.headers.get('cache-control'), /no-store/);
    assert.notEqual(await file.text(), privateContents.toString());
  }
});
test('wrong password and cross-origin login are rejected', async () => {
  const wrong = await login('wrong');
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('set-cookie'), null);
  assert.equal((await login(password, 'https://attacker.example')).status, 403);
});
test('correct password grants a secure expiring cookie and authenticates downloads', async () => {
  const response = await login();
  assert.equal(response.status, 303);
  const cookie = response.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=28800']) assert.ok(cookie.includes(flag));
  const headers = { Cookie: cookie.split(';')[0] };
  const gallery = await fetch(`${base}/brand/`, { headers });
  assert.match(await gallery.text(), /private gallery/);
  const file = await fetch(`${base}/brand/kit.zip`, { headers });
  assert.equal(file.status, 200);
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), privateContents);
  assert.equal(file.headers.get('content-type'), 'application/zip');
  assert.match(file.headers.get('cache-control'), /private, no-store/);
  assert.match(file.headers.get('content-disposition'), /attachment/);
});
test('tampered, expired, and duplicate sessions do not expose files', async () => {
  const cookie = await session();
  for (const value of [`${cookie.slice(0, -1)}!`, `${cookie}; ${cookie}`]) {
    assert.equal((await fetch(`${base}/brand/kit.zip`, { headers: { Cookie: value } })).status, 401);
  }
  time += 8 * 60 * 60 * 1000 + 1000;
  assert.equal((await fetch(`${base}/brand/kit.zip`, { headers: { Cookie: cookie } })).status, 401);
});
test('authenticated requests cannot read server files or arbitrary paths', async () => {
  const headers = { Cookie: await session() };
  for (const name of ['manifest.json', 'index.mjs', '%2e%2e%2findex.mjs', 'assets/kit.zip']) {
    assert.equal((await fetch(`${base}/brand/${name}`, { headers })).status, 404);
  }
});
test('logout requires same origin and clears the cookie', async () => {
  const headers = { Cookie: await session(), Origin: base };
  const response = await fetch(`${base}/brand/logout`, { method: 'POST', headers, redirect: 'manual' });
  assert.equal(response.status, 303);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await fetch(`${base}/brand/logout`, { method: 'POST', headers: { ...headers, Origin: 'https://attacker.example' } })).status, 403);
});
test('missing secrets fail closed even with a supplied cookie', async () => {
  const closed = http.createServer(createHandler({ env: {} }));
  await new Promise(resolve => closed.listen(0, '127.0.0.1', resolve));
  try { assert.equal((await fetch(`http://127.0.0.1:${closed.address().port}/brand/kit.zip`, { headers: { Cookie: await session() } })).status, 503); }
  finally { await new Promise(resolve => closed.close(resolve)); }
});
test('deployment output contains no public kit, source, or credential files', async () => {
  const output = new URL('../.vercel/output/', import.meta.url);
  const files = await readdir(new URL('static/', output));
  assert.deepEqual(files.sort(), ['apple-touch-icon.png', 'favicon-32.png', 'favicon.ico', 'favicon.svg', 'icon-512.png', 'index.html', 'river-mark.svg', 'social-preview.png'].sort());
  assert.match(await readFile(new URL('functions/brand.func/assets/index.html', output), 'utf8'), /action="\/brand\/logout"/);
});
