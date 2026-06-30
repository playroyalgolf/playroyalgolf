import Layout from '../components/Layout';

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-lg mb-2 text-fairway">{title}</h3>
      <div className="text-sm leading-relaxed space-y-1.5">{children}</div>
    </div>
  );
}

export default function Kurallar() {
  return (
    <Layout>
      <h2 className="font-display text-2xl mb-5">Lig Kuralları</h2>

      <Section title="Puanlama">
        <p>Kazandığınız maç için rakibinizin piramitteki güç puanı kadar puan kazanırsınız. Kazanılan puan toplam puanınıza eklenir.</p>
        <p>Toplam puana göre en çok puan alan oyuncu piramitte en yukarıda olacak şekilde sıralanır.</p>
        <p>Kaybeden oyuncu sabit 5 puan alır.</p>
        <p>Maça gelmeme durumunda kazanan oyuncu gelmeyen oyuncunun güç puanını alır; gelmeyen oyuncu puan almaz.</p>
      </Section>

      <Section title="Haftalık Güncelleme">
        <p>Piramit sıralaması her hafta Pazartesi 10:00&apos;da güncellenir. Oyuncunun güç puanı, o haftaki sıralamaya göre belirlenir ve hafta boyunca geçerlidir.</p>
        <p>Hafta içi alınan puanlar toplam puana eklenir; yeni sıralama bir sonraki Pazartesi 10:00&apos;da oluşur.</p>
      </Section>

      <Section title="Maç Teklifi">
        <p>Oyuncular, güncel piramit sıralamasına göre maç teklif eder. Teklif alan oyuncu müsaitlik durumuna göre kabul eder; maçın saatine karşılıklı karar verirler.</p>
        <p>Teklif edilen oyuncu 3 gün içinde cevap vermezse lig koordinatörüne haber verilir. Koordinatöre de cevap verilmezse teklif edilen oyuncu hükmen mağlup sayılır.</p>
        <p>Maç yeniden planlanacaksa rakibe en az 24 saat önceden bildirilmelidir.</p>
        <p>Tarihi belirlenen maçlar 1 hafta içinde oynanmalıdır.</p>
      </Section>

      <Section title="Öncelik Kuralları">
        <p>Maç teklifinde öncelik daima sıralamada alttan gelen teklife aittir.</p>
        <p>Bir oyuncunun kendi teklifi varken aynı zamanda ona da bir teklif gelmişse, öncelikle kendisine gelen teklifle oynamak zorundadır (örnek: 7. sıradaki kişi 5. sıradakine teklif etmiş, kendisine de 9. sıradaki teklif etmişse önce 9. sıradakiyle oynamalıdır). Bu zorunluluk bir maç için geçerlidir.</p>
        <p>Alttan gelen teklifle oynandıktan sonra, üstten teklif edilen oyuncuyla da oynanabilir; o maçtan sonra alttan gelen teklifle oynama zorunluluğu yeniden devreye girer.</p>
        <p>Hem teklif eden hem de teklif edilenin önceliği varsa, öncelik sıralamada alttaki oyuncunundur.</p>
      </Section>

      <Section title="İzin / Müsaitlik">
        <p>Oynayamayacak oyuncular müsaitlik durumunu pasife alarak maç teklifi almazlar.</p>
        <p>Pasife alınan durum 15 gün sonra otomatik olarak aktif hale gelir. Daha erken aktif hale getirmek oyuncunun kendi inisiyatifindedir.</p>
      </Section>

      <Section title="Handikaplar">
        <p>Oyuncuların güncel handikapları Türkiye Golf Federasyonu kayıtlarından her Pazartesi 10:00&apos;da otomatik olarak çekilip güncellenir. Bu, piramit puanlamasından bağımsız, oyuncular arası diğer mücadeleler için referans amaçlıdır.</p>
      </Section>
    </Layout>
  );
}
