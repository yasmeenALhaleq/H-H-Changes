import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Clock,
  DeviceMobile,
  DotsThreeVertical,
  Export,
  Globe,
  MapPin,
  Phone,
  PlusSquare,
  Question,
  Users,
} from "@phosphor-icons/react";
import { useI18n, type Lang } from "@/i18n";
import { usernameProblem, useStore, type CustomerType, type NotificationPrefs } from "@/store";
import { initials } from "@/store/format";
import { callCompany, canCall, whatsappCompany } from "@/lib/company";
import { useInstall } from "@/lib/pwa";
import { Footer, MobileHeader, Screen } from "@/components/mobile";
import {
  Avatar,
  Button,
  Card,
  Chips,
  Input,
  LinkButton,
  ListRow,
  OptionCard,
  RadioDot,
  Toggle,
} from "@/components/ui";

/* Profile & Settings */
export function Profile() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { account, addresses, signOut } = useStore();
  const install = useInstall();
  // Where the browser offers its own install dialog, use it; otherwise show the steps.
  const openInstall = async () => {
    if (!install.canPrompt || !(await install.prompt())) navigate("/install");
  };
  return (
    <Screen
      nav
      header={<MobileHeader title={t("Profile")} />}
      bodyClassName="gap-3 px-6 pt-4 pb-3"
      footer={
        <Footer surface={false} className="pt-2 pb-0">
          <Button
            full
            variant="outline"
            onClick={() => void signOut().then(() => navigate("/", { replace: true }))}
          >
            {t("Log out")}
          </Button>
        </Footer>
      }
    >
      <div className="flex items-center gap-3.5 pt-2 pb-4">
        <Avatar initials={initials(account.business || "H H")} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[18px] font-bold text-ink">
            {t(account.business || "Clinic Name")}
          </span>
          <span className="text-[13px] text-ink-2">{t("Customer account · Amman")}</span>
        </div>
      </div>
      <ListRow
        icon={Users}
        title={t("Business details")}
        subtitle={t("Clinic name, tax ID and contact person")}
        onClick={() => navigate("/profile/business")}
      />
      <ListRow
        icon={MapPin}
        title={t("Saved delivery addresses")}
        subtitle={t("{n} addresses", { n: addresses.length })}
        onClick={() => navigate("/profile/addresses")}
      />
      <ListRow
        icon={Bell}
        title={t("Notifications")}
        subtitle={t("Order updates and delivery alerts")}
        onClick={() => navigate("/profile/notifications")}
      />
      <ListRow
        icon={Globe}
        title={t("Language")}
        subtitle={t("App language")}
        trailing={
          <span className="shrink-0 text-[15px] font-semibold text-gold">
            {lang === "ar" ? "العربية" : "English"}
          </span>
        }
        onClick={() => navigate("/profile/language")}
      />
      <ListRow
        icon={Question}
        title={t("Help & contact")}
        subtitle={t("Call or WhatsApp our team")}
        onClick={() => navigate("/profile/help")}
      />
      {!install.installed && (
        <ListRow
          icon={DeviceMobile}
          title={t("Install the app")}
          subtitle={t("Add H&H to your phone's home screen")}
          onClick={() => void openInstall()}
        />
      )}
    </Screen>
  );
}

const customerTypes: CustomerType[] = ["Doctor", "Clinic", "Hotel"];

/* Profile — Business Information */
export function BusinessInformation() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { account, setAccount } = useStore();
  const [form, setForm] = useState(account);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setFailure(null);
  };
  const usernameIssue = form.username.length > 0 ? usernameProblem(form.username) : null;

  const save = async () => {
    setBusy(true);
    const result = await setAccount({
      ...form,
      business: form.business.trim() || account.business,
      username: form.username.trim(),
    });
    setBusy(false);
    if (result) setFailure(result);
    else navigate(-1);
  };

  return (
    <Screen
      header={<MobileHeader title={t("Business Information")} back />}
      bodyClassName="gap-3.5 px-6 py-4"
      footer={
        <Footer>
          {failure && <p className="mb-2 text-[13px] text-err">{failure}</p>}
          <Button full disabled={busy || !!usernameIssue} onClick={() => void save()}>
            {busy ? t("Saving…") : t("Save Changes")}
          </Button>
        </Footer>
      }
    >
      <p className="text-[14px] font-medium text-ink">{t("Customer Type")}</p>
      <Chips
        value={form.type}
        onChange={(type) => set({ type })}
        options={customerTypes.map((value) => ({ value, label: t(value) }))}
      />
      <Input
        label={t("Business / Organization Name")}
        placeholder={t("Clinic Name")}
        value={form.business}
        onChange={(e) => set({ business: e.target.value })}
      />
      <Input
        label={t("Contact Person")}
        placeholder={t("Full name")}
        value={form.contact}
        onChange={(e) => set({ contact: e.target.value })}
      />
      <Input
        label={t("Phone Number")}
        type="tel"
        dir="ltr"
        placeholder="+962 7X XXX XXXX"
        value={form.phone}
        onChange={(e) => set({ phone: e.target.value })}
      />
      <Input
        label={t("Email")}
        type="email"
        placeholder="name@example.com"
        value={form.email}
        onChange={(e) => set({ email: e.target.value })}
      />
      <Input
        label={t("Username")}
        dir="ltr"
        autoComplete="username"
        placeholder={t("Choose a username to sign in with")}
        value={form.username}
        error={usernameIssue ? t(usernameIssue) : false}
        onChange={(e) => set({ username: e.target.value.toLowerCase() })}
      />
      <Input
        label={t("Business Address")}
        placeholder={t("Street, building, city")}
        value={form.address}
        onChange={(e) => set({ address: e.target.value })}
      />
    </Screen>
  );
}

/* Profile — Saved Delivery Addresses */
export function SavedAddresses() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addresses, removeAddress } = useStore();
  return (
    <Screen
      header={<MobileHeader title={t("Saved Addresses")} back />}
      bodyClassName="gap-3 px-6 py-4"
      footer={
        <Footer>
          <Button full onClick={() => navigate("/addresses/new")}>
            {t("Add New Address")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-[120px] shrink-0 items-center justify-center rounded-[16px] border border-line bg-surface text-gold">
        <MapPin size={32} />
      </div>
      {addresses.map((address) => (
        <Card key={address.id} className="flex flex-col gap-2 p-3.5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">{t(address.label)}</h2>
          <p className="text-[13px] leading-5 text-ink-2">{t(address.line)}</p>
          <div className="flex gap-4 text-[14px]">
            <LinkButton onClick={() => navigate(`/addresses/new?edit=${address.id}`)}>
              {t("Edit")}
            </LinkButton>
            <LinkButton
              disabled={addresses.length === 1}
              className="disabled:text-ink-3"
              onClick={() => void removeAddress(address.id)}
            >
              {t("Delete")}
            </LinkButton>
          </div>
        </Card>
      ))}
    </Screen>
  );
}

const notificationRows: Array<{ key: keyof NotificationPrefs; label: string }> = [
  { key: "confirmation", label: "Order confirmation" },
  { key: "statusUpdates", label: "Order status updates" },
  { key: "onTheWay", label: "Delivery on the way" },
  { key: "delivered", label: "Order delivered" },
];

/* Profile — Notifications */
export function NotificationSettings() {
  const { t } = useI18n();
  const { notifications, setNotifications } = useStore();
  return (
    <Screen
      header={<MobileHeader title={t("Notifications")} back />}
      bodyClassName="gap-3 px-6 py-4"
    >
      {notificationRows.map((row) => (
        <Card key={row.key} className="p-3.5">
          <Toggle
            checked={notifications[row.key]}
            label={t(row.label)}
            onChange={(next) => setNotifications({ [row.key]: next })}
          />
        </Card>
      ))}
    </Screen>
  );
}

/* Profile — Language (English) / (Arabic, RTL) */
export function LanguageSettings() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [choice, setChoice] = useState<Lang>(lang);
  return (
    <Screen
      header={<MobileHeader title={t("Language")} back />}
      bodyClassName="gap-3 px-6 py-4"
      footer={
        <Footer>
          <Button
            full
            onClick={() => {
              setLang(choice);
              navigate(-1);
            }}
          >
            {t("Apply")}
          </Button>
        </Footer>
      }
    >
      <div className="flex flex-col gap-3" role="radiogroup">
        <OptionCard checked={choice === "en"} onChange={() => setChoice("en")} className="gap-2.5">
          <RadioDot checked={choice === "en"} />
          <span className="text-[14px] text-ink">English</span>
        </OptionCard>
        <OptionCard checked={choice === "ar"} onChange={() => setChoice("ar")} className="gap-2.5">
          <RadioDot checked={choice === "ar"} />
          <span className="font-arabic text-[14px] leading-[30px] text-ink">العربية</span>
        </OptionCard>
      </div>
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Selecting Arabic switches the app to right-to-left layout.")}
      </p>
    </Screen>
  );
}

/* Profile — Help & Contact */
export function HelpContact() {
  const { t } = useI18n();
  const { settings } = useStore();
  const phone = settings.contactPhone.trim();
  const reachable = canCall(phone);
  return (
    <Screen
      header={<MobileHeader title={t("Help & Contact")} back />}
      bodyClassName="gap-3 px-6 py-4"
      footer={
        <Footer>
          <Button full disabled={!reachable} onClick={() => callCompany(phone)}>
            {t("Call Us")}
          </Button>
        </Footer>
      }
    >
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Need help with an order? Reach us directly.")}
      </p>
      <ListRow
        icon={Phone}
        title={t("Phone")}
        subtitle={reachable ? phone : t("Number not set yet")}
        onClick={reachable ? () => callCompany(phone) : undefined}
      />
      <ListRow
        icon={Phone}
        title={t("WhatsApp")}
        subtitle={t("Chat with our team")}
        onClick={reachable ? () => whatsappCompany(phone) : undefined}
      />
      <ListRow
        icon={Clock}
        title={t("Working hours")}
        subtitle={`${settings.opening} – ${settings.closing}`}
      />
    </Screen>
  );
}

/* Install the app — steps for phones without an install dialog (iPhone) */
export function InstallApp() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const install = useInstall();
  const steps = install.ios
    ? [
        { icon: Export, text: t("Open this page in Safari, then tap the Share button.") },
        { icon: PlusSquare, text: t("Scroll down and tap “Add to Home Screen”.") },
        { icon: DeviceMobile, text: t("Tap “Add”. H&H now opens from its icon, like any app.") },
      ]
    : [
        { icon: DotsThreeVertical, text: t("Open this page in Chrome, then tap the ⋮ menu.") },
        { icon: PlusSquare, text: t("Tap “Install app” or “Add to Home screen”.") },
        { icon: DeviceMobile, text: t("Confirm. H&H now opens from its icon, like any app.") },
      ];
  return (
    <Screen
      header={<MobileHeader title={t("Install the app")} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          {install.canPrompt ? (
            <Button full onClick={() => void install.prompt().then((ok) => ok && navigate(-1))}>
              {t("Install now")}
            </Button>
          ) : (
            <Button full variant="outline" onClick={() => navigate(-1)}>
              {t("Done")}
            </Button>
          )}
        </Footer>
      }
    >
      {install.installed ? (
        <Card className="p-4 text-[15px] leading-[1.5] text-ink">
          {t("H&H is already installed on this phone.")}
        </Card>
      ) : (
        <>
          <p className="text-[15px] leading-[1.5] text-ink-2">
            {t(
              "Add H&H to your home screen to order in one tap. It opens full screen, without the browser bar.",
            )}
          </p>
          <Card className="flex flex-col gap-4 p-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-elevated text-gold">
                  <step.icon size={22} />
                </span>
                <span className="pt-2 text-[14px] leading-[1.5] text-ink">
                  {i + 1}. {step.text}
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
