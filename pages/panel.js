import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Panel() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [proposedDate, setProposedDate] = useState('');

  const loadAll = useCallback(async (myId) => {
    const [{ data: pl }, { data: mt }] = await Promise.all([
      supabase.from('players').select('*').order('total_points', { ascending: false }),
      supabase
        .from('matches')
        .select('*')
        .or(`challenger_id.eq.${myId},opponent_id.eq.${myId}`)
        .order('created_at', { ascending: false }),
    ]);
    setPlayers(pl || []);
    setMatches(mt || []);
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
      if (!playerRow) {
        setMsg('Hesabınıza bağlı bir oyuncu kaydı bulunamadı. Lig koordinatörüne ulaşın.');
        return;
      }
      setMe(playerRow);
      loadAll(playerRow.id);
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
    await loadAll(me.id);
    return true;
  }

  async function toggleActive() {
    const ok = await call('/api/availability', { isActive: !me.is_active });
    if (ok) setMe({ ...me, is_active: !me.is_active });
  }

  async function propose() {
    if (!selectedOpponent || !proposedDate) return;
    const ok = await call('/api/matches/propose', {
      opponentId: selectedOpponent,
      scheduledAt: proposedDate,
    });
    if (ok) {
      setSelectedOpponent('');
      setProposedDate('');
    }
  }

  if (!me) {
    return (
      <Layout>
        <div className="text-inkSoft text-sm py-10 text-center">
          {msg || 'Yükleniyor...'}
        </div>
      </Layout>
    );
  }

  if (!me.is_approved) {
    return (
      <Layout>
        <h2 className="font-display text-2xl mb-2">{me.full_name}</h2>
        <div className="bg-tan text-[#7A5A12] rounded-xl p-4 text-sm">
          Kaydınız alındı, lig koordinatörünün onayını bekliyor. Onaylandıktan sonra maç teklif
          edebilir ve teklifleri yanıtlayabilirsiniz.
        </div>
      </Layout>
    );
  }

  const incoming = matches.filter((m) => m.opponent_id === me.id && m.status === 'pending');
  const outgoing = matches.filter((m) => m.challenger_id === me.id && m.status === 'pending');
  const active = matches.filter((m) => m.status === 'scheduled');
  const history = matches.filter((m) =>
    ['completed', 'rejected', 'forfeit_no_response', 'forfeit_no_show'].includes(m.status)
  );

  const nameById = (id) => players.find((p) => p.id === id)?.full_name || '—';
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const eligibleOpponents = players.filter(
    (p) =>
      p.id !== me.id &&
      p.is_active &&
      p.is_approved &&
      !matches.some(
        (m) =>
          ['pending', 'scheduled'].includes(m.status) &&
          (m.challenger_id === p.id || m.opponent_id === p.id) &&
          (m.challenger_id === me.id || m.opponent_id === me.id)
      )
  );

  return (
    <Layout>
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <h2 className="font-display text-2xl">{me.full_name}</h2>
          <p className="text-inkSoft text-sm">
            Toplam puan: <span className="font-mono font-semibold text-fairway">{me.total_points}</span>
            {' '}&middot; Güç puanı (bu hafta): <span className="font-mono">{me.locked_points}</span>
          </p>
        </div>
        <button
          onClick={toggleActive}
          disabled={busy}
          className={`text-sm font-semibold rounded-full px-4 py-2 ${
            me.is_active ? 'bg-tan text-[#7A5A12]' : 'bg-fairway text-cream'
          }`}
        >
          {me.is_active ? 'Müsaitliğimi pasife al' : 'Tekrar aktif et'}
        </button>
      </div>

      {msg && <div className="text-flag text-sm mb-4">{msg}</div>}

      <div className="mb-7">
        <h3 className="font-display text-lg mb-2 text-fairway">Maç Teklif Et</h3>
        <p className="text-inkSoft text-xs mb-2">
          Rakibi ve oynamak istediğiniz tarih/saati birlikte seçin — rakip sadece kabul veya red eder.
        </p>
        <div className="flex gap-2 flex-wrap">
          <select
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
            value={selectedOpponent}
            onChange={(e) => setSelectedOpponent(e.target.value)}
          >
            <option value="">Rakip seçin...</option>
            {eligibleOpponents.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="border border-line rounded-lg px-3 py-2 text-sm"
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
          />
          <button
            onClick={propose}
            disabled={!selectedOpponent || !proposedDate || busy}
            className="bg-flag text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Teklif Gönder
          </button>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="mb-7">
          <h3 className="font-display text-lg mb-2 text-fairway">Size Gelen Teklifler</h3>
          <div className="space-y-2">
            {incoming.map((m) => (
              <div key={m.id} className="border border-line rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-sm">{nameById(m.challenger_id)}</div>
                  <div className="text-inkSoft text-xs">Önerilen tarih: {fmt(m.scheduled_at)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => call('/api/matches/respond', { matchId: m.id, action: 'accept' })}
                    className="bg-fairway text-cream rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    Kabul Et
                  </button>
                  <button
                    onClick={() => call('/api/matches/respond', { matchId: m.id, action: 'reject' })}
                    className="border border-flag text-flag rounded-full px-3 py-1.5 text-xs font-semibold"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mb-7">
          <h3 className="font-display text-lg mb-2 text-fairway">Gönderdiğiniz Teklifler</h3>
          <div className="space-y-2">
            {outgoing.map((m) => (
              <div key={m.id} className="border border-line rounded-xl p-3 text-sm flex justify-between items-center flex-wrap gap-1">
                <span>{nameById(m.opponent_id)}</span>
                <span className="text-inkSoft text-xs">Önerilen: {fmt(m.scheduled_at)} — cevap bekleniyor</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-7">
          <h3 className="font-display text-lg mb-2 text-fairway">Devam Eden Maçlar</h3>
          <div className="space-y-3">
            {active.map((m) => (
              <ActiveMatchCard key={m.id} match={m} me={me} nameById={nameById} fmt={fmt} call={call} />
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="font-display text-lg mb-2 text-fairway">Geçmiş</h3>
          <div className="space-y-2">
            {history.map((m) => (
              <div key={m.id} className="border border-line rounded-xl p-3 text-sm">
                {nameById(m.challenger_id)} vs {nameById(m.opponent_id)} —{' '}
                <span className="text-inkSoft">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

function ActiveMatchCard({ match, me, nameById, fmt, call }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const opponentId = match.challenger_id === me.id ? match.opponent_id : match.challenger_id;

  return (
    <div className="border border-line rounded-xl p-4">
      <div className="font-semibold text-sm mb-1">{nameById(opponentId)}</div>
      <div className="text-inkSoft text-xs mb-3">{fmt(match.scheduled_at)}</div>

      {!showReschedule ? (
        <button
          onClick={() => setShowReschedule(true)}
          className="text-fairway underline text-xs font-semibold mb-3 block"
        >
          Tarihi değiştir (en az 24 saat önceden bildirin)
        </button>
      ) : (
        <div className="flex gap-2 flex-wrap mb-3">
          <input
            type="datetime-local"
            className="border border-line rounded-lg px-2 py-1.5 text-sm"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <button
            onClick={async () => {
              if (newDate) {
                const ok = await call('/api/matches/schedule', { matchId: match.id, scheduledAt: newDate });
                if (ok) setShowReschedule(false);
              }
            }}
            disabled={!newDate}
            className="bg-fairway text-cream rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Yeni Tarihi Kaydet
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => call('/api/matches/result', { matchId: match.id, winnerId: me.id })}
          className="bg-flag text-white rounded-full px-3 py-1.5 text-xs font-semibold"
        >
          Ben kazandım
        </button>
        <button
          onClick={() => call('/api/matches/result', { matchId: match.id, winnerId: opponentId })}
          className="border border-line rounded-full px-3 py-1.5 text-xs font-semibold"
        >
          Rakip kazandı
        </button>
        <button
          onClick={() => call('/api/matches/no-show', { matchId: match.id, noShowPlayerId: opponentId })}
          className="text-flag underline text-xs font-semibold"
        >
          Rakip maça gelmedi
        </button>
      </div>
    </div>
  );
}
