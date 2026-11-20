import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/function globalClubAlert\(n\)/);
assert.match(html,/type==='liza_200_0'/);
assert.match(html,/class="globalClubAlertCard"/);
assert.match(html,/winner_pair&&meta\.loser_pair/);
assert.match(html,/setTimeout\(\(\)=>d\.remove\(\),12000\)/);
console.log('PASS: liza UI source smoke checks (not browser rendering)');
