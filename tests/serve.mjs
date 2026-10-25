// A small static file server for the browser tests and the demo recorder. Serves the repository
// root; `/dir/` means `/dir/index.html`. Usage: const { url, close } = await serve();
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.pxml': 'application/xml' };

export async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (pathname === '/favicon.ico') return void res.writeHead(204).end();
      const path = normalize(join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!path.startsWith(root)) throw new Error('outside the repository');
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': types[extname(path)] ?? 'text/plain' }).end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  await new Promise((ok) => server.listen(0, ok));
  return { url: `http://localhost:${server.address().port}/`, close: () => server.close() };
}
