import { useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MapPin, Package } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import {
  canCancel,
  DELIVERY_FEE,
  isActive,
  PRODUCTS,
  useStore,
  type Order,
  type OrderStatus,
} from "@/store";
import { useOrderText } from "@/store/format";
import { Footer, MobileHeader, Screen } from "@/components/mobile";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  KeyValue,
  LinkButton,
  OptionCard,
  RadioDot,
  StatusPill,
  Tabs,
  TextArea,
  TimelineStep,
} from "@/components/ui";
import { OrderCard } from "./shop";

function useOrder(): Order | undefined {
  const { uid } = useParams();
  const { orders } = useStore();
  return orders.find((o) => o.uid === uid && o.mine);
}

const stepIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  on_the_way: 2,
  delivered: 4,
  cancelled: -1,
};

function stepState(order: Order, index: number): "done" | "current" | "todo" {
  const reached = stepIndex[order.status];
  if (index < reached) return "done";
  return index === reached ? "current" : "todo";
}

/* My Orders — Active / Active (Empty) / History */
export function MyOrders() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { orders } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "active";
  const mine = orders.filter((o) => o.mine);
  const list = mine.filter((o) => (tab === "active" ? isActive(o) : !isActive(o)));

  return (
    <Screen
      nav
      header={<MobileHeader title={t("My Orders")} />}
      bodyClassName="gap-4 px-6 pt-2 pb-4"
    >
      <Tabs
        className="gap-5"
        value={tab}
        onChange={(next) =>
          setParams(next === "history" ? { tab: "history" } : {}, { replace: true })
        }
        options={[
          { value: "active", label: t("Active / Upcoming") },
          { value: "history", label: t("History") },
        ]}
      />
      {list.length > 0 ? (
        list.map((order) => <OrderCard key={order.uid} order={order} />)
      ) : (
        <EmptyState
          icon={Package}
          title={t("No active orders")}
          body={t("Your upcoming and on-the-way orders will appear here.")}
          action={
            <Button size="md" onClick={() => navigate("/products")}>
              {t("Create order")}
            </Button>
          }
        />
      )}
    </Screen>
  );
}

/* Order Details & Tracking — #1024 */
export function OrderDetails() {
  const navigate = useNavigate();
  const { t, money } = useI18n();
  const { startDraft } = useStore();
  const text = useOrderText();
  const order = useOrder();
  if (!order) return <Navigate to="/orders" replace />;

  const unit = t(PRODUCTS[order.product].unit);
  const subtotal = order.total === null ? null : order.total - DELIVERY_FEE;
  const times =
    order.id === 1024
      ? ["Today · 09:02", "Today · 11:30", "Today · 13:20", "Estimated 14:30"]
      : ["", "", "", ""];
  const steps = ["Order confirmed", "Preparing your order", "Out for delivery", "Delivered"];

  return (
    <Screen
      header={<MobileHeader title={t("Order #{id}", { id: order.id })} back />}
      bodyClassName="gap-4 px-6 pt-4 pb-3"
      footer={
        <Footer className="flex-row pb-7">
          <Button
            variant="outline"
            className="flex-1 px-3"
            onClick={() => navigate("/profile/help")}
          >
            {t("Contact support")}
          </Button>
          <Button
            className="flex-1 px-3"
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
        </Footer>
      }
    >
      <div className="flex items-center gap-3">
        <StatusPill status={order.status} />
        <span className="text-[13px] text-ink-2">
          {order.id === 1024 && order.status === "on_the_way"
            ? t("Arrives today, 14:00 – 16:00")
            : t(order.slot)}
        </span>
      </div>

      {order.status !== "cancelled" && (
        <Card className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ink">{t("Tracking")}</h2>
            {isActive(order) && (
              <LinkButton
                className="text-[13px]"
                onClick={() => navigate(`/orders/${order.uid}/track`)}
              >
                {t("Track Order")}
              </LinkButton>
            )}
          </div>
          {steps.map((step, i) => (
            <TimelineStep
              key={step}
              state={stepState(order, i)}
              title={t(step)}
              time={t(times[i])}
              last={i === steps.length - 1}
            />
          ))}
        </Card>
      )}

      <Card className="flex flex-col gap-2.5 p-3.5">
        <KeyValue label={t("Items")} value={text.line(order)} />
        <KeyValue label={t("Delivery address")} value={t(order.address)} />
        <KeyValue label={t("Expected delivery")} value={t(order.slot)} />
        <KeyValue label={t("Driver")} value={t(order.driver ?? "Assigned on dispatch")} />
      </Card>

      <Card className="flex flex-col gap-2.5 p-3.5">
        <KeyValue
          label={t("Subtotal ({q})", { q: `${order.qty} ${unit}` })}
          value={subtotal === null ? t("To be confirmed") : money(subtotal)}
        />
        <KeyValue label={t("Delivery included")} value={t("Included")} />
        <KeyValue label={t("Total (proposed)")} value={text.total(order)} />
      </Card>

      {canCancel(order) && (
        <LinkButton
          className="self-start text-[14px] text-err"
          onClick={() => navigate(`/orders/${order.uid}/cancel`)}
        >
          {t("Cancel order")}
        </LinkButton>
      )}
    </Screen>
  );
}

/* My Orders — Order Tracking */
export function OrderTracking() {
  const { t } = useI18n();
  const order = useOrder();
  if (!order) return <Navigate to="/orders" replace />;

  const seeded = order.id === 1024;
  const steps = [
    { title: "Order Confirmed", time: seeded ? "Today, 09:10" : "" },
    { title: "Preparing", time: seeded ? "Today, 09:40" : "" },
    { title: "On the way", time: seeded ? "Today, 12:15" : "" },
    { title: "Delivered", time: order.status === "delivered" ? (order.closedOn ?? "") : "Pending" },
  ];

  return (
    <Screen
      header={<MobileHeader title={t("Track Order")} back />}
      bodyClassName="gap-4 px-6 py-4"
      footer={
        <Footer>
          <Button full variant="outline" disabled={!order.driver}>
            {t("Call Driver")}
          </Button>
        </Footer>
      }
    >
      <div className="flex h-[180px] shrink-0 flex-col items-center justify-center rounded-[16px] border border-line bg-surface">
        <MapPin size={24} className="text-gold" />
        <span className="text-[13px] leading-5 text-ink-2">{t("Live delivery location")}</span>
      </div>
      <Card className="p-3.5">
        <KeyValue label={t("Estimated arrival")} value={t(order.slot.replace(" · ", ", "))} />
      </Card>
      <Card className="flex flex-col p-4">
        {steps.map((step, i) => (
          <TimelineStep
            key={step.title}
            state={stepState(order, i)}
            title={t(step.title)}
            time={t(step.time)}
            last={i === steps.length - 1}
          />
        ))}
      </Card>
      <Card className="flex items-center gap-3 p-3.5">
        <Avatar initials="DR" size={40} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[16px] leading-6 font-semibold text-ink">
            {t(order.driver ?? "Driver Name")}
          </span>
          <span className="text-[13px] leading-5 text-ink-2">{t("Plate No. XX-XXXX")}</span>
        </div>
      </Card>
    </Screen>
  );
}

const reasons = ["Ordered by mistake", "Need a different date", "Other"] as const;

/* My Orders — Cancel Order */
export function CancelOrder() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { cancelOrder } = useStore();
  const text = useOrderText();
  const order = useOrder();
  const [reason, setReason] = useState<(typeof reasons)[number]>("Ordered by mistake");
  const [notes, setNotes] = useState("");
  if (!order || !canCancel(order)) return <Navigate to="/orders" replace />;

  return (
    <Screen
      header={<MobileHeader title={t("Cancel Order")} back />}
      bodyClassName="gap-3.5 px-6 py-4"
      footer={
        <Footer>
          <Button
            full
            variant="danger"
            onClick={() => {
              void cancelOrder(order.uid, [reason, notes.trim()].filter(Boolean).join(" — ")).then(
                (failure) => {
                  if (!failure) navigate("/orders?tab=history", { replace: true });
                },
              );
            }}
          >
            {t("Confirm Cancellation")}
          </Button>
          <Button full variant="outline" onClick={() => navigate(-1)}>
            {t("Keep Order")}
          </Button>
        </Footer>
      }
    >
      <p className="text-[15px] leading-[1.5] text-ink-2">
        {t("Orders can be cancelled while their status is Pending or Confirmed.")}
      </p>
      <Card className="flex flex-col p-3.5">
        <KeyValue label={t("Order")} value={`#${order.id}`} />
        <KeyValue label={t("Product")} value={text.bullet(order)} />
        <KeyValue
          label={t("Status")}
          value={t(order.status === "pending" ? "Pending" : "Confirmed")}
        />
      </Card>
      <p className="text-[14px] font-medium text-ink">{t("Reason (optional)")}</p>
      <div className="flex flex-col gap-3.5" role="radiogroup">
        {reasons.map((option) => (
          <OptionCard
            key={option}
            checked={reason === option}
            onChange={() => setReason(option)}
            className="gap-2.5"
          >
            <RadioDot checked={reason === option} />
            <span className="text-[14px] text-ink">{t(option)}</span>
          </OptionCard>
        ))}
      </div>
      <TextArea
        label={t("Additional notes")}
        placeholder={t("Optional")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Screen>
  );
}
