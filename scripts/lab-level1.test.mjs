// Static safety regression checks for the isolated level-1 laboratory.
// Run: node --test scripts/lab-level1.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('laboratory points exclusively to laboratory Supabase',()=>{
  assert.match(html,/https:\/\/ybtdxjqodcjoccyuauzv\.supabase\.co/);
  assert.doesNotMatch(html,/https:\/\/hvpyngkqtqzvmweavego\.supabase\.co/);
});
test('correction resets both selected players and switches team',()=>{
  const fn=html.slice(html.indexOf('async function addScore('),html.indexOf('async function correctScoreV2('));
  assert.ok(fn.length>1000,'addScore implementation not found');
  assert.match(fn,/scoreTeam=target;scoreWin='';scoreResp='';/);
  assert.match(fn,/\[data-player\],\[data-resp\]/);
  assert.match(fn,/if\(!scoreWin\)return alert/);
});
test('score RPC occurs only after pre-victory confirmation',()=>{
  const fn=html.slice(html.indexOf('async function addScore('),html.indexOf('async function correctScoreV2('));
  assert.match(fn,/confirmVictoryChoice/);
  assert.match(fn,/sb\.rpc\('add_score_event'/);
  assert.ok(fn.indexOf('confirmVictoryChoice')<fn.indexOf("sb.rpc('add_score_event'"));
});
