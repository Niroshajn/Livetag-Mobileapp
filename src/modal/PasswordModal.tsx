import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { X } from "lucide-react-native";

interface Props {
  onCancel: () => void;
}

export default function PasswordModal({ onCancel }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <View className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden">

      {/* HEADER */}
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-lg font-semibold text-black dark:text-white">
          Change Password
        </Text>

        <TouchableOpacity onPress={onCancel}>
          <X size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View className="p-5">

        <Text className="text-sm text-gray-500 mb-1">
          Current Password
        </Text>
        <TextInput
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          className="border border-gray-200 dark:border-gray-700 px-3 py-3 rounded-lg mb-3"
        />

        <Text className="text-sm text-gray-500 mb-1">
          New Password
        </Text>
        <TextInput
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          className="border border-gray-200 dark:border-gray-700 px-3 py-3 rounded-lg"
        />
      </View>

      {/* FOOTER */}
      <View className="flex-row gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 border border-gray-300 py-3 rounded-lg"
        >
          <Text className="text-center text-black dark:text-white">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 bg-blue-600 py-3 rounded-lg"
        >
          <Text className="text-white text-center">
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}