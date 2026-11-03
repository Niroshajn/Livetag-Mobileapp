import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import { Check, List, X } from "lucide-react-native";

import Text from "../components/AppText";
import api from "../lib/api";

// Change this path to where your mobile PlaylistItemModal lives
import PlaylistItemModal from "./PlaylistItemModal";

interface Group {
  id: string;
  name: string;
  isSystemDefault?: boolean;
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

interface Props {
  visible: boolean;
  onClose: () => void;
  pluginId: string;
  pluginName: string;
}

export default function GroupPlaylistModal({
  visible,
  onClose,
  pluginId,
  pluginName,
}: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // ------------------------------------------------
  // FETCH GROUPS (hide system default group)
  // ------------------------------------------------

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const fetchGroups = async () => {
      try {
        setLoading(true);

        const res = await api.get<FrameGroupsResponse>("/frame-groups");

        const allGroups = res.data?.data ?? [];

        const nonDefaultGroups = allGroups.filter(
          (group) => group.isSystemDefault !== true
        );

        if (!cancelled) setGroups(nonDefaultGroups);
      } catch (error: any) {
        console.log("Group playlist groups error:", error?.response?.data || error);

        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGroups();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Reset selection whenever the modal is closed
  useEffect(() => {
    if (!visible) {
      setSelectedGroupId(null);
      setPlaylistOpen(false);
      setCurrentGroupId(null);
    }
  }, [visible]);

  // ------------------------------------------------
  // ACTIONS
  // ------------------------------------------------

  const toggleGroup = (group: Group) => {
    setSelectedGroupId((previous) => (previous === group.id ? null : group.id));
  };

  const handleContinue = () => {
    if (!selectedGroupId) return;

    setCurrentGroupId(selectedGroupId);
    setPlaylistOpen(true);
  };

  // ------------------------------------------------
  // GROUP CARD
  // ------------------------------------------------

  const renderGroup = ({ item }: { item: Group }) => {
    const isSelected = selectedGroupId === item.id;

    return (
      <View className="w-1/2 p-1.5">
        <Pressable
          onPress={() => toggleGroup(item)}
          className={`rounded-xl border p-4 ${
            isSelected
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-[#252525]"
          }`}
        >
          {isSelected && (
            <View className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-full bg-blue-500">
              <Check size={12} color="#FFFFFF" />
            </View>
          )}

          <View className="mb-3 items-center">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <List size={20} color="#6B7280" />
            </View>
          </View>

          <Text
            numberOfLines={2}
            className="text-center text-sm font-medium text-gray-900 dark:text-white"
          >
            {item.name}
          </Text>
        </Pressable>
      </View>
    );
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (
    <>
      {/* The select modal hides while the playlist modal is open,
          because stacking two RN Modals is unreliable on iOS. */}
      <Modal
        visible={visible && !playlistOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
            {/* HEADER */}

            <View className="mb-5 flex-row items-start justify-between">
              <View className="mr-3 flex-1">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Group
                </Text>

                <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a group to add this plugin
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* GROUP GRID */}

            <View style={{ maxHeight: 300 }}>
              {loading ? (
                <View className="items-center py-10">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="mt-3 text-gray-500 dark:text-gray-400">
                    Loading groups...
                  </Text>
                </View>
              ) : groups.length === 0 ? (
                <View className="items-center py-8">
                  <List size={48} color="#9CA3AF" />

                  <Text className="mt-3 text-gray-500 dark:text-gray-400">
                    No groups available
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={groups}
                  renderItem={renderGroup}
                  keyExtractor={(item) => String(item.id)}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

            {/* FOOTER */}

            <View className="mt-5 flex-row items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {selectedGroupId ? "1 selected" : "0 selected"}
              </Text>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={onClose}
                  className="mr-2 rounded-lg px-4 py-3"
                >
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!selectedGroupId}
                  className={`rounded-lg px-5 py-3 ${
                    selectedGroupId
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedGroupId ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* PLAYLIST ITEM MODAL (group mode) */}

     {currentGroupId && (
  <PlaylistItemModal
    open={playlistOpen}          // was: visible={playlistOpen}
    onClose={() => {
      setPlaylistOpen(false);
    }}
    frameId={currentGroupId}
    pluginId={pluginId}
    pluginName={pluginName}
    selectedItem={null}
    isGroup={true}
    onSaved={() => {
      setPlaylistOpen(false);
      onClose();
    }}
  />
)}
    </>
  );
}