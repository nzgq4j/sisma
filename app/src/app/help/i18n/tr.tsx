// Help centre, Turkish translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'sisma’yı web sitesinde ve Android uygulamasında kullanmak için ihtiyacın olan her şey, en sık karşılaşılan sorunların çözümleriyle birlikte.',
  popularH: 'Popüler', allH: 'Tüm konular', contactQ: 'Yanıt bulamadın mı?', contactP: 'Bize yaz, yardımcı olalım.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Unutulan şifreyi sıfırla'],
    ['/help/felt', 'vibration', 'Bir depremi hissettiğini bildir'],
    ['/help/troubleshooting', 'notifications_off', 'Uyarılar gelmiyor'],
    ['/help/troubleshooting', 'credit_card', 'Ödeme yaptım ama hâlâ ücretsiz plandayım'],
    ['/help/map#region-view', 'zoom_in_map', 'Bir depremin çevresini gör'],
    ['/help/share', 'ios_share', 'Bir depremi metinle paylaş'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Başlarken', sub: 'sisma nedir ve nasıl çalışır',
    body: (
      <>
      <p>
        sisma, dünyanın dört bir yanındaki depremleri dört sismoloji kurumunun bildirdiği şekilde gösterir: <strong>USGS</strong> (Amerika
        Birleşik Devletleri), <strong>EMSC</strong> (Avrupa ve Akdeniz), <strong>GeoNet</strong> (Yeni Zelanda) ve <strong>JMA</strong> (Japonya).
        Birden fazla kurum aynı depremi bildirdiğinde sisma onu yalnızca bir kez gösterir. Liste her iki dakikada bir kendiliğinden
        yenilenir; hemen yenilemek için akışı aşağı çekebilirsin.
      </p>
      <p>sisma’yı aynı hesap ve aynı sisma+ aboneliğiyle iki şekilde kullanabilirsin:</p>
      <ul>
        <li><strong>Web’de</strong>: <a href="https://sisma.io/app">sisma.io/app</a> adresinde, herhangi bir telefon, tablet veya bilgisayarda.</li>
        <li><strong>Android uygulamasında</strong>: Google Play’den indirilir; sistem paylaşım menüsü, Google hesap seçici ve Google Play ile ödeme ekler.</li>
      </ul>
      <p>Uygulamanın altında beş sekme vardır (bilgisayarda soldaki menüde): <Ui>Akış</Ui>, <Ui>Harita</Ui>, <Ui>Küre</Ui>, <Ui>Bilim</Ui> ve <Ui>Profil</Ui>.</p>
      <p>Depremlere bakmak için hesaba ihtiyacın yok. Hesap, kayıtlı konumlarını ve ayarlarını saklar; sisma+ ve uyarılar için gereklidir.</p>
      <Callout kind="warn"><p><strong>sisma resmî bir uyarı servisi değildir.</strong> Deprem bilgileri gecikebilir, güncellenebilir veya eksik olabilir; sisma deprem erken uyarısı vermez. Acil bir durumda her zaman yerel yetkililerin talimatlarına uy.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'Akış', sub: 'En yeni, en yakın ve en güçlü',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>Akış</Ui> sekmesi son depremleri listeler. Sıralamak için üstteki seçiciyi kullan:</p>
          <ul>
            <li><strong>En yeni</strong>: önce en yeniler.</li>
            <li><strong>En yakın</strong>: önce konumuna veya seçtiğin kayıtlı konuma en yakın olanlar.</li>
            <li><strong>En güçlü</strong>: önce en büyük olanlar.</li>
          </ul>
          <p>Her satırda renkli bir rozet içinde büyüklük, yer, ne kadar önce olduğu, sana olan uzaklığı ve derinliği görünür.</p>
          <h3>Büyüklük renkleri</h3>
          <p>Akışta, haritada ve kürede aynı renkler kullanılır:</p>
          <MagLegend words={{ label: 'Büyüklük renkleri', magnitude: 'Büyüklük {range}', orMore: '{n} ve üzeri', below: '{n} altı', to: '{a} – {b}' }} />
          <Callout><p>Zaman aralığını seçmek ve listeyi daraltmak için akışın altındaki <Ui>Filtreler</Ui> panelini aç. Bkz. <Link href="/help/map">Harita ve filtreler</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="En yeniye göre sıralanmış akış; büyüklük rozetleri, yerler, zamanlar, uzaklıklar ve derinlikler" caption="Akış, önce en yeniler" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Deprem ayrıntıları', sub: 'Her sayının açıklaması',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Ayrıntılarını açmak için herhangi bir depreme dokun:</p>
          <ul>
            <li><strong>Büyüklük</strong> ve türü (örneğin büyük depremlerde kullanılan moment büyüklüğü <em>mww</em>).</li>
            <li><strong>Derinlik</strong>: yüzeyin ne kadar altında başladığı. Sığ depremler genellikle daha güçlü hissedilir.</li>
            <li><strong>Tarih ve saat</strong>: cihazının saat diliminde.</li>
            <li>Sana olan <strong>mesafe</strong> ve <strong>ülke</strong> (denizdeki depremlerde bir ülkenin “yakınında”).</li>
            <li>Merkez üssünün <strong>koordinatları</strong>.</li>
            <li><strong>İnceleme durumu</strong>: <em>Otomatik</em> değerler doğrudan cihazlardan gelir ve ilk bir saatte sık sık değişir; <em>İncelendi</em>, bir sismoloğun değerleri kontrol ettiği anlamına gelir.</li>
            <li><strong>Kaynak</strong>: hangi kurumun verilerinin gösterildiği.</li>
          </ul>
          <p>Ayrıntıların altında:</p>
          <ul>
            <li><Ui>Bölgeyi göster</Ui>, depremin çevresinde yakındaki olayları ve varsa hissedilme haritasını içeren yakın plan bir harita açar.</li>
            <li><Ui>Paylaş</Ui>, paylaşım kartını açar (bkz. <Link href="/help/share">Paylaşma</Link>).</li>
            <li>Depremi hisseden kişiler bildirim yaptıysa kaç kişi olduğunu görürsün.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami:</strong> bir tsunami uyarı merkezi (PTWC, NTWC veya Japonya’nın JMA’sı) bir deprem için resmî mesaj yayımladığında seviyesi yayımlandığı gibi gösterilir; örneğin <strong>Tsunami uyarısı</strong> veya <strong>Tsunami bildirimi</strong>; merkez, saat, adı geçen kıyılar ve <Ui>Resmî mesajı oku</Ui> da görünür. Uyarılar, tehditler, izlemeler ve bildirimler renklidir; depremin işaretine bir dalga rozeti, satırına renkli bir dalga simgesi ekler. Bilgi mesajları ve tahminler gri kalır. <em>İptal edildi</em> veya <em>Artık geçerli değil</em> olarak işaretlenen bir mesaj geri çekilmiş ya da süresi dolmuştur. Resmî mesaj yoksa deniz altındaki büyük bir depremde <em>Deniz altında büyük deprem: resmî tsunami bilgilerini kontrol edin</em> yazar. sisma bu mesajları aktarır ve bir uyarı hizmeti değildir: her zaman yerel yetkililerin talimatlarına uyun.</p></Callout>
        </div>
        <Shot src="detail" alt="Deprem ayrıntıları: büyüklük, derinlik, tarih, saat, mesafe, ülke, koordinatlar, inceleme durumu, kaynak, Bölgeyi göster ve Paylaş" caption="Bir depremin ayrıntıları" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Harita ve filtreler', sub: 'Yakınlaştırma, bölge görünümü, filtreler',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>Harita</Ui> sekmesi son depremleri, büyüklüğe göre renklendirilmiş işaretler olarak, dünyanın senin bulunduğun kısmına odaklı gösterir.</p>
          <ul>
            <li>Parmaklarınla veya fareyle ya da <Ui>+</Ui> ve <Ui>−</Ui> düğmeleriyle <strong>kaydır ve yakınlaştır</strong>. Üçüncü düğme görünümü sıfırlar.</li>
            <li><strong>Konumum</strong> (dördüncü düğme) şu an bulunduğun yere yakınlaştırır. sisma ilk seferde konumuna erişim izni ister. <Ui>Profil</Ui> sekmesinde başka bir yer seçiliyse, noktanın çevresindeki halka senin konumunu gösterir; o seçim olduğu gibi kalır.</li>
            <li>Bir bölgeye yakınlaştırdığında, yönünü bulmana yardımcı olmak için <strong>şehir adları</strong> kendi dilinde görünür. Önce büyük şehirler gelir; adlar depremlerin üstüne gelmez ve sokak haritalarının kendi adlarına yerini bırakır.</li>
            <li>Yeterince yakınlaştırınca OpenStreetMap’ten <strong>sokak haritaları</strong> belirir; böylece bir olayın tam olarak nerede olduğunu görebilirsin.</li>
            <li>Özet kartını görmek için <strong>bir işarete dokun</strong>, her şeyi görmek için ardından <Ui>Ayrıntılar</Ui> düğmesine dokun.</li>
          </ul>
        </div>
        <Shot src="map" alt="Büyüklüğe göre renklendirilmiş deprem işaretleriyle dünya haritası" caption="Harita" />
      </div>
      <h3 id="region-view">Bölge görünümü</h3>
      <div className={s.pair}>
        <div>
          <p>Bir depremde <Ui>Bölgeyi göster</Ui>, çevresinde yaklaşık 800 km genişliğinde yakın plan bir görünüm açar; olayın üzerinde yanıp sönen bir işaret ve yakındaki depremlerde etiketler bulunur. Geri dönmek için <Ui>Dünya haritasına dön</Ui> düğmesine dokun.</p>
          <p>Birisi paylaştığın bir bağlantıyı açtığında da bölge görünümü açılır.</p>
        </div>
        <Shot src="region" alt="Bölge görünümü: yanıp sönen bir işaret ve özet kartıyla bir depremin çevresinin yakın planı" caption="Bölge görünümü" />
      </div>
      <h3>Filtreler, katmanlar ve açıklama</h3>
      <div className={s.pair}>
        <div>
          <p>Akış, Harita veya Küre’nin altındaki <Ui>Filtreler</Ui> panelini yukarı çek. Yarıya kadar açmak için bir kez, tamamen açmak için bir kez daha dokun ya da sürükle.</p>
          <ul>
            <li><strong>Zaman aralığı</strong>: 24 saat, 7 gün veya 30 gün. Bir yılın tamamı için sisma+ gerekir.</li>
            <li><strong>Büyüklük</strong> ve <strong>Bölge</strong> (bir ülke veya okyanus bölgesi) sisma+ filtreleridir; ücretsiz planda kilit simgesiyle işaretlidir.</li>
            <li><strong>Yer</strong>: yalnızca kayıtlı konumlarından birine yakın depremleri gösterir.</li>
            <li><Ui>Filtreleri temizle</Ui> her şeyi eski haline getirir.</li>
          </ul>
          <p><strong>Katmanlar</strong> altında tektonik <strong>levha sınırlarını</strong> gösterebilirsin. Panelde büyüklük açıklaması da bulunur.</p>
          <Callout><p>Bir bölge seçmek haritayı o bölgeye yakınlaştırır ve küreyi de ona doğru çevirir.</p></Callout>
        </div>
        <Shot src="filters" alt="Açık filtre paneli: zaman aralığı, büyüklük, bölge ve yer" caption="Filtre paneli" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: '3B küre', sub: 'Döndür, derinliği gör',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>Küre</Ui> sekmesi aynı depremleri 3B bir Dünya üzerinde gösterir. Çevirmek için sürükle; yakınlaştırmak için iki parmakla sıkıştır veya kaydır. Özeti için bir işarete dokun. <Ui>−</Ui> düğmesinin altındaki <Ui>Konumum</Ui>, küreyi şu an bulunduğun yere çevirir ve yakınlaştırır (görünümde kalman için dönme durur).</p>
          <p><Ui>Filtreler</Ui> panelindeki katmanlarda:</p>
          <ul>
            <li><strong>Derinlik</strong> her depremi derinliğine göre renklendirir ve başladığı noktaya kadar bir çizgi çizer; böylece dalma-batma zonlarının altındaki derin depremleri görebilirsin.</li>
            <li><strong>Levhalar</strong> levha sınırlarını gösterir.</li>
            <li><strong>Döndür</strong> küreyi kendiliğinden yavaşça döndürür.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Pasifik çevresinde deprem işaretleriyle 3B küre" caption="Küre" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Hissettim', sub: 'Bildirimler ve hissedilme haritaları',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Bir depremi hissettiysen sisma’ya bildir. Bildirimler, sarsıntının nerede ve ne kadar güçlü hissedildiğini göstermeye yardımcı olur.</p>
          <ol className={s.steps}>
            <li>Depremi aç. Deprem olduktan sonraki <strong>6 saat</strong> boyunca <Ui>Hissettim</Ui> düğmesini görürsün.</li>
            <li>Kaydırıcıyı ne kadar güçlü hissettiğine göre, <em>Hissedilmedi</em> ile <em>Aşırı</em> arasında ayarla. Rozet, karşılık gelen şiddet düzeyini (MMI) gösterir.</li>
            <li>İstersen bir not ekle ya da nerede olduğunu, ne kadar sürdüğünü, nelerin hareket ettiğini ve hasar olup olmadığını eklemek için <Ui>Ayrıntı ekle</Ui> düğmesine dokun.</li>
            <li><Ui>Haritada göster</Ui> görünürse bildirimini haritaya yerleştirmek için açık bırak ya da yalnızca sayılması için kapat. Cihazının konumu, paylaşmadıysan <Ui>Profil</Ui> bölümünde seçtiğin yer kullanılır; seçenek yalnızca bu yer depreme 3.000 km’den yakınsa görünür.</li>
            <li><Ui>Bildirimi gönder</Ui> düğmesine dokun.</li>
          </ol>
          <p>Bildirimin <strong>adın veya hesabın olmadan</strong> saklanır. Haritada konumu yaklaşık 10 km’ye yuvarlanır.</p>
          <p>Bildirimler bölge görünümünde (<Ui>Bölgeyi göster</Ui>) yaklaşık 10 km’lik küçük kareler olarak görünür. Aşağıdaki USGS ve EMSC raporlarıyla birlikte her kare, içindeki raporların ortalama şiddetinin rengini alır.</p>
          <p>USGS’nin kaydettiği depremlerde bölge görünümü, USGS <strong>Did You Feel It?</strong> anketine verilen yanıtları da her şiddet düzeyi için ayrı renkte, yaklaşık 10 km’lik renkli kareler olarak gösterir.</p>
          <p>EMSC’nin kaydettiği depremlerde EMSC web siteleri ve LastQuake uygulaması üzerinden gönderilen hissetme raporları da aynı karelere dahil edilir. EMSC verileri CC BY 4.0 lisansıyla paylaşılır.</p>
          <p>Tüm sarsıntı haritalarını birlikte göstermek veya gizlemek için <Ui>Dünya haritasına dön</Ui> düğmesinin yanındaki <Ui>Katmanlar</Ui> düğmesine dokun ve <Ui>Sarsıntı haritaları</Ui> anahtarını kullan. Seçimin bu cihazda saklanır. Depremin <Ui>Ayrıntılar</Ui> bölümündeki sarsıntı açıklaması toplam rapor sayısını ve en yüksek şiddeti, şiddet renk ölçeğiyle birlikte verir. Gri kareler, otomatik sarsıntı haritasında hiçbir raporun şiddet bildirmediği alanlardır.</p>
          <h3>Hissedilme haritaları</h3>
          <p>Bir depremin hemen ardından birçok kişi sisma’yı açtığında, bu yoğunluk depremin muhtemelen nerede hissedildiğini gösterir. sisma bunu bölge görünümünde anonim bir <strong>hissedilme haritasına</strong> dönüştürür. Konumlar cihazında 500 m’ye kadar bulanıklaştırılır, hiçbir hesap veya cihaz tanımlayıcısı taşımaz ve yalnızca en az 3 kişinin bulunduğu yaklaşık 10 km’lik alanlarda gösterilir. Bunu <Ui>Profil</Ui> → <Ui>Depremin nerede hissedildiğini haritalamaya yardım et</Ui> bölümünden kapatabilirsin.</p>
        </div>
        <Shot src="felt" alt="Şiddet kaydırıcısı, isteğe bağlı not, Haritada göster anahtarı ve Bildirimi gönder düğmesiyle Ne hissettin? penceresi" caption="Hissettiklerini bildirme" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Bir depremi paylaşma', sub: 'Görsel, metin ve alternatif metin',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Paylaşım kartı oluşturmak için bir depremde <Ui>Paylaş</Ui> düğmesine dokun: harita ve temel ayrıntıları içeren bir görsel.</p>
          <p>İnsanların depremi hissettiğini bildirdiği yerler, bölge görünümünde olduğu gibi kartın haritasında da gösterilir: şiddet renklerinde küçük kareler (şiddet bilinmiyorsa gri), sağ altta şiddet ölçeğiyle. Önerilen görsel açıklaması da bundan bahseder. Bölge görünümünde <Ui>Katmanlar</Ui> altında <Ui>Sarsıntı haritaları</Ui> kapalıysa kart da bunları göstermez.</p>
          <p>Bir tsunami uyarı merkezi deprem için resmî mesaj yayımladıysa kart, seviyesini ve merkezi haritanın sol üstünde gösterir; örneğin <strong>Tsunami uyarısı · PTWC</strong>. Bir uyarı, tehdit, izleme veya bildirim geçerli olduğu sürece renklidir. Gönderi metni ve görsel açıklaması da bunu içerir.</p>
          <ul>
            <li><strong>Gönderi metni</strong> senin için doldurulur (büyüklük, yer, zaman, derinlik ve bir hashtag; bağlantı en sonda) ve düzenleyebilirsin.</li>
            <li><strong>Görsel açıklaması (alternatif metin)</strong>, ekran okuyucu kullananlar için görseli tarif eder. Senin için doldurulur ve düzenleyebilirsin.</li>
            <li><Ui>Görseli paylaş</Ui>, telefonunun paylaşım menüsünü açar (Android uygulamasında ve bunu destekleyen tarayıcılarda). Tarayıcı görsel paylaşamıyorsa veya görsel oluşturulamadıysa <Ui>Bağlantıyı paylaş</Ui>, bunun yerine gönderi metnini bağlantısıyla paylaşır. <Ui>Görseli kaydet</Ui> görseli indirir; <Ui>Metni kopyala</Ui> ve <Ui>Alternatif metni kopyala</Ui> ilgili alanı kopyalar.</li>
          </ul>
          <Callout><p>X, Facebook ve Bluesky paylaşılan bir görselle gelen metni çoğu zaman atar ve hiçbiri alternatif metni bu yolla almaz. <strong>Görseli paylaş metni de kopyalar</strong>, böylece gönderiye yapıştırabilirsin. <Ui>Alternatif metni kopyala</Ui> düğmesini kullan ve metni uygulamanın görsel açıklaması alanına yapıştır. iPhone’da paylaşım menüsü hemen açılmazsa <Ui>Görseli paylaş</Ui> düğmesine yeniden dokun: metin zaten kopyalandı.</p></Callout>
        </div>
        <Shot src="share" alt="Paylaşım kartı önizlemesi, düzenlenebilir gönderi metni ve görsel açıklamasıyla paylaşım penceresi" caption="Paylaşım penceresi" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Hesabın', sub: 'Giriş, şifreler, silme',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>Profil</Ui> sekmesine git ve <Ui>Giriş yap</Ui> düğmesine dokun. Google’ı ya da e-postanı ve bir şifreyi kullanabilirsin.</p>
          <h3>E-postayla hesap oluştur</h3>
          <ol className={s.steps}>
            <li>Giriş penceresinin altındaki <Ui>Hesap oluştur</Ui> düğmesine dokun.</li>
            <li>E-postanı ve bir şifre gir: en az 8 karakter, harf ve rakam içersin.</li>
            <li>Sana gönderdiğimiz onay e-postasını aç ve bağlantıya dokun. Ardından giriş yapmış olursun.</li>
          </ol>
          <h3>Google ile giriş yap</h3>
          <p><Ui>Google ile devam et</Ui> düğmesine dokun. Android uygulamasında, açılan listeden Google hesabını seç. Google e-postanın zaten bir sisma hesabı varsa Google aynı hesaba eklenir.</p>
        </div>
        <Shot src="signin" alt="Giriş penceresi: Google ile devam et, e-posta ve şifre, Şifreni mi unuttun? ve Hesap oluştur" caption="Giriş yapma" />
      </div>

      <h3 id="password-reset">Şifreni mi unuttun? Sıfırla</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li><Ui>Profil</Ui> sekmesinde <Ui>Giriş yap</Ui> düğmesine dokun ve e-posta adresini yaz.</li>
            <li><Ui>Şifreni mi unuttun?</Ui> bağlantısına dokun. <em>E-postanı kontrol et</em> mesajını görürsün.</li>
            <li>E-postayı aç ve bağlantıya dokun. sisma açılır ve <em>Yeni şifre belirle</em> ekranını gösterir.</li>
            <li>Yeni şifreyi iki kez gir ve <Ui>Kaydet</Ui> düğmesine dokun. Giriş yapmış olursun.</li>
          </ol>
          <Callout kind="note"><p>Gizliliğin için sisma, o adresi kullanan bir hesap olmasa bile her zaman bağlantıyı gönderdiğini söyler. Birkaç dakika içinde bir şey gelmezse spam klasörünü kontrol et ve kaydolurken kullandığın adresi yazdığından emin ol.</p></Callout>
        </div>
        <Shot src="forgot" alt="E-postanı kontrol et: şifreyi sıfırlamak için bir bağlantı gönderdik" caption="Şifreni mi unuttun? bağlantısına dokunduktan sonra" />
      </div>

      <h3>Şifreni değiştir veya Google hesabına şifre ekle</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li><Ui>Profil</Ui> → <Ui>Hesap</Ui> bölümünde <Ui>Şifre belirle veya değiştir</Ui> seçeneğine dokun.</li>
            <li>Yeni şifreyi iki kez gir ve <Ui>Kaydet</Ui> düğmesine dokun.</li>
          </ol>
          <p>Google ile kaydolduysan bu işlem bir şifre ekler; böylece e-postanla da giriş yapabilirsin. sisma önce yeniden giriş yapmanı isterse bu bir güvenlik kontrolüdür: çıkış yap, tekrar giriş yap ve yeniden dene.</p>
        </div>
        <Shot src="password" alt="Yeni şifre ve onay alanlarıyla Yeni şifre belirle penceresi" caption="Yeni şifre belirleme" />
      </div>

      <h3>Diğer hesap işlemleri</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Görünen ad</strong>: <Ui>Profil</Ui> → <Ui>Görünen ad</Ui>. E-postanın görünmesi için boş bırak.</li>
            <li><strong>Çıkış yap</strong>: <Ui>Profil</Ui> → <Ui>Çıkış yap</Ui>. Kayıtlı konumların hesabında kalır.</li>
            <li><strong>E-posta adresini değiştirme</strong>: bu henüz uygulamada mümkün değil. Mevcut adresinden <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yaz.</li>
          </ul>
        </div>
        <Shot src="me" alt="Profil’deki Hesap bölümü: görünen ad, e-posta, şifre, çıkış, yardım ve destek, hesabı silme" caption="Hesap, Profil’in en altında" />
      </div>

      <h3 id="delete-account">Hesabını sil</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>sisma+ aboneliğin varsa önce onu iptal et (bkz. <Link href="/help/plus#cancel">sisma+ iptali</Link>). sisma, yenilenmeye devam eden bir aboneliği olan hesabı silmez.</li>
            <li><Ui>Profil</Ui> sekmesinde <Ui>Hesabı sil</Ui>, ardından <Ui>Kalıcı olarak sil</Ui> düğmesine dokun.</li>
          </ol>
          <p>Bu işlem hesabını, kayıtlı konumlarını ve uyarı ayarlarını kalıcı olarak siler. Gönderdiğin hissedilme bildirimleri adın olmadan saklanır. Hesabı silmek Android uygulamasını silmez; istersen uygulamayı ayrıca kaldır. Verilerine ne olduğunu <Link href="/privacy#delete">gizlilik politikamız</Link> açıklar.</p>
        </div>
        <Shot src="delete" alt="Kalıcı olarak sil ve İptal düğmeleriyle Hesabın silinsin mi? penceresi" caption="Hesap silme" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Kayıtlı konumlar', sub: 'Önem verdiğin yerler',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Kayıtlı konumlar, hangi depremlerin “en yakın” olduğunu ve uyarılarının hangi yerleri izlediğini belirler.</p>
          <ul>
            <li><strong>Konumum</strong>, cihazının konumunu kullanır (tarayıcın veya telefonun önce izin ister).</li>
            <li><Ui>Konum ekle</Ui> ile bir şehir veya kasaba arayıp kaydedebilirsin.</li>
            <li>Mesafeler için kullanılacak konumu seçmek için ona dokun. Kaldırmak için <Ui>×</Ui> simgesine dokun.</li>
            <li><strong>Konumum</strong> seçiliyken sisma, cihazın verebildiği her an konumunu kullanır. Veremiyorsa (konum kapalı veya izin verilmemiş) ya da kayıtlı bir yer seçtiysen sisma o kayıtlı yeri kullanır: varsayılan yerini veya kaydettiğin ilk yeri.</li>
          </ul>
          <p>Ücretsiz planda <strong>1 kayıtlı konum</strong>, sisma+’ta <strong>en fazla 10</strong> konum vardır. Hesap olmadan konumlar bu cihazda saklanır ve giriş yaptığında hesabına taşınır.</p>
        </div>
        <Shot src="addloc" alt="Şehir veya kasaba arama kutusuyla Konum ekle penceresi" caption="Konum ekleme" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Deneme, ödeme, iptal',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma ücretsizdir. sisma+ şunları ekler:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Özellik</th><th>Ücretsiz</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Canlı akış, harita, küre, bilim</td><td>✓</td><td>✓</td></tr>
                <tr><td>Resmî tsunami bildirimleri</td><td>✓</td><td>✓</td></tr>
                <tr><td>Deprem geçmişi</td><td>30 gün</td><td>Tüm geçmiş</td></tr>
                <tr><td>Kayıtlı konumlar</td><td>1</td><td>En fazla 10</td></tr>
                <tr><td>Kendi kurallarınla anlık uyarılar</td><td>–</td><td>En fazla 5 uyarı</td></tr>
                <tr><td>Büyüklük ve bölge filtreleri</td><td>–</td><td>✓</td></tr>
                <tr><td>Canlı deprem verisi grafikleri</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Fiyat: <strong>yılda {usd(PRICES.yearly.usd)}</strong>, tek plan. Google Play fiyatı yerel para biriminde gösterir. Yeni aboneler hesap başına bir kez <strong>{TRIAL_DAYS} günlük ücretsiz deneme</strong> alır.</p>
        </div>
        <Shot src="paywall" alt={`Özellikler, yıllık fiyat ve ${TRIAL_DAYS} günlük ücretsiz denemeyi başlat düğmesiyle sisma+ penceresi`} caption="Plan seçme" />
      </div>

      <h3>Abone ol</h3>
      <ul>
        <li><strong>Web sitesinde</strong>: <Ui>Profil</Ui> → <Ui>{TRIAL_DAYS} günlük ücretsiz denemeyi başlat</Ui> (veya <Ui>Abone ol</Ui>), ardından Stripe’ın güvenli ödeme sayfasında öde. Önce hesap oluşturursan, onay e-postasındaki bağlantıya dokunduğunda ödeme sayfası açılır. Geri döndüğünde sisma birkaç saniye <em>sisma+ etkinleştiriliyor…</em>, ardından <em>sisma+’a hoş geldiniz</em> mesajını gösterir.</li>
        <li><strong>Android uygulamasında</strong>: aynı düğme Google Play’in ödeme penceresini açar; burada Google Pay, kart veya diğer Google Play ödeme yöntemleriyle ödeyebilirsin.</li>
      </ul>
      <p>Giriş yapmış olman gerekir. Aboneliğin, o hesapla giriş yaptığın her yerde, web’de ve uygulamada çalışır.</p>

      <h3>Planı yönet veya değiştir</h3>
      <div className={s.pair}>
        <div>
          <p>Durumunu, planını ve sonraki tarihi görmek için <Ui>Profil</Ui> → <Ui>Aboneliği yönet</Ui> bölümüne git.</p>
          <ul>
            <li><strong>Web sitesinden satın alındıysa</strong>: <Ui>Faturalandırmayı yönet</Ui>, Stripe’ın sayfasını açar; burada kartını güncelleyebilir, faturaları görebilir veya iptal edebilirsin.</li>
            <li><strong>Android uygulamasından satın alındıysa</strong>: <Ui>Google Play’de yönet</Ui>, aboneliğini Google Play’de açar.</li>
          </ul>
        </div>
        <Shot src="subscription" alt="Abonelik sayfası: durum, plan, yenileme tarihi ve Google Play’de yönet" caption="Aboneliğin" />
      </div>

      <h3 id="cancel">sisma+ iptali</h3>
      <ol className={s.steps}>
        <li><Ui>Profil</Ui> → <Ui>Aboneliği yönet</Ui> bölümünü aç.</li>
        <li><Ui>Faturalandırmayı yönet</Ui> (web sitesi) veya <Ui>Google Play’de yönet</Ui> (uygulama) düğmesine dokun ve iptal işlemini orada yap. Google Play’de <em>Ödemeler ve abonelikler → Abonelikler</em> bölümüne de gidebilirsin.</li>
      </ol>
      <p>sisma+, ödediğin dönemin sonuna kadar devam eder. Ardından <Ui>Profil</Ui> kartında <em>… tarihinde sona eriyor</em> ifadesi tarihle birlikte görünür ve o tarihten sonra ücretsiz plana dönersin. Ücretsiz denemeyi bitmeden iptal edersen ücret alınmaz.</p>
      <Callout kind="note"><p>Uygulamayı kaldırmak veya sisma hesabını silmek Google Play aboneliğini <strong>iptal etmez</strong>. Aboneliği Google Play’de iptal et.</p></Callout>

      <h3>Satın alımı geri yükle</h3>
      <p>Yeni bir telefonda veya uygulamayı yeniden yükledikten sonra aynı sisma hesabıyla giriş yap. sisma+ görünmezse sisma+ penceresini aç ve <Ui>Satın alımı geri yükle</Ui> düğmesine dokun. Bu yalnızca Android uygulamasında vardır ve bu cihazdaki Google Play aboneliğini bulur.</p>

      <h3>İadeler</h3>
      <p>Google Play satın alımları Google Play’in iade politikalarına tabidir; iadeyi Google Play üzerinden iste. Web sitesinden yapılan satın alımlar için <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yaz. Ayrıntıları <Link href="/terms">hizmet şartlarımız</Link> açıklar.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Uyarılar', sub: 'Sana uyan anlık bildirimler',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma+ ile bir deprem uyarılarından biriyle eşleştiğinde sisma anlık bildirim gönderir.</p>
          <ol className={s.steps}>
            <li>Giriş yap ve sisma+ aboneliğin olduğundan emin ol.</li>
            <li><Ui>Profil</Ui> sekmesinde <Ui>Anlık bildirimler</Ui> seçeneğini aç ya da <Ui>Uyarı kuralları</Ui> bölümünü açıp <em>Deprem uyarıları</em> anahtarını aç.</li>
            <li><em>Gönderim yolu</em> altında <Ui>Bu cihazda bildirimleri aç</Ui> düğmesine dokun ve sorulduğunda bildirimlere izin ver.</li>
            <li><Ui>Uyarı ekle</Ui> düğmesine dokun ve uyarıyı ayarla (aşağıya bak). En fazla 5 uyarın olabilir.</li>
            <li>Bu cihazın uyarıları aldığını kontrol etmek için <Ui>Test uyarısı gönder</Ui> düğmesine dokun.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Açma/kapama anahtarı, uyarıların (0 / 5), Uyarı ekle ve Gönderim yolu ile uyarılar sayfası" caption="Uyarılar sayfası" />
      </div>
      <h3>Uyarı ayarlama</h3>
      <ul>
        <li><strong>Ad</strong>: örneğin <em>Ev yakını</em>.</li>
        <li><strong>En düşük büyüklük</strong>: bu büyüklükte ve daha güçlü depremler için uyarı alırsın.</li>
        <li><strong>İzlenen</strong>: seçtiğin mesafe içindeki kayıtlı yerlerin (100, 250, 500 veya 1.000 km) ya da dünyanın her yeri.</li>
        <li><strong>Diğer konumlar</strong>: en fazla 20 ülke veya bölge, içlerinde herhangi bir yer.</li>
        <li><strong>Sessiz saatler</strong>: gece uyarı yok; istersen güçlü depremlerin (6 ve üzeri büyüklük) yine de gelmesine izin verebilirsin.</li>
        <li>Bir grafik, son 30 günde kaç depremin bu uyarıyı tetikleyeceğini gösterir; böylece uyarını ince ayarlayabilirsin.</li>
      </ul>
      <p>Son 30 günde aldığın uyarılar <em>Uyarı geçmişi</em> altında listelenir.</p>
      <h3>Tsunami bildirimleri</h3>
      <p>Tsunami bildirimleri oturum açan herkes için ücretsizdir. <Ui>Profil</Ui> bölümünde <Ui>Tsunami bildirimleri</Ui> seçeneğini açın ve <Ui>Bu cihazda bildirimleri aç</Ui> düğmesine dokunun. Kayıtlı yerlerinizden birine 1.000 km mesafedeki bir deprem için resmî tsunami uyarısı, tehdidi, izlemesi veya bildirimi yayımlandığında bildirim alırsınız. Sessiz saatler uygulanmaz ve her seviye deprem başına yalnızca bir kez gönderilir.</p>
      <Callout kind="note"><p><strong>iPhone ve iPad:</strong> web bildirimleri yalnızca sisma’yı Ana Ekran’a ekledikten (Paylaş → Ana Ekrana Ekle) ve oradan açtıktan sonra çalışır. sisma’yı iPhone veya iPad’de tarayıcıda ilk kez açtığınızda bu adımlar bir açılır pencerede gösterilir; iki hafta sonra yeniden görmek için <Ui>Şimdi değil</Ui>, gizlemek için <Ui>Anladım</Ui> düğmesine dokunun.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Ayarlar', sub: 'Dil, tema, birimler',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Bunları <Ui>Profil</Ui> sekmesinde, konumlarının altında bulabilirsin:</p>
          <ul>
            <li><strong>Dil</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français veya Deutsch. Herhangi bir sekmenin üstündeki dil düğmesine de dokunabilirsin.</li>
            <li><strong>Görünüm</strong>: cihazını takip et (Sistem), Açık veya Koyu.</li>
            <li><strong>Birimler</strong>: kilometre veya mil.</li>
            <li><strong>Harita işaretleri</strong>: içinde büyüklüğün yazdığı iğneler veya büyüklüğe göre boyutlanan daireler. Renk açıklamasını da burada bulursun.</li>
            <li><strong>Depremin nerede hissedildiğini haritalamaya yardım et</strong>: anonim hissedilme haritası paylaşımını açar veya kapatır (bkz. <Link href="/help/felt">Hissettim</Link>).</li>
            <li><strong>Tanıtımı göster</strong>, karşılama adımlarını yeniden oynatır.</li>
          </ul>
          <p>Giriş yaptığında dil ve görünüm tercihlerin hesabına kaydedilir.</p>
        </div>
        <Shot src="me_more" alt="Ayarlar: dil, görünüm, birimler, harita işaretleri, hissedilme haritası anahtarı, tanıtım ve veri kaynakları" caption="Profil’deki ayarlar" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Bilim', sub: 'Depremler nasıl oluşur',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>Bilim</Ui> sekmesinde, her biri animasyonlu bir şema veya canlı bir grafik içeren sekiz kısa resimli rehber bulunur: levha tektoniği, fay türleri, sismik dalgalar, büyüklük ve şiddet, derinlik ve artçı sarsıntılar, tsunamiler, nasıl hazırlanılır ve Pasifik çevresinde son zamanlarda kaç deprem olduğunu gösteren canlı haritasıyla Ateş Çemberi.</p>
          <p>Görünümü değiştirmek için şemanın altındaki düğmelere, animasyonu durdurmak için duraklat düğmesine dokun. Rehberler, uygulamanın geri kalanı gibi senin dilinde görünür. Bir rehberi birine göndermek için rehberin üstündeki <Ui>Paylaş</Ui> düğmesine dokun; görseli, kısa bir özeti ve bağlantısıyla gönderilir.</p>
          <p>Rehberlerin altında, <Ui>Derinlemesine</Ui> bölümünde daha ileri gitmek istediğinde okuyabileceğin daha uzun makaleler var: depremler neden önceden tahmin edilemez, levha tektoniği ve dalma-batma, faylar ve gerilme, Dünya’nın içi ve sismik dalgalar, artçı sarsıntılar ve deprem tehlikeleri, bir mahalle yıkılırken yanındakinin neden ayakta kaldığı ve büyüklük ölçeklerinin nasıl çalıştığı ile deprem sonrasında sayının neden değiştiği. Her birinin sonunda kaynakları listelenir ve sık sorulan sorular yanıtlanır. Bunlar da senin dilinde; kaynak listesi İngilizce kalır.</p>
          <p><Ui>Veriler</Ui> altındaki <Ui>Deprem verileri</Ui> (sisma+), USGS verilerine göre dünya genelinde son 30 günde olan M4.5+ depremleri grafiklerle gösterir: kaç deprem olduğu, büyüklükleri ve derinlikleri, gerçekleştikleri bölgeler, açığa çıkan enerji ve 1900’den bu yana her yıl olan M7+ deprem sayısı. Her grafiğin kısa bir açıklaması vardır; değerini görmek için bir çubuğa dokun. sisma+ olmadan açıklamaları ve ücretsiz denemeyi başlatma düğmesini görürsün. Renklerin bir anlamı var: büyüklükler haritadaki işaretlerin renklerini, derinlikler küredeki Derinlik modunun renklerini kullanır; çoğunlukla Ateş Çemberi’ndeki bölgeler vurgulanır ve ortalamanın üstündeki çubuklar mercan rengindedir.</p>
        </div>
        <Shot src="science" alt="P dalgalarının animasyonlu şemasıyla sismik dalgalar makalesi" caption="Bir bilim rehberi" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Sorun giderme', sub: 'Sık karşılaşılan sorunların çözümleri',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Konum ve veriler</p>
        <Faq q="“En yakın” boş ya da konumum bulunamıyor">
          <p>sisma’nın konumunu kullanma iznine veya kayıtlı bir konuma ihtiyacı var.</p>
          <ul>
            <li><strong>Tarayıcı</strong>: web adresinin yanındaki simgeye dokun, <em>Konum</em> ayarını <em>İzin ver</em> yap ve sayfayı yeniden yükle.</li>
            <li><strong>Android uygulaması</strong>: Ayarlar → Uygulamalar → sisma → İzinler → Konum → <em>Yalnızca uygulama kullanılırken izin ver</em>.</li>
            <li>Ya da <Ui>Profil</Ui> → <Ui>Konum ekle</Ui> ile bir yer ekle.</li>
          </ul>
        </Faq>
        <Faq q="Bir deprem eksik ya da büyüklüğü değişti">
          <p>Kurumlar önce otomatik değerler yayımlar, sonra bunları genellikle ilk bir saat içinde günceller. Büyüklük, derinlik ve yer değişebilir; bazı küçük olaylar silinir. Farklı kurumlar biraz farklı değerler de bildirebilir; sisma, varsa bölgesel kurumun verilerini (Japonya’da JMA, Yeni Zelanda’da GeoNet), yoksa USGS’yi, ardından EMSC’yi gösterir. Çok küçük depremler (Japonya ve Yeni Zelanda dışında yaklaşık 2,5 büyüklüğün altındakiler) dahil edilmez.</p>
        </Faq>
        <Faq q="Saatler yanlış görünüyor">
          <p>Saatler cihazının saat diliminde gösterilir. Cihazının tarih, saat ve saat dilimi ayarlarını kontrol et.</p>
        </Faq>
        <Faq q="Çok yakınlaştırınca harita boş görünüyor">
          <p>Sokak düzeyindeki haritalar OpenStreetMap’ten gelir ve internet bağlantısı gerektirir. Yüklenmezlerse biraz uzaklaştır; deprem işaretleri yine çalışır.</p>
        </Faq>
        <Faq q="Uygulama çevrimdışı olduğumu söylüyor">
          <p>sisma’nın depremleri yüklemek için bağlantıya ihtiyacı var. Wi-Fi’yi veya mobil veriyi kontrol et, sonra uygulamayı yeniden aç.</p>
        </Faq>

        <p className={s.faqGroup}>Giriş yapma</p>
        <Faq q="“E-posta veya şifre yanlış.”">
          <p>Yazım hatası olup olmadığını kontrol et, ardından <Link href="/help/account#password-reset">Şifreni mi unuttun?</Link> seçeneğini kullan. Hesabını Google ile oluşturduysan <Ui>Google ile devam et</Ui> düğmesini kullan ya da Google ile giriş yapmışken <Ui>Profil</Ui> → <Ui>Şifre belirle veya değiştir</Ui> bölümünden bir şifre ekle.</p>
        </Faq>
        <Faq q="“Önce e-postanı onayla”">
          <p>sisma’dan gelen onay e-postasını aç ve bağlantıya dokun, sonra giriş yap. Bulamıyor musun? Spam klasörünü kontrol et. Hâlâ yoksa o adresten <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yaz.</p>
        </Faq>
        <Faq q="Sıfırlama veya onay e-postası gelmedi">
          <p>Birkaç dakika bekle ve spam ya da promosyonlar klasörünü kontrol et. Kaydolurken kullandığın adresi yazdığından emin ol. Gizliliğin için sisma, o adresi kullanan bir hesap olmasa bile sıfırlama bağlantısını gönderdiğini söyler.</p>
        </Faq>
        <Faq q="Google ile giriş çalışmıyor">
          <p>Android uygulamasında telefonda bir Google hesabıyla giriş yapmış olduğundan (Ayarlar → Şifreler ve hesaplar) ve Google Play hizmetlerinin güncel olduğundan emin ol. Web’de sisma.io için açılır pencerelere ve üçüncü taraf girişe izin ver. Her zaman e-postayla da giriş yapabilirsin.</p>
        </Faq>
        <Faq q="“Güvenliğin için çıkış yapıp tekrar giriş yap”">
          <p>Şifre değiştirmek için yakın zamanda giriş yapmış olman gerekir. <Ui>Çıkış yap</Ui> düğmesine dokun, tekrar giriş yap ve ardından şifreni değiştir.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ ve ödeme</p>
        <Faq q="Ödeme yaptım ama hâlâ ücretsiz planı görüyorum">
          <ul>
            <li>Bir dakika bekle, sonra sisma’yı kapatıp yeniden aç. Etkinleştirme genellikle hemen olur ama birkaç dakika sürebilir.</li>
            <li>Abone olduğun hesapla giriş yaptığından emin ol.</li>
            <li>Android uygulaması: sisma+ penceresini aç ve <Ui>Satın alımı geri yükle</Ui> düğmesine dokun.</li>
            <li>Hâlâ çalışmıyor mu? Hesap e-postanı ve Google Play için makbuzundaki sipariş numarasını (GPA.…) ekleyerek <a href={`mailto:${MAIL}`}>{MAIL}</a> adresine yaz.</li>
          </ul>
        </Faq>
        <Faq q="“Bu Google Play aboneliği başka bir sisma hesabına ait.”">
          <p>Bu telefondaki abonelik, farklı bir sisma hesabıyla giriş yapılmışken satın alındı. Çıkış yap ve o hesapla giriş yap.</p>
        </Faq>
        <Faq q="Ücretsiz deneme sunulmadı">
          <p>Deneme, daha önce hiç abone olmamış hesaplar içindir. Android uygulamasında Google Play de, farklı sisma hesaplarında bile, Google hesabı başına tek bir denemeye izin verir.</p>
        </Faq>
        <Faq q="“Uygulama içi abonelikler henüz kullanılamıyor” veya “Bu cihazda Google Play faturalandırması kullanılamıyor”">
          <p>sisma’yı ve Google Play Store uygulamasını güncelle ve Google Play’de oturum açtığından emin ol. Google Play olmayan bazı cihazlar uygulama içinden satın alma yapamaz. Bunun yerine <a href="https://sisma.io/app/me">sisma.io</a> üzerinden abone ol ve uygulamada aynı hesapla giriş yap.</p>
        </Faq>
        <Faq q="Hesabımı silemiyorum">
          <p>Önce sisma+ aboneliğini iptal et. Sona erecek şekilde ayarlandığında hesabı silebilirsin. Bkz. <Link href="/help/account#delete-account">Hesabını sil</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Uyarılar ve bildirimler</p>
        <Faq q="Uyarı almıyorum">
          <ol>
            <li>sisma+ aboneliğin olduğunu ve giriş yaptığını kontrol et.</li>
            <li><Ui>Profil</Ui> → <Ui>Uyarı kuralları</Ui> bölümünde uyarıların açık olduğunu ve en az bir uyarının açık olup yer veya bölge içerdiğini kontrol et.</li>
            <li><em>Gönderim yolu</em> altında bu cihazın açık olduğunu kontrol et, ardından <Ui>Test uyarısı gönder</Ui> düğmesine dokun.</li>
            <li>Android: Ayarlar → Uygulamalar → sisma → Bildirimler izinli olmalıdır. Pil tasarrufu ayarları bildirimleri geciktirebilir; sisma’nın pil kullanımını <em>Kısıtlamasız</em> olarak ayarla.</li>
            <li>Tarayıcı: sisma.io için bildirimlere izin verilmiş olmalıdır. iPhone ve iPad’de sisma’yı Ana Ekran’dan aç.</li>
            <li>Güçlü depremlerin gelmesine izin vermediysen sessiz saatler gece uyarıları bekletir.</li>
          </ol>
        </Faq>
        <Faq q="Çok fazla uyarı alıyorum">
          <p>En düşük büyüklüğü yükselt, mesafeyi azalt, geniş bölgeleri kaldır veya sessiz saatler ayarla. Her uyarıdaki 30 günlük grafik, uyarının ne sıklıkla tetikleneceğini gösterir.</p>
        </Faq>

        <p className={s.faqGroup}>Paylaşım ve hissedilme bildirimleri</p>
        <Faq q="“Görseli paylaş” düğmesi yok">
          <p>Tarayıcın dosya paylaşamıyor. <Ui>Görseli kaydet</Ui> ve <Ui>Metni kopyala</Ui> düğmelerini kullan, sonra bunları kendin paylaş. Android uygulamasında sistem paylaşım menüsünü almak için sisma’yı güncelle.</p>
        </Faq>
        <Faq q="Metin gönderimde görünmedi">
          <p>Birçok uygulama görselle paylaşılan metni atar. <Ui>Görseli paylaş</Ui> düğmesine dokunduğunda sisma metni kopyaladı; gönderiye yapıştır.</p>
        </Faq>
        <Faq q="“Hissettim” düğmesi yok">
          <p>Bildirimler bir depremden sonra 6 saat boyunca açıktır. Bu süreden sonra düğme kaybolur.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Destekle iletişim', sub: 'Hâlâ takıldın mı? Bize yaz',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Hâlâ yardıma mı ihtiyacın var?</strong> Bize yaz; hesap e-postanı, cihazını, tarayıcını veya uygulama sürümünü ve neler denediğini ekle. Bir ekran görüntüsü de işe yarar.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Lütfen şifre veya kart numaranın tamamını gönderme. Bunları asla istemeyiz.</p>
      </>
    ),
  },
];
