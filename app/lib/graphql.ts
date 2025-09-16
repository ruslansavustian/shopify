import type {
  CreateDiscountNodeVariables,
  MetafieldsSetInput,
} from "app/types";

export async function safeGraphQL(admin: any, query: string, variables?: any) {
  try {
    const response = await admin.graphql(query, variables);
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("GraphQL Error:", error);
    return { success: false, error };
  }
}

// ===== FUNNELS =====
export async function getAllFunnels(
  admin: any,
  namespace = "funnel_discounts",
) {
  const result = await safeGraphQL(
    admin,
    `#graphql
    query getFunnels {
      shop {
        id
        metafield(namespace: "${namespace}", key: "funnels") {
          id
          namespace
          key
          value
        }
      }
    }`,
  );
  if (!result.success) {
    return { funnels: [], shopId: null };
  }

  const shopId = result.data?.data?.shop?.id;
  let funnels = [];

  if (result.data?.data?.shop?.metafield?.value) {
    try {
      funnels = JSON.parse(result.data.data.shop.metafield.value);

      // Добавить статус по умолчанию для всех воронок
      funnels = funnels.map((funnel: any) => ({
        ...funnel,
        status: funnel.status || "ACTIVE", // Добавить статус по умолчанию
      }));
    } catch (error) {
      console.error("Error parsing funnels data:", error);
    }
  }

  return { funnels, shopId };
}

// ===== UPDATE FUNNELS =====
export async function updateFunnels(
  admin: any,
  funnels: any[],
  shopId: string,
  variables: MetafieldsSetInput,
) {
  console.log(variables);
  return await safeGraphQL(
    admin,
    `#graphql
    mutation updateFunnelsMetafield($metafield: MetafieldsSetInput!) {
      metafieldsSet(metafields: [$metafield]) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: variables,
    },
  );
}

// ===== DISCOUNT NODES =====
export async function getAllDiscountNodes(admin: any, variables?: object) {
  const result = await safeGraphQL(
    admin,
    `#graphql
    query SearchDiscounts($query: String!, $first: Int!) {
      discountNodes(first: $first, query: $query) {
        edges {
          node {
            id
            discount {
              ... on DiscountAutomaticApp {
                title
                status
              }
            }
          }
        }
      }
    }`,
    {
      variables: {
        query: "title:'Funnel Discounts'",
        first: 1,
      },
    },
  );

  if (!result.success) {
    return [];
  }

  return (
    result.data?.data?.discountNodes?.edges?.map((e: any) => ({
      id: e.node?.id,
      title: e.node?.discount?.title,
      status: e.node?.discount?.status,
    })) || []
  );
}

export async function createDiscountNode(
  admin: any,
  variables: CreateDiscountNodeVariables,
) {
  return await safeGraphQL(
    admin,
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
      variables,
    },
  );
}

// ===== PRODUCTS =====
export async function getAllProducts(admin: any) {
  const result = await safeGraphQL(
    admin,
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

  if (!result.success) {
    return [];
  }

  return (
    result.data?.data?.products?.edges?.map((edge: any) => edge.node) || []
  );
}

// ===== ANALYTICS =====

export async function getAnalytics(admin: any) {
  console.log("📊 Getting analytics from metafields...");

  const result = await safeGraphQL(
    admin,
    `#graphql
      query getAnalytics {
        shop {
          metafield(namespace: "funnel_discounts", key: "analytics") {
            value
          }
        }
      }`,
  );
  let analytics: {
    total_discounts_issued: number;
    total_discount_amount: number;
    total_orders: number;
    funnel_performance: any[];
    recent_orders: any[];
    last_updated: string;
    error?: string;
  } = {
    total_discounts_issued: 0,
    total_discount_amount: 0,
    total_orders: 0,
    funnel_performance: [],
    recent_orders: [],
    last_updated: new Date().toISOString(),
  };

  if (!result.success) {
    console.error("❌ Error getting analytics:", result.error);
    return {
      ...analytics,
      error: "Failed to load analytics",
    };
  }

  // Если есть сохраненные данные - мержим их
  if (result.data?.data?.shop?.metafield?.value) {
    try {
      const savedAnalytics = JSON.parse(result.data.data.shop.metafield.value);
      analytics = { ...analytics, ...savedAnalytics };
    } catch (error) {
      console.error("❌ Error parsing analytics data:", error);
    }
  }

  return analytics;
}

export async function updateAnalytics(
  admin: any,
  updateData: {
    discountAmount?: number;
    funnelId?: string;
    funnelName?: string;
    orderInfo?: any;
  },
) {
  console.log("📊 Updating analytics...", updateData);

  try {
    // 1. Получаем текущую аналитику
    const currentAnalytics = await getAnalytics(admin);

    // 2. Обновляем счетчики
    if (updateData.discountAmount && updateData.discountAmount > 0) {
      currentAnalytics.total_discounts_issued += 1;
      currentAnalytics.total_discount_amount += updateData.discountAmount;
      currentAnalytics.total_orders += 1;
    }

    // 3. Обновляем статистику по воронкам
    if (updateData.funnelId && updateData.funnelName) {
      // Инициализируем funnel_performance если не существует
      if (!currentAnalytics.funnel_performance) {
        currentAnalytics.funnel_performance = [];
      }

      const existingFunnelIndex = currentAnalytics.funnel_performance.findIndex(
        (f: any) => f.funnel_id === updateData.funnelId,
      );

      if (existingFunnelIndex === -1) {
        // Добавляем новую воронку
        currentAnalytics.funnel_performance.push({
          funnel_id: updateData.funnelId,
          funnel_name: updateData.funnelName,
          discounts_issued: 1,
          discount_amount: updateData.discountAmount || 0,
          orders_affected: 1,
          conversion_rate: 0,
        });
      } else {
        // Обновляем существующую воронку
        const funnelPerf =
          currentAnalytics.funnel_performance[existingFunnelIndex];
        funnelPerf.discounts_issued += 1;
        funnelPerf.discount_amount += updateData.discountAmount || 0;
        funnelPerf.orders_affected += 1;
      }
    }

    // 4. Добавляем в недавние заказы
    if (updateData.orderInfo) {
      // Инициализируем recent_orders если не существует
      if (!currentAnalytics.recent_orders) {
        currentAnalytics.recent_orders = [];
      }

      currentAnalytics.recent_orders.unshift({
        order_id: updateData.orderInfo.order_id,
        order_number: updateData.orderInfo.order_number,
        total_discount: updateData.discountAmount || 0,
        funnel_name: updateData.funnelName || "Unknown",
        created_at: new Date().toISOString(),
      });

      // Оставляем только последние 10
      if (currentAnalytics.recent_orders.length > 10) {
        currentAnalytics.recent_orders = currentAnalytics.recent_orders.slice(
          0,
          10,
        );
      }
    }

    currentAnalytics.last_updated = new Date().toISOString();

    // 5. Получаем shop ID
    const shopResult = await safeGraphQL(
      admin,
      `#graphql
        query getShop {
          shop {
            id
          }
        }`,
    );

    if (!shopResult.success) {
      console.error("❌ Error getting shop ID:", shopResult.error);
      return { success: false, error: "Failed to get shop ID" };
    }

    const shopId = shopResult.data?.data?.shop?.id;
    if (!shopId) {
      console.error("❌ No shop ID found");
      return { success: false, error: "Shop ID not found" };
    }

    // 6. Сохраняем обратно в метафилд
    const updateResult = await safeGraphQL(
      admin,
      `#graphql
        mutation updateAnalytics($metafields: [MetafieldsSetInput!]!) {
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
              key: "analytics",
              value: JSON.stringify(currentAnalytics),
              type: "json",
              ownerId: shopId,
            },
          ],
        },
      },
    );

    if (!updateResult.success) {
      console.error("❌ Error updating analytics:", updateResult.error);
      return {
        success: false,
        error: updateResult.error,
      };
    }

    // Проверяем на ошибки
    if (updateResult.data?.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "❌ Metafield update errors:",
        updateResult.data.data.metafieldsSet.userErrors,
      );
      return {
        success: false,
        error: updateResult.data.data.metafieldsSet.userErrors,
      };
    }

    console.log("✅ Analytics updated successfully");
    return { success: true, analytics: currentAnalytics };
  } catch (error) {
    console.error("❌ Error updating analytics:", error);
    return {
      success: false,
      error: (error as Error).message || "Unknown error",
    };
  }
}
// ===== GENERAL DATA =====
export async function getAllData(admin: any) {
  const [funnelsResult, productsResult, discountsResult] = await Promise.all([
    getAllFunnels(admin),
    getAllProducts(admin),
    getAllDiscountNodes(admin),
  ]);

  return {
    funnels: funnelsResult.funnels,
    shopId: funnelsResult.shopId,
    products: productsResult,
    discounts: discountsResult,
  };
}
