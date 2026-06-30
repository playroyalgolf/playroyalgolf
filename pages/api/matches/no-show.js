import { getSupabaseAdmin, getPlayerFromRequest } from '../../../lib/supabaseAdmin';
import { calculateMatchPoints } from '../../../lib/points';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const me = await getPlayerFromRequest(req);
  if (!me) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

  const { matchId, noShowPlayerId } = req.body || {};
  if (!matchId || !noShowPlayerId) return res.status(400).json({ error: 'Eksik bilgi.' });

  const admin = getSupabaseAdmin();
  const { data: match, error } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (error || !match) return res.status(404).json({ error: 'Maç bulunamadı.' });

  if (match.challenger_id !== me.id && match.opponent_id !== me.id) {
    return res.status(403).json({ error: 'Bu maça erişiminiz yok.' });
  }
  if (match.status !== 'scheduled') {
    return res.status(400).json({ error: 'Bu maç için hükmen sonucu girilemez.' });
  }
  if (![match.challenger_id, match.opponent_id].includes(noShowPlayerId)) {
    return res.status(400).json({ error: 'Geçersiz oyuncu.' });
  }

  const winnerId = noShowPlayerId === match.challenger_id ? match.opponent_id : match.challenger_id;

  const { data: winner } = await admin.from('players').select('*').eq('id', winnerId).single();
  const { data: loser } = await admin.from('players').select('*').eq('id', noShowPlayerId).single();
  if (!winner || !loser) return res.status(404).json({ error: 'Oyuncu bulunamadı.' });

  const { winnerPoints, loserPoints } = calculateMatchPoints(winner, loser, 'no_show');

  await admin
    .from('players')
    .update({ total_points: Number(winner.total_points) + winnerPoints })
    .eq('id', winnerId);
  await admin
    .from('players')
    .update({ total_points: Number(loser.total_points) + loserPoints })
    .eq('id', noShowPlayerId);

  const { error: updateErr } = await admin
    .from('matches')
    .update({
      status: 'forfeit_no_show',
      result_winner_id: winnerId,
      result_note: 'Rakip maça gelmedi',
      points_awarded: winnerPoints,
      power_points_used: loser.locked_points,
    })
    .eq('id', matchId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });
  return res.status(200).json({ ok: true });
}
