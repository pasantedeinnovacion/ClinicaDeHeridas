
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { session } from './shared.mjs';

const types = {
    'index.html': 'text/html; charset=utf-8',
    'app.js': 'text/javascript; charset=utf-8',
    'datos.js': 'text/javascript; charset=utf-8',
    'etiquetas.js': 'text/javascript; charset=utf-8',
    'styles.css': 'text/css; charset=utf-8'
};

export default async function handler(req) {
  const url = new URL(req.url);

  const pathname = url.pathname.split('/').pop();

  const file =
    url.searchParams.get('file') ||
    (Object.hasOwn(types, pathname) ? pathname : 'index.html');

  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff'
  };

  if (!Object.hasOwn(types, file)) {
    return new Response('No encontrado', {
      status: 404,
      headers
    });
  }

  try {
    if (!(await session(req))) {
      if (file === 'index.html') {
        return new Response(null, {
          status: 302,
          headers: {
            ...headers,
            Location: '/login.html'
          }
        });
      }

      return new Response('No autorizado', {
        status: 401,
        headers
      });
    }

    const filePath = resolve('private', file);
    const content = await readFile(filePath);

    return new Response(content, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': types[file]
      }
    });

  } catch (error) {
    console.error('Error cargando archivo:', file, error);

    return new Response('Archivo no disponible', {
      status: 503,
      headers
    });
  }
}
