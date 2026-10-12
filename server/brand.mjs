import { createHmac, randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const scrypt = promisify(deriveKey);
const COOKIE = '__Host-hrd_brand';
const SESSION_SECONDS = 8 * 60 * 60;
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8' };

const loginPage = (error = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>brand kit / han river data</title><link rel="icon" href="/favicon.svg"><style>
:root{color-scheme:light;background:#f7f6f2;color:#252723;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;font-synthesis:none}*{box-sizing:border-box}body{margin:0;-webkit-font-smoothing:antialiased}main{width:min(100% - 48px,440px);min-height:100svh;margin:auto;display:flex;flex-direction:column;justify-content:center;padding:56px 0}header a{display:inline-flex;align-items:center;gap:12px;color:inherit;font-size:17px;font-weight:500;letter-spacing:-.035em;text-decoration:none}header img{width:26px;height:33px}h1{margin:64px 0 12px;font-size:40px;line-height:1.2;letter-spacing:-.055em;font-weight:400}p{margin:0;color:#62655e;font-size:15px;line-height:1.8}form{margin-top:32px}label{display:block;color:#62655e;font-size:13px;margin-bottom:10px}input{width:100%;padding:14px;font:inherit;font-size:16px;border:1px solid #bfc2b8;border-radius:0;background:transparent;color:inherit}button{margin-top:16px;width:100%;padding:14px 18px;background:#252723;color:#f7f6f2;border:1px solid #252723;font:inherit;font-size:14px;cursor:pointer}button:hover{background:#3c4038}a:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid #4e6346;outline-offset:4px}.error{min-height:26px;padding-top:10px;font-size:13px;color:#8a3f31}footer{margin-top:50px;padding-top:18px;border-top:1px solid #dedfd7;font-size:11px;letter-spacing:.025em;color:#777b72}footer a{color:inherit;text-underline-offset:4px}
</style></head><body><main><header><a href="/"><img src="/river-mark.svg" alt="">han river data</a></header><h1>brand kit</h1><p>a few things for the team.<br>enter the shared password to continue.</p><form method="post" action="/brand/login"><label for="password">password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">view brand kit →</button><p class="error" role="status">${error}</p></form><footer><a href="/">back to the website</a></footer></main></body></html>`;

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createHandler({ env = process.env, assets = new URL('./assets/', import.meta.url), now = Date.now } = {}) {
  // Supplemental per-instance throttling; the generated password has 144 bits of entropy.
  const attempts = new Map();
  const secret = env.BRAND_SESSION_SECRET;
  const passwordHash = env.BRAND_PASSWORD_HASH;
  const configured = /^[a-f0-9]{64}$/.test(secret || '') && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(passwordHash || '');
  let manifest;
  const sign = value => createHmac('sha256', secret).update(value).digest('base64url');
  function authenticated(req) {
    const cookies = String(req.headers.cookie || '').split(';').map(value => value.trim()).filter(value => value.startsWith(`${COOKIE}=`));
    if (cookies.length !== 1) return false;
    const token = cookies[0].slice(COOKIE.length + 1);
    if (token.length > 512) return false;
    const pieces = token.split('.');
    if (pieces.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(pieces[0]) || !safeEqual(sign(pieces[0]), pieces[1])) return false;
    try {
      const payload = JSON.parse(Buffer.from(pieces[0], 'base64url'));
      const seconds = Math.floor(now() / 1000);
      return payload.v === 1 && Number.isInteger(payload.exp) && payload.exp > seconds && payload.exp <= seconds + SESSION_SECONDS;
    } catch { return false; }
  }
  function sameOrigin(req) {
    try {
      const origin = new URL(req.headers.origin);
      const local = env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(origin.hostname);
      return origin.host === req.headers.host && (origin.protocol === 'https:' || local);
    } catch { return false; }
  }
  function send(req, res, status, body, type = 'text/plain; charset=utf-8') {
    const buffer = Buffer.from(body);
    res.statusCode = status;
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', buffer.length);
    res.end(req.method === 'HEAD' ? undefined : buffer);
  }
  function redirect(res) { res.statusCode = 303; res.setHeader('Location', '/brand/'); res.end(); }
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Vary', 'Cookie');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const pathname = new URL(req.url, 'https://local.invalid').pathname;
      if (pathname !== '/brand' && !pathname.startsWith('/brand/')) return send(req, res, 404, 'not found');
      if (!configured) return send(req, res, 503, 'brand kit is temporarily unavailable.');
      if (pathname === '/brand/login' && req.method === 'POST') {
        if (!sameOrigin(req)) return send(req, res, 403, 'request not allowed');
        const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
        const key = createHmac('sha256', secret).update(ip).digest('hex');
        const time = now();
        if (attempts.size > 10000) for (const [id, record] of attempts) if (time - record.start >= 60000) attempts.delete(id);
        let record = attempts.get(key);
        if (!record || time - record.start >= 60000) { record = { start: time, count: 0 }; attempts.set(key, record); }
        if (++record.count > 8) { res.setHeader('Retry-After', '60'); return send(req, res, 429, loginPage('too many attempts. try again in a minute.'), CONTENT_TYPES['.html']); }
        if (!String(req.headers['content-type'] || '').startsWith('application/x-www-form-urlencoded')) return send(req, res, 415, 'unsupported request');
        let body = '';
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) return send(req, res, 413, 'request too large'); }
        const password = new URLSearchParams(body).get('password') || '';
        const [, salt, expected] = passwordHash.split('$');
        const computed = password.length <= 256 ? await scrypt(password, salt, 32) : Buffer.alloc(32);
        if (!password || !safeEqual(computed.toString('hex'), expected)) return send(req, res, 401, loginPage('that password didn’t match. try again.'), CONTENT_TYPES['.html']);
        attempts.delete(key);
        const payload = Buffer.from(JSON.stringify({ v: 1, exp: Math.floor(now() / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString('hex') })).toString('base64url');
        res.setHeader('Set-Cookie', `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
        return redirect(res);
      }
      if (pathname === '/brand/logout' && req.method === 'POST') {
        if (!sameOrigin(req)) return send(req, res, 403, 'request not allowed');
        res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
        return redirect(res);
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(req, res, 405, 'method not allowed'); }
      const isIndex = ['/brand', '/brand/', '/brand/index.html'].includes(pathname);
      if (!authenticated(req)) return isIndex ? send(req, res, 200, loginPage(), CONTENT_TYPES['.html']) : send(req, res, 401, 'sign in at /brand/ to access this file.');
      if (pathname === '/brand') { res.statusCode = 308; res.setHeader('Location', '/brand/'); return res.end(); }
      const filename = isIndex ? 'index.html' : pathname.slice('/brand/'.length);
      manifest ||= JSON.parse(await readFile(new URL('manifest.json', assets), 'utf8'));
      if (!manifest.includes(filename)) return send(req, res, 404, 'not found');
      const data = await readFile(new URL(filename, assets));
      const extension = filename.slice(filename.lastIndexOf('.'));
      if (extension === '.zip' || extension === '.txt') res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return send(req, res, 200, data, CONTENT_TYPES[extension]);
    } catch {
      return send(req, res, 500, 'brand kit is temporarily unavailable.');
    }
  };
}

export default createHandler();
