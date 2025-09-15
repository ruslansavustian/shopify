import { useState, useCallback } from "react";
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
import type { FunnelFormData, FunnelDiscountTier, Product } from "../../types";

interface CreateFunnelPageProps {
  onSubmit: (formData: FunnelFormData) => void;
  products: Product[];
  isLoading: boolean;
}

export function CreateFunnelPage({
  onSubmit,
  products,
  isLoading,
}: CreateFunnelPageProps) {
  const [formData, setFormData] = useState<FunnelFormData>({
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

  const [automaticLabels, setAutomaticLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      await onSubmit(formData);

      // Пауза перед сбросом формы
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error creating funnel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, isSubmitting]);

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

  const removeQuantityTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quantity_tiers: prev.quantity_tiers.filter((_, i) => i !== index),
    }));
  };

  const addProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, productId],
    }));
  };

  const deleteIcon = <Icon source={DeleteIcon} tone="critical" />;

  return (
    <Page
      title="Create New Funnel"
      fullWidth
      primaryAction={{
        content: isSubmitting ? "Creating..." : "Create Funnel",
        onAction: handleSubmit,
        loading: isLoading || isSubmitting,
        disabled: isSubmitting,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          url: "/app",
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <FormLayout>
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
                    {filteredProducts.slice(0, 10).map((product) => (
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
              </BlockStack>

              {formData.products.length > 0 && (
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Selected Products:
                  </Text>
                  {formData.products.map((productId, index) => {
                    const product = products.find((p) => p.id === productId);
                    return (
                      <InlineStack key={productId} align="space-between">
                        <Text as="span">{product?.title}</Text>
                        <Button
                          icon={deleteIcon}
                          tone="critical"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              products: prev.products.filter(
                                (_, i) => i !== index,
                              ),
                            }));
                          }}
                        ></Button>
                      </InlineStack>
                    );
                  })}
                </BlockStack>
              )}

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
                      ></Button>
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
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
