import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

import Text from "../components/AppText";

import { useRoute, useNavigation } from "@react-navigation/native";

import {
  Pencil,
  Trash2,
  Monitor,
  Zap,
  ArrowUpDown,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import apiClient from "../lib/api";

import SelectPluginModal from "../modal/SelectPluginModal";
import PlaylistItemModal from "../modal/PlaylistItemModal";
import AppLayout from "./Layout";
import DeleteModal from "../modal/DeleteModal";

import type { PlaylistItem, PlaylistItemApi } from "../types/Playlist";

/* ================= INTERFACES ================= */

interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
}

interface PlaylistMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PlaylistResponse {
  data: PlaylistItemApi[];
  meta: PlaylistMeta;
}

interface PluginListResponse {
  data: Plugin[];
}

/* ================= REFRESH DISPLAY HELPER ================= */

function formatRefreshInterval(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "Not set";
  }

  const stringValue = String(value).trim();

  // Already in the format returned by tenant-config.
  if (/^\d+\s*(min|hr|d)$/i.test(stringValue)) {
    return stringValue;
  }

  // Handle numeric seconds returned by some API responses.
  const seconds = Number(stringValue);

  if (!Number.isNaN(seconds)) {
    const knownIntervals: Record<number, string> = {
      300: "5min",
      600: "10min",
      3600: "1hr",
      14400: "4hr",
      86400: "1d",
    };

    return knownIntervals[seconds] || `${seconds}s`;
  }

  return stringValue;
}

/* ================= SCREEN ================= */

export default function GroupPlaylistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const targetId: string | undefined =
    route.params?.targetId ||
    route.params?.groupId ||
    route.params?.id;

  const groupName: string = route.params?.groupName || "Group";

  /* ================= STATES ================= */

  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [pluginsMap, setPluginsMap] = useState<Record<string, Plugin>>({});

  const [meta, setMeta] = useState<PlaylistMeta | null>(null);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [openSelectModal, setOpenSelectModal] = useState(false);
  const [openPlaylistModal, setOpenPlaylistModal] = useState(false);

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [selectedItem, setSelectedItem] = useState<PlaylistItem | null>(null);

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  /* ================= FETCH PLAYLIST ================= */

  const fetchPlaylist = useCallback(
    async (pageNumber: number) => {
      if (!targetId) {
        setItems([]);
        setMeta(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await apiClient.get<PlaylistResponse>(
          `/playlist/items/frame-or-group/${targetId}?page=${pageNumber}&limit=10`
        );

        const formattedItems: PlaylistItem[] = (res.data.data ?? []).map(
          (item) => ({
            ...item,

            // IMPORTANT:
            // Do not convert this to Number().
            // The API can return values such as "1hr", "10min", or 3600.
            refreshSeconds: item.refreshSeconds ?? "",
          })
        );

        setItems(formattedItems);
        setMeta(res.data.meta ?? null);
      } catch (error: any) {
        console.log(
          "GROUP PLAYLIST FETCH ERROR:",
          error?.response?.data || error
        );

        Alert.alert("Error", "Failed to load playlist");

        setItems([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    },
    [targetId]
  );

  /* ================= FETCH PLUGINS ================= */

  const fetchPlugins = useCallback(async () => {
    try {
      const res = await apiClient.get<PluginListResponse>("/plugin/all");

      const map: Record<string, Plugin> = {};

      (res.data.data ?? []).forEach((plugin) => {
        map[plugin.pluginId] = plugin;
      });

      setPluginsMap(map);
    } catch (error: any) {
      console.log("PLUGIN FETCH ERROR:", error?.response?.data || error);
      Alert.alert("Error", "Failed to load plugins");
    }
  }, []);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    setPage(1);
  }, [targetId]);

  useEffect(() => {
    fetchPlaylist(page);
  }, [fetchPlaylist, page]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  /* ================= ADD ================= */

  const handleAdd = () => {
    setSelectedItem(null);
    setSelectedPlugin(null);
    setOpenSelectModal(true);
  };

  /* ================= EDIT ================= */

  const handleEdit = (item: PlaylistItem) => {
    const plugin = pluginsMap[item.pluginId];

    const pluginName =
      item.data?.name ||
      plugin?.pluginName ||
      `App #${item.pluginId}`;

    setSelectedItem(item);

    setSelectedPlugin({
      pluginId: item.pluginId,
      pluginName,
      pluginDescription: plugin?.pluginDescription,
      pluginLogoUrl: plugin?.pluginLogoUrl,
    });

    setOpenPlaylistModal(true);
  };

  /* ================= OPEN IN PLAYGROUND ================= */

  const openPlayground = async (item: PlaylistItem) => {
    try {
      await apiClient.post(`/playlist/${item.id}/copy-to-playground`);

      const plugin = pluginsMap[item.pluginId];

      navigation.navigate({
        name: "PlayListPreview",
        key: item.id,
        params: {
          pluginId: item.pluginId,
          playlistItemId: item.id,

          pluginName:
            plugin?.pluginName ||
            item.data?.name ||
            `App #${item.pluginId}`,

          pluginDescription: plugin?.pluginDescription,

          cameFrom: "GroupDevices",

          modelNo: "group",
          width: 800,
          height: 480,
        },
      });
    } catch (error: any) {
      console.log("OPEN PLAYGROUND ERROR:", error?.response?.data || error);
      Alert.alert("Error", "Failed to open playground");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!deleteItemId || !targetId) return;

    try {
      await apiClient.delete(
        `/playlist/item/${deleteItemId}/frame-or-group/${targetId}`
      );

      const remainingItems = items.filter(
        (item) => item.id !== deleteItemId
      );

      setItems(remainingItems);
      setOpenDeleteModal(false);
      setDeleteItemId(null);

      if (remainingItems.length === 0 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchPlaylist(page);
      }
    } catch (error: any) {
      console.log("DELETE PLAYLIST ERROR:", error?.response?.data || error);
      Alert.alert("Error", "Failed to delete playlist item");
    }
  };

  /* ================= CLOSE MODAL ================= */

  const closePlaylistModal = () => {
    setOpenPlaylistModal(false);
    setSelectedItem(null);
    setSelectedPlugin(null);
  };

  /* ================= PLAYLIST CARD ================= */

  const renderItem = ({ item }: { item: PlaylistItem }) => {
    const plugin = pluginsMap[item.pluginId];

    const pluginName =
      plugin?.pluginName ||
      item.data?.name ||
      item.pluginName ||
      "Playlist Item";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openPlayground(item)}
        className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#1a1a1a]"
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            {plugin?.pluginLogoUrl ? (
              <Image
                source={{ uri: plugin.pluginLogoUrl }}
                className="h-11 w-11 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Monitor size={20} color="#9CA3AF" />
              </View>
            )}

            <View className="ml-3 min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="font-semibold text-gray-900 dark:text-white"
              >
                {pluginName}
              </Text>

              <Text className="mt-1 text-xs text-gray-500">
                {item.startTime} - {item.endTime}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleEdit(item)}
              className="mr-2 h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <Pencil size={17} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setDeleteItemId(item.id);
                setOpenDeleteModal(true);
              }}
              className="h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"
            >
              <Trash2 size={17} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="my-4 h-px bg-gray-100 dark:bg-gray-800" />

        <View className="flex-row flex-wrap items-center justify-between gap-y-3">
          <View className="flex-row items-center">
            <ArrowUpDown size={15} color="#9CA3AF" />

            <Text className="ml-1.5 text-xs text-gray-500">
              Priority: {item.priority}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Zap size={15} color="#9CA3AF" />

            <Text className="ml-1.5 text-xs text-gray-500">
              Refresh: {formatRefreshInterval(item.refreshSeconds)}
            </Text>
          </View>

          <View
            className={`rounded-full px-3 py-1 ${
              item.isEnabled
                ? "bg-green-100 dark:bg-green-900/40"
                : "bg-gray-200 dark:bg-gray-800"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.isEnabled
                  ? "text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.isEnabled ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ================= PAGINATION ================= */

  const renderPagination = () => {
    if (!meta || items.length === 0) return null;

    return (
      <View className="mb-3 flex-row items-center justify-between py-5">
        <TouchableOpacity
          disabled={!meta.hasPrevious}
          onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
          className={`flex-row items-center rounded-lg border px-3 py-2 ${
            meta.hasPrevious
              ? "border-blue-500"
              : "border-gray-300 dark:border-gray-700"
          }`}
        >
          <ChevronLeft
            size={17}
            color={meta.hasPrevious ? "#3B82F6" : "#9CA3AF"}
          />

          <Text
            className={`ml-1 text-xs ${
              meta.hasPrevious ? "text-blue-500" : "text-gray-400"
            }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-gray-600 dark:text-gray-400">
          Page {meta.page} of {meta.totalPages}
        </Text>

        <TouchableOpacity
          disabled={!meta.hasNext}
          onPress={() => setPage((prev) => prev + 1)}
          className={`flex-row items-center rounded-lg border px-3 py-2 ${
            meta.hasNext
              ? "border-blue-500"
              : "border-gray-300 dark:border-gray-700"
          }`}
        >
          <Text
            className={`mr-1 text-xs ${
              meta.hasNext ? "text-blue-500" : "text-gray-400"
            }`}
          >
            Next
          </Text>

          <ChevronRight
            size={17}
            color={meta.hasNext ? "#3B82F6" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  /* ================= LOADING ================= */

  if (loading && items.length === 0) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-3 text-gray-500">Loading playlist...</Text>
        </View>
      </AppLayout>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <AppLayout>
      <View className="flex-1 px-4 pt-4">
        <View className="mb-5">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {groupName} Playlist
          </Text>

          <Text className="mt-1 text-sm text-gray-500">
            Group playlist items
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAdd}
            className="mt-4 flex-row items-center justify-center rounded-lg border border-blue-500 py-3"
          >
            <Plus size={18} color="#3B82F6" />

            <Text className="ml-2 text-sm font-semibold text-blue-500">
              Add Item
            </Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Monitor size={40} color="#9CA3AF" />

            <Text className="mt-3 text-gray-500">
              No playlist items found
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            extraData={pluginsMap}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListFooterComponent={renderPagination()}
          />
        )}

        {loading && items.length > 0 && (
          <View className="absolute bottom-5 self-center">
            <ActivityIndicator size="small" color="#3B82F6" />
          </View>
        )}
      </View>

      <SelectPluginModal
        open={openSelectModal}
        onClose={() => setOpenSelectModal(false)}
        onSelect={(plugins: Plugin[]) => {
          if (plugins.length > 0) {
            setSelectedPlugin(plugins[0]);
            setOpenSelectModal(false);
            setSelectedItem(null);
            setOpenPlaylistModal(true);
          }
        }}
      />

      {selectedPlugin && targetId && (
        <PlaylistItemModal
          key={selectedItem?.id || "new"}
          open={openPlaylistModal}
          onClose={closePlaylistModal}
          pluginId={selectedPlugin.pluginId}
          pluginName={selectedPlugin.pluginName}
          selectedItem={selectedItem}
          frameId={targetId}
          isGroup={true}
          onSaved={async () => {
            await fetchPlaylist(page);
          }}
        />
      )}

      <DeleteModal
        visible={openDeleteModal}
        onCancel={() => {
          setOpenDeleteModal(false);
          setDeleteItemId(null);
        }}
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}