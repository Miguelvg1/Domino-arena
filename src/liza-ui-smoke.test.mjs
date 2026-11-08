import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const required=[
 ['production feature gate disabled',/const LIZA_LAB_ENABLED=false;/],
 ['60-point action configured',/dos_carotas:60/],
 ['correction button rendered',/data-a="correctScoreV2"/],
 ['correction action routed',/if\(a==='correctScoreV2'\)return correctScoreV2\(b\)/],
 ['void action routed',/if\(a==='voidScore'\)return voidScore/],
 ['correction RPC implemented',/correct_score_event_classified/],
 ['save RPC implemented',/add_score_event_classified/],
 ['UI actions catch errors',/try\{await action\(b\.dataset\.a,b\)\}catch\(err\)/],
 ['in-app correction prompt',/function titanPrompt\(message,initial=/],
 ['correction uses in-app prompt',/await titanPrompt\('Equipo que debe recibir los puntos/],
 ['prevents duplicate score edits',/if\(b\.dataset\.busy==='1'\)return/],
 ['restores score edit button',/finally\{if\(scoreEdit\)/]
];
for(const [label,re] of required) assert.match(html,re,label);
console.log('UI wiring smoke checks passed ('+required.length+')');
