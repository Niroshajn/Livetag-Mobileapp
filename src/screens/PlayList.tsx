
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  useWindowDimensions,
} from "react-native";

import Text from "../components/AppText";

import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";

import {
  Plus,
  Pencil,
  Trash2,
  Monitor,
  Zap,
  ArrowUpDown,
} from "lucide-react-native";

import apiClient from "../lib/api";

import SelectPluginModal from "../modal/SelectPluginModal";
import PlaylistItemModal from "../modal/PlaylistItemModal";
import AppLayout from "./Layout";
import DeleteModal from "../modal/DeleteModal";

import type {
  PlaylistItem,
  PlaylistItemApi,
} from "../types/Playlist";

/* ================= TYPES ================= */

interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
  pluginPreviewImageUrl?: string;
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
  data?: PlaylistItemApi[];
  meta?: PlaylistMeta;
}

interface PluginResponse {
  data?: Plugin[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/* ================= SCREEN ================= */

export default function PlaylistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { width } = useWindowDimensions();
  const iconSize = Math.max(16, width * 0.05);

  const id = route.params?.id;

  const modelNo = route.params?.modelNo;
  const displayWidth = route.params?.width;
  const displayHeight = route.params?.height;

  /* ================= STATES ================= */

  const [items, setItems] = useState<PlaylistItem[]>([]);

  const [pluginsMap, setPluginsMap] = useState<
    Record<string, Plugin>
  >({});

  const [loading, setLoading] = useState(true);

  const [openSelectModal, setOpenSelectModal] =
    useState(false);

  const [openPlaylistModal, setOpenPlaylistModal] =
    useState(false);

  const [selectedPlugin, setSelectedPlugin] =
    useState<Plugin | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<PlaylistItem | null>(null);

  const [deleteItemId, setDeleteItemId] =
    useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] =
    useState(false);

  const [deviceName, setDeviceName] = useState<string | null>(
    route.params?.deviceName || null
  );

  // Pagination states
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState<PlaylistMeta | null>(null);

  /* ================= FETCH PLAYLIST ================= */

  const fetchPlaylistItems = useCallback(
    async (pageNumber = 1) => {
      if (!id) {
        setItems([]);
        setMeta(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await apiClient.get<PlaylistResponse>(
          `/playlist/items/frame-or-group/${id}`,
          {
            params: {
              page: pageNumber,
              limit: 10,
            },
          }
        );

        console.log(
          "PLAYLIST RESPONSE:",
          JSON.stringify(res.data, null, 2)
        );

        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const normalizedItems: PlaylistItem[] = list.map(
          (item) => ({
            ...item,
            refreshSeconds: item.refreshSeconds,
          })
        );

        setItems(normalizedItems);
        setMeta(res.data?.meta ?? null);

      } catch (error: any) {
        console.log(
          "PLAYLIST FETCH ERROR:",
          error?.response?.data ?? error
        );

        Alert.alert(
          "Error",
          "Failed to load playlist items."
        );

        setItems([]);
        setMeta(null);

      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  /* ================= FETCH PLUGINS ================= */

  const fetchPlugins = useCallback(async () => {
    try {
      let currentPage = 1;
      let hasNext = true;

      const allPlugins: Plugin[] = [];

      while (hasNext) {
        const res = await apiClient.get<PluginResponse>(
          `/plugin/all?page=${currentPage}`
        );

        const responseData: any = res.data;

        const plugins: Plugin[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

        allPlugins.push(...plugins);

        if (
          Array.isArray(responseData) ||
          !responseData?.meta
        ) {
          hasNext = false;
        } else {
          hasNext = Boolean(responseData.meta.hasNext);
          currentPage += 1;
        }
      }

      const map: Record<string, Plugin> = {};

      allPlugins.forEach((plugin) => {
        if (plugin.pluginId) {
          map[String(plugin.pluginId)] = plugin;
        }
      });

      setPluginsMap(map);

      console.log("PLUGINS MAP:", map);

    } catch (error: any) {
      console.log(
        "PLUGIN FETCH ERROR:",
        error?.response?.data ?? error
      );
    }
  }, []);

  /* ================= FETCH DEVICE NAME ================= */

  const fetchDeviceName = useCallback(async () => {
    if (!id || deviceName) {
      return;
    }

    try {
      const res = await apiClient.get(`/frames/${id}`);

      setDeviceName(res.data?.name || null);

    } catch (error: any) {
      console.log(
        "DEVICE NAME ERROR:",
        error?.response?.data ?? error
      );
    }
  }, [id, deviceName]);

  /* ================= EFFECTS ================= */

  // Reset pagination when the selected device changes.
  useEffect(() => {
    setPage(1);
    setMeta(null);
  }, [id]);

  // Fetch the selected playlist page.
  useEffect(() => {
    fetchPlaylistItems(page);
  }, [fetchPlaylistItems, page]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  useEffect(() => {
    fetchDeviceName();
  }, [fetchDeviceName]);

  /* ================= PAGINATION ================= */

  const handlePreviousPage = () => {
    if (!meta?.hasPrevious) {
      return;
    }

    setPage((previous) => Math.max(previous - 1, 1));
  };

  const handleNextPage = () => {
    if (!meta?.hasNext) {
      return;
    }

    setPage((previous) => previous + 1);
  };

const renderPagination = () => {
  if (!meta || items.length === 0) {
    return null;
  }

    return (
      <View className="flex-row justify-between items-center py-4 mt-2">

        {/* PREVIOUS BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!meta.hasPrevious}
          onPress={handlePreviousPage}
          className={`
            px-4 py-2.5 rounded-lg border
            ${
              meta.hasPrevious
                ? "border-blue-500"
                : "border-gray-300 dark:border-gray-700"
            }
          `}
        >
          <Text
            className={`text-sm font-medium ${
              meta.hasPrevious
                ? "text-blue-500"
                : "text-gray-400"
            }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* CURRENT PAGE */}

        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          Page {meta.page} of {meta.totalPages}
        </Text>

        {/* NEXT BUTTON */}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!meta.hasNext}
          onPress={handleNextPage}
          className={`
            px-4 py-2.5 rounded-lg border
            ${
              meta.hasNext
                ? "border-blue-500"
                : "border-gray-300 dark:border-gray-700"
            }
          `}
        >
          <Text
            className={`text-sm font-medium ${
              meta.hasNext
                ? "text-blue-500"
                : "text-gray-400"
            }`}
          >
            Next
          </Text>
        </TouchableOpacity>

      </View>
    );
  };

  /* ================= ADD ================= */

  const handleAdd = () => {
    setSelectedItem(null);
    setSelectedPlugin(null);
    setOpenSelectModal(true);
  };

  /* ================= EDIT ================= */

  const handleEdit = (item: PlaylistItem) => {
    const plugin = pluginsMap[String(item.pluginId)];

    const pluginName =
      item.data?.name ||
      plugin?.pluginName ||
      item.pluginName ||
      `App #${item.pluginId}`;

    setSelectedItem({ ...item });

    setSelectedPlugin({
      pluginId: String(item.pluginId),
      pluginName,
      pluginDescription: plugin?.pluginDescription,
      pluginLogoUrl: plugin?.pluginLogoUrl,
      pluginPreviewImageUrl: plugin?.pluginPreviewImageUrl,
    });

    setOpenPlaylistModal(true);
  };

  /* ================= PLAYGROUND ================= */

  const openPlayground = async (item: PlaylistItem) => {
    try {
      await apiClient.post(
        `/playlist/${item.id}/copy-to-playground`
      );

      const plugin = pluginsMap[String(item.pluginId)];

      const pluginName =
        plugin?.pluginName ||
        item.data?.name ||
        item.pluginName ||
        `App #${item.pluginId}`;

      navigation.navigate({
        name: "PlayListPreview",
        key: item.id,
        params: {
          pluginId: item.pluginId,
          playlistItemId: item.id,
          pluginName,
          pluginDescription: plugin?.pluginDescription,
          cameFrom: true,
          modelNo,
          width: displayWidth,
          height: displayHeight,
        },
      });

    } catch (error: any) {
      console.log(
        "OPEN PLAYGROUND ERROR:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Error",
        "Failed to open playground."
      );
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!deleteItemId || !id) {
      return;
    }

    try {
      await apiClient.delete(
        `/playlist/item/${deleteItemId}/frame-or-group/${id}`
      );

      setOpenDeleteModal(false);
      setDeleteItemId(null);

      Alert.alert(
        "Success",
        "Playlist item deleted successfully."
      );

      // If this was the only item on the current page,
      // go back to the previous page.
      if (items.length === 1 && page > 1) {
        setPage((previous) => Math.max(previous - 1, 1));
      } else {
        await fetchPlaylistItems(page);
      }

    } catch (error: any) {
      console.log(
        "DELETE PLAYLIST ERROR:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to delete playlist item."
      );
    }
  };

  /* ================= CLOSE MODALS ================= */

  const closePlaylistModal = () => {
    setOpenPlaylistModal(false);
    setSelectedItem(null);
    setSelectedPlugin(null);
  };

  /* ================= RENDER ITEM ================= */

  const renderItem = ({
    item,
  }: {
    item: PlaylistItem;
  }) => {
    const plugin = pluginsMap[String(item.pluginId)];

    const pluginName =
      item.data?.name ||
      plugin?.pluginName ||
      item.pluginName ||
      `App #${item.pluginId}`;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openPlayground(item)}
        className="
          bg-white dark:bg-[#1C1C1E]
          border border-gray-300 dark:border-gray-600
          rounded-xl p-4 mb-3
        "
      >

        {/* TOP SECTION */}

        <View className="flex-row justify-between items-center">

          <View className="flex-row items-center gap-3 flex-1 mr-3">

            {plugin?.pluginLogoUrl ? (
              <Image
                source={{ uri: plugin.pluginLogoUrl }}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View
                className="
                  w-10 h-10
                  bg-gray-100 dark:bg-gray-800
                  rounded-lg items-center justify-center
                "
              >
                <Monitor
                  size={iconSize}
                  color="#9CA3AF"
                />
              </View>
            )}

            <View className="flex-1">
              <Text
                bold
                numberOfLines={1}
                className="text-gray-900 dark:text-white text-xl"
              >
                {pluginName}
              </Text>

              <Text className="text-gray-400 text-md mt-1">
                {item.startTime} - {item.endTime}
              </Text>
            </View>

          </View>

          {/* ACTIONS */}

          <View className="flex-row items-center gap-3">

            <TouchableOpacity
              onPress={() => handleEdit(item)}
              className="
                w-9 h-9 rounded-lg
                bg-gray-100 dark:bg-gray-800
                items-center justify-center
              "
            >
              <Pencil
                size={iconSize}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setDeleteItemId(item.id);
                setOpenDeleteModal(true);
              }}
              className="
                w-9 h-9 rounded-lg
                bg-red-50 dark:bg-red-950
                items-center justify-center
              "
            >
              <Trash2
                size={iconSize}
                color="#EF4444"
              />
            </TouchableOpacity>

          </View>
        </View>

        {/* DIVIDER */}

        <View className="h-px bg-gray-100 dark:bg-gray-800 my-4" />

        {/* META */}

        <View className="flex-row flex-wrap justify-between gap-y-3">

          <View className="flex-row items-center">
            <ArrowUpDown
              size={iconSize}
              color="#9CA3AF"
            />

            <Text className="text-gray-400 text-xs ml-1">
              Priority: {item.priority}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Zap
              size={iconSize}
              color="#9CA3AF"
            />

            <Text className="text-gray-400 text-xs ml-1">
              Refresh: {item.refreshSeconds}
            </Text>
          </View>

          <Text
            className={`text-xs ${
              item.isEnabled
                ? "text-green-500"
                : "text-gray-500"
            }`}
          >
            {item.isEnabled ? "Active" : "Inactive"}
          </Text>

        </View>

      </TouchableOpacity>
    );
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <AppLayout>
        <View
          className="
            flex-1 bg-white dark:bg-[#1a1a1a]
            justify-center items-center
          "
        >
          <ActivityIndicator
            size="large"
            color="#3B82F6"
          />

          <Text className="text-gray-500 mt-3">
            Loading playlist...
          </Text>
        </View>
      </AppLayout>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <AppLayout>
      <View className="flex-1 bg-white dark:bg-[#1a1a1a] p-4">

        {/* HEADER */}

        <View className="mb-4">

          <Text
            bold
            className="
              text-gray-900 dark:text-white
              text-2xl mt-5
            "
          >
            {deviceName || "Playlist"}
          </Text>

          <Text className="text-gray-500 text-md">
            Devices / {deviceName || "Playlist"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAdd}
            className="
              border border-blue-500
              px-2 py-3 rounded-lg
              flex-row items-center
              w-full mt-5 justify-center
            "
          >
            <Plus
              size={iconSize}
              color="#3B82F6"
            />

            <Text
              bold
              className="text-blue-400 ml-2 text-sm"
            >
              Add Item
            </Text>
          </TouchableOpacity>

        </View>

        {/* PLAYLIST LIST */}

        {items.length === 0 ? (

          <View className="flex-1 items-center justify-center">

            <Monitor
              size={iconSize * 2}
              color="#6B7280"
            />

            <Text className="text-gray-900 dark:text-white font-semibold mt-3">
              No playlist items yet
            </Text>

            <Text className="text-gray-500 text-center mt-2">
              Add Apps to this device's playlist to display
              content on your screen.
            </Text>

            <TouchableOpacity
              onPress={handleAdd}
              className="
                flex-row items-center justify-center
                border border-blue-500 rounded-lg
                px-5 py-3 mt-5
              "
            >
              <Plus
                size={iconSize}
                color="#3B82F6"
              />

              <Text className="text-blue-400 ml-2">
                Add First Item
              </Text>
            </TouchableOpacity>

          </View>

        ) : (

          <View className="flex-1">

            {/* FLATLIST */}

            <FlatList
              style={{ flex: 1 }}
              data={items}
              extraData={pluginsMap}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 10,
              }}
            />

            {/* PAGINATION */}

            {renderPagination()}

          </View>

        )}

        {/* SELECT PLUGIN MODAL */}

        <SelectPluginModal
          open={openSelectModal}
          onClose={() => setOpenSelectModal(false)}
          onSelect={(plugins: Plugin[]) => {
            const selected = plugins?.[0];

            if (!selected?.pluginId) {
              Alert.alert(
                "Error",
                "The selected plugin does not have a valid plugin ID."
              );
              return;
            }

            setSelectedPlugin(selected);
            setSelectedItem(null);
            setOpenSelectModal(false);
            setOpenPlaylistModal(true);
          }}
        />

        {/* ADD / EDIT PLAYLIST MODAL */}

        {selectedPlugin?.pluginId && id && (
          <PlaylistItemModal
            key={selectedItem?.id || "new"}
            open={openPlaylistModal}
            onClose={closePlaylistModal}
            pluginId={String(selectedPlugin.pluginId)}
            pluginName={selectedPlugin.pluginName}
            selectedItem={selectedItem}
            frameId={String(id)}
            onSaved={async () => {
              closePlaylistModal();
              await fetchPlaylistItems(page);
            }}
          />
        )}

        {/* DELETE MODAL */}

        <DeleteModal
          visible={openDeleteModal}
          onCancel={() => {
            setOpenDeleteModal(false);
            setDeleteItemId(null);
          }}
          onConfirm={handleDelete}
        />

      </View>
    </AppLayout>
  );
}
