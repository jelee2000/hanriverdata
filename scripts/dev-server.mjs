import http from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from '../.vercel/output/functions/brand.func/index.mjs';

const staticRoot = new URL('../.vercel/output/static/', import.meta.url);
const types = { html: 'text/html', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };
http.createServer(async (req, res) => {
  if (req.url.startsWith('/brand')) return handler(req, res);
  const filename = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!/^[a-z0-9.-]+$/.test(filename)) { res.writeHead(404); return res.end(); }
  try { const body = await readFile(new URL(filename, staticRoot)); res.setHeader('Content-Type', types[filename.split('.').pop()] || 'text/plain'); res.end(body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(8000, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8000'));
