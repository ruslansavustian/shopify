import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  Link,
  useNavigate,
  useFetcher,
  useLocation,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineGrid,
  Modal,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

import { FunnelTable } from "../components/FunnelTable";
import type {
  Funnel,
  FunnelDiscountTier,
  CreateDiscountNodeVariables,
  MetafieldsSetInput,
} from "../types";
import {
  createDiscountNode,
  getAllData,
  getAllDiscountNodes,
  getAllFunnels,
  getAnalytics,
  updateFunnels,
} from "app/lib/graphql";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { funnels, products, discounts } = await getAllData(admin);
  const analytics = await getAnalytics(admin);
  console.log("analytics", analytics);
  return Response.json({ funnels, products, discounts, analytics });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { funnels, shopId } = await getAllFunnels(admin);
  const discountsNodes = await getAllDiscountNodes(admin);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "create_funnel") {
    const name = formData.get("name") as string;
    const bannerText = formData.get("banner_text") as string;
    const products = JSON.parse(formData.get("products") as string);
    const quantityTiers = JSON.parse(formData.get("quantity_tiers") as string);

    const newFunnel: Funnel = {
      id: `funnel_${Date.now()}`,
      name,
      products,
      banner_text: bannerText,
      discount_settings: {
        quantity_tiers: quantityTiers,
        max_discount: Math.max(
          ...quantityTiers.map(
            (tier: FunnelDiscountTier) => tier.discount_percentage,
          ),
        ),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "ACTIVE",
    };

    console.log("newFunnel", newFunnel);

    let existingFunnels: Funnel[] = funnels;
    if (funnels.metafield?.value) {
      try {
        existingFunnels = JSON.parse(funnels.metafield.value);
      } catch (error) {
        console.error("Error parsing existing funnels:", error);
      }
    }
    existingFunnels.push(newFunnel);
    if (funnels.length === 1 && discountsNodes.length === 0) {
      const variablesForDiscountNode: CreateDiscountNodeVariables = {
        variables: {
          automaticAppDiscount: {
            title: newFunnel.name,
            functionId: "cca10b57-d680-4a5a-b4af-4900e9acf15d",
            startsAt: new Date().toISOString(),
            status: "ACTIVE",
            minimumRequirement: {
              quantity: {
                greaterThanOrEqualToQuantity: 1,
              },
            },
            customerGets: {
              value: {
                percentage: 0,
              },
              items: {
                allItems: true,
              },
            },
          },
        },
      };
      try {
        await createDiscountNode(admin, variablesForDiscountNode);
      } catch (error) {
        console.error("Error creating discount node:", error);
      }
    }

    const variablesForMetafield: MetafieldsSetInput = {
      metafield: {
        namespace: "funnel_discounts",
        key: "funnels",
        value: JSON.stringify(existingFunnels),
        type: "json",
        ownerId: shopId,
      },
    };

    await updateFunnels(admin, existingFunnels, shopId, variablesForMetafield);

    return Response.json({ success: true, funnel: newFunnel });
  }

  if (action === "delete_funnel") {
    const funnelId = formData.get("funnel_id") as string;
    let existingFunnels: Funnel[] = funnels;
    // Remove funnel
    const updatedFunnels = existingFunnels.filter(
      (funnel) => funnel.id !== funnelId,
    );
    const variablesForMetafield: MetafieldsSetInput = {
      metafield: {
        namespace: "funnel_discounts",
        key: "funnels",
        value: JSON.stringify(updatedFunnels),
        type: "json",
        ownerId: shopId,
      },
    };
    await updateFunnels(admin, updatedFunnels, shopId, variablesForMetafield);

    return Response.json({ success: true });
  }

  if (action === "change_status") {
    const funnelId = formData.get("funnel_id") as string;
    const updatedFunnels = funnels.map((funnel: Funnel) =>
      funnel.id === funnelId
        ? {
            ...funnel,
            status: funnel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
          }
        : funnel,
    );
    const variablesForMetafield: MetafieldsSetInput = {
      metafield: {
        namespace: "funnel_discounts",
        key: "funnels",
        value: JSON.stringify(updatedFunnels),
        type: "json",
        ownerId: shopId,
      },
    };
    await updateFunnels(admin, updatedFunnels, shopId, variablesForMetafield);
    return Response.json({ success: true });
  }

  return Response.json({ success: false });
};

export default function Index() {
  const { funnels, analytics } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const location = useLocation();
  const [funnelToDelete, setFunnelToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if ((fetcher.data as any)?.success) {
        window.location.reload();
      } else {
        console.error("Delete failed:", fetcher.data);
        alert("Failed to delete funnel. Please try again.");
      }
    }
  }, [fetcher.data, fetcher.state]);

  const handleEditFunnel = (funnelId: string) => {
    navigate(`/app/edit-funnel/${funnelId}`);
  };

  const handleDeleteFunnel = (funnelId: string) => {
    setFunnelToDelete(funnelId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (funnelToDelete) {
      const formData = new FormData();
      formData.append("action", "delete_funnel");
      formData.append("funnel_id", funnelToDelete);

      fetcher.submit(formData, { method: "POST" });
    }
    setShowDeleteModal(false);
    setFunnelToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFunnelToDelete(null);
  };

  const handleChangeStatus = async (funnelId: string) => {
    const formData = new FormData();
    formData.append("action", "change_status");
    formData.append("funnel_id", funnelId);
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <Page>
      <Layout>
        {/* Header Section */}

        {/* Analytics Section */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              📊 Analytics Overview
            </Text>

            <Layout>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" tone="subdued">
                      Total Discounts Issued
                    </Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {analytics.total_discounts_issued}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      🎟️ Discount applications
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" tone="subdued">
                      Total Savings Provided
                    </Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      ${(analytics.total_discount_amount || 0).toFixed(2)}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      💰 Customer savings
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm" tone="subdued">
                      Orders with Discounts
                    </Text>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {analytics.total_orders}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      📦 Successful orders
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div className="funnel-header">
                <InlineGrid columns={2}>
                  <div>
                    <Text as="h1" variant="headingLg">
                      Funnel Discounts Manager
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Create and manage discount funnels to increase average
                      order value
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                    }}
                  >
                    <Link
                      to={{
                        pathname: "create-funnel",
                        search: location.search,
                      }}
                    >
                      <Button variant="primary" size="large">
                        Create New Funnel
                      </Button>
                    </Link>
                  </div>
                </InlineGrid>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Funnels Table Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text as="h2" variant="headingMd">
                  Your Funnels
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  {funnels.length} {funnels.length === 1 ? "funnel" : "funnels"}{" "}
                  created
                </Text>
              </div>

              <FunnelTable
                onStatusChange={handleChangeStatus}
                funnels={funnels}
                onDeleteFunnel={handleDeleteFunnel}
                onEditFunnel={handleEditFunnel}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={cancelDelete}
        title="Delete Funnel"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: cancelDelete,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack>
            <Text as="p">
              Are you sure you want to delete this funnel? This action cannot be
              undone. All discount settings and product associations will be
              removed.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
