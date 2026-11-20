const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const listeners={};
let lastNotification;
let opened;
const origin='https://titanes.example';
const clients={matchAll:async()=>[],openWindow:async url=>{opened=url;return null}};
const self={location:{origin},registration:{showNotification:async(title,options)=>{lastNotification=options}},addEventListener:(name,fn)=>{listeners[name]=fn},skipWaiting:()=>{},clients};
const context=vm.createContext({self,clients,URL,fetch:()=>{},caches:{match:()=>{}}});
vm.runInContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),context);
async function push(raw){let p;listeners.push({data:{json:()=>({url:raw})},waitUntil:x=>p=x});await p;return lastNotification.data.url}
async function click(raw){opened=undefined;let p;listeners.notificationclick({notification:{data:{url:raw},close:()=>{}},waitUntil:x=>p=x});await p;return opened}
for(const [label,input,expected] of [
 ['relative','/turnos','https://titanes.example/turnos'],
 ['relative with query','/turnos?mesa=1','https://titanes.example/turnos?mesa=1'],
 ['same origin absolute','https://titanes.example/torneos','https://titanes.example/torneos'],
 ['external domain','https://example.net/phish','https://titanes.example/'],
 ['subdomain lookalike','https://titanes.example.evil.net/','https://titanes.example/'],
 ['protocol relative external','//example.net/path','https://titanes.example/'],
 ['javascript protocol','javascript:alert(1)','https://titanes.example/'],
 ['data protocol','data:text/html,test','https://titanes.example/'],
 ['malformed URL','http://[bad','https://titanes.example/'],
 ['missing value',undefined,'https://titanes.example/'],
 ['oversized value','a'.repeat(2100),'https://titanes.example/']
]){
 test('push URL: '+label,async()=>assert.equal(await push(input),expected));
 test('click URL: '+label,async()=>assert.equal(await click(input),expected));
}
