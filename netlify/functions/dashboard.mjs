import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { session } from './shared.mjs';
const types={'index.html':'text/html; charset=utf-8','app.js':'text/javascript; charset=utf-8','datos.js':'text/javascript; charset=utf-8','etiquetas.js':'text/javascript; charset=utf-8'};
export default async function handler(req) {
  const file=new URL(req.url).searchParams.get('file')||'index.html';
  const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
  if(!Object.hasOwn(types,file)) return new Response('No encontrado',{status:404,headers});
  try {
    if(!await session(req)) return file==='index.html'?new Response(null,{status:302,headers:{...headers,Location:'/login.html'}}):new Response('No autorizado',{status:401,headers});
    return new Response(await readFile(resolve('private',file)),{headers:{...headers,'Content-Type':types[file]}});
  } catch { return new Response('Archivo no disponible',{status:503,headers}); }
}
