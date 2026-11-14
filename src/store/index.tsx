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
  /** Unique key; several seeded rows share a public order number between the two apps. */
  uid: string;
  id: number;
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
  /** Shown in the customer app. */
  mine: boolean;
  /** Shown in the admin dashboard. */
  admin: boolean;
};

/** Demo rows for the admin dashboard, until it reads live orders from the database. */
const seedOrders: Order[] = [
  {
    uid: "c1024",
    id: 1024,
    customer: "Al Noor Clinic",
    product: "dry-ice",
    qty: 10,
    status: "on_the_way",
    address: "Abdoun, Amman",
    slot: "Today · 14:00 – 16:00",
    slotShort: "Today 14–16",
    total: 15,
    driver: "Driver Ahmad",
    mine: true,
    admin: true,
  },
  {
    uid: "c1025",
    id: 1025,
    customer: "Al Noor Clinic",
    product: "nitrogen",
    qty: 40,
    status: "confirmed",
    address: "Abdoun, Amman",
    slot: "Tomorrow · 09:00 – 11:00",
    slotShort: "Tomorrow 09–11",
    total: null,
    mine: true,
    admin: false,
  },
  {
    uid: "c1026",
    id: 1026,
    customer: "Al Noor Clinic",
    product: "oxygen",
    qty: 6,
    jar: "3L",
    status: "pending",
    address: "Abdoun, Amman",
    slot: "Fri · 12:00 – 14:00",
    slotShort: "Fri 12–14",
    total: 36,
    mine: true,
    admin: false,
  },
  {
    uid: "a1025",
    id: 1025,
    customer: "Zarqa Clinic",
    product: "nitrogen",
    qty: 40,
    status: "confirmed",
    address: "Street, building, Zarqa",
    slot: "Tomorrow · 09:00 – 11:00",
    slotShort: "Tomorrow 09–11",
    total: null,
    mine: false,
    admin: true,
  },
  {
    uid: "a1026",
    id: 1026,
    customer: "Amman Dental",
    product: "oxygen",
    qty: 16,
    jar: "8L",
    status: "pending",
    address: "Abdoun, Amman",
    slot: "Friday, 12:00 – 14:00",
    slotShort: "Fri 12–14",
    total: 60,
    note: "Use the back entrance",
    reward: true,
    mine: false,
    admin: true,
  },
  {
    uid: "a1027",
    id: 1027,
    customer: "Hotel Ruwaq",
    product: "dry-ice",
    qty: 20,
    status: "pending",
    address: "Street, building, Amman",
    slot: "Sat 10–12",
    slotShort: "Sat 10–12",
    total: 30,
    mine: false,
    admin: true,
  },
  {
    uid: "c1019",
    id: 1019,
    customer: "Al Noor Clinic",
    product: "dry-ice",
    qty: 15,
    status: "delivered",
    address: "Abdoun, Amman",
    slot: "28 Oct, 11:20",
    slotShort: "28 Oct",
    closedOn: "28 Oct, 11:20",
    total: 22.5,
    mine: true,
    admin: true,
  },
  {
    uid: "a1017",
    id: 1017,
    customer: "Zarqa Clinic",
    product: "nitrogen",
    qty: 30,
    status: "delivered",
    address: "Street, building, Zarqa",
    slot: "21 Oct, 10:05",
    slotShort: "21 Oct",
    closedOn: "21 Oct, 10:05",
    total: null,
    driver: "Driver Samer",
    mine: false,
    admin: true,
  },
  {
    uid: "c1017",
    id: 1017,
    customer: "Al Noor Clinic",
    product: "nitrogen",
    qty: 30,
    status: "delivered",
    address: "Abdoun, Amman",
    slot: "21 Oct, 10:05",
    slotShort: "21 Oct",
    closedOn: "21 Oct, 10:05",
    total: null,
    mine: true,
    admin: false,
  },
  {
    uid: "c1012",
    id: 1012,
    customer: "Al Noor Clinic",
    product: "dry-ice",
    qty: 5,
    status: "cancelled",
    address: "Abdoun, Amman",
    slot: "15 Oct",
    slotShort: "15 Oct",
    closedOn: "15 Oct",
    total: 7.5,
    mine: true,
    admin: false,
  },
  {
    uid: "c1010",
    id: 1010,
    customer: "Al Noor Clinic",
    product: "dry-ice",
    qty: 10,
    status: "delivered",
    address: "Abdoun, Amman",
    slot: "14 Oct, 13:00",
    slotShort: "14 Oct",
    closedOn: "14 Oct, 13:00",
    total: 15,
    mine: true,
    admin: false,
  },
  {
    uid: "c1004",
    id: 1004,
    customer: "Al Noor Clinic",
    product: "oxygen",
    qty: 16,
    jar: "8L",
    status: "delivered",
    address: "Abdoun, Amman",
    slot: "07 Oct, 09:40",
    slotShort: "07 Oct",
    closedOn: "07 Oct, 09:40",
    total: 80,
    mine: true,
    admin: false,
  },
];

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
  /** Admin demo actions (local only for now). */
  setOrderStatus: (uid: string, status: OrderStatus) => void;
  assignDriver: (uid: string, driver: string) => void;
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

type ProfileRow = Account & { user_id: string; loyalty: number };
type AddressRow = { id: string; label: string; line: string; city: string; notes: string | null };
type OrderRow = {
  id: number;
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
  customer: row.customer,
  product: row.product,
  qty: row.qty,
  jar: row.jar ?? undefined,
  status: row.status,
  address: row.address,
  slot: row.slot,
  slotShort: row.slot_short,
  closedOn: row.status === "delivered" || row.status === "cancelled" ? row.slot_short : undefined,
  total: row.total === null ? null : Number(row.total),
  note: row.note ?? undefined,
  driver: row.driver ?? undefined,
  reward: row.reward,
  mine: true,
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
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>(
    seedOrders.filter((o) => o.admin).map((o) => ({ ...o, mine: false })),
  );
  const [loyalty, setLoyalty] = useState(0);
  const [draft, setDraftState] = useState<Draft>(emptyDraft("dry-ice"));

  /** Loads the signed-in customer's profile, addresses and orders. */
  const loadCustomer = useCallback(async (userId: string, email: string) => {
    const [profile, addressRows, orderRows] = await Promise.all([
      neon.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      neon.from("addresses").select("*").order("created_at", { ascending: true }),
      neon.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    const row = profile.data as ProfileRow | null;
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
    setMyOrders(((orderRows.data ?? []) as OrderRow[]).map(toOrder));
    setSession({ status: "user", userId, email });
  }, []);

  const clearCustomer = useCallback(() => {
    setAccountState(emptyAccount);
    setAddresses([]);
    setMyOrders([]);
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

  const store = useMemo<Store>(() => {
    const rewardReady = loyalty >= REWARD_EVERY - 1;
    const userId = session.status === "user" ? session.userId : null;

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
          const result = await neon.auth.signUp.email({
            email: profile.email,
            password,
            name: profile.business || profile.contact || profile.email,
          });
          if (result.error || !result.data?.user) return errorMessage(result.error);
          const user = result.data.user;
          const created = await neon.from("profiles").insert({ user_id: user.id, ...profile });
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

      orders: [...myOrders, ...adminOrders],
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
          setMyOrders((prev) => [order, ...prev]);
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
          setMyOrders((prev) =>
            prev.map((o) => (o.uid === uid ? { ...o, status: "cancelled" } : o)),
          );
          return null;
        } catch (error) {
          return errorMessage(error);
        }
      },

      setOrderStatus: (uid, status) =>
        setAdminOrders((prev) => prev.map((o) => (o.uid === uid ? { ...o, status } : o))),
      assignDriver: (uid, driver) =>
        setAdminOrders((prev) => prev.map((o) => (o.uid === uid ? { ...o, driver } : o))),
    };
  }, [
    session,
    account,
    addresses,
    notifications,
    myOrders,
    adminOrders,
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
