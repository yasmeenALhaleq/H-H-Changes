import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BadgeTone } from "@/components/ui";

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

/**
 * Company settings live in the database and are reached through the main store
 * (`useStore().settings` / `saveSettings`), so every customer sees the same
 * values. This provider only holds what has not been moved there yet.
 */
type AdminState = {
  /** Reward orders whose notification the admin has already dismissed. */
  seenRewards: string[];
  markRewardSeen: (uid: string) => void;
};

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [seenRewards, setSeenRewards] = useState<string[]>([]);

  const value = useMemo<AdminState>(
    () => ({
      seenRewards,
      markRewardSeen: (uid) =>
        setSeenRewards((prev) => (prev.includes(uid) ? prev : [...prev, uid])),
    }),
    [seenRewards],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
