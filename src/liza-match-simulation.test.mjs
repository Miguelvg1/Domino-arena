import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Contract checks for score correction after a liza; NOT an integration simulation.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/async function correctScoreV2\(b\)/);
assert.match(html,/async function voidScore\(id,points\)/);
assert.match(html,/sb\.rpc\('correct_score_event_v2'/);
assert.match(html,/sb\.rpc\('void_score_event'/);
assert.match(html,/await render\(\)/);
assert.match(html,/p_new_points:points/);
assert.match(html,/p_reason:data\.reason\.trim\(\)/);
console.log('PASS: score correction and void RPC wiring contracts');
console.log('NOTE: no game simulated; database integration test still required');
