import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ar } from "./ar";

export type Lang = "en" | "ar";
type Vars = Record<string, string | number>;

type I18n = {
  lang: Lang;
  rtl: boolean;
  setLang: (lang: Lang) => void;
  /** Translates an English UI string; `{name}` placeholders are filled from `vars`. */
  t: (text: string, vars?: Vars) => string;
  /** Formats an amount in Jordanian dinar, e.g. `JOD 18.00` / `18.00 دينار`. */
  money: (amount: number) => string;
};

const I18nContext = createContext<I18n | null>(null);

function readStoredLang(): Lang {
  try {
    return window.localStorage.getItem("hh.lang") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem("hh.lang", lang);
    } catch {
      // Storage can be unavailable (private mode, embedded previews); the choice then lasts for the session.
    }
  }, [lang]);

  const t = useCallback(
    (text: string, vars?: Vars) => {
      const template = lang === "ar" ? (ar[text] ?? text) : text;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in vars ? String(vars[key]) : match,
      );
    },
    [lang],
  );

  const value = useMemo<I18n>(
    () => ({
      lang,
      rtl: lang === "ar",
      setLang: setLangState,
      t,
      money: (amount: number) => t("JOD {n}", { n: amount.toFixed(2) }),
    }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
