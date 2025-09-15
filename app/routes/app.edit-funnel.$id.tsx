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
import type { FunnelFormData, Product, Funnel } from "../types";
import { getAllFunnels } from "app/lib/graphql";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  console.log("Edit funnel loader called");
  console.log("Request URL:", request.url);

  const { admin } = await authenticate.admin(request);
  const { funnels } = await getAllFunnels(admin);
  console.log("Admin authenticated in edit funnel:", !!admin);

  const funnelId = params.id;

  // Get products for selection
  const productsResponse = await admin.graphql(
    `#graphql
      query getProducts($first: Int!) {
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

  // Find the funnel to edit
  const funnelToEdit = funnels.find((funnel: Funnel) => funnel.id === funnelId);

  if (!funnelToEdit) {
    throw new Response("Funnel not found", { status: 404 });
  }

  return Response.json({ products, funnel: funnelToEdit, funnels });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const funnelId = params.id;
  const { funnels } = await getAllFunnels(admin);
  if (action === "update_funnel") {
    const name = formData.get("name") as string;
    const bannerText = formData.get("banner_text") as string;
    const products = JSON.parse(formData.get("products") as string);
    const quantityTiers = JSON.parse(formData.get("quantity_tiers") as string);

    const updatedFunnel = {
      id: funnelId,
      name,
      products,
      banner_text: bannerText,
      discount_settings: {
        quantity_tiers: quantityTiers,
        max_discount: Math.max(
          ...quantityTiers.map((tier: any) => tier.discount_percentage),
        ),
      },
      created_at: formData.get("created_at") as string, // Keep original creation date
      updated_at: new Date().toISOString(),
    };

    let existingFunnels: Funnel[] = [];
    const shopId = funnels.data?.shop?.id;

    if (funnels.data?.shop?.metafield?.value) {
      try {
        existingFunnels = JSON.parse(funnels.data.shop.metafield.value);
      } catch (error) {
        console.error("Error parsing existing funnels:", error);
      }
    }

    if (!shopId) {
      console.error("Shop ID not found");
      return Response.json({
        success: false,
        error: "Failed to get shop information",
      });
    }

    // Update the specific funnel
    const updatedFunnels = existingFunnels.map((funnel) =>
      funnel.id === funnelId ? updatedFunnel : funnel,
    );

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
              value: JSON.stringify(updatedFunnels),
              type: "json",
              ownerId: shopId,
            },
          ],
        },
      },
    );

    const updateData = await updateResponse.json();

    if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "Metafield update errors:",
        updateData.data.metafieldsSet.userErrors,
      );
      return Response.json({
        success: false,
        error: "Failed to update funnel data",
      });
    }

    return Response.json({ success: true, funnel: updatedFunnel });
  }

  return Response.json({ success: false, funnels });
};

export default function EditFunnel() {
  const { products, funnel, funnels } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = fetcher.state === "submitting";

  // Redirect after successful update
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate({ pathname: "/app", search: location.search });
    }
  }, [fetcher.data?.success, navigate, location.search]);

  const handleSubmit = (formData: FunnelFormData) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("action", "update_funnel");
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("banner_text", formData.banner_text);
    formDataToSubmit.append("products", JSON.stringify(formData.products));
    formDataToSubmit.append(
      "quantity_tiers",
      JSON.stringify(formData.quantity_tiers),
    );
    formDataToSubmit.append("created_at", funnel.created_at); // Preserve original creation date
    console.log(formDataToSubmit);
    fetcher.submit(formDataToSubmit, { method: "POST" });
  };

  return (
    <CreateFunnelPage
      onSubmit={handleSubmit}
      products={products}
      isLoading={isLoading}
      initialData={funnel}
      isEditMode={true}
      funnels={funnels}
    />
  );
}
