# BOUQUETIEN

Web katalog produk bouquet dengan:

- Katalog publik
- Login admin via Firebase Authentication
- Database produk di Firestore
- Upload foto produk ke Cloudinary
- Tombol pesan langsung ke WhatsApp
- Pengaturan admin untuk nama brand, foto tampilan web, nomor WhatsApp, dan link sosial media

## Setup

1. Buat project Firebase, aktifkan Authentication metode Email/Password, lalu buat akun admin.
2. Buat database Firestore.
3. Buat unsigned upload preset di Cloudinary.
4. Edit `app.js`:
   - isi `firebaseConfig`
   - isi `cloudinaryConfig.cloudName`
   - isi `cloudinaryConfig.uploadPreset`

Setelah login admin, buka panel admin untuk mengisi:

- nama brand
- teks tampilan utama
- foto kiri, tengah, kanan
- nomor WhatsApp, satu nomor per baris
- link Instagram, TikTok, dan YouTube

Email admin yang dipakai aplikasi:

```txt
rikokulu64@gmail.com
tien@bedz.com
```

## Struktur Firestore

- `products/{productId}` untuk katalog produk
- `categories/{categoryId}` untuk daftar kategori katalog
- `site/settings` untuk pengaturan tampilan web

## Firestore Rules Contoh

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email in ["rikokulu64@gmail.com", "tien@bedz.com"];
    }

    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /site/settings {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}
```

## Jalankan

Buka `index.html` langsung di browser, atau jalankan server static lokal.
