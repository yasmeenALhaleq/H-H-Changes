# H-H — build from the Figma design

Files to copy into [`yasmeenALhaleq/HH_CO`](https://github.com/yasmeenALhaleq/HH_CO), at the same paths as in this repository.
Design source: Figma file `H-H`, page **High-Fidelity Design** (node `1:4`).

After copying, run `pnpm install` once (new dependencies were added), then `pnpm dev` or `pnpm build`.

## ★ 22 Nov — Thin gold lines inside text boxes (start here)

**Upload these 2 files, then Publish:**

- `src/index.css`
- `src/admin/screens.tsx`

**What was wrong:** every text box is two layers — a box with the border, and
the bare typing field inside it. When a box was focused, its border turned
gold (as designed), but a global rule in `index.css` also drew a gold focus
ring around the bare field inside it. The box hid the top and bottom of that
ring, so only its two sides showed: the two thin vertical lines.

**Fix:** text fields, text areas and dropdowns no longer get that inner ring;
the box's own gold border shows the focus. Buttons, links, checkboxes and
radios keep their focus ring for keyboard users. One admin number field
(loyalty settings) had no gold border of its own, so it gets one on focus.

Checked on the login screen with the field focused from the keyboard: the
lines show before the fix and are gone after it.

---

## ★ 17 Nov — Customer screens fit phones, tablets and computers

**Upload these files, each at its path, then Publish:**

| Path | |
| --- | --- |
| `src/components/mobile.tsx` | replace — the responsive app shell |
| `src/customer/shop.tsx` | replace |
| `src/customer/orders.tsx` | replace |
| `src/customer/auth.tsx` | replace |
| `src/customer/profile.tsx` | replace — still pending from 16 Nov (iPhone install steps) |
| `public/manifest.json` | replace — still pending from 16 Nov (plain dash in the name) |

The same 6 files are in `bundle/responsive-17-nov.zip`, already in their folders.

**On a phone** (under 768px wide) nothing changes: the screens fill the
phone, with the bottom tab bar, exactly as before.

**On a tablet or computer** (768px and up) the customer app becomes a website layout:

- **Top bar** across the page: H&H brand, the four tabs (Home, Products, My
  Orders, Profile — only when signed in), language switch and notifications.
  It replaces the bottom tab bar.
- **Home:** loyalty and New Order cards side by side, products in a row of
  tiles (4–5 across), active orders in two columns on wide screens.
- **Products:** product cards in a grid, 2–3 across.
- **My Orders:** orders in two columns on wide screens.
- **Forms and details** (product, new order, review, address, profile
  settings, order details): one centred column, 680px wide, with the
  screen title as the page heading and the action buttons right under the form.
- **Welcome, login, sign-up, verification and success screens:** a centred
  card, 480px wide.
- The "H&H on your phone" install card floats in the bottom corner.

The page scrolls like a normal website; the admin dashboard is not affected.

Checked by rendering the screens at 390px (phone), 768px, 820px (tablet),
1024px and 1366px (laptop), in English and Arabic: nothing runs off the side,
and the phone layout is unchanged.

---

## ★ 16 Nov, later — "H&H on your phone" install card

**Upload these 3 files, then Publish:**

- `src/components/mobile.tsx`
- `src/customer/auth.tsx`
- `src/i18n/ar.ts`

A floating card — app icon, "H&H on your phone", "Open the app from your home
screen", and a gold button — now sits above the bottom bar on the main screens
(welcome, login, sign-up, home, products, my orders, profile). It shows on every
device until the app is installed:

- **Android, and Chrome / Edge on a computer:** the button reads "Install the
  app" and opens the browser's own install dialog.
- **iPhone, and Safari / Firefox:** the button reads "How to install" and opens
  the steps screen (Safari's ••• → Share → Add to Home Screen).
- **×** closes it for 3 days. Once the app is opened from the home screen the
  card never shows.
- It stays off the order, address and form screens so it never covers a form.

The welcome screen's "Install the app on your phone" link is gone — the card
replaces it — which is why `src/customer/auth.tsx` changes again. The Profile
row "Install the app" stays.

---

## ★ 16 Nov — Add products from the admin, and install as a phone app

**Upload these 18 files, each at exactly this path, then Publish.**
Figma Make drops a folder's files straight into the folder you upload into, so
create any missing folder first (right-click → Create folder), then upload the
files into it. `public/icons/` is a new folder.

| Path | |
| --- | --- |
| `index.html` | replace — links the app manifest and the home-screen icon |
| `src/main.tsx` | replace — switches on install-as-app support |
| `src/App.tsx` | replace — new `/install` screen |
| `src/store/index.tsx` | replace |
| `src/store/format.ts` | replace |
| `src/admin/screens.tsx` | replace |
| `src/customer/shop.tsx` | replace |
| `src/customer/orders.tsx` | replace |
| `src/customer/profile.tsx` | replace |
| `src/customer/auth.tsx` | replace |
| `src/i18n/ar.ts` | replace |
| `src/lib/pwa.ts` | **new** |
| `public/manifest.json` | **new** |
| `public/sw.js` | **new** |
| `public/icons/icon-192.png` | **new** |
| `public/icons/icon-512.png` | **new** |
| `public/icons/maskable-512.png` | **new** |
| `public/icons/apple-touch-icon.png` | **new** |

The manifest is `manifest.json`, not `manifest.webmanifest`: Figma Make does not
accept the `.webmanifest` extension, and browsers read either name.

The same 18 files are in `bundle/update-16-nov.zip`, already in their folders.
`bundle/HH_CO-full.zip` is the whole app with this update included.

### 1. Adding products from the admin

Products → **Add product** opens an empty form: name in English and Arabic,
unit (kilogram, liter or piece), minimum / step / maximum order, price,
description in both languages, photo, and whether it shows in the customer app.
Saving puts it straight into the customer app — home tiles, products list,
product screen, order form, review, confirmation, my orders, and on the admin
side the orders, deliveries and reports.

- **Edit** an added product: every field can be changed.
- **Dry ice, nitrogen and oxygen** keep their name, unit and order limits as
  built, because the order screens have rules of their own for them (oxygen
  jars, the nitrogen note). Their price, photo, visibility and both
  descriptions are editable as before, and they now take an Arabic description too.
- **Delete** is offered only for an added product with no orders. A product
  that has orders can only be hidden, so old orders keep showing its name.
- An added product with no price shows "To be confirmed", like nitrogen.

Database (already applied, nothing to upload): `products` gained
`name_en`, `name_ar`, `description_ar`, `unit`, `min_qty`, `step_qty`,
`max_qty`, `built_in`, `sort`; new functions `admin_create_product`,
`admin_update_product`, `admin_delete_product`, all refusing anyone without
the admin role. `orders.product` is now checked against the products table
instead of the fixed list of three, so an order for an added product is
accepted and an order for an unknown product is refused. Tested on the live
database inside a transaction that was rolled back: add, edit, the limits
check, refusing to delete a built-in product or one with orders, deleting an
unused one.

The old `admin_save_product` function is left in place, so the site keeps
working until the new files are published.

### 2. Install as an app (PWA)

The published site can now be installed on a phone and opens like an app —
its own icon, full screen, no browser bar.

- **Android (Chrome):** the welcome screen and Profile show "Install the app";
  tapping it opens Chrome's own install dialog.
- **iPhone (Safari):** Apple has no install dialog, so the same button opens a
  short screen with the steps (Share → Add to Home Screen).
- The button hides itself once the app is running from the home screen.
- Icons are made from the H&H logo (crest and letters, on the app's black).

How it works: `public/manifest.json` names the app and its icons;
`public/sw.js` is the service worker. Pages are always fetched fresh first, so
a new Publish shows up the next time the app opens; the saved copy is only used
with no connection. Orders and accounts (Neon) are never cached — they always
come live.

The service worker runs on the published site only, not inside the Figma Make
preview, so the preview never shows a stale copy. To try installing, open
`https://hh-co.figma.site` on the phone.

Checked in Chrome: the manifest has no errors, the service worker activates,
Chrome reports the site installable with no problems, and the app still opens
with the connection off.

---

## ⟲ Full restore — 15 Nov

HH_CO went back to a blank white page. Two reasons, both visible in the repo:

1. `src/App.tsx` is the empty starter again, so nothing is mounted.
2. Three admin files from the very first build sit at the wrong place —
   `src/data.tsx`, `src/layout.tsx`, `src/screens.tsx` instead of
   `src/admin/…` — and they are the 14 Nov first version, without anything added since.
   They import `@/store` and `@/i18n`, which do not exist in HH_CO right now.

Everything below is the complete, latest app: every change agreed so far
(Neon accounts and data, SMS step skipped, admin on live orders, loyalty,
company settings from the dashboard, Help & Contact, stale-token fix,
sign-up fix, email label, sign in with a username). Checked on a copy of HH_CO
with these files applied: `pnpm install`, `tsc` with no errors, `pnpm build`
passes, and the welcome, login, sign-up and admin login screens render with no errors.

The Neon database (project **H&H**, `dawn-math-05715635`) was not reset:
accounts, orders, settings, usernames and the database functions are all still there.
Nothing to redo on the database.

### 1. Delete these three files in HH_CO

- `src/data.tsx`
- `src/layout.tsx`
- `src/screens.tsx`

### 2. Upload all of these, each at exactly this path (folders included)

| Path | |
| --- | --- |
| `package.json` | replace |
| `pnpm-lock.yaml` | replace |
| `src/App.tsx` | replace |
| `src/index.css` | replace |
| `src/vite-env.d.ts` | new — lets TypeScript read `import.meta.env` and the `.png` import |
| `src/assets/hh-logo.png` | new |
| `src/i18n/index.tsx` | new |
| `src/i18n/ar.ts` | new |
| `src/lib/neon.ts` | new |
| `src/lib/company.ts` | new |
| `src/store/index.tsx` | new |
| `src/store/format.ts` | new |
| `src/components/ui.tsx` | new |
| `src/components/mobile.tsx` | new |
| `src/customer/auth.tsx` | new |
| `src/customer/shop.tsx` | new |
| `src/customer/orders.tsx` | new |
| `src/customer/profile.tsx` | new |
| `src/admin/data.tsx` | new |
| `src/admin/layout.tsx` | new |
| `src/admin/screens.tsx` | new |

The same 21 files are in `bundle/HH_CO-full.zip`, already in their folders —
unzip it at the root of HH_CO and they land in the right places.

Do not touch `vite.config.ts`, `tsconfig.json` or `.figma/` — they stay as they
are in HH_CO. (Since 16 Nov, `src/main.tsx` and `index.html` are part of the
update — see the section above.)

### 3. Then

Let Figma Make reinstall (it does this by itself when `package.json` changes),
then Publish. Sign-in works on `https://hh-co.figma.site` and on localhost only.

---

The sections below are the history of how the app got here.

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

## Company settings now live in the admin dashboard

Everything on the Settings page is saved to Neon and read by the customer app,
so the operations team changes it from the dashboard — no code, no publish.

**Upload these eight files together, then Publish:**

- `src/store/index.tsx`
- `src/admin/screens.tsx`
- `src/admin/data.tsx`
- `src/customer/shop.tsx`
- `src/customer/orders.tsx`
- `src/customer/profile.tsx`
- `src/i18n/ar.ts`
- `src/lib/company.ts`

### What the admin now controls

| Setting | Where the customer sees it |
|---|---|
| Company phone number | Help & Contact — the phone row, the Call button, WhatsApp |
| Opening / closing time | Help & Contact — working hours |
| Delivery fee | Every order total and the order summary |
| Delivery window | Length of a delivery slot |
| Completed orders required | The loyalty card and its progress bars, on both sides |
| Reward discount | The loyalty card, the reward screen, the admin reward banner |
| Alert toggles | Saved for the notification work still to come |

Before this, the Settings page kept its values in the browser only: they reset
on reload and the customer app never saw them. The loyalty numbers the customer
read (every 5 orders, 25% off) were fixed in the code, in the English and Arabic
copy as well, so changing them meant editing text in two languages.

### Database

- New table `public.settings`, one row, readable by any signed-in account.
- `public.admin_save_settings(...)` — the only way to write it, and it refuses
  anyone without the admin role. Verified: the call is rejected even straight
  from the Neon console.
- `public.orders_loyalty()` now reads `reward_every` from the settings instead
  of the fixed 4, and the `profiles.loyalty` range check no longer caps at 4, so
  a longer reward cycle works.

All of it is already applied to the database — nothing to upload for this part.

### Copy that became dynamic

"{n} / 5 completed orders", "25% off your next order", "You reached your 5th
order", "This is {name}'s 5th order" and the rest now carry the real numbers as
placeholders, in both languages.

## Login says email only, and the customers table shows phone and email

**Files:** `src/customer/auth.tsx`, `src/admin/screens.tsx`, `src/i18n/ar.ts`

The sign-in field was labelled "Email or Phone Number" — carried over from the
design — but sign-in only ever accepted an email address, so a customer typing
their phone number was refused with no explanation. The label now reads "Email"
in both languages and the field autocompletes as an email.

There is no username in the app: an account is identified by its email.

The admin customers table now carries Phone and Email columns, so the
operations team can reach a customer from the list instead of opening their
page, and the search box matches the phone number as well.

## Sign in with a username

**Files:** `src/store/index.tsx`, `src/customer/auth.tsx`, `src/customer/profile.tsx`,
`src/admin/screens.tsx`, `src/i18n/ar.ts`

Customers sign up with their email as before, and now also choose a username.
Sign-in accepts either one: anything with an `@` is taken as an email, anything
else is looked up as a username and swapped for that account's email before
signing in.

Neon's managed auth has no username plugin (supported plugins are email and
password, social OAuth, email OTP, admin, organization, JWT, magic link and
phone number), so the username is a field on the customer's profile with a
unique index, not a second identity. That keeps it changeable, leaves existing
accounts working, and leaves email-based password reset available later.

- Sign-up step 2 has a Username field, validated as 3–20 characters of letters,
  numbers, dots, dashes and underscores, lowercased as it is typed.
- The name is checked for availability before the account is created, so a
  taken username never leaves an account behind. The unique index is still the
  final guard.
- Profile → Business details lets a customer change their username. That screen
  now waits for the save and shows what went wrong instead of leaving the page
  on a failure, which it did before.
- The admin customers table has a Username column, the customer's own page
  shows it, and the search box matches it.

### Database

- `profiles.username`, with a unique index on `lower(username)` that ignores
  empty and missing values.
- `public.email_for_username(text)` — returns the email behind a username, for
  sign-in. Callable by a visitor who is not signed in yet, which it has to be.
- `public.username_available(text)` — the availability check.

Already applied; nothing to upload for this part. Existing accounts were given
usernames: `seema`, `testclinic`, `ammanhotel`, `ops`, `ops2`. The two accounts
on `me@gmail.com` and `ahb.ahb22@gmail.com` have none yet and sign in by email
until a username is set from their profile screen.

### Worth knowing

`email_for_username` is reachable without signing in, so someone guessing
usernames could learn the matching email address. That is the cost of keeping
the email as the account's identity, and it was the accepted trade-off.

## Sign-in by username was refused, and passwords can now be revealed

**Files:** `src/lib/neon.ts`, `src/components/ui.tsx`, `src/i18n/ar.ts`

### Username sign-in

Signing in with a username failed with "No account with that username", even
for a username that exists. The lookup itself was fine — called in the
database it returned the right address every time. The request never got that
far: the Data API answered

    401 PGRST302 — missing authentication credentials:
    required authorization bearer token in JWT format

because a visitor on the sign-in screen has no token yet, and the sign-in
screen is exactly where the lookup has to happen.

Neon's answer for this is `allowAnonymous`: the SDK fetches a short-lived
anonymous token on the first request and sends it with every query. The client
now sets it.

This opens nothing up. The `anonymous` role holds no privilege on any table —
checked, it has none at all — only EXECUTE on `email_for_username` and
`username_available`, granted explicitly. Everything else still needs a signed-
in account and passes through the same row-level security as before.

### Passwords

Password fields were typed blind. Every password field in the app — sign-in,
sign-up, confirm, admin sign-in — now carries its own show / hide control,
added once in the shared `Input` component.

> The bundle at `bundle/HH_CO-full.zip` was rebuilt on 15 Nov at 23:26 and now
> carries the anonymous-token and password-reveal fixes above. Use this one.

## Product images, prices and availability from the admin

**Files:** `src/store/index.tsx`, `src/admin/screens.tsx`, `src/admin/data.tsx`,
`src/customer/shop.tsx`, `src/lib/image.ts` (new), `src/i18n/ar.ts`

The admin products page saved nothing — the same state the settings page was in.
Its values lived in the browser, reset on reload, and the customer app never saw
them; the catalog it showed was fixed in the code.

The operations team now controls, per product: the photo, the price, the
description, and whether it appears in the customer app at all. Saved in Neon,
read by both sides.

### Images

Neon's object storage is not available in this project's region (us-west-2;
it runs in us-east-2, us-east-1, eu-central-1 and ap-southeast-1), and moving
the project would mean rebuilding it. So a photo is stored in the products row
as a data URL.

A camera file is far too big for that, so `src/lib/image.ts` shrinks the picture
to 900px on its longest side and compresses it, stepping the JPEG quality down
until it fits under ~400 KB of text — in practice 60–120 KB. A transparent PNG
is laid on white first so it does not come out black.

The photo shows on the home tiles, the products list and the product screen,
and each falls back to the product's icon when no photo is set.

### What stays in the code

The unit and the minimum, step and maximum of an order: the order screen is
built around those numbers, so the admin page shows them read-only with a line
saying why.

Oxygen's price too. It is priced per jar, 3L and 8L, which one price field
cannot express — that field is disabled for oxygen until the pricing question
is settled.

### Database

- `public.products` — one row per product, holding price, description, active
  and image. Readable by any signed-in account.
- `public.admin_save_product(...)` — the only way to write it; refuses anyone
  without the admin role.

Already applied; nothing to upload for this part.
