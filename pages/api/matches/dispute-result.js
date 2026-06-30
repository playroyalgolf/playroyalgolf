import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me = await getPlayerFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

  const { matchId } = req.body || {};
  if (!matchId) return res.status(400).json({ error: 'Maç belirtilmedi.' });

  const admin = getSupabaseAdmin();
  const { data: match, error } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (error || !match) return res.status(404).json({ error: 'Maç bulunamadı.' });

  if (match.challenger_id !== me.id && match.opponent_id !== me.id) {
    return res.status(403).json({ error: 'Bu maça erişiminiz yok.' });
  }
  if (match.status !== 'awaiting_confirmation') {
    return res.status(400).json({ error: 'İtiraz edilecek bir sonuç yok.' });
  }
  if (match.proposed_by_id === me.id) {
    return res.status(400).json({ error: 'Kendi bildirdiğiniz sonuca itiraz edemezsiniz.' });
  }

  const { error: updateErr } = await admin
    .from('matches')
    .update({
      status: 'scheduled',
      proposed_winner_id: null,
      proposed_by_id: null,
      result_note: null,
    })
    .eq('id', matchId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.status(200).json({ ok: true });
}
