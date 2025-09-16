import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import crypto from "crypto";
import { saveOrderAnalytics, type OrderData } from "../lib/analytics.server";

export async function action({ request }: ActionFunctionArgs) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  const isTest = request.headers.get("X-Shopify-Test") === "true";
  const shopDomain = request.headers.get("X-Shopify-Shop-Domain") || "unknown";

  console.log("🔍 Debug HMAC:");
  console.log("Raw body length:", rawBody.length);
  console.log("Is test webhook:", isTest);
  console.log("HMAC header:", hmacHeader);

  // Проверяем HMAC только для реальных webhook'ов (не тестовых)
  if (hmacHeader && !isTest) {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    const generatedHash = crypto
      .createHmac("sha256", secret || "")
      .update(rawBody, "utf8")
      .digest("base64");

    console.log("Generated HMAC:", generatedHash);
    console.log("Match:", generatedHash === hmacHeader);

    if (generatedHash !== hmacHeader) {
      console.error("❌ Invalid HMAC");
      return json({ error: "Invalid signature" }, { status: 403 });
    }
  } else if (isTest) {
    console.log("🧪 Test webhook from Shopify - skipping HMAC validation");
  } else {
    console.log("🔓 No HMAC header - manual test request");
  }

  // Подпись верна — парсим JSON
  const payload = JSON.parse(rawBody);
  console.log("✅ Webhook orders/paid payload:", payload);

  // Извлекаем нужные данные для аналитики
  const orderData: OrderData = {
    orderId: payload.id.toString(),
    orderName: payload.name,
    shopDomain,
    customerEmail: payload.email || payload.contact_email,
    discountAmount: parseFloat(payload.total_discounts || "0"),
    totalAmount: parseFloat(payload.total_price || "0"),
    lineItemsCount: payload.line_items?.length || 0,
    // Определяем воронку по скидкам
    funnelId: payload.discount_applications?.[0]?.title || undefined,
    funnelName: payload.discount_applications?.[0]?.title || undefined,
  };

  // Сохраняем в БД
  const saveResult = await saveOrderAnalytics(orderData);

  if (saveResult.success) {
    console.log("✅ Order analytics saved to database successfully");
  } else {
    console.error("❌ Failed to save order analytics:", saveResult.error);
  }

  return json({ ok: true });
}
