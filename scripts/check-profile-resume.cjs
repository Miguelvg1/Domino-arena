const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
const checks = [
 ['consulta de perfil detecta errores', /async function loadMe\(\)[\s\S]{0,750}if\(r\.error\)/],
 ['render captura fallo del perfil', /async function render\(\)[\s\S]{0,260}catch\(e\)/],
 ['evento auth no consulta perfil asincronamente', /onAuthStateChange\(\(_,s\)=>\{session=s;scheduleRender\(50\)\}\)/],
 ['scheduler controla excepciones', /try\{await render\(\)\}catch\(e\)/],
 ['recuperacion de visibilidad', /visibilitychange/],
 ['recuperacion de pagina', /pageshow/],
 ['recuperacion de conexion', /addEventListener\('online'/],
];
for(const [name,re] of checks){assert.match(html,re,name);console.log('PASS:',name)}
console.log('7 verificaciones estáticas completadas. No sustituyen pruebas Android.');
