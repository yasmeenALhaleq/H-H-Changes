import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BadgeTone } from "@/components/ui";
import type { DriverStatus } from "@/store";

/** Badge colour for a driver's status: on the road = gold, free = blue, away = grey. */
export const driverTone: Record<DriverStatus, BadgeTone> = {
  on_route: "gold",
  available: "info",
  on_leave: "muted",
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
