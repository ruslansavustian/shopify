import {
  DataTable,
  Button,
  ButtonGroup,
  EmptyState,
  Badge,
} from "@shopify/polaris";
import type { Funnel } from "../types";

interface FunnelTableProps {
  funnels: Funnel[];

  onDeleteFunnel: (funnelId: string) => void;
  onEditFunnel?: (funnelId: string) => void;
  onStatusChange: (funnelId: string) => void;
}

export function FunnelTable({
  funnels,
  onStatusChange,
  onDeleteFunnel,
  onEditFunnel,
}: FunnelTableProps) {
  const getStatusBadge = (status: string | undefined) => {
    const statusValue = status || "ACTIVE";
    return (
      <Badge
        tone={statusValue === "ACTIVE" ? "success" : "attention"}
        size="small"
      >
        {statusValue}
      </Badge>
    );
  };

  const rows = funnels.map((funnel) => [
    funnel.name,
    getStatusBadge(funnel.status),
    funnel.products.length,
    `${funnel.discount_settings.max_discount}%`,
    new Date(funnel.created_at).toLocaleDateString(),
    <ButtonGroup key={funnel.id} gap="loose" fullWidth>
      {onEditFunnel && (
        <Button
          size="slim"
          variant="plain"
          onClick={() => onEditFunnel(funnel.id)}
        >
          Edit
        </Button>
      )}

      <Button
        size="slim"
        variant="plain"
        onClick={() => onStatusChange(funnel.id)}
      >
        {funnel.status === "ACTIVE" ? "Deactivate" : "Activate"}
      </Button>

      <Button
        size="slim"
        variant="plain"
        tone="critical"
        onClick={() => onDeleteFunnel(funnel.id)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  if (funnels.length === 0) {
    return (
      <EmptyState
        heading="No funnels created yet"
        action={{
          content: "Create your first funnel",
          url: "/app/create-funnel",
        }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>
          Create discount funnels to encourage customers to buy more products
          and increase your average order value.
        </p>
      </EmptyState>
    );
  }

  return (
    <DataTable
      columnContentTypes={[
        "text",
        "text",
        "numeric",
        "numeric",
        "text",
        "text",
      ]}
      headings={[
        "Name",
        "Status",
        "Products",
        "Max Discount",
        "Created",
        "Actions",
      ]}
      rows={rows}
    />
  );
}
