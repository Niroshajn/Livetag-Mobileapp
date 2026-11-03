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
} from "react-native";

import Text from "../components/AppText";
import  apiClient  from "../lib/api";

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

  // Reset values whenever the modal opens
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
    if (!validateForm()) {
      return;
    }

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
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 justify-center bg-black/60 px-5"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white dark:bg-[#171717] rounded-2xl p-5">
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                <Text className="text-xl">📁</Text>
              </View>

              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? "Edit Group" : "Add Group"}
                </Text>

                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isEdit
                    ? "Update group details"
                    : "Create a new device group"}
                </Text>
              </View>
            </View>

            {/* Group Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white rounded-lg px-3 py-3"
              />

              {!!nameError && (
                <Text className="text-red-500 text-xs mt-1">
                  {nameError}
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white rounded-lg px-3 py-3 min-h-[100px]"
              />

              {!!descriptionError && (
                <Text className="text-red-500 text-xs mt-1">
                  {descriptionError}
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                className="flex-1 items-center justify-center rounded-lg py-3 bg-gray-100 dark:bg-[#303030]"
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
    </Modal>
  );
}