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

export type ProductId = "dry-ice" | "nitrogen" | "oxygen";
export type JarSize = "3L" | "8L";

export type Product = {
  id: ProductId;
  name: string;
  /** Short unit used next to quantities. */
  unit: "kg" | "L";
  unitLong: string;
  /** Proposed price per unit; `null` while the company has not confirmed one. */
  price: number | null;
  min: number;
  step: number;
  max: number;
  /** Default quantity on the product details screen. */
  detailQty: number;
  description: string;
};

/** Delivery is included in the proposed prices, so no separate fee is added to totals. */
export const DELIVERY_FEE = 0;
export const JAR_PRICE: Record<JarSize, number> = { "3L": 18, "8L": 40 };
export const REWARD_EVERY = 5;
export const REWARD_PERCENT = 25;

export const PRODUCTS: Record<ProductId, Product> = {
  "dry-ice": {
    id: "dry-ice",
    name: "Dry Ice",
    unit: "kg",
    unitLong: "Kilogram (kg)",
    price: 1.5,
    min: 2,
    step: 1,
    max: 100,
    detailQty: 5,
    description: "High-purity dry ice for medical, laboratory and cold-chain use. Sold by weight.",
  },
  nitrogen: {
    id: "nitrogen",
    name: "Nitrogen",
    unit: "L",
    unitLong: "Liter (L)",
    price: null,
    min: 1,
    step: 1,
    max: 50,
    detailQty: 25,
    description: "Liquid nitrogen for cryogenic storage, medical and laboratory use.",
  },
  oxygen: {
    id: "oxygen",
    name: "Oxygen",
    unit: "L",
    unitLong: "Jar (3L / 8L)",
    price: 6,
    min: 3,
    step: 1,
    max: 40,
    detailQty: 3,
    description: "Medical-grade oxygen supplied in refillable jars. Choose a 3L or 8L jar.",
  },
};

export const PRODUCT_LIST: Product[] = [PRODUCTS["dry-ice"], PRODUCTS.nitrogen, PRODUCTS.oxygen];

/** Price per unit for a product, taking the oxygen jar size into account. */
export function unitPrice(product: ProductId, jar: JarSize = "3L"): number | null {
  if (product === "oxygen") return JAR_PRICE[jar] / Number.parseInt(jar, 10);
  return PRODUCTS[product].price;
}

export type Pricing = {
  unit: number | null;
  subtotal: number | null;
  discount: number;
  total: number | null;
};

export function priceOrder(
  product: ProductId,
  qty: number,
  jar: JarSize = "3L",
  reward = false,
): Pricing {
  const unit = unitPrice(product, jar);
  if (unit === null) return { unit, subtotal: null, discount: 0, total: null };
  const subtotal = unit * qty;
  const gross = subtotal + DELIVERY_FEE;
  const discount = reward ? (gross * REWARD_PERCENT) / 100 : 0;
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
};

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
  signIn: (email: string, password: string) => Promise<Failure>;
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
};

const StoreContext = createContext<Store | null>(null);

const emptyAccount: Account = {
  type: "Clinic",
  business: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
};

const emptyDraft = (product: ProductId, addressId = ""): Draft => ({
  product,
  jar: "3L",
  qty: PRODUCTS[product].min,
  addressId,
  date: "",
  time: "",
  note: "",
});

/* Database rows (snake_case) → app types */

type ProfileRow = Account & { user_id: string; loyalty: number; created_at: string };

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
  const [draft, setDraftState] = useState<Draft>(emptyDraft("dry-ice"));

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
      ]);
    let [profile, addressRows, orderRows, admin] = await read();
    // No profile row means the token was not accepted — the account always has one.
    // Give it one more try before showing the account as empty.
    if (!profile.data) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      [profile, addressRows, orderRows, admin] = await read();
    }
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
    const rewardReady = loyalty >= REWARD_EVERY - 1;
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

      signIn: async (email, password) => {
        try {
          const result = await neon.auth.signIn.email({ email, password });
          if (result.error || !result.data?.user) return errorMessage(result.error);
          await loadCustomer(result.data.user.id, result.data.user.email);
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      signUp: async ({ password, ...profile }) => {
        try {
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
          const next = { ...account, ...patch };
          const { error } = await neon
            .from("profiles")
            .update({
              type: next.type,
              business: next.business,
              contact: next.contact,
              phone: next.phone,
              email: next.email,
              address: next.address,
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
        setDraftState({ ...emptyDraft(product, addresses[0]?.id ?? ""), ...patch }),
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
              total: priceOrder(draft.product, draft.qty, draft.jar, rewardReady).total,
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
    };
  }, [
    session,
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
