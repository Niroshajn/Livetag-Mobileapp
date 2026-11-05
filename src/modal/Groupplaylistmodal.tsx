
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import { Check, List, X } from "lucide-react-native";

import Text from "../components/AppText";
import apiClient from "../lib/api";
import PlaylistItemModal from "./PlaylistItemModal";

/* ================= TYPES ================= */

interface Group {
  id: string;
  name: string;
  isSystemDefault: boolean;
}

interface FrameGroupsResponse {
  data: Group[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface SelectGroupModalProps {
  visible: boolean;
  onClose: () => void;
  pluginId: string;
  pluginName: string;
}

/* ================= COMPONENT ================= */

export default function SelectGroupModal({
  visible,
  onClose,
  pluginId,
  pluginName,
}: SelectGroupModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(
    null
  );

  /* ================= FETCH GROUPS ================= */

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);

      console.log("========== SELECT GROUPS ==========");

      // Same endpoint as the web application.
      const response = await apiClient.get<FrameGroupsResponse>(
        "/frame-groups"
      );

      const allGroups = response.data?.data ?? [];

      console.log("ALL GROUPS:", allGroups);

      // Same filtering logic as the web application.
      // Do not display the system Default Group.
      const availableGroups = allGroups.filter(
        (group) => group.isSystemDefault !== true
      );

      console.log("AVAILABLE GROUPS:", availableGroups);

      setGroups(availableGroups);
    } catch (error: any) {
      console.log(
        "FETCH GROUPS ERROR:",
        error?.response?.data || error
      );

      setGroups([]);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load groups."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= OPEN MODAL ================= */

  useEffect(() => {
    if (!visible) return;

    // Reset previous selection whenever the modal opens.
    setSelectedGroupId(null);
    setCurrentGroupId(null);
    setPlaylistOpen(false);

    fetchGroups();
  }, [visible, fetchGroups]);

  /* ================= SELECT GROUP ================= */

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId((previous) =>
      previous === groupId ? null : groupId
    );
  };

  /* ================= CONTINUE ================= */

  const handleContinue = () => {
    if (!selectedGroupId) {
      return;
    }

    console.log("SELECTED GROUP ID:", selectedGroupId);

    setCurrentGroupId(selectedGroupId);
    setPlaylistOpen(true);
  };

  /* ================= CLOSE SELECT GROUP ================= */

  const handleClose = () => {
    if (loading) return;

    setSelectedGroupId(null);
    setCurrentGroupId(null);
    setPlaylistOpen(false);

    onClose();
  };

  /* ================= CLOSE PLAYLIST MODAL ================= */

  const handlePlaylistClose = () => {
    setPlaylistOpen(false);
    setCurrentGroupId(null);
  };

  /* ================= RENDER GROUP ================= */

  const renderGroup = ({ item }: { item: Group }) => {
    const isSelected = selectedGroupId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelectGroup(item.id)}
        className={`m-1 flex-1 rounded-xl border p-4 ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1a1a1a]"
        }`}
      >
        {/* SELECTED CHECK ICON */}

        {isSelected && (
          <View className="absolute right-2 top-2 z-10 h-6 w-6 items-center justify-center rounded-full bg-blue-500">
            <Check size={14} color="#FFFFFF" />
          </View>
        )}

        {/* GROUP ICON */}

        <View className="mb-3 items-center">
          <View
            className={`h-12 w-12 items-center justify-center rounded-xl ${
              isSelected
                ? "bg-blue-100 dark:bg-blue-900/50"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <List
              size={22}
              color={isSelected ? "#3B82F6" : "#9CA3AF"}
            />
          </View>
        </View>

        {/* GROUP NAME */}

        <Text
          numberOfLines={2}
          className={`text-center text-sm font-semibold ${
            isSelected
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-800 dark:text-white"
          }`}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  /* ================= UI ================= */

  return (
    <>
      {/* SELECT GROUP MODAL */}

      <Modal
        visible={visible && !playlistOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-center bg-black/50 px-5">
          <View className="max-h-[80%] rounded-2xl bg-white p-5 dark:bg-[#1a1a1a]">

            {/* HEADER */}

            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Group
                </Text>

                <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a group to add this plugin
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              >
                <X size={19} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* GROUP LIST */}

            {loading ? (
              <View className="min-h-[180px] items-center justify-center">
                <ActivityIndicator
                  size="large"
                  color="#3B82F6"
                />

                <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Loading groups...
                </Text>
              </View>
            ) : groups.length === 0 ? (
              <View className="min-h-[180px] items-center justify-center">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <List size={28} color="#9CA3AF" />
                </View>

                <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
                  No groups available
                </Text>
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroup}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: 4,
                }}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                }}
                style={{
                  maxHeight: 350,
                }}
              />
            )}

            {/* FOOTER */}

            <View className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedGroupId ? "1 selected" : "0 selected"}
                </Text>

                <Text className="text-xs text-gray-400">
                  {groups.length} groups
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                {/* CANCEL */}

                <Pressable
                  onPress={handleClose}
                  disabled={loading}
                  className="flex-1 items-center rounded-lg border border-gray-300 py-3 dark:border-gray-700"
                >
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </Pressable>

                <View className="w-3" />

                {/* CONTINUE */}

                <Pressable
                  disabled={!selectedGroupId || loading}
                  onPress={handleContinue}
                  className={`flex-1 items-center rounded-lg py-3 ${
                    selectedGroupId && !loading
                      ? "bg-blue-500"
                      : "bg-blue-300 dark:bg-blue-900"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white">
                    Continue
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* PLAYLIST ITEM MODAL */}

      {currentGroupId && (
        <PlaylistItemModal
          key={currentGroupId}
          open={playlistOpen}
          onClose={handlePlaylistClose}
          frameId={currentGroupId}
          pluginId={pluginId}
          pluginName={pluginName}
          selectedItem={null}
          isGroup={true}
          onSaved={() => {
            setPlaylistOpen(false);
            setCurrentGroupId(null);
            setSelectedGroupId(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
