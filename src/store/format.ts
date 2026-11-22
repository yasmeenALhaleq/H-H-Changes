import { useI18n } from "@/i18n";
import {
  findProduct,
  useStore,
  type CatalogProduct,
  type JarSize,
  type Order,
  type ProductId,
} from "./index";

/**
 * Product text in the current language. The built-in products take their Arabic
 * from the copy; products the operations team added carry their own Arabic name.
 */
export function useProductText() {
  const { t, lang } = useI18n();
  const { catalog } = useStore();
  const product = (p: CatalogProduct | ProductId) =>
    typeof p === "string" ? findProduct(catalog, p) : p;
  return {
    product,
    name: (p: CatalogProduct | ProductId) => {
      const item = product(p);
      return lang === "ar" && item.nameAr ? item.nameAr : t(item.name);
    },
    description: (p: CatalogProduct | ProductId) => {
      const item = product(p);
      return lang === "ar" && item.descriptionAr ? item.descriptionAr : t(item.description);
    },
    /** Short unit next to a quantity: `kg`, `L`, `pcs`. */
    unit: (p: CatalogProduct | ProductId) => t(product(p).unit),
    /** Unit as a label: `Kilogram (kg)`, `Jar (3L / 8L)`. */
    unitLong: (p: CatalogProduct | ProductId) => t(product(p).unitLong),
  };
}

/** Text helpers for describing orders in the current language. */
export function useOrderText() {
  const { t, money } = useI18n();
  const products = useProductText();

  const qty = (product: ProductId, amount: number, jar?: JarSize): string => {
    // Oxygen is counted in jars: "8L jar × 2".
    if (product === "oxygen") return `${t(`${jar ?? "3L"} jar`)} × ${amount}`;
    return `${amount} ${products.unit(product)}`;
  };

  return {
    qty,
    /** `Dry Ice 10 kg` — used on customer order cards. */
    line: (order: Order) =>
      `${order.product === "nitrogen" ? t("Liquid Nitrogen") : products.name(order.product)} ${qty(order.product, order.qty, order.jar)}`,
    /** `Dry Ice • 10 kg` — used in history lists and admin tables. */
    bullet: (order: Order) =>
      `${products.name(order.product)} • ${qty(order.product, order.qty, order.jar)}`,
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
