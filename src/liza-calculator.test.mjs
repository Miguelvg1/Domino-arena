import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression of the actual client liza notification contract, not a simulated
// database liza calculation. Backend end-to-end validation remains separate.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/type==='liza_200_0'/,'Missing real-time liza event handler');
assert.match(html,/function globalClubAlert\(n\)/,'Missing global liza alert renderer');
assert.match(html,/winner_pair&&meta\.loser_pair/,'Missing winning and losing pairs');
assert.match(html,/200–0/,'Missing liza 200–0 display');
console.log('PASS: actual UI liza notification contract');
