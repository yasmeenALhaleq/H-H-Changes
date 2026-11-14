import { useI18n } from "@/i18n";
import { PRODUCTS, type JarSize, type Order, type ProductId } from "./index";

/** Text helpers for describing orders in the current language. */
export function useOrderText() {
  const { t, money } = useI18n();

  const qty = (product: ProductId, amount: number, jar?: JarSize): string => {
    if (product === "oxygen" && jar) {
      const size = Number.parseInt(jar, 10);
      if (amount % size === 0) return `${t(`${jar} jar`)} × ${amount / size}`;
    }
    return `${amount} ${t(PRODUCTS[product].unit)}`;
  };

  return {
    qty,
    /** `Dry Ice 10 kg` — used on customer order cards. */
    line: (order: Order) =>
      `${t(order.product === "nitrogen" ? "Liquid Nitrogen" : PRODUCTS[order.product].name)} ${qty(order.product, order.qty, order.jar)}`,
    /** `Dry Ice • 10 kg` — used in history lists and admin tables. */
    bullet: (order: Order) =>
      `${t(PRODUCTS[order.product].name)} • ${qty(order.product, order.qty, order.jar)}`,
    total: (order: Order) => (order.total === null ? t("To be confirmed") : money(order.total)),
  };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
