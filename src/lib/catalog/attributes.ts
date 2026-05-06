// Per-category product attribute configuration.
// Categories pick which built-in product attributes show in the product form
// and on the product detail page, plus which of those are required.

export const PRODUCT_ATTRIBUTE_KEYS = [
  "amountRange",
  "tenureRange",
  "flatRate",
  "decliningRate",
  "adminFee",
  "insurance",
  "earlySettlement",
  "latePayment",
  "eligibility",
  "documents",
] as const;

export type ProductAttributeKey = (typeof PRODUCT_ATTRIBUTE_KEYS)[number];

export const ALL_ATTRIBUTES_ENABLED: ProductAttributeKey[] = [...PRODUCT_ATTRIBUTE_KEYS];

export function isProductAttributeKey(value: string): value is ProductAttributeKey {
  return (PRODUCT_ATTRIBUTE_KEYS as readonly string[]).includes(value);
}

export interface AttributeConfig {
  enabled: ReadonlySet<ProductAttributeKey>;
  required: ReadonlySet<ProductAttributeKey>;
}

export function makeAttributeConfig(
  enabledList: readonly string[],
  requiredList: readonly string[],
): AttributeConfig {
  const enabled = new Set<ProductAttributeKey>(
    enabledList.filter(isProductAttributeKey) as ProductAttributeKey[],
  );
  // A required attribute that isn't enabled is meaningless — drop it.
  const required = new Set<ProductAttributeKey>(
    requiredList
      .filter(isProductAttributeKey)
      .filter((k) => enabled.has(k as ProductAttributeKey)) as ProductAttributeKey[],
  );
  return { enabled, required };
}
