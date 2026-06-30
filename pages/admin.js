import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Admin() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [config, setConfig] = useState(null);
  const [archives, setArchives] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: pend }, { data: appr }, { data: cfg }, { data: arch }] = await Promise.all([
      supabase.from('players').select('*').eq('is_approved', false).order('created_at'),
      supabase.from('players').select('*').eq('is_approved', true).order('full_name'),
      supabase.from('league_config').select('*').eq('id', 1).single(),
      supabase.from('season_archives').select('*').order('season_number', { ascending: false }),
    ]);
    setPending(pend || []);
    setApproved(appr || []);
    setConfig(cfg);
    setArchives(arch || []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/giris');
        return;
      }
      setToken(data.session.access_token);
      const { data: playerRow } = await supabase
        .from('players')
        .select('*')
        .eq('auth_user_id', data.session.user.id)
        .single();
      if (!playerRow?.is_coordinator) {
        router.push('/');
        return;
      }
      setMe(playerRow);
      loadAll();
    })();
  }, [router, loadAll]);

  async function call(path, body) {
    setBusy(true);
    setMsg('');
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(json.error || 'Bir hata oluştu.');
      return false;
    }
    await loadAll();
    return true;
  }

  if (!me) {
    return (
      <Layout>
        <div className="text-inkSoft text-sm py-10 text-center">Yükleniyor...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="font-display text-2xl mb-1">Yönetici Paneli</h2>
      <p className="text-inkSoft text-sm mb-5">
        Oyuncu onayları ve sezon yönetimi.
      </p>

      {msg && <div className="text-flag text-sm mb-4">{msg}</div>}

      <div className="mb-8">
        <h3 className="font-display text-lg mb-2 text-fairway">Sezon Durumu</h3>
        <div className="border border-line rounded-xl p-4 flex justify-between items-center flex-wrap gap-3">
          <div className="text-sm">
            Sezon {config?.season_number} —{' '}
            <span className={config?.season_active ? 'text-fairway font-semibold' : 'text-flag font-semibold'}>
              {config?.season_active ? 'Aktif' : 'Sonlandırıldı'}
            </span>
          </div>
          {config?.season_active ? (
            <button
              onClick={() => {
                if (confirm('Sezonu sonlandırmak istediğinize emin misiniz? Mevcut sıralama arşivlenecek.')) {
                  call('/api/admin/end-season', {});
                }
              }}
              disabled={busy}
              className="border border-flag text-flag rounded-full px-4 py-2 text-sm font-semibold"
            >
              Ligi Sonlandır
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm('Yeni sezon başlatılsın mı? Tüm oyuncuların puanı sıfırlanacak.')) {
                  call('/api/admin/start-season', {});
                }
              }}
              disabled={busy}
              className="bg-fairway text-cream rounded-full px-4 py-2 text-sm font-semibold"
            >
              Ligi Başlat
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-display text-lg mb-2 text-fairway">
          Onay Bekleyen Oyuncular {pending.length > 0 && `(${pending.length})`}
        </h3>
        {pending.length === 0 ? (
          <div className="text-inkSoft text-sm">Onay bekleyen oyuncu yok.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="border border-line rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div className="text-sm">
                  <span className="font-semibold">{p.full_name}</span>
                  <span className="text-inkSoft"> — {p.club || 'kulüp belirtilmemiş'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => call('/api/admin/approve-player', { playerId: p.id, approve: true })}
                    disabled={busy}
                    className="bg-fairway text-cream rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bu kaydı reddedip silmek istediğinize emin misiniz?')) {
                        call('/api/admin/approve-player', { playerId: p.id, approve: false });
                      }
                    }}
                    disabled={busy}
                    className="border border-flag text-flag rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="font-display text-lg mb-2 text-fairway">
          Lig Oyuncuları {approved.length > 0 && `(${approved.length})`}
        </h3>
        {approved.length === 0 ? (
          <div className="text-inkSoft text-sm">Henüz onaylanmış oyuncu yok.</div>
        ) : (
          <div className="space-y-2">
            {approved.map((p) => (
              <PlayerRow key={p.id} player={p} busy={busy} call={call} />
            ))}
          </div>
        )}
      </div>

      {archives.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-2 text-fairway">Arşivlenmiş Sezonlar</h3>
          <div className="space-y-2">
            {archives.map((a) => (
              <div key={a.id} className="border border-line rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div className="text-sm">
                  Sezon {a.season_number} — {new Date(a.ended_at).toLocaleDateString('tr-TR')} ·{' '}
                  <span className="text-inkSoft">{a.standings.length} oyuncu</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Bu sezon arşivi kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) {
                      call('/api/admin/delete-archive', { archiveId: a.id });
                    }
                  }}
                  disabled={busy}
                  className="border border-flag text-flag rounded-full px-3 py-1.5 text-xs font-semibold"
                >
                  Arşivi Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </Layout>
  );
}

function PlayerRow({ player, busy, call }) {
  const [editing, setEditing] = useState(false);
  const [points, setPoints] = useState(player.total_points);

  return (
    <div className="border border-line rounded-xl p-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="text-sm">
          <span className="font-semibold">{player.full_name}</span>
          <span className="text-inkSoft"> — {player.club || 'kulüp belirtilmemiş'} · {player.total_points} puan</span>
          {player.is_coordinator && (
            <span className="ml-2 text-[10px] bg-gold text-white px-2 py-0.5 rounded-full">koordinatör</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            disabled={busy}
            className="border border-fairway text-fairway rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            Puanı Düzelt
          </button>
          {!player.is_coordinator && (
            <button
              onClick={() => {
                if (confirm(`${player.full_name} ligden tamamen çıkarılsın mı? Bu oyuncunun tüm maç kayıtları da silinecek.`)) {
                  call('/api/admin/remove-player', { playerId: player.id });
                }
              }}
              disabled={busy}
              className="border border-flag text-flag rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              Ligden Çıkar
            </button>
          )}
        </div>
      </div>
      {editing && (
        <div className="flex gap-2 items-center mt-3 pt-3 border-t border-line">
          <input
            type="number"
            className="border border-line rounded-lg px-2 py-1.5 text-sm w-24"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
          <button
            onClick={async () => {
              const ok = await call('/api/admin/adjust-points', { playerId: player.id, totalPoints: points });
              if (ok) setEditing(false);
            }}
            disabled={busy}
            className="bg-fairway text-cream rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
