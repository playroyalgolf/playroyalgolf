import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Arsiv() {
  const [archives, setArchives] = useState(null);

  useEffect(() => {
    supabase
      .from('season_archives')
      .select('*')
      .order('season_number', { ascending: false })
      .then(({ data }) => setArchives(data || []));
  }, []);

  return (
    <Layout>
      <h2 className="font-display text-2xl mb-1">Arşiv</h2>
      <p className="text-inkSoft text-sm mb-5">
        Sonlanmış sezonların final sıralamaları.
      </p>

      {!archives ? (
        <div className="text-inkSoft text-sm py-10 text-center">Yükleniyor...</div>
      ) : archives.length === 0 ? (
        <div className="text-inkSoft text-sm py-10 text-center">
          Henüz arşivlenmiş bir sezon yok.
        </div>
      ) : (
        <div className="space-y-4">
          {archives.map((a) => (
            <details key={a.id} className="border border-line rounded-xl p-4" open={a === archives[0]}>
              <summary className="font-display text-lg cursor-pointer text-fairway">
                Sezon {a.season_number} — {new Date(a.ended_at).toLocaleDateString('tr-TR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </summary>
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-inkSoft border-b border-line">
                    <th className="text-left py-2 px-2"></th>
                    <th className="text-left py-2 px-2">Oyuncu</th>
                    <th className="text-left py-2 px-2">Kulüp</th>
                    <th className="text-center py-2 px-2">Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {a.standings.map((s) => (
                    <tr key={s.player_id} className="border-b border-line last:border-0">
                      <td className="font-display text-lg text-inkSoft py-2 px-2">{s.rank}</td>
                      <td className="font-semibold py-2 px-2">{s.full_name}</td>
                      <td className="text-inkSoft py-2 px-2">{s.club || '—'}</td>
                      <td className="text-center font-mono font-semibold text-fairway py-2 px-2">
                        {s.total_points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
        </div>
      )}
    </Layout>
  );
}
