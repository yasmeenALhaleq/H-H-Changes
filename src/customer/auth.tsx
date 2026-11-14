import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, EnvelopeSimple } from "@phosphor-icons/react";
import logo from "@/assets/hh-logo.png";
import { useI18n } from "@/i18n";
import { useStore, type CustomerType } from "@/store";
import { Footer, MobileHeader, Screen } from "@/components/mobile";
import { Button, Chips, cx, Input, LanguageSwitch, LinkButton, RadioDot } from "@/components/ui";

const PHONE_MASK = "+962 7X XXX XXXX";

function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="H&H"
      width={240}
      height={90}
      className={cx("h-[90px] w-60 rounded-[12px] object-cover", className)}
    />
  );
}

/* Auth — Welcome */
export function Welcome() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  return (
    <Screen
      header={<MobileHeader brand />}
      bodyClassName="justify-center gap-6 px-6 pt-8 pb-6"
      footer={
        <Footer surface={false} className="pt-4">
          <Button full onClick={() => navigate("/login")}>
            {t("Login")}
          </Button>
          <Button full variant="outline" onClick={() => navigate("/signup")}>
            {t("Sign Up")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-[300px] shrink-0 items-center justify-center rounded-[20px] border border-line bg-surface">
        <Logo />
      </div>
      <h1 className="text-[26px] leading-[1.25] font-bold text-ink">
        {t("Medical gases & dry ice, delivered to your door")}
      </h1>
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Order Oxygen, Nitrogen and Dry Ice for your clinic, hotel or practice.")}
      </p>
      <div dir="ltr" className="flex items-center gap-3 self-start text-[12px] text-ink-3">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={cx(lang === "en" && "text-gold")}
        >
          EN
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={() => setLang("ar")}
          className={cx("font-arabic text-[14px]", lang === "ar" && "text-gold")}
        >
          العربية
        </button>
      </div>
    </Screen>
  );
}

/* Login — Customer (Mobile) */
export function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Screen bodyClassName="relative px-6 pt-14 pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[210px] left-1/2 size-[420px] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgb(221 193 74 / 0.16) 0%, rgb(221 193 74 / 0) 70%)",
        }}
      />
      <div className="relative flex justify-end">
        <LanguageSwitch />
      </div>
      <div className="relative mt-7 flex justify-center">
        <Logo />
      </div>
      <div className="relative mt-10 flex flex-col gap-2">
        <h1 className="text-[32px] font-bold text-ink">{t("Welcome Back")}</h1>
        <p className="text-[15px] leading-[1.5] text-ink-2">
          {t("Sign in to your account to continue")}
        </p>
      </div>
      <form
        className="relative mt-8 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/home");
        }}
      >
        <Input
          label={t("Email or Phone Number")}
          icon={EnvelopeSimple}
          placeholder={t("Enter your email or phone")}
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
        />
        <Input
          label={t("Password")}
          type="password"
          placeholder={t("Enter your password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <LinkButton className="self-end text-[13px]" onClick={() => navigate("/forgot")}>
          {t("Forgot Password?")}
        </LinkButton>
        <Button full type="submit">
          {t("Login")}
        </Button>
      </form>
      <div className="relative mt-auto flex items-center justify-center gap-2 pt-8 text-[14px]">
        <span className="text-ink-2">{t("Don't have an account?")}</span>
        <LinkButton onClick={() => navigate("/signup")}>{t("Sign Up")}</LinkButton>
      </div>
    </Screen>
  );
}

const customerTypes: CustomerType[] = ["Doctor", "Clinic", "Hotel"];

/* Auth — Sign Up (1/2) and (2/2) */
export function SignUp() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { beginFreshAccount } = useStore();
  const [params, setParams] = useSearchParams();
  const step = params.get("step") === "2" ? 2 : 1;
  const [form, setForm] = useState({
    type: "Clinic" as CustomerType,
    business: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const createAccount = () => {
    beginFreshAccount({ ...form, business: form.business.trim() || "Clinic Name" });
    navigate("/verify-method");
  };

  return (
    <Screen
      header={<MobileHeader title={t("Create Account")} back />}
      bodyClassName="gap-5 px-6 pt-6 pb-3"
      footer={
        <Footer surface={false} className="pt-4">
          {step === 1 ? (
            <>
              <Button full onClick={() => setParams({ step: "2" })}>
                {t("Next")}
              </Button>
              <div className="flex justify-center gap-1.5 text-[14px]">
                <span className="text-ink-2">{t("Already have an account?")}</span>
                <LinkButton onClick={() => navigate("/login")}>{t("Login")}</LinkButton>
              </div>
            </>
          ) : (
            <Button full disabled={mismatch} onClick={createAccount}>
              {t("Create Account")}
            </Button>
          )}
        </Footer>
      }
    >
      {step === 1 ? (
        <>
          <p className="text-[13px] leading-5 text-ink-2">{t("Step 1 of 2 — Business details")}</p>
          <p className="text-[14px] font-medium text-ink">{t("Customer Type")}</p>
          <Chips
            value={form.type}
            onChange={(type) => set({ type })}
            options={customerTypes.map((value) => ({ value, label: t(value) }))}
          />
          <Input
            label={t("Business / Organization Name")}
            placeholder={t("Enter business or organization name")}
            value={form.business}
            onChange={(e) => set({ business: e.target.value })}
          />
          <Input
            label={t("Contact Person")}
            placeholder={t("Enter full name")}
            value={form.contact}
            onChange={(e) => set({ contact: e.target.value })}
          />
          <p className="text-[13px] leading-5 text-ink-2">
            {t(
              "This information is collected once and can be edited later from Profile & Settings.",
            )}
          </p>
        </>
      ) : (
        <>
          <p className="text-[13px] leading-5 text-ink-2">{t("Step 2 of 2 — Contact & address")}</p>
          <Input
            label={t("Phone Number")}
            type="tel"
            dir="ltr"
            placeholder={PHONE_MASK}
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
          <Input
            label={t("Email")}
            type="email"
            placeholder={t("Enter your email")}
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
          />
          <Input
            label={t("Business Address")}
            placeholder={t("Street, building, city")}
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
          />
          <Input
            label={t("Password")}
            type="password"
            placeholder={t("Create a password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label={t("Confirm Password")}
            type="password"
            placeholder={t("Re-enter your password")}
            value={confirm}
            error={mismatch && t("Password does not match")}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </>
      )}
    </Screen>
  );
}

/* Auth — Verification Method */
export function VerifyMethod() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { account } = useStore();
  const [method, setMethod] = useState<"sms" | "email">("sms");
  const options = [
    { id: "sms" as const, title: t("Phone (SMS)"), detail: account.phone || PHONE_MASK },
    { id: "email" as const, title: t("Email"), detail: account.email || "name@example.com" },
  ];
  return (
    <Screen
      header={<MobileHeader title={t("Verify Your Account")} back />}
      bodyClassName="gap-3 px-6 pt-6 pb-3"
      footer={
        <Footer surface={false} className="pt-4">
          <Button full onClick={() => navigate(`/otp?via=${method}`)}>
            {t("Send Code")}
          </Button>
        </Footer>
      }
    >
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Choose how you want to receive your verification code.")}
      </p>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={method === o.id}
          onClick={() => setMethod(o.id)}
          className={cx(
            "flex items-center gap-3.5 rounded-[14px] border bg-surface p-4 text-start",
            method === o.id ? "border-gold" : "border-line",
          )}
        >
          <RadioDot checked={method === o.id} />
          <span className="flex flex-col gap-0.5">
            <span className="text-[16px] leading-6 font-semibold text-ink">{o.title}</span>
            <span dir="ltr" className="text-start text-[13px] leading-5 text-ink-2">
              {o.detail}
            </span>
          </span>
        </button>
      ))}
    </Screen>
  );
}

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  const label = `00:${String(left).padStart(2, "0")}`;
  return { left, label, restart: () => setLeft(seconds) };
}

/* Auth — OTP Verification and Auth — Verify Code (password reset) */
export function Otp({ mode }: { mode: "signup" | "reset" }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { account } = useStore();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const countdown = useCountdown(30);
  const complete = digits.every(Boolean);

  const setDigit = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "").slice(-1);
    setDigits((prev) => prev.map((d, i) => (i === index ? value : d)));
    if (value && index < 3) inputs.current[index + 1]?.focus();
  };

  return (
    <Screen
      header={
        <MobileHeader title={t(mode === "signup" ? "Verify Your Number" : "Verify Code")} back />
      }
      bodyClassName="items-center gap-5 px-6 pt-8 pb-3"
      footer={
        <Footer surface={false} className="pt-4">
          <Button
            full
            disabled={!complete}
            onClick={() => navigate(mode === "signup" ? "/verified" : "/new-password")}
          >
            {t("Verify")}
          </Button>
        </Footer>
      }
    >
      <p className="self-stretch text-[15px] leading-[1.5] text-ink-2">
        {mode === "signup"
          ? t("Enter the 4-digit code sent to {to}.", { to: account.phone || PHONE_MASK })
          : t("Enter the 4-digit code we sent to your selected phone number or email.")}
      </p>
      <div dir="ltr" className="flex justify-center gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            aria-label={`Digit ${i + 1}`}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digit && i > 0) inputs.current[i - 1]?.focus();
            }}
            className="h-[72px] w-16 rounded-[14px] border border-line bg-surface text-center text-[28px] font-bold text-ink focus:border-gold"
          />
        ))}
      </div>
      {countdown.left > 0 ? (
        <p className="text-[14px] text-ink-2">
          {t("Resend code in {time}", { time: countdown.label })}
        </p>
      ) : (
        <LinkButton className="text-[14px]" onClick={countdown.restart}>
          {t("Resend code")}
        </LinkButton>
      )}
      <LinkButton className="text-[14px]" onClick={() => navigate(-1)}>
        {t(mode === "signup" ? "Change method (Phone / Email)" : "Wrong email or phone? Change")}
      </LinkButton>
    </Screen>
  );
}

/* Auth — Account Verified and Auth — Password Updated */
export function AuthSuccess({ kind }: { kind: "verified" | "password" }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const verified = kind === "verified";
  return (
    <Screen
      bodyClassName="items-stretch justify-center gap-[26px] p-6"
      footer={
        <Footer surface={false} className="pt-4">
          <Button full onClick={() => navigate(verified ? "/home" : "/login")}>
            {t(verified ? "Go to Home" : "Back to Login")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-24 items-center justify-center rounded-full bg-gold text-bg">
        <Check size={24} />
      </div>
      <h1 className="text-center text-[26px] leading-[1.5] font-bold text-ink">
        {t(verified ? "Account Verified" : "Password Updated")}
      </h1>
      <p className="text-center text-[15px] leading-[1.5] text-ink-2">
        {t(
          verified
            ? "Your account has been created successfully. Welcome aboard!"
            : "You can now log in with your new password.",
        )}
      </p>
    </Screen>
  );
}

/* Auth — Forgot Password */
export function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [method, setMethod] = useState<"Phone" | "Email">("Phone");
  const [value, setValue] = useState("");
  return (
    <Screen
      header={<MobileHeader title={t("Forgot Password")} back />}
      bodyClassName="gap-5 px-6 pt-6 pb-3"
      footer={
        <Footer surface={false} className="pt-4">
          <Button full onClick={() => navigate("/verify-code")}>
            {t("Send Reset Code")}
          </Button>
          <LinkButton className="justify-center text-[14px]" onClick={() => navigate("/login")}>
            {t("Back to Login")}
          </LinkButton>
        </Footer>
      }
    >
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Choose where to receive the reset code, then enter your phone number or email.")}
      </p>
      <Chips
        value={method}
        onChange={(next) => {
          setMethod(next);
          setValue("");
        }}
        options={[
          { value: "Phone", label: t("Phone") },
          { value: "Email", label: t("Email") },
        ]}
      />
      {method === "Phone" ? (
        <Input
          label={t("Phone Number")}
          type="tel"
          dir="ltr"
          placeholder={PHONE_MASK}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <Input
          label={t("Email")}
          type="email"
          placeholder={t("Enter your email")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
    </Screen>
  );
}

/* Auth — New Password */
export function NewPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const rules = [
    { label: "• At least 8 characters", ok: password.length >= 8 },
    { label: "• At least one number", ok: /\d/.test(password) },
    { label: "• Both passwords must match", ok: password.length > 0 && password === confirm },
  ];
  return (
    <Screen
      header={<MobileHeader title={t("New Password")} back />}
      bodyClassName="gap-5 px-6 pt-6 pb-3"
      footer={
        <Footer surface={false} className="pt-4">
          <Button
            full
            disabled={!rules.every((r) => r.ok)}
            onClick={() => navigate("/password-updated")}
          >
            {t("Reset Password")}
          </Button>
        </Footer>
      }
    >
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Create a new password for your account.")}
      </p>
      <Input
        label={t("New Password")}
        type="password"
        placeholder={t("Enter new password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <Input
        label={t("Confirm New Password")}
        type="password"
        placeholder={t("Re-enter new password")}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-4">
        <p className="text-[14px] font-medium text-ink">{t("Password must have:")}</p>
        {rules.map((rule) => (
          <p
            key={rule.label}
            className={cx("text-[13px] leading-5", rule.ok ? "text-ok" : "text-ink-2")}
          >
            {t(rule.label)}
          </p>
        ))}
      </div>
    </Screen>
  );
}
