from pathlib import Path
p=Path('finanzas.html')
s=p.read_text(encoding='utf-8')
old='<button class="btn primary" style="width:100%;min-height:52px">Entrar a Titanes Finanzas</button><button class="btn ghost" type="button" style="width:100%;margin-top:8px" onclick="signup()">Crear cuenta</button><div id="authMsg" class="muted" style="margin-top:10px"></div>'
new='<button class="btn primary" style="width:100%;min-height:52px">Entrar a Titanes Finanzas</button><button class="btn ghost" type="button" style="width:100%;margin-top:8px" onclick="signup()">Crear cuenta</button><button class="btn ghost" type="button" style="width:100%;margin-top:8px" onclick="forgotPassword()">¿Olvidaste tu contraseña?</button><div id="authMsg" class="muted" style="margin-top:10px"></div>'
if old not in s: raise SystemExit('login block not found')
s=s.replace(old,new,1)
old2="async function signup(){const{error}=await sb.auth.signUp({email:email.value,password:password.value});authMsg.textContent=error?error.message:'Cuenta creada.'}async function logout()"
new2="async function signup(){const{error}=await sb.auth.signUp({email:email.value,password:password.value});authMsg.textContent=error?error.message:'Cuenta creada.'}async function forgotPassword(){let mail=(email.value||'').trim();if(!mail){authMsg.textContent='Escribe primero tu correo electrónico.';return}authMsg.textContent='Enviando enlace de recuperación...';const{error}=await sb.auth.resetPasswordForEmail(mail,{redirectTo:location.origin+location.pathname});authMsg.textContent=error?error.message:'Si el correo está registrado, recibirás un enlace para recuperar el acceso.'}async function logout()"
if old2 not in s: raise SystemExit('signup block not found')
s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
