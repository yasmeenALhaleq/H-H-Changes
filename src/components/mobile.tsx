import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ClipboardText,
  Cube,
  House,
  User,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import { useInstall } from "@/lib/pwa";
import { useStore } from "@/store";
import { Button, cx, LanguageSwitch } from "./ui";

/** How wide a screen's content may grow on a tablet or computer. */
export type ScreenWidth = "form" | "wide" | "auth";

const DESKTOP_WIDTH: Record<ScreenWidth, string> = {
  // Forms, details and settings read best in one comfortable column.
  form: "md:max-w-[680px]",
  // Home, products and orders spread into grids.
  wide: "md:max-w-[1120px]",
  // Sign-in, sign-up and confirmation screens sit in a centred card.
  auth: "md:my-12 md:max-w-[480px] md:overflow-hidden md:rounded-[24px] md:border md:border-line md:py-4",
};

/**
 * App shell for every customer screen.
 *
 * - **Phone** (under 768px wide): the screen fills the phone — header on top,
 *   the content scrolls, the action area and the tab bar stay at the bottom.
 * - **Tablet and computer** (768px and up): a top bar with the H&H brand, the
 *   tabs, notifications and language replaces the bottom tab bar; the page
 *   scrolls like a website and the content is centred at a readable width
 *   (`width`). The screen's own title becomes the page heading.
 */
export function Screen({
  header,
  footer,
  nav,
  bodyClassName,
  width = "form",
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  nav?: boolean;
  bodyClassName?: string;
  width?: ScreenWidth;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh justify-center bg-black md:flex-col md:justify-start md:bg-bg">
      <DesktopBar />
      <div className="relative flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-bg md:h-auto md:max-w-none md:flex-1 md:overflow-visible md:px-8">
        <div
          className={cx(
            "contents md:mx-auto md:flex md:w-full md:flex-col md:pt-8 md:pb-16",
            DESKTOP_WIDTH[width],
          )}
        >
          {header}
          <main
            className={cx(
              "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-none md:overflow-visible",
              bodyClassName,
            )}
          >
            {children}
          </main>
          {footer}
        </div>
        <InstallBanner />
        {nav && <BottomNav />}
      </div>
    </div>
  );
}

/** Top bar on tablets and computers: brand, tabs (when signed in), notifications, language. */
function DesktopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { session } = useStore();
  const signedIn = session.status === "user";
  return (
    <header className="sticky top-0 z-20 hidden h-[72px] shrink-0 border-b border-line bg-surface/95 backdrop-blur md:block">
      <div className="mx-auto flex h-full max-w-[1120px] items-center gap-4 px-6 lg:gap-8 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(signedIn ? "/home" : "/")}
          className="flex shrink-0 items-center gap-3"
        >
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-gold-gradient text-[13px] font-bold text-bg">
            H&amp;H
          </span>
          <span className="hidden text-[17px] font-semibold whitespace-nowrap text-ink lg:inline">
            {t("H&H Company")}
          </span>
        </button>
        {signedIn && (
          <nav className="flex min-w-0 flex-1 items-center gap-1">
            {tabs.map((tab) => {
              const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
              return (
                <button
                  key={tab.to}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => navigate(tab.to)}
                  className={cx(
                    "flex h-10 items-center gap-2 rounded-full px-3 text-[14px] whitespace-nowrap transition-colors lg:px-4",
                    active
                      ? "bg-gold font-semibold text-bg"
                      : "font-medium text-ink-2 hover:bg-elevated hover:text-ink",
                  )}
                >
                  <tab.icon size={20} />
                  {t(tab.label)}
                </button>
              );
            })}
          </nav>
        )}
        <div className="ms-auto flex items-center gap-3">
          <LanguageSwitch />
          {signedIn && (
            <IconButton
              icon={Bell}
              label={t("Notifications")}
              onClick={() => navigate("/profile/notifications")}
            />
          )}
        </div>
      </div>
    </header>
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
    <header
      className={cx(
        "flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg px-4",
        // On a computer the top bar carries the brand and the bell; a title becomes the page heading.
        brand
          ? "md:hidden"
          : "md:mb-2 md:h-auto md:border-0 md:bg-transparent md:px-6 md:pt-0 md:pb-2",
      )}
    >
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
          brand ? "text-[16px]" : "text-[17px] md:text-[28px] md:font-bold",
        )}
      >
        {brand ? t("H&H Company") : title}
      </h1>
      {bell && (
        <span className="md:hidden">
          <IconButton
            icon={Bell}
            label={t("Notifications")}
            onClick={() => navigate("/profile/notifications")}
          />
        </span>
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
        "flex shrink-0 flex-col gap-3 px-6 pt-3.5 pb-8 md:pt-4 md:pb-0",
        surface && "bg-surface md:bg-transparent",
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
    <nav className="flex h-[84px] shrink-0 items-center justify-between border-t border-line bg-surface px-3 pt-2 pb-3 md:hidden">
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

/* ------------------------------------------------------------------ */
/* Install banner                                                      */
/* ------------------------------------------------------------------ */

/** Screens where the install card may show — the main ones, never mid-order or mid-form. */
const BANNER_SCREENS = ["/", "/login", "/signup", "/home", "/products", "/orders", "/profile"];
const DISMISS_KEY = "hh.installBannerClosed";
/** After the customer closes the card, it stays away this long. */
const DISMISS_DAYS = 3;

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * "H&H on your phone" card, shown on every phone and computer until the app is
 * installed. Where the browser has its own install dialog (Android, Chrome,
 * Edge) the button opens it; elsewhere (iPhone, Safari, Firefox) it opens the
 * steps screen.
 */
export function InstallBanner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const install = useInstall();
  const [closed, setClosed] = useState(dismissedRecently);

  if (install.installed || closed || !BANNER_SCREENS.includes(pathname)) return null;

  const close = () => {
    setClosed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Without storage the card is hidden until the page reloads.
    }
  };

  const act = async () => {
    if (install.canPrompt) {
      if (await install.prompt()) setClosed(true);
      return;
    }
    navigate("/install");
  };

  return (
    <aside
      aria-label={t("H&H on your phone")}
      className="mx-4 mb-3 flex shrink-0 flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_8px_30px_rgba(0,0,0,0.45)] md:fixed md:end-6 md:bottom-6 md:z-30 md:m-0 md:w-[360px]"
    >
      <div className="flex items-start gap-3">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          className="size-12 shrink-0 rounded-[12px] border border-line"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] leading-6 font-bold text-ink">{t("H&H on your phone")}</span>
          <span className="text-[13px] leading-5 text-ink-2">
            {t("Open the app from your home screen")}
          </span>
        </div>
        <button
          type="button"
          aria-label={t("Close")}
          onClick={close}
          className="-m-1 shrink-0 p-1 text-ink-3 hover:text-ink"
        >
          <X size={20} />
        </button>
      </div>
      <Button size="md" full onClick={() => void act()}>
        {install.canPrompt ? t("Install the app") : t("How to install")}
      </Button>
    </aside>
  );
}
