import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import {
  ChartBar,
  ClipboardText,
  Cube,
  Gear,
  Spinner,
  SquaresFour,
  Truck,
  Users,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import { Avatar, cx, LanguageSwitch } from "@/components/ui";
import { useStore } from "@/store";

const nav: Array<{ to: string; label: string; icon: Icon; end?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: SquaresFour, end: true },
  { to: "/admin/products", label: "Products", icon: Cube },
  { to: "/admin/orders", label: "Orders", icon: ClipboardText },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/deliveries", label: "Deliveries", icon: Truck },
  { to: "/admin/reports", label: "Reports", icon: ChartBar },
  { to: "/admin/settings", label: "Settings", icon: Gear },
];

/** Sidebar + routed page. Redirects to the sign-in screen when the admin is signed out. */
export function AdminLayout() {
  const { t } = useI18n();
  const { session, isAdmin, signOut } = useStore();
  if (session.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-gold">
        <Spinner size={32} className="animate-hh-spin" />
      </div>
    );
  }
  if (session.status !== "user" || !isAdmin) return <Navigate to="/admin/login" replace />;
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="flex w-60 shrink-0 flex-col gap-1 bg-surface px-4 py-7">
        <p className="px-0 text-[18px] leading-[1.5] font-bold text-ink">{t("H&H Admin")}</p>
        <p className="mb-7 text-[12px] text-ink-3">{t("Operations")}</p>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                "flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px]",
                isActive ? "bg-elevated font-semibold text-gold" : "text-ink-2",
              )
            }
          >
            <item.icon size={20} />
            {t(item.label)}
          </NavLink>
        ))}
        {/* Not in the Figma frame: the admin needs a way to end the session. */}
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-auto flex h-10 items-center rounded-[10px] px-3 text-start text-[14px] text-ink-3 hover:text-ink-2"
        >
          {t("Log out")}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

/** Top bar + content area used by every admin page. */
export function AdminPage({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-6 bg-surface px-8">
        <h1 className="truncate text-[20px] leading-[1.5] font-bold text-ink">{title}</h1>
        <div className="flex items-center gap-3">{actions}</div>
        <LanguageSwitch />
      </header>
      <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-auto px-8 pt-6 pb-8">
        {children}
      </main>
    </>
  );
}

export function AdminUser() {
  const { t } = useI18n();
  return (
    <>
      <Avatar initials="AD" size={32} />
      <span className="text-[14px] text-ink-2">{t("Admin")}</span>
    </>
  );
}

export function Panel({
  title,
  accent,
  className,
  children,
}: {
  title?: string;
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "rounded-[14px] border bg-surface",
        accent ? "border-gold" : "border-line",
        className,
      )}
    >
      {title && <h2 className="text-[18px] leading-[1.5] font-semibold text-ink">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-5">
      <span className="text-[13px] leading-5 text-ink-2">{label}</span>
      <span className="text-[28px] leading-[1.5] font-bold text-ink">{value}</span>
      <span className="text-[12px] text-ink-3">{hint}</span>
    </div>
  );
}

/**
 * Data table with equal-width columns. A cell in the last column is pushed to the
 * row end when `endLast` is set (status badges in the Figma tables).
 */
export function Table({
  columns,
  rows,
  endLast,
  onRowClick,
}: {
  columns: string[];
  rows: Array<{ key: string; cells: ReactNode[] }>;
  endLast?: boolean;
  onRowClick?: (key: string) => void;
}) {
  const grid = { gridTemplateColumns: `repeat(${columns.length}, minmax(max-content, 1fr))` };
  return (
    <div
      className="min-w-[720px] overflow-hidden rounded-[14px] border border-line bg-surface"
      role="table"
    >
      <div
        className="grid h-11 items-center gap-3 bg-elevated px-5 text-[12px] leading-[18px] font-medium text-ink-2"
        style={grid}
        role="row"
      >
        {columns.map((column) => (
          <span key={column} role="columnheader">
            {column}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          role="row"
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row.key) : undefined}
          onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row.key) : undefined}
          className={cx(
            "grid h-[52px] items-center gap-3 px-5 text-[14px] text-ink",
            onRowClick && "cursor-pointer hover:bg-elevated/50",
          )}
          style={grid}
        >
          {row.cells.map((cell, i) => (
            <span
              key={i}
              role="cell"
              className={cx(
                "whitespace-nowrap",
                endLast && i === row.cells.length - 1 && "justify-self-end",
              )}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
