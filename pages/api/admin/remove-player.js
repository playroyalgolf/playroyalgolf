import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const { playerId } = req.body || {};
  if (!playerId) return res.status(400).json({ error: 'Oyuncu belirtilmedi.' });
  if (playerId === coordinator.id) {
    return res.status(400).json({ error: 'Kendi hesabınızı bu ekrandan silemezsiniz.' });
  }

  const admin = getSupabaseAdmin();

  // Oyuncuya ait tüm maç kayıtlarını da temizle.
  await admin.from('matches').delete().or(`challenger_id.eq.${playerId},opponent_id.eq.${playerId}`);

  const { error } = await admin.from('players').delete().eq('id', playerId);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
