
import React, { useState } from "react";

import {
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";

import { useUser } from "../context/UserContext";
import Text from "../components/AppText";

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LogoutModal({
  visible,
  onClose,
}: LogoutModalProps) {
  const { logout } = useUser();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      onClose();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-5">

        <View className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800">

          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Are you sure?
          </Text>

          <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You will be logged out.
          </Text>

          <View className="flex-row gap-3 mt-6">

            <TouchableOpacity
              onPress={onClose}
              disabled={loggingOut}
              className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-700"
            >
              <Text className="text-center font-medium text-gray-700 dark:text-gray-300">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={loggingOut}
              className="flex-1 py-3 rounded-lg bg-gray-900 dark:bg-gray-700 flex-row justify-center items-center"
            >
              {loggingOut ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-center font-semibold text-white">
                  Logout
                </Text>
              )}
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>
  );
}
