# envanter-ui — Inventory Management Web Frontend

A React + TypeScript single-page application with a retro pixel/terminal look for managing inventory, fixed assets, supplier orders and users.
It is the frontend of the *envanter* web app and talks to the Spring Boot backend [envanter-api](https://github.com/FatihErdogan1/envanter-api) using JWT bearer tokens.

> Türkçe açıklama: [README.tr.md](README.tr.md)

## Features

- **Authentication** — login, registration, forgot password and a forced change-password flow; the token is kept in `localStorage` and the user is logged out automatically on `401` (Axios interceptors)
- **Two portals** — the main app for `ADMIN` / `MANAGER` / `STAFF`, and a separate `/supplier` portal for `SUPPLIER` users (own products, price updates, orders, transaction history)
- **Role-based routing** — route guards hide management pages from staff and user management from everyone except admins
- **Products** — searchable, paginated list with a low-stock filter and a detail modal with stock, supplier and history tabs
- **Fixed assets** — assignment, return, maintenance and retirement, with history
- **Stock movements** — `IN` / `OUT` / warehouse `TRANSFER` and per-warehouse stock views
- **Supplier orders & stock requests** — order status flow and request approval/rejection screens
- **Notifications** — bell with unread counter, refreshed by polling the API every 30 seconds
- **Management screens** — warehouses, categories, suppliers and users
- **Dashboard** — role-filtered statistics with interactive cards and critical-stock overview

## Tech Stack

React 18 · TypeScript 5.6 · Vite 5 · Tailwind CSS 3 · TanStack Query 5 · Axios · React Router 6 · Lucide icons · ESLint 9

## Project Structure

```
src/
├── api/          # Axios client (JWT + error interceptors) and API functions
├── components/   # layouts (main + supplier portal) and reusable UI (DataTable, Modal, badges, …)
├── context/      # auth context / provider
├── hooks/        # useAuth, useNotifications
├── pages/        # app pages; pages/supplier/ for the supplier portal
├── types/        # shared TypeScript types
└── utils/        # error helpers
```

## Getting Started

Prerequisites: Node.js 18+ and npm, plus a running [envanter-api](https://github.com/FatihErdogan1/envanter-api) instance. The API base URL is set to `http://localhost:8080/api` in `src/api/client.ts`.

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build     # type-check + production build
npm run preview   # preview the production build
npm run lint      # ESLint
```

## Related Repositories

- [envanter-api](https://github.com/FatihErdogan1/envanter-api) — Spring Boot REST API used by this app
- [envanter](https://github.com/FatihErdogan1/envanter) — earlier Java Swing desktop edition of the same project

---

**Author:** Fatih Erdoğan — developed together with Arda Ardıç ([@eyyorivaille](https://github.com/eyyorivaille))
