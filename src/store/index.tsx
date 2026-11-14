import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

type Store = {
  account: Account;
  setAccount: (patch: Partial<Account>) => void;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (id: string, patch: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  notifications: NotificationPrefs;
  setNotifications: (patch: Partial<NotificationPrefs>) => void;
  orders: Order[];
  /** Completed orders in the current loyalty cycle (0–4). */
  loyalty: number;
  /** True right after sign-up: a new account with no order history yet. */
  fresh: boolean;
  /** Starts a brand-new customer account (called when sign-up completes). */
  beginFreshAccount: (patch: Partial<Account>) => void;
  /** True when the next submitted order is the rewarded one. */
  rewardReady: boolean;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  startDraft: (product: ProductId, patch?: Partial<Draft>) => void;
  submitDraft: (slot: string, slotShort: string, address: string) => Order;
  setOrderStatus: (uid: string, status: OrderStatus) => void;
  assignDriver: (uid: string, driver: string) => void;
};

const StoreContext = createContext<Store | null>(null);

const emptyDraft = (product: ProductId): Draft => ({
  product,
  jar: "3L",
  qty: PRODUCTS[product].min,
  addressId: "main",
  date: "",
  time: "",
  note: "",
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<Account>({
    type: "Clinic",
    business: "Al Noor Clinic",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });
  const [addresses, setAddresses] = useState<Address[]>([
    { id: "main", label: "Main Clinic", line: "Street, building, Amman", city: "Amman" },
    { id: "branch", label: "Second Branch", line: "Street, building, Zarqa", city: "Zarqa" },
  ]);
  const [notifications, setNotificationsState] = useState<NotificationPrefs>({
    confirmation: true,
    statusUpdates: true,
    onTheWay: true,
    delivered: false,
  });
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [loyalty, setLoyalty] = useState(4);
  const [draft, setDraftState] = useState<Draft>(emptyDraft("dry-ice"));
  const [fresh, setFresh] = useState(false);

  const store = useMemo<Store>(() => {
    const rewardReady = loyalty >= REWARD_EVERY - 1;
    return {
      account,
      setAccount: (patch) => setAccountState((prev) => ({ ...prev, ...patch })),
      addresses,
      addAddress: (address) => {
        const created = { ...address, id: `addr-${Date.now()}` };
        setAddresses((prev) => [...prev, created]);
        return created;
      },
      updateAddress: (id, patch) =>
        setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
      removeAddress: (id) => setAddresses((prev) => prev.filter((a) => a.id !== id)),
      notifications,
      setNotifications: (patch) => setNotificationsState((prev) => ({ ...prev, ...patch })),
      orders,
      loyalty,
      fresh,
      beginFreshAccount: (patch) => {
        setAccountState((prev) => ({ ...prev, ...patch }));
        setOrders((prev) => prev.filter((o) => !o.mine));
        setLoyalty(0);
        setFresh(true);
      },
      rewardReady,
      draft,
      setDraft: (patch) => setDraftState((prev) => ({ ...prev, ...patch })),
      startDraft: (product, patch) => setDraftState({ ...emptyDraft(product), ...patch }),
      submitDraft: (slot, slotShort, address) => {
        const id = Math.max(1027, ...orders.map((o) => o.id)) + 1;
        const order: Order = {
          uid: `n${id}`,
          id,
          customer: account.business,
          product: draft.product,
          qty: draft.qty,
          jar: draft.product === "oxygen" ? draft.jar : undefined,
          status: "pending",
          address,
          slot,
          slotShort,
          total: priceOrder(draft.product, draft.qty, draft.jar, rewardReady).total,
          note: draft.note || undefined,
          reward: rewardReady,
          mine: true,
          admin: true,
        };
        setOrders((prev) => [order, ...prev]);
        // Redeeming the reward starts a new 5-order cycle.
        if (rewardReady) setLoyalty(0);
        return order;
      },
      setOrderStatus: (uid, status) =>
        setOrders((prev) => prev.map((o) => (o.uid === uid ? { ...o, status } : o))),
      assignDriver: (uid, driver) =>
        setOrders((prev) => prev.map((o) => (o.uid === uid ? { ...o, driver } : o))),
    };
  }, [account, addresses, notifications, orders, loyalty, draft, fresh]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
