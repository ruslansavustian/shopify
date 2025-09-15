import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  type CartInput,
  type CartLinesDiscountsGenerateRunResult,
} from "../generated/api";

interface FunnelDiscountTier {
  min_quantity: number;
  discount_percentage: number;
}

interface FunnelDiscountSettings {
  quantity_tiers: FunnelDiscountTier[];
  max_discount: number;
}

interface Funnel {
  id: string;
  name: string;
  products: string[];
  discount_settings: FunnelDiscountSettings;
  banner_text: string;
  status?: string; // Добавить статус
}

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    return { operations: [] };
  }

  // Get funnel data from shop metafield
  const funnelMetafield = input.shop?.metafield;

  if (!funnelMetafield?.value) {
    return { operations: [] };
  }

  let funnels: Funnel[] = [];
  try {
    funnels = JSON.parse(funnelMetafield.value);
  } catch (error) {
    console.error("Error parsing funnel data:", error);
    return { operations: [] };
  }

  if (!funnels.length) {
    return { operations: [] };
  }

  const activeFunnels = funnels.filter(
    (funnel: Funnel) =>
      funnel.status?.toUpperCase() === "ACTIVE" || !funnel.status,
  );

  if (!activeFunnels.length) {
    return { operations: [] };
  }

  const operations: CartLinesDiscountsGenerateRunResult["operations"] = [];

  // Group cart lines by product and calculate total quantities
  const productQuantities = new Map<string, number>();
  const productLines = new Map<string, typeof input.cart.lines>();

  console.log(`Cart lines: ${input.cart.lines.length}`);

  for (const line of input.cart.lines) {
    const merch = line.merchandise;

    if ("product" in merch && merch.product?.id) {
      const productId = merch.product.id;
      console.log(`Cart product ID: ${productId}, quantity: ${line.quantity}`);

      const currentQuantity = productQuantities.get(productId) || 0;
      productQuantities.set(productId, currentQuantity + line.quantity);

      if (!productLines.has(productId)) {
        productLines.set(productId, []);
      }
      productLines.get(productId)!.push(line);
    }
  }

  // Check each funnel for applicable discounts
  for (const funnel of activeFunnels) {
    console.log(`Checking funnel: ${funnel.name}`);
    console.log(`Funnel products: ${funnel.products.join(", ")}`);

    const funnelProductQuantities = new Map<string, number>();
    const funnelProductLines = new Map<string, any[]>();

    // Calculate quantities for products in this funnel
    for (const productId of funnel.products) {
      if (productQuantities.has(productId)) {
        funnelProductQuantities.set(
          productId,
          productQuantities.get(productId)!,
        );
        funnelProductLines.set(productId, productLines.get(productId)!);
        console.log(
          `Found product ${productId} with quantity ${productQuantities.get(productId)}`,
        );
      }
    }

    if (funnelProductQuantities.size === 0) {
      console.log(`No products from funnel ${funnel.name} in cart`);
      continue;
    }

    // Calculate total quantity for this funnel
    const totalFunnelQuantity = Array.from(
      funnelProductQuantities.values(),
    ).reduce((sum, qty) => sum + qty, 0);

    console.log(`Total funnel quantity: ${totalFunnelQuantity}`);
    console.log(
      `Available tiers:`,
      JSON.stringify(funnel.discount_settings.quantity_tiers, null, 2),
    );

    // Find applicable discount tier
    const applicableTier = funnel.discount_settings.quantity_tiers
      .sort((a, b) => b.min_quantity - a.min_quantity)
      .find((tier) => totalFunnelQuantity >= tier.min_quantity);

    if (!applicableTier) {
      console.log(
        `No applicable tier found for quantity ${totalFunnelQuantity}`,
      );
      continue;
    }

    console.log(
      `Found applicable tier:`,
      JSON.stringify(applicableTier, null, 2),
    );

    const discountPercentage = applicableTier.discount_percentage;
    const message = `${discountPercentage}% OFF - ${funnel.name} (${totalFunnelQuantity} items)`;

    // Create discount operations based on discount classes
    if (hasOrderDiscountClass) {
      operations.push({
        orderDiscountsAdd: {
          candidates: [
            {
              message,
              targets: [
                {
                  orderSubtotal: {
                    excludedCartLineIds: [],
                  },
                },
              ],
              value: {
                percentage: {
                  value: Number(discountPercentage),
                },
              },
            },
          ],
          selectionStrategy: OrderDiscountSelectionStrategy.First,
        },
      });
    }

    if (hasProductDiscountClass) {
      // Create product discounts for each product in the funnel
      const productCandidates = [];

      for (const [, lines] of funnelProductLines) {
        for (const line of lines) {
          productCandidates.push({
            message: `${discountPercentage}% OFF - ${funnel.name}`,
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              percentage: {
                value: Number(discountPercentage),
              },
            },
          });
        }
      }

      if (productCandidates.length > 0) {
        operations.push({
          productDiscountsAdd: {
            candidates: productCandidates,
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        });
      }
    }

    // Добавить break после создания операций для первой подходящей воронки
    break; // ← Добавить эту строку
  }

  console.log(`Total operations created: ${operations.length}`);
  console.log(`Operations:`, JSON.stringify(operations, null, 2));

  return {
    operations,
  };
}
