import { useEffect, useState } from "react";

/**
 * Installing H&H as an app on the phone (PWA).
 *
 * - The service worker (`public/sw.js`) is what makes the site installable and
 *   lets the app open without the browser bar. It is registered once, on the
 *   published site only — never inside the Figma Make preview, where a cached
 *   copy would hide new edits.
 * - Android / Chrome / Edge fire `beforeinstallprompt`; the event is kept so the
 *   app's own "Install" button can show the browser's install dialog.
 * - iPhone Safari has no install dialog: the customer adds the app from the
 *   Share menu, so the app shows those steps instead.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** True when the app is already running from the home screen. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad, where installing goes through Safari's Share menu. */
export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** Inside an iframe — the Figma Make preview. */
const embedded = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/** Called once from `main.tsx`, before the app renders. */
export function setUpPwa() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });

  if (!import.meta.env.PROD || embedded() || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Without the worker the site still works; it just cannot be installed.
      });
  });
}

/** What the install button needs to know. */
export function useInstall() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    /** Already opened from the home screen — nothing to install. */
    installed: isStandalone(),
    /** The browser's own install dialog is available. */
    canPrompt: deferred !== null,
    ios: isIos(),
    /** Shows the browser's install dialog; true when the customer accepted. */
    prompt: async (): Promise<boolean> => {
      if (!deferred) return false;
      const event = deferred;
      await event.prompt();
      const { outcome } = await event.userChoice;
      deferred = null;
      notify();
      return outcome === "accepted";
    },
  };
}
