import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const { playerId, totalPoints } = req.body || {};
  if (!playerId || totalPoints === undefined || totalPoints === null || isNaN(Number(totalPoints))) {
    return res.status(400).json({ error: 'Geçerli bir puan değeri girin.' });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('players')
    .update({ total_points: Number(totalPoints) })
    .eq('id', playerId);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
