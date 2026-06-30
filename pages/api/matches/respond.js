import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me = await getPlayerFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

  const { matchId, action } = req.body || {};
  if (!matchId || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Geçersiz istek.' });
  }

  const admin = getSupabaseAdmin();
  const { data: match, error } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (error || !match) return res.status(404).json({ error: 'Maç bulunamadı.' });
  if (match.opponent_id !== me.id) {
    return res.status(403).json({ error: 'Bu teklifi sadece teklif edilen oyuncu cevaplayabilir.' });
  }
  if (match.status !== 'pending') {
    return res.status(400).json({ error: 'Bu teklif zaten cevaplanmış.' });
  }

  const newStatus = action === 'accept' ? 'scheduled' : 'rejected';
  const { error: updateErr } = await admin
    .from('matches')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('id', matchId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.status(200).json({ status: newStatus });
}
