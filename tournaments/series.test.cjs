const assert = require('node:assert/strict');
const test = require('node:test');
const scoring = require('./scoring.js');
const engine = require('./tournament-engine.js');
const series = require('./series.js');

test('32 players complete the bracket, including three-game series and both medal matches', () => {
  const players = Array.from({length: 32}, (_, index) => ({id: String(index), name: 'Jugador ' + index}));
  const pairs = engine.pairPlayers(players, () => 0.5);
  let state = {
    pairs, matches: engine.matchesFromPairs(pairs, () => 0.2).first,
    completedMatches: [], events: {}, round: 1, phase: 'elimination'
  };
  const finish = (match, winner, loser) => {
    const game = series.current(match);
    let history = scoring.add(game, [], loser, 30, 'multa', 'juez', 'responsable');
    history = scoring.add(game, history, winner, 35, 'normal', 'juez');
    history = scoring.voidEvent(game, history, history[1].id, 'juez', 'Anotado en mesa equivocada');
    history = scoring.add(game, history, winner, 214, 'normal', 'juez');
    state.events[game.id] = history;
    state = series.confirm(state, match.id, 'presidencia');
  };
  const observed = [];
  while (state.phase !== 'finished') {
    const round = state.matches;
    observed.push(round.length);
    for (const match of round) {
      finish(match, match.pairA, match.pairB);
      let active = state.matches.find(entry => entry.id === match.id);
      assert.equal(active.winner, null);
      finish(active, match.pairB, match.pairA);
      active = state.matches.find(entry => entry.id === match.id);
      assert.equal(active.winner, null);
      finish(active, match.pairA, match.pairB);
      assert.throws(() => series.confirm(state, match.id, 'presidencia'));
    }
  }
  assert.deepEqual(observed, [8, 4, 2, 2]);
  const all = [...state.completedMatches, ...state.matches];
  const games = all.flatMap(match => match.games);
  assert.equal(games.length, 48);
  assert.equal(new Set(games.map(game => game.id)).size, 48);
  assert.equal(series.rankPairs(all, pairs, state.events).length, 16);
  const rankings = scoring.rankPlayers(games, pairs, state.events);
  assert.equal(rankings.length, 32);
  assert.equal(rankings.reduce((sum, player) => sum + player.lizaWins, 0), 96);
  assert.equal(rankings.reduce((sum, player) => sum + player.lizaLosses, 0), 96);
  assert.equal(state.matches[0].id, 'final');
  assert.equal(state.matches[1].id, 'third');
});

test('every even capacity from 8 to 64 reaches distinct medal matches', () => {
  for (let capacity = 8; capacity <= 64; capacity += 2) {
    const players = Array.from({length: capacity}, (_, index) => ({id: String(index), name: 'Jugador ' + index}));
    const pairs = engine.pairPlayers(players, () => 0.4);
    const draw = engine.matchesFromPairs(pairs, () => 0.4);
    let state = {pairs, matches: draw.first, completedMatches: [], events: {}, round: 1, phase: 'elimination'};
    let seriesPlayed = 0;
    while (state.phase !== 'finished') {
      const matches = state.matches.filter(match => match.type === 'match');
      assert.ok(matches.length);
      for (const match of matches) {
        seriesPlayed++;
        for (let gameNumber = 0; gameNumber < 2; gameNumber++) {
          const active = state.matches.find(entry => entry.id === match.id);
          const game = series.current(active);
          state.events[game.id] = scoring.add(game, [], match.pairA, 200, 'normal', 'juez');
          state = series.confirm(state, match.id, 'presidencia');
        }
      }
    }
    assert.equal(seriesPlayed, capacity / 2);
    assert.equal(new Set(state.matches.flatMap(match => [match.pairA, match.pairB])).size, 4);
    assert.ok(state.completedMatches.every(match => match.round));
  }
});
