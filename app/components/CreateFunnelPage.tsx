import { useState, useCallback, useEffect } from "react";
import { useLocation } from "@remix-run/react";
import { DeleteIcon } from "@shopify/polaris-icons";
import {
  Page,
  Card,
  TextField,
  FormLayout,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Layout,
  Icon,
  Box,
  Checkbox,
  List,
} from "@shopify/polaris";
import type {
  FunnelFormData,
  FunnelDiscountTier,
  Product,
  Funnel,
} from "../types";

interface CreateFunnelPageProps {
  onSubmit: (formData: FunnelFormData) => void;
  products: Product[];
  isLoading: boolean;
  initialData?: Funnel;
  funnels: Funnel[];
  isEditMode?: boolean;
}

export function CreateFunnelPage({
  onSubmit,
  products,
  isLoading,
  initialData,
  funnels,
  isEditMode = false,
}: CreateFunnelPageProps) {
  const location = useLocation();
  const [formData, setFormData] = useState<FunnelFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        banner_text: initialData.banner_text,
        products: initialData.products,
        quantity_tiers: initialData.discount_settings.quantity_tiers.map(
          (tier) => ({
            min_quantity: tier.min_quantity,
            discount_percentage: tier.discount_percentage,
            description:
              tier.description ||
              `${tier.min_quantity} products for ${tier.discount_percentage}% off`,
            label: tier.label || `-${tier.discount_percentage}%`,
          }),
        ),
      };
    }

    return {
      name: "",
      banner_text: "Special Discount Available!",
      products: [],
      quantity_tiers: [
        {
          min_quantity: 2,
          discount_percentage: 10,
          description: "2 products for 10% off",
          label: "2 products for 10% off",
        },
        {
          min_quantity: 5,
          discount_percentage: 20,
          description: "5 products for 20% off",
          label: "5 products for 20% off",
        },
        {
          min_quantity: 10,
          discount_percentage: 30,
          description: "10 products for 30% off",
          label: "10 products for 30% off",
        },
      ],
    };
  });

  const [automaticLabels, setAutomaticLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerProductQty, setBannerProductQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DEMO_PRICE = 29.99;
  const isProductUsed = (productId: string) => {
    return funnels
      .filter((f: Funnel) => f.id !== initialData?.id) // исключаем текущую при редактировании
      .some((f: Funnel) => f.products.includes(productId));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const notUsed = !isProductUsed(product.id);
    return matchesSearch && notUsed;
  });

  const handleAutomaticLabelsChange = () => {
    setAutomaticLabels((prev) => !prev);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return; // Предотвращаем повторные отправки

    // Валидация формы
    if (!formData.name.trim()) {
      alert("Please enter a funnel name");
      return;
    }

    if (formData.products.length === 0) {
      alert("Please select at least one product");
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error creating funnel. Please try again.");
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, isSubmitting]);

  // Reset form when not submitting and not loading (only in create mode)
  useEffect(() => {
    if (!isSubmitting && !isLoading && !isEditMode) {
      setFormData({
        name: "",
        banner_text: "Special Discount Available!",
        products: [],
        quantity_tiers: [
          {
            min_quantity: 2,
            discount_percentage: 10,
            description: "2 products for 10% off",
            label: "2 products for 10% off",
          },
          {
            min_quantity: 5,
            discount_percentage: 20,
            description: "5 products for 20% off",
            label: "5 products for 20% off",
          },
          {
            min_quantity: 10,
            discount_percentage: 30,
            description: "10 products for 30% off",
            label: "10 products for 30% off",
          },
        ],
      });
    }
  }, [isSubmitting, isLoading, isEditMode]);

  const addProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, productId],
    }));
  };

  const removeProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((id) => id !== productId),
    }));
  };

  const addQuantityTier = () => {
    setFormData((prev) => ({
      ...prev,
      quantity_tiers: [
        ...prev.quantity_tiers,
        { min_quantity: 1, discount_percentage: 5 },
      ],
    }));
  };

  const updateQuantityTier = (
    index: number,
    field: keyof FunnelDiscountTier,
    value: number | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      quantity_tiers: prev.quantity_tiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier,
      ),
    }));
  };
  const getApplicableDiscount = () => {
    for (let i = formData.quantity_tiers.length - 1; i >= 0; i--) {
      if (bannerProductQty >= formData.quantity_tiers[i].min_quantity) {
        return formData.quantity_tiers[i].discount_percentage;
      }
    }
    return 0;
  };
  const getDiscountedPrice = () => {
    const discount = getApplicableDiscount();
    return DEMO_PRICE * (1 - discount / 100);
  };

  const getTotalSavings = () => {
    const originalTotal = DEMO_PRICE * bannerProductQty;
    const discountedTotal = getDiscountedPrice() * bannerProductQty;
    return originalTotal - discountedTotal;
  };

  const getTotalPrice = () => {
    return getDiscountedPrice() * bannerProductQty;
  };

  const removeQuantityTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quantity_tiers: prev.quantity_tiers.filter((_, i) => i !== index),
    }));
  };

  const deleteIcon = <Icon source={DeleteIcon} tone="critical" />;

  return (
    <Page
      title={isEditMode ? "Edit Funnel" : "Create New Funnel"}
      fullWidth
      primaryAction={{
        content: isSubmitting
          ? isEditMode
            ? "Updating..."
            : "Creating..."
          : isEditMode
            ? "Update Funnel"
            : "Create Funnel",
        onAction: handleSubmit,
        loading: isLoading || isSubmitting,
        disabled: isSubmitting,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          url: `/app${location.search}`,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Box>
            <FormLayout>
              <div style={{ paddingBottom: "100px" }}>
                <Box maxWidth="600px">
                  <BlockStack gap="300">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">
                          🎨 Banner Preview
                        </Text>

                        <TextField
                          label="Preview Quantity"
                          type="number"
                          value={bannerProductQty.toString()}
                          onChange={(value) =>
                            setBannerProductQty(parseInt(value) || 1)
                          }
                          min={1}
                          placeholder="1"
                          autoComplete="off"
                        />

                        <div
                          style={{
                            background: "#f0f8ff",
                            border: "1px solid #4a90e2",
                            borderRadius: "8px",
                            padding: "15px",
                            margin: "10px 0",
                          }}
                        >
                          {/* Banner Message */}
                          <div
                            style={{
                              fontSize: "16px",
                              color: "#2c5aa0",
                              marginBottom: "10px",
                            }}
                          >
                            <strong>
                              {formData.banner_text ||
                                "Special Discount Available!"}
                            </strong>
                          </div>

                          {/* Dynamic Pricing Block */}
                          <div
                            style={{
                              background: "#f8f9fa",
                              padding: "15px",
                              borderRadius: "6px",
                              marginTop: "15px",
                            }}
                          >
                            {/* Unit Price */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <div style={{ fontSize: "14px", color: "#666" }}>
                                Unit Price:
                              </div>
                              <div
                                style={{ fontSize: "18px", fontWeight: "bold" }}
                              >
                                {getApplicableDiscount() > 0 && (
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#999",
                                      marginRight: "8px",
                                    }}
                                  >
                                    ${DEMO_PRICE.toFixed(2)}
                                  </span>
                                )}
                                <span style={{ color: "#e74c3c" }}>
                                  ${getDiscountedPrice().toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* You Save */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <div style={{ fontSize: "14px", color: "#666" }}>
                                You Save:
                              </div>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                  color: "#27ae60",
                                }}
                              >
                                <span>${getTotalSavings().toFixed(2)}</span>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    marginLeft: "5px",
                                  }}
                                >
                                  ({getApplicableDiscount()}%)
                                </span>
                              </div>
                            </div>

                            {/* Total Price */}
                            <div
                              style={{
                                borderTop: "1px solid #e0e0e0",
                                paddingTop: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{ fontSize: "14px", color: "#666" }}
                                >
                                  Total Price:
                                </div>
                                <div
                                  style={{
                                    fontSize: "20px",
                                    fontWeight: "bold",
                                    color: "#2c5aa0",
                                  }}
                                >
                                  ${getTotalPrice().toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Volume Discounts Tiers */}
                          {formData.quantity_tiers.length > 0 && (
                            <div
                              style={{
                                marginTop: "15px",
                                background: "#fff3cd",
                                padding: "15px",
                                borderRadius: "6px",
                                borderLeft: "4px solid #ffc107",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "16px",
                                  color: "#856404",
                                  fontWeight: "bold",
                                  marginBottom: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ marginRight: "8px" }}>🎯</span>
                                Volume Discounts Available
                              </div>
                              <div style={{ display: "grid", gap: "8px" }}>
                                {formData.quantity_tiers
                                  .sort(
                                    (a, b) => a.min_quantity - b.min_quantity,
                                  )
                                  .map((tier, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        background: "#ffffff",
                                        borderRadius: "4px",
                                        border: "1px solid #ffeaa7",
                                        opacity:
                                          bannerProductQty >= tier.min_quantity
                                            ? 1
                                            : 0.6,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          color: "#6c757d",
                                        }}
                                      >
                                        Buy {tier.min_quantity}+ items
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "bold",
                                          color: "#27ae60",
                                          background: "#d4edda",
                                          padding: "4px 8px",
                                          borderRadius: "12px",
                                        }}
                                      >
                                        {tier.discount_percentage}% OFF
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Text as="span" variant="bodySm" tone="subdued">
                          💡 This is how your banner will appear on product
                          pages
                        </Text>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                </Box>
                <Box maxWidth="1000px" paddingBlockStart="600">
                  <TextField
                    label="Funnel Name"
                    value={formData.name}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, name: value }))
                    }
                    placeholder="e.g., Electronics Bundle"
                    autoComplete="off"
                  />

                  <TextField
                    label="Banner Text"
                    value={formData.banner_text}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, banner_text: value }))
                    }
                    placeholder="Special Discount Available!"
                    autoComplete="off"
                  />

                  <BlockStack gap="300">
                    <TextField
                      autoComplete="off"
                      label="Choose Products"
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Type to search products..."
                    />

                    {searchTerm && filteredProducts.length > 0 && (
                      <List>
                        {filteredProducts.slice(0, 20).map((product) => (
                          <List.Item key={product.id}>
                            <Button
                              variant="plain"
                              onClick={() => {
                                addProduct(product.id);
                                setSearchTerm(""); // Очищаем поиск после выбора
                              }}
                            >
                              {product.title}
                            </Button>
                          </List.Item>
                        ))}
                      </List>
                    )}

                    {/* Selected products */}
                    {formData.products.length > 0 && (
                      <Box paddingBlockStart="600">
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">
                            Selected Products:
                          </Text>
                          {formData.products.map((productId) => {
                            const product = products.find(
                              (p) => p.id === productId,
                            );
                            return (
                              <InlineStack
                                key={productId}
                                align="space-between"
                              >
                                <InlineStack gap="200" align="center">
                                  <Text as="span" variant="bodyLg">
                                    ✅
                                  </Text>
                                  <Text as="span">{product?.title}</Text>
                                </InlineStack>
                                <Button
                                  icon={deleteIcon}
                                  tone="critical"
                                  onClick={() => removeProduct(productId)}
                                />
                              </InlineStack>
                            );
                          })}
                        </BlockStack>
                      </Box>
                    )}
                  </BlockStack>
                </Box>
                <Box paddingBlockStart="600">
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Discount Tiers
                    </Text>
                    {formData.quantity_tiers.map((tier, index) => (
                      <InlineStack key={index} align="start" gap="200">
                        <TextField
                          label="Min Quantity"
                          type="number"
                          min={1}
                          value={tier.min_quantity.toString()}
                          onChange={(value) =>
                            updateQuantityTier(
                              index,
                              "min_quantity",
                              parseInt(value) || 0,
                            )
                          }
                          autoComplete="off"
                        />
                        <TextField
                          label="Discount %"
                          type="number"
                          min={0}
                          value={tier.discount_percentage.toString()}
                          onChange={(value) =>
                            updateQuantityTier(
                              index,
                              "discount_percentage",
                              parseInt(value) || 0,
                            )
                          }
                          autoComplete="off"
                        />
                        <TextField
                          label="Description"
                          value={tier.description}
                          onChange={(value) =>
                            updateQuantityTier(
                              index,
                              "description",
                              value as string,
                            )
                          }
                          autoComplete="off"
                        />
                        <TextField
                          readOnly
                          label="Label"
                          value={
                            automaticLabels
                              ? `-${tier.discount_percentage.toString()}%`
                              : ""
                          }
                          onChange={(value) =>
                            updateQuantityTier(index, "label", value as string)
                          }
                          autoComplete="off"
                        />
                        <Box paddingBlockStart="600">
                          <Button
                            icon={deleteIcon}
                            tone="critical"
                            size="large"
                            variant="primary"
                            onClick={() => removeQuantityTier(index)}
                            disabled={formData.quantity_tiers.length === 1}
                          />
                        </Box>
                      </InlineStack>
                    ))}
                    <InlineStack align="space-between">
                      <Button size="large" onClick={addQuantityTier}>
                        Add Tier
                      </Button>
                      <Checkbox
                        tone="magic"
                        label="Automatic Labels (recommended)"
                        checked={automaticLabels}
                        onChange={handleAutomaticLabelsChange}
                      />
                    </InlineStack>
                  </BlockStack>
                </Box>
              </div>
            </FormLayout>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
