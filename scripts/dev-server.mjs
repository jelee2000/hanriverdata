import http from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from '../.vercel/output/functions/brand.func/index.mjs';

const staticRoot = new URL('../.vercel/output/static/', import.meta.url);
const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };
const pages = { '/': 'index.html', '/privacy-policy/': 'privacy-policy/index.html', '/privacy-policy/ko/': 'privacy-policy/ko/index.html' };
const policyFiles = new Set(['privacy-policy/index.html', 'privacy-policy/ko/index.html', 'privacy-policy/style.css']);
http.createServer(async (req, res) => {
  if (req.url.startsWith('/brand')) return handler(req, res);
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (['/privacy-policy', '/privacy-policy/ko'].includes(pathname)) { res.writeHead(308, { Location: `${pathname}/` }); return res.end(); }
  const filename = pages[pathname] || pathname.slice(1);
  if (!/^[a-z0-9.-]+$/.test(filename) && !policyFiles.has(filename)) { res.writeHead(404); return res.end(); }
  try { const body = await readFile(new URL(filename, staticRoot)); res.setHeader('Content-Type', types[filename.split('.').pop()] || 'text/plain'); res.end(body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(8000, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8000'));
