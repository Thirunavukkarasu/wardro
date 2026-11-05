import { Modal, Pressable, Text, View } from "react-native";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Cross-platform destructive confirmation. `Alert.alert` buttons are not
 * reliable on react-native-web, so this uses a plain Modal everywhere.
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-md rounded-[20px] bg-white p-6">
          <Text className="text-lg font-bold text-ink">{title}</Text>
          <Text className="mt-2 text-sm leading-5 text-ink-secondary">
            {message}
          </Text>

          <View className="mt-6 flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              className="rounded-full px-5 py-2.5 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-ink-secondary">
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={busy}
              className={`rounded-full px-5 py-2.5 active:opacity-80 ${
                busy ? "bg-danger/60" : "bg-danger"
              }`}
            >
              <Text className="text-sm font-bold text-white">
                {busy ? "Deleting…" : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
