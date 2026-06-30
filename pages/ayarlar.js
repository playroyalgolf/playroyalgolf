import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Ayarlar() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [fullName, setFullName] = useState('');
  const [club, setClub] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

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
      if (playerRow) {
        setMe(playerRow);
        setFullName(playerRow.full_name);
        setClub(playerRow.club || '');
      }
      const { data: clubList } = await supabase.from('clubs').select('name').order('name');
      setClubs(clubList || []);
    })();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setMsg('');
    setOk(false);
    setBusy(true);
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fullName, club }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(json.error || 'Bir hata oluştu.');
      return;
    }
    setOk(true);
    setMsg('Bilgileriniz güncellendi.');
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
      <h2 className="font-display text-2xl mb-1">Ayarlar</h2>
      <p className="text-inkSoft text-sm mb-5">Ad soyad ve kulüp bilgilerinizi güncelleyin.</p>

      <form onSubmit={handleSave} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-inkSoft mb-1">
            Ad Soyad
          </label>
          <input
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-inkSoft mb-1">
            Kulüp
          </label>
          <select
            className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-white"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            required
          >
            <option value="">Kulüp seçin...</option>
            {clubs.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {msg && <div className={`text-sm ${ok ? 'text-fairway' : 'text-flag'}`}>{msg}</div>}

        <button
          type="submit"
          disabled={busy}
          className="bg-fairway text-cream rounded-full px-5 py-2.5 font-semibold text-sm disabled:opacity-60"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </Layout>
  );
}
