import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from "react-native";
import { X } from "lucide-react-native";
import { Dimensions } from "react-native";
type Props = {
  visible: boolean;   // ✅ correct
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteModal({
  visible,
  onCancel,
  onConfirm,
}: Props) {
  if (!visible) return null;
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center px-4">

        <View className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5">

          {/* CLOSE BUTTON */}
          <TouchableOpacity
            onPress={onCancel}
            className="absolute top-4 right-4"
          >
            <X size={iconSize} className="text-gray-500 dark:text-gray-300" />
          </TouchableOpacity>

          {/* TITLE */}
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Delete
          </Text>

          {/* MESSAGE */}
          <Text className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete this item?
          </Text>

          {/* ACTIONS */}
          <View className="flex-row justify-end gap-3">

            <TouchableOpacity
              onPress={onCancel}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
            >
              <Text className="text-gray-700 dark:text-gray-300">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="px-4 py-2 rounded-md bg-gray-500 dark:bg-gray-600"
            >
              <Text className="text-white">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}