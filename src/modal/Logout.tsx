import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useUser } from "../context/UserContext";

export default function LogoutModal({ visible, onClose }: any) {
  const { logout } = useUser();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">

        <View className="w-[85%] p-6 rounded-xl bg-white dark:bg-[#1a1a1a]">

          <Text className="text-lg font-bold text-black dark:text-white">
            Are you sure?
          </Text>

          <Text className="mt-2 text-sm text-black dark:text-white">
            You will be logged out.
          </Text>

          <View className="flex-row gap-3 mt-6">

            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2 bg-gray-300 dark:bg-gray-200 rounded-md"
            >
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-1 py-2 bg-gray-900 dark:bg-gray-500 rounded-md"
            >
              <Text className="text-center text-gray-100 dark:text-white ">Logout</Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>
  );
}