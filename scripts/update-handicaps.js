// Bu script GitHub Actions üzerinde Pazartesi 10:00'da otomatik çalışır.
// Federasyonun handikap sayfasını Puppeteer ile tarar, her oyuncunun HCP'sini
// günceller ve bir önceki değere göre trend belirler (up/down/same).

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const HANDICAP_URL =
  'https://scoring-tr.datagolf.pt/scripts/handicaps.asp?club=ALL&ack=6V35FTY88F&fedstatus=9';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalize(str) {
  return (str || '').toLocaleLowerCase('tr-TR').replace(/[İI]/g, 'i').trim();
}

async function searchPlayer(page, fullName) {
  await page.goto(HANDICAP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  const textInputs = await page.$$('input[type=text], input:not([type])');
  if (textInputs.length === 0) {
    console.log(`[UYARI] "${fullName}" için arama kutusu bulunamadı.`);
    return null;
  }

  const nameInput = textInputs[0];
  await nameInput.click({ clickCount: 3 });
  await nameInput.type(fullName.split(' ').slice(0, 2).join(' '), { delay: 30 });

  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null),
  ]);

  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table tr')).map((row) =>
      Array.from(row.querySelectorAll('td')).map((td) => td.innerText.trim())
    );
  });

  const targetNorm = normalize(fullName);
  for (const row of rows) {
    if (row.length < 4) continue;
    const rowName = normalize(row[1]);
    if (rowName && (rowName.includes(targetNorm) || targetNorm.includes(rowName))) {
      const hcpValue = parseFloat((row[3] || '').replace(',', '.'));
      if (!Number.isNaN(hcpValue)) return hcpValue;
    }
  }
  console.log(`[BULUNAMADI] "${fullName}" federasyon listesinde eşleşmedi.`);
  return null;
}

async function main() {
  const { data: players, error } = await supabase.from('players').select('id, full_name, handicap');
  if (error) {
    console.error('Oyuncular alınamadı:', error.message);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  let updated = 0;
  for (const player of players) {
    try {
      const newHcp = await searchPlayer(page, player.full_name);
      if (newHcp !== null) {
        const oldHcp = player.handicap !== null && player.handicap !== undefined
          ? Number(player.handicap)
          : null;

        let trend = 'same';
        if (oldHcp === null) trend = 'same';
        else if (newHcp < oldHcp) trend = 'down';   // düştü = iyileşti = yeşil
        else if (newHcp > oldHcp) trend = 'up';     // arttı = kötüleşti = kırmızı

        await supabase
          .from('players')
          .update({ handicap: newHcp, handicap_trend: trend, handicap_updated_at: new Date().toISOString() })
          .eq('id', player.id);

        console.log(`[OK] ${player.full_name}: HCP ${oldHcp ?? '?'} → ${newHcp} (${trend})`);
        updated++;
      }
    } catch (err) {
      console.error(`[HATA] ${player.full_name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`Tamamlandı. ${updated}/${players.length} oyuncunun handikabı güncellendi.`);
}

main().catch((err) => {
  console.error('Script genel hata:', err);
  process.exit(1);
});
