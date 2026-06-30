import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Giris() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [club, setClub] = useState('');
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('clubs')
      .select('name')
      .order('name')
      .then(({ data }) => setClubs(data || []));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Giriş başarısız: e-posta veya şifre hatalı.');
      return;
    }
    router.push('/panel');
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Ad soyad gerekli.');
      return;
    }
    if (!club) {
      setError('Kulüp seçimi gerekli.');
      return;
    }
    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) {
      setLoading(false);
      setError('Kayıt başarısız: ' + signupError.message);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      const { error: insertError } = await supabase
        .from('players')
        .insert({ auth_user_id: userId, full_name: fullName.trim(), club });
      if (insertError) {
        setLoading(false);
        setError('Oyuncu kaydı oluşturulamadı: ' + insertError.message);
        return;
      }
    }
    setLoading(false);
    router.push('/panel');
  }

  return (
    <Layout>
      <h2 className="font-display text-2xl mb-1">
        {mode === 'login' ? 'Oyuncu Girişi' : 'Lige Katıl'}
      </h2>
      <p className="text-inkSoft text-sm mb-5">
        {mode === 'login'
          ? 'Maç teklif etmek, kabul/red etmek ve müsaitlik durumunu yönetmek için giriş yapın.'
          : 'Yeni bir oyuncu hesabı oluşturun. Kaydınız lig koordinatörü tarafından onaylandıktan sonra maç teklif edebilirsiniz.'}
      </p>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3 max-w-sm">
        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-inkSoft mb-1">
                Ad Soyad *
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
                Kulüp *
              </label>
              <select
                className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-white"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                required
              >
                <option value="">Kulüp seçin...</option>
                {clubs.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {clubs.length === 0 && (
                <p className="text-inkSoft text-xs mt-1">
                  Kulüp listesi henüz yüklenmedi, bir süre sonra tekrar deneyin.
                </p>
              )}
            </div>
          </>
        )}
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-inkSoft mb-1">
            E-posta
          </label>
          <input
            type="email"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-inkSoft mb-1">
            Şifre
          </label>
          <input
            type="password"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error && <div className="text-flag text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bg-fairway text-cream rounded-full px-5 py-2.5 font-semibold text-sm disabled:opacity-60"
        >
          {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="text-fairway text-sm font-semibold mt-4 underline"
      >
        {mode === 'login' ? 'Hesabın yok mu? Lige katıl' : 'Zaten hesabın var mı? Giriş yap'}
      </button>
    </Layout>
  );
}
