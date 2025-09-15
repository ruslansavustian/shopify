export interface FunnelDiscountTier {
  min_quantity: number;
  discount_percentage: number;
  description?: string;
  label?: string;
}

export interface FunnelDiscountSettings {
  quantity_tiers: FunnelDiscountTier[];
  max_discount: number;
}

export type FunnelStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Funnel {
  id: string;
  name: string;
  products: string[];
  discount_settings: FunnelDiscountSettings;
  banner_text: string;
  created_at: string;
  updated_at: string;
  status?: FunnelStatus;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
}

export interface FunnelFormData {
  name: string;
  banner_text: string;
  products: string[];
  quantity_tiers: FunnelDiscountTier[];
}
export interface CreateDiscountNodeVariables {
  variables: {
    automaticAppDiscount: {
      title: string;
      functionId: string;
      startsAt: string;
      status: string;
      minimumRequirement: {
        quantity: {
          greaterThanOrEqualToQuantity: number;
        };
      };
      customerGets: {
        value: {
          percentage: number;
        };
        items: {
          allItems: boolean;
        };
      };
    };
  };
}

export interface MetafieldsSetInput {
  metafield: {
    namespace: string;
    key: string;
    value: string;
    type: string;
    ownerId: string;
  };
}
