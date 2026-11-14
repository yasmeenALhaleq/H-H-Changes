import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BadgeTone } from "@/components/ui";

export type AdminProduct = {
  id: string;
  name: string;
  unit: string;
  /** Proposed price; `null` while unconfirmed. */
  price: number | null;
  /** Unit shown after the price, e.g. `Kg` or `jar`. */
  per: string;
  min: string;
  step: string;
  max: string;
  description: string;
  active: boolean;
};

const seedProducts: AdminProduct[] = [
  {
    id: "dry-ice",
    name: "Dry Ice",
    unit: "Kilogram (Kg)",
    price: 1.5,
    per: "Kg",
    min: "2 Kg",
    step: "1 Kg",
    max: "100 Kg",
    description: "High-purity dry ice for medical, laboratory and cold-chain use.",
    active: true,
  },
  {
    id: "nitrogen",
    name: "Nitrogen",
    unit: "Liter (L)",
    price: null,
    per: "L",
    min: "1 L",
    step: "1 L",
    max: "50 L",
    description: "Liquid nitrogen for cryogenic storage, medical and laboratory use.",
    active: false,
  },
  {
    id: "oxygen-3l",
    name: "Oxygen 3L",
    unit: "Jar (3 L)",
    price: 18,
    per: "jar",
    min: "1 jar",
    step: "1",
    max: "10",
    description: "Medical-grade oxygen supplied in refillable jars. Choose a 3L or 8L jar.",
    active: true,
  },
  {
    id: "oxygen-8l",
    name: "Oxygen 8L",
    unit: "Jar (8 L)",
    price: 40,
    per: "jar",
    min: "1 jar",
    step: "1",
    max: "10",
    description: "Medical-grade oxygen supplied in refillable jars. Choose a 3L or 8L jar.",
    active: true,
  },
];

export type Driver = {
  name: string;
  vehicle: string;
  route: string;
  availability: "On route" | "Available" | "Off duty";
};

export const DRIVERS: Driver[] = [
  {
    name: "Driver Ahmad",
    vehicle: "Plate XX-XXXX",
    route: "#1024 · 2 stops",
    availability: "On route",
  },
  { name: "Driver Samer", vehicle: "Plate XX-XXXX", route: "None", availability: "Available" },
  { name: "Driver Lina", vehicle: "Plate XX-XXXX", route: "None", availability: "Available" },
  { name: "Driver Omar", vehicle: "Plate XX-XXXX", route: "None", availability: "Off duty" },
];

export const availabilityTone: Record<Driver["availability"], BadgeTone> = {
  "On route": "gold",
  Available: "info",
  "Off duty": "muted",
};

export type AdminCustomer = {
  id: string;
  name: string;
  type: "Doctor" | "Clinic" | "Hotel";
  orders30: number;
  lastOrder: string;
  status: "Active" | "Verifying" | "Inactive";
  spend: number;
  loyalty: number;
};

export const CUSTOMERS: AdminCustomer[] = [
  {
    id: "al-noor",
    name: "Al Noor Clinic",
    type: "Clinic",
    orders30: 6,
    lastOrder: "Today",
    status: "Active",
    spend: 96,
    loyalty: 4,
  },
  {
    id: "amman-dental",
    name: "Amman Dental",
    type: "Clinic",
    orders30: 3,
    lastOrder: "Today",
    status: "Active",
    spend: 160,
    loyalty: 4,
  },
  {
    id: "zarqa",
    name: "Zarqa Clinic",
    type: "Clinic",
    orders30: 5,
    lastOrder: "Tomorrow",
    status: "Active",
    spend: 0,
    loyalty: 2,
  },
  {
    id: "ruwaq",
    name: "Hotel Ruwaq",
    type: "Hotel",
    orders30: 4,
    lastOrder: "Sat",
    status: "Verifying",
    spend: 132,
    loyalty: 3,
  },
  {
    id: "dr-samer",
    name: "Dr. Samer Clinic",
    type: "Doctor",
    orders30: 2,
    lastOrder: "28 Oct",
    status: "Inactive",
    spend: 36,
    loyalty: 1,
  },
];

export const customerTone: Record<AdminCustomer["status"], BadgeTone> = {
  Active: "info",
  Verifying: "warn",
  Inactive: "muted",
};

export type AdminSettings = {
  opening: string;
  closing: string;
  deliveryWindow: string;
  newOrderAlerts: boolean;
  cancellationAlerts: boolean;
  lowStockAlerts: boolean;
  rewardThreshold: string;
  rewardDiscount: string;
};

const seedSettings: AdminSettings = {
  opening: "08:00",
  closing: "18:00",
  deliveryWindow: "2",
  newOrderAlerts: true,
  cancellationAlerts: true,
  lowStockAlerts: false,
  rewardThreshold: "5",
  rewardDiscount: "25",
};

type AdminState = {
  signedIn: boolean;
  setSignedIn: (value: boolean) => void;
  products: AdminProduct[];
  saveProduct: (product: AdminProduct) => void;
  settings: AdminSettings;
  saveSettings: (settings: AdminSettings) => void;
  /** Reward orders whose notification the admin has already dismissed. */
  seenRewards: string[];
  markRewardSeen: (uid: string) => void;
};

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [products, setProducts] = useState(seedProducts);
  const [settings, setSettings] = useState(seedSettings);
  const [seenRewards, setSeenRewards] = useState<string[]>([]);

  const value = useMemo<AdminState>(
    () => ({
      signedIn,
      setSignedIn,
      products,
      saveProduct: (product) =>
        setProducts((prev) =>
          prev.some((p) => p.id === product.id)
            ? prev.map((p) => (p.id === product.id ? product : p))
            : [...prev, product],
        ),
      settings,
      saveSettings: setSettings,
      seenRewards,
      markRewardSeen: (uid) =>
        setSeenRewards((prev) => (prev.includes(uid) ? prev : [...prev, uid])),
    }),
    [signedIn, products, settings, seenRewards],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
