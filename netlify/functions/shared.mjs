import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const store = () => getStore({name:'hun-auth',consistency:'strong'});
export const allowed = email => !!email && (process.env.AUTHORIZED_EMAILS || '').split(',').map(x=>x.trim().toLowerCase()).includes(email);
export function digest(value) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET missing');
  return createHmac('sha256',secret).update(value).digest('hex');
}
export function equal(a,b) { return typeof a==='string' && typeof b==='string' && a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b)); }
export const cookieToken = req => (req.headers.get('cookie')||'').match(/(?:^|;\s*)hun_session=([a-f0-9]{64})(?:;|$)/)?.[1];
export const cookie = (token,age) => `hun_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
export async function session(req) {
  const token=cookieToken(req); if(!token) return null;
  const s=await store().get('session/'+digest(token),{type:'json'});
  return s && s.expires>Date.now() && allowed(s.email) ? s : null;
}
export const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
