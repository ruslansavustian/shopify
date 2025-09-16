-- AlterTable
ALTER TABLE "public"."Session" ALTER COLUMN "collaborator" DROP DEFAULT,
ALTER COLUMN "emailVerified" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."order_analytics" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "customerEmail" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "lineItemsCount" INTEGER NOT NULL DEFAULT 0,
    "funnelId" TEXT,
    "funnelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."funnel_performance" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "funnelName" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "discountsIssued" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ordersAffected" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shop_analytics" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "totalDiscountsIssued" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_analytics_orderId_key" ON "public"."order_analytics"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_performance_funnelId_key" ON "public"."funnel_performance"("funnelId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_analytics_shopDomain_key" ON "public"."shop_analytics"("shopDomain");
