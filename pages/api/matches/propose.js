import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';
import { rankPlayers, canProposeMatch } from '../../../lib/points';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me_ = await getPlayerFromRequest(req);
  if (!me_) return res.status(401).json({ error: 'Giriş yapmalısınız.' });
  if (!me_.is_approved) {
    return res.status(403).json({ error: 'Kaydınız henüz lig koordinatörü tarafından onaylanmadı.' });
  }
  const me = me_;

  const { opponentId, scheduledAt } = req.body || {};
  if (!opponentId) return res.status(400).json({ error: 'Rakip seçilmedi.' });
  if (!scheduledAt) return res.status(400).json({ error: 'Maç tarih ve saati seçilmedi.' });
  if (opponentId === me.id) return res.status(400).json({ error: 'Kendinize teklif gönderemezsiniz.' });

  const admin = getSupabaseAdmin();

  const { data: config } = await admin.from('league_config').select('season_active').eq('id', 1).single();
  if (!config?.season_active) {
    return res.status(400).json({ error: 'Şu an aktif bir sezon yok, teklif gönderilemez.' });
  }

  const { data: opponent, error: oppErr } = await admin
    .from('players')
    .select('*')
    .eq('id', opponentId)
    .single();
  if (oppErr || !opponent) return res.status(404).json({ error: 'Rakip bulunamadı.' });
  if (!opponent.is_approved) {
    return res.status(400).json({ error: 'Bu oyuncu henüz onaylanmadı.' });
  }
  if (!opponent.is_active) {
    return res.status(400).json({ error: 'Bu oyuncu şu an pasif (izinli), teklif gönderilemez.' });
  }

  const { data: allPlayers } = await admin.from('players').select('id, total_points, full_name');
  const ranked = rankPlayers(allPlayers || []);
  const myRank = ranked.find((p) => p.id === me.id)?.rank;
  const rankById = {};
  ranked.forEach((p) => (rankById[p.id] = p.rank));

  const { data: existing } = await admin
    .from('matches')
    .select('*')
    .or(`and(challenger_id.eq.${me.id},opponent_id.eq.${opponentId}),and(challenger_id.eq.${opponentId},opponent_id.eq.${me.id})`)
    .in('status', ['pending', 'accepted', 'scheduled']);
  if (existing && existing.length > 0) {
    return res.status(400).json({ error: 'Bu oyuncuyla zaten sonuçlanmamış bir maçınız var.' });
  }

  const { data: incoming } = await admin
    .from('matches')
    .select('id, challenger_id')
    .eq('opponent_id', me.id)
    .in('status', ['pending']);

  const blockingIncomingMatches = (incoming || []).map((m) => ({
    challenger_rank: rankById[m.challenger_id] || 9999,
    challenger_name: allPlayers.find((p) => p.id === m.challenger_id)?.full_name || '',
  }));

  const check = canProposeMatch({ proposerRank: myRank, blockingIncomingMatches });
  if (!check.allowed) {
    return res.status(400).json({ error: check.reason });
  }

  const { data: match, error: insertErr } = await admin
    .from('matches')
    .insert({ challenger_id: me.id, opponent_id: opponentId, status: 'pending', scheduled_at: scheduledAt })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });
  return res.status(200).json({ match });
}
