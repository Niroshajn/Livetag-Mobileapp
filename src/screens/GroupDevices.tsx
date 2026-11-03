
import React, { useCallback, useState } from "react";

import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import {
  Folder,
  Monitor,
  Share2,
  Pencil,
  Trash2,
  X,
} from "lucide-react-native";

import { useFocusEffect } from "@react-navigation/native";

import Text from "../components/AppText";
import api from "../lib/api";
import AppLayout from "./Layout";
import ShareGroupModal from "../modal/ShareGroupModal";

interface Group {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;

  // Update this according to your API response.
  isShared?: boolean;
}

interface GroupsResponse {
  data: Group[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export default function GroupDevices({ navigation }: any) {
  const [groups, setGroups] = useState<Group[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SHARE
  const [showShareModal, setShowShareModal] = useState(false);

  const [selectedGroup, setSelectedGroup] =
    useState<Group | null>(null);

  // EDIT
  const [showEditModal, setShowEditModal] = useState(false);

  const [groupToEdit, setGroupToEdit] =
    useState<Group | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [editLoading, setEditLoading] = useState(false);

  // DELETE
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -----------------------------------------
  // FETCH GROUPS
  // -----------------------------------------

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get<GroupsResponse>(
        "/frame-groups?page=1"
      );

      setGroups(response.data?.data ?? []);
    } catch (error: any) {
      console.log(
        "Fetch groups error:",
        error?.response?.data || error
      );

      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // -----------------------------------------
  // GROUP CONDITIONS
  // -----------------------------------------

  const isDefaultGroup = (group: Group) => {
    return (
      group.isSystemDefault === true ||
      group.name?.toLowerCase().includes("default")
    );
  };

  const canManageGroup = (group: Group) => {
    return (
      !isDefaultGroup(group) &&
      group.isShared !== true
    );
  };

  // -----------------------------------------
  // OPEN GROUP
  // -----------------------------------------

  const openGroup = (group: Group) => {
    navigation.navigate("Frame", {
      groupId: group.id,
      groupName: group.name,
      groupCount: group.frameCount,
    });
  };

  // -----------------------------------------
  // SHARE GROUP
  // -----------------------------------------

  const handleShareGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedGroup(null);
  };

  // -----------------------------------------
  // EDIT GROUP
  // -----------------------------------------

  const handleEditGroup = (group: Group) => {
    setGroupToEdit(group);

    setEditName(group.name);
    setEditDescription(group.description || "");

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editLoading) return;

    Keyboard.dismiss();

    setShowEditModal(false);
    setGroupToEdit(null);

    setEditName("");
    setEditDescription("");
  };

  const handleUpdateGroup = async () => {
    if (!groupToEdit) return;

    if (!editName.trim()) {
      Alert.alert("Required", "Please enter group name");
      return;
    }

    try {
      setEditLoading(true);

      Keyboard.dismiss();

      await api.patch(
        `/frame-groups/${groupToEdit.id}`,
        {
          name: editName.trim(),
          description: editDescription.trim(),
        }
      );

      setShowEditModal(false);
      setGroupToEdit(null);

      Alert.alert(
        "Success",
        "Group updated successfully"
      );

      await fetchGroups();
    } catch (error: any) {
      console.error(
        "Update group error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to update group"
      );
    } finally {
      setEditLoading(false);
    }
  };

  // -----------------------------------------
  // DELETE GROUP
  // -----------------------------------------

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDeleteGroup(group),
        },
      ]
    );
  };

  const confirmDeleteGroup = async (group: Group) => {
    try {
      setDeleteLoading(true);

      await api.delete(`/frame-groups/${group.id}`);

      setGroups((previousGroups) =>
        previousGroups.filter(
          (item) => item.id !== group.id
        )
      );

      Alert.alert(
        "Success",
        "Group deleted successfully"
      );
    } catch (error: any) {
      console.error(
        "Delete group error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to delete group"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // -----------------------------------------
  // GROUP CARD
  // -----------------------------------------

  const renderGroup = ({ item }: { item: Group }) => {
    const showActions = canManageGroup(item);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openGroup(item)}
        className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]"
      >
        <View className="flex-row items-center">

          {/* FOLDER ICON */}

          <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <Folder size={23} color="#60A5FA" />
          </View>

          {/* GROUP INFORMATION */}

          <View className="ml-3 flex-1">
            <Text
              className="text-base font-semibold text-gray-900 dark:text-white"
              numberOfLines={2}
            >
              {item.name}
            </Text>

            <View className="flex-row items-center mt-2">
              <Monitor size={15} color="#9CA3AF" />

              <Text className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {item.frameCount ?? 0} Devices
              </Text>
            </View>

            {item.isShared === true && (
              <Text className="mt-1 text-xs text-blue-500">
                Shared with you
              </Text>
            )}
          </View>

          {/* ACTION BUTTONS */}

          {showActions ? (
            <View className="flex-row items-center">

              {/* SHARE */}

              <TouchableOpacity
                onPress={() => handleShareGroup(item)}
                activeOpacity={0.7}
                className="p-2"
                hitSlop={4}
              >
                <Share2 size={18} color="#60A5FA" />
              </TouchableOpacity>

              {/* EDIT */}

              <TouchableOpacity
                onPress={() => handleEditGroup(item)}
                activeOpacity={0.7}
                className="p-2"
                hitSlop={4}
              >
                <Pencil size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* DELETE */}

              <TouchableOpacity
                onPress={() => handleDeleteGroup(item)}
                activeOpacity={0.7}
                disabled={deleteLoading}
                className="p-2"
                hitSlop={4}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>

            </View>
          ) : null}

        </View>
      </TouchableOpacity>
    );
  };

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <AppLayout>
      <View className="flex-1 px-4 pt-5">

        {/* HEADER */}

        <View className="mb-5">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Groups
          </Text>

          <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage all your device groups.
          </Text>
        </View>

        {/* GROUP LIST */}

        {loading && groups.length === 0 ? (
          <View className="flex-1 items-center justify-center">

            <ActivityIndicator
              size="large"
              color="#60A5FA"
            />

            <Text className="mt-3 text-gray-500 dark:text-gray-400">
              Loading groups...
            </Text>

          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 25,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#60A5FA"
              />
            }
            ListEmptyComponent={
              <View className="mt-20 items-center">

                <Folder size={48} color="#9CA3AF" />

                <Text className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
                  No groups found
                </Text>

                <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No device groups are available.
                </Text>

              </View>
            }
          />
        )}

      </View>

      {/* ---------------------------------- */}
      {/* SHARE GROUP MODAL */}
      {/* ---------------------------------- */}

      <ShareGroupModal
        open={showShareModal}
        onClose={closeShareModal}
        groupId={selectedGroup?.id || ""}
        groupName={selectedGroup?.name || ""}
      />

      {/* ---------------------------------- */}
      {/* EDIT GROUP MODAL */}
      {/* ---------------------------------- */}

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios" ? "padding" : undefined
          }
          className="flex-1 justify-center items-center bg-black/60 px-5"
        >
          <View className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5">

            {/* HEADER */}

            <View className="flex-row items-center justify-between mb-5">

              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Group
              </Text>

              <TouchableOpacity
                onPress={closeEditModal}
                disabled={editLoading}
                hitSlop={10}
              >
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>

            </View>

            {/* GROUP NAME */}

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name
            </Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter group name"
              placeholderTextColor="#9CA3AF"
              editable={!editLoading}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] px-3 py-3 text-sm text-gray-900 dark:text-white mb-4"
            />

            {/* DESCRIPTION */}

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </Text>

            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter group description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!editLoading}
              className="min-h-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] px-3 py-3 text-sm text-gray-900 dark:text-white"
            />

            {/* FOOTER */}

            <View className="flex-row justify-end gap-3 mt-6">

              <TouchableOpacity
                onPress={closeEditModal}
                disabled={editLoading}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3"
              >
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateGroup}
                disabled={editLoading}
                className="flex-row items-center justify-center rounded-lg bg-blue-500 px-5 py-3"
              >
                {editLoading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text className="ml-2 text-sm font-semibold text-white">
                      Saving...
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </AppLayout>
  );
}
