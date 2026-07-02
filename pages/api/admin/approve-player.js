import { getSupabaseAdmin, requireCoordinator } from '../../../lib/supabaseAdmin';

async function triggerHandicapUpdate() {
  const token = process.env.GITHUB_PAT;
  if (!token) return;
  try {
    await fetch(
      'https://api.github.com/repos/playroyalgolf/playroyalgolf/actions/workflows/handicap-update.yml/dispatches',
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
  } catch (e) {
    console.error('GitHub Actions tetiklenemedi:', e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const coordinator = await requireCoordinator(req);
  if (!coordinator) return res.status(403).json({ error: 'Bu işlem için koordinatör yetkisi gerekiyor.' });

  const { playerId, approve } = req.body || {};
  if (!playerId || typeof approve !== 'boolean') {
    return res.status(400).json({ error: 'Geçersiz istek.' });
  }

  const admin = getSupabaseAdmin();
  if (approve) {
    const { error } = await admin.from('players').update({ is_approved: true }).eq('id', playerId);
    if (error) return res.status(500).json({ error: error.message });
    // Onay sonrası HCP güncelleme workflow'unu tetikle (hata olsa bile onay tamamlanır)
    triggerHandicapUpdate();
  } else {
    const { error } = await admin.from('players').delete().eq('id', playerId);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
