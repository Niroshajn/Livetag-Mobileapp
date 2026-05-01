import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
} from "react-native";
import { X } from "lucide-react-native";
import { EyeOff } from "lucide-react-native";
import { Eye } from "lucide-react-native";

interface Props {
  onCancel: () => void;
  onSave: (currentPassword: string, newPassword: string) => void;
}

export default function PasswordModal({ onSave, onCancel }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
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
        <View className="relative mb-3">
          <TextInput
            placeholder="Enter current password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showCurrentPass}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            className="border border-gray-200 dark:border-gray-700 px-3 py-3 rounded-lg pr-10"
          />

          <Pressable
            onPress={() => setShowCurrentPass(!showCurrentPass)}
            className="absolute right-3 top-3"
          >
            {showCurrentPass ? (
              <EyeOff size={18} color="#9CA3AF" />
            ) : (
              <Eye size={18} color="#9CA3AF" />
            )}
          </Pressable>
        </View>

        <Text className="text-sm text-gray-500 mb-1">
          New Password
        </Text>
        <View className="relative">
          <TextInput
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showNewPass}
            value={newPassword}
            onChangeText={setNewPassword}
            className="border border-gray-200 dark:border-gray-700 px-3 py-3 rounded-lg pr-10"
          />

          <Pressable
            onPress={() => setShowNewPass(!showNewPass)}
            className="absolute right-3 top-3"
          >
            {showNewPass ? (
              <EyeOff size={18} color="#9CA3AF" />
            ) : (
              <Eye size={18} color="#9CA3AF" />
            )}
          </Pressable>
        </View>
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
          onPress={() => onSave(currentPassword, newPassword)}
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