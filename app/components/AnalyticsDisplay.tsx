import {
  Card,
  Text,
  BlockStack,
  InlineGrid,
  DataTable,
  Modal,
} from "@shopify/polaris";
import { useState } from "react";
import type { AnalyticsSummary } from "../lib/analytics.server";

interface AnalyticsDisplayProps {
  analytics: AnalyticsSummary;
  isLoading?: boolean;
}

export function AnalyticsDisplay({
  analytics,
  isLoading = false,
}: AnalyticsDisplayProps) {
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [showFunnelDetails, setShowFunnelDetails] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            📊 Analytics Overview
          </Text>
          <Text as="p" tone="subdued">
            Loading analytics data...
          </Text>
        </BlockStack>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  // Подготавливаем данные для таблицы воронок
  const funnelTableRows = analytics.funnelPerformance.map((funnel) => [
    funnel.funnelName,
    funnel.discountsIssued.toString(),
    formatCurrency(funnel.totalDiscountAmount),
    funnel.ordersAffected.toString(),
    `${funnel.conversionRate.toFixed(1)}%`,
  ]);

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            📊 Analytics Overview
          </Text>

          {/* Основные метрики */}
          <InlineGrid columns={3} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Discounts Issued
                </Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {analytics.totalDiscountsIssued}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  🎟️ Discount applications
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Savings Provided
                </Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {formatCurrency(analytics.totalDiscountAmount)}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  💰 Customer savings
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Orders with Discounts
                </Text>
                <Text as="p" variant="headingLg" fontWeight="bold">
                  {analytics.totalOrders}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  📦 Successful orders
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>

          <Text as="p" variant="bodySm" tone="subdued">
            Last updated: {formatDate(analytics.lastUpdated)}
          </Text>
        </BlockStack>
      </Card>

      {/* Модальное окно для деталей воронок */}
      <Modal
        open={showFunnelDetails}
        onClose={() => setShowFunnelDetails(false)}
        title="Funnel Performance Details"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Performance metrics for all your discount funnels:
            </Text>

            {analytics.funnelPerformance.length > 0 ? (
              <DataTable
                columnContentTypes={[
                  "text",
                  "numeric",
                  "numeric",
                  "numeric",
                  "numeric",
                ]}
                headings={[
                  "Funnel Name",
                  "Discounts Issued",
                  "Total Amount",
                  "Orders Affected",
                  "Conversion Rate",
                ]}
                rows={funnelTableRows}
              />
            ) : (
              <Text as="p" tone="subdued">
                No funnel performance data available yet.
              </Text>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Модальное окно для недавних заказов */}
      <Modal
        open={showRecentOrders}
        onClose={() => setShowRecentOrders(false)}
        title="Recent Orders with Discounts"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Latest orders that received discounts:
            </Text>

            <Text as="p" tone="subdued">
              Recent orders feature is coming soon. This will show the latest
              orders that received discounts.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
