import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Plus, Trash } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import {
  canCancel,
  isActive,
  priceOrder,
  PRICED_BY_JAR,
  STATUS_LABEL,
  UNIT_LONG,
  useStore,
  type CatalogProduct,
  type Order,
  type OrderStatus,
  type ProductInput,
  type Settings,
  type Unit,
} from "@/store";
import { useOrderText, useProductText } from "@/store/format";
import { imageProblemText, imageToDataUrl } from "@/lib/image";
import {
  Badge,
  Button,
  cx,
  Field,
  Input,
  KeyValue,
  LanguageSwitch,
  Select,
  statusTone,
  Tabs,
  TextArea,
  Toggle,
} from "@/components/ui";
import { AdminPage, AdminUser, Panel, Stat, Table } from "./layout";
import { availabilityTone, DRIVERS, useAdmin } from "./data";

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge tone={statusTone[status]}>{t(STATUS_LABEL[status])}</Badge>;
}

function useAdminOrders(): Order[] {
  const { orders } = useStore();
  return useMemo(() => orders.filter((o) => o.admin), [orders]);
}

/* Admin — Login / Login (Error) */
export function AdminLogin() {
  const { t } = useI18n();
  const { session, isAdmin, signIn, signOut } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailBad = !/^\S+@\S+\.\S+$/.test(email);
  const passwordBad = password.length < 6;
  // Signed in with a customer account that is not an admin.
  const notAdmin = session.status === "user" && !isAdmin;

  if (session.status === "user" && isAdmin) return <Navigate to="/admin" replace />;

  const submit = async () => {
    if (emailBad || passwordBad) {
      setFailed(true);
      return;
    }
    setBusy(true);
    if (session.status === "user") await signOut();
    const failure = await signIn(email.trim(), password);
    setBusy(false);
    setFailed(Boolean(failure));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <form
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-[20px] border border-line bg-surface p-8"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <span className="flex size-11 items-center justify-center rounded-[12px] bg-gold text-[12px] font-bold text-bg">
          H&amp;H
        </span>
        <h1 className="text-[24px] leading-[1.5] font-bold text-ink">{t("Admin Sign In")}</h1>
        <p className="text-[14px] text-ink-2">{t("Operations team access only.")}</p>
        {notAdmin && !failed && (
          <p
            role="alert"
            className="rounded-[12px] border border-err bg-err-bg p-3 text-[14px] text-err"
          >
            {t("This account does not have admin access.")}
          </p>
        )}
        {failed && (
          <p
            role="alert"
            className="rounded-[12px] border border-err bg-err-bg p-3 text-[14px] text-err"
          >
            {t("Email or password is incorrect. Try again.")}
          </p>
        )}
        <Input
          label={t("Email")}
          type="email"
          placeholder="name@company.com"
          value={email}
          error={failed && emailBad && t("Check the email address")}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <Input
          label={t("Password")}
          type="password"
          placeholder={t("Enter your password")}
          value={password}
          error={failed && passwordBad && t("Password does not match")}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button full type="submit" disabled={busy}>
          {t(busy ? "Loading…" : "Sign In")}
        </Button>
        <LanguageSwitch className="self-start" />
      </form>
    </div>
  );
}

const todayLabel = (lang: string) =>
  new Intl.DateTimeFormat(lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

function BarChart({
  bars,
}: {
  bars: Array<{ label: string; height: number; highlight?: boolean }>;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-[180px] items-end justify-between gap-4">
      {bars.map((bar) => (
        <span
          key={bar.label}
          title={t(bar.label)}
          aria-label={t(bar.label)}
          className={cx("w-12 rounded-[8px]", bar.highlight ? "bg-gold" : "bg-line")}
          style={{ height: bar.height }}
        />
      ))}
    </div>
  );
}

function useOrderColumns() {
  const { t } = useI18n();
  const text = useOrderText();
  return (order: Order) => [
    `#${order.id}`,
    t(order.customer),
    text.bullet(order),
    t(order.slotShort),
  ];
}

/* Admin — Dashboard Overview */
export function Dashboard() {
  const navigate = useNavigate();
  const { t, money, lang } = useI18n();
  const orders = useAdminOrders();
  const columns = useOrderColumns();
  const active = orders.filter(isActive);
  const todayKey = new Date().toDateString();
  const today = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Orders placed on each of the last six days.
  const week = Array.from({ length: 6 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (5 - i));
    return {
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      count: orders.filter((o) => new Date(o.createdAt).toDateString() === day.toDateString())
        .length,
    };
  });
  const peak = Math.max(1, ...week.map((d) => d.count));
  const weekBars = week.map((day) => ({
    label: day.label,
    height: Math.round((day.count / peak) * 140),
    highlight: day.count === peak && day.count > 0,
  }));

  return (
    <AdminPage
      title={t("Dashboard Overview")}
      actions={<span className="text-[14px] text-ink-2">{todayLabel(lang)}</span>}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label={t("Orders today")}
          value={String(today.length)}
          hint={t("New orders placed today")}
        />
        <Stat
          label={t("Pending confirmation")}
          value={String(orders.filter((o) => o.status === "pending").length)}
          hint={t("Needs your action")}
        />
        <Stat
          label={t("On the way")}
          value={String(orders.filter((o) => o.status === "on_the_way").length)}
          hint={t("Out for delivery")}
        />
        <Stat
          label={t("Revenue (proposed)")}
          value={money(revenue)}
          hint={t("Pricing not final")}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">
            {t("Orders by status (this week)")}
          </h2>
          <BarChart bars={weekBars} />
        </Panel>
        <Panel className="flex flex-col gap-3 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">
            {t("Driver availability")}
          </h2>
          {DRIVERS.map((driver) => (
            <div
              key={driver.name}
              className="flex items-center justify-between text-[14px] text-ink"
            >
              {t(driver.name)}
              <Badge tone={availabilityTone[driver.availability]}>{t(driver.availability)}</Badge>
            </div>
          ))}
        </Panel>
      </div>
      <Table
        endLast
        columns={[t("Order"), t("Customer"), t("Product"), t("Slot"), t("Status")]}
        rows={active.slice(0, 4).map((order) => ({
          key: order.uid,
          cells: [...columns(order), <StatusBadge key="s" status={order.status} />],
        }))}
        onRowClick={(uid) => navigate(`/admin/orders/${uid}`)}
      />
    </AdminPage>
  );
}

/* Admin — Products Management */
export function AdminProducts() {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const names = useProductText();
  const { catalog } = useStore();
  return (
    <AdminPage
      title={t("Products")}
      actions={
        <div className="flex items-center gap-4">
          <Button size="sm" onClick={() => navigate("/admin/products/new")}>
            <Plus size={18} />
            {t("Add product")}
          </Button>
          <AdminUser />
        </div>
      }
    >
      <Table
        endLast
        columns={[
          t("Product"),
          t("Image"),
          t("Unit"),
          t("Price"),
          t("Min order"),
          t("Step"),
          t("Status"),
        ]}
        rows={catalog.map((product) => ({
          key: product.id,
          cells: [
            names.name(product),
            product.image ? (
              <img
                key="i"
                src={product.image}
                alt=""
                className="size-10 rounded-[8px] border border-line object-cover"
              />
            ) : (
              <span key="i" className="text-ink-3">
                —
              </span>
            ),
            names.unitLong(product),
            product.price === null
              ? t("To be confirmed")
              : t("{a} / {u}", { a: money(product.price), u: names.unit(product) }),
            `${product.min} ${names.unit(product)}`,
            `${product.step} ${names.unit(product)}`,
            <Badge key="s" tone={product.active ? "muted" : "warn"}>
              {t(product.active ? "Active" : "Hidden")}
            </Badge>,
          ],
        }))}
        onRowClick={(id) => navigate(`/admin/products/${id}`)}
      />
      <p className="text-[13px] leading-5 text-ink-3">
        {t("Prices shown are proposed and not final until confirmed by the company.")}
      </p>
    </AdminPage>
  );
}

const UNITS: Unit[] = ["kg", "L", "pcs"];

/** Whole numbers only, for the order limits. */
const wholeNumber = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/** The editor's starting values: the product as saved, or an empty new one. */
function formFrom(product: CatalogProduct | undefined) {
  return {
    name: product?.name ?? "",
    nameAr: product?.nameAr ?? "",
    unit: (product?.unit ?? "kg") as Unit,
    min: String(product?.min ?? 1),
    step: String(product?.step ?? 1),
    max: String(product?.max ?? 100),
    price: product?.price?.toFixed(2) ?? "",
    description: product?.description ?? "",
    descriptionAr: product?.descriptionAr ?? "",
    active: product?.active ?? true,
    image: product?.image ?? null,
  };
}

/* Admin — Add / Edit Product */
export function ProductEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { t, money, lang } = useI18n();
  const names = useProductText();
  const { catalog, saveProduct, createProduct, deleteProduct, orders } = useStore();
  const product = isNew ? undefined : catalog.find((p) => p.id === id);

  const [form, setForm] = useState(() => formFrom(product));
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isNew && !product) return <Navigate to="/admin/products" replace />;

  // The built-in three keep their name, unit and order limits; the order screens depend on them.
  const locked = Boolean(product?.builtIn);
  const byJar = product ? PRICED_BY_JAR.includes(product.id) : false;
  const hasOrders = product ? orders.some((o) => o.product === product.id) : false;

  const parsedPrice = form.price.trim() === "" ? null : Number.parseFloat(form.price);
  const priceBroken = parsedPrice !== null && !(Number.isFinite(parsedPrice) && parsedPrice >= 0);
  const min = Number.parseInt(form.min, 10);
  const step = Number.parseInt(form.step, 10);
  const max = Number.parseInt(form.max, 10);
  const limitsBroken =
    !locked &&
    (!(min >= 1) || !(step >= 1) || !(max >= 1)
      ? "Enter whole numbers of 1 or more."
      : max < min
        ? "The maximum must be at least the minimum."
        : null);
  const nameMissing = !locked && form.name.trim() === "";

  const input: ProductInput = {
    name: form.name,
    nameAr: form.nameAr,
    unit: form.unit,
    min: locked && product ? product.min : min,
    step: locked && product ? product.step : step,
    max: locked && product ? product.max : max,
    price: byJar && product ? product.price : parsedPrice,
    description: form.description,
    descriptionAr: form.descriptionAr,
    active: form.active,
    image: form.image,
  };
  const start = formFrom(product);
  const dirty =
    isNew || (Object.keys(start) as (keyof typeof start)[]).some((k) => start[k] !== form[k]);
  const blocked = priceBroken || Boolean(limitsBroken) || nameMissing;

  const change = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setFailure(null);
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setWorking(true);
    const result = await imageToDataUrl(file);
    setWorking(false);
    if ("problem" in result) setFailure(t(imageProblemText[result.problem]));
    else change({ image: result.dataUrl });
  };

  const save = async () => {
    setBusy(true);
    if (isNew) {
      const result = await createProduct(input);
      setBusy(false);
      if ("problem" in result) setFailure(result.problem);
      else navigate(`/admin/products/${result.id}`, { replace: true });
      return;
    }
    const result = await saveProduct(product!.id, input);
    setBusy(false);
    setFailure(result);
    setSaved(result === null);
  };

  const remove = async () => {
    setBusy(true);
    const result = await deleteProduct(product!.id);
    setBusy(false);
    if (result) {
      setFailure(result);
      setConfirmDelete(false);
    } else navigate("/admin/products", { replace: true });
  };

  const unitShort = t(form.unit);
  const displayName =
    (lang === "ar" && form.nameAr.trim()) ||
    (locked && product ? names.name(product) : form.name.trim());

  return (
    <AdminPage
      title={
        isNew
          ? t("Add Product")
          : t("Edit Product — {name}", { name: product ? names.name(product) : "" })
      }
      actions={<AdminUser />}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title={t("Product details")} className="flex flex-col gap-4 p-6">
          {locked && product ? (
            <Field label={t("Product name")}>
              <span className="flex h-11 items-center text-ink">{names.name(product)}</span>
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("Product name (English)")}
                placeholder="e.g. Carbon Dioxide"
                value={form.name}
                maxLength={60}
                error={nameMissing && !isNew && t("Enter the product name.")}
                onChange={(e) => change({ name: e.target.value })}
              />
              <Input
                label={t("Product name (Arabic)")}
                placeholder="مثال: ثاني أكسيد الكربون"
                dir="rtl"
                value={form.nameAr}
                maxLength={60}
                onChange={(e) => change({ nameAr: e.target.value })}
              />
            </div>
          )}
          {locked && product ? (
            <Field label={t("Unit of measurement")}>
              <span className="flex h-11 items-center text-ink">{names.unitLong(product)}</span>
            </Field>
          ) : (
            <Select
              label={t("Unit of measurement")}
              value={form.unit}
              onChange={(unit) => change({ unit: unit as Unit })}
              options={UNITS.map((unit) => ({ value: unit, label: t(UNIT_LONG[unit]) }))}
            />
          )}
          {byJar ? (
            <Field label={t("Price per unit (proposed)")}>
              <span className="flex h-11 items-center text-ink-3">
                {t("Priced by the jar — set in the code until the pricing is decided.")}
              </span>
            </Field>
          ) : (
            <Input
              label={t("Price per unit (proposed)")}
              inputMode="decimal"
              placeholder={t("Leave empty while the price is not confirmed")}
              value={form.price}
              error={priceBroken && t("Enter 0 or more.")}
              onChange={(e) => change({ price: e.target.value.replace(/[^\d.]/g, "") })}
            />
          )}
          {locked && product ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("Minimum order")}>
                  <span className="flex h-11 items-center text-ink-2">
                    {product.min} {names.unit(product)}
                  </span>
                </Field>
                <Field label={t("Step")}>
                  <span className="flex h-11 items-center text-ink-2">
                    {product.step} {names.unit(product)}
                  </span>
                </Field>
                <Field label={t("Maximum order")}>
                  <span className="flex h-11 items-center text-ink-2">
                    {product.max} {names.unit(product)}
                  </span>
                </Field>
              </div>
              <p className="text-[12px] leading-5 text-ink-3">
                {t("Order limits shape the order screen itself, so they stay in the code.")}
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label={t("Minimum order ({u})", { u: unitShort })}
                  inputMode="numeric"
                  value={form.min}
                  onChange={(e) => change({ min: wholeNumber(e.target.value) })}
                />
                <Input
                  label={t("Step ({u})", { u: unitShort })}
                  inputMode="numeric"
                  value={form.step}
                  onChange={(e) => change({ step: wholeNumber(e.target.value) })}
                />
                <Input
                  label={t("Maximum order ({u})", { u: unitShort })}
                  inputMode="numeric"
                  value={form.max}
                  onChange={(e) => change({ max: wholeNumber(e.target.value) })}
                />
              </div>
              {limitsBroken && <p className="text-[13px] text-err">{t(limitsBroken)}</p>}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextArea
              label={t("Description (English)")}
              value={form.description}
              onChange={(e) => change({ description: e.target.value })}
            />
            <TextArea
              label={t("Description (Arabic)")}
              dir="rtl"
              value={form.descriptionAr}
              onChange={(e) => change({ descriptionAr: e.target.value })}
            />
          </div>
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title={t("Product image")} className="flex flex-col gap-3 p-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {form.image ? (
              <img
                src={form.image}
                alt={displayName}
                className="h-48 w-full rounded-[12px] border border-line object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-48 flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-line bg-bg text-ink-2 hover:text-ink"
              >
                <ImageIcon size={24} />
                <span className="text-[13px] leading-5">
                  {working ? t("Preparing…") : t("Upload product image")}
                </span>
              </button>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={working}
                onClick={() => fileRef.current?.click()}
              >
                {working ? t("Preparing…") : form.image ? t("Replace") : t("Choose image")}
              </Button>
              {form.image && (
                <Button size="sm" variant="outline" onClick={() => change({ image: null })}>
                  {t("Remove")}
                </Button>
              )}
            </div>
            <p className="text-[12px] leading-5 text-ink-3">
              {t("The picture is shrunk and compressed before it is saved.")}
            </p>
          </Panel>
          <Panel className="flex flex-col gap-3 p-5">
            <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Status")}</h2>
            <Toggle
              checked={form.active}
              label={t("Show in customer app")}
              onChange={(next) => change({ active: next })}
            />
            <p className="text-[12px] leading-5 text-ink-3">
              {t("Turned off, the product disappears from the customer app.")}
            </p>
          </Panel>
          <Panel title={t("Customer sees")} className="flex flex-col gap-2 p-5">
            <span className="text-[15px] font-semibold text-ink">{displayName || "—"}</span>
            <span className="text-[13px] text-ink-2">
              {input.price === null
                ? t("To be confirmed")
                : t("{a} / {u} (proposed)", {
                    a: money(input.price),
                    u: locked && product ? names.unit(product) : unitShort,
                  })}
            </span>
          </Panel>
          {product && !locked && (
            <Panel className="flex flex-col gap-3 p-5">
              <h2 className="text-[16px] leading-6 font-semibold text-ink">
                {t("Delete product")}
              </h2>
              {hasOrders ? (
                <p className="text-[12px] leading-5 text-ink-3">
                  {t("This product has orders, so it cannot be deleted. Hide it instead.")}
                </p>
              ) : confirmDelete ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] leading-5 text-ink-2">
                    {t("Delete this product for good?")}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                      {t("Cancel")}
                    </Button>
                    <Button size="sm" disabled={busy} onClick={() => void remove()}>
                      <Trash size={16} />
                      {t("Delete")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)}>
                  <Trash size={16} />
                  {t("Delete product")}
                </Button>
              )}
            </Panel>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {failure && <span className="text-[13px] text-err">{t(failure)}</span>}
        {nameMissing && isNew && (
          <span className="text-[13px] text-ink-3">{t("Enter the product name to save.")}</span>
        )}
        {saved && !dirty && <span className="text-[13px] text-ok">{t("Product saved.")}</span>}
        <Button size="md" variant="outline" onClick={() => navigate("/admin/products")}>
          {t(isNew ? "Cancel" : "Back to products")}
        </Button>
        <Button size="md" disabled={!dirty || blocked || busy} onClick={() => void save()}>
          {busy ? t("Saving…") : t(isNew ? "Add product" : "Save product")}
        </Button>
      </div>
    </AdminPage>
  );
}

type OrderFilter = "all" | OrderStatus;

/* Admin — Orders Management */
export function AdminOrders() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const orders = useAdminOrders();
  const columns = useOrderColumns();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  return (
    <AdminPage title={t("Orders")} actions={<AdminUser />}>
      <Tabs
        className="gap-6"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("All") },
          { value: "pending", label: t("Pending") },
          { value: "confirmed", label: t("Confirmed") },
          { value: "on_the_way", label: t("On the way") },
          { value: "delivered", label: t("Delivered") },
        ]}
      />
      <Table
        columns={[t("Order"), t("Customer"), t("Product"), t("Slot"), t("Status"), t("Action")]}
        rows={list.map((order) => ({
          key: order.uid,
          cells: [
            ...columns(order),
            <StatusBadge key="s" status={order.status} />,
            <span key="a" className="font-medium text-gold">
              {t("View")}
            </span>,
          ],
        }))}
        onRowClick={(uid) => navigate(`/admin/orders/${uid}`)}
      />
    </AdminPage>
  );
}

/* Admin — Order Details (Decisions) / (5th Reward Trigger) / 5th Order Loyalty Notification */
export function AdminOrderDetails() {
  const { uid } = useParams();
  const { t, money } = useI18n();
  const { setOrderStatus, assignDriver, settings, catalog } = useStore();
  const names = useProductText();
  const { seenRewards, markRewardSeen } = useAdmin();
  const text = useOrderText();
  const order = useAdminOrders().find((o) => o.uid === uid);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!order) return <Navigate to="/admin/orders" replace />;

  const run = async (action: Promise<string | null>) => {
    setBusy(true);
    setError(await action);
    setBusy(false);
  };
  const change = (status: OrderStatus) => run(setOrderStatus(order.uid, status));

  const pricing = priceOrder(order.product, order.qty, order.jar, order.reward, settings, catalog);
  const proposed = (amount: number | null) =>
    amount === null ? t("To be confirmed") : t("{a} (proposed)", { a: money(amount) });
  const showNotification = Boolean(order.reward) && !seenRewards.includes(order.uid);

  return (
    <AdminPage
      title={t("Order #{id}", { id: order.id })}
      actions={<StatusBadge status={order.status} />}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,1fr)]">
        <Panel title={t("Order information")} className="flex flex-col gap-1 p-6">
          <KeyValue label={t("Customer")} value={t(order.customer)} />
          <KeyValue
            label={t("Product")}
            value={`${names.name(order.product)} · ${text.qty(order.product, order.qty, order.jar)}`}
          />
          <KeyValue label={t("Delivery slot")} value={t(order.slot)} />
          <KeyValue label={t("Address")} value={t(order.address)} />
          <KeyValue label={t("Notes for driver")} value={order.note ? t(order.note) : "—"} />
          <KeyValue label={t("Payment")} value={t("Invoice (terms to be confirmed)")} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel accent title={t("Decision points")} className="flex flex-col gap-3.5 p-6">
            <p className="text-[14px] text-ink-2">{t("1. Confirm stock and the delivery slot.")}</p>
            <Button
              size="md"
              full
              disabled={order.status !== "pending" || busy}
              onClick={() => void change("confirmed")}
            >
              {t("Confirm order")}
            </Button>
            <p className="text-[14px] text-ink-2">
              {t("2. Assign a driver (or assign at dispatch).")}
            </p>
            <Select
              label={t("Driver")}
              value={order.driver ?? ""}
              onChange={(driver) => void run(assignDriver(order.uid, driver))}
              placeholder={t("Assign on dispatch")}
              options={DRIVERS.filter((d) => d.availability !== "Off duty").map((d) => ({
                value: d.name,
                label: t(d.name),
              }))}
            />
            <p className="text-[14px] text-ink-2">
              {t("3. Cancel only while Pending or Confirmed.")}
            </p>
            <Button
              size="md"
              full
              variant="danger"
              disabled={!canCancel(order) || busy}
              onClick={() => void change("cancelled")}
            >
              {t("Cancel order")}
            </Button>
            {/* Not in the Figma frame: the order has to move on after confirmation for tracking and loyalty to work. */}
            {(order.status === "confirmed" || order.status === "on_the_way") && (
              <Button
                size="md"
                full
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void change(order.status === "confirmed" ? "on_the_way" : "delivered")
                }
              >
                {t(order.status === "confirmed" ? "Mark as out for delivery" : "Mark as delivered")}
              </Button>
            )}
            {error && (
              <p role="alert" className="text-[13px] text-err">
                {error}
              </p>
            )}
          </Panel>
          <Panel className="flex flex-col gap-1 p-6">
            <h2 className="text-[16px] leading-6 font-semibold text-ink">
              {t("Pricing (proposed)")}
            </h2>
            <KeyValue
              label={t("Subtotal ({q})", { q: text.qty(order.product, order.qty, order.jar) })}
              value={proposed(pricing.subtotal)}
            />
            <KeyValue label={t("Delivery included")} value={t("Included")} />
            {order.reward && pricing.total !== null && (
              <KeyValue label={t("Loyalty discount (25%)")} value={`-${money(pricing.discount)}`} />
            )}
            <KeyValue
              label={t("Total")}
              value={pricing.total === null ? t("To be confirmed") : money(pricing.total)}
            />
          </Panel>
        </div>
      </div>

      {order.reward && (
        <section className="flex items-center justify-between gap-6 rounded-[10px] border border-gold-deep bg-reward-bg px-[22px] py-3.5">
          <div className="flex flex-col gap-[18px] py-1">
            <h2 className="text-[18px] font-semibold text-gold-deep">
              {t("Reward order {n} applied", { n: settings.rewardEvery })}
            </h2>
            <p className="text-[13px] text-ink">
              {t("{p}% discount on the full order total — customer notified", {
                p: settings.rewardPercent,
              })}
            </p>
          </div>
          <span className="flex h-12 w-[150px] shrink-0 items-center justify-center rounded-[10px] bg-gold-deep text-[20px] font-semibold text-bg">
            {settings.rewardPercent}%
          </span>
        </section>
      )}

      {showNotification && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-bg/80 p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex w-full max-w-[520px] flex-col items-center rounded-[18px] border border-gold-deep bg-surface px-6 pt-6 pb-[22px] text-center">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-gold-deep text-[18px] font-semibold text-bg">
              {settings.rewardPercent}%
            </span>
            <h2 className="mt-4 text-[21px] font-semibold text-gold-deep">
              {t("New Loyalty Reward")}
            </h2>
            <p className="mt-6 text-[14px] text-ink">
              {t("This is order {n} for {name}.", {
                n: settings.rewardEvery,
                name: t(order.customer),
              })}
            </p>
            <p className="mt-4 text-[13px] text-ink-2">
              {t("A {p}% discount has been applied to the full order total.", {
                p: settings.rewardPercent,
              })}
            </p>
            <button
              type="button"
              onClick={() => markRewardSeen(order.uid)}
              className="mt-10 h-[38px] w-[180px] rounded-[8px] bg-gold-deep text-[13px] font-semibold text-bg"
            >
              {t("View Order")}
            </button>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

/* Admin — Customers Management */
export function AdminCustomers() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { customers } = useStore();
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const list = customers.filter((c) =>
    `${c.business} ${c.contact} ${c.email} ${c.phone} ${c.username}`.toLowerCase().includes(needle),
  );

  const stats = (userId: string) => {
    const mine = orders.filter((o) => o.userId === userId);
    const month = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      recent: mine.filter((o) => new Date(o.createdAt).getTime() >= month).length,
      last: mine[0],
    };
  };

  return (
    <AdminPage
      title={t("Customers")}
      actions={
        <Input
          wrapClassName="w-[280px]"
          type="search"
          placeholder={t("Search customers")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      }
    >
      <Table
        endLast
        columns={[
          t("Customer"),
          t("Username"),
          t("Type"),
          t("Phone"),
          t("Email"),
          t("Orders (30 days)"),
          t("Last order"),
          t("Status"),
        ]}
        rows={list.map((customer) => {
          const { recent, last } = stats(customer.userId);
          return {
            key: customer.userId,
            cells: [
              customer.business || customer.contact || customer.email,
              <span key="u" dir="ltr">
                {customer.username || "—"}
              </span>,
              t(customer.type),
              <span key="p" dir="ltr">
                {customer.phone || "—"}
              </span>,
              <span key="e" dir="ltr">
                {customer.email}
              </span>,
              String(recent),
              last ? t(last.slotShort) : "—",
              <Badge key="s" tone={recent > 0 ? "info" : "muted"}>
                {t(recent > 0 ? "Active" : "Inactive")}
              </Badge>,
            ],
          };
        })}
        onRowClick={(id) => navigate(`/admin/customers/${id}`)}
      />
    </AdminPage>
  );
}

/* Admin — Customer Details */
export function AdminCustomerDetails() {
  const { id } = useParams();
  const { t, money } = useI18n();
  const { customers, settings } = useStore();
  const text = useOrderText();
  const orders = useAdminOrders();
  const customer = customers.find((c) => c.userId === id);
  if (!customer) return <Navigate to="/admin/customers" replace />;

  const history = orders.filter((o) => o.userId === customer.userId);
  const month = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = history.filter((o) => new Date(o.createdAt).getTime() >= month);
  const spend = history
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const remaining = settings.rewardEvery - customer.loyalty;

  return (
    <AdminPage
      title={customer.business || customer.contact || customer.email}
      actions={
        <Badge tone={recent.length > 0 ? "info" : "muted"}>
          {t(recent.length > 0 ? "Active" : "Inactive")}
        </Badge>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel title={t("Business profile")} className="flex flex-col gap-1 p-6">
          <KeyValue label={t("Customer type")} value={t(customer.type)} />
          <KeyValue label={t("Contact person")} value={customer.contact || "—"} />
          <KeyValue
            label={t("Username")}
            value={<span dir="ltr">{customer.username || "—"}</span>}
          />
          <KeyValue label={t("Phone")} value={<span dir="ltr">{customer.phone || "—"}</span>} />
          <KeyValue label={t("Email")} value={customer.email} />
          <KeyValue label={t("Main address")} value={customer.address || "—"} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Stat
            label={t("Orders (30 days)")}
            value={String(recent.length)}
            hint={history[0] ? t(history[0].slotShort) : t("No orders yet")}
          />
          <Stat label={t("Spend (proposed)")} value={money(spend)} hint={t("Pricing not final")} />
        </div>
      </div>

      <h2 className="text-[18px] leading-[1.5] font-semibold text-ink">{t("Order history")}</h2>
      <Table
        endLast
        columns={[t("Order"), t("Product"), t("Delivered / Slot"), t("Status")]}
        rows={history.map((order) => ({
          key: order.uid,
          cells: [
            `#${order.id}`,
            text.bullet(order),
            t(order.closedOn ?? order.slotShort),
            <StatusBadge key="s" status={order.status} />,
          ],
        }))}
      />

      <section className="flex flex-col gap-3.5 rounded-[10px] border border-line bg-surface px-[22px] pt-3 pb-5">
        <h2 className="text-[18px] font-semibold text-ink">{t("Loyalty Rewards")}</h2>
        <p className="text-[14px] text-gold-deep">
          {t("{n} of {total} completed orders", {
            n: customer.loyalty,
            total: settings.rewardEvery,
          })}
        </p>
        <div
          className="grid max-w-[936px] gap-3.5"
          style={{ gridTemplateColumns: `repeat(${settings.rewardEvery}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: settings.rewardEvery }, (_, i) => (
            <span
              key={i}
              className={cx("h-2 rounded-[4px]", i < customer.loyalty ? "bg-gold-deep" : "bg-line")}
            />
          ))}
        </div>
        {remaining === 1 && (
          <p className="text-[12px] text-ink-2">{t("1 more completed order to unlock 25% off.")}</p>
        )}
      </section>
    </AdminPage>
  );
}

/* Admin — Delivery Management */
export function AdminDeliveries() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const orders = useAdminOrders();
  const text = useOrderText();
  const names = useProductText();
  const columns: Array<{ title: string; list: Order[] }> = [
    {
      title: "To dispatch ({n})",
      list: orders.filter((o) => o.status === "pending" || o.status === "confirmed"),
    },
    { title: "Out for delivery ({n})", list: orders.filter((o) => o.status === "on_the_way") },
    { title: "Delivered today ({n})", list: orders.filter((o) => o.status === "delivered") },
  ];
  const detail = (order: Order) => {
    if (order.status === "delivered")
      return t("Delivered {t}", { t: (order.closedOn ?? "").split(", ").pop() ?? "" });
    return `${t(order.slotShort)} · ${order.driver ? t(order.driver) : t("Driver: unassigned")}`;
  };
  return (
    <AdminPage
      title={t("Deliveries")}
      actions={<span className="text-[14px] text-ink-2">{todayLabel(lang)}</span>}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <Panel key={column.title} className="flex flex-col gap-3 p-4">
            <h2 className="text-[16px] leading-6 font-semibold text-ink">
              {t(column.title, { n: column.list.length })}
            </h2>
            {column.list.map((order) => (
              <button
                key={order.uid}
                type="button"
                onClick={() => navigate(`/admin/orders/${order.uid}`)}
                className="flex flex-col gap-1.5 rounded-[12px] bg-elevated p-3.5 text-start"
              >
                <span className="flex items-center justify-between text-[14px] font-semibold text-ink">
                  #{order.id}
                  <StatusBadge status={order.status} />
                </span>
                <span className="text-[14px] text-ink">
                  {t(order.customer)} · {names.name(order.product)}{" "}
                  {text.qty(order.product, order.qty, order.jar)}
                </span>
                <span className="text-[12px] text-ink-2">{detail(order)}</span>
              </button>
            ))}
          </Panel>
        ))}
      </div>
      <h2 className="text-[18px] leading-[1.5] font-semibold text-ink">{t("Drivers")}</h2>
      <Table
        endLast
        columns={[t("Driver"), t("Vehicle"), t("Current route"), t("Availability")]}
        rows={DRIVERS.map((driver) => ({
          key: driver.name,
          cells: [
            t(driver.name),
            t(driver.vehicle),
            t(driver.route),
            <Badge key="s" tone={availabilityTone[driver.availability]}>
              {t(driver.availability)}
            </Badge>,
          ],
        }))}
      />
    </AdminPage>
  );
}

/* Admin — Reports & Analytics */
export function AdminReports() {
  const { t, money } = useI18n();
  const { customers, catalog } = useStore();
  const names = useProductText();
  const orders = useAdminOrders();
  const text = useOrderText();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = orders.filter((o) => new Date(o.createdAt) >= monthStart);
  const delivered = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Orders per product, scaled so the tallest bar fills the chart.
  const byProduct = catalog.map((product) => ({
    label: names.name(product),
    count: orders.filter((o) => o.product === product.id).length,
  }));
  const tallest = Math.max(1, ...byProduct.map((p) => p.count));

  const top = customers
    .map((customer) => ({
      customer,
      count: orders.filter((o) => o.userId === customer.userId).length,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const exportCsv = () => {
    const header = ["Order", "Customer", "Product", "Slot", "Status", "Total (JOD)"];
    const rows = orders.map((o) => [
      `#${o.id}`,
      o.customer,
      text.bullet(o),
      o.slotShort,
      STATUS_LABEL[o.status],
      o.total === null ? "" : o.total.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "hh-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPage
      title={t("Reports & Analytics")}
      actions={
        <Button size="md" variant="outline" onClick={exportCsv}>
          {t("Export CSV")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label={t("Orders this month")}
          value={String(thisMonth.length)}
          hint={t("{n} in total", { n: orders.length })}
        />
        <Stat
          label={t("Delivered")}
          value={String(delivered.length)}
          hint={t("{n} cancelled", { n: cancelled.length })}
        />
        <Stat
          label={t("Customers")}
          value={String(customers.length)}
          hint={t("Registered accounts")}
        />
        <Stat
          label={t("Revenue (proposed)")}
          value={money(revenue)}
          hint={t("Pricing not final")}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">
            {t("Orders by product (this month)")}
          </h2>
          <BarChart
            bars={byProduct.map((product) => ({
              label: product.label,
              height: Math.round((product.count / tallest) * 150),
              highlight: product.count === tallest && product.count > 0,
            }))}
          />
        </Panel>
        <Panel className="flex flex-col gap-3 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Top customers")}</h2>
          {top.length === 0 && <p className="text-[14px] text-ink-2">{t("No orders yet")}</p>}
          {top.map(({ customer, count }) => (
            <div key={customer.userId} className="grid grid-cols-2 text-[14px]">
              <span className="text-ink">
                {customer.business || customer.contact || customer.email}
              </span>
              <span className="text-ink-2">{t("{n} orders", { n: count })}</span>
            </div>
          ))}
        </Panel>
      </div>
    </AdminPage>
  );
}

/* Admin — Settings / Settings (Invalid Working Hours) */

/** The settings as the form holds them: numbers stay text while being typed. */
type SettingsForm = {
  contactPhone: string;
  opening: string;
  closing: string;
  deliveryFee: string;
  deliveryWindow: string;
  rewardEvery: string;
  rewardPercent: string;
  notifyNewOrder: boolean;
  notifyCancellation: boolean;
  notifyLowStock: boolean;
};

const toForm = (s: Settings): SettingsForm => ({
  contactPhone: s.contactPhone,
  opening: s.opening,
  closing: s.closing,
  deliveryFee: String(s.deliveryFee),
  deliveryWindow: String(s.deliveryWindow),
  rewardEvery: String(s.rewardEvery),
  rewardPercent: String(s.rewardPercent),
  notifyNewOrder: s.notifyNewOrder,
  notifyCancellation: s.notifyCancellation,
  notifyLowStock: s.notifyLowStock,
});

export function AdminSettings() {
  const { t } = useI18n();
  const { settings, saveSettings } = useStore();
  const [form, setForm] = useState<SettingsForm>(() => toForm(settings));
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<SettingsForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setFailure(null);
  };
  const digits = (value: string) => value.replace(/\D/g, "");

  const invalidHours = form.closing <= form.opening;
  const rewardEvery = Number(form.rewardEvery);
  const rewardPercent = Number(form.rewardPercent);
  const deliveryWindow = Number(form.deliveryWindow);
  const deliveryFee = Number(form.deliveryFee);
  const invalidReward = !(rewardEvery >= 2 && rewardEvery <= 50);
  const invalidPercent = !(rewardPercent >= 1 && rewardPercent <= 100);
  const invalidWindow = !(deliveryWindow >= 1 && deliveryWindow <= 24);
  const invalidFee = !(deliveryFee >= 0);
  const blocked = invalidHours || invalidReward || invalidPercent || invalidWindow || invalidFee;
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(settings));

  const save = async () => {
    setSaving(true);
    const result = await saveSettings({
      contactPhone: form.contactPhone,
      opening: form.opening,
      closing: form.closing,
      deliveryFee,
      deliveryWindow,
      rewardEvery,
      rewardPercent,
      notifyNewOrder: form.notifyNewOrder,
      notifyCancellation: form.notifyCancellation,
      notifyLowStock: form.notifyLowStock,
    });
    setSaving(false);
    setFailure(result);
    setSaved(result === null);
  };

  return (
    <AdminPage title={t("Settings")} actions={<AdminUser />}>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Contact")} className="flex flex-col gap-3.5 p-6">
          <Input
            label={t("Company phone number")}
            type="tel"
            placeholder="+962 7X XXX XXXX"
            value={form.contactPhone}
            onChange={(e) => set({ contactPhone: e.target.value })}
          />
          <p className="text-[12px] leading-[1.5] text-ink-2">
            {t("Customers call and message this number from Help & Contact in the app.")}
          </p>
        </Panel>
        <Panel title={t("Working hours")} className="flex flex-col gap-3.5 p-6">
          <Input
            label={t("Opening time")}
            type="time"
            value={form.opening}
            onChange={(e) => set({ opening: e.target.value })}
          />
          <Input
            label={t("Closing time")}
            type="time"
            value={form.closing}
            error={invalidHours && t("Closing time must be after opening time.")}
            onChange={(e) => set({ closing: e.target.value })}
          />
        </Panel>
        <Panel title={t("Delivery")} className="flex flex-col gap-3.5 p-6">
          <Input
            label={t("Delivery fee (JOD)")}
            inputMode="decimal"
            value={form.deliveryFee}
            error={invalidFee && t("Enter 0 or more.")}
            onChange={(e) => set({ deliveryFee: e.target.value.replace(/[^\d.]/g, "") })}
          />
          <Input
            label={t("Delivery window (hours)")}
            inputMode="numeric"
            value={form.deliveryWindow}
            error={invalidWindow && t("Enter a number between 1 and 24.")}
            onChange={(e) => set({ deliveryWindow: digits(e.target.value) })}
          />
        </Panel>
        <Panel title={t("Notifications")} className="flex flex-col gap-3.5 p-6">
          <Toggle
            checked={form.notifyNewOrder}
            label={t("New order alerts")}
            onChange={(notifyNewOrder) => set({ notifyNewOrder })}
          />
          <Toggle
            checked={form.notifyCancellation}
            label={t("Cancellation alerts")}
            onChange={(notifyCancellation) => set({ notifyCancellation })}
          />
          <Toggle
            checked={form.notifyLowStock}
            label={t("Low stock alerts")}
            onChange={(notifyLowStock) => set({ notifyLowStock })}
          />
        </Panel>
      </div>
      <section className="flex flex-col gap-5 rounded-[10px] border border-line bg-surface px-6 pt-[18px] pb-4">
        <h2 className="text-[20px] font-semibold text-ink">{t("Loyalty Rewards Program")}</h2>
        <p className="text-[14px] text-ink-2">
          {t("After {n} completed orders, the next order gets {p}% off.", {
            n: Math.max(rewardEvery - 1, 0),
            p: rewardPercent || 0,
          })}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-3 rounded-[10px] border border-line px-[18px] py-4">
            <span className="text-[12px] text-ink-2">{t("Completed orders required")}</span>
            <input
              inputMode="numeric"
              value={form.rewardEvery}
              onChange={(e) => set({ rewardEvery: digits(e.target.value) })}
              className="h-[38px] w-[120px] rounded-[6px] border border-line bg-bg px-3 text-[26px] font-semibold text-gold-deep focus:border-gold"
            />
            {invalidReward && (
              <span className="text-[12px] text-err">{t("Enter a number between 2 and 50.")}</span>
            )}
          </label>
          <label className="flex flex-col gap-3 rounded-[10px] border border-line px-[18px] py-4">
            <span className="text-[12px] text-ink-2">{t("Reward discount")}</span>
            <span className="flex h-[38px] w-[150px] items-center rounded-[6px] border border-line bg-bg px-3 text-[26px] font-semibold text-gold-deep focus-within:border-gold">
              <input
                inputMode="numeric"
                value={form.rewardPercent}
                onChange={(e) => set({ rewardPercent: digits(e.target.value) })}
                className="w-12 bg-transparent"
              />
              %
            </span>
            {invalidPercent && (
              <span className="text-[12px] text-err">{t("Enter a number between 1 and 100.")}</span>
            )}
          </label>
        </div>
        <p className="text-[12px] text-ink-2">
          {t("Discount applies to the full order total. After redemption, the cycle resets.")}
        </p>
      </section>
      <div className="flex items-center justify-end gap-3">
        {failure && <span className="text-[13px] text-err">{failure}</span>}
        {saved && !dirty && (
          <span className="text-[13px] text-ok">{t("Settings saved for everyone.")}</span>
        )}
        <Button
          size="md"
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => {
            setForm(toForm(settings));
            setFailure(null);
            setSaved(false);
          }}
        >
          {t("Discard")}
        </Button>
        <Button size="md" disabled={blocked || !dirty || saving} onClick={save}>
          {saving ? t("Saving…") : t("Save changes")}
        </Button>
      </div>
    </AdminPage>
  );
}
