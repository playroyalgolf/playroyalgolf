import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const TABS = [
  { href: '/', label: 'Piramit' },
  { href: '/fikstur', label: 'Fikstür & Sonuçlar' },
  { href: '/arsiv', label: 'Arşiv' },
  { href: '/kurallar', label: 'Kurallar' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setChecked(true);
      if (data.session) {
        const { data: player } = await supabase
          .from('players')
          .select('is_coordinator')
          .eq('auth_user_id', data.session.user.id)
          .single();
        setIsCoordinator(!!player?.is_coordinator);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-sans">
      <header className="bg-fairway text-cream px-5 pt-6 pb-14 relative overflow-hidden">
        <div
          className="absolute left-0 right-0 bottom-0 h-9 bg-cream"
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 60%)' }}
        />
        <div className="max-w-3xl mx-auto flex justify-between items-start gap-4 flex-wrap relative z-10">
          <div>
            <Link href="/">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold cursor-pointer">
                Play Royal Golf
              </h1>
            </Link>
            <p className="text-[#CFE0D2] text-xs uppercase tracking-wide mt-1">
              Piramit Ligi &middot; Puan Durumu &middot; Fikstür
            </p>
          </div>
          <div className="text-sm">
            {!checked ? null : session ? (
              <div className="flex gap-2 items-center">
                {isCoordinator && (
                  <Link href="/admin">
                    <button className="bg-gold text-white rounded-full px-4 py-2 font-semibold text-sm">
                      Yönetici Paneli
                    </button>
                  </Link>
                )}
                <Link href="/panel">
                  <button className="bg-flag text-white rounded-full px-4 py-2 font-semibold text-sm">
                    Panelim
                  </button>
                </Link>
                <Link href="/ayarlar">
                  <button className="bg-white/10 text-cream rounded-full px-4 py-2 font-semibold text-sm">
                    Ayarlar
                  </button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-white/10 text-cream rounded-full px-4 py-2 font-semibold text-sm"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link href="/giris">
                <button className="bg-flag text-white rounded-full px-4 py-2 font-semibold text-sm">
                  Oyuncu Girişi
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 -mt-5 relative z-20 pb-16">
        <nav className="flex gap-1.5 bg-paper border border-line rounded-2xl p-1.5 mb-5">
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <button
                className={`w-full px-2 py-2.5 rounded-xl font-semibold text-sm ${
                  router.pathname === tab.href
                    ? 'bg-fairway text-cream'
                    : 'text-inkSoft'
                }`}
              >
                {tab.label}
              </button>
            </Link>
          ))}
        </nav>
        <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6">{children}</div>
      </main>

      <footer className="max-w-3xl mx-auto px-5 pb-10 text-inkSoft text-xs leading-relaxed">
        Handikap verileri Türkiye Golf Federasyonu kayıtlarından her Pazartesi 10:00&apos;da
        otomatik güncellenir.
      </footer>
    </div>
  );
}
