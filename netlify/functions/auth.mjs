import { randomInt, randomBytes } from 'node:crypto';
import { store, allowed, digest, equal, cookieToken, cookie, json } from './shared.mjs';
export default async function handler(req,context) {
  if(req.method!=='POST') return json({message:'Método no permitido'},405);
  if(req.headers.get('origin')!==new URL(req.url).origin) return json({message:'Origen no permitido'},403);
  try {
    const {action,email:raw,code}=await req.json();
    const db=store(); const now=Date.now();
    if(action==='logout') {
      const token=cookieToken(req); if(token) await db.delete('session/'+digest(token));
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    const email=typeof raw==='string'?raw.trim().toLowerCase():'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) return json({message:'Correo inválido'},400);
    const key='otp/'+digest(email);
    const generic='Si el correo está autorizado, recibirás un código.';
    if(action==='send') {
      if(!allowed(email)) return json({message:generic});
      const old=await db.getWithMetadata(key,{type:'json'});
      const prev=old?.data;
      if(prev && now-prev.sent<60000) return json({message:'Espera 60 segundos antes de reenviar.'},429);
      const count=prev && now-prev.window<3600000?prev.count:0;
      if(count>=5) return json({message:'Límite de envíos alcanzado. Intenta más tarde.'},429);
      const otp=String(randomInt(0,1000000)).padStart(6,'0');
      const record={hash:digest(email+':'+otp),expires:now+300000,sent:now,attempts:0,count:count+1,window:count?prev.window:now};
      const saved=await db.setJSON(key,record,old?{onlyIfMatch:old.etag}:{onlyIfNew:true});
      if(!saved.modified) return json({message:'Intenta nuevamente en un momento.'},429);
      const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'HUN - Calidad asistencial',email:process.env.BREVO_SENDER_EMAIL},to:[{email}],subject:'Código de acceso al dashboard',htmlContent:`<p>Tu código de verificación es:</p><h1>${otp}</h1><p>Vence en 5 minutos. No compartas este código.</p>`})});
      if(!response.ok) return json({message:'No se pudo enviar el correo. Intenta más tarde.'},502);
      return json({message:generic});
    }
    if(action==='verify') {
      const invalid=()=>json({message:'Código inválido o vencido.'},401);
      if(!allowed(email)||typeof code!=='string'||!/^\d{6}$/.test(code)) return invalid();
      const old=await db.getWithMetadata(key,{type:'json'}); const r=old?.data;
      if(!r||r.expires<=now||r.attempts>=5||r.used) return invalid();
      const valid=equal(r.hash,digest(email+':'+code));
      const saved=await db.setJSON(key,{...r,attempts:r.attempts+1,used:valid},{onlyIfMatch:old.etag});
      if(!saved.modified||!valid) return invalid();
      const token=randomBytes(32).toString('hex');
      await db.setJSON('session/'+digest(token),{email,expires:now+28800000});
      return json({ok:true},200,{'Set-Cookie':cookie(token,28800)});
    }
    return json({message:'Acción inválida'},400);
  } catch { return json({message:'Error del servidor. Contacta al administrador.'},500); }
}