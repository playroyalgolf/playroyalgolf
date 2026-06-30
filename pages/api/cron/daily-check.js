import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { runMaintenanceTasks } from '../../../lib/maintenance';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = getSupabaseAdmin();
  const summary = await runMaintenanceTasks(admin);
  return res.status(200).json({ ok: true, summary });
}
