from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='<!--PROFILE_PHOTO_MOBILE_FIX_V1-->'
if marker in s:
    print('Patch already applied')
    raise SystemExit(0)

pattern=re.compile(r"window\.profilePhotoFile=null;\nwindow\.previewProfilePhoto=file=>\{.*?\n\};\nasync function compressProfilePhoto\(file\)\{.*?\n\}\nasync function uploadProfilePhoto",re.S)
replacement=r'''window.profilePhotoFile=null;
function readPhotoAsDataURL(file){
 return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('No se pudo leer la foto seleccionada.'));r.readAsDataURL(file)})
}
function loadPhotoElement(src){
 return new Promise((resolve,reject)=>{let img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('El teléfono no pudo abrir esta imagen. Prueba con una foto JPG o PNG.'));img.src=src})
}
window.previewProfilePhoto=async file=>{
 if(!file)return;
 const type=(file.type||'').toLowerCase(),name=file.name||'',valid=['image/jpeg','image/png','image/webp'].includes(type)||/\.(jpe?g|png|webp)$/i.test(name);
 if(!valid)return alert('Selecciona una foto JPG, PNG o WebP. Si tu teléfono usa HEIC/HEIF, conviértela o toma una captura de pantalla y sube esa imagen.');
 if(file.size>5*1024*1024)return alert('La foto no puede superar 5 MB.');
 const img=document.getElementById('profilePhotoPreview'),ini=document.getElementById('profileInitials');
 try{
  const src=await readPhotoAsDataURL(file);await loadPhotoElement(src);window.profilePhotoFile=file;
  if(img){img.src=src;img.style.display='block'}if(ini)ini.style.display='none';
 }catch(e){window.profilePhotoFile=null;if(img){img.removeAttribute('src');img.style.display='none'}if(ini)ini.style.display='grid';alert(e?.message||'No se pudo mostrar la foto. Prueba con otra imagen.')}
};
async function compressProfilePhoto(file){
 const src=await readPhotoAsDataURL(file),img=await loadPhotoElement(src),max=700,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;let ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo procesar la foto en este teléfono.');ctx.drawImage(img,0,0,w,h);
 return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo convertir la foto. Prueba con JPG o PNG.')),'image/jpeg',0.86));
}
async function uploadProfilePhoto'''

s,n=pattern.subn(replacement,s,count=1)
if n!=1:
    raise SystemExit(f'Profile photo function replacement failed: {n}')

# Evita que una vista previa vacía muestre el icono de imagen rota.
s=s.replace('<img id="profilePhotoPreview" class="profilePhoto" style="display:none" alt="Vista previa">','<img id="profilePhotoPreview" class="profilePhoto" style="display:none" alt="">',1)

s=s.replace('</body></html>',marker+'</body></html>',1)
p.write_text(s,encoding='utf-8')
print('PROFILE_PHOTO_MOBILE_FIX_V1 applied successfully',len(s))
