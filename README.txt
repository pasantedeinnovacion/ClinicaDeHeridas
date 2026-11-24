Dashboard HUN PE-ID-01 — Netlify + Brevo
1. Copia app.js, datos.js y etiquetas.js originales a private/.
2. Configura BREVO_API_KEY, BREVO_SENDER_EMAIL, AUTHORIZED_EMAILS y AUTH_SECRET en Netlify Functions.
3. npm install; netlify link; netlify deploy --prod --build.
4. Prueba /, /datos.js, /app.js sin sesión; deben redirigir o rechazar acceso. Prueba envío, verificación y cierre de sesión.
No se ha probado el despliegue real. No alojes datos institucionales sin autorización.
