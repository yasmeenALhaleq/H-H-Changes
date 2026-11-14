import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ClipboardText,
  Cube,
  House,
  User,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import { cx } from "./ui";

/**
 * Phone-sized app shell. On wide viewports the customer app is shown as a centred
 * 390 × 844 device column, matching the Figma frames; on phones it fills the screen.
 */
export function Screen({
  header,
  footer,
  nav,
  bodyClassName,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  nav?: boolean;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg sm:my-auto sm:h-[844px] sm:max-h-dvh sm:max-w-[390px] sm:rounded-[28px] sm:border sm:border-line">
        {header}
        <main
          className={cx("no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto", bodyClassName)}
        >
          {children}
        </main>
        {footer}
        {nav && <BottomNav />}
      </div>
    </div>
  );
}

export function IconButton({
  icon: ButtonIcon,
  label,
  onClick,
  size = 36,
  flip,
}: {
  icon: Icon;
  label: string;
  onClick?: () => void;
  size?: 36 | 44;
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        "flex shrink-0 items-center justify-center border border-line bg-elevated text-ink",
        size === 44 ? "size-11 rounded-[10px]" : "size-9 rounded-[8px]",
      )}
    >
      <ButtonIcon size={24} className={flip ? "rtl:-scale-x-100" : undefined} />
    </button>
  );
}

export function MobileHeader({
  title,
  back,
  brand,
  bell,
}: {
  title?: string;
  /** `true` goes back in history; a path navigates there instead. */
  back?: boolean | string;
  brand?: boolean;
  bell?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg px-4">
      {back && (
        <IconButton
          icon={ArrowLeft}
          label="Back"
          flip
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
        />
      )}
      {brand && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-gold-gradient text-[12px] font-bold text-bg">
          H&amp;H
        </span>
      )}
      <h1
        className={cx(
          "min-w-0 flex-1 truncate font-semibold text-ink",
          brand ? "text-[16px]" : "text-[17px]",
        )}
      >
        {brand ? t("H&H Company") : title}
      </h1>
      {bell && (
        <IconButton
          icon={Bell}
          label={t("Notifications")}
          onClick={() => navigate("/profile/notifications")}
        />
      )}
    </header>
  );
}

/** Sticky action area at the bottom of a screen. */
export function Footer({
  surface = true,
  className,
  children,
}: {
  surface?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <footer
      className={cx(
        "flex shrink-0 flex-col gap-3 px-6 pt-3.5 pb-8",
        surface && "bg-surface",
        className,
      )}
    >
      {children}
    </footer>
  );
}

const tabs: Array<{ to: string; label: string; icon: Icon; match: string[] }> = [
  { to: "/home", label: "Home", icon: House, match: ["/home"] },
  { to: "/products", label: "Products", icon: Cube, match: ["/products", "/order"] },
  { to: "/orders", label: "My Orders", icon: ClipboardText, match: ["/orders"] },
  { to: "/profile", label: "Profile", icon: User, match: ["/profile"] },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <nav className="flex h-[84px] shrink-0 items-center justify-between border-t border-line bg-surface px-3 pt-2 pb-3">
      {tabs.map((tab) => {
        const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
        return (
          <button
            key={tab.to}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(tab.to)}
            className="flex h-14 w-20 flex-col items-center justify-center gap-1"
          >
            <span
              className={cx(
                "flex h-[30px] w-[52px] items-center justify-center rounded-full",
                active ? "bg-gold text-ink" : "text-ink-3",
              )}
            >
              <tab.icon size={24} />
            </span>
            <span
              className={cx(
                "text-[11px]",
                active ? "font-semibold text-gold" : "font-medium text-ink-3",
              )}
            >
              {t(tab.label)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
