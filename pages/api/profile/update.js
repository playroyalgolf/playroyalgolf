import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me = await getPlayerFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

  const { fullName, club } = req.body || {};
  if (!fullName || !fullName.trim()) return res.status(400).json({ error: 'Ad soyad gerekli.' });
  if (!club) return res.status(400).json({ error: 'Kulüp seçimi gerekli.' });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('players')
    .update({ full_name: fullName.trim(), club })
    .eq('id', me.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
