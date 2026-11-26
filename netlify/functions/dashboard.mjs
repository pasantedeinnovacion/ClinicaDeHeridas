import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { session } from './shared.mjs';
import { obtenerDatosRedcap } from './redcap.mjs';

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
        (Object.hasOwn(types, pathname)
            ? pathname
            : 'index.html');

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

        if (!await session(req)) {

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

        // Consultar REDCap dinámicamente
        if (file === 'datos.js') {

            const datos = await obtenerDatosRedcap();

            return new Response(
                `window.PE1167_DATA = ${JSON.stringify(datos)};`,
                {
                    status: 200,
                    headers: {
                        ...headers,
                        'Content-Type': types[file]
                    }
                }
            );
        }

        // Servir los demás archivos privados
        const contenido = await readFile(
            resolve('private', file)
        );

        return new Response(contenido, {
            status: 200,
            headers: {
                ...headers,
                'Content-Type': types[file]
            }
        });

    } catch (error) {

        console.error('Dashboard:', file, error.message);

        return new Response('Archivo no disponible', {
            status: 503,
            headers
        });
    }
}