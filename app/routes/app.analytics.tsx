import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getAnalyticsSummary } from "../lib/analytics.server";
import { AnalyticsDisplay } from "../components/AnalyticsDisplay";
import { Page, Layout } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Получаем shop domain через GraphQL запрос
  const shopResponse = await admin.graphql(`
    query getShop {
      shop {
        myshopifyDomain
      }
    }
  `);

  const shopData = await shopResponse.json();
  const shopDomain = shopData.data?.shop?.myshopifyDomain || "unknown";

  const analytics = await getAnalyticsSummary(shopDomain);

  console.log("📊 Analytics from DB:", analytics);
  return json({ analytics });
};

export default function Analytics() {
  const { analytics } = useLoaderData<typeof loader>();

  return (
    <Page title="Analytics Dashboard">
      <Layout>
        <Layout.Section>
          <AnalyticsDisplay analytics={analytics} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
