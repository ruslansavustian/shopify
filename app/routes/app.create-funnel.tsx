import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
  useNavigate,
  useLocation,
} from "@remix-run/react";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
import { CreateFunnelPage } from "../components/CreateFunnelPage";
import type { FunnelFormData, Product } from "../types";
import { getAllDiscountNodes, getAllFunnels } from "app/lib/graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { funnels } = await getAllFunnels(admin);
  // Get products for selection
  const productsResponse = await admin.graphql(
    `query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              status
            }
          }
        }
      }`,
    {
      variables: { first: 50 },
    },
  );

  const productsData = await productsResponse.json();
  const products: Product[] =
    productsData.data?.products?.edges?.map((edge: any) => edge.node) || [];

  const discounts = await getAllDiscountNodes(admin);
  if (discounts.length === 0) {
    console.log("🚀 Creating discount...");

    try {
      const discountResponse = await admin.graphql(
        `#graphql
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          userErrors {
            field
            message
          }
          automaticAppDiscount {
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
        }
      }
    `,
        {
          variables: {
            automaticAppDiscount: {
              title: "Funnel Discounts",
              functionId: "cca10b57-d680-4a5a-b4af-4900e9acf15d",
              startsAt: new Date().toISOString(),
              discountClasses: ["ORDER", "PRODUCT"],
              combinesWith: {
                orderDiscounts: true,
                productDiscounts: true,
                shippingDiscounts: false,
              },
              metafields: [
                {
                  namespace: "funnel_discounts",
                  key: "funnels",
                  type: "json",
                  value: JSON.stringify(funnels), // или новые данные воронки
                },
              ],
            },
          },
        },
      );

      const discountData = await discountResponse.json();
      console.log(
        "✅ Discount created:",
        discountData.data?.discountAutomaticAppCreate?.automaticAppDiscount
          ?.title,
      );
      console.log(
        "�� Discount ID:",
        discountData.data?.discountAutomaticAppCreate?.automaticAppDiscount
          ?.discountId,
      );

      if (
        discountData.data?.discountAutomaticAppCreate?.userErrors?.length > 0
      ) {
        console.error(
          "❌ Errors:",
          discountData.data.discountAutomaticAppCreate.userErrors,
        );
      }
    } catch (error: any) {
      console.error("❌ Error:", error.message);
    }
  }
  return Response.json({ products, funnels });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "create_funnel") {
    const name = formData.get("name") as string;
    const bannerText = formData.get("banner_text") as string;
    const products = JSON.parse(formData.get("products") as string);
    const quantityTiers = JSON.parse(formData.get("quantity_tiers") as string);

    const newFunnel = {
      id: `funnel_${Date.now()}`,
      name,
      products,
      banner_text: bannerText,
      discount_settings: {
        quantity_tiers: quantityTiers,
        max_discount: Math.max(
          ...quantityTiers.map((tier: any) => tier.discount_percentage),
        ),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "ACTIVE",
    };

    // Get shop ID and existing funnels
    const funnelsResponse = await admin.graphql(
      `#graphql
        query getFunnels {
          shop {
            id
            metafield(namespace: "funnel_discounts", key: "funnels") {
              value
            }
          }
        }`,
    );

    const funnelsData = await funnelsResponse.json();
    let existingFunnels: any[] = [];
    const shopId = funnelsData.data?.shop?.id;

    if (funnelsData.data?.shop?.metafield?.value) {
      try {
        existingFunnels = JSON.parse(funnelsData.data.shop.metafield.value);
      } catch (error) {
        console.error("Error parsing existing funnels:", error);
      }
    }

    // Add new funnel
    console.log("newFunnel", newFunnel);
    existingFunnels.push(newFunnel);

    console.log("existingFunnels", existingFunnels);

    const existingDiscounts = await getAllDiscountNodes(admin);
    if (existingDiscounts.length === 0) {
      try {
        await admin.graphql(
          `#graphql
            mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
              discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
                automaticAppDiscount {
                  title
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
          {
            variables: {
              automaticAppDiscount: {
                title: "Funnel Discounts",
                functionId: "cca10b57-d680-4a5a-b4af-4900e9acf15d",
                startsAt: new Date().toISOString(),
                discountClasses: ["ORDER", "PRODUCT"],
              },
            },
          },
        );
        console.log("Discount node created successfully (create-funnel)");
      } catch (error) {
        console.error("Error creating discount node (create-funnel):", error);
        // Continue even if discount creation fails
      }
    }

    if (!shopId) {
      console.error("Shop ID not found");
      return Response.json({
        success: false,
        error: "Failed to get shop information",
      });
    }

    // Update metafield
    const updateResponse = await admin.graphql(
      `#graphql
        mutation updateFunnelsMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          metafields: [
            {
              namespace: "funnel_discounts",
              key: "funnels",
              value: JSON.stringify(existingFunnels),
              type: "json",
              ownerId: shopId,
            },
          ],
        },
      },
    );

    const updateData = await updateResponse.json();

    if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
      return Response.json({
        success: false,
        error: "Failed to save funnel data",
      });
    }

    return Response.json({ success: true, funnel: newFunnel });
  }

  return Response.json({ success: false });
};

export default function CreateFunnel() {
  const { products, funnels } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = fetcher.state === "submitting";

  // Redirect after successful creation
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate({ pathname: "/app", search: location.search });
    }
  }, [fetcher.data?.success, navigate, location.search]);

  const handleSubmit = (formData: FunnelFormData) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("action", "create_funnel");
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("banner_text", formData.banner_text);
    formDataToSubmit.append("products", JSON.stringify(formData.products));
    formDataToSubmit.append(
      "quantity_tiers",
      JSON.stringify(formData.quantity_tiers),
    );

    fetcher.submit(formDataToSubmit, { method: "POST" });
  };

  return (
    <>
      <CreateFunnelPage
        onSubmit={handleSubmit}
        products={products}
        funnels={funnels}
        isLoading={isLoading}
      />
    </>
  );
}
