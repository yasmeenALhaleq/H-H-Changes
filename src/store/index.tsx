import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { errorMessage, neon } from "@/lib/neon";

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

/** The three products the app was built around; the order screens have extra rules for them. */
export type BuiltInId = "dry-ice" | "nitrogen" | "oxygen";
/** Any product id — a built-in one, or one the operations team added from the dashboard. */
export type ProductId = string;
/** `jar` is oxygen only: it is sold as a number of 3L or 8L jars. */
export type Unit = "kg" | "L" | "pcs" | "jar";
export type JarSize = "3L" | "8L";

export type Product = {
  id: ProductId;
  name: string;
  /** Arabic name; empty for the built-in products, whose Arabic name is in the copy. */
  nameAr: string;
  /** Short unit used next to quantities. */
  unit: Unit;
  unitLong: string;
  /** Proposed price per unit; `null` while the company has not confirmed one. */
  price: number | null;
  min: number;
  step: number;
  max: number;
  /** Default quantity on the product details screen. */
  detailQty: number;
  description: string;
  /** Arabic description; when empty the English one is translated from the copy, if it can be. */
  descriptionAr: string;
  /** True for dry ice, nitrogen and oxygen. Their unit and order limits stay as built. */
  builtIn: boolean;
};

/** Long unit label for a product the operations team added. */
export const UNIT_LONG: Record<Unit, string> = {
  kg: "Kilogram (kg)",
  L: "Liter (L)",
  pcs: "Piece (pcs)",
  jar: "Jar (3L / 8L)",
};

/** Oxygen jar prices until the database answers; the admin sets the live ones. */
export const JAR_PRICE: Record<JarSize, number> = { "3L": 20, "8L": 40 };
export const JAR_SIZES: JarSize[] = ["3L", "8L"];

/**
 * Company settings, kept in the database so the operations team changes them
 * from the admin dashboard — no code change, no publish.
 */
export type Settings = {
  /** Phone number for the Help & Contact screen; empty until the team sets it. */
  contactPhone: string;
  opening: string;
  closing: string;
  /** Added to every order total. Zero means delivery is included in the prices. */
  deliveryFee: number;
  /** Length of a delivery slot, in hours. */
  deliveryWindow: number;
  /** Delivered orders needed before the discount is earned. */
  rewardEvery: number;
  /** Discount on the reward order, as a percentage. */
  rewardPercent: number;
  notifyNewOrder: boolean;
  notifyCancellation: boolean;
  notifyLowStock: boolean;
};

/** Used until the real settings arrive from the database, and if the read fails. */
export const DEFAULT_SETTINGS: Settings = {
  contactPhone: "",
  opening: "08:00",
  closing: "18:00",
  deliveryFee: 0,
  deliveryWindow: 2,
  rewardEvery: 5,
  rewardPercent: 25,
  notifyNewOrder: true,
  notifyCancellation: true,
  notifyLowStock: false,
};

export const PRODUCTS: Record<BuiltInId, Product> = {
  "dry-ice": {
    id: "dry-ice",
    name: "Dry Ice",
    nameAr: "",
    unit: "kg",
    unitLong: "Kilogram (kg)",
    price: 1.5,
    min: 2,
    step: 1,
    max: 100,
    detailQty: 5,
    description: "High-purity dry ice for medical, laboratory and cold-chain use. Sold by weight.",
    descriptionAr: "",
    builtIn: true,
  },
  nitrogen: {
    id: "nitrogen",
    name: "Nitrogen",
    nameAr: "",
    unit: "L",
    unitLong: "Liter (L)",
    price: null,
    min: 1,
    step: 1,
    max: 50,
    detailQty: 25,
    description: "Liquid nitrogen for cryogenic storage, medical and laboratory use.",
    descriptionAr: "",
    builtIn: true,
  },
  oxygen: {
    id: "oxygen",
    name: "Oxygen",
    nameAr: "",
    unit: "jar",
    unitLong: "Jar (3L / 8L)",
    // Sold by the jar: the quantity is a number of jars, each priced by its size.
    price: 20,
    min: 1,
    step: 1,
    max: 20,
    detailQty: 1,
    description: "Medical-grade oxygen supplied in refillable jars. Choose a 3L or 8L jar.",
    descriptionAr: "",
    builtIn: true,
  },
};

export const PRODUCT_LIST: Product[] = [PRODUCTS["dry-ice"], PRODUCTS.nitrogen, PRODUCTS.oxygen];

export const isBuiltIn = (id: string | undefined): id is BuiltInId =>
  id === "dry-ice" || id === "nitrogen" || id === "oxygen";

/**
 * A product as the customer app shows it. Everything is saved in the database.
 * For the three built-in products the unit and the order limits stay as built,
 * because the order screens have rules of their own for them (oxygen jars).
 */
export type CatalogProduct = Product & {
  /** Price per jar by size, for a product sold by the jar (oxygen); null for the rest. */
  jarPrices?: Record<JarSize, number | null> | null;
  /** Off hides the product from the customer app. */
  active: boolean;
  /** The product photo, as a data URL, or null while none is set. */
  image: string | null;
};

type ProductRow = {
  id: ProductId;
  price: number | string | null;
  description: string;
  description_ar: string;
  active: boolean;
  image: string | null;
  name_en: string;
  name_ar: string;
  unit: Unit;
  min_qty: number;
  step_qty: number;
  max_qty: number;
  built_in: boolean;
  sort: number;
  jar_prices: Partial<Record<JarSize, number | string | null>> | null;
};

/** What the admin fills in to add or change a product. */
export type ProductInput = {
  name: string;
  nameAr: string;
  unit: Unit;
  min: number;
  step: number;
  max: number;
  price: number | null;
  description: string;
  descriptionAr: string;
  active: boolean;
  image: string | null;
  /** Per-jar prices, only for a product sold by the jar. */
  jarPrices?: Record<JarSize, number | null>;
};

/** A placeholder for an order whose product no longer exists in the catalog. */
const UNKNOWN_PRODUCT = (id: ProductId): CatalogProduct => ({
  id,
  name: "Product",
  nameAr: "",
  unit: "pcs",
  unitLong: UNIT_LONG.pcs,
  price: null,
  min: 1,
  step: 1,
  max: 100,
  detailQty: 1,
  description: "",
  descriptionAr: "",
  builtIn: false,
  active: false,
  image: null,
});

/** Looks a product up in the catalog; never fails, so an old order can always be shown. */
export function findProduct(catalog: CatalogProduct[], id: ProductId): CatalogProduct {
  const found = catalog.find((p) => p.id === id);
  if (found) return found;
  if (isBuiltIn(id))
    return { ...PRODUCTS[id], jarPrices: defaultJars(id), active: true, image: null };
  return UNKNOWN_PRODUCT(id);
}

/** Built-in jar prices for oxygen until the database answers. */
const defaultJars = (id: ProductId) => (id === "oxygen" ? { ...JAR_PRICE } : null);

const jarsFrom = (row: ProductRow): Record<JarSize, number | null> | null => {
  if (!row.jar_prices) return null;
  const read = (size: JarSize) => {
    const v = row.jar_prices?.[size];
    return v === null || v === undefined ? null : Number(v);
  };
  return { "3L": read("3L"), "8L": read("8L") };
};

/** Turns a database row into a catalog product, built-in details kept for the built-in three. */
function toCatalogProduct(row: ProductRow): CatalogProduct {
  const base = isBuiltIn(row.id) ? PRODUCTS[row.id] : null;
  const price = row.price === null ? null : Number(row.price);
  if (base)
    return {
      ...base,
      price,
      description: row.description || base.description,
      descriptionAr: row.description_ar ?? "",
      jarPrices: jarsFrom(row) ?? defaultJars(row.id),
      active: row.active,
      image: row.image ?? null,
    };
  return {
    id: row.id,
    name: row.name_en || "Product",
    nameAr: row.name_ar ?? "",
    unit: row.unit,
    unitLong: UNIT_LONG[row.unit] ?? UNIT_LONG.pcs,
    price,
    min: row.min_qty,
    step: row.step_qty,
    max: row.max_qty,
    detailQty: row.min_qty,
    description: row.description ?? "",
    descriptionAr: row.description_ar ?? "",
    builtIn: false,
    active: row.active,
    image: row.image ?? null,
  };
}

/** Products sold by the jar: the quantity is a number of jars, each priced by its size. */
export const PRICED_BY_JAR: ProductId[] = ["oxygen"];

/**
 * Price of one unit — one kilogram, one liter, one piece, or one jar of the chosen
 * size for oxygen. Taken from the catalog (what the admin saved) when it is given.
 */
export function unitPrice(
  product: ProductId,
  jar: JarSize = "3L",
  catalog: CatalogProduct[] = [],
): number | null {
  const saved = catalog.find((p) => p.id === product);
  if (PRICED_BY_JAR.includes(product)) {
    const jars = saved?.jarPrices ?? defaultJars(product);
    return jars ? (jars[jar] ?? null) : null;
  }
  if (saved) return saved.price;
  return isBuiltIn(product) ? PRODUCTS[product].price : null;
}

export type Pricing = {
  unit: number | null;
  subtotal: number | null;
  discount: number;
  total: number | null;
};

/**
 * Works out what an order costs. The delivery fee and the reward discount come
 * from the company settings, so pass the live ones in; the defaults keep the
 * figures sane if a caller has none to hand.
 */
export function priceOrder(
  product: ProductId,
  qty: number,
  jar: JarSize = "3L",
  reward = false,
  settings: Pick<Settings, "deliveryFee" | "rewardPercent"> = DEFAULT_SETTINGS,
  catalog: CatalogProduct[] = [],
): Pricing {
  const unit = unitPrice(product, jar, catalog);
  if (unit === null) return { unit, subtotal: null, discount: 0, total: null };
  const subtotal = unit * qty;
  const gross = subtotal + settings.deliveryFee;
  const discount = reward ? (gross * settings.rewardPercent) / 100 : 0;
  return { unit, subtotal, discount, total: gross - discount };
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export type OrderStatus = "pending" | "confirmed" | "on_the_way" | "delivered" | "cancelled";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  on_the_way: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type Order = {
  /** Route key, `o<id>`. */
  uid: string;
  id: number;
  /** Account that placed the order. */
  userId: string;
  customer: string;
  product: ProductId;
  qty: number;
  jar?: JarSize;
  status: OrderStatus;
  address: string;
  /** Delivery window, e.g. `Today · 14:00 – 16:00`. */
  slot: string;
  /** Compact slot used in admin tables, e.g. `Today 14–16`. */
  slotShort: string;
  /** Delivery / cancellation date for finished orders. */
  closedOn?: string;
  total: number | null;
  note?: string;
  driver?: string;
  reward?: boolean;
  createdAt: string;
  /** Placed by the signed-in account — shown in the customer app. */
  mine: boolean;
  /** Visible in the admin dashboard (the signed-in account is an admin). */
  admin: boolean;
};

export const isActive = (order: Order) =>
  order.status !== "delivered" && order.status !== "cancelled";
export const canCancel = (order: Order) =>
  order.status === "pending" || order.status === "confirmed";

/* ------------------------------------------------------------------ */
/* Customer account                                                    */
/* ------------------------------------------------------------------ */

export type CustomerType = "Doctor" | "Clinic" | "Hotel";

export type Account = {
  type: CustomerType;
  business: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  /** Short name the customer signs in with. Empty on an older account. */
  username: string;
};

/** Trims and lowercases a username so it is stored and looked up the same way. */
export const normalizeUsername = (value: string) => value.trim().toLowerCase();

/** Letters, digits, dot, dash and underscore, 3 to 20 characters. */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,20}$/;

/** Checks a username's shape; returns the message to show, or null when it is fine. */
export function usernameProblem(value: string): string | null {
  const name = normalizeUsername(value);
  if (!name) return "Choose a username.";
  if (name.length < 3) return "Use at least 3 characters.";
  if (name.length > 20) return "Use 20 characters at most.";
  if (!USERNAME_PATTERN.test(name))
    return "Use letters, numbers, dots, dashes and underscores only.";
  return null;
}

export type Address = { id: string; label: string; line: string; city: string; notes?: string };

export type NotificationPrefs = {
  confirmation: boolean;
  statusUpdates: boolean;
  onTheWay: boolean;
  delivered: boolean;
};

export type Draft = {
  product: ProductId;
  jar: JarSize;
  qty: number;
  addressId: string;
  date: string;
  time: string;
  note: string;
  reorderOf?: number;
};

export type Session =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; userId: string; email: string };

export type SignUpInput = Account & { password: string };

/** Result of an action that talks to the server: `null` on success, otherwise a message to show. */
type Failure = string | null;

type Store = {
  session: Session;
  /** Accepts a username or an email address. */
  signIn: (login: string, password: string) => Promise<Failure>;
  /** True when no other account holds this username. */
  usernameFree: (username: string) => Promise<boolean>;
  signUp: (input: SignUpInput) => Promise<Failure>;
  signOut: () => Promise<void>;
  account: Account;
  setAccount: (patch: Partial<Account>) => Promise<Failure>;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => Promise<Address | null>;
  updateAddress: (id: string, patch: Omit<Address, "id">) => Promise<Failure>;
  removeAddress: (id: string) => Promise<Failure>;
  notifications: NotificationPrefs;
  setNotifications: (patch: Partial<NotificationPrefs>) => void;
  orders: Order[];
  /** Completed orders in the current loyalty cycle (0–4). */
  loyalty: number;
  /** True for an account that has not placed any order yet. */
  fresh: boolean;
  /** True when the next submitted order is the rewarded one. */
  rewardReady: boolean;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  startDraft: (product: ProductId, patch?: Partial<Draft>) => void;
  submitDraft: (slot: string, slotShort: string, address: string) => Promise<Order | null>;
  /** Customer cancellation of a pending / confirmed order. */
  cancelOrder: (uid: string, reason: string) => Promise<Failure>;
  /** True when the signed-in account has the admin role. */
  isAdmin: boolean;
  /** Every customer account; only loaded for an admin. */
  customers: Customer[];
  /** Reloads profile, addresses and orders from the database. */
  refresh: () => Promise<void>;
  /** Admin actions on any customer's order. */
  setOrderStatus: (uid: string, status: OrderStatus) => Promise<Failure>;
  assignDriver: (uid: string, driver: string) => Promise<Failure>;
  /** Products as the operations team has them, built-in details merged in. */
  catalog: CatalogProduct[];
  /** Admin only — saves a product. For a built-in one, name, unit and limits are kept as built. */
  saveProduct: (id: ProductId, input: ProductInput) => Promise<Failure>;
  /** Admin only — adds a product; returns its id, or the problem. */
  createProduct: (input: ProductInput) => Promise<{ id: ProductId } | { problem: string }>;
  /** Admin only — deletes an added product that has no orders. */
  deleteProduct: (id: ProductId) => Promise<Failure>;
  /** Company settings, as the operations team has saved them. */
  settings: Settings;
  /** Admin only — writes the settings back to the database. */
  saveSettings: (next: Settings) => Promise<Failure>;
};

const StoreContext = createContext<Store | null>(null);

const emptyAccount: Account = {
  type: "Clinic",
  business: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  username: "",
};

const emptyDraft = (product: ProductId, addressId = "", min = 1): Draft => ({
  product,
  jar: "3L",
  qty: min,
  addressId,
  date: "",
  time: "",
  note: "",
});

/** Arguments for the product functions in the database. */
const productArgs = (input: ProductInput) => ({
  p_name_en: input.name.trim(),
  p_name_ar: input.nameAr.trim(),
  p_unit: input.unit,
  p_min: input.min,
  p_step: input.step,
  p_max: input.max,
  p_price: input.price,
  p_description: input.description.trim(),
  p_description_ar: input.descriptionAr.trim(),
  p_active: input.active,
  p_image: input.image,
  ...(input.jarPrices ? { p_jar_prices: input.jarPrices } : {}),
});

/* Database rows (snake_case) → app types */

type ProfileRow = Omit<Account, "username"> & {
  user_id: string;
  username: string | null;
  loyalty: number;
  created_at: string;
};

/** A customer account as the admin dashboard sees it. */
export type Customer = Account & { userId: string; loyalty: number };
type AddressRow = { id: string; label: string; line: string; city: string; notes: string | null };
type OrderRow = {
  id: number;
  user_id: string;
  customer: string;
  product: ProductId;
  qty: number;
  jar: JarSize | null;
  status: OrderStatus;
  address: string;
  slot: string;
  slot_short: string;
  total: number | string | null;
  note: string | null;
  driver: string | null;
  reward: boolean;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  contact_phone: string;
  opening: string;
  closing: string;
  delivery_fee: number | string;
  delivery_window: number;
  reward_every: number;
  reward_percent: number;
  notify_new_order: boolean;
  notify_cancellation: boolean;
  notify_low_stock: boolean;
};

const toSettings = (row: SettingsRow): Settings => ({
  contactPhone: row.contact_phone ?? "",
  opening: row.opening,
  closing: row.closing,
  deliveryFee: Number(row.delivery_fee),
  deliveryWindow: row.delivery_window,
  rewardEvery: row.reward_every,
  rewardPercent: row.reward_percent,
  notifyNewOrder: row.notify_new_order,
  notifyCancellation: row.notify_cancellation,
  notifyLowStock: row.notify_low_stock,
});

/** `14 Nov, 16:33` — when a finished order was delivered or cancelled. */
const closedLabel = (iso: string): string => {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
};

const toAddress = (row: AddressRow): Address => ({
  id: row.id,
  label: row.label,
  line: row.line,
  city: row.city,
  notes: row.notes ?? undefined,
});

const toOrder = (row: OrderRow): Order => ({
  uid: `o${row.id}`,
  id: row.id,
  userId: row.user_id,
  customer: row.customer,
  product: row.product,
  qty: row.qty,
  jar: row.jar ?? undefined,
  status: row.status,
  address: row.address,
  slot: row.slot,
  slotShort: row.slot_short,
  closedOn:
    row.status === "delivered" || row.status === "cancelled"
      ? closedLabel(row.updated_at)
      : undefined,
  total: row.total === null ? null : Number(row.total),
  note: row.note ?? undefined,
  driver: row.driver ?? undefined,
  reward: row.reward,
  createdAt: row.created_at,
  mine: false,
  admin: false,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading" });
  const [account, setAccountState] = useState<Account>(emptyAccount);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotificationsState] = useState<NotificationPrefs>({
    confirmation: true,
    statusUpdates: true,
    onTheWay: true,
    delivered: false,
  });
  /** Every order the account may see: its own, plus all customers' orders for an admin. */
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyalty, setLoyalty] = useState(0);
  const [draft, setDraftState] = useState<Draft>(
    emptyDraft("dry-ice", "", PRODUCTS["dry-ice"].min),
  );
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);

  /** Loads the signed-in account's profile, addresses and orders (all orders for an admin). */
  const loadCustomer = useCallback(async (userId: string, email: string) => {
    // Every read below is filtered by the signed-in account, so the access token
    // has to be in hand first. Asking for the session renews an expired one;
    // without this a stale token silently returns no rows at all.
    await neon.auth.getSession().catch(() => null);
    const read = () =>
      Promise.all([
        neon.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        neon.from("addresses").select("*").order("created_at", { ascending: true }),
        neon.from("orders").select("*").order("created_at", { ascending: false }),
        neon.rpc("is_admin"),
        neon.from("settings").select("*").eq("id", 1).maybeSingle(),
        neon.from("products").select("*"),
      ]);
    let [profile, addressRows, orderRows, admin, settingsRow, productList] = await read();
    // No profile row means the token was not accepted — the account always has one.
    // Give it one more try before showing the account as empty.
    if (!profile.data) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      [profile, addressRows, orderRows, admin, settingsRow, productList] = await read();
    }
    if (settingsRow.data) setSettings(toSettings(settingsRow.data as SettingsRow));
    if (productList.data) setProductRows(productList.data as ProductRow[]);
    const admins = admin.data === true;
    setIsAdmin(admins);
    // An admin may read every profile; a customer only sees their own row.
    setCustomers(
      admins
        ? (
            (await neon.from("profiles").select("*").order("created_at", { ascending: true }))
              .data ?? []
          ).map((p) => {
            const row = p as ProfileRow;
            return {
              userId: row.user_id,
              type: row.type,
              business: row.business,
              contact: row.contact,
              phone: row.phone,
              email: row.email,
              address: row.address,
              username: row.username ?? "",
              loyalty: row.loyalty,
            };
          })
        : [],
    );
    let row = profile.data as ProfileRow | null;
    if (!row) {
      // An account with no details row would never be able to save one, so
      // create the row now and carry on with whatever it returns.
      const repaired = await neon
        .from("profiles")
        .insert({ user_id: userId, email })
        .select("*")
        .maybeSingle();
      row = (repaired.data as ProfileRow | null) ?? null;
    }
    setAccountState(
      row
        ? {
            type: row.type,
            business: row.business,
            contact: row.contact,
            phone: row.phone,
            email: row.email,
            address: row.address,
            username: row.username ?? "",
          }
        : { ...emptyAccount, email },
    );
    setLoyalty(row?.loyalty ?? 0);
    setAddresses(((addressRows.data ?? []) as AddressRow[]).map(toAddress));
    setAllOrders(((orderRows.data ?? []) as OrderRow[]).map(toOrder));
    setSession({ status: "user", userId, email });
  }, []);

  const clearCustomer = useCallback(() => {
    setAccountState(emptyAccount);
    setAddresses([]);
    setAllOrders([]);
    setIsAdmin(false);
    setCustomers([]);
    setLoyalty(0);
    setDraftState(emptyDraft("dry-ice"));
    setSession({ status: "guest" });
  }, []);

  // Restore the session on first load.
  useEffect(() => {
    let cancelled = false;
    neon.auth
      .getSession()
      .then(async (result) => {
        if (cancelled) return;
        const user = result.data?.user;
        if (result.data?.session && user) await loadCustomer(user.id, user.email);
        else setSession({ status: "guest" });
      })
      .catch(() => {
        if (!cancelled) setSession({ status: "guest" });
      });
    return () => {
      cancelled = true;
    };
  }, [loadCustomer]);

  // Keep orders and loyalty fresh: other people change them (the admin confirms, the customer cancels).
  const activeUser = session.status === "user" ? session.userId : null;
  const activeEmail = session.status === "user" ? session.email : "";
  useEffect(() => {
    if (!activeUser) return;
    const refresh = () => {
      if (document.visibilityState === "visible")
        void loadCustomer(activeUser, activeEmail).catch(() => {});
    };
    const timer = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    // A phone freezes a background tab, so the timer above stops and "focus"
    // may never fire. Coming back to the tab always fires this one.
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [activeUser, activeEmail, loadCustomer]);

  const store = useMemo<Store>(() => {
    const orders = allOrders.map((o) => ({ ...o, mine: o.userId === activeUser, admin: isAdmin }));
    const myOrders = orders.filter((o) => o.mine);
    const rewardReady = loyalty >= settings.rewardEvery - 1;
    // Until the database answers, the built-in three are shown as built.
    const catalog: CatalogProduct[] =
      productRows.length > 0
        ? [...productRows].sort((a, b) => a.sort - b.sort).map(toCatalogProduct)
        : PRODUCT_LIST.map((product) => ({ ...product, active: true, image: null }));
    const userId = session.status === "user" ? session.userId : null;

    /** Admin change to an order, through the database function that checks the admin role. */
    const adminUpdate = async (
      uid: string,
      change: { p_status?: OrderStatus; p_driver?: string },
    ): Promise<Failure> => {
      try {
        const order = orders.find((o) => o.uid === uid);
        if (!order) return "Order not found";
        const { data, error } = await neon.rpc("admin_update_order", { p_id: order.id, ...change });
        if (error || !data) return errorMessage(error);
        const updated = toOrder(data as OrderRow);
        setAllOrders((prev) => prev.map((o) => (o.uid === uid ? updated : o)));
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    };

    return {
      session,

      signIn: async (login, password) => {
        try {
          const entered = login.trim();
          // Accounts are held by email, so a username is swapped for its email
          // first. Anything with an @ is taken as an email as typed.
          let email = entered;
          if (!entered.includes("@")) {
            const { data } = await neon.rpc("email_for_username", { p_username: entered });
            if (typeof data !== "string" || !data) return "No account with that username.";
            email = data;
          }
          const result = await neon.auth.signIn.email({ email, password });
          if (result.error || !result.data?.user) return errorMessage(result.error);
          await loadCustomer(result.data.user.id, result.data.user.email);
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      usernameFree: async (username) => {
        try {
          const { data, error } = await neon.rpc("username_available", { p_username: username });
          // On a failed check, let the unique index in the database decide.
          return error ? true : data === true;
        } catch {
          return true;
        }
      },

      signUp: async ({ password, ...input }) => {
        try {
          const profile = { ...input, username: normalizeUsername(input.username) };
          const shape = usernameProblem(profile.username);
          if (shape) return shape;
          // Checked before the account is created, so a taken username does not
          // leave an account behind. The unique index is still the real guard.
          const { data: free } = await neon.rpc("username_available", {
            p_username: profile.username,
          });
          if (free === false) return "That username is taken. Try another one.";
          // A leftover session would still own the access token the database
          // checks, so the new account's rows would be rejected. Start clean.
          await neon.auth.signOut().catch(() => {});
          const result = await neon.auth.signUp.email({
            email: profile.email,
            password,
            name: profile.business || profile.contact || profile.email,
          });
          if (result.error || !result.data?.user) return errorMessage(result.error);
          const user = result.data.user;
          const insertProfile = () =>
            neon.from("profiles").insert({ user_id: user.id, ...profile });
          let created = await insertProfile();
          if (created.error) {
            // The new session can take a moment to reach the database layer.
            await new Promise((resolve) => setTimeout(resolve, 600));
            created = await insertProfile();
          }
          if (created.error) return errorMessage(created.error);
          // The business address becomes the first saved delivery address.
          if (profile.address.trim()) {
            await neon.from("addresses").insert({
              user_id: user.id,
              label: profile.business || "Main",
              line: profile.address.trim(),
              city: "",
            });
          }
          await loadCustomer(user.id, user.email);
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      signOut: async () => {
        try {
          await neon.auth.signOut();
        } finally {
          clearCustomer();
        }
      },

      account,
      setAccount: async (patch) => {
        try {
          if (!userId) return "Not signed in";
          const next = {
            ...account,
            ...patch,
            username: normalizeUsername(patch.username ?? account.username),
          };
          if (next.username !== account.username) {
            const shape = usernameProblem(next.username);
            if (shape) return shape;
            const { data: free } = await neon.rpc("username_available", {
              p_username: next.username,
            });
            if (free === false) return "That username is taken. Try another one.";
          }
          const { error } = await neon
            .from("profiles")
            .update({
              type: next.type,
              business: next.business,
              contact: next.contact,
              phone: next.phone,
              email: next.email,
              address: next.address,
              username: next.username || null,
            })
            .eq("user_id", userId);
          if (error) return errorMessage(error);
          setAccountState(next);
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      addresses,
      addAddress: async (address) => {
        try {
          if (!userId) return null;
          const { data, error } = await neon
            .from("addresses")
            .insert({
              user_id: userId,
              label: address.label,
              line: address.line,
              city: address.city,
              notes: address.notes ?? null,
            })
            .select()
            .single();
          if (error || !data) return null;
          const created = toAddress(data as AddressRow);
          setAddresses((prev) => [...prev, created]);
          return created;
        } catch (error) {
          return null;
        }
      },
      updateAddress: async (id, patch) => {
        try {
          const { error } = await neon
            .from("addresses")
            .update({
              label: patch.label,
              line: patch.line,
              city: patch.city,
              notes: patch.notes ?? null,
            })
            .eq("id", id);
          if (error) return errorMessage(error);
          setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },
      removeAddress: async (id) => {
        try {
          const { error } = await neon.from("addresses").delete().eq("id", id);
          if (error) return errorMessage(error);
          setAddresses((prev) => prev.filter((a) => a.id !== id));
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      notifications,
      setNotifications: (patch) => setNotificationsState((prev) => ({ ...prev, ...patch })),

      isAdmin,
      customers,
      refresh: async () => {
        if (userId) await loadCustomer(userId, activeEmail).catch(() => {});
      },
      orders,
      loyalty,
      fresh: myOrders.length === 0,
      rewardReady,

      draft,
      setDraft: (patch) => setDraftState((prev) => ({ ...prev, ...patch })),
      startDraft: (product, patch) =>
        setDraftState({
          ...emptyDraft(product, addresses[0]?.id ?? "", findProduct(catalog, product).min),
          ...patch,
        }),
      submitDraft: async (slot, slotShort, address) => {
        try {
          if (!userId) return null;
          const { data, error } = await neon
            .from("orders")
            .insert({
              user_id: userId,
              customer: account.business || account.contact || account.email,
              product: draft.product,
              qty: draft.qty,
              jar: draft.product === "oxygen" ? draft.jar : null,
              address,
              slot,
              slot_short: slotShort,
              total: priceOrder(draft.product, draft.qty, draft.jar, rewardReady, settings, catalog)
                .total,
              note: draft.note || null,
              reward: rewardReady,
            })
            .select()
            .single();
          if (error || !data) return null;
          const order = toOrder(data as OrderRow);
          setAllOrders((prev) => [order, ...prev]);
          return order;
        } catch (error) {
          return null;
        }
      },

      cancelOrder: async (uid, reason) => {
        try {
          const order = myOrders.find((o) => o.uid === uid);
          if (!order) return "Order not found";
          const { error } = await neon
            .from("orders")
            .update({ status: "cancelled", cancel_reason: reason })
            .eq("id", order.id);
          if (error) return errorMessage(error);
          setAllOrders((prev) =>
            prev.map((o) => (o.uid === uid ? { ...o, status: "cancelled" } : o)),
          );
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      setOrderStatus: (uid, status) => adminUpdate(uid, { p_status: status }),
      assignDriver: (uid, driver) => adminUpdate(uid, { p_driver: driver }),

      catalog,
      saveProduct: async (id, input) => {
        try {
          const { data, error } = await neon.rpc("admin_update_product", {
            p_id: id,
            ...productArgs(input),
          });
          if (error || !data) return errorMessage(error);
          const row = data as ProductRow;
          setProductRows((prev) => [...prev.filter((r) => r.id !== row.id), row]);
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },
      createProduct: async (input) => {
        try {
          const { data, error } = await neon.rpc("admin_create_product", productArgs(input));
          if (error || !data) return { problem: errorMessage(error) };
          const row = data as ProductRow;
          setProductRows((prev) => [...prev.filter((r) => r.id !== row.id), row]);
          return { id: row.id };
        } catch (error) {
          return { problem: errorMessage(error) };
        }
      },
      deleteProduct: async (id) => {
        try {
          const { error } = await neon.rpc("admin_delete_product", { p_id: id });
          if (error) return errorMessage(error);
          setProductRows((prev) => prev.filter((r) => r.id !== id));
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      settings,
      saveSettings: async (next) => {
        try {
          const { data, error } = await neon.rpc("admin_save_settings", {
            p_contact_phone: next.contactPhone.trim(),
            p_opening: next.opening,
            p_closing: next.closing,
            p_delivery_fee: next.deliveryFee,
            p_delivery_window: next.deliveryWindow,
            p_reward_every: next.rewardEvery,
            p_reward_percent: next.rewardPercent,
            p_notify_new_order: next.notifyNewOrder,
            p_notify_cancellation: next.notifyCancellation,
            p_notify_low_stock: next.notifyLowStock,
          });
          if (error || !data) return errorMessage(error);
          setSettings(toSettings(data as SettingsRow));
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },
    };
  }, [
    session,
    settings,
    productRows,
    account,
    addresses,
    notifications,
    allOrders,
    isAdmin,
    customers,
    activeUser,
    activeEmail,
    loyalty,
    draft,
    loadCustomer,
    clearCustomer,
  ]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
