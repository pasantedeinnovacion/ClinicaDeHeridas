document.getElementById('logout')?.addEventListener('click', async () => {
 try { const res = await fetch('/api/auth', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'logout'})}); if(!res.ok) throw Error(); location.replace('/login.html'); } catch { alert('No fue posible cerrar la sesión.'); }
});
