// Help centre, Indonesian translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Semua yang Anda perlukan untuk memakai sisma di situs web dan di aplikasi Android, beserta solusi untuk masalah yang paling umum.',
  popularH: 'Populer', allH: 'Semua topik', contactQ: 'Tidak menemukan jawaban?', contactP: 'Kirimi kami pesan dan kami akan membantu.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Mengatur ulang kata sandi yang terlupa'],
    ['/help/felt', 'vibration', 'Melaporkan bahwa Anda merasakan gempa'],
    ['/help/troubleshooting', 'notifications_off', 'Tidak menerima peringatan'],
    ['/help/troubleshooting', 'credit_card', 'Sudah membayar, tetapi masih paket gratis'],
    ['/help/map#region-view', 'zoom_in_map', 'Melihat area di sekitar gempa'],
    ['/help/share', 'ios_share', 'Membagikan gempa beserta teks'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Memulai', sub: 'Apa itu sisma dan cara kerjanya',
    body: (
      <>
      <p>
        sisma menampilkan gempa di seluruh dunia sebagaimana dilaporkan oleh empat lembaga seismik: <strong>USGS</strong> (Amerika
        Serikat), <strong>EMSC</strong> (Eropa dan Mediterania), <strong>GeoNet</strong> (Selandia Baru) dan <strong>JMA</strong> (Jepang).
        Jika beberapa lembaga melaporkan gempa yang sama, sisma menampilkannya sekali saja. Daftar diperbarui sendiri setiap dua
        menit, dan Anda bisa menarik daftar ke bawah untuk langsung memperbaruinya.
      </p>
      <p>Anda bisa memakai sisma dengan dua cara, dengan akun yang sama dan langganan sisma+ yang sama:</p>
      <ul>
        <li><strong>Di web</strong> di <a href="https://sisma.io/app">sisma.io/app</a>, di ponsel, tablet, atau komputer apa pun.</li>
        <li><strong>Di aplikasi Android</strong> dari Google Play, yang menambahkan lembar berbagi sistem, pemilih akun Google, dan penagihan Google Play.</li>
      </ul>
      <p>Aplikasi ini punya lima tab di bagian bawah (di komputer, di menu sebelah kiri): <Ui>Daftar</Ui>, <Ui>Peta</Ui>, <Ui>Globe</Ui>, <Ui>Sains</Ui> dan <Ui>Saya</Ui>.</p>
      <p>Anda tidak perlu akun untuk melihat gempa. Akun menyimpan lokasi dan setelan Anda, dan diperlukan untuk sisma+ serta peringatan.</p>
      <Callout kind="warn"><p><strong>sisma bukan layanan peringatan resmi.</strong> Informasi gempa bisa terlambat, direvisi, atau tidak lengkap, dan sisma tidak memberikan peringatan dini gempa. Dalam keadaan darurat, selalu ikuti petunjuk pihak berwenang setempat.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'Daftar gempa', sub: 'Terbaru, terdekat, dan terkuat',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tab <Ui>Daftar</Ui> memuat gempa terbaru. Gunakan pengalih di bagian atas untuk mengurutkannya:</p>
          <ul>
            <li><strong>Terbaru</strong>: yang paling baru lebih dulu.</li>
            <li><strong>Terdekat</strong>: yang paling dekat dengan lokasi Anda atau lokasi tersimpan pilihan Anda lebih dulu.</li>
            <li><strong>Terkuat</strong>: magnitudo tertinggi lebih dulu.</li>
          </ul>
          <p>Setiap baris menampilkan magnitudo dalam lencana berwarna, tempatnya, berapa lama yang lalu terjadi, seberapa jauh dari Anda, dan seberapa dalam.</p>
          <h3>Warna magnitudo</h3>
          <p>Warna yang sama dipakai di daftar, di peta, dan di globe:</p>
          <MagLegend words={{ label: 'Warna magnitudo', magnitude: 'Magnitudo {range}', orMore: '{n} atau lebih', below: 'di bawah {n}', to: '{a} hingga {b}' }} />
          <Callout><p>Buka <Ui>Filter</Ui> di bagian bawah daftar untuk memilih rentang waktu dan mempersempit daftar. Lihat <Link href="/help/map">Peta dan filter</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="Daftar yang diurutkan dari yang terbaru, dengan lencana magnitudo, tempat, waktu, jarak, dan kedalaman" caption="Daftar, yang terbaru lebih dulu" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Detail gempa', sub: 'Setiap angka dijelaskan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Ketuk gempa mana saja untuk membuka detailnya:</p>
          <ul>
            <li><strong>Magnitudo</strong> dan jenisnya (misalnya <em>mww</em>, magnitudo momen yang dipakai untuk gempa yang lebih besar).</li>
            <li><strong>Kedalaman</strong>: seberapa jauh di bawah permukaan gempa itu bermula. Gempa dangkal biasanya terasa lebih kuat.</li>
            <li><strong>Tanggal dan waktu</strong> menurut zona waktu perangkat Anda.</li>
            <li><strong>Jarak</strong> dari Anda, dan <strong>negara</strong> (atau “Dekat” suatu negara untuk kejadian di lepas pantai).</li>
            <li><strong>Koordinat</strong> episentrum.</li>
            <li><strong>Status tinjauan</strong>: nilai <em>Otomatis</em> langsung berasal dari instrumen dan sering berubah dalam jam pertama; <em>Ditinjau</em> berarti seorang ahli seismologi telah memeriksanya.</li>
            <li><strong>Sumber</strong>: angka dari lembaga mana yang ditampilkan.</li>
          </ul>
          <p>Di bawah detail:</p>
          <ul>
            <li><Ui>Tampilkan wilayah</Ui> membuka peta jarak dekat di sekitar gempa dengan kejadian di sekitarnya dan, jika tersedia, peta guncangan yang dirasakan.</li>
            <li><Ui>Bagikan</Ui> membuka kartu berbagi (lihat <Link href="/help/share">Berbagi</Link>).</li>
            <li>Jika ada orang yang melaporkan merasakannya, Anda akan melihat jumlahnya.</li>
          </ul>
          <Callout kind="note"><p>Spanduk <strong>Peringatan tsunami dikeluarkan</strong> muncul jika lembaga menandai kemungkinan aktivitas tsunami. Ikuti peringatan tsunami resmi di daerah Anda.</p></Callout>
        </div>
        <Shot src="detail" alt="Detail gempa: magnitudo, kedalaman, tanggal, waktu, jarak, negara, koordinat, status tinjauan, sumber, Tampilkan wilayah dan Bagikan" caption="Detail sebuah gempa" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Peta dan filter', sub: 'Zoom, tampilan wilayah, filter',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tab <Ui>Peta</Ui> menampilkan gempa terbaru sebagai pin yang diwarnai menurut magnitudo, berpusat di bagian dunia tempat Anda berada.</p>
          <ul>
            <li><strong>Geser dan zoom</strong> dengan jari atau mouse, atau dengan tombol <Ui>+</Ui> dan <Ui>−</Ui>. Tombol ketiga mengembalikan tampilan.</li>
            <li><strong>Lokasi saya</strong> (tombol keempat) memperbesar ke tempat Anda berada sekarang. Pertama kali, sisma meminta akses ke lokasi Anda. Cincin di sekitar titik menandai posisi Anda jika tempat lain dipilih di <Ui>Saya</Ui>; pilihan itu tetap seperti semula.</li>
            <li>Jika Anda memperbesar cukup jauh, <strong>peta jalan</strong> dari OpenStreetMap perlahan muncul, sehingga Anda bisa melihat dengan tepat di mana suatu kejadian berlangsung.</li>
            <li><strong>Ketuk pin</strong> untuk melihat kartu ringkasan, lalu <Ui>Detail</Ui> untuk semua informasinya.</li>
          </ul>
        </div>
        <Shot src="map" alt="Peta dunia dengan pin gempa yang diwarnai menurut magnitudo" caption="Peta" />
      </div>
      <h3 id="region-view">Tampilan wilayah</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Tampilkan wilayah</Ui> pada sebuah gempa membuka tampilan dekat selebar sekitar 800 km di sekitarnya, dengan penanda berdenyut pada kejadian tersebut dan label pada gempa di sekitarnya. Ketuk <Ui>Kembali ke peta dunia</Ui> untuk kembali.</p>
          <p>Tampilan wilayah juga yang terbuka saat seseorang membuka tautan yang Anda bagikan.</p>
        </div>
        <Shot src="region" alt="Tampilan wilayah: tampilan dekat di sekitar gempa dengan penanda berdenyut dan kartu ringkasan" caption="Tampilan wilayah" />
      </div>
      <h3>Filter, lapisan, dan legenda</h3>
      <div className={s.pair}>
        <div>
          <p>Tarik ke atas panel <Ui>Filter</Ui> di bagian bawah Daftar, Peta, atau Globe. Ketuk sekali untuk membukanya setengah, sekali lagi untuk membukanya penuh, atau seret panelnya.</p>
          <ul>
            <li><strong>Rentang waktu</strong>: 24 jam, 7 hari, atau 30 hari. Satu tahun penuh memerlukan sisma+.</li>
            <li><strong>Magnitudo</strong> dan <strong>Wilayah</strong> (negara atau wilayah samudra) adalah filter sisma+, ditandai gembok pada paket gratis.</li>
            <li><strong>Tempat</strong>: hanya menampilkan gempa di dekat salah satu lokasi tersimpan Anda.</li>
            <li><Ui>Hapus filter</Ui> mengembalikan semuanya.</li>
          </ul>
          <p>Di bagian <strong>Lapisan</strong> Anda bisa menampilkan <strong>batas lempeng</strong> tektonik. Panel ini juga menampilkan legenda magnitudo.</p>
          <Callout><p>Memilih wilayah juga memperbesar peta ke wilayah itu dan memutar globe agar menghadapnya.</p></Callout>
        </div>
        <Shot src="filters" alt="Panel filter terbuka: rentang waktu, magnitudo, wilayah, dan tempat" caption="Panel filter" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: 'Globe 3D', sub: 'Putar, lihat kedalaman',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tab <Ui>Globe</Ui> menampilkan gempa yang sama pada Bumi 3D. Seret untuk memutarnya, dan cubit atau gulir untuk zoom. Ketuk pin untuk melihat ringkasannya. <Ui>Lokasi saya</Ui>, di bawah tombol <Ui>−</Ui>, memutar globe ke tempat Anda berada sekarang dan memperbesarnya (putaran berhenti agar Anda tetap terlihat).</p>
          <p>Di lapisan panel <Ui>Filter</Ui>:</p>
          <ul>
            <li><strong>Kedalaman</strong> mewarnai setiap gempa menurut kedalamannya dan menggambar garis ke bawah sampai titik awalnya, sehingga Anda bisa melihat gempa dalam di bawah zona subduksi.</li>
            <li><strong>Lempeng</strong> menampilkan batas lempeng.</li>
            <li><strong>Putar</strong> membuat globe berputar perlahan dengan sendirinya.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Globe 3D dengan pin gempa di sekitar Pasifik" caption="Globe" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Saya merasakannya', sub: 'Laporan dan peta guncangan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Jika Anda merasakan gempa, beri tahu sisma. Laporan membantu menunjukkan di mana guncangan terasa dan seberapa kuat.</p>
          <ol className={s.steps}>
            <li>Buka gempanya. Hingga <strong>6 jam</strong> setelah gempa terjadi, Anda akan melihat <Ui>Saya merasakannya</Ui>.</li>
            <li>Geser penggeser sesuai seberapa kuat guncangan terasa, dari <em>Tidak terasa</em> hingga <em>Ekstrem</em>. Lencana menunjukkan tingkat intensitas yang sesuai (MMI).</li>
            <li>Jika mau, tambahkan catatan, atau ketuk <Ui>Tambah detail</Ui> untuk menyebutkan di mana Anda berada, berapa lama guncangan berlangsung, apa yang bergerak, dan kerusakan apa pun.</li>
            <li>Ketuk <Ui>Kirim laporan</Ui>.</li>
          </ol>
          <p>Laporan Anda disimpan <strong>tanpa nama atau akun Anda</strong>, dan posisi Anda dibulatkan hingga sekitar 10 km.</p>
          <h3>Peta guncangan</h3>
          <p>Saat banyak orang membuka sisma tepat setelah gempa, lonjakan itu menunjukkan di mana gempa kemungkinan besar terasa. sisma mengubahnya menjadi <strong>peta guncangan</strong> anonim di tampilan wilayah. Posisi dikaburkan di perangkat Anda hingga 500 m, tidak membawa pengenal akun atau perangkat, dan hanya ditampilkan untuk area sekitar 10 km dengan setidaknya 3 orang. Anda bisa menonaktifkannya di <Ui>Saya</Ui> → <Ui>Bantu memetakan di mana gempa terasa</Ui>.</p>
        </div>
        <Shot src="felt" alt="Lembar Apa yang Anda rasakan? dengan penggeser intensitas, catatan opsional, dan Kirim laporan" caption="Melaporkan apa yang Anda rasakan" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Membagikan gempa', sub: 'Gambar, teks, dan teks alternatif',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Ketuk <Ui>Bagikan</Ui> pada sebuah gempa untuk membuat kartu berbagi: gambar berisi peta dan detail utamanya.</p>
          <ul>
            <li><strong>Teks postingan</strong> sudah diisikan untuk Anda (magnitudo, tempat, waktu, kedalaman, dan sebuah tagar, dengan tautan di akhir), dan Anda bisa mengeditnya.</li>
            <li><strong>Deskripsi gambar (teks alternatif)</strong> menjelaskan gambar bagi orang yang memakai pembaca layar. Teks ini sudah diisikan untuk Anda, dan Anda bisa mengeditnya.</li>
            <li><Ui>Bagikan gambar</Ui> membuka lembar berbagi ponsel Anda (di aplikasi Android dan di browser yang mendukungnya). Jika browser tidak bisa membagikan gambar, atau gambar tidak berhasil dibuat, <Ui>Bagikan tautan</Ui> membagikan teks postingan beserta tautannya. <Ui>Simpan gambar</Ui> mengunduh gambar, sedangkan <Ui>Salin teks</Ui> dan <Ui>Salin teks alternatif</Ui> menyalin masing-masing kolom.</li>
          </ul>
          <Callout><p>X, Facebook, dan Bluesky sering membuang teks yang menyertai gambar yang dibagikan, dan tidak satu pun menerima teks alternatif dengan cara ini. <strong>Bagikan gambar juga menyalin teksnya</strong>, sehingga Anda bisa menempelkannya ke postingan. Gunakan <Ui>Salin teks alternatif</Ui> lalu tempelkan ke kolom deskripsi gambar di aplikasi tersebut.</p></Callout>
        </div>
        <Shot src="share" alt="Lembar berbagi dengan pratinjau kartu berbagi, teks postingan yang bisa diedit, dan deskripsi gambar" caption="Lembar berbagi" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Akun Anda', sub: 'Masuk, kata sandi, penghapusan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Buka <Ui>Saya</Ui> lalu ketuk <Ui>Masuk</Ui>. Anda bisa memakai Google atau email dan kata sandi.</p>
          <h3>Membuat akun dengan email</h3>
          <ol className={s.steps}>
            <li>Ketuk <Ui>Buat akun</Ui> di bagian bawah lembar masuk.</li>
            <li>Masukkan email Anda dan kata sandi: minimal 8 karakter, berisi huruf dan angka.</li>
            <li>Buka email konfirmasi yang kami kirim dan ketuk tautannya. Setelah itu Anda sudah masuk.</li>
          </ol>
          <h3>Masuk dengan Google</h3>
          <p>Ketuk <Ui>Lanjutkan dengan Google</Ui>. Di aplikasi Android, pilih akun Google Anda dari daftar yang muncul. Jika email Google Anda sudah punya akun sisma, Google ditambahkan ke akun yang sama itu.</p>
        </div>
        <Shot src="signin" alt="Lembar masuk: Lanjutkan dengan Google, email dan kata sandi, Lupa kata sandi, dan Buat akun" caption="Masuk" />
      </div>

      <h3 id="password-reset">Lupa kata sandi? Atur ulang</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Di <Ui>Saya</Ui>, ketuk <Ui>Masuk</Ui> lalu ketik alamat email Anda.</li>
            <li>Ketuk <Ui>Lupa kata sandi?</Ui>. Anda akan melihat <em>Periksa email Anda</em>.</li>
            <li>Buka email tersebut dan ketuk tautannya. sisma terbuka dan meminta Anda untuk <em>Atur kata sandi baru</em>.</li>
            <li>Masukkan kata sandi baru dua kali lalu ketuk <Ui>Simpan</Ui>. Anda sudah masuk.</li>
          </ol>
          <Callout kind="note"><p>Demi privasi Anda, sisma selalu mengatakan tautan sudah dikirim, meskipun tidak ada akun yang memakai alamat itu. Jika tidak ada email yang masuk dalam beberapa menit, periksa folder spam dan pastikan Anda mengetik alamat yang Anda pakai saat mendaftar.</p></Callout>
        </div>
        <Shot src="forgot" alt="Periksa email Anda: kami mengirim tautan untuk mengatur ulang kata sandi" caption="Setelah mengetuk Lupa kata sandi?" />
      </div>

      <h3>Mengubah kata sandi, atau menambahkannya ke akun Google</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Di <Ui>Saya</Ui> → <Ui>Akun</Ui>, ketuk <Ui>Atur atau ubah kata sandi</Ui>.</li>
            <li>Masukkan kata sandi baru dua kali lalu ketuk <Ui>Simpan</Ui>.</li>
          </ol>
          <p>Jika Anda mendaftar dengan Google, langkah ini menambahkan kata sandi sehingga Anda juga bisa masuk dengan email. Jika sisma meminta Anda masuk lagi terlebih dahulu, itu adalah pemeriksaan keamanan: keluar, masuk kembali, lalu coba lagi.</p>
        </div>
        <Shot src="password" alt="Lembar Atur kata sandi baru dengan kolom kata sandi baru dan konfirmasi" caption="Mengatur kata sandi baru" />
      </div>

      <h3>Tugas akun lainnya</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Nama tampilan</strong>: <Ui>Saya</Ui> → <Ui>Nama tampilan</Ui>. Biarkan kosong untuk menampilkan email Anda.</li>
            <li><strong>Keluar</strong>: <Ui>Saya</Ui> → <Ui>Keluar</Ui>. Lokasi tersimpan Anda tetap ada di akun Anda.</li>
            <li><strong>Mengubah alamat email</strong>: belum bisa dilakukan di aplikasi. Kirim email ke <a href={`mailto:${MAIL}`}>{MAIL}</a> dari alamat Anda saat ini.</li>
          </ul>
        </div>
        <Shot src="me" alt="Bagian Akun di Saya: nama tampilan, email, kata sandi, keluar, bantuan dan dukungan, serta hapus akun" caption="Akun, di bagian bawah Saya" />
      </div>

      <h3 id="delete-account">Menghapus akun Anda</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Jika Anda punya sisma+, batalkan dulu (lihat <Link href="/help/plus#cancel">Membatalkan sisma+</Link>). sisma tidak akan menghapus akun yang langganannya masih diperpanjang.</li>
            <li>Di <Ui>Saya</Ui>, ketuk <Ui>Hapus akun</Ui>, lalu <Ui>Hapus permanen</Ui>.</li>
          </ol>
          <p>Ini menghapus akun, lokasi tersimpan, dan setelan peringatan Anda secara permanen. Laporan guncangan yang Anda kirim tetap disimpan tanpa nama Anda. Menghapus akun tidak menghapus aplikasi Android; copot pemasangannya secara terpisah jika Anda mau. <Link href="/privacy#delete">Kebijakan privasi</Link> kami menjelaskan apa yang terjadi pada data Anda.</p>
        </div>
        <Shot src="delete" alt="Lembar Hapus akun Anda? dengan Hapus permanen dan Batal" caption="Menghapus akun" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Lokasi tersimpan', sub: 'Tempat yang penting bagi Anda',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Lokasi tersimpan menentukan gempa mana yang “terdekat” dan tempat mana yang dipantau oleh peringatan Anda.</p>
          <ul>
            <li><strong>Lokasi saya</strong> memakai posisi perangkat Anda (browser atau ponsel Anda akan meminta izin terlebih dahulu).</li>
            <li><Ui>Tambah lokasi</Ui> memungkinkan Anda mencari kota dan menyimpannya.</li>
            <li>Ketuk sebuah lokasi untuk menjadikannya acuan jarak. Ketuk <Ui>×</Ui> untuk menghapusnya.</li>
            <li>Jika <strong>Lokasi saya</strong> dipilih, sisma memakai posisi Anda setiap kali perangkat bisa memberikannya. Jika tidak bisa (lokasi dimatikan atau tidak diizinkan), atau Anda memilih tempat tersimpan, sisma memakai tempat tersimpan itu: tempat default Anda, atau tempat pertama yang Anda simpan.</li>
          </ul>
          <p>Paket gratis punya <strong>1 lokasi tersimpan</strong>, dan sisma+ punya <strong>hingga 10</strong>. Tanpa akun, lokasi disimpan di perangkat ini dan dipindahkan ke akun Anda saat Anda masuk.</p>
        </div>
        <Shot src="addloc" alt="Lembar Tambah lokasi dengan kotak pencarian untuk kota" caption="Menambahkan lokasi" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Uji coba, penagihan, pembatalan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma gratis digunakan. sisma+ menambahkan:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Fitur</th><th>Gratis</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Daftar langsung, peta, globe, sains</td><td>✓</td><td>✓</td></tr>
                <tr><td>Riwayat gempa</td><td>30 hari</td><td>Riwayat lengkap</td></tr>
                <tr><td>Lokasi tersimpan</td><td>1</td><td>Hingga 10</td></tr>
                <tr><td>Notifikasi push dengan aturan Anda sendiri</td><td>–</td><td>Hingga 5 peringatan</td></tr>
                <tr><td>Filter magnitudo dan wilayah</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Harga: <strong>{usd(PRICES.yearly.usd)} per tahun</strong>, satu paket. Google Play menampilkan harga dalam mata uang lokal Anda. Pelanggan baru mendapat <strong>uji coba gratis {TRIAL_DAYS} hari</strong>, satu kali per akun.</p>
        </div>
        <Shot src="paywall" alt={`Lembar sisma+ dengan fitur, harga tahunan, dan Mulai uji coba gratis ${TRIAL_DAYS} hari`} caption="Memilih paket" />
      </div>

      <h3>Berlangganan</h3>
      <ul>
        <li><strong>Di situs web</strong>: <Ui>Saya</Ui> → <Ui>Mulai uji coba gratis {TRIAL_DAYS} hari</Ui> (atau <Ui>Berlangganan</Ui>), lalu bayar di halaman pembayaran aman Stripe. Jika Anda membuat akun terlebih dahulu, halaman pembayaran terbuka saat Anda mengetuk tautan di email konfirmasi. Saat Anda kembali, sisma menampilkan <em>Mengaktifkan sisma+…</em> selama beberapa detik, lalu <em>Selamat datang di sisma+</em>.</li>
        <li><strong>Di aplikasi Android</strong>: tombol yang sama membuka lembar pembayaran Google Play, tempat Anda bisa membayar dengan Google Pay, kartu, atau metode pembayaran Google Play lainnya.</li>
      </ul>
      <p>Anda harus sudah masuk. Langganan Anda kemudian berlaku di mana pun Anda masuk ke akun tersebut, di web maupun di aplikasi.</p>

      <h3>Mengelola atau mengganti paket</h3>
      <div className={s.pair}>
        <div>
          <p>Buka <Ui>Saya</Ui> → <Ui>Kelola langganan</Ui> untuk melihat status, paket, dan tanggal berikutnya.</p>
          <ul>
            <li><strong>Dibeli di situs web</strong>: <Ui>Kelola tagihan</Ui> membuka halaman Stripe, tempat Anda bisa memperbarui kartu, melihat faktur, atau membatalkan.</li>
            <li><strong>Dibeli di aplikasi Android</strong>: <Ui>Kelola di Google Play</Ui> membuka langganan Anda di Google Play.</li>
          </ul>
        </div>
        <Shot src="subscription" alt="Halaman langganan: status, paket, tanggal perpanjangan, dan Kelola di Google Play" caption="Langganan Anda" />
      </div>

      <h3 id="cancel">Membatalkan sisma+</h3>
      <ol className={s.steps}>
        <li>Buka <Ui>Saya</Ui> → <Ui>Kelola langganan</Ui>.</li>
        <li>Ketuk <Ui>Kelola tagihan</Ui> (situs web) atau <Ui>Kelola di Google Play</Ui> (aplikasi), lalu batalkan di sana. Di Google Play Anda juga bisa membuka <em>Pembayaran &amp; langganan → Langganan</em>.</li>
      </ol>
      <p>Anda tetap memiliki sisma+ sampai akhir periode yang sudah Anda bayar. Kartu di <Ui>Saya</Ui> kemudian menampilkan <em>Berakhir pada</em> beserta tanggalnya, dan setelah tanggal itu Anda kembali ke paket gratis. Membatalkan uji coba gratis sebelum berakhir berarti Anda tidak dikenai biaya.</p>
      <Callout kind="note"><p>Mencopot pemasangan aplikasi atau menghapus akun sisma Anda <strong>tidak</strong> membatalkan langganan Google Play. Batalkan langganan di Google Play.</p></Callout>

      <h3>Memulihkan pembelian</h3>
      <p>Di ponsel baru atau setelah memasang ulang aplikasi, masuk ke akun sisma yang sama. Jika sisma+ tidak muncul, buka lembar sisma+ lalu ketuk <Ui>Pulihkan pembelian</Ui>. Fitur ini hanya ada di aplikasi Android, dan mencari langganan Google Play di perangkat ini.</p>

      <h3>Pengembalian dana</h3>
      <p>Pembelian di Google Play mengikuti kebijakan pengembalian dana Google Play, jadi ajukan pengembalian dana melalui Google Play. Untuk pembelian di situs web, kirim email ke <a href={`mailto:${MAIL}`}>{MAIL}</a>. <Link href="/terms">Ketentuan layanan</Link> kami menjelaskan rinciannya.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Peringatan', sub: 'Notifikasi push yang sesuai untuk Anda',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Dengan sisma+, sisma mengirim notifikasi push saat sebuah gempa cocok dengan salah satu peringatan Anda.</p>
          <ol className={s.steps}>
            <li>Masuk dan pastikan Anda punya sisma+.</li>
            <li>Di <Ui>Saya</Ui>, aktifkan <Ui>Notifikasi push</Ui>, atau buka <Ui>Aturan peringatan</Ui> dan aktifkan <em>Peringatan gempa</em>.</li>
            <li>Di bagian <em>Kirim melalui</em>, ketuk <Ui>Aktifkan notifikasi di perangkat ini</Ui> dan izinkan notifikasi saat diminta.</li>
            <li>Ketuk <Ui>Tambah peringatan</Ui> lalu atur peringatannya (lihat di bawah). Anda bisa punya hingga 5.</li>
            <li>Ketuk <Ui>Kirim peringatan uji</Ui> untuk memastikan perangkat ini menerimanya.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Halaman peringatan dengan sakelar aktif/nonaktif, peringatan Anda (0 dari 5), Tambah peringatan, dan Kirim melalui" caption="Halaman peringatan" />
      </div>
      <h3>Mengatur peringatan</h3>
      <ul>
        <li><strong>Nama</strong>: misalnya <em>Dekat rumah</em>.</li>
        <li><strong>Magnitudo minimum</strong>: Anda mendapat peringatan untuk magnitudo ini dan yang lebih kuat.</li>
        <li><strong>Memantau</strong>: tempat tersimpan Anda dalam jarak yang Anda pilih (100, 250, 500, atau 1.000 km), atau di mana saja di dunia.</li>
        <li><strong>Lokasi lain</strong>: hingga 20 negara atau wilayah, di mana saja di dalamnya.</li>
        <li><strong>Jam tenang</strong>: tidak ada peringatan di malam hari, dengan pilihan untuk tetap meloloskan gempa kuat (magnitudo 6 atau lebih).</li>
        <li>Sebuah grafik menunjukkan berapa banyak gempa dalam 30 hari terakhir yang akan memicu peringatan itu, sehingga Anda bisa menyesuaikannya.</li>
      </ul>
      <p>Peringatan yang Anda terima dalam 30 hari terakhir tercantum di <em>Riwayat peringatan</em>.</p>
      <Callout kind="note"><p><strong>iPhone dan iPad:</strong> notifikasi web hanya berfungsi setelah Anda menambahkan sisma ke Layar Utama (Bagikan → Tambah ke Layar Utama) dan membukanya dari sana.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Setelan', sub: 'Bahasa, tema, satuan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Anda bisa menemukannya di <Ui>Saya</Ui>, di bawah lokasi Anda:</p>
          <ul>
            <li><strong>Bahasa</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français atau Deutsch. Anda juga bisa mengetuk tombol bahasa di bagian atas tab mana pun.</li>
            <li><strong>Tampilan</strong>: mengikuti perangkat Anda (Sistem), Terang, atau Gelap.</li>
            <li><strong>Satuan</strong>: kilometer atau mil.</li>
            <li><strong>Penanda peta</strong>: pin dengan magnitudo tertulis di dalamnya, atau lingkaran yang ukurannya sesuai magnitudo. Di sini juga Anda akan menemukan legenda warna.</li>
            <li><strong>Bantu memetakan di mana gempa terasa</strong>: mengaktifkan atau menonaktifkan berbagi anonim untuk peta guncangan (lihat <Link href="/help/felt">Saya merasakannya</Link>).</li>
            <li><strong>Tampilkan pengenalan</strong> memutar ulang langkah-langkah sambutan.</li>
          </ul>
          <p>Saat Anda masuk, bahasa dan tampilan pilihan Anda disimpan ke akun Anda.</p>
        </div>
        <Shot src="me_more" alt="Setelan: bahasa, tampilan, satuan, penanda peta, sakelar peta guncangan, pengenalan, dan sumber data" caption="Setelan di Saya" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Sains', sub: 'Cara gempa terjadi',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tab <Ui>Sains</Ui> berisi delapan panduan singkat bergambar, masing-masing dengan diagram animasi atau grafik langsung: tektonik lempeng, jenis sesar, gelombang seismik, magnitudo dan intensitas, kedalaman dan gempa susulan, tsunami, cara bersiap, dan Cincin Api, dengan peta langsung yang menunjukkan berapa banyak gempa terbaru yang terjadi di sekitar Pasifik.</p>
          <p>Ketuk tombol di bawah diagram untuk berganti tampilan, dan tombol jeda untuk menghentikan animasi. Panduan mengikuti bahasa Anda, seperti bagian lain aplikasi. Ketuk <Ui>Bagikan</Ui> di bagian atas panduan untuk mengirimkannya kepada seseorang, beserta gambarnya, ringkasan singkat, dan tautannya.</p>
          <p>Di bawah panduan, <Ui>Mendalam</Ui> berisi artikel yang lebih panjang untuk Anda yang ingin tahu lebih jauh: mengapa gempa tidak bisa diprediksi, tektonik lempeng dan subduksi, sesar dan tegangan, bagian dalam Bumi dan gelombang seismik, serta gempa susulan dan bahaya gempa. Setiap artikel mencantumkan sumbernya dan menjawab pertanyaan umum di bagian akhir. Artikel-artikel ini juga tersedia dalam bahasa Anda; daftar sumbernya tetap dalam bahasa Inggris.</p>
        </div>
        <Shot src="science" alt="Artikel gelombang seismik dengan diagram animasi gelombang P" caption="Sebuah panduan sains" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Pemecahan masalah', sub: 'Solusi untuk masalah umum',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Lokasi dan data</p>
        <Faq q="“Terdekat” kosong, atau lokasi saya tidak ditemukan">
          <p>sisma memerlukan izin untuk memakai lokasi Anda, atau sebuah lokasi tersimpan.</p>
          <ul>
            <li><strong>Browser</strong>: ketuk ikon di samping alamat web, atur <em>Lokasi</em> ke <em>Izinkan</em>, lalu muat ulang.</li>
            <li><strong>Aplikasi Android</strong>: Setelan → Aplikasi → sisma → Izin → Lokasi → <em>Izinkan hanya saat aplikasi digunakan</em>.</li>
            <li>Atau tambahkan tempat di <Ui>Saya</Ui> → <Ui>Tambah lokasi</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="Sebuah gempa tidak ada, atau magnitudonya berubah">
          <p>Lembaga pertama-tama menerbitkan angka otomatis, lalu merevisinya, biasanya dalam jam pertama. Magnitudo, kedalaman, dan tempat semuanya bisa berubah, dan beberapa kejadian kecil dihapus. Lembaga yang berbeda juga bisa melaporkan nilai yang sedikit berbeda; sisma menampilkan angka dari lembaga regional jika ada (JMA di Jepang, GeoNet di Selandia Baru), jika tidak, USGS, lalu EMSC. Gempa yang sangat kecil (di bawah sekitar magnitudo 2,5 di luar Jepang dan Selandia Baru) tidak disertakan.</p>
        </Faq>
        <Faq q="Waktunya tampak salah">
          <p>Waktu ditampilkan menurut zona waktu perangkat Anda. Periksa setelan tanggal, waktu, dan zona waktu perangkat Anda.</p>
        </Faq>
        <Faq q="Peta kosong saat saya memperbesar sangat dekat">
          <p>Peta tingkat jalan berasal dari OpenStreetMap dan memerlukan koneksi internet. Jika tidak termuat, perkecil sedikit; pin gempa tetap berfungsi.</p>
        </Faq>
        <Faq q="Aplikasi mengatakan saya sedang offline">
          <p>sisma memerlukan koneksi untuk memuat gempa. Periksa Wi-Fi atau data seluler, lalu buka kembali aplikasinya.</p>
        </Faq>

        <p className={s.faqGroup}>Masuk</p>
        <Faq q="“Email atau kata sandi salah”">
          <p>Periksa salah ketik, lalu gunakan <Link href="/help/account#password-reset">Lupa kata sandi?</Link>. Jika Anda membuat akun dengan Google, gunakan <Ui>Lanjutkan dengan Google</Ui>, atau tambahkan kata sandi di <Ui>Saya</Ui> → <Ui>Atur atau ubah kata sandi</Ui> saat masuk dengan Google.</p>
        </Faq>
        <Faq q="“Konfirmasi email Anda dulu”">
          <p>Buka email konfirmasi dari sisma dan ketuk tautannya, lalu masuk. Tidak menemukannya? Periksa folder spam. Jika masih tidak ada, kirim email ke <a href={`mailto:${MAIL}`}>{MAIL}</a> dari alamat tersebut.</p>
        </Faq>
        <Faq q="Email pengaturan ulang atau konfirmasi tidak sampai">
          <p>Tunggu beberapa menit dan periksa folder spam atau promosi. Pastikan Anda mengetik alamat yang Anda pakai saat mendaftar. Demi privasi Anda, sisma mengatakan sudah mengirim tautan pengaturan ulang meskipun tidak ada akun yang memakai alamat itu.</p>
        </Faq>
        <Faq q="Masuk dengan Google tidak berhasil">
          <p>Di aplikasi Android, pastikan Anda sudah masuk ke akun Google di ponsel (Setelan → Sandi &amp; akun) dan layanan Google Play sudah versi terbaru. Di web, izinkan pop-up dan masuk pihak ketiga untuk sisma.io. Anda selalu bisa masuk dengan email sebagai gantinya.</p>
        </Faq>
        <Faq q="“Demi keamanan, keluar lalu masuk lagi”">
          <p>Mengubah kata sandi memerlukan proses masuk yang baru saja dilakukan. Ketuk <Ui>Keluar</Ui>, masuk kembali, lalu ubah kata sandinya.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ dan penagihan</p>
        <Faq q="Saya sudah membayar, tetapi masih melihat paket gratis">
          <ul>
            <li>Tunggu sebentar, lalu tutup dan buka kembali sisma. Aktivasi biasanya langsung, tetapi bisa memakan waktu beberapa menit.</li>
            <li>Pastikan Anda masuk ke akun yang Anda pakai untuk berlangganan.</li>
            <li>Aplikasi Android: buka lembar sisma+ lalu ketuk <Ui>Pulihkan pembelian</Ui>.</li>
            <li>Masih tidak berhasil? Kirim email ke <a href={`mailto:${MAIL}`}>{MAIL}</a> dengan email akun Anda dan, untuk Google Play, nomor pesanan (GPA.…) dari tanda terima Anda.</li>
          </ul>
        </Faq>
        <Faq q="“Langganan Google Play ini milik akun sisma lain”">
          <p>Langganan di ponsel ini dibeli saat masuk ke akun sisma yang berbeda. Keluar, lalu masuk ke akun tersebut.</p>
        </Faq>
        <Faq q="Tidak ada tawaran uji coba gratis">
          <p>Uji coba diperuntukkan bagi akun yang belum pernah berlangganan. Di aplikasi Android, Google Play juga hanya mengizinkan satu uji coba per akun Google, meskipun di akun sisma yang berbeda.</p>
        </Faq>
        <Faq q="“Langganan di aplikasi belum tersedia” atau “Penagihan Google Play tidak tersedia di perangkat ini”">
          <p>Perbarui sisma dan aplikasi Google Play Store, dan pastikan Anda sudah masuk ke Google Play. Beberapa perangkat tanpa Google Play tidak bisa membeli di aplikasi. Berlanggananlah di <a href="https://sisma.io/app/me">sisma.io</a> sebagai gantinya, lalu masuk ke akun yang sama di aplikasi.</p>
        </Faq>
        <Faq q="Saya tidak bisa menghapus akun">
          <p>Batalkan sisma+ terlebih dahulu. Setelah diatur untuk berakhir, Anda bisa menghapus akun. Lihat <Link href="/help/account#delete-account">Menghapus akun Anda</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Peringatan dan notifikasi</p>
        <Faq q="Saya tidak menerima peringatan">
          <ol>
            <li>Pastikan Anda punya sisma+ dan sudah masuk.</li>
            <li>Di <Ui>Saya</Ui> → <Ui>Aturan peringatan</Ui>, pastikan peringatan aktif dan setidaknya satu peringatan aktif serta memiliki tempat atau area.</li>
            <li>Di bagian <em>Kirim melalui</em>, pastikan perangkat ini diaktifkan, lalu ketuk <Ui>Kirim peringatan uji</Ui>.</li>
            <li>Android: Setelan → Aplikasi → sisma → Notifikasi harus diizinkan. Setelan penghemat baterai bisa menunda notifikasi; atur penggunaan baterai sisma ke <em>Tidak dibatasi</em>.</li>
            <li>Browser: notifikasi harus diizinkan untuk sisma.io. Di iPhone dan iPad, buka sisma dari Layar Utama.</li>
            <li>Jam tenang menahan peringatan di malam hari, kecuali Anda meloloskan gempa kuat.</li>
          </ol>
        </Faq>
        <Faq q="Saya menerima terlalu banyak peringatan">
          <p>Naikkan magnitudo minimum, kurangi jaraknya, hapus wilayah yang luas, atau atur jam tenang. Grafik 30 hari di setiap peringatan menunjukkan seberapa sering peringatan itu akan terpicu.</p>
        </Faq>

        <p className={s.faqGroup}>Berbagi dan laporan</p>
        <Faq q="Tidak ada tombol “Bagikan gambar”">
          <p>Browser Anda tidak bisa membagikan file. Gunakan <Ui>Simpan gambar</Ui> dan <Ui>Salin teks</Ui>, lalu posting sendiri. Di aplikasi Android, perbarui sisma untuk mendapatkan lembar berbagi sistem.</p>
        </Faq>
        <Faq q="Teksnya tidak muncul di postingan saya">
          <p>Banyak aplikasi membuang teks yang dibagikan bersama gambar. sisma sudah menyalinnya saat Anda mengetuk <Ui>Bagikan gambar</Ui>, jadi tempelkan saja ke postingan.</p>
        </Faq>
        <Faq q="Tidak ada tombol “Saya merasakannya”">
          <p>Laporan dibuka selama 6 jam setelah gempa. Setelah itu tombolnya menghilang.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Hubungi dukungan', sub: 'Masih buntu? Kirimi kami pesan',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Masih butuh bantuan?</strong> Kirimi kami pesan dan sertakan email akun Anda, perangkat dan versi browser atau aplikasi Anda, serta apa yang sudah Anda coba. Tangkapan layar akan membantu.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Jangan kirimkan kata sandi atau nomor kartu lengkap. Kami tidak akan pernah memintanya.</p>
      </>
    ),
  },
];
