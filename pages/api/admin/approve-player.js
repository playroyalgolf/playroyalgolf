import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const { playerId, approve } = req.body || {};
  if (!playerId || typeof approve !== 'boolean') {
    return res.status(400).json({ error: 'Geçersiz istek.' });
  }

  const admin = getSupabaseAdmin();
  if (approve) {
    const { error } = await admin.from('players').update({ is_approved: true }).eq('id', playerId);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    // Reddedilen kayıt tamamen silinir.
    const { error } = await admin.from('players').delete().eq('id', playerId);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
