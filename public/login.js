const form=document.querySelector('#login'),email=document.querySelector('#email'),code=document.querySelector('#code'),submit=document.querySelector('#submit'),resend=document.querySelector('#resend'),message=document.querySelector('#message');
let verifying=false;
async function request(action){
 submit.disabled=resend.disabled=true;
 try{
 const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email:email.value,code:code.value})});
 const data=await response.json(); message.textContent=data.message||'';
 if(!response.ok)return;
 if(action==='verify'&&data.ok){location.replace('/');return;}
 if(action==='send'){verifying=true;email.readOnly=true;document.querySelector('#verification').hidden=false;code.required=true;resend.hidden=false;submit.textContent='Verificar e ingresar';code.focus();}
 }catch{message.textContent='Error de conexión. Intenta nuevamente.';}finally{submit.disabled=resend.disabled=false;}
}
form.addEventListener('submit',e=>{e.preventDefault();request(verifying?'verify':'send');});
resend.addEventListener('click',()=>request('send'));
