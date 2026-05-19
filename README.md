# Envanter Yönetim Sistemi — Arayüz

React + TypeScript + Vite ile geliştirilmiş, retro terminal estetiğine sahip tam özellikli envanter yönetim sistemi arayüzü.

---

## Özellikler

- **Ürün & Stok Yönetimi** — Ürün ekleme, düzenleme, stok takibi ve kategori bazlı filtreleme
- **Demirbaş Takibi** — Zimmet, bakım ve hurdaya ayırma işlemleri; geçmiş kaydı
- **Depo Yönetimi** — Çoklu depo desteği, depo bazlı kapsam kısıtlaması
- **Tedarikçi Yönetimi** — Tedarikçi bilgileri ve ürün ilişkilendirme
- **Kullanıcı Yönetimi** — Rol tabanlı erişim kontrolü (ADMIN / MANAGER / STAFF)
- **JWT Kimlik Doğrulama** — Oturum açma, şifre sıfırlama, zorunlu şifre değiştirme
- **Dashboard** — Stok durumu ve genel envanter özeti

---

## Gereksinimler

| Gereksinim | Versiyon |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Backend API | `http://localhost:8080/api` adresinde çalışıyor olmalı |

> Backend için ayrı bir Spring Boot projesi gereklidir. Arayüz, API'ye JWT Bearer token ile bağlanır.

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

| Paket | Amaç |
|---|---|
| React 18 | UI bileşen katmanı |
| TypeScript | Tip güvenliği |
| Vite | Geliştirme sunucusu ve build aracı |
| TailwindCSS | Stil |
| TanStack Query | Sunucu durum yönetimi, önbellekleme |
| Axios | HTTP istemcisi |
| React Router DOM v6 | Sayfa yönlendirme |
| Zustand | İstemci durum yönetimi |
| Lucide React | İkonlar |

---

## Proje Yapısı

```
src/
├── api/
│   ├── client.ts        # Axios istemcisi, JWT interceptor
│   └── index.ts         # Tüm API çağrıları
├── components/
│   └── ui/              # Button, Modal, DataTable, Input vb. ortak bileşenler
├── context/
│   └── AuthContext.tsx  # Kimlik doğrulama durumu ve hook
├── pages/
│   ├── DashboardPage.tsx
│   ├── InventoryPage.tsx
│   ├── ProductsPage.tsx
│   ├── AssetsPage.tsx
│   ├── CategoriesPage.tsx
│   ├── SuppliersPage.tsx
│   ├── WarehousesPage.tsx
│   ├── UsersPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ChangePasswordPage.tsx
│   └── ProfilePage.tsx
├── types/               # TypeScript tip tanımları
└── utils/               # Yardımcı fonksiyonlar
```

---

## Rol Yetkileri

| Özellik | ADMIN | MANAGER | STAFF |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| Envanter görüntüleme | ✓ | ✓ | ✓ |
| Ürün / Stok işlemleri | ✓ | ✓ | — |
| Demirbaş işlemleri | ✓ | ✓ | — |
| Depo yönetimi | ✓ | — | — |
| Kullanıcı yönetimi | ✓ | — | — |
| Tedarikçi yönetimi | ✓ | ✓ | — |

> ADMIN tüm depolara erişebilir. MANAGER ve STAFF yalnızca kendi depolarındaki verileri görebilir.

---

## Backend Bağlantısı

API base URL varsayılan olarak `http://localhost:8080/api` şeklinde tanımlıdır ([src/api/client.ts](src/api/client.ts)). Farklı bir adres kullanıyorsan bu dosyayı ya da projeye bir `.env` dosyası ekleyerek güncelle:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Lisans

Bu proje özel kullanım amaçlıdır.
