import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { updateAnalytics, getAllFunnels } from "../lib/graphql";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🎣 Webhook received: orders/paid");

  try {
    // 1. Аутентификация webhook от Shopify
    const { topic, admin, payload } = await authenticate.webhook(request);

    if (topic !== "ORDERS_PAID") {
      console.log("❌ Wrong topic:", topic);
      return new Response("Wrong topic", { status: 400 });
    }

    const order = payload;
    console.log(`🛒 Processing order: ${order.name} (ID: ${order.id})`);

    // 2. Проверяем есть ли скидки
    const discountAmount = parseFloat(order.total_discounts || "0");
    console.log(`💰 Total discount: $${discountAmount}`);

    if (discountAmount > 0) {
      // 3. Определяем какая воронка применилась
      const { funnels, shopId } = await getAllFunnels(admin);
      console.log(
        `🔍 Checking ${funnels.length} funnels for shop ${shopId}...`,
      );

      let matchedFunnel = null;
      const orderProductIds =
        order.line_items?.map(
          (item: any) => `gid://shopify/Product/${item.product_id}`,
        ) || [];

      console.log("📦 Order products:", orderProductIds);

      // Ищем совпадения продуктов с воронками
      for (const funnel of funnels) {
        const hasCommonProducts = funnel.products.some(
          (funnelProduct: string) => orderProductIds.includes(funnelProduct),
        );

        if (hasCommonProducts) {
          matchedFunnel = funnel;
          console.log(`✅ Matched funnel: ${funnel.name}`);
          break;
        }
      }

      // 4. Обновляем аналитику
      const updateResult = await updateAnalytics(admin, {
        discountAmount,
        funnelId: matchedFunnel?.id || "unknown",
        funnelName: matchedFunnel?.name || "Other Discount",
        orderInfo: {
          order_id: order.id.toString(),
          order_number: order.name,
        },
      });

      if (updateResult.success) {
        console.log("✅ Analytics updated successfully");
      } else {
        console.error("❌ Failed to update analytics:", updateResult.error);
      }
    } else {
      console.log("ℹ️ No discounts in this order, skipping analytics");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
