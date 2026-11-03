/**
 * Pure liza calculations. No production database writes.
 * A liza requires a completed game, a valid winner, and zero
 * dominada points for the losing team. Legacy unclassified events
 * make the result indeterminate rather than an automatic liza.
 */
export function classifyLiza(game, events) {
  if (game?.status !== 'finalizada' || !['L','C'].includes(game?.winner)) return 'not_applicable';
  const loser = game.winner === 'L' ? 'C' : 'L';
  const losingEvents = events.filter(e => e.team === loser && !e.voided_at && !e.is_voided && e.status !== 'anulado');
  if (losingEvents.some(e => e.event_type === 'normal' && (e.concept === 'dominada' || e.score_concept === 'dominada'))) return 'no';
  if (losingEvents.some(e => !e.concept && !e.score_concept && e.event_type === 'normal')) return 'indeterminate';
  return 'yes';
}
export function lizaTotals(games, players, events, from, to) {
  const result = new Map();
  const ensure = id => { if (!result.has(id)) result.set(id, { propinadas: 0, recibidas: 0, indeterminadas: 0 }); return result.get(id); };
  for (const game of games) {
    const closed = game.finished_at || game.completed_at || game.ended_at;
    if (!closed || closed < from || closed >= to) continue;
    const status = classifyLiza(game, events.filter(e => e.game_id === game.id));
    if (status === 'not_applicable' || status === 'no') continue;
    const members = players.filter(p => p.game_id === game.id);
    for (const p of members) {
      const id = p.member_id;
      if (!id) continue;
      const total = ensure(id);
      if (status === 'indeterminate') total.indeterminadas++;
      else if (p.team === game.winner) total.propinadas++;
      else total.recibidas++;
    }
  }
  return result;
}
