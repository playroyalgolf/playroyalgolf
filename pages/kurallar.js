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

      <Section title="Oyun Formatı">
        <p>Tüm maçlar <strong>match play</strong> formatında oynanır. Beraberlik yoktur, her maçın mutlaka bir galibi olmalıdır.</p>
        <p>Maç sonucu hole farkıyla ifade edilir: örneğin <strong>3&amp;2</strong> (3 fark, 2 hole kala), <strong>1 up</strong> (18. hole sonunda 1 fark) gibi.</p>
      </Section>

      <Section title="Puanlama">
        <p><strong>Galip oyuncu</strong> sabit <strong>15 puan</strong> kazanır.</p>
        <p><strong>Mağlup oyuncu</strong> sabit <strong>5 puan</strong> kazanır.</p>
        <p>Maça gelmeyen oyuncu puan almaz; kazanan oyuncu 15 puan kazanır.</p>
      </Section>

      <Section title="Averaj">
        <p>Her maçın sonunda hole farkı averaja yansır. Galip oyuncunun averajına <strong>+</strong> eklenir, mağlup oyuncunun averajına <strong>−</strong> eklenir.</p>
        <p>Örnek: 3&amp;2 sonuçlu maçta galip +3, mağlup −3 averaj alır.</p>
        <p>Averaj, eşit puanlı oyuncular arasında sıralamayı belirlemez; bilgi amaçlıdır.</p>
      </Section>

      <Section title="Sonuç Onayı">
        <p>Maç bittikten sonra oyunculardan biri skoru sisteme girer ve kazananı bildirir. Rakip oyuncu bildirilen sonucu <strong>onaylar</strong>. İki tarafın onayı olmadan sonuç resmi olmaz ve puanlar verilmez.</p>
        <p>Sonuca itiraz edilmesi durumunda maç tekrar planlandı durumuna döner ve koordinatöre bildirilmesi gerekir.</p>
      </Section>

      <Section title="Maç Teklifi">
        <p>Oyuncular, güncel puan durumuna göre istedikleri rakibe maç teklif edebilir. Teklif ederken maç tarihi ve saatini de belirlemesi gerekir.</p>
        <p>Teklif alan oyuncu müsaitlik durumuna göre kabul veya red edebilir.</p>
        <p>Teklif edilen oyuncu 3 gün içinde cevap vermezse lig koordinatörüne bildirilmesi gerekir. Koordinatöre de cevap verilmezse teklif edilen oyuncu hükmen mağlup sayılır.</p>
        <p>Maç yeniden planlanacaksa rakibe en az 24 saat önceden bildirilmelidir.</p>
        <p>Tarihi belirlenen maçlar 1 hafta içinde oynanmalıdır.</p>
      </Section>

      <Section title="İzin / Müsaitlik">
        <p>Oynayamayacak oyuncular müsaitlik durumunu pasife alarak maç teklifi almazlar.</p>
        <p>Pasife alınan durum 15 gün sonra otomatik olarak aktif hale gelir. Daha erken aktif hale getirmek oyuncunun kendi inisiyatifindedir.</p>
      </Section>

      <Section title="Handikaplar">
        <p>Oyuncuların güncel handikapları Türkiye Golf Federasyonu kayıtlarından her Pazartesi 10:00&apos;da otomatik olarak güncellenir. Handikaplar bilgi amaçlıdır; lig puanlamasını etkilemez.</p>
      </Section>
    </Layout>
  );
}
