
import React, {
  useCallback,
  useState,
} from "react";

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
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import Text from "../components/AppText";
import api from "../lib/api";
import AppLayout from "./Layout";
import ShareGroupModal from "../modal/ShareGroupModal";
import { useAdmin } from "../context/AdminContext";

interface Group {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;
  isShared?: boolean;
}

interface GroupsResponse {
  data: Group[];
  meta?: {
    page: number;
    limit?: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export default function GroupDevices({ navigation }: any) {

  // -----------------------------------------
  // ADMIN CONTEXT
  // -----------------------------------------

  const {
    user,
    canManageGroups,
    loading: adminLoading,
  } = useAdmin();

  // -----------------------------------------
  // GROUP STATES
  // -----------------------------------------

  const [groups, setGroups] = useState<Group[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------------------
  // PAGINATION
  // -----------------------------------------

  const [page, setPage] = useState(1);

  const [meta, setMeta] =
    useState<GroupsResponse["meta"] | null>(null);

  // -----------------------------------------
  // CREATE GROUP
  // -----------------------------------------

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [newGroupName, setNewGroupName] =
    useState("");

  const [newGroupDescription, setNewGroupDescription] =
    useState("");

  const [createLoading, setCreateLoading] =
    useState(false);

  // -----------------------------------------
  // EDIT GROUP
  // -----------------------------------------

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [groupToEdit, setGroupToEdit] =
    useState<Group | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [editLoading, setEditLoading] = useState(false);

  // -----------------------------------------
  // SHARE GROUP
  // -----------------------------------------

  const [showShareModal, setShowShareModal] =
    useState(false);

  const [selectedGroup, setSelectedGroup] =
    useState<Group | null>(null);

  // -----------------------------------------
  // DELETE GROUP
  // -----------------------------------------

  const [deleteLoading, setDeleteLoading] =
    useState(false);

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
      canManageGroups &&
      !isDefaultGroup(group) &&
      group.isShared !== true
    );
  };

  // -----------------------------------------
  // FETCH GROUPS
  // -----------------------------------------

  const fetchGroups = useCallback(
    async (currentPage: number = page) => {

      try {
        setLoading(true);

        const response = await api.get<GroupsResponse>(
          `/frame-groups?page=${currentPage}`
        );

        const fetchedGroups =
          response.data?.data ?? [];

        const pagination =
          response.data?.meta ?? null;

        setMeta(pagination);

        setGroups(fetchedGroups);

        // Same condition as web app:
        // If only Default Group exists, open Frames.

        if (
          currentPage === 1 &&
          fetchedGroups.length === 1 &&
          fetchedGroups[0].name
            ?.toLowerCase()
            .includes("default")
        ) {
          navigation.navigate("Frame", {
            groupId: fetchedGroups[0].id,
            groupName: fetchedGroups[0].name,
            groupCount: fetchedGroups[0].frameCount,
          });
        }

      } catch (error: any) {

        console.log(
          "Fetch groups error:",
          error?.response?.data || error
        );

        setGroups([]);
        setMeta(null);

      } finally {

        setLoading(false);
        setRefreshing(false);

      }
    },
    [navigation, page]
  );

  // -----------------------------------------
  // SCREEN FOCUS
  // -----------------------------------------

  useFocusEffect(
    useCallback(() => {
      fetchGroups(page);
    }, [fetchGroups, page])
  );

  // -----------------------------------------
  // REFRESH
  // -----------------------------------------

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups(page);
  };

  // -----------------------------------------
  // OPEN GROUP
  // -----------------------------------------

  const openGroup = (group: Group) => {

    navigation.navigate("Frame", {
      groupId: group.id,
      groupName: group.name,
      groupCount: meta?.total ?? 0,
    });

  };

  // -----------------------------------------
  // CREATE GROUP
  // -----------------------------------------

  const closeCreateModal = () => {

    if (createLoading) return;

    Keyboard.dismiss();

    setShowCreateModal(false);

    setNewGroupName("");
    setNewGroupDescription("");
  };

  const handleCreateGroup = async () => {

    if (!newGroupName.trim()) {
      Alert.alert(
        "Required",
        "Please enter group name"
      );
      return;
    }

    try {

      setCreateLoading(true);

      Keyboard.dismiss();

      await api.post("/frame-groups", {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
      });

      setShowCreateModal(false);

      setNewGroupName("");
      setNewGroupDescription("");

      setPage(1);

      Alert.alert(
        "Success",
        "Group created successfully"
      );

      await fetchGroups(1);

    } catch (error: any) {

      console.log(
        "Create group error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to create group"
      );

    } finally {

      setCreateLoading(false);

    }
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
      Alert.alert(
        "Required",
        "Please enter group name"
      );
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

      await fetchGroups(page);

    } catch (error: any) {

      console.log(
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

      await api.delete(
        `/frame-groups/${group.id}`
      );

      const remainingGroups = groups.filter(
        (item) => item.id !== group.id
      );

      // If current page becomes empty,
      // move to the previous page.

      if (
        remainingGroups.length === 0 &&
        page > 1
      ) {
        setPage((previous) => previous - 1);
      } else {
        await fetchGroups(page);
      }

      Alert.alert(
        "Success",
        "Group deleted successfully"
      );

    } catch (error: any) {

      console.log(
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
  // PAGINATION
  // -----------------------------------------

  const handlePreviousPage = () => {

    if (page > 1) {
      setPage((previous) => previous - 1);
    }

  };

  const handleNextPage = () => {

    if (
      meta &&
      (meta.hasNext ?? page < meta.totalPages)
    ) {
      setPage((previous) => previous + 1);
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
        className="
          mb-3
          rounded-2xl
          border border-gray-200
          bg-white
          p-4
          dark:border-gray-800
          dark:bg-[#1a1a1a]
        "
      >

        <View className="flex-row items-center">

          {/* FOLDER */}

          <View className="
            h-12 w-12
            items-center justify-center
            rounded-xl
            bg-blue-50
            dark:bg-blue-900/30
          ">
            <Folder
              size={23}
              color="#60A5FA"
            />
          </View>

          {/* GROUP INFORMATION */}

          <View className="ml-3 flex-1">

            <Text
              className="
                text-base
                font-semibold
                text-gray-900
                dark:text-white
              "
              numberOfLines={2}
            >
              {item.name}
            </Text>

            <View className="mt-2 flex-row items-center">

              <Monitor
                size={15}
                color="#9CA3AF"
              />

              <Text className="
                ml-2
                text-xs
                text-gray-500
                dark:text-gray-400
              ">
                {item.frameCount ?? 0} Devices
              </Text>

            </View>

            {item.isShared === true && (
              <Text className="mt-1 text-xs text-blue-500">
                Shared with you
              </Text>
            )}

          </View>

          {/* ACTIONS */}

          {showActions && (

            <View className="flex-row items-center">

              {/* SHARE */}

              <TouchableOpacity
                onPress={() => handleShareGroup(item)}
                activeOpacity={0.7}
                className="p-2"
                hitSlop={4}
              >
                <Share2
                  size={19}
                  color="#60A5FA"
                />
              </TouchableOpacity>

              {/* EDIT */}

              <TouchableOpacity
                onPress={() => handleEditGroup(item)}
                activeOpacity={0.7}
                className="p-2"
                hitSlop={4}
              >
                <Pencil
                  size={19}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              {/* DELETE */}

              <TouchableOpacity
                onPress={() => handleDeleteGroup(item)}
                activeOpacity={0.7}
                disabled={deleteLoading}
                className="p-2"
                hitSlop={4}
              >
                <Trash2
                  size={19}
                  color="#EF4444"
                />
              </TouchableOpacity>

            </View>

          )}

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

          <View className="flex-row items-center justify-between">

            <View className="flex-1">

              <Text className="
                text-2xl
                font-bold
                text-gray-900
                dark:text-white
              ">
                Groups
              </Text>

              <Text className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              ">
                View and manage all your device groups.
              </Text>

            </View>

            {/* ADD GROUP */}

            {!adminLoading && canManageGroups && (

              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
                className="
                  ml-2
                  flex-row
                  items-center
                  rounded-lg
                  bg-blue-500
                  px-3
                  py-2.5
                "
              >

                <Plus
                  size={17}
                  color="#FFFFFF"
                />

                <Text className="
                  ml-1
                  text-sm
                  font-semibold
                  text-white
                ">
                  Add Group
                </Text>

              </TouchableOpacity>

            )}

          </View>

        </View>

        {/* GROUP LIST */}

        {loading && groups.length === 0 ? (

          <View className="flex-1 items-center justify-center">

            <ActivityIndicator
              size="large"
              color="#60A5FA"
            />

            <Text className="
              mt-3
              text-gray-500
              dark:text-gray-400
            ">
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
              flexGrow: groups.length === 0 ? 1 : 0,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#60A5FA"
              />
            }
            ListEmptyComponent={

              <View className="
                flex-1
                items-center
                justify-center
              ">

                <Folder
                  size={48}
                  color="#9CA3AF"
                />

                <Text className="
                  mt-4
                  text-lg
                  font-semibold
                  text-gray-700
                  dark:text-gray-300
                ">
                  No groups found
                </Text>

                <Text className="
                  mt-1
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                ">
                  No device groups are available.
                </Text>

              </View>

            }
          />

        )}

        {/* PAGINATION */}

        {!loading &&
          meta &&
          groups.length > 0 &&
          meta.totalPages > 1 && (

          <View className="
            flex-row
            items-center
            justify-between
            border-t
            border-gray-200
            py-4
            dark:border-gray-800
          ">

            {/* PREVIOUS */}

            <TouchableOpacity
              onPress={handlePreviousPage}
              disabled={
                !(meta.hasPrevious ?? page > 1)
              }
              className="
                flex-row
                items-center
                rounded-lg
                border
                border-gray-300
                px-3
                py-2
                dark:border-gray-700
              "
            >

              <ChevronLeft
                size={17}
                color={
                  page > 1 ? "#60A5FA" : "#9CA3AF"
                }
              />

              <Text className="
                ml-1
                text-sm
                text-gray-700
                dark:text-gray-300
              ">
                Previous
              </Text>

            </TouchableOpacity>

            {/* PAGE NUMBER */}

            <Text className="
              text-sm
              text-gray-500
              dark:text-gray-400
            ">
              Page {meta.page} of {meta.totalPages}
            </Text>

            {/* NEXT */}

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={
                !(meta.hasNext ?? page < meta.totalPages)
              }
              className="
                flex-row
                items-center
                rounded-lg
                border
                border-gray-300
                px-3
                py-2
                dark:border-gray-700
              "
            >

              <Text className="
                mr-1
                text-sm
                text-gray-700
                dark:text-gray-300
              ">
                Next
              </Text>

              <ChevronRight
                size={17}
                color={
                  page < meta.totalPages
                    ? "#60A5FA"
                    : "#9CA3AF"
                }
              />

            </TouchableOpacity>

          </View>

        )}

      </View>

      {/* ---------------------------------- */}
      {/* CREATE GROUP MODAL */}
      {/* ---------------------------------- */}

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
        statusBarTranslucent
      >

        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          className="
            flex-1
            justify-center
            items-center
            bg-black/60
            px-5
          "
        >

          <View className="
            w-full
            max-w-md
            rounded-2xl
            bg-white
            p-5
            dark:bg-[#1a1a1a]
          ">

            <View className="
              mb-5
              flex-row
              items-center
              justify-between
            ">

              <Text className="
                text-xl
                font-bold
                text-gray-900
                dark:text-white
              ">
                Create Group
              </Text>

              <TouchableOpacity
                onPress={closeCreateModal}
                disabled={createLoading}
              >
                <X
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

            </View>

            <Text className="
              mb-2
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            ">
              Group Name
            </Text>

            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              placeholderTextColor="#9CA3AF"
              editable={!createLoading}
              className="
                mb-4
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-3
                py-3
                text-sm
                text-gray-900
                dark:border-gray-700
                dark:bg-[#252525]
                dark:text-white
              "
            />

            <Text className="
              mb-2
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            ">
              Description
            </Text>

            <TextInput
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              placeholder="Enter group description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!createLoading}
              className="
                min-h-24
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-3
                py-3
                text-sm
                text-gray-900
                dark:border-gray-700
                dark:bg-[#252525]
                dark:text-white
              "
            />

            <View className="
              mt-6
              flex-row
              justify-end
              gap-3
            ">

              <TouchableOpacity
                onPress={closeCreateModal}
                disabled={createLoading}
                className="
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-3
                  dark:border-gray-700
                "
              >
                <Text className="
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-300
                ">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={createLoading}
                className="
                  flex-row
                  items-center
                  justify-center
                  rounded-lg
                  bg-blue-500
                  px-5
                  py-3
                "
              >

                {createLoading ? (

                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text className="
                      ml-2
                      text-sm
                      font-semibold
                      text-white
                    ">
                      Creating...
                    </Text>
                  </>

                ) : (

                  <Text className="
                    text-sm
                    font-semibold
                    text-white
                  ">
                    Create Group
                  </Text>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

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
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          className="
            flex-1
            justify-center
            items-center
            bg-black/60
            px-5
          "
        >

          <View className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            dark:border-gray-800
            dark:bg-[#1a1a1a]
          ">

            <View className="
              mb-5
              flex-row
              items-center
              justify-between
            ">

              <Text className="
                text-xl
                font-bold
                text-gray-900
                dark:text-white
              ">
                Edit Group
              </Text>

              <TouchableOpacity
                onPress={closeEditModal}
                disabled={editLoading}
              >
                <X
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

            </View>

            <Text className="
              mb-2
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            ">
              Group Name
            </Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter group name"
              placeholderTextColor="#9CA3AF"
              editable={!editLoading}
              className="
                mb-4
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-3
                py-3
                text-sm
                text-gray-900
                dark:border-gray-700
                dark:bg-[#252525]
                dark:text-white
              "
            />

            <Text className="
              mb-2
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            ">
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
              className="
                min-h-24
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-3
                py-3
                text-sm
                text-gray-900
                dark:border-gray-700
                dark:bg-[#252525]
                dark:text-white
              "
            />

            <View className="
              mt-6
              flex-row
              justify-end
              gap-3
            ">

              <TouchableOpacity
                onPress={closeEditModal}
                disabled={editLoading}
                className="
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-3
                  dark:border-gray-700
                "
              >
                <Text className="
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-300
                ">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateGroup}
                disabled={editLoading}
                className="
                  flex-row
                  items-center
                  justify-center
                  rounded-lg
                  bg-blue-500
                  px-5
                  py-3
                "
              >

                {editLoading ? (

                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text className="
                      ml-2
                      text-sm
                      font-semibold
                      text-white
                    ">
                      Saving...
                    </Text>
                  </>

                ) : (

                  <Text className="
                    text-sm
                    font-semibold
                    text-white
                  ">
                    Save Changes
                  </Text>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

      {/* ---------------------------------- */}
      {/* SHARE GROUP MODAL */}
      {/* ---------------------------------- */}

      <ShareGroupModal
        open={showShareModal}
        onClose={closeShareModal}
        groupId={selectedGroup?.id || ""}
        groupName={selectedGroup?.name || ""}
      />

    </AppLayout>

  );
}
