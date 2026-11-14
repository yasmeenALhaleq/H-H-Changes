# H-H — build from the Figma design

Files to copy into [`yasmeenALhaleq/HH_CO`](https://github.com/yasmeenALhaleq/HH_CO), at the same paths as in this repository.
Design source: Figma file `H-H`, page **High-Fidelity Design** (node `1:4`).

After copying, run `pnpm install` once (new dependencies were added), then `pnpm dev` or `pnpm build`.

## Changed files

| Path | Change |
| --- | --- |
| `package.json` | Added `react-router-dom`, `@phosphor-icons/react`, `@fontsource-variable/inter`, `@fontsource-variable/noto-sans-arabic` |
| `pnpm-lock.yaml` | Lockfile for the new dependencies |
| `src/App.tsx` | Routes for the customer app and the admin dashboard |
| `src/index.css` | Design tokens (colours, fonts) as a Tailwind v4 theme |

## New files

| Path | Contents |
| --- | --- |
| `src/assets/hh-logo.png` | H&H logo exported from the Figma file |
| `src/i18n/index.tsx` | Language provider: English / Arabic, RTL switching |
| `src/i18n/ar.ts` | Arabic copy, taken from the Arabic frames |
| `src/store/index.tsx` | Catalog, pricing, orders, addresses, loyalty (in-memory demo data) |
| `src/store/format.ts` | Order text helpers |
| `src/components/ui.tsx` | Buttons, inputs, chips, tabs, toggles, badges, cards, timeline |
| `src/components/mobile.tsx` | Phone shell, header, footer, bottom navigation |
| `src/customer/auth.tsx` | Welcome, login, sign-up, OTP, forgot / new password |
| `src/customer/shop.tsx` | Home, products, product details, order form, review, submission, reward, confirmation, add address |
| `src/customer/orders.tsx` | My orders, order details, tracking, cancel order |
| `src/customer/profile.tsx` | Profile, business information, saved addresses, notifications, language, help |
| `src/admin/data.tsx` | Admin demo data (products, drivers, customers, settings) |
| `src/admin/layout.tsx` | Admin sidebar, top bar, table, stat cards |
| `src/admin/screens.tsx` | Admin login, dashboard, products, orders, order details, customers, deliveries, reports, settings |

## Routes

- Customer app (mobile): `/#/` — welcome, then `/#/login`, `/#/home`, `/#/products`, `/#/orders`, `/#/profile`
- Admin dashboard (desktop): `/#/admin/login` — any valid email and a password of 6+ characters signs in
