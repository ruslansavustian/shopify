import prisma from "../db.server";

// Временное решение для TypeScript ошибок
// @ts-ignore
const shopAnalytics = prisma.shopAnalytics;
// @ts-ignore
const funnelPerformance = prisma.funnelPerformance;

export interface OrderData {
  orderId: string;
  orderName: string;
  shopDomain: string;
  customerEmail?: string;
  discountAmount: number;
  totalAmount: number;
  lineItemsCount: number;
  funnelId?: string;
  funnelName?: string;
}

export interface AnalyticsSummary {
  // Sales Analytics
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;

  // Discount Analytics
  totalDiscountsIssued: number;
  totalDiscountAmount: number;
  averageDiscountAmount: number;
  ordersWithDiscounts: number;
  discountRate: number; // % заказов со скидками

  // Funnel Performance
  funnelPerformance: Array<{
    funnelId: string;
    funnelName: string;
    discountsIssued: number;
    totalDiscountAmount: number;
    ordersAffected: number;
    conversionRate: number;
  }>;

  lastUpdated: string;
}

/**
 * Сохраняет данные заказа в аналитику
 */
export async function saveOrderAnalytics(orderData: OrderData) {
  try {
    console.log("�� Saving order analytics to DB:", orderData);

    // 1. Обновляем общую статистику магазина
    await updateShopAnalytics(
      orderData.shopDomain,
      orderData.discountAmount,
      orderData.totalAmount,
    );

    // 2. Если есть воронка - обновляем её статистику
    if (orderData.funnelId && orderData.funnelName) {
      await updateFunnelPerformance(
        orderData.funnelId,
        orderData.funnelName,
        orderData.shopDomain,
        orderData.discountAmount,
      );
    }

    console.log("✅ Order analytics saved successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error saving order analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Обновляет общую статистику магазина
 */

async function updateShopAnalytics(
  shopDomain: string,
  discountAmount: number,
  totalAmount: number,
) {
  try {
    await shopAnalytics.upsert({
      where: { shopDomain },
      update: {
        totalDiscountsIssued: { increment: 1 },
        totalDiscountAmount: { increment: discountAmount },
        totalOrders: { increment: 1 },
        totalSales: { increment: totalAmount }, // ← ИСПРАВЛЕНО
        lastUpdated: new Date(),
      },
      create: {
        shopDomain,
        totalDiscountsIssued: 1,
        totalDiscountAmount: discountAmount,
        totalOrders: 1,
        totalSales: totalAmount,
      },
    });
  } catch (error) {
    console.error("❌ Error updating shop analytics:", error);
  }
}

/**
 * Обновляет статистику производительности воронки
 */
async function updateFunnelPerformance(
  funnelId: string,
  funnelName: string,
  shopDomain: string,
  discountAmount: number,
) {
  try {
    const result = await funnelPerformance.upsert({
      where: { funnelId },
      update: {
        discountsIssued: { increment: 1 },
        totalDiscountAmount: { increment: discountAmount },
        ordersAffected: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        funnelId,
        funnelName,
        shopDomain,
        discountsIssued: 1,
        totalDiscountAmount: discountAmount,
        ordersAffected: 1,
        conversionRate: 0,
      },
    });

    // Рассчитываем conversion rate
    const conversionRate =
      result.ordersAffected > 0
        ? (result.discountsIssued / result.ordersAffected) * 100
        : 0;

    // Обновляем conversion rate
    await funnelPerformance.update({
      where: { funnelId },
      data: { conversionRate },
    });

    console.log(
      `📈 Updated funnel performance for ${funnelName}: ${conversionRate.toFixed(1)}% conversion rate`,
    );
  } catch (error) {
    console.error("❌ Error updating funnel performance:", error);
  }
}

/**
 * Получает сводную аналитику для магазина
 */
export async function getAnalyticsSummary(
  shopDomain: string,
): Promise<AnalyticsSummary> {
  try {
    console.log("📊 Getting analytics summary for shop:", shopDomain);

    // Получаем общую статистику магазина
    const shopAnalyticsResult = await shopAnalytics.findUnique({
      where: { shopDomain },
    });

    // Получаем статистику по воронкам
    const funnelPerformanceResult = await funnelPerformance.findMany({
      where: { shopDomain },
      orderBy: { totalDiscountAmount: "desc" },
    });

    // Получаем заказы со скидками
    const ordersWithDiscounts = await prisma.orderAnalytics.count({
      where: {
        shopDomain,
        discountAmount: { gt: 0 },
      },
    });

    const totalOrders = shopAnalyticsResult?.totalOrders || 0;
    const totalSales = shopAnalyticsResult?.totalSales || 0;
    const totalDiscountsIssued = shopAnalyticsResult?.totalDiscountsIssued || 0;
    const totalDiscountAmount = shopAnalyticsResult?.totalDiscountAmount || 0;

    const summary: AnalyticsSummary = {
      // Sales Analytics
      totalOrders,
      totalSales,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,

      // Discount Analytics
      totalDiscountsIssued,
      totalDiscountAmount,
      averageDiscountAmount:
        totalDiscountsIssued > 0
          ? totalDiscountAmount / totalDiscountsIssued
          : 0,
      ordersWithDiscounts,
      discountRate:
        totalOrders > 0 ? (ordersWithDiscounts / totalOrders) * 100 : 0,

      // Funnel Performance
      funnelPerformance: funnelPerformanceResult.map((funnel: any) => ({
        funnelId: funnel.funnelId,
        funnelName: funnel.funnelName,
        discountsIssued: funnel.discountsIssued,
        totalDiscountAmount: funnel.totalDiscountAmount,
        ordersAffected: funnel.ordersAffected,
        conversionRate: funnel.conversionRate,
      })),

      lastUpdated:
        shopAnalyticsResult?.lastUpdated?.toISOString() ||
        new Date().toISOString(),
    };

    console.log("✅ Analytics summary retrieved successfully");
    return summary;
  } catch (error) {
    console.error("❌ Error getting analytics summary:", error);
    return {
      totalOrders: 0,
      totalSales: 0,
      averageOrderValue: 0,
      totalDiscountsIssued: 0,
      totalDiscountAmount: 0,
      averageDiscountAmount: 0,
      ordersWithDiscounts: 0,
      discountRate: 0,
      funnelPerformance: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Получает статистику по конкретной воронке
 */
export async function getFunnelAnalytics(funnelId: string) {
  try {
    const funnel = await funnelPerformance.findUnique({
      where: { funnelId },
    });

    if (!funnel) {
      return null;
    }

    return funnel;
  } catch (error) {
    console.error("❌ Error getting funnel analytics:", error);
    return null;
  }
}

/**
 * Очищает старые данные аналитики (старше 90 дней)
 */
export async function cleanupOldAnalytics() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const deletedOrders = await prisma.orderAnalytics.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🧹 Cleaned up ${deletedOrders.count} old order records`);
    return { success: true, deletedCount: deletedOrders.count };
  } catch (error) {
    console.error("❌ Error cleaning up old analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
