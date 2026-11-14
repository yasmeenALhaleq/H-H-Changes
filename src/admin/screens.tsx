import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import {
  canCancel,
  isActive,
  priceOrder,
  PRODUCTS,
  REWARD_EVERY,
  REWARD_PERCENT,
  STATUS_LABEL,
  useStore,
  type Order,
  type OrderStatus,
} from "@/store";
import { useOrderText } from "@/store/format";
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
import {
  availabilityTone,
  CUSTOMERS,
  customerTone,
  DRIVERS,
  useAdmin,
  type AdminProduct,
} from "./data";

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
  const navigate = useNavigate();
  const { t } = useI18n();
  const { signedIn, setSignedIn } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const emailBad = !/^\S+@\S+\.\S+$/.test(email);
  const passwordBad = password.length < 6;

  if (signedIn) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <form
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-[20px] border border-line bg-surface p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (emailBad || passwordBad) {
            setFailed(true);
            return;
          }
          setSignedIn(true);
          navigate("/admin", { replace: true });
        }}
      >
        <span className="flex size-11 items-center justify-center rounded-[12px] bg-gold text-[12px] font-bold text-bg">
          H&amp;H
        </span>
        <h1 className="text-[24px] leading-[1.5] font-bold text-ink">{t("Admin Sign In")}</h1>
        <p className="text-[14px] text-ink-2">{t("Operations team access only.")}</p>
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
        <Button full type="submit">
          {t("Sign In")}
        </Button>
        <LanguageSwitch className="self-start" />
      </form>
    </div>
  );
}

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
  const { t, money } = useI18n();
  const orders = useAdminOrders();
  const columns = useOrderColumns();
  const active = orders.filter(isActive);
  return (
    <AdminPage
      title={t("Dashboard Overview")}
      actions={<span className="text-[14px] text-ink-2">{t("Mon, 9 Nov 2026")}</span>}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label={t("Orders today")} value="24" hint={t("+6 vs yesterday")} />
        <Stat
          label={t("Pending confirmation")}
          value={String(orders.filter((o) => o.status === "pending").length + 3)}
          hint={t("Needs your action")}
        />
        <Stat label={t("On the way")} value="7" hint={t("Across 4 drivers")} />
        <Stat label={t("Revenue (proposed)")} value={money(412)} hint={t("Pricing not final")} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">
            {t("Orders by status (this week)")}
          </h2>
          <BarChart
            bars={[
              { label: "Mon", height: 80 },
              { label: "Tue", height: 120 },
              { label: "Wed", height: 96, highlight: true },
              { label: "Thu", height: 140 },
              { label: "Fri", height: 110 },
              { label: "Sat", height: 70 },
            ]}
          />
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

function productPrice(
  product: AdminProduct,
  t: (s: string, v?: Record<string, string | number>) => string,
  money: (n: number) => string,
) {
  if (product.price === null) return t("To be confirmed");
  return t("{a} (proposed)", { a: t("{a} / {u}", { a: money(product.price), u: t(product.per) }) });
}

/* Admin — Products Management */
export function AdminProducts() {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const { products } = useAdmin();
  return (
    <AdminPage
      title={t("Products")}
      actions={
        <Button size="md" onClick={() => navigate("/admin/products/new")}>
          {t("Add product")}
        </Button>
      }
    >
      <Table
        endLast
        columns={[t("Product"), t("Unit"), t("Price"), t("Min order"), t("Step"), t("Status")]}
        rows={products.map((product) => ({
          key: product.id,
          cells: [
            t(product.name),
            t(product.unit),
            productPrice(product, t, money),
            t(product.min),
            t(product.step),
            <Badge key="s" tone={product.active ? "muted" : "warn"}>
              {t(product.active ? "Active" : "Draft")}
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

const blankProduct: AdminProduct = {
  id: "",
  name: "",
  unit: "",
  price: null,
  per: "",
  min: "",
  step: "",
  max: "",
  description: "",
  active: true,
};

/* Admin — Add / Edit Product */
export function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { products, saveProduct } = useAdmin();
  const existing = products.find((p) => p.id === id);
  const [form, setForm] = useState<AdminProduct>(existing ?? blankProduct);
  const [price, setPrice] = useState(existing?.price?.toFixed(2) ?? "");
  const set = (patch: Partial<AdminProduct>) => setForm((prev) => ({ ...prev, ...patch }));

  if (id !== "new" && !existing) return <Navigate to="/admin/products" replace />;

  const save = () => {
    const parsed = Number.parseFloat(price);
    saveProduct({
      ...form,
      id: form.id || `product-${Date.now()}`,
      price: Number.isFinite(parsed) ? parsed : null,
    });
    navigate("/admin/products");
  };

  return (
    <AdminPage
      title={existing ? t("Edit Product — {name}", { name: t(existing.name) }) : t("Add Product")}
      actions={<AdminUser />}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title={t("Product details")} className="flex flex-col gap-4 p-6">
          <Input
            label={t("Product name")}
            value={existing ? t(form.name) : form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Input
            label={t("Unit of measurement")}
            value={existing ? t(form.unit) : form.unit}
            onChange={(e) => set({ unit: e.target.value })}
          />
          <Input
            label={t("Price per unit (proposed)")}
            inputMode="decimal"
            placeholder="JOD 0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={t("Minimum order")}
              value={form.min}
              onChange={(e) => set({ min: e.target.value })}
            />
            <Input
              label={t("Step")}
              value={form.step}
              onChange={(e) => set({ step: e.target.value })}
            />
            <Input
              label={t("Maximum order")}
              value={form.max}
              onChange={(e) => set({ max: e.target.value })}
            />
          </div>
          <TextArea
            label={t("Description")}
            value={existing ? t(form.description) : form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Panel>
        <div className="flex flex-col gap-6">
          <button
            type="button"
            className="flex h-60 flex-col items-center justify-center rounded-[14px] border border-line bg-surface p-6 text-ink-2"
          >
            <ImageIcon size={24} />
            <span className="text-[13px] leading-5">{t("Upload product image")}</span>
          </button>
          <Panel className="flex flex-col gap-3 p-5">
            <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Status")}</h2>
            <Toggle
              checked={form.active}
              label={t("Show in customer app")}
              onChange={(active) => set({ active })}
            />
          </Panel>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button size="md" variant="outline" onClick={() => navigate("/admin/products")}>
          {t("Cancel")}
        </Button>
        <Button size="md" disabled={!form.name.trim()} onClick={save}>
          {t("Save product")}
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
  const { setOrderStatus, assignDriver } = useStore();
  const { seenRewards, markRewardSeen } = useAdmin();
  const text = useOrderText();
  const order = useAdminOrders().find((o) => o.uid === uid);
  if (!order) return <Navigate to="/admin/orders" replace />;

  const product = PRODUCTS[order.product];
  const pricing = priceOrder(order.product, order.qty, order.jar, order.reward);
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
            value={`${t(product.name)} · ${text.qty(order.product, order.qty, order.jar)}`}
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
              disabled={order.status !== "pending"}
              onClick={() => setOrderStatus(order.uid, "confirmed")}
            >
              {t("Confirm order")}
            </Button>
            <p className="text-[14px] text-ink-2">
              {t("2. Assign a driver (or assign at dispatch).")}
            </p>
            <Select
              label={t("Driver")}
              value={order.driver ?? ""}
              onChange={(driver) => assignDriver(order.uid, driver)}
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
              disabled={!canCancel(order)}
              onClick={() => setOrderStatus(order.uid, "cancelled")}
            >
              {t("Cancel order")}
            </Button>
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
              {t("5th Order Reward Applied")}
            </h2>
            <p className="text-[13px] text-ink">
              {t("25% discount on the full order total — customer notified")}
            </p>
          </div>
          <span className="flex h-12 w-[150px] shrink-0 items-center justify-center rounded-[10px] bg-gold-deep text-[20px] font-semibold text-bg">
            {REWARD_PERCENT}%
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
              {REWARD_PERCENT}%
            </span>
            <h2 className="mt-4 text-[21px] font-semibold text-gold-deep">
              {t("New Loyalty Reward")}
            </h2>
            <p className="mt-6 text-[14px] text-ink">
              {t("This is {name}’s 5th order.", { name: t(order.customer) })}
            </p>
            <p className="mt-4 text-[13px] text-ink-2">
              {t("A 25% discount has been applied to the full order total.")}
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
  const [query, setQuery] = useState("");
  const list = CUSTOMERS.filter((c) =>
    `${c.name} ${t(c.name)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
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
        columns={[t("Customer"), t("Type"), t("Orders (30 days)"), t("Last order"), t("Status")]}
        rows={list.map((customer) => ({
          key: customer.id,
          cells: [
            t(customer.name),
            t(customer.type),
            String(customer.orders30),
            t(customer.lastOrder),
            <Badge key="s" tone={customerTone[customer.status]}>
              {t(customer.status)}
            </Badge>,
          ],
        }))}
        onRowClick={(id) => navigate(`/admin/customers/${id}`)}
      />
    </AdminPage>
  );
}

/* Admin — Customer Details */
export function AdminCustomerDetails() {
  const { id } = useParams();
  const { t, money } = useI18n();
  const { orders, loyalty, addresses } = useStore();
  const text = useOrderText();
  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) return <Navigate to="/admin/customers" replace />;

  const isAppCustomer = customer.id === "al-noor";
  const history = orders.filter(
    (o) => o.customer === customer.name && (isAppCustomer ? o.mine : o.admin),
  );
  const completed = isAppCustomer ? loyalty : customer.loyalty;
  const remaining = REWARD_EVERY - completed;

  return (
    <AdminPage
      title={t(customer.name)}
      actions={
        <>
          <Badge tone={customerTone[customer.status]}>{t(customer.status)}</Badge>
          <Button size="md" variant="outline">
            {t("Edit customer")}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel title={t("Business profile")} className="flex flex-col gap-1 p-6">
          <KeyValue label={t("Customer type")} value={t(customer.type)} />
          <KeyValue label={t("Contact person")} value={t("Clinic manager")} />
          <KeyValue label={t("Phone")} value={<span dir="ltr">+962 7X XXX XXXX</span>} />
          <KeyValue label={t("Email")} value="name@example.com" />
          <KeyValue label={t("Main address")} value={t("Street, building, Amman")} />
          <KeyValue label={t("Saved addresses")} value={isAppCustomer ? addresses.length : 2} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Stat
            label={t("Orders (30 days)")}
            value={String(customer.orders30)}
            hint={t("Last order today")}
          />
          <Stat
            label={t("Spend (proposed)")}
            value={money(customer.spend)}
            hint={t("Pricing not final")}
          />
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
          {t("{n} of 5 completed orders", { n: completed })}
        </p>
        <div className="grid max-w-[936px] grid-cols-5 gap-3.5">
          {Array.from({ length: REWARD_EVERY }, (_, i) => (
            <span
              key={i}
              className={cx("h-2 rounded-[4px]", i < completed ? "bg-gold-deep" : "bg-line")}
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
  const { t } = useI18n();
  const orders = useAdminOrders();
  const text = useOrderText();
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
      actions={<span className="text-[14px] text-ink-2">{t("Mon, 9 Nov 2026")}</span>}
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
                  {t(order.customer)} · {t(PRODUCTS[order.product].name)}{" "}
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
  const orders = useAdminOrders();
  const text = useOrderText();

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

  const top = [...CUSTOMERS].sort((a, b) => b.orders30 - a.orders30).slice(0, 4);

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
        <Stat label={t("Orders this month")} value="146" hint={t("+12% vs October")} />
        <Stat label={t("On-time delivery")} value="94%" hint={t("Target 95%")} />
        <Stat
          label={t("Avg. delivery time")}
          value={t("38 min")}
          hint={t("Dispatch to delivered")}
        />
        <Stat
          label={t("Revenue (proposed)")}
          value={money(5180).replace("5180", "5,180")}
          hint={t("Pricing not final")}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">
            {t("Orders by product (this month)")}
          </h2>
          <BarChart
            bars={[
              { label: "Dry Ice", height: 120 },
              { label: "Nitrogen", height: 80 },
              { label: "Oxygen 3L", height: 100 },
              { label: "Oxygen 8L", height: 150, highlight: true },
            ]}
          />
        </Panel>
        <Panel className="flex flex-col gap-3 p-5">
          <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Top customers")}</h2>
          {top.map((customer) => (
            <div key={customer.id} className="grid grid-cols-2 text-[14px]">
              <span className="text-ink">{t(customer.name)}</span>
              <span className="text-ink-2">{t("{n} orders", { n: customer.orders30 })}</span>
            </div>
          ))}
        </Panel>
      </div>
    </AdminPage>
  );
}

/* Admin — Settings / Settings (Invalid Working Hours) */
export function AdminSettings() {
  const { t } = useI18n();
  const { settings, saveSettings } = useAdmin();
  const [form, setForm] = useState(settings);
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));
  const invalidHours = form.closing <= form.opening;
  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  return (
    <AdminPage title={t("Settings")} actions={<AdminUser />}>
      <div className="grid gap-4 xl:grid-cols-3">
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
          <Field label={t("Delivery pricing")}>
            <span className="flex h-11 items-center text-ink-3">{t("Included")}</span>
          </Field>
          <Input
            label={t("Delivery window (hours)")}
            type="number"
            min={1}
            value={form.deliveryWindow}
            onChange={(e) => set({ deliveryWindow: e.target.value })}
          />
        </Panel>
        <Panel title={t("Notifications")} className="flex flex-col gap-3.5 p-6">
          <Toggle
            checked={form.newOrderAlerts}
            label={t("New order alerts")}
            onChange={(newOrderAlerts) => set({ newOrderAlerts })}
          />
          <Toggle
            checked={form.cancellationAlerts}
            label={t("Cancellation alerts")}
            onChange={(cancellationAlerts) => set({ cancellationAlerts })}
          />
          <Toggle
            checked={form.lowStockAlerts}
            label={t("Low stock alerts")}
            onChange={(lowStockAlerts) => set({ lowStockAlerts })}
          />
        </Panel>
      </div>
      <div className="flex justify-end gap-3">
        <Button size="md" variant="outline" disabled={!dirty} onClick={() => setForm(settings)}>
          {t("Discard")}
        </Button>
        <Button size="md" disabled={invalidHours || !dirty} onClick={() => saveSettings(form)}>
          {t("Save changes")}
        </Button>
      </div>
      <section className="flex flex-col gap-5 rounded-[10px] border border-line bg-surface px-6 pt-[18px] pb-4">
        <h2 className="text-[20px] font-semibold text-ink">{t("Loyalty Rewards Program")}</h2>
        <p className="text-[14px] text-ink-2">
          {t("After 4 completed orders, the 5th order gets 25% off.")}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-3 rounded-[10px] border border-line px-[18px] py-4">
            <span className="text-[12px] text-ink-2">{t("Completed orders required")}</span>
            <input
              inputMode="numeric"
              value={form.rewardThreshold}
              onChange={(e) => set({ rewardThreshold: e.target.value.replace(/\D/g, "") })}
              className="h-[38px] w-[120px] rounded-[6px] border border-line bg-bg px-3 text-[26px] font-semibold text-gold-deep"
            />
          </label>
          <label className="flex flex-col gap-3 rounded-[10px] border border-line px-[18px] py-4">
            <span className="text-[12px] text-ink-2">{t("Reward discount")}</span>
            <span className="flex h-[38px] w-[150px] items-center rounded-[6px] border border-line bg-bg px-3 text-[26px] font-semibold text-gold-deep focus-within:border-gold">
              <input
                inputMode="numeric"
                value={form.rewardDiscount}
                onChange={(e) => set({ rewardDiscount: e.target.value.replace(/\D/g, "") })}
                className="w-12 bg-transparent"
              />
              %
            </span>
          </label>
        </div>
        <p className="text-[12px] text-ink-2">
          {t(
            "Discount applies to the full order total; delivery is included. After redemption, the 5-order cycle resets.",
          )}
        </p>
      </section>
    </AdminPage>
  );
}
