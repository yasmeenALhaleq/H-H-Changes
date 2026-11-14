# H-H — build from the Figma design

Files to copy into [`yasmeenALhaleq/HH_CO`](https://github.com/yasmeenALhaleq/HH_CO), at the same paths as in this repository.
Design source: Figma file `H-H`, page **High-Fidelity Design** (node `1:4`).

After copying, run `pnpm install` once (new dependencies were added), then `pnpm dev` or `pnpm build`.

## Changed files

| Path | Change |
| --- | --- |
| `package.json` | Added `@neon/neon-js`, `react-router-dom`, `@phosphor-icons/react`, `@fontsource-variable/inter`, `@fontsource-variable/noto-sans-arabic` |
| `pnpm-lock.yaml` | Lockfile for the new dependencies |
| `src/App.tsx` | Routes for the customer app and the admin dashboard |
| `src/index.css` | Design tokens (colours, fonts) as a Tailwind v4 theme |

## New files

| Path | Contents |
| --- | --- |
| `src/assets/hh-logo.png` | H&H logo exported from the Figma file |
| `src/i18n/index.tsx` | Language provider: English / Arabic, RTL switching |
| `src/i18n/ar.ts` | Arabic copy, taken from the Arabic frames |
| `src/lib/neon.ts` | Neon client (Auth + Data API) for the `H&H` Neon project |
| `src/store/index.tsx` | Catalog and pricing; accounts, profile, addresses and orders loaded from and saved to Neon |
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

## Neon database (added 14 Nov)

Customer accounts and data now live in the Neon project **H&H** (`dawn-math-05715635`).

- **Accounts:** sign-up and login with email + password (Neon Auth). SMS verification is skipped for now: after "Create Account" the customer goes straight to "Account Verified".
- **Tables:** `profiles`, `addresses`, `orders` — row-level security lets each customer read and change only their own rows.
- **Changed for this:** `package.json`, `pnpm-lock.yaml`, `src/App.tsx`, `src/lib/neon.ts` (new), `src/store/index.tsx`, `src/customer/auth.tsx`, `src/customer/shop.tsx`, `src/customer/orders.tsx`, `src/customer/profile.tsx`, `src/i18n/ar.ts`.
- **Not connected yet:** "Forgot password" does not send anything.
- Sign-in only works from `https://hh-co.figma.site` (the trusted origin) and from localhost.

## Admin connected to the same database (14 Nov, later)

The admin dashboard now works on the real orders instead of demo rows.

- **Admin sign-in** uses the same Neon accounts. An account only reaches `/#/admin` when its Neon Auth role is `admin`.
- **Orders** — every customer's orders are listed; the admin can confirm, assign a driver, mark out for delivery, mark delivered, or cancel. The customer sees the new status (the app reloads orders on focus and every 20 seconds).
- **Customer cancels** show up on the admin side the same way.
- **Loyalty** — a delivered order adds one to that customer's counter in the database; the 5th order applies the 25% discount and resets the cycle.
- **Customers, dashboard and reports** read real accounts and orders. Driver names, products, settings and the delivery board columns are still local demo data.
- **Changed for this:** `src/store/index.tsx`, `src/admin/layout.tsx`, `src/admin/screens.tsx`, `src/admin/data.tsx`, `src/i18n/ar.ts`.
- Database side (already applied, nothing to copy): `is_admin()`, `admin_update_order()`, a loyalty trigger, an `updated_at` column, and admin read policies.
