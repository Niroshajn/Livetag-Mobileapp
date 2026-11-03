
import React, { useState } from "react";

import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import {
  X,
  Mail,
  Share2,
} from "lucide-react-native";

import Text from "../components/AppText";
import api from "../lib/api";

interface ShareGroupProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export default function ShareGroupModal({
  open,
  onClose,
  groupId,
  groupName,
}: ShareGroupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;

    setEmail("");
    onClose();
  };

  const handleShare = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert("Required", "Please enter email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      await api.post(`/frame-groups/${groupId}/share`, {
        email: trimmedEmail,
      });

      Alert.alert(
        "Success",
        "Group shared successfully",
        [
          {
            text: "OK",
            onPress: () => {
              setEmail("");
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "Share group error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to share group"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center items-center bg-black/60 px-5"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-gray-800">

            {/* HEADER */}

            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <Share2 size={23} color="#60A5FA" />

                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Share Group
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                hitSlop={10}
              >
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* GROUP INFORMATION */}

            <View className="mb-5 rounded-xl bg-gray-100 dark:bg-[#252525] p-4">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Sharing Group
              </Text>

              <Text className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {groupName}
              </Text>
            </View>

            {/* EMAIL INPUT */}

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Email
              </Text>

              <View className="flex-row items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] px-3">

                <Mail size={18} color="#9CA3AF" />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter user email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleShare}
                  className="flex-1 ml-3 py-3 text-sm text-gray-900 dark:text-white"
                />
              </View>
            </View>

            {/* FOOTER */}

            <View className="flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">

              {/* CANCEL */}

              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3"
              >
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* SHARE */}

              <TouchableOpacity
                onPress={handleShare}
                disabled={loading}
                activeOpacity={0.7}
                className="flex-row items-center justify-center rounded-lg bg-blue-500 px-4 py-3"
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text className="text-sm font-semibold text-white ml-2">
                      Sharing...
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    Share Group
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
