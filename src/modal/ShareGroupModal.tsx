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

import { X, Mail, Share2, AlertCircle } from "lucide-react-native";

import Text from "../components/AppText";
import api from "../lib/api";

interface ShareGroupProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Turns an API/network error into a message the user can understand.
 */
function getShareErrorMessage(error: any): string {
  // No response at all = network problem
  if (!error?.response) {
    return "Network error. Please check your internet connection and try again.";
  }

  const status: number | undefined = error.response.status;
  const rawMessage = error.response.data?.message;

  // Backend can send a string or an array of strings
  const message: string = Array.isArray(rawMessage)
    ? rawMessage.join(", ")
    : typeof rawMessage === "string"
      ? rawMessage
      : "";

  const lower = message.toLowerCase();

  if (lower.includes("not found") || lower.includes("not verified")) {
    return "No verified user found with this email. Ask them to sign up and verify their email first.";
  }

  if (lower.includes("already")) {
    return "This group is already shared with this user.";
  }

  if (status === 401 || status === 403) {
    return "You don't have permission to share this group.";
  }

  if (status && status >= 500) {
    return "Something went wrong on our side. Please try again later.";
  }

  return message || "Failed to share group. Please try again.";
}

export default function ShareGroupModal({
  open,
  onClose,
  groupId,
  groupName,
}: ShareGroupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setEmail("");
    setErrorMessage(null);
  };

  // Close modal
  const handleClose = () => {
    if (loading) return;

    Keyboard.dismiss();
    resetState();
    onClose();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Clear the error as soon as the user edits the email
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Share group
  const handleShare = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();

    // Validation (shown inline)
    if (!trimmedEmail) {
      setErrorMessage("Please enter an email address.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      Keyboard.dismiss();

      await api.post(`/frame-groups/${groupId}/share`, {
        email: trimmedEmail,
      });

      Alert.alert("Success", "Group shared successfully", [
        {
          text: "OK",
          onPress: () => {
            resetState();
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      // Use console.log, not console.error: console.error opens the
      // red error screen in development for errors we already handle.
      console.log("Share group error:", error?.response?.data || error);

      setErrorMessage(getShareErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const hasError = !!errorMessage;

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
        className="flex-1 items-center justify-center bg-black/60 px-5"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
            {/* HEADER */}

            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Share2 size={23} color="#3B82F6" />

                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Share Group
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                hitSlop={10}
                activeOpacity={0.7}
              >
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* GROUP INFORMATION */}

            <View className="mb-5 rounded-xl bg-gray-100 p-4 dark:bg-[#252525]">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Sharing Group
              </Text>

              <Text className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {groupName}
              </Text>
            </View>

            {/* EMAIL INPUT */}

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                User Email
              </Text>

              <View
                className={`flex-row items-center rounded-lg border bg-gray-50 px-3 dark:bg-[#252525] ${
                  hasError
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <Mail size={18} color={hasError ? "#EF4444" : "#9CA3AF"} />

                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter user email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleShare}
                  className="ml-3 flex-1 py-3 text-sm text-gray-900 dark:text-white"
                />
              </View>

              {/* INLINE ERROR */}

              {hasError && (
                <View className="mt-3 flex-row items-start rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <AlertCircle size={16} color="#EF4444" />

                  <Text className="ml-2 flex-1 text-xs text-red-600 dark:text-red-400">
                    {errorMessage}
                  </Text>
                </View>
              )}
            </View>

            {/* FOOTER */}

            <View className="mt-6 flex-row justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              {/* CANCEL */}

              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
                className="rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
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
                className={`flex-row items-center justify-center rounded-lg bg-blue-500 px-4 py-3 ${
                  loading ? "opacity-70" : ""
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />

                    <Text className="ml-2 text-sm font-semibold text-white">
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