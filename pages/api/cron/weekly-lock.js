import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { rankPlayers, tierForTotalPoints } from '../../../lib/points';
import { runMaintenanceTasks } from '../../../lib/maintenance';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = getSupabaseAdmin();

  const { data: players, error } = await admin.from('players').select('*').eq('is_approved', true);
  if (error) return res.status(500).json({ error: error.message });

  const ranked = rankPlayers(players || []);
  const weekStart = new Date().toISOString().slice(0, 10);

  for (const p of ranked) {
    const tierPower = tierForTotalPoints(p.total_points);
    await admin
      .from('players')
      .update({ locked_points: tierPower, locked_rank: p.rank })
      .eq('id', p.id);

    await admin.from('weekly_snapshots').insert({
      week_start: weekStart,
      player_id: p.id,
      rank: p.rank,
      locked_points: tierPower,
    });
  }

  const maintenance = await runMaintenanceTasks(admin);

  await admin
    .from('league_config')
    .update({ last_weekly_update: new Date().toISOString() })
    .eq('id', 1);

  return res.status(200).json({ ok: true, playersLocked: ranked.length, maintenance });
}
