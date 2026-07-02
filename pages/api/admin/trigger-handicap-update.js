export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  // Sadece koordinatör çağırabilir - basit token kontrolü
  // Gerçek koordinatör kontrolü için supabaseAdmin kullanıyoruz
  const { getSupabaseAdmin, requireCoordinator } = await import('../../../lib/supabaseAdmin');
  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const token = process.env.GITHUB_PAT;
  const owner = 'playroyalgolf';
  const repo = 'playroyalgolf';
  const workflow = 'handicap-update.yml';

  if (!token) return res.status(500).json({ error: 'GITHUB_PAT ortam değişkeni tanımlı değil.' });

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  );

  if (response.status === 204) {
    return res.status(200).json({ ok: true, message: 'Handikap güncelleme işlemi başlatıldı. GitHub Actions birkaç dakika içinde tamamlayacak.' });
  }

  const text = await response.text();
  return res.status(500).json({ error: `GitHub API hatası: ${response.status} — ${text}` });
}
