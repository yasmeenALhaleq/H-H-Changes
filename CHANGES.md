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

## Sign-up fix — account details were sometimes not saved

**Files:** `src/store/index.tsx`, `src/App.tsx`

A new account could be created in Neon Auth without its row in `public.profiles`,
so the app fell back to the placeholder business name and the customer could not
see or save their details. Cause: signing up while another account was still
signed in — the old access token was still the one the database checked, so the
insert was rejected with a 403.

Three changes:

1. `signUp` signs the previous session out before creating the account.
2. The `profiles` insert is retried once after a short pause, in case the new
   session has not reached the database layer yet.
3. `loadCustomer` repairs an account that has no details row by creating a
   minimal one, so an existing broken account heals on next sign-in.
4. `/signup` now sits behind `GuestOnly`, so a signed-in user is sent to the
   home screen instead of reaching the sign-up form.

## Bundle — 15 Nov

Upload these four files together, then Publish:

- `src/store/index.tsx`
- `src/customer/profile.tsx`
- `src/lib/company.ts`  ← new file
- `src/i18n/ar.ts`

`src/App.tsx` is already uploaded and unchanged.

### 1. Help & Contact did nothing

**Files:** `src/lib/company.ts` (new), `src/customer/profile.tsx`, `src/i18n/ar.ts`

The Figma design carried a placeholder number (`+962 X XXX XXXX`), so the
"Call Us" button and the Phone and WhatsApp rows had nothing to open and were
inert.

The company's number now lives in one place, `COMPANY_PHONE` in
`src/lib/company.ts`. Fill it in and the whole screen works at once: the phone
row and "Call Us" open the dialer, the WhatsApp row opens the chat. While it is
empty the row reads "Number not set yet" and the button is disabled, so no
customer is sent to a wrong number.

### 2. Orders missing on the home screen after returning to the site

**File:** `src/store/index.tsx`

Every read of profile, addresses and orders is filtered by the signed-in
account's access token. A token that has gone stale is not rejected with an
error — the rows are simply filtered out, so the app looked like a brand-new
account with no orders. The next background refresh (every 20 s) picked up a
fresh token, which is why the order reappeared a moment later on another screen.

Three changes:

1. `loadCustomer` asks for the session before reading, which renews a stale
   token first.
2. If the profile row comes back missing — which cannot happen for a real
   account — the whole read is retried once after a short pause.
3. The background refresh also listens for `visibilitychange`, not only
   `focus`. A phone freezes a background tab, so the 20 s timer stops and
   `focus` often never fires; returning to the tab now always reloads the data.

### Still open

Oxygen pricing: quantity is in litres while the jar price is per jar, so an 8L
jar ordered as 3 L is charged 15 JOD — less than the 3L jar's own 18 JOD.
Waiting on the company's decision: price per jar, or force the quantity into
multiples of the jar size.
