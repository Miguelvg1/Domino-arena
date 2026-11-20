import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static contract checks only: these do not replace authenticated RPC or Android tests.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const checks = [
  ['correct-score action', /async function correctScoreV2\(b\)/],
  ['void-score action', /async function voidScore\(id,points\)/],
  ['correction RPC', /sb\.rpc\('correct_score_event_v2'/],
  ['void RPC', /sb\.rpc\('void_score_event'/],
  ['double click guard', /if\(b\.dataset\.busy==='1'\)return/],
  ['busy state', /b\.dataset\.busy='1'/],
  ['await action', /await action\(b\.dataset\.a,b\)/],
  ['button reset', /b\.disabled=false/],
  ['liza alert', /type==='liza_200_0'/],
  ['score recalculation feedback', /marcador recalculado/],
];
for (const [label, pattern] of checks) {
  assert.match(html, pattern, 'Missing contract: ' + label);
  console.log('PASS:', label);
}
console.log('Static UI contracts passed; real score/liza behavior still requires lab integration tests.');
