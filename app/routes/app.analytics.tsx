import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  DataTable,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

interface AnalyticsData {
  total_discounts_issued: number;
  total_discount_amount: number;
  total_orders: number;
  funnel_performance: Array<{
    funnel_id: string;
    funnel_name: string;
    discounts_issued: number;
    discount_amount: number;
    orders_affected: number;
    conversion_rate: number;
  }>;
  recent_orders: Array<{
    order_id: string;
    order_number: string;
    total_discount: number;
    funnel_name: string;
    created_at: string;
  }>;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("Analytics loader called");
  console.log("Request URL:", request.url);

  const { admin } = await authenticate.admin(request);
  console.log("Admin authenticated in analytics:", !!admin);

  // Get analytics data from shop metafield
  const analyticsResponse = await admin.graphql(
    `#graphql
      query getAnalytics {
        shop {
          metafield(namespace: "funnel_discounts", key: "analytics") {
            id
            namespace
            key
            value
          }
        }
      }`,
  );

  const analyticsData = await analyticsResponse.json();
  let analytics: AnalyticsData = {
    total_discounts_issued: 0,
    total_discount_amount: 0,
    total_orders: 0,
    funnel_performance: [],
    recent_orders: [],
  };

  if (analyticsData.data?.shop?.metafield?.value) {
    try {
      analytics = JSON.parse(analyticsData.data.shop.metafield.value);
    } catch (error) {
      console.error("Error parsing analytics data:", error);
    }
  }

  // Get recent orders with discounts
  const ordersResponse = await admin.graphql(
    `#graphql
      query getRecentOrders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              totalDiscountsSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              createdAt
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }`,
    {
      variables: { first: 10 },
    },
  );

  const ordersData = await ordersResponse.json();
  const recentOrders =
    ordersData.data?.orders?.edges?.map((edge: any) => {
      const order = edge.node;
      const totalDiscount = order.totalDiscountsSet.reduce(
        (sum: number, discount: any) =>
          sum + parseFloat(discount.shopMoney.amount),
        0,
      );

      return {
        order_id: order.id,
        order_number: order.name,
        total_discount: totalDiscount,
        funnel_name: "Unknown", // This would need to be tracked separately
        created_at: order.createdAt,
      };
    }) || [];

  return Response.json({ analytics, recentOrders });
};

export default function Analytics() {
  const { analytics, recentOrders } = useLoaderData<typeof loader>();

  const funnelPerformanceRows = analytics.funnel_performance.map(
    (funnel: any) => [
      funnel.funnel_name,
      funnel.discounts_issued,
      `$${funnel.discount_amount.toFixed(2)}`,
      funnel.orders_affected,
      `${funnel.conversion_rate.toFixed(1)}%`,
    ],
  );

  const recentOrdersRows = recentOrders.map((order: any) => [
    order.order_number,
    `$${order.total_discount.toFixed(2)}`,
    order.funnel_name,
    new Date(order.created_at).toLocaleDateString(),
  ]);

  return (
    <Page>
      <TitleBar title="Analytics Dashboard" />

      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Summary Cards */}
            <Layout>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Total Discounts Issued
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.total_discounts_issued}
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Total Discount Amount
                    </Text>
                    <Text as="p" variant="headingLg">
                      ${analytics.total_discount_amount.toFixed(2)}
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Orders Affected
                    </Text>
                    <Text as="p" variant="headingLg">
                      {analytics.total_orders}
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>

            {/* Funnel Performance */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Funnel Performance
                </Text>
                {analytics.funnel_performance.length === 0 ? (
                  <EmptyState
                    heading="No performance data yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Performance data will appear here once customers start
                      using your discount funnels.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "numeric",
                      "text",
                      "numeric",
                      "text",
                    ]}
                    headings={[
                      "Funnel Name",
                      "Discounts Issued",
                      "Total Amount",
                      "Orders",
                      "Conversion Rate",
                    ]}
                    rows={funnelPerformanceRows}
                  />
                )}
              </BlockStack>
            </Card>

            {/* Recent Orders */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Recent Orders with Discounts
                </Text>
                {recentOrders.length === 0 ? (
                  <EmptyState
                    heading="No recent orders with discounts"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Recent orders with discounts will appear here.</p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text"]}
                    headings={["Order #", "Discount Amount", "Funnel", "Date"]}
                    rows={recentOrdersRows}
                  />
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
