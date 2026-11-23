import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('async function voidScore(');
const end = html.indexOf('\nasync function correctScoreV2(', start);
assert.ok(start >= 0 && end > start, 'La función voidScore debe existir');
const source = html.slice(start, end);
assert.match(html, /if\(a==='voidScore'\)return voidScore\(b\.dataset\.id,\+b\.dataset\.points\)/);
assert.match(html, /data-a="voidScore"/);

async function scenario({dialogResult,confirmed=true,rpcError=null,expectedRpc=0,expectedRender=0}) {
  let rpcCount=0,renderCount=0,alerts=[],toasts=[];
  const context={
    titanScoreDialog: async()=>dialogResult,
    confirm:()=>confirmed,
    alert:(message)=>alerts.push(message),
    scoreToast:(message)=>toasts.push(message),
    render:async()=>{renderCount++},
    sb:{rpc:async(name,args)=>{rpcCount++;assert.equal(name,'void_score_event');assert.deepEqual(JSON.parse(JSON.stringify(args)),{p_event_id:'event-123',p_reason:dialogResult.reason.trim()});return {error:rpcError}}},
  };
  vm.createContext(context);
  vm.runInContext(source,context);
  await vm.runInContext("voidScore('event-123',34)",context);
  assert.equal(rpcCount,expectedRpc);
  assert.equal(renderCount,expectedRender);
  return {alerts,toasts};
}
await scenario({dialogResult:null});
await scenario({dialogResult:{reason:'Error de anotación'},confirmed:false});
const ok=await scenario({dialogResult:{reason:'  Duplicada  '},expectedRpc:1,expectedRender:1});
assert.match(ok.toasts.join(' '),/Anotación anulada/);
const fail=await scenario({dialogResult:{reason:'Duplicada'},rpcError:{message:'Permiso denegado'},expectedRpc:1});
assert.match(fail.alerts.join(' '),/Permiso denegado/);
console.log('PASS: Anular — cancelación, confirmación, RPC, refresco y error');
