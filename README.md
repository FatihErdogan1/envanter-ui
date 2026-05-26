# envanter-ui

> React + TypeScript + Vite ile geliştirilmiş, retro terminal estetiğine sahip tam özellikli envanter yönetim sistemi arayüzü.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/license-private-lightgrey?style=flat-square)

---

## Özellikler

- **Kimlik Doğrulama** — JWT tabanlı giriş, şifre sıfırlama maili, zorunlu şifre değiştirme akışı
- **İki Ayrı Portal** — Admin/Manager/Staff için ana portal; tedarikçiler için ayrı `/supplier` portalı
- **Ürün & Stok Yönetimi** — Ürün ekleme/düzenleme, sayfalı listeleme, SKU takibi, depo bazlı stok özeti
- **Demirbaş Takibi** — Zimmet, iade, bakım ve hurdaya ayırma; atama ve bakım geçmişi
- **Stok Hareketleri** — Giriş / Çıkış / Depo transfer işlemleri, sayfalı işlem geçmişi
- **Sipariş Yönetimi** — Tedarikçi bazlı sipariş oluşturma, durum filtresi; BEKLIYOR → ONAYLANDI → YOLDA → TESLİM ALINDI akışı
- **Stok Talep Sistemi** — STAFF stok talebi oluşturabilir, MANAGER/ADMIN talepleri onaylayabilir veya reddedebilir
- **Tedarikçi Portalı** — Tedarikçi kullanıcılar kendi ürünlerini listeler, fiyat günceller, siparişlerini yönetir ve işlem geçmişini görür
- **Bildirim Sistemi** — Gerçek zamanlı okunmamış bildirim sayacı, bildirim paneli (sipariş, stok talebi, kritik stok)
- **Depo & Kategori Yönetimi** — Çoklu depo, depo bazlı stok listesi, kategori CRUD
- **Tedarikçi Yönetimi** — Tedarikçi bilgileri (ad, e-posta, telefon, adres), ürün ilişkilendirme
- **Kullanıcı Yönetimi** — Kullanıcı oluşturma, rol/depo/tedarikçi atama, şifre sıfırlama, aktif/pasif durumu (yalnızca ADMIN)
- **Dashboard** — Role göre filtrelenmiş envanter ve demirbaş istatistikleri

---

## Gereksinimler

| Gereksinim | Versiyon |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Backend API | `http://localhost:8080/api` adresinde çalışıyor olmalı |

> Backend için [envanter-api](https://github.com/FatihErdogan1/envanter-api) Spring Boot projesi gereklidir. Arayüz, API'ye JWT Bearer token ile bağlanır.

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç.

### Diğer Komutlar

```bash
# Production build
npm run build

# Build önizlemesi
npm run preview

# Lint
npm run lint
```

---

## Teknoloji Yığını

| Paket | Versiyon | Amaç |
|---|---|---|
| React | 18 | UI bileşen katmanı |
| TypeScript | 5.6 | Tip güvenliği |
| Vite | 5 | Geliştirme sunucusu ve build aracı |
| TailwindCSS | 3 | Stil (retro/cyberpunk tema) |
| TanStack Query | 5 | Sunucu durum yönetimi ve önbellekleme |
| Axios | 1.15 | HTTP istemcisi (JWT interceptor ile) |
| React Router DOM | v6 | Sayfa yönlendirme |
| Zustand | 5 | İstemci durum yönetimi |
| Lucide React | — | İkonlar |

---

## Proje Yapısı

```
src/
├── api/
│   ├── client.ts          # Axios istemcisi, JWT interceptor, 401 otomatik çıkış
│   └── index.ts           # Tüm API çağrıları (auth, CRUD, bildirimler, tedarikçi portali)
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Admin/Manager/Staff ana şablonu
│   │   ├── Sidebar.tsx        # Yan menü + bildirim çanı
│   │   ├── SupplierLayout.tsx # Tedarikçi portal şablonu
│   │   └── SupplierSidebar.tsx
│   └── ui/                # Button, Modal, DataTable, Input, OrderStatusBadge vb.
├── context/
│   ├── AuthContext.ts     # AuthUser arayüzü ve context tanımı
│   └── AuthProvider.tsx   # JWT parse, localStorage kalıcılığı
├── hooks/
│   └── useAuth.ts         # isAdmin, isManager, isStaff, isSupplier, canManageOperations
├── pages/
│   ├── DashboardPage.tsx
│   ├── ProductsPage.tsx
│   ├── AssetsPage.tsx
│   ├── InventoryPage.tsx
│   ├── OrdersPage.tsx         # Tedarikçi sipariş yönetimi (admin/manager görünümü)
│   ├── SuppliersPage.tsx
│   ├── WarehousesPage.tsx
│   ├── CategoriesPage.tsx
│   ├── UsersPage.tsx
│   ├── ProfilePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ChangePasswordPage.tsx
│   └── supplier/
│       ├── SupplierProductsPage.tsx    # Tedarikçi: ürün listesi + fiyat güncelleme
│       ├── SupplierOrdersPage.tsx      # Tedarikçi: kendi siparişleri + onayla/reddet/yola çıkar
│       └── SupplierTransactionsPage.tsx # Tedarikçi: stok işlem geçmişi
├── types/
│   └── index.ts           # Tüm TypeScript tip tanımları
└── utils/
    └── errorUtils.ts      # API hata mesajı çıkarma yardımcısı
```

---

## Rol Yetkileri

| Özellik | ADMIN | MANAGER | STAFF | SUPPLIER |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | — | — |
| Ürün görüntüleme | ✓ | ✓ | ✓ | — |
| Ürün ekleme / düzenleme | ✓ | ✓ | — | — |
| Demirbaş işlemleri | ✓ | ✓ | Görüntüle | — |
| Stok hareketleri | ✓ | ✓ | Görüntüle | — |
| Depo / Kategori yönetimi | ✓ | ✓ | — | — |
| Tedarikçi yönetimi | ✓ | ✓ | — | — |
| Sipariş oluşturma | ✓ | ✓ | — | — |
| Sipariş onaylama / reddetme | ✓ | — | — | — |
| Sipariş teslim alma | ✓ | ✓ | — | — |
| Kullanıcı yönetimi | ✓ | — | — | — |
| Kendi ürünlerini görme | — | — | — | ✓ |
| Ürün fiyatı güncelleme | — | — | — | ✓ |
| Kendi siparişlerini yönetme | — | — | — | ✓ |

> ADMIN tüm depolara erişebilir. MANAGER ve STAFF yalnızca kendi depolarındaki verileri görür. SUPPLIER kullanıcılar yalnızca `/supplier` portalına yönlendirilir.

---

## Sipariş Durum Makinesi

```
BEKLIYOR ──[ADMIN onaylar]──→ ONAYLANDI ──[SUPPLIER yola çıkarır]──→ YOLDA ──[ADMIN/MANAGER teslim alır]──→ TESLİM_ALINDI
    └──[ADMIN reddeder]──→ REDDEDILDI
```

Teslim alındığında stok otomatik olarak hedef depoya eklenir.

---

## Tedarikçi Portalı

SUPPLIER rolüyle giriş yapan kullanıcılar `/supplier` altındaki özel bir portala yönlendirilir:

| Sayfa | Yol | Açıklama |
|---|---|---|
| Ürünlerim | `/supplier/urunlerim` | Tedarikçiye bağlı ürünleri listeler; fiyat güncelleme, depo bazlı stok ve işlem geçmişi |
| Siparişler | `/supplier/siparisler` | Kendine ait siparişleri görür; bekleyenleri onaylayabilir, reddedebilir ve yola çıkarabilir |
| İşlem Geçmişi | `/supplier/islem-gecmisi` | İlgili ürünlerin tüm stok hareketlerini listeler |

---

## Bildirim Sistemi

Sidebar üst köşesindeki çan ikonu okunmamış bildirim sayısını gösterir. Bildirimler:

- Yeni stok talebi oluşturulduğunda (MANAGER/ADMIN'e)
- Stok talebi onaylandığında veya reddedildiğinde (talep sahibine)
- Sipariş durumu değiştiğinde (ilgili taraflara)
- Ürün kritik stok seviyesine düştüğünde (ADMIN/MANAGER'a)

---

## Backend Bağlantısı

API base URL varsayılan olarak `http://localhost:8080/api` şeklinde tanımlıdır ([src/api/client.ts](src/api/client.ts)). Farklı bir adres için `.env` dosyası ekle:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

JWT token `localStorage`'da saklanır. Token süresi dolduğunda (401 yanıtı) kullanıcı otomatik olarak çıkış yapılır ve giriş sayfasına yönlendirilir.

---

## İlgili Proje

Bu arayüz, Spring Boot ile geliştirilmiş **[envanter-api](https://github.com/FatihErdogan1/envanter-api)** backend'i ile birlikte çalışmaktadır.

---

## Lisans

Bu proje özel kullanım amaçlıdır.
