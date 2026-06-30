import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me = await getPlayerFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

  const { matchId, scheduledAt } = req.body || {};
  if (!matchId || !scheduledAt) return res.status(400).json({ error: 'Tarih/saat gerekli.' });

  const admin = getSupabaseAdmin();
  const { data: match, error } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (error || !match) return res.status(404).json({ error: 'Maç bulunamadı.' });

  if (match.challenger_id !== me.id && match.opponent_id !== me.id) {
    return res.status(403).json({ error: 'Bu maça erişiminiz yok.' });
  }
  if (match.status !== 'scheduled') {
    return res.status(400).json({ error: 'Tarih sadece planlanmış maçlar için değiştirilebilir.' });
  }

  const { error: updateErr } = await admin
    .from('matches')
    .update({
      scheduled_at: scheduledAt,
      status: 'scheduled',
      reschedule_notice_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.status(200).json({ ok: true });
}
