import { createClient } from '@supabase/supabase-js';

// Bu dosya SADECE pages/api/** içinde import edilmeli.
// SUPABASE_SERVICE_ROLE_KEY hiçbir zaman tarayıcıya gönderilmemeli.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase admin ortam değişkenleri eksik (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// API route'a gelen isteğin Authorization header'ındaki kullanıcı access token'ından
// gerçek oyuncu kaydını bulur. Token geçersizse null döner.
export async function getPlayerFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const admin = getSupabaseAdmin();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: player, error: playerError } = await admin
    .from('players')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .single();

  if (playerError || !player) return null;
  return player;
}

// API route'larda yönetici/koordinatör kontrolü için kullanılır.
export async function requireCoordinator(req) {
  const player = await getPlayerFromRequest(req);
  if (!player || !player.is_coordinator) return null;
  return player;
}
