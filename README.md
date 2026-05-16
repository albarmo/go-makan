# Titip Makan 🍱

Aplikasi web full-stack untuk nitip beli makan siang ke rekan kerja di kantor.

## Tech Stack

- **Framework**: SolidStart 2.0 (SSR)
- **Styling**: Tailwind CSS v3
- **Database**: NeonDB PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Language**: TypeScript

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database (NeonDB)

1. Buat akun di [neon.tech](https://neon.tech)
2. Buat project baru
3. Copy connection string dari dashboard

### 3. Environment Variables

```bash
cp .env.example .env
# Edit .env dan isi DATABASE_URL
```

```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Push Schema ke Database

```bash
npm run db:push
```

### 5. Seed Data Awal

```bash
npm run db:seed
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Database Commands

| Command | Keterangan |
|---------|------------|
| `npm run db:push` | Push schema ke DB (development) |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Jalankan migrations |
| `npm run db:seed` | Isi data awal (3 toko, 18 menu) |
| `npm run db:studio` | Buka Drizzle Studio (DB browser) |

---

## Fitur

### Yang Nitip (Pemesan)
- Pilih role & isi nama (disimpan di localStorage)
- Pilih toko aktif
- Lihat menu per toko, atur quantity & catatan per item
- Submit order
- Lihat riwayat order hari ini
- Batalkan order (selama belum dibeli)

### Yang Belikan (Pembeli)
- Lihat semua order hari ini, dikelompokkan per toko
- Filter berdasarkan status (Menunggu / Sudah Dibeli / Batal)
- Tandai order "Sudah Dibeli"
- Batalkan order jika item tidak tersedia
- **Rekap Belanja**: per toko → per menu → detail per pemesan
- **Tagihan**: total tagihan per pemesan dengan detail item

---

## Struktur Project

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts     # Drizzle schema (stores, menus, orders, order_items)
│   │   └── index.ts      # DB client (NeonDB HTTP driver)
│   ├── utils.ts          # formatRupiah, formatDate, statusLabel, dll
│   └── user-context.tsx  # Role & nama disimpan di localStorage
├── server/
│   ├── stores.ts         # Server functions: getStores, createStore, updateStore, toggle
│   ├── menus.ts          # Server functions: getMenus, createMenu, updateMenu, toggle
│   └── orders.ts         # Server functions: createOrder, cancelOrder, markPurchased, recap, settlement
├── components/
│   ├── Layout.tsx        # Layout wrapper dengan header & bottom nav
│   ├── Header.tsx        # Header sticky dengan back button & user info
│   ├── BottomNav.tsx     # Bottom navigation berbeda untuk pemesan & pembeli
│   ├── RoleGuard.tsx     # Guard redirect ke /role jika belum set role
│   └── icons.tsx         # SVG icons inline
└── routes/
    ├── role.tsx          # Pilih role & nama
    ├── index.tsx         # Home dashboard
    ├── stores/           # CRUD toko
    ├── menus/            # CRUD menu
    ├── orders/           # Buat & detail order
    ├── my-orders.tsx     # Pesanan saya hari ini
    └── buyer/            # Fitur pembeli
        ├── orders.tsx    # Semua order hari ini
        ├── recap.tsx     # Rekap belanja per toko
        └── settlement.tsx # Tagihan per pemesan
```

---

## Routes

| Route | Keterangan |
|-------|------------|
| `/role` | Pilih role (Yang Nitip / Yang Belikan) |
| `/` | Dashboard beranda |
| `/stores` | Daftar & kelola toko |
| `/stores/new` | Tambah toko baru |
| `/stores/[id]/edit` | Edit toko |
| `/menus` | Daftar & kelola menu |
| `/menus/new` | Tambah menu baru |
| `/menus/[id]/edit` | Edit menu |
| `/orders/new` | Buat order baru (pemesan) |
| `/orders/[id]` | Detail order |
| `/my-orders` | Pesananku hari ini (pemesan) |
| `/buyer/orders` | Semua order hari ini (pembeli) |
| `/buyer/recap` | Rekap belanja per toko (pembeli) |
| `/buyer/settlement` | Tagihan per pemesan (pembeli) |

---

## Status Order

| Status | Label UI | Keterangan |
|--------|----------|------------|
| `submitted` | Menunggu Dibeli | Order diterima, belum dibeli |
| `purchased` | Sudah Dibeli | Pembeli sudah membelikan |
| `cancelled` | Dibatalkan | Order dibatalkan |
