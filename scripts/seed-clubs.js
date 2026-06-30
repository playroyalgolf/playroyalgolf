// Federasyon handikap sayfasındaki "Kulüp" açılır listesinden tüm kulüp
// isimlerini okuyup Supabase'deki clubs tablosuna yazar.
// Hem ilk kurulumda hem de haftalık cron'un bir parçası olarak çalıştırılabilir
// (kulüp listesi nadiren değişir ama güncel kalsın diye haftalık da çalıştırıyoruz).

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const HANDICAP_URL =
  'https://scoring-tr.datagolf.pt/scripts/handicaps.asp?club=ALL&ack=6V35FTY88F&fedstatus=9';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(HANDICAP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  const clubNames = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    // Kulüp seçimi olan <select>'i, içinde "Tüm Kulüpler" geçen option'a bakarak buluyoruz.
    const clubSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.text.includes('Tüm Kulüpler'))
    );
    if (!clubSelect) return [];
    return Array.from(clubSelect.options)
      .map((o) => o.text.trim())
      .filter((t) => t && !t.includes('Tüm Kulüpler'));
  });

  await browser.close();

  if (clubNames.length === 0) {
    console.log('[UYARI] Kulüp listesi bulunamadı, sayfa yapısı değişmiş olabilir.');
    return;
  }

  for (const name of clubNames) {
    const { error } = await supabase.from('clubs').upsert({ name }, { onConflict: 'name' });
    if (error) console.error(`[HATA] ${name}: ${error.message}`);
  }

  console.log(`Tamamlandı. ${clubNames.length} kulüp güncellendi.`);
}

main().catch((err) => {
  console.error('Script genel hata:', err);
  process.exit(1);
});
