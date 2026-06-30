import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const { archiveId } = req.body || {};
  if (!archiveId) return res.status(400).json({ error: 'Arşiv kaydı belirtilmedi.' });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('season_archives').delete().eq('id', archiveId);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
