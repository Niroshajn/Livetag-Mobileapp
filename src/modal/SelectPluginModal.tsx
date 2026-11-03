import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import Text from "../components/AppText";

import {
  Monitor,
  Check,
  Search,
  X,
} from "lucide-react-native";

import apiClient from "../lib/api";

const { width } = Dimensions.get("window");

export interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
  pluginIsEnabled: boolean;
}

interface PluginResponse {
  data: Plugin[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (plugins: Plugin[]) => void;
};

export default function SelectPluginModal({
  open,
  onClose,
  onSelect,
}: Props) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPlugin, setSelectedPlugin] =
    useState<Plugin | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const iconSize = Math.max(18, Math.min(width * 0.05, 24));

  // -----------------------------------------
  // FETCH ALL PLUGINS WITH PAGINATION
  // -----------------------------------------

  const fetchPlugins = useCallback(async () => {
    setLoading(true);

    try {
      let page = 1;
      let hasNext = true;

      const allPlugins: Plugin[] = [];

      while (hasNext) {
        const res = await apiClient.get<PluginResponse>(
          `/plugin/all?page=${page}`
        );

        const responseData = res.data;

        allPlugins.push(...(responseData.data ?? []));

        hasNext = responseData.meta?.hasNext ?? false;

        page++;
      }

      console.log("Total plugins:", allPlugins.length);

      setPlugins(allPlugins);

    } catch (error: any) {
      console.error(
        "Failed to load plugins:",
        error?.response?.data || error
      );

      setPlugins([]);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to load plugins"
      );

    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch plugins whenever modal opens

  useEffect(() => {
    if (open) {
      setSelectedPlugin(null);
      setSearchQuery("");
      fetchPlugins();
    }
  }, [open, fetchPlugins]);

  // -----------------------------------------
  // SELECT PLUGIN
  // -----------------------------------------

  const handleClick = (plugin: Plugin) => {
    setSelectedPlugin((prev) =>
      prev?.pluginId === plugin.pluginId ? null : plugin
    );
  };

  // -----------------------------------------
  // ADD PLUGIN
  // -----------------------------------------

  const handleAdd = () => {
    if (!selectedPlugin) {
      Alert.alert("Select Plugin", "Please select a plugin");
      return;
    }

    onSelect([selectedPlugin]);

    setSelectedPlugin(null);
    setSearchQuery("");

    onClose();
  };

  // -----------------------------------------
  // SEARCH
  // -----------------------------------------

  const filteredPlugins = plugins.filter((plugin) =>
    plugin.pluginName
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  // -----------------------------------------
  // RENDER PLUGIN CARD
  // -----------------------------------------

  const renderPlugin = ({ item }: { item: Plugin }) => {
    const isSelected =
      selectedPlugin?.pluginId === item.pluginId;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleClick(item)}
        style={{ width: "48%" }}
        className={`relative rounded-xl border p-3 ${
          isSelected
            ? "border-blue-500 dark:border-blue-400"
            : "border-gray-200 dark:border-gray-700"
        } bg-gray-50 dark:bg-[#252525]`}
      >
        {/* SELECTED CHECK */}

        {isSelected && (
          <View className="absolute right-2 top-2 z-10 h-5 w-5 items-center justify-center rounded-full bg-blue-500">
            <Check size={13} color="#FFFFFF" />
          </View>
        )}

        {/* PLUGIN DETAILS */}

        <View className="flex-row items-start gap-2">

          {/* LOGO */}

          {item.pluginLogoUrl ? (
            <Image
              source={{ uri: item.pluginLogoUrl }}
              resizeMode="cover"
              className="h-10 w-10 rounded-lg"
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
              <Monitor
                size={20}
                color="#9CA3AF"
              />
            </View>
          )}

          {/* NAME AND DESCRIPTION */}

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={1}
              className="font-medium text-gray-900 dark:text-white"
            >
              {item.pluginName}
            </Text>

            {!!item.pluginDescription && (
              <Text
                numberOfLines={2}
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                {item.pluginDescription}
              </Text>
            )}
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  // -----------------------------------------
  // LOADING SKELETON
  // -----------------------------------------

  const renderSkeleton = () => (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {[...Array(4)].map((_, index) => (
        <View
          key={index}
          style={{ width: "48%" }}
          className="h-24 rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-[#252525]"
        >
          <View className="flex-row items-center gap-2 p-3">
            <View className="h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-700" />

            <View className="flex-1 gap-2">
              <View className="h-3 w-20 rounded bg-gray-300 dark:bg-gray-700" />

              <View className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-600" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* OVERLAY */}

      <View className="flex-1 items-center justify-center bg-black/60 px-4 py-6">

        {/* MODAL CONTAINER */}

        <View
          style={{
            width: width > 500 ? 460 : "100%",
            maxHeight: "85%",
          }}
          className="rounded-2xl bg-white p-5 dark:bg-[#1a1a1a]"
        >

          {/* HEADER */}

          <View className="mb-5 flex-row items-center justify-between">

            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Select Plugin
              </Text>

              <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose one plugin to add
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={10}
              className="rounded-lg p-1"
            >
              <X
                size={iconSize}
                color="#9CA3AF"
              />
            </TouchableOpacity>

          </View>

          {/* SEARCH */}

          <View className="mb-4 flex-row items-center rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-[#252525]">

            <Search
              size={18}
              color="#9CA3AF"
            />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search plugins..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="ml-2 flex-1 py-3 text-sm text-gray-900 dark:text-white"
            />

            {!!searchQuery && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={8}
              >
                <X
                  size={16}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}

          </View>

          {/* PLUGIN LIST */}

          {loading ? (

            <View className="py-2">
              {renderSkeleton()}
            </View>

          ) : filteredPlugins.length === 0 ? (

            <View className="items-center justify-center py-10">

              <Monitor
                size={42}
                color="#9CA3AF"
              />

              <Text className="mt-3 text-base font-medium text-gray-500 dark:text-gray-400">
                No plugins found
              </Text>

            </View>

          ) : (

            <FlatList
              data={filteredPlugins}
              keyExtractor={(item) => item.pluginId}
              renderItem={renderPlugin}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 12,
              }}
              contentContainerStyle={{
                paddingBottom: 4,
              }}
              style={{
                maxHeight: 320,
              }}
              keyboardShouldPersistTaps="handled"
            />

          )}

          {/* FOOTER */}

          <View className="mt-5 flex-row items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">

            {/* SELECTED COUNT */}

            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {selectedPlugin ? "1 selected" : "0 selected"}
            </Text>

            {/* ACTION BUTTONS */}

            <View className="flex-row items-center gap-3">

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="px-3 py-2"
              >
                <Text className="font-medium text-gray-600 dark:text-gray-300">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={!selectedPlugin || loading}
                activeOpacity={0.8}
                className={`rounded-lg px-4 py-2.5 ${
                  selectedPlugin && !loading
                    ? "bg-blue-500"
                    : "bg-blue-300 dark:bg-blue-900"
                }`}
              >
                <Text className="font-semibold text-white">
                  Add Plugin
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>
      </View>
    </Modal>
  );
}
