import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

function FlagPin() {
  return (
    <svg width="13" height="17" viewBox="0 0 14 18" className="inline-block mr-1.5 -mt-0.5">
      <line x1="2" y1="1" x2="2" y2="17" stroke="#5C6356" strokeWidth="1.4" />
      <path d="M2 2 L12 5 L2 8 Z" fill="#C84B31" />
    </svg>
  );
}

export default function Home() {
  const [rows, setRows] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: players, error: pErr }, { data: matches, error: mErr }, { data: cfg }] =
      await Promise.all([
        supabase.from('players').select('*').eq('is_approved', true).order('total_points', { ascending: false }),
        supabase.from('matches').select('*').eq('status', 'completed'),
        supabase.from('league_config').select('*').eq('id', 1).single(),
      ]);

    if (pErr || mErr) { setError('Veriler yüklenemedi. Lütfen sayfayı yenileyin.'); return; }

    const stats = {};
    (players || []).forEach((p) => {
      stats[p.id] = { ...p, played: 0, won: 0, lost: 0 };
    });
    (matches || []).forEach((m) => {
      const winnerId = m.result_winner_id;
      const loserId = m.challenger_id === winnerId ? m.opponent_id : m.challenger_id;
      if (stats[winnerId]) { stats[winnerId].played += 1; stats[winnerId].won += 1; }
      if (stats[loserId]) { stats[loserId].played += 1; stats[loserId].lost += 1; }
    });

    const ranked = Object.values(stats).sort(
      (a, b) =>
        Number(b.total_points) - Number(a.total_points) ||
        Number(b.averaj || 0) - Number(a.averaj || 0)
    );
    setRows(ranked);
    setConfig(cfg);
  }

  return (
    <Layout>
      <h2 className="font-display text-2xl mb-1">Puan Durumu</h2>
      <p className="text-inkSoft text-sm mb-1">
        Match play — Galibiyet 15 puan, Mağlubiyet 5 puan. Beraberlik yok.
      </p>
      {config?.last_weekly_update && (
        <p className="text-inkSoft text-xs mb-4">
          Son güncelleme: {new Date(config.last_weekly_update).toLocaleString('tr-TR')}
        </p>
      )}
      {error && <div className="text-flag text-sm mb-4">{error}</div>}
      {!rows ? (
        <div className="text-inkSoft text-sm py-10 text-center">Yükleniyor...</div>
      ) : rows.length === 0 ? (
        <div className="text-inkSoft text-sm py-10 text-center">Henüz oyuncu eklenmedi.</div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-inkSoft border-b border-line">
                <th className="text-left py-2 px-2 w-8"></th>
                <th className="text-left py-2 px-2">Oyuncu</th>
                <th className="text-center py-2 px-2">Puan</th>
                <th className="text-center py-2 px-2">O</th>
                <th className="text-center py-2 px-2">G</th>
                <th className="text-center py-2 px-2">M</th>
                <th className="text-center py-2 px-2">Averaj</th>
                <th className="text-center py-2 px-2">HCP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const av = Number(r.averaj || 0);
                return (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="font-display text-lg text-inkSoft py-2.5 px-2">{i + 1}</td>
                    <td className="font-semibold py-2.5 px-2">
                      {i === 0 && r.played > 0 && <FlagPin />}
                      {r.full_name}
                      {!r.is_active && (
                        <span className="ml-2 text-[10px] bg-tan text-[#7A5A12] px-2 py-0.5 rounded-full">pasif</span>
                      )}
                    </td>
                    <td className="text-center font-mono font-semibold text-fairway py-2.5 px-2">
                      {Number(r.total_points).toFixed(0)}
                    </td>
                    <td className="text-center font-mono py-2.5 px-2">{r.played}</td>
                    <td className="text-center font-mono py-2.5 px-2">{r.won}</td>
                    <td className="text-center font-mono py-2.5 px-2">{r.lost}</td>
                    <td className={`text-center font-mono font-semibold py-2.5 px-2 ${av > 0 ? 'text-fairway' : av < 0 ? 'text-flag' : 'text-inkSoft'}`}>
                      {av > 0 ? `+${av}` : av}
                    </td>
                    <td className={`text-center font-mono py-2.5 px-2 font-semibold ${
                      r.handicap_trend === 'down' ? 'text-fairway' :
                      r.handicap_trend === 'up' ? 'text-flag' : 'text-ink'
                    }`}>
                      {r.handicap ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
