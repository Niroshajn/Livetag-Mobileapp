import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
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

interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
}

interface PlaylistItem {
  id: string;
  pluginId: string;
  priority: number;
  refreshSeconds: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export default function PlaylistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [pluginsMap, setPluginsMap] = useState<Record<string, Plugin>>({});
  const [loading, setLoading] = useState(true);
  const [openSelectModal, setOpenSelectModal] = useState(false);
  const [openPlaylistModal, setOpenPlaylistModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [selectedItem, setSelectedItem] = useState<PlaylistItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const { width } = Dimensions.get("window");
    const iconSize = width * 0.05;
  useEffect(() => {
    fetchPlaylist();
    fetchPlugins();
  }, []);

  const fetchPlaylist = async () => {
    try {
      const res = await apiClient.get(`/playlist/items/frame/${id}`);

      console.log("✅ FETCH RESPONSE:", res.data);

      setItems(
        Array.isArray(res.data)
          ? res.data.map((item: any) => ({ ...item })) // ✅ new objects
          : []
      );

    } catch (err) {
      console.log("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchPlugins = async () => {
    try {
      const res = await apiClient.get("/plugin/all");
      const map: Record<string, Plugin> = {};
      res.data.forEach((p: Plugin) => {
        map[p.pluginId] = p;
      });
      setPluginsMap(map);
    } catch { }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setSelectedPlugin(null);
    setOpenSelectModal(true);
  };

  const handleEdit = (item: PlaylistItem) => {
    const plugin = pluginsMap[item.pluginId];
    if (!plugin) return;

    setSelectedItem({ ...item }); // ✅ FIX
    setSelectedPlugin(plugin);
    setOpenPlaylistModal(true);

  };

  const handleDelete = async (itemId: string) => {
    try {
      await apiClient.delete(`/playlist/item/${itemId}/frame/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch { }
  };
const openPlayground = async (item: PlaylistItem) => {
  try {
    await apiClient.post(`/playlist/${item.id}/copy-to-playground`);

    navigation.navigate({
      name: "PlayListPreview",
      key: item.id,
      params: {
        pluginId: item.pluginId,
        playlistItemId: item.id,
        pluginName: pluginsMap[item.pluginId]?.pluginName,
        pluginDescription: pluginsMap[item.pluginId]?.pluginDescription,
        cameFrom: true,
      },
    });
  } catch (err) {
    console.log("❌ Copy to playground failed:", err);
  }
};

  const renderItem = ({ item }: { item: PlaylistItem }) => {
    const plugin = pluginsMap[item.pluginId];

    return (
      <TouchableOpacity
        className="bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-600 rounded-xl p-4 mb-3"
       onPress={() => openPlayground(item)}
      >
        {/* TOP */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3 flex-1">
            {plugin?.pluginLogoUrl ? (
              <Image
                source={{ uri: plugin.pluginLogoUrl }}
                className="w-10 h-10 rounded-lg"
              />
            ) : (
              <View className="w-10 h-10 bg-[#2A2A2D] rounded-lg items-center justify-center">
                <Monitor size={iconSize} color="#9CA3AF" />
              </View>
            )}
            {/* TEXT */}
            <View className="flex-1">
              <Text numberOfLines={1} className="text-gray-900 dark:text-white font-semibold">
                {plugin?.pluginName || "Plugin"}
              </Text>
              <Text className="text-gray-400 text-xs">
                {item.startTime} - {item.endTime}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => handleEdit(item)}>
              <Pencil size={iconSize} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setDeleteItemId(item.id);
              setOpenDeleteModal(true);
            }}>
              <Trash2 size={iconSize} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* META */}
        <View className="flex-row justify-between mt-4">
          <View className="flex-row items-center gap-1">
            <ArrowUpDown size={iconSize} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">
              Priority {item.priority}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Zap size={iconSize} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">
              {item.refreshSeconds}s
            </Text>
          </View>

          <Text
            className={`text-xs ${item.isEnabled ? "text-green-400" : "text-gray-500"
              }`}
          >
            {item.isEnabled ? "Active" : "Inactive"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <AppLayout navigation={navigation}>
      <View className="flex-1 bg-white dark:bg-[#1a1a1a] p-4">

        {/* HEADER */}
        <View className="mb-4">
          <View>
            <Text className="text-gray-900 dark:text-white text-xl font-bold mt-5">Playlist</Text>
            <Text className="text-gray-900 dark:text-gray-500 text-xs">
              Devices / Playlist
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            className="border border-blue-500 px-2 py-2 rounded-lg flex-row items-center w-full mt-5 justify-center"
          >
            <Plus size={iconSize} color="#3B82F6" />
            <Text className="text-blue-400 ml-2 text-sm">
              Add Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Monitor size={iconSize} color="#6B7280" />
            <Text className="text-gray-500 mt-2">
              No playlist items
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            extraData={items} // 🔥 IMPORTANT
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}

        <SelectPluginModal
          open={openSelectModal}
          onClose={() => setOpenSelectModal(false)}
          onSelect={(plugins) => {
            if (plugins.length > 0) {
              setSelectedPlugin(plugins[0]);
              setOpenSelectModal(false);
              setOpenPlaylistModal(true);
            }
          }}
        />

        {selectedPlugin && (
          <PlaylistItemModal key={selectedItem?.id || "new"} // ✅ FIX 
            open={openPlaylistModal}
            onClose={() => setOpenPlaylistModal(false)}
            plugin={selectedPlugin}
            pluginName={selectedPlugin.pluginName}
            selectedItem={selectedItem}
            frameId={id}
            onSaved={async () => {
              await fetchPlaylist();
              setOpenPlaylistModal(false);
              setSelectedItem(null);
              setSelectedPlugin(null);
            }}
          />
        )}

        <DeleteModal
          visible={openDeleteModal}   // ✅ correct
          onCancel={() => setOpenDeleteModal(false)}  // ✅ correct
          onConfirm={async () => {
            if (!deleteItemId) return;
            try {
              await apiClient.delete(`/playlist/item/${deleteItemId}/frame/${id}`);
              setItems((prev) => prev.filter((i) => i.id !== deleteItemId));
              setOpenDeleteModal(false);
              setDeleteItemId(null);
            } catch (err) {
              console.log("Delete error:", err);
            }
          }}
        />

      </View>
    </AppLayout>
  );
}