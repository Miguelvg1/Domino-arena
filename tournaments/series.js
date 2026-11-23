(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./scoring.js'), require('./tournament-engine.js'));
  else root.TitanesSeries = factory(root.TitanesTournamentScoring, root.TitanesTournament);
})(globalThis, function (scoring, bracket) {
  'use strict';

  function current(match) {
    return { ...match, id: match.id + ':partida-' + ((match.games?.length || 0) + 1) };
  }

  function confirm(state, matchId, actor) {
    const match = state.matches.find(entry => entry.id === matchId);
    if (!match || match.winner) throw Error('Encuentro cerrado o inexistente');
    const game = current(match);
    const result = scoring.finish(game, state.events[game.id] || [], actor);
    const games = [...(match.games || []), result];
    const wins = games.filter(entry => entry.winner === result.winner).length;
    const updated = wins === 2
      ? { ...bracket.recordResult(match, result.winner, actor), games }
      : { ...match, games };
    const matches = state.matches.map(entry => entry.id === matchId ? updated : entry);
    if (!matches.every(entry => entry.winner) || state.phase === 'medals') {
      return { ...state, matches, phase: matches.every(entry => entry.winner) ? 'finished' : state.phase };
    }
    const completedMatches = [...state.completedMatches, ...matches];
    if (matches.length === 2) {
      const { final, third } = bracket.medalMatches(matches);
      return { ...state, completedMatches, phase: 'medals', matches: [
        { ...final, round: 'Final' }, { ...third, round: 'Tercer lugar' }
      ] };
    }
    const round = state.round + 1;
    return { ...state, completedMatches, round, matches: bracket.nextRound(matches, bracket.roundName(matches.length / 2)) };
  }

  function rankPairs(matches, pairs, events) {
    return pairs.map(pair => {
      const appearances = matches.filter(match => match.type === 'match' && (match.pairA === pair.id || match.pairB === pair.id));
      const games = appearances.flatMap(match => match.games || []);
      return {
        pair,
        seriesWon: appearances.filter(match => match.winner === pair.id).length,
        gamesWon: games.filter(game => game.winner === pair.id).length,
        gamesPlayed: games.length,
        points: games.reduce((total, game) => total + scoring.score(game, events[game.id] || [])[pair.id], 0)
      };
    }).filter(row => row.gamesPlayed).sort((a, b) =>
      b.seriesWon - a.seriesWon || b.gamesWon - a.gamesWon || b.points - a.points);
  }

  return { current, confirm, rankPairs };
});
