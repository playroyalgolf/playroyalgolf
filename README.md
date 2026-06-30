# Play Royal Golf - Piramit Ligi

## Gerekli ortam değişkenleri (Vercel'de)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase proje URL'i
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon (public) key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (GİZLİ - asla tarayıcıya sızdırılmamalı)
- `CRON_SECRET` - rastgele uzun bir metin (cron uç noktalarını korumak için)

## GitHub Actions secrets (Settings > Secrets and variables > Actions)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Yerel geliştirme

```
npm install
cp .env.local.example .env.local   # değerleri doldurun
npm run dev
```

## Önemli notlar

- Tüm puan/sıralama mantığı `lib/points.js` içinde tek yerde toplanmıştır.
- Cron uç noktaları (`/api/cron/*`) `CRON_SECRET` ile korunur; Vercel cron jobs bu secret'ı otomatik header olarak gönderir.
- `scripts/update-handicaps.js` federasyon sitesini Puppeteer ile tarar; sitenin form yapısı değişirse güncellenmesi gerekebilir.
