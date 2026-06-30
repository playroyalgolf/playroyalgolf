// Lig kurallarının tek doğru kaynağı bu dosyadır.
// Kazanan: rakibin "güç puanı" (locked_points) kadar puan kazanır.
// Kaybeden: sabit 5 puan kazanır.
// Hükmen (gelmeme): kazanan rakibin güç puanını alır, gelmeyen 0 puan alır.

export const LOSER_FLAT_POINTS = 5;
export const NO_RESPONSE_DAYS = 3; // cevapsızlıkta koordinatöre bildirim eşiği
export const NO_RESPONSE_FORFEIT_DAYS = 3; // koordinatör bildiriminden sonra ek bekleme
export const RESCHEDULE_NOTICE_HOURS = 24;
export const MATCH_WINDOW_DAYS = 7; // tarih belirlenen maç 1 hafta içinde oynanmalı
export const INACTIVE_AUTO_REACTIVATE_DAYS = 15;

// Piramit güç puanı kademeleri: en alttan en üste.
export const PYRAMID_TIERS = [20, 30, 40, 60, 80, 100];
export const BOTTOM_TIER_POWER = PYRAMID_TIERS[0];

/**
 * Bir oyuncunun TOPLAM puanına göre o hafta için piramit (güç) puanını hesaplar.
 * Eşikler: 20-30-40-60-80-100. Toplam puan bir eşiği geçtiğinde piramit puanı
 * o eşiğe yükselir (örn. toplam puan 35 ise piramit puanı 30'da kalır, 40'a
 * ulaşınca piramit puanı 40 olur). En düşük taban 20, en yüksek tavan 100'dür.
 */
export function tierForTotalPoints(totalPoints) {
  const points = Number(totalPoints) || 0;
  let tier = PYRAMID_TIERS[0];
  for (const t of PYRAMID_TIERS) {
    if (points >= t) tier = t;
  }
  return tier;
}

/**
 * Bir maç sonucuna göre kazanan/kaybeden için kazanılacak puanı hesaplar.
 * @param {object} winner - players satırı (locked_points alanı dahil)
 * @param {object} loser - players satırı
 * @param {'normal'|'no_show'} resultType
 */
export function calculateMatchPoints(winner, loser, resultType) {
  const winnerPower = Number(loser.locked_points) || 0;
  if (resultType === 'no_show') {
    return { winnerPoints: winnerPower, loserPoints: 0 };
  }
  return { winnerPoints: winnerPower, loserPoints: LOSER_FLAT_POINTS };
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
 * Kural: Bir oyuncunun kendisine, sıralamada kendisinden ALT sırada olan birinden
 * gelen, henüz sonuçlanmamış (pending/accepted/scheduled) bir teklifi varsa,
 * yeni bir teklif gönderemez - önce o teklifi sonuçlandırmalıdır.
 */
export function canProposeMatch({ proposerRank, blockingIncomingMatches }) {
  const blocker = blockingIncomingMatches.find(
    (m) => m.challenger_rank > proposerRank // alttan gelen = sıra numarası daha büyük
  );
  if (blocker) {
    return {
      allowed: false,
      reason: `Sırada sizden alt sıradaki bir oyuncudan (${blocker.challenger_name}) gelen bekleyen bir teklifiniz var. Yeni teklif göndermeden önce onu kabul/red etmelisiniz.`,
    };
  }
  return { allowed: true };
}
