import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const turns = readFileSync(new URL('../turn-system-v4.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));

test('Turnos resynchronizes on visibility, page restore and reconnection', () => {
  for (const event of ['visibilitychange', 'pageshow', 'online']) {
    assert.ok(turns.includes(`addEventListener('${event}',scheduleTurnResumeRefresh)`), `${event} resume hook missing`);
  }
  assert.match(turns, /if\(document\.hidden\|\|!navigator\.onLine\)return/);
  assert.match(turns, /if\(!document\.hidden&&!busy\)sync\(\)/);
});

test('Turnos retains server-authoritative queue and mutations', () => {
  assert.match(turns, /sb\.from\('turn_waitlist_live'\)/);
  assert.match(turns, /sb\.rpc\(name,args\|\|\{\}\)/);
  assert.doesNotMatch(turns, /localStorage\.setItem\(['"](?:score|points|turn_waitlist)/);
});

test('PWA remains installed in standalone mode with consistent scope', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
});
