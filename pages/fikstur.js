import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

const STATUS_LABEL = {
  pending: 'Cevap bekleniyor',
  scheduled: 'Planlandı',
  completed: 'Oynandı',
  rejected: 'Reddedildi',
  forfeit_no_response: 'Hükmen (cevapsız)',
  forfeit_no_show: 'Hükmen (gelmedi)',
};

const STATUS_STYLE = {
  pending: 'bg-tan text-[#7A5A12]',
  scheduled: 'bg-[#E4EFE3] text-fairway',
  completed: 'bg-[#E4EFE3] text-fairway',
  rejected: 'bg-[#F8E2DD] text-flag',
  forfeit_no_response: 'bg-[#F8E2DD] text-flag',
  forfeit_no_show: 'bg-[#F8E2DD] text-flag',
};

export default function Fikstur() {
  const [matches, setMatches] = useState(null);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('matches').select('*').order('created_at', { ascending: false }),
      supabase.from('players').select('id, full_name'),
    ]);
    const map = {};
    (p || []).forEach((pl) => (map[pl.id] = pl.full_name));
    setPlayers(map);
    setMatches(m || []);
  }

  function name(id) {
    return players[id] || '(silinmiş oyuncu)';
  }

  return (
    <Layout>
      <h2 className="font-display text-2xl mb-1">Fikstür &amp; Sonuçlar</h2>
      <p className="text-inkSoft text-sm mb-5">
        Kimin kiminle ne zaman oynayacağı, maç durumları ve sonuçlar.
      </p>

      {!matches ? (
        <div className="text-inkSoft text-sm py-10 text-center">Yükleniyor...</div>
      ) : matches.length === 0 ? (
        <div className="text-inkSoft text-sm py-10 text-center">Henüz maç teklifi yok.</div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="border border-line rounded-xl p-4">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="font-semibold text-[15px]">
                  {name(m.challenger_id)} <span className="text-inkSoft font-normal px-1.5">vs</span>{' '}
                  {name(m.opponent_id)}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[m.status] || ''}`}
                >
                  {STATUS_LABEL[m.status] || m.status}
                </span>
              </div>
              <div className="text-inkSoft text-xs mt-1.5">
                {m.scheduled_at
                  ? new Date(m.scheduled_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Tarih henüz belirlenmedi'}
              </div>
              {m.status === 'completed' && (
                <div className="text-sm mt-2">
                  <span className="text-flag font-semibold">{name(m.result_winner_id)} kazandı</span>
                  {m.result_note && <span className="text-inkSoft"> — {m.result_note}</span>}
                  {typeof m.points_awarded === 'number' && (
                    <span className="text-inkSoft"> &middot; +{m.points_awarded} puan</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
