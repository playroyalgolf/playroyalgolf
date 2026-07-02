import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const admin = getSupabaseAdmin();
  const { data: config } = await admin.from('league_config').select('*').eq('id', 1).single();
  if (!config || config.season_active) {
    return res.status(400).json({ error: 'Önce mevcut sezon sonlandırılmalı.' });
  }

  const newSeasonNumber = config.season_number + 1;

  const { error: resetErr } = await admin
    .from('players')
    .update({ total_points: 0, locked_points: 0, locked_rank: null, averaj: 0 })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (resetErr) return res.status(500).json({ error: resetErr.message });

  const { error: configErr } = await admin
    .from('league_config')
    .update({ season_active: true, season_number: newSeasonNumber, last_weekly_update: null })
    .eq('id', 1);
  if (configErr) return res.status(500).json({ error: configErr.message });

  return res.status(200).json({ ok: true, seasonNumber: newSeasonNumber });
}
