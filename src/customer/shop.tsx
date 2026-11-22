import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CaretRight,
  Check,
  Clock,
  Cylinder,
  Drop,
  Info,
  MapPin,
  Package,
  Snowflake,
  Spinner,
  type Icon,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import {
  isActive,
  priceOrder,
  type BuiltInId,
  type CatalogProduct,
  findProduct,
  type JarSize,
  type Order,
  type Unit,
  useStore,
} from "@/store";
import { useOrderText, useProductText } from "@/store/format";
import { Footer, IconButton, MobileHeader, Screen } from "@/components/mobile";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chips,
  cx,
  EmptyState,
  Field,
  Input,
  KeyValue,
  LinkButton,
  QuantityStepper,
  Select,
  StatusPill,
  TextArea,
} from "@/components/ui";

export const PRODUCT_ICON: Record<BuiltInId, Icon> = {
  "dry-ice": Snowflake,
  nitrogen: Drop,
  oxygen: Cylinder,
};

/** The product's own icon, or a parcel for a product the operations team added. */
export const productIcon = (id: string): Icon =>
  (PRODUCT_ICON as Record<string, Icon | undefined>)[id] ?? Package;

/** Short "sold by" line under a product tile. */
const UNIT_TILE: Record<Unit, string> = { kg: "Kg", L: "Liter", pcs: "Piece", jar: "Jar" };
const UNIT_TILE_PLURAL: Record<Unit, string> = {
  kg: "Kg",
  L: "Liters",
  pcs: "Pieces",
  jar: "Jar 3L / 8L",
};
/** Unit next to a quantity on the order screens. */
const UNIT_QTY: Record<Unit, string> = { kg: "Kg", L: "L", pcs: "pcs", jar: "jars" };

/** A jar price as shown to the customer: "JOD 20.00", or "To be confirmed" while it is unset. */
function useJarPrice() {
  const { t, money } = useI18n();
  return (product: CatalogProduct, size: JarSize) => {
    const price = product.jarPrices?.[size] ?? null;
    return price === null ? t("To be confirmed") : money(price);
  };
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

export function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const text = useOrderText();
  const finished = !isActive(order);
  return (
    <article
      className={cx(
        "flex flex-col gap-3.5 rounded-[16px] border border-line bg-surface p-5",
        finished && "cursor-pointer",
      )}
      onClick={finished ? () => navigate(`/orders/${order.uid}`) : undefined}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-ink">
          {finished ? `#${order.id}` : t("Order #{id}", { id: order.id })}
        </h3>
        <StatusPill status={order.status} />
      </header>
      <p className="text-[13px] leading-5 text-ink-2">
        {finished ? text.bullet(order) : text.line(order)}
      </p>
      {!finished && (
        <div className="flex items-center gap-2 text-[13px] text-ink">
          <MapPin size={24} className="shrink-0 text-ink-2" />
          {t(order.address)}
        </div>
      )}
      <div className="flex items-center gap-2 text-[13px] text-ink">
        <Clock size={24} className="shrink-0 text-ink-2" />
        {finished
          ? t(order.status === "cancelled" ? "Cancelled: {d}" : "Delivered: {d}", {
              d: t(order.closedOn ?? order.slot),
            })
          : t(order.slot)}
      </div>
      <hr className="border-line" />
      {!finished && (
        <footer className="flex items-center justify-between">
          <span className="text-[18px] font-bold whitespace-nowrap text-gold">
            {order.total === null
              ? t("To be confirmed")
              : t("{a} (proposed)", { a: text.total(order) })}
          </span>
          <LinkButton
            className="shrink-0 gap-1 text-[14px]"
            onClick={() => navigate(`/orders/${order.uid}`)}
          >
            {t("Track order")}
            <ArrowRight size={24} className="rtl:-scale-x-100" />
          </LinkButton>
        </footer>
      )}
    </article>
  );
}

function LoyaltyCard() {
  const { t } = useI18n();
  const { loyalty, rewardReady, settings } = useStore();
  return (
    <section className="flex flex-col gap-2 rounded-[12px] border border-gold-deep bg-surface px-4 pt-2.5 pb-2.5">
      <h2 className="text-[14px] font-semibold text-ink">{t("Loyalty Rewards")}</h2>
      <p className="text-[12px] text-gold-deep">
        {rewardReady
          ? t("{n} orders done — {p}% off your next order", {
              n: loyalty,
              p: settings.rewardPercent,
            })
          : t("{n} / {total} completed orders", { n: loyalty, total: settings.rewardEvery })}
      </p>
      <div
        className="mt-1 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${settings.rewardEvery}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: settings.rewardEvery }, (_, i) => (
          <span
            key={i}
            className={cx("h-[5px] rounded-[3px]", i < loyalty ? "bg-gold-deep" : "bg-line")}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

const tileUnit = (product: CatalogProduct) =>
  product.id === "oxygen" ? "Jar" : UNIT_TILE[product.unit];

/** The product photo when the operations team has set one, otherwise its icon. */
function ProductArt({
  product,
  size,
  className,
}: {
  product: CatalogProduct;
  size: number;
  className: string;
}) {
  const names = useProductText();
  const Fallback = productIcon(product.id);
  if (product.image)
    return (
      <img
        src={product.image}
        alt={names.name(product)}
        className={cx(className, "object-cover")}
      />
    );
  return (
    <span className={cx(className, "flex items-center justify-center bg-elevated text-gold")}>
      <Fallback size={size} />
    </span>
  );
}

/* Home — With Active Orders / Home — No Active Orders */
export function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { account, orders, fresh, catalog } = useStore();
  const names = useProductText();
  const active = orders.filter((o) => o.mine && isActive(o));
  const shelf = catalog.filter((p) => p.active);

  if (fresh && active.length === 0) return <HomeNewAccount />;

  return (
    <Screen nav width="wide" bodyClassName="gap-4 px-6 pt-14 pb-4 md:gap-6 md:pt-0">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[14px] text-ink-2">{t("Good morning,")}</span>
          <span className="truncate text-[22px] font-bold text-ink">
            {t(account.business || "Clinic Name")}
          </span>
        </div>
        <span className="md:hidden">
          <IconButton
            icon={Bell}
            label={t("Notifications")}
            size={44}
            onClick={() => navigate("/profile/notifications")}
          />
        </span>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
        <LoyaltyCard />

        <section className="flex flex-col items-start gap-2 rounded-[16px] border border-gold bg-elevated p-5">
          <h2 className="text-[20px] font-semibold text-ink">{t("New Order")}</h2>
          <p className="text-[14px] text-ink-2">{t("Order Oxygen, Nitrogen or Dry Ice")}</p>
          <Button size="sm" onClick={() => navigate("/products")}>
            {t("Order Now")}
            <ArrowRight size={24} className="text-ink rtl:-scale-x-100" />
          </Button>
        </section>
      </div>

      <h2 className="text-[18px] font-semibold text-ink">{t("Products")}</h2>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {shelf.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => navigate(`/products/${product.id}`)}
            className="flex flex-col items-center gap-2 rounded-[12px] border border-line bg-surface p-3 transition-colors md:p-5 md:hover:border-gold"
          >
            <ProductArt product={product} size={24} className="size-12 rounded-[12px] md:size-16" />
            <span className="text-[14px] font-semibold text-ink">{names.name(product)}</span>
            <span className="text-[12px] text-ink-2">{t(tileUnit(product))}</span>
          </button>
        ))}
      </div>

      <h2 className="text-[18px] font-semibold text-ink">{t("Active Orders")}</h2>
      {active.length > 0 ? (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
          {active.map((order) => (
            <OrderCard key={order.uid} order={order} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t("No active orders")}
          body={t("Your upcoming and on-the-way orders will appear here.")}
          action={
            <Button size="md" onClick={() => navigate("/products")}>
              {t("Place your first order")}
            </Button>
          }
        />
      )}
    </Screen>
  );
}

const newAccountUnit = (product: CatalogProduct) =>
  product.id === "oxygen" ? "Jar 3L / 8L" : UNIT_TILE_PLURAL[product.unit];

/* Home — No Active Orders (new account) */
function HomeNewAccount() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { account, catalog } = useStore();
  const names = useProductText();
  const shelf = catalog.filter((p) => p.active);
  return (
    <Screen
      nav
      width="wide"
      header={<MobileHeader brand bell />}
      bodyClassName="gap-5 px-6 pt-5 pb-4 md:gap-6 md:pt-0"
    >
      <div className="flex flex-col gap-5 md:gap-1">
        <span className="text-[14px] text-ink-2">{t("Good morning,")}</span>
        <span className="text-[22px] leading-[1.5] font-bold text-ink">
          {t(account.business || "Clinic Name")}
        </span>
      </div>

      <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-elevated p-[18px] md:max-w-[560px] md:p-6">
        <h2 className="text-[18px] leading-[1.5] font-semibold text-ink">{t("New Order")}</h2>
        <p className="text-[15px] leading-[1.5] text-ink-2">
          {t("Order Oxygen, Nitrogen or Dry Ice")}
        </p>
        <Button size="md" full onClick={() => navigate("/products")}>
          {t("Order Now")} <span className="rtl:-scale-x-100">→</span>
        </Button>
      </section>

      <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Products")}</h2>
      <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {shelf.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => navigate(`/products/${product.id}`)}
            className="flex flex-col items-start gap-2 rounded-[14px] border border-line bg-surface p-3 text-start transition-colors md:p-5 md:hover:border-gold"
          >
            <ProductArt product={product} size={24} className="size-10 rounded-[10px]" />
            <span className="text-[14px] font-semibold text-ink">{names.name(product)}</span>
            <span className="text-[12px] text-ink-2">{t(newAccountUnit(product))}</span>
          </button>
        ))}
      </div>

      <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Active Orders")}</h2>
      <EmptyState
        compact
        icon={Package}
        title={t("No active orders")}
        body={t("Your upcoming and on-the-way orders will appear here.")}
        action={
          <Button size="sm" onClick={() => navigate("/products")}>
            {t("Create order")}
          </Button>
        }
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

/* Products */
export function Products() {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const { catalog } = useStore();
  const names = useProductText();
  const shelf = catalog.filter((p) => p.active);
  const jarPrice = useJarPrice();
  const priceLabel = (product: CatalogProduct) => {
    if (product.jarPrices)
      return `${t("3L jar")} ${jarPrice(product, "3L")} · ${t("8L jar")} ${jarPrice(product, "8L")}`;
    if (product.price === null) return t("To be confirmed");
    return t("{a} / {u}", { a: money(product.price), u: t(product.unit) });
  };
  return (
    <Screen
      nav
      width="wide"
      header={<MobileHeader title={t("Products")} />}
      bodyClassName="gap-3 px-6 py-4"
    >
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {shelf.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => navigate(`/products/${product.id}`)}
            className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-3 text-start transition-colors md:p-4 md:hover:border-gold"
          >
            <ProductArt
              product={product}
              size={32}
              className="size-[72px] shrink-0 rounded-[12px]"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[16px] font-semibold text-ink">{names.name(product)}</span>
              <span className="text-[13px] text-ink-2">
                {t("Unit: {u}", { u: names.unitLong(product) })}
              </span>
              <span className="text-[13px] font-medium text-gold">
                {t("Proposed: {p}", { p: priceLabel(product) })}
              </span>
            </span>
            <CaretRight size={16} className="shrink-0 text-ink-3 rtl:-scale-x-100" />
          </button>
        ))}
      </div>
    </Screen>
  );
}

/* Product Details — Dry Ice / Nitrogen / Oxygen */
export function ProductDetails() {
  const { id } = useParams();
  const { catalog } = useStore();
  const product = catalog.find((p) => p.id === id);
  // A product the admin switched off, or deleted, is no longer orderable.
  if (!product || !product.active) return <Navigate to="/products" replace />;
  // Nitrogen and oxygen have their own screen; dry ice and every added product pick a quantity here.
  return product.id === "nitrogen" || product.id === "oxygen" ? (
    <GasDetails product={product} />
  ) : (
    <QuantityDetails product={product} />
  );
}

/* Product Details — Dry Ice, and products added from the dashboard */
function QuantityDetails({ product }: { product: CatalogProduct }) {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const names = useProductText();
  const { startDraft, settings, catalog } = useStore();
  const [qty, setQty] = useState(product.detailQty);
  const pricing = priceOrder(product.id, qty, "3L", false, settings, catalog);
  const unit = names.unit(product);
  return (
    <Screen
      header={<MobileHeader title={names.name(product)} back />}
      bodyClassName="gap-3.5 px-6 pt-4 pb-3"
      footer={
        <Footer className="pb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-2">{t("Quantity ({u})", { u: unit })}</span>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                min={product.min}
                max={product.max}
                step={product.step}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[12px] text-ink-2">{t("Total (proposed)")}</span>
              <span className="text-[20px] font-bold text-gold">
                {pricing.subtotal === null ? t("To be confirmed") : money(pricing.subtotal)}
              </span>
              {product.price !== null && (
                <span className="text-[12px] text-ink-3">
                  {t("{q} × {p}", { q: `${qty} ${unit}`, p: money(product.price) })}
                </span>
              )}
            </div>
          </div>
          <Button
            full
            onClick={() => {
              startDraft(product.id, { qty });
              navigate(`/order/${product.id}`);
            }}
          >
            {t("Add to order")}
          </Button>
        </Footer>
      }
    >
      <ProductArt product={product} size={24} className="h-28 w-full shrink-0 rounded-[16px]" />
      <h2 className="text-[26px] font-bold text-ink">{names.name(product)}</h2>
      {names.description(product) && (
        <p className="text-[13px] leading-5 text-ink-2">{names.description(product)}</p>
      )}
      <Card className="flex flex-col gap-2.5 p-3.5">
        <KeyValue label={t("Unit of Measurement")} value={names.unitLong(product)} />
        <KeyValue label={t("Minimum order")} value={`${product.min} ${unit}`} />
        <KeyValue
          label={t("Price (proposed)")}
          value={
            product.price === null
              ? t("To be confirmed")
              : t("{a} / {u}", { a: money(product.price), u: unit })
          }
        />
      </Card>
      <div className="flex items-center gap-2">
        <Badge tone="muted" icon={Info}>
          {t("Proposed price")}
        </Badge>
        <span className="text-[12px] text-ink-2">{t("Not yet confirmed with the company.")}</span>
      </div>
    </Screen>
  );
}

function GasDetails({ product }: { product: CatalogProduct }) {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const names = useProductText();
  const { startDraft } = useStore();
  const jarPrice = useJarPrice();
  const [jar, setJar] = useState<JarSize>("3L");
  const oxygen = product.id === "oxygen";
  return (
    <Screen
      header={<MobileHeader title={names.name(product)} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          <Button
            full
            onClick={() => {
              startDraft(product.id, { jar });
              navigate(`/order/${product.id}`);
            }}
          >
            {t("Order Now")}
          </Button>
        </Footer>
      }
    >
      <ProductArt
        product={product}
        size={24}
        className="h-[200px] w-full shrink-0 rounded-[20px] border border-line"
      />
      <p className="text-[15px] leading-[1.5] text-ink-2">{names.description(product)}</p>
      {oxygen && (
        <>
          <p className="text-[14px] font-medium text-ink">{t("Choose jar size")}</p>
          <Chips
            value={jar}
            onChange={setJar}
            options={[
              { value: "3L", label: t("3L Jar") },
              { value: "8L", label: t("8L Jar") },
            ]}
          />
        </>
      )}
      <Card className="flex flex-col p-3.5">
        <KeyValue label={t("Unit of Measurement")} value={names.unitLong(product)} />
        {oxygen ? (
          <>
            <KeyValue
              label={t("Fixed Price · 3L Jar")}
              value={t("{p} / jar (proposed)", { p: jarPrice(product, "3L") })}
            />
            <KeyValue
              label={t("Fixed Price · 8L Jar")}
              value={t("{p} / jar (proposed)", { p: jarPrice(product, "8L") })}
            />
          </>
        ) : (
          <>
            <KeyValue
              label={t("Minimum order")}
              value={t("Min {q}", { q: `${product.min} ${t("L")}` })}
            />
            <KeyValue label={t("Fixed Price")} value={t("To be confirmed")} />
          </>
        )}
      </Card>
      {oxygen ? (
        <p className="text-[12px] text-ink-3">
          {t("Pricing is a proposed placeholder until confirmed by the company.")}
        </p>
      ) : (
        <div className="rounded-[14px] border border-line bg-elevated p-3.5 text-[13px] leading-5 text-ink-2">
          {t(
            "Refill your own dewar or have the company supply one: this is being confirmed, so ordering options will appear here once decided.",
          )}
        </div>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Ordering                                                            */
/* ------------------------------------------------------------------ */

const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
];

type DateOption = { value: string; label: string; short: string };

/** The next seven delivery days, labelled in the current language. */
function useDateOptions(): DateOption[] {
  const { t, lang } = useI18n();
  return useMemo(() => {
    const locale = lang === "ar" ? "ar-JO-u-nu-latn" : "en-GB";
    const dayMonth = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const day = i === 0 ? t("Tomorrow") : weekday.format(date);
      return {
        value: date.toISOString().slice(0, 10),
        label: `${day}, ${dayMonth.format(date)}`,
        short: day,
      };
    });
  }, [t, lang]);
}

function useDraftSummary() {
  const { t, money } = useI18n();
  const { draft, addresses, rewardReady, settings, catalog } = useStore();
  const dates = useDateOptions();
  const product = findProduct(catalog, draft.product);
  const unit = t(UNIT_QTY[product.unit]);
  const address = addresses.find((a) => a.id === draft.addressId) ?? addresses[0];
  const date = dates.find((d) => d.value === draft.date);
  const pricing = priceOrder(draft.product, draft.qty, draft.jar, rewardReady, settings, catalog);
  const proposed = (amount: number | null) =>
    amount === null ? t("To be confirmed") : t("{a} (proposed)", { a: money(amount) });
  return {
    product,
    unit,
    // Oxygen: "2 × 8L jar"; everything else: "10 Kg".
    qtyLabel:
      product.unit === "jar" ? `${draft.qty} × ${t(`${draft.jar} jar`)}` : `${draft.qty} ${unit}`,
    address,
    addressLabel: address ? [t(address.label), t(address.city)].filter(Boolean).join(", ") : "",
    slot: date && draft.time ? `${date.short}, ${draft.time}` : "",
    slotShort:
      date && draft.time
        ? `${date.short} ${draft.time.replace(/:00/g, "").replace(/\s/g, "")}`
        : "",
    pricing,
    proposed,
    unitPriceLabel:
      pricing.unit === null
        ? t("To be confirmed")
        : t("{a} (proposed)", {
            a: t("{a} / {u}", {
              a: money(pricing.unit),
              u: product.unit === "jar" ? t(`${draft.jar} jar`) : unit,
            }),
          }),
  };
}

function PriceSummary() {
  const { t, money } = useI18n();
  const { rewardReady } = useStore();
  const s = useDraftSummary();
  return (
    <Card className="flex flex-col p-3.5">
      <KeyValue label={t("Unit Price (Fixed)")} value={s.unitPriceLabel} />
      <KeyValue
        label={t("Subtotal ({q})", { q: s.qtyLabel })}
        value={s.proposed(s.pricing.subtotal)}
      />
      <KeyValue label={t("Delivery included")} value={t("Included")} />
      {rewardReady && s.pricing.total !== null && (
        <KeyValue label={t("Loyalty discount (25%)")} value={`-${money(s.pricing.discount)}`} />
      )}
      <KeyValue label={t("Total")} value={s.proposed(s.pricing.total)} />
    </Card>
  );
}

/* Order Form — Dry Ice / Nitrogen / Oxygen / Below Minimum (Error) and My Orders — Reorder */
export function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const names = useProductText();
  const { draft, setDraft, startDraft, addresses, catalog } = useStore();
  const dates = useDateOptions();
  const s = useDraftSummary();
  const listed = catalog.find((p) => p.id === id && p.active);

  // Opening the form for another product than the one in progress starts a new draft.
  useEffect(() => {
    if (listed && listed.id !== draft.product) startDraft(listed.id);
  }, [listed, draft.product, startDraft]);

  if (!listed || !id) return <Navigate to="/products" replace />;
  const product = listed;
  const reorder = draft.reorderOf !== undefined;
  // Jars are counted, so their limits read as plain numbers ("Min 1 · Max 20").
  const withUnit = (n: number) => (product.unit === "jar" ? `${n}` : `${n} ${s.unit}`);
  const range = {
    min: withUnit(product.min),
    step: withUnit(product.step),
    max: withUnit(product.max),
  };
  const belowMin = draft.qty < product.min;
  const ready = !belowMin && Boolean(s.address && draft.date && draft.time);

  return (
    <Screen
      header={<MobileHeader title={t(reorder ? "Reorder" : "New Order")} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          <Button full disabled={!ready} onClick={() => navigate("/order/review")}>
            {t(reorder ? "Review Order" : "Review order")}
          </Button>
        </Footer>
      }
    >
      {reorder && (
        <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-elevated p-3.5">
          <p className="text-[13px] leading-5 text-ink-2">
            {t("Based on Order #{id}", { id: draft.reorderOf ?? "" })}
          </p>
          <p className="text-[16px] leading-6 font-semibold text-ink">
            {t("Previous quantity restored")}
          </p>
          <p className="text-[13px] leading-5 text-ink-2">
            {t("Your last quantity was filled in for you. You can edit it before continuing.")}
          </p>
        </div>
      )}

      <Field label={t("Product")}>
        <span className="flex h-11 items-center text-ink-3">{names.name(product)}</span>
      </Field>

      {id === "oxygen" && (
        <Chips
          value={draft.jar}
          onChange={(jar) => setDraft({ jar })}
          options={[
            { value: "3L", label: t("3L Jar") },
            { value: "8L", label: t("8L Jar") },
          ]}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-medium text-ink">
          {t("Quantity ({u})", { u: s.unit })}
        </span>
        {/* The stepper allows going one step under the minimum so the validation message can be shown. */}
        <QuantityStepper
          value={draft.qty}
          onChange={(qty) => setDraft({ qty })}
          min={Math.max(product.step, product.min - product.step)}
          max={product.max}
          step={product.step}
        />
        {belowMin ? (
          <p role="alert" className="text-[13px] leading-5 text-err">
            {t("Minimum order is {min}. Please increase the quantity to continue.", {
              min: range.min,
            })}
          </p>
        ) : (
          <p className="text-[12px] text-ink-2">
            {reorder
              ? t("Previous quantity: {q} · Min {min} · Max {max}", { q: s.qtyLabel, ...range })
              : t(
                  id === "oxygen"
                    ? "Number of jars · Min {min} · Max {max}"
                    : "Min {min} · Step {step} · Max {max}",
                  range,
                )}
          </p>
        )}
      </div>

      <Select
        label={t("Delivery Address")}
        value={s.address?.id ?? ""}
        onChange={(addressId) => setDraft({ addressId })}
        placeholder={addresses.length === 0 ? t("Select address") : undefined}
        options={addresses.map((a) => ({
          value: a.id,
          label: [t(a.label), t(a.city)].filter(Boolean).join(" — "),
        }))}
      />
      {!reorder && (
        <LinkButton
          className="self-start text-[14px]"
          onClick={() => navigate("/addresses/new?use=1")}
        >
          {t("Add new address / pin on map")}
        </LinkButton>
      )}
      <Select
        label={t("Delivery Date")}
        value={draft.date}
        onChange={(date) => setDraft({ date })}
        placeholder={t("Select date")}
        options={dates.map((d) => ({ value: d.value, label: d.label }))}
      />
      <Select
        label={t("Time")}
        value={draft.time}
        onChange={(time) => setDraft({ time })}
        placeholder={t("Select time")}
        options={TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))}
      />

      {!reorder && (
        <>
          <PriceSummary />
          <p className="text-[12px] text-ink-3">
            {t(
              id === "nitrogen"
                ? "Ordering method (refill own dewar or company supply) is pending, so this order form is a working draft."
                : "Pricing is a proposed placeholder until confirmed by the company.",
            )}
          </p>
        </>
      )}
    </Screen>
  );
}

/* Review Order — Nitrogen / Oxygen (and Dry Ice) */
export function OrderReview() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const names = useProductText();
  const { draft, setDraft } = useStore();
  const s = useDraftSummary();

  if (!s.slot) return <Navigate to={`/order/${draft.product}`} replace />;

  return (
    <Screen
      header={<MobileHeader title={t("Review Order")} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          <Button full variant="outline" onClick={() => navigate(-1)}>
            {t("Edit")}
          </Button>
          <Button full onClick={() => navigate("/order/submitting", { replace: true })}>
            {t("Submit Order")}
          </Button>
        </Footer>
      }
    >
      <h2 className="text-[16px] leading-6 font-semibold text-ink">{t("Order Summary")}</h2>
      <Card className="flex flex-col p-3.5">
        <KeyValue
          label={t("Product")}
          value={
            draft.product === "oxygen"
              ? `${t("Oxygen")} · ${t(`${draft.jar} Jar`)}`
              : names.name(s.product)
          }
        />
        <KeyValue label={t("Quantity")} value={s.qtyLabel} />
        <KeyValue label={t("Delivery Address")} value={s.addressLabel} />
        <KeyValue label={t("Date & Time")} value={s.slot} />
      </Card>
      <TextArea
        label={t("Notes for driver (optional)")}
        placeholder={t("e.g. Use the back entrance")}
        value={draft.note}
        onChange={(e) => setDraft({ note: e.target.value })}
      />
      <PriceSummary />
      <p className="text-[12px] text-ink-2">
        {t("Prices are proposed. The final total is confirmed by H&H before dispatch.")}
      </p>
    </Screen>
  );
}

/* New Order — Submission */
export function OrderSubmitting() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { submitDraft } = useStore();
  const s = useDraftSummary();
  const submit = useRef({ submitDraft, s });
  submit.current = { submitDraft, s };

  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Guard against double submission (React StrictMode runs effects twice in development).
    if (started.current) return;
    started.current = true;
    const { submitDraft: run, s: summary } = submit.current;
    void run(summary.slot, summary.slotShort, summary.addressLabel).then((order) => {
      if (!order) {
        setFailed(true);
        return;
      }
      navigate(order.reward ? `/order/reward/${order.uid}` : `/order/confirmed/${order.uid}`, {
        replace: true,
      });
    });
  }, [navigate]);

  if (failed) {
    return (
      <Screen
        width="auth"
        bodyClassName="items-stretch justify-center gap-4 p-6"
        footer={
          <Footer>
            <Button
              full
              variant="outline"
              onClick={() => navigate("/order/review", { replace: true })}
            >
              {t("Edit")}
            </Button>
          </Footer>
        }
      >
        <p role="alert" className="text-center text-[15px] leading-[1.5] text-err">
          {t("We could not place your order. Check your connection and try again.")}
        </p>
      </Screen>
    );
  }

  return (
    <Screen
      width="auth"
      bodyClassName="items-stretch justify-center gap-4 p-6"
      footer={
        <Footer>
          <Button full aria-busy>
            <Spinner size={24} className="animate-hh-spin" />
            {t("Loading…")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-24 items-center justify-center rounded-full border border-gold bg-surface text-gold">
        <Spinner size={24} className="animate-hh-spin" />
      </div>
      <h1 className="text-center text-[24px] leading-[1.5] font-bold text-ink">
        {t("Placing your order…")}
      </h1>
      <p className="text-center text-[15px] leading-[1.5] text-ink-2">
        {t("We are confirming stock and your delivery slot. Please keep the app open.")}
      </p>
    </Screen>
  );
}

/* 5th Order Reward Celebration */
export function RewardCelebration() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { settings } = useStore();
  const sparkles = [
    "top-[18px] start-12 size-2",
    "top-[30px] end-[61px] size-[13px]",
    "top-3 start-[186px] size-2",
    "bottom-[316px] start-6 size-2",
    "bottom-[321px] end-[35px] size-[13px]",
    "bottom-[261px] end-[77px] size-[13px]",
  ];
  return (
    <Screen width="auth" bodyClassName="relative items-center justify-center px-6 md:py-16">
      {sparkles.map((position) => (
        <span
          key={position}
          aria-hidden
          className={cx("absolute rounded-full bg-gold-deep", position)}
        />
      ))}
      <section className="flex w-full flex-col items-center rounded-[20px] border border-gold-deep bg-surface px-5 pt-11 pb-3 text-center">
        <h1 className="text-[24px] font-semibold text-gold-deep">{t("Congratulations!")}</h1>
        <p className="mt-6 text-[17px] font-semibold text-ink">
          {t("You reached {n} orders", { n: settings.rewardEvery })}
        </p>
        <p className="mt-7 text-[54px] leading-[1.2] font-semibold text-gold-deep">
          {settings.rewardPercent}%
        </p>
        <p className="mt-3 text-[14px] text-ink">{t("OFF your full order total")}</p>
        <p className="mt-5 text-[12px] text-ink-2">
          {t("Your reward is applied automatically. Delivery is included.")}
        </p>
        <button
          type="button"
          onClick={() => navigate(`/order/confirmed/${uid}`, { replace: true })}
          className="mt-8 h-8 w-full rounded-[8px] bg-gold-deep text-[13px] font-semibold text-bg"
        >
          {t("Continue")}
        </button>
      </section>
    </Screen>
  );
}

/* Order Confirmation */
export function OrderConfirmation() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { orders, startDraft } = useStore();
  const text = useOrderText();
  const names = useProductText();
  const order = orders.find((o) => o.uid === uid);
  if (!order) return <Navigate to="/home" replace />;

  return (
    <Screen
      header={<MobileHeader title={t("Order Confirmation")} />}
      bodyClassName="items-stretch gap-5 px-6 pt-8 pb-4"
      footer={
        <Footer className="gap-2.5 pb-7">
          <Button full onClick={() => navigate(`/orders/${order.uid}/track`)}>
            {t("Track order")}
          </Button>
          <Button
            full
            variant="outline"
            onClick={() => {
              startDraft(order.product, {
                qty: order.qty,
                jar: order.jar ?? "3L",
                reorderOf: order.id,
              });
              navigate(`/order/${order.product}`);
            }}
          >
            {t("Reorder")}
          </Button>
          <Button full size="md" variant="neutral" onClick={() => navigate("/home")}>
            {t("Back to Home")}
          </Button>
        </Footer>
      }
    >
      <div className="flex size-[88px] shrink-0 items-center justify-center self-center rounded-full bg-gold text-bg">
        <Check size={24} />
      </div>
      <h1 className="text-center text-[26px] font-bold text-ink">{t("Order confirmed")}</h1>
      <p className="text-center text-[14px] text-ink-2">
        {t(
          "Thank you. Your order has been received and our team is confirming stock and your delivery slot.",
        )}
      </p>
      <Card className="flex flex-col gap-2.5 p-4">
        <KeyValue label={t("Order number")} value={`#${order.id}`} />
        <KeyValue label={t("Product")} value={names.name(order.product)} />
        <KeyValue label={t("Quantity")} value={text.qty(order.product, order.qty, order.jar)} />
        <KeyValue label={t("Delivery address")} value={t(order.address)} />
        <KeyValue label={t("Expected delivery")} value={t(order.slot)} />
        <div className="flex items-center justify-between gap-4 text-[14px]">
          <span className="text-ink-2">{t("Order status")}</span>
          <StatusPill status={order.status} />
        </div>
      </Card>
    </Screen>
  );
}

/* Add New Address */
export function AddAddress() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addresses, addAddress, updateAddress, setDraft } = useStore();
  const [params] = useSearchParams();
  const useNow = params.get("use") === "1";
  const editing = addresses.find((a) => a.id === params.get("edit"));
  const [form, setForm] = useState({
    label: editing ? t(editing.label) : "",
    line: editing ? t(editing.line) : "",
    city: editing ? t(editing.city) : "",
    notes: editing?.notes ?? "",
  });
  const [save, setSave] = useState(true);
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));
  const valid = Boolean(form.label.trim() && form.line.trim() && form.city.trim());

  const submit = async () => {
    const address = {
      label: form.label.trim(),
      line: form.line.trim(),
      city: form.city.trim(),
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      await updateAddress(editing.id, address);
    } else {
      const created = await addAddress(address);
      if (created && useNow) setDraft({ addressId: created.id });
    }
    navigate(-1);
  };

  return (
    <Screen
      header={<MobileHeader title={t("Add New Address")} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          <Button full disabled={!valid} onClick={() => void submit()}>
            {t("Save & Use This Address")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-[150px] shrink-0 flex-col items-center justify-center rounded-[16px] border border-line bg-surface">
        <MapPin size={24} className="text-gold" />
        <span className="text-[13px] leading-5 text-ink-2">{t("Pin location on map")}</span>
      </div>
      <Input
        label={t("Address Label")}
        placeholder={t("e.g. Zarqa Warehouse")}
        value={form.label}
        onChange={(e) => set({ label: e.target.value })}
      />
      <Input
        label={t("Street & Building")}
        placeholder={t("Street, building no.")}
        value={form.line}
        onChange={(e) => set({ line: e.target.value })}
      />
      <Input
        label={t("City / Area")}
        placeholder={t("e.g. Zarqa")}
        value={form.city}
        onChange={(e) => set({ city: e.target.value })}
      />
      <TextArea
        label={t("Delivery Notes (optional)")}
        placeholder={t("e.g. Gate 2, ask for reception")}
        value={form.notes}
        onChange={(e) => set({ notes: e.target.value })}
      />
      {!editing && <Checkbox checked={save} label={t("Save to my addresses")} onChange={setSave} />}
    </Screen>
  );
}
