import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { productId } = await request.json();

    // Get funnel data from shop metafield
    const funnelsResponse = await admin.graphql(
      `#graphql
        query getFunnels {
          shop {
            metafield(namespace: "funnel_discounts", key: "funnels") {
              value
            }
          }
        }`,
    );

    const funnelsData = await funnelsResponse.json();
    let funnels = [];

    if (funnelsData.data?.shop?.metafield?.value) {
      try {
        funnels = JSON.parse(funnelsData.data.shop.metafield.value);
      } catch (error) {
        console.error("Error parsing funnels:", error);
      }
    }

    // Check if product is in any funnel
    for (const funnel of funnels) {
      if (funnel.products.includes(productId)) {
        return Response.json({
          hasDiscount: true,
          funnel: {
            name: funnel.name,
            banner_text: funnel.banner_text,
          },
          tiers: funnel.discount_settings.quantity_tiers,
        });
      }
    }

    return Response.json({ hasDiscount: false });
  } catch (error) {
    console.error("Error checking discount:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

