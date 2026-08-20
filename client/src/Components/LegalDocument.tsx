type LegalDocumentType = 'terms' | 'privacy';

export default function LegalDocument({ type }: { type: LegalDocumentType }) {
    if (type === 'privacy') {
        return (
            <div className="legal-document">
                <p className="legal-document__lead">
                    Kebijakan Privasi ini menjelaskan bagaimana Tales Hero Indonesia mengumpulkan,
                    menggunakan, dan melindungi informasi saat kamu menggunakan website dan layanan kami.
                </p>

                <h2>1. Informasi yang Kami Kumpulkan</h2>
                <p>Kami dapat menerima informasi berikut saat kamu membuat atau menggunakan akun:</p>
                <ul>
                    <li>Username dan alamat email pemulihan.</li>
                    <li>Password dalam bentuk hash, bukan password asli.</li>
                    <li>Pertanyaan dan jawaban keamanan untuk pemulihan akun.</li>
                    <li>Alamat IP, informasi perangkat, serta catatan aktivitas keamanan yang diperlukan untuk mencegah penyalahgunaan.</li>
                </ul>

                <h2>2. Cara Kami Menggunakan Informasi</h2>
                <p>Informasi tersebut digunakan untuk membuat dan mengamankan akun, mengirim email verifikasi atau pemulihan, memproses permintaan akun, mencegah spam, dan meningkatkan layanan.</p>

                <h2>3. Layanan Pihak Ketiga</h2>
                <p>Kami dapat menggunakan penyedia layanan untuk mendukung operasional, termasuk penyedia email, perlindungan bot, database, dan hosting. Penyedia tersebut hanya menerima data yang diperlukan untuk menjalankan fungsi terkait sesuai kebijakan mereka.</p>

                <h2>4. Penyimpanan dan Keamanan</h2>
                <p>Kami menerapkan kontrol akses, session cookie HttpOnly, hashing, rate limit, dan langkah keamanan teknis lain yang wajar. Tidak ada sistem online yang dapat dijamin 100% aman, sehingga kami tidak dapat menjamin keamanan mutlak.</p>

                <h2>5. Cookie dan Session</h2>
                <p>Website menggunakan cookie session yang diperlukan untuk login dan fitur akun. Cookie tersebut tidak dimaksudkan untuk menyimpan password.</p>

                <h2>6. Hak dan Permintaan Data</h2>
                <p>Untuk meminta koreksi atau penghapusan data yang berkaitan dengan akunmu, hubungi support kami. Kami dapat meminta verifikasi kepemilikan akun sebelum memproses permintaan.</p>

                <h2>7. Perubahan Kebijakan</h2>
                <p>Kebijakan ini dapat diperbarui saat fitur atau kebutuhan hukum berubah. Versi terbaru akan dipublikasikan di halaman ini.</p>

                <h2>8. Kontak</h2>
                <p>Untuk pertanyaan privasi, hubungi <a href="mailto:support@taleshero.web.id">support@taleshero.web.id</a>.</p>
            </div>
        );
    }

    return (
        <div className="legal-document">
            <p className="legal-document__lead">
                Dengan membuat akun atau menggunakan layanan Tales Hero Indonesia, kamu menyetujui
                ketentuan berikut. Jika tidak menyetujui, jangan lanjutkan pendaftaran.
            </p>

            <h2>1. Tentang Layanan</h2>
            <p>Tales Hero Indonesia menyediakan website, informasi game, fitur akun, registrasi hero, pemulihan akun, dan layanan pendukung lainnya. Sebagian fitur membutuhkan layanan game atau layanan pihak ketiga agar dapat berfungsi.</p>

            <h2>2. Akun Pengguna</h2>
            <p>Kamu wajib memberikan informasi yang benar, menggunakan email aktif milikmu, dan menjaga keamanan password serta akun. Satu alamat email hanya dapat digunakan untuk satu akun website sesuai kebijakan pendaftaran.</p>

            <h2>3. Verifikasi Email</h2>
            <p>Pendaftaran disimpan sebagai pending registration sampai email berhasil diverifikasi. Link verifikasi bersifat sekali pakai dan memiliki masa berlaku terbatas. Akun game tidak dibuat sebelum proses verifikasi selesai.</p>

            <h2>4. Penggunaan yang Dilarang</h2>
            <ul>
                <li>Menggunakan layanan untuk spam, penipuan, scraping berlebihan, atau aktivitas ilegal.</li>
                <li>Mencoba mengakses akun, data, endpoint, atau sistem milik orang lain tanpa izin.</li>
                <li>Mengirim konten berbahaya atau melakukan tindakan yang mengganggu keamanan dan ketersediaan layanan.</li>
                <li>Menggunakan identitas atau email orang lain untuk membuat akun.</li>
            </ul>

            <h2>5. Konten dan Ketersediaan</h2>
            <p>Informasi, jadwal, fitur, dan konten game dapat berubah tanpa pemberitahuan. Kami berusaha menjaga layanan tetap tersedia, tetapi tidak menjamin website atau seluruh fitur selalu bebas gangguan.</p>

            <h2>6. Penangguhan Akun</h2>
            <p>Kami dapat membatasi atau menangguhkan akses jika terdapat pelanggaran ketentuan, indikasi penyalahgunaan, atau risiko keamanan. Penindakan dilakukan secara proporsional untuk melindungi pengguna dan layanan.</p>

            <h2>7. Perubahan Ketentuan</h2>
            <p>Ketentuan ini dapat diperbarui ketika layanan berkembang. Penggunaan layanan setelah perubahan dipublikasikan berarti kamu menerima versi terbaru.</p>

            <h2>8. Kontak</h2>
            <p>Jika ada pertanyaan tentang ketentuan ini, hubungi <a href="mailto:support@taleshero.web.id">support@taleshero.web.id</a>.</p>
        </div>
    );
}