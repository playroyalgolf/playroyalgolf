import { NO_RESPONSE_DAYS, NO_RESPONSE_FORFEIT_DAYS, INACTIVE_AUTO_REACTIVATE_DAYS, calculateMatchPoints } from './points';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runMaintenanceTasks(admin) {
  const now = new Date();
  const summary = { notified: 0, forfeited: 0, reactivated: 0 };

  const noticeThreshold = new Date(now.getTime() - NO_RESPONSE_DAYS * DAY_MS).toISOString();
  const { data: staleNoNotice } = await admin
    .from('matches')
    .select('id')
    .eq('status', 'pending')
    .is('coordinator_notified_at', null)
    .lt('proposed_at', noticeThreshold);

  for (const m of staleNoNotice || []) {
    await admin.from('matches').update({ coordinator_notified_at: now.toISOString() }).eq('id', m.id);
    summary.notified++;
  }

  const forfeitThreshold = new Date(now.getTime() - NO_RESPONSE_FORFEIT_DAYS * DAY_MS).toISOString();
  const { data: staleNotified } = await admin
    .from('matches')
    .select('*')
    .eq('status', 'pending')
    .not('coordinator_notified_at', 'is', null)
    .lt('coordinator_notified_at', forfeitThreshold);

  for (const m of staleNotified || []) {
    const { data: winner } = await admin.from('players').select('*').eq('id', m.challenger_id).single();
    const { data: loser } = await admin.from('players').select('*').eq('id', m.opponent_id).single();
    if (!winner || !loser) continue;

    const { winnerPoints, loserPoints } = calculateMatchPoints('no_show');
    await admin.from('players').update({ total_points: Number(winner.total_points) + winnerPoints }).eq('id', winner.id);
    await admin.from('players').update({ total_points: Number(loser.total_points) + loserPoints }).eq('id', loser.id);
    await admin.from('matches').update({
      status: 'forfeit_no_response',
      result_winner_id: winner.id,
      result_note: 'Cevapsızlık nedeniyle hükmen',
      points_awarded: winnerPoints,
    }).eq('id', m.id);
    summary.forfeited++;
  }

  const reactivateThreshold = new Date(now.getTime() - INACTIVE_AUTO_REACTIVATE_DAYS * DAY_MS).toISOString();
  const { data: longInactive } = await admin
    .from('players')
    .select('id')
    .eq('is_active', false)
    .lt('inactive_since', reactivateThreshold);

  for (const p of longInactive || []) {
    await admin.from('players').update({ is_active: true, inactive_since: null }).eq('id', p.id);
    summary.reactivated++;
  }

  return summary;
}
