import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';
import { rankPlayers } from '../../../lib/points';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const admin = getSupabaseAdmin();

  const { data: config } = await admin.from('league_config').select('*').eq('id', 1).single();
  if (!config || !config.season_active) {
    return res.status(400).json({ error: 'Aktif bir sezon yok.' });
  }

  const { data: players } = await admin.from('players').select('*').eq('is_approved', true);
  const ranked = rankPlayers(players || []);

  const standings = ranked.map((p) => ({
    player_id: p.id,
    full_name: p.full_name,
    club: p.club,
    total_points: p.total_points,
    rank: p.rank,
  }));

  const { error: archiveErr } = await admin.from('season_archives').insert({
    season_number: config.season_number,
    standings,
  });
  if (archiveErr) return res.status(500).json({ error: archiveErr.message });

  const { error: configErr } = await admin
    .from('league_config')
    .update({ season_active: false })
    .eq('id', 1);
  if (configErr) return res.status(500).json({ error: configErr.message });

  return res.status(200).json({ ok: true, archivedPlayers: standings.length });
}
