
import React, { useEffect, useState } from "react";

import {
  Modal,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";

import Text from "../components/AppText";
import apiClient from "../lib/api";

interface AddGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;

  isEdit?: boolean;
  groupId?: string;
  initialName?: string;
  initialDescription?: string;
}

export default function AddGroupModal({
  visible,
  onClose,
  onCreated,
  isEdit = false,
  groupId,
  initialName = "",
  initialDescription = "",
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setGroupName(initialName);
      setDescription(initialDescription);
      setNameError("");
      setDescriptionError("");
    }
  }, [visible, initialName, initialDescription]);

  const validateForm = () => {
    let isValid = true;

    setNameError("");
    setDescriptionError("");

    if (!groupName.trim()) {
      setNameError("Group name is required");
      isValid = false;
    }

    if (!description.trim()) {
      setDescriptionError("Description is required");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        name: groupName.trim(),
        description: description.trim(),
      };

      if (isEdit) {
        if (!groupId) {
          Alert.alert("Error", "Group ID is missing");
          return;
        }

        await apiClient.patch(`/frame-groups/${groupId}`, payload);

        Alert.alert("Success", "Group updated successfully");
      } else {
        await apiClient.post("/frame-groups", payload);

        Alert.alert("Success", "Group created successfully");
      }

      await onCreated();

      setGroupName("");
      setDescription("");

      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (isEdit
          ? "Failed to update group"
          : "Failed to create group");

      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        Keyboard.dismiss();
        onClose();
      }}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View className="flex-1 bg-black/60">

        {/* Keyboard handling */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios" ? "padding" : "height"
          }
          keyboardVerticalOffset={0}
        >

          {/* Scrollable modal */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 24,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            showsVerticalScrollIndicator={false}
          >

            {/* Modal card */}
            <View className="w-full max-w-[520px] rounded-2xl bg-white p-5 dark:bg-[#171717]">

              {/* Header */}
              <View className="mb-6 flex-row items-center">

                <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Text className="text-xl">📁</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEdit ? "Edit Group" : "Add Group"}
                  </Text>

                  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEdit
                      ? "Update group details"
                      : "Create a new device group"}
                  </Text>
                </View>

              </View>

              {/* Group Name */}
              <View className="mb-4">

                <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Group Name
                </Text>

                <TextInput
                  value={groupName}
                  onChangeText={(value) => {
                    setGroupName(value);
                    if (value.trim()) setNameError("");
                  }}
                  placeholder="Enter group name"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 dark:border-gray-700 dark:bg-[#252525] dark:text-white"
                />

                {!!nameError && (
                  <Text className="mt-1 text-xs text-red-500">
                    {nameError}
                  </Text>
                )}

              </View>

              {/* Description */}
              <View className="mb-5">

                <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </Text>

                <TextInput
                  value={description}
                  onChangeText={(value) => {
                    setDescription(value);
                    if (value.trim()) setDescriptionError("");
                  }}
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                  returnKeyType="default"
                  className="min-h-[120px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 dark:border-gray-700 dark:bg-[#252525] dark:text-white"
                />

                {!!descriptionError && (
                  <Text className="mt-1 text-xs text-red-500">
                    {descriptionError}
                  </Text>
                )}

              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">

                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 items-center justify-center rounded-lg bg-gray-100 py-3 dark:bg-[#303030]"
                >
                  <Text className="font-semibold text-gray-700 dark:text-gray-200">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 items-center justify-center rounded-lg py-3 ${
                    isSubmitting ? "bg-blue-400" : "bg-blue-600"
                  }`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-semibold text-white">
                      {isEdit ? "Update" : "Save"}
                    </Text>
                  )}
                </Pressable>

              </View>

            </View>

          </ScrollView>

        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
