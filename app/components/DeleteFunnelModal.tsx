import { Modal, Text } from "@shopify/polaris";

interface DeleteFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteFunnelModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteFunnelModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete Funnel"
      primaryAction={{
        content: "Delete",
        onAction: onConfirm,
        loading: isLoading,
        destructive: true,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Text as="p">
          Are you sure you want to delete this funnel? This action cannot be
          undone.
        </Text>
      </Modal.Section>
    </Modal>
  );
}
