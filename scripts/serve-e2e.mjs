import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist', 'web');
const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
  const relative = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\//, '');
  let file = join(root, relative || 'index.html');
  try {
    if (!(await stat(file)).isFile()) file = join(root, 'index.html');
  } catch {
    file = join(root, 'index.html');
  }
  response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(response);
}).listen(4187, '127.0.0.1');
