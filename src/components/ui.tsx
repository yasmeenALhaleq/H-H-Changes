import { useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import {
  CalendarCheck,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  Eye,
  EyeSlash,
  Minus,
  Plus,
  Truck,
  XCircle,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import { STATUS_LABEL, type OrderStatus } from "@/store";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "outline" | "danger" | "neutral";
type ButtonSize = "lg" | "md" | "sm";

const buttonSize: Record<ButtonSize, string> = {
  lg: "h-[52px] rounded-[12px] px-7 gap-2.5 text-[16px]",
  md: "h-11 rounded-[10px] px-6 gap-2 text-[14px]",
  sm: "h-9 rounded-[8px] px-4 gap-1.5 text-[13px]",
};

const buttonVariant: Record<ButtonVariant, string> = {
  primary: "bg-gold-gradient text-bg",
  outline: "border border-gold text-gold",
  danger: "border border-err text-err",
  neutral: "border border-line bg-elevated text-ink",
};

export function Button({
  variant = "primary",
  size = "lg",
  full,
  className,
  disabled,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cx(
        "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-opacity active:opacity-80",
        buttonSize[size],
        disabled ? "bg-elevated text-ink-3" : buttonVariant[variant],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx("inline-flex items-center gap-1.5 font-medium text-gold", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const fieldBox =
  "w-full rounded-[10px] border border-line bg-bg px-3.5 text-[14px] text-ink transition-shadow focus-within:border-gold focus-within:ring-[1.5px] focus-within:ring-gold";

export function Field({
  label,
  error,
  icon: LeadIcon,
  className,
  children,
}: {
  label?: string;
  error?: string | false;
  icon?: Icon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      {label && <span className="text-[13px] font-medium text-ink-2">{label}</span>}
      <span
        className={cx(
          fieldBox,
          "flex min-h-11 items-center gap-2.5",
          error && "border-err ring-[1.5px] ring-err",
        )}
      >
        {LeadIcon && <LeadIcon size={24} className="shrink-0 text-ink-2" />}
        {children}
      </span>
      {error && <span className="text-[12px] text-err">{error}</span>}
    </label>
  );
}

const bareInput = "h-11 min-w-0 flex-1 bg-transparent text-[14px] text-ink";

export function Input({
  label,
  error,
  icon,
  wrapClassName,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | false;
  icon?: Icon;
  wrapClassName?: string;
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  // A password is typed blind, so every password field carries its own
  // show / hide control. The field itself stays an ordinary input.
  const isPassword = rest.type === "password";
  return (
    <Field label={label} error={error} icon={icon} className={wrapClassName}>
      <input {...rest} type={isPassword && shown ? "text" : rest.type} className={bareInput} />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShown((prev) => !prev)}
          aria-label={t(shown ? "Hide password" : "Show password")}
          title={t(shown ? "Hide password" : "Show password")}
          className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-[8px] text-ink-3 hover:text-ink"
        >
          {shown ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
      )}
    </Field>
  );
}

export function TextArea({
  label,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <Field label={label}>
      <textarea
        className="h-24 min-w-0 flex-1 resize-none bg-transparent py-3 text-[14px] text-ink"
        {...rest}
      />
    </Field>
  );
}

export function Select({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(bareInput, "appearance-none", !value && "text-ink-3")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Radio({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label?: ReactNode;
  onChange?: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2.5 text-start"
    >
      <span
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-full bg-elevated",
          checked ? "border-[1.5px] border-gold" : "border border-line",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-gold-gradient" />}
      </span>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </button>
  );
}

/** Bordered row that hosts a radio option (cancel reasons, language, verification method). */
export function OptionCard({
  checked,
  onChange,
  className,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className={cx(
        "flex w-full items-center rounded-[14px] border bg-surface p-3.5 text-start",
        checked ? "border-gold" : "border-line",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={cx(
        "flex size-5 shrink-0 items-center justify-center rounded-full bg-elevated",
        checked ? "border-[1.5px] border-gold" : "border border-line",
      )}
    >
      {checked && <span className="size-2.5 rounded-full bg-gold-gradient" />}
    </span>
  );
}

export function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5"
    >
      <span
        className={cx(
          "flex size-5 items-center justify-center rounded-[6px]",
          checked ? "bg-gold-gradient text-bg" : "border border-line bg-elevated",
        )}
      >
        {checked && <Check size={14} weight="bold" />}
      </span>
      <span className="text-[14px] text-ink">{label}</span>
    </button>
  );
}

export function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-start"
    >
      <span
        className={cx(
          "flex h-6 w-11 shrink-0 items-center rounded-full p-[3px] transition-colors",
          checked ? "justify-end bg-gold-gradient" : "justify-start border border-line bg-elevated",
        )}
      >
        <span className={cx("size-[18px] rounded-full", checked ? "bg-bg" : "bg-ink")} />
      </span>
      <span className="text-[14px] text-ink">{label}</span>
    </button>
  );
}

/** Pill chips (customer type, jar size, reset method). */
export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "h-9 rounded-full border px-4 text-[14px]",
              active
                ? "border-gold bg-gold font-semibold text-bg"
                : "border-line font-medium text-ink-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs (My Orders, admin order filters). */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}) {
  return (
    <div className={cx("flex", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "h-11 border-b-2 px-3 text-[14px]",
              active
                ? "border-gold font-semibold text-gold"
                : "border-transparent font-medium text-ink-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div className="flex h-11 w-[146px] shrink-0 items-center overflow-hidden rounded-[10px] border border-line bg-elevated">
      <button
        type="button"
        aria-label="Decrease"
        disabled={atMin}
        onClick={() => onChange(Math.max(min, value - step))}
        className={cx(
          "flex size-11 items-center justify-center",
          atMin ? "text-ink-3" : "text-ink",
        )}
      >
        <Minus size={20} />
      </button>
      <span className="flex h-full w-14 items-center justify-center bg-bg text-[16px] font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        disabled={atMax}
        onClick={() => onChange(Math.min(max, value + step))}
        className={cx(
          "flex size-11 items-center justify-center",
          atMax ? "text-ink-3" : "text-ink",
        )}
      >
        <Plus size={20} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Display                                                             */
/* ------------------------------------------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-[14px] border border-line bg-surface", className)}>{children}</div>
  );
}

export function KeyValue({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-1.5 text-[14px]">
      <span className="min-w-0 text-ink-2">{label}</span>
      <span className="shrink-0 text-end font-semibold text-ink">{value}</span>
    </div>
  );
}

export function Avatar({ initials, size = 56 }: { initials: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gold-gradient font-bold text-bg"
      style={{ width: size, height: size, fontSize: size >= 56 ? 20 : size >= 40 ? 14 : 12 }}
    >
      {initials}
    </span>
  );
}

const statusStyle: Record<OrderStatus, { bg: string; icon: Icon }> = {
  on_the_way: { bg: "bg-gold", icon: Truck },
  confirmed: { bg: "bg-info", icon: CalendarCheck },
  pending: { bg: "bg-warn", icon: Clock },
  delivered: { bg: "bg-ok", icon: CheckCircle },
  cancelled: { bg: "bg-err", icon: XCircle },
};

/** Large status pill with icon, used on customer order cards. */
export function StatusPill({ status, label }: { status: OrderStatus; label?: string }) {
  const { t } = useI18n();
  const { bg, icon: StatusIcon } = statusStyle[status];
  return (
    <span
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full ps-2.5 pe-3 text-bg",
        bg,
      )}
    >
      <StatusIcon size={24} />
      <span className="text-[12px] font-semibold">{label ?? t(STATUS_LABEL[status])}</span>
    </span>
  );
}

export type BadgeTone = "gold" | "info" | "warn" | "ok" | "err" | "muted";

const badgeTone: Record<BadgeTone, string> = {
  gold: "bg-gold",
  info: "bg-info",
  warn: "bg-warn",
  ok: "bg-ok",
  err: "bg-err",
  muted: "bg-ink-2",
};

export const statusTone: Record<OrderStatus, BadgeTone> = {
  on_the_way: "gold",
  confirmed: "info",
  pending: "warn",
  delivered: "ok",
  cancelled: "err",
};

/** Compact text badge used in admin tables and notes. */
export function Badge({
  tone,
  icon: BadgeIcon,
  children,
}: {
  tone: BadgeTone;
  icon?: Icon;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-full ps-2 pe-2.5 text-[11px] font-semibold whitespace-nowrap text-bg",
        BadgeIcon ? "h-8" : "h-[21px]",
        badgeTone[tone],
      )}
    >
      {BadgeIcon && <BadgeIcon size={24} />}
      {children}
    </span>
  );
}

export function ListRow({
  icon: RowIcon,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon: Icon;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[12px] border border-line bg-surface px-4 py-3 text-start"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-elevated text-gold">
        <RowIcon size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-ink">{title}</span>
        {subtitle && <span className="text-[13px] text-ink-2">{subtitle}</span>}
      </span>
      {trailing}
      <CaretRight size={24} className="shrink-0 text-ink-3 rtl:-scale-x-100" />
    </button>
  );
}

export function EmptyState({
  icon: StateIcon,
  title,
  body,
  action,
  compact,
}: {
  icon: Icon;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-[16px] border border-dashed border-line bg-surface text-center",
        compact ? "gap-2.5 p-6" : "gap-4 p-10",
      )}
    >
      <span
        className={cx(
          "flex items-center justify-center rounded-full",
          compact ? "size-14 bg-elevated text-gold" : "size-20 bg-gold text-bg",
        )}
      >
        <StateIcon size={24} />
      </span>
      <p className={cx("font-semibold text-ink", compact ? "text-[16px]" : "text-[20px]")}>
        {title}
      </p>
      <p className="text-[14px] text-ink-2">{body}</p>
      {action}
    </div>
  );
}

export function TimelineStep({
  state,
  title,
  time,
  last,
}: {
  state: "done" | "current" | "todo";
  title: string;
  time: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex w-6 shrink-0 flex-col items-center">
        {state === "done" ? (
          <span className="flex size-6 items-center justify-center rounded-full bg-gold-gradient text-bg">
            <Check size={14} weight="bold" />
          </span>
        ) : (
          <span
            className={cx(
              "flex size-6 items-center justify-center rounded-full border-2 bg-surface",
              state === "current" ? "border-gold" : "border-line",
            )}
          >
            {state === "current" && <span className="size-2 rounded-full bg-gold-gradient" />}
          </span>
        )}
        {!last && <span className={cx("w-0.5 flex-1", state === "done" ? "bg-gold" : "bg-line")} />}
      </div>
      <div className={cx("flex flex-col gap-0.5", !last && "pb-6")}>
        <span
          className={cx("text-[15px] font-semibold", state === "todo" ? "text-ink-3" : "text-ink")}
        >
          {title}
        </span>
        <span className="text-[13px] text-ink-2">{time}</span>
      </div>
    </div>
  );
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const item = (code: "en" | "ar", label: string) => (
    <button
      type="button"
      aria-pressed={lang === code}
      onClick={() => setLang(code)}
      className={cx(
        "flex h-8 items-center rounded-full px-4 text-[13px]",
        lang === code ? "bg-gold-gradient font-semibold text-bg" : "font-medium text-ink-2",
        code === "ar" && "font-arabic",
      )}
    >
      {label}
    </button>
  );
  return (
    <div
      dir="ltr"
      className={cx(
        "inline-flex h-10 items-center gap-1 rounded-full border border-line bg-elevated p-1",
        className,
      )}
    >
      {item("en", "EN")}
      {item("ar", "عربي")}
    </div>
  );
}
