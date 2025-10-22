-----

# LACAK (Label Asli Chain Autentikasi Keamanan)

**Submission untuk Infinity Hackathon OJK - Ekraf 2025**

[![Infinity Hackathon](https://img.shields.io/badge/OJK%20Ekraf-Infinity%20Hackathon%202025-blue)](https://infinityhackathon.id/hackathon/OJKRAF)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LACAK adalah sistem label anti-pemalsuan sekali-pakai yang dirancang untuk mengatasi masalah pemalsuan produk di Indonesia. Solusi ini menggunakan arsitektur hibrida yang praktis untuk memberikan verifikasi instan berbiaya rendah, sekaligus jejak audit *immutable* (tidak dapat diubah) berbasis blockchain.

---
## Tim Kami
  - **Arief Abdul Rahman**
  - **Naufal Ghifari A.**
  - **Insan Anshary Rasul**
  - **Rafif Muhammad Farras**

## Daftar Isi

- [Masalah](#-masalah)
- [Solusi Kami](#-solusi-kami-arsitektur-hibrida)
- [Fitur Utama (MVP)](#-fitur-utama-mvp)
- [Alur Teknis](#-alur-teknis)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Menjalankan Secara Lokal](#-menjalankan-secara-lokal)
- [Tim Kami](#-tim-kami)

##  Masalah

Pemalsuan produk adalah masalah masif di Indonesia, merugikan ekonomi hingga **Rp 291 Triliun** pada tahun 2020 dan mengancam keselamatan konsumen, terutama di sektor kosmetik dan farmasi.

Solusi saat ini seperti stiker hologram dan QR code statis telah gagal karena **sangat mudah diduplikasi (di-kloning)**. Pemalsu dapat dengan mudah menyalin satu QR code asli dan menempelkannya ke ribuan produk palsu, sehingga sistem verifikasi standar akan tetap meloloskannya sebagai "produk asli".

## Solusi Kami: Arsitektur Hibrida

LACAK memecahkan masalah duplikasi ini dengan **Arsitektur Hibrida Dua Lapis** yang memisahkan validasi *real-time* dari audit *immutable*.

### Lapis 1: Aktivasi Sekali Pakai (Off-Chain)

Verifikasi inti terjadi di server terpusat yang cepat dan murah. Setiap produk memiliki kode rahasia unik (S) yang tersembunyi di balik label gosok (*scratch-off*) atau di dalam tag NFC.

1.  **Registrasi:** Produsen mendaftarkan produk. Server menyimpan `hash(S)` (menggunakan SHA-256), bukan kode rahasia (S) itu sendiri.
2.  **Verifikasi:** Konsumen membeli produk, menggosok label, dan memindai QR untuk memasukkan kode rahasia (S).
3.  **Hash-Lock:** Server menghitung `hash(S)` dari input konsumen.
4.  **Validasi:** Server mengecek dua hal:
    * Apakah `hash(S)` ada di database?
    * Apakah statusnya `spent == false`?
5.  **Penguncian:** Jika keduanya benar, server mengembalikan respons "ASLI" dan **langsung mengubah status menjadi `spent = true`**.

Jika pemalsu menyalin kode QR dan mencoba memverifikasi produk kloningan, server akan melihat status `spent == true` dan otomatis mengembalikan respons "PALSU (Kode Sudah Diaktivasi)".

### Lapis 2: Jejak Audit (On-Chain)

Untuk mematuhi regulator (OJK, BPOM) dan memberikan bukti integritas jangka panjang, kami menggunakan blockchain sebagai "Notaris Digital".

-   **Bukan Per Transaksi:** Kami *tidak* mencatat setiap verifikasi di blockchain karena mahal dan lambat.
-   **Merkle Root Anchoring:** Setiap hari, server mengumpulkan semua log aktivasi (`{productId, timestamp, hash(S)}`), membangun *Merkle Tree* dari log tersebut, dan menyimpan **satu Merkle Root** ke blockchain (misalnya L2 seperti Polygon/Arbitrum).
-   **Hasil:** Biaya *gas fee* sangat rendah (hanya 1 transaksi per hari), namun kami mendapatkan jejak audit yang *tamper-evident* (terbukti tidak dapat diubah) untuk penyelesaian sengketa.

## Fitur Utama (MVP)

Kode dalam repositori ini mencakup fitur-fitur MVP berikut:

1.  **Halaman Verifikasi Konsumen (`/verify`)**: Halaman publik tempat konsumen dapat memasukkan kode rahasia (S) dari label produk untuk mendapatkan hasil verifikasi instan (ASLI, PALSU, atau SUDAH DIAKTIVASI).
2.  **Dashboard Admin (`/admin`)**: Portal khusus untuk Klien (Brand/Produsen) untuk:
    * **Manajemen Produk**: Mendaftarkan produk baru dan men-generate kode unik.
    * **Melihat Kode Produk**: Melihat daftar produk dan kode rahasia (S) serta statusnya (`spent`).
    * **Melihat Log Audit**: Memantau riwayat aktivitas verifikasi.
3.  **API Verifikasi (`/api/verify`)**: Endpoint API inti yang menjalankan logika *hash-lock* secara aman di sisi server.
4.  **Layanan Latar Belakang**: (Dalam pengembangan) Layanan untuk membuat *Merkle Tree* dan melakukan *anchoring* ke *testnet*.

## Alur Teknis

\`\`\`mermaid
sequenceDiagram
    participant K as Konsumen
    participant F as Frontend (Next.js)
    participant B as Backend (API)
    participant DB as Database (Postgres/JSON)
    participant BC as Blockchain (L2)

    K->>F: 1. Kunjungi /verify, masukkan Kode (S)
    F->>B: 2. POST /api/verify { code: S }
    B->>DB: 3. Cari HASH(S) dan status 'spent'
    alt Kode Valid DAN spent == false
        DB-->>B: 4a. Ditemukan, spent=false
        B->>DB: 5a. UPDATE status SET spent=true
        B-->>F: 6a. { status: "ASLI" }
        K-->>F: 7a. Tampilkan "Produk Asli"
    else Kode Valid TAPI spent == true
        DB-->>B: 4b. Ditemukan, spent=true
        B-->>F: 6b. { status: "DUPLIKAT" }
        K-->>F: 7b. Tampilkan "PALSU (Kode Sudah Diaktivasi)"
    else Kode Tidak Valid
        DB-->>B: 4c. Tidak Ditemukan
        B-->>F: 6c. { status: "INVALID" }
        K-->>F: 7c. Tampilkan "PALSU (Kode Tidak Dikenali)"
    end

    loop Setiap 24 Jam
        B->>DB: 8. Ambil semua log aktivasi harian
        B->>B: 9. Buat Merkle Tree
        B->>BC: 10. Simpan Merkle Root
    end
\`\`\``

## Tech Stack

  - **Framework:** Next.js 14 (App Router)
  - **Bahasa:** TypeScript
  - **UI:** Shadcn/ui, Tailwind CSS
  - **Kriptografi:** `node:crypto` (SHA-256)
  - **Database (Simulasi):** File JSON lokal (untuk MVP Hackathon), dapat diganti dengan Postgres/MongoDB.
  - **Blockchain (Target):** Ethers.js (untuk koneksi ke L2 Testnet seperti Sepolia/Amoy).

## Struktur Proyek

\`\`\`
/
├── app/
│   ├── admin/                # Halaman Dashboard Admin (Protected)
│   ├── api/
│   │   ├── admin/            # API untuk Dashboard (CRUD Produk)
│   │   └── verify/           # API Verifikasi (Publik)
│   ├── verify/               # Halaman Verifikasi Konsumen (Publik)
│   └── page.tsx              # Homepage
├── components/
│   ├── admin-*.tsx           # Komponen UI untuk Dashboard Admin
│   └── ui/                   # Komponen dari Shadcn/ui
├── data/
│   ├── products.json         # Simulasi database produk
│   └── audit-log.json      # Simulasi log verifikasi
├── lib/
│   ├── services/
│   │   ├── verification-service.ts # Logika inti verifikasi (Hash-Lock)
│   │   ├── product-service.ts      # Logika CRUD Produk
│   │   └── blockchain-service.ts   # Logika Merkle Tree & Anchoring
│   └── utils/
│       ├── hash.ts           # Fungsi helper SHA-256
│       └── file-storage.ts   # Helper untuk baca/tulis DB JSON
└── public/
\`\`\`

## Menjalankan Secara Lokal

1.  **Clone repositori:**

    \`\`\`bash
    git clone [https://github.com/nghifaria/hackathon-lacak.git](https://github.com/nghifaria/hackathon-lacak.git)
    cd hackathon-lacak
    \`\`\`

2.  **Install dependencies (menggunakan `pnpm`):**

    \`\`\`bash
    pnpm install
    \`\`\`

3.  **Jalankan development server:**

    \`\`\`bash
    pnpm dev
    \`\`\`

4.  Buka `http://localhost:3000` di browser Anda.

      - Halaman Verifikasi: `http://localhost:3000/verify`
      - Dashboard Admin: `http://localhost:3000/admin`


<!-- end list -->

\`\`\`
\`\`\`
