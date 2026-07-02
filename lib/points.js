// Lig kuralları - Match Play formatı
// Kazanan: sabit 15 puan
// Kaybeden: sabit 5 puan
// Hükmen (gelmeme): kazanan 15 puan, gelmeyen 0 puan
// Beraberlik yok.

export const WINNER_POINTS = 15;
export const LOSER_FLAT_POINTS = 5;
export const NO_RESPONSE_DAYS = 3;
export const NO_RESPONSE_FORFEIT_DAYS = 3;
export const RESCHEDULE_NOTICE_HOURS = 24;
export const MATCH_WINDOW_DAYS = 7;
export const INACTIVE_AUTO_REACTIVATE_DAYS = 15;

/**
 * Maç sonucunu (not metnini) ayrıştırıp hole farkını döner.
 * "3&2" → 3, "4&3" → 4, "1 up" → 1, "2 up" → 2
 */
export function parseMatchScore(note) {
  if (!note) return 0;
  const andMatch = note.trim().match(/^(\d+)&\d+/);
  if (andMatch) return parseInt(andMatch[1], 10);
  const upMatch = note.trim().match(/^(\d+)\s*up/i);
  if (upMatch) return parseInt(upMatch[1], 10);
  return 0;
}

/**
 * Maç sonucuna göre kazanan/kaybeden puanını hesaplar.
 */
export function calculateMatchPoints(resultType) {
  if (resultType === 'no_show') {
    return { winnerPoints: WINNER_POINTS, loserPoints: 0 };
  }
  return { winnerPoints: WINNER_POINTS, loserPoints: LOSER_FLAT_POINTS };
}

/**
 * Oyuncuları toplam puana göre sıralar, sıra numarası ekler.
 */
export function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => Number(b.total_points) - Number(a.total_points));
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * A oyuncusunun B'ye yeni bir teklif gönderip gönderemeyeceğini kontrol eder.
 */
export function canProposeMatch({ proposerRank, blockingIncomingMatches }) {
  const blocker = blockingIncomingMatches.find((m) => m.challenger_rank > proposerRank);
  if (blocker) {
    return {
      allowed: false,
      reason: `Sırada sizden alt sıradaki bir oyuncudan (${blocker.challenger_name}) gelen bekleyen bir teklifiniz var. Yeni teklif göndermeden önce onu kabul/red etmelisiniz.`,
    };
  }
  return { allowed: true };
}
