
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";

import Text from "../components/AppText";
import {
  Puzzle,
  ChevronDown,
  X,
  Search,
  ArrowUpDown,
  Users,
} from "lucide-react-native";

import api from "../lib/api";
import AppLayout from "./Layout";

interface Tag {
  id: string;
  name: string;
}

export interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
  pluginPreviewUrl?: string;
  pluginIsEnabled: boolean;
  connections?: number;
  pluginInstalls: number;
  createdAt?: string;
  hashtags?: Tag[];
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

type SortOption = "newest" | "oldest" | "popular" | "name";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest to Oldest" },
  { value: "oldest", label: "Oldest to Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "name", label: "Name (A-Z)" },
];

export default function Apps({ navigation, route }: any) {
  const frameId = route?.params?.frameId;
  const isSelectMode = Boolean(frameId);

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [meta, setMeta] = useState<PluginResponse["meta"] | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [page, setPage] = useState(1);

  // Fetch plugins using the same API and response structure as web.
  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get<PluginResponse>(
        `/plugin/all?page=${page}`
      );

      const result = response.data;

      setPlugins(Array.isArray(result?.data) ? result.data : []);
      setMeta(result?.meta ?? null);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      setPlugins([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  // Collect all unique hashtags from the current page.
  const allHashtags = useMemo(() => {
    const tags = new Set<string>();

    plugins.forEach((plugin) => {
      plugin.hashtags?.forEach((tag) => {
        tags.add(tag.name);
      });
    });

    return Array.from(tags).sort();
  }, [plugins]);

  // Toggle hashtag selection.
  const toggleHashtag = (tag: string) => {
    setSelectedHashtags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

  // Search, filter and sort plugins.
  const filteredAndSortedPlugins = useMemo(() => {
    let result = [...plugins];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();

      result = result.filter(
        (plugin) =>
          (plugin.pluginName ?? "").toLowerCase().includes(query) ||
          (plugin.pluginDescription ?? "").toLowerCase().includes(query)
      );
    }

    if (selectedHashtags.length > 0) {
      result = result.filter((plugin) =>
        plugin.hashtags?.some((tag) =>
          selectedHashtags.includes(tag.name)
        )
      );
    }

    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
        break;

      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
        );
        break;

      case "popular":
        result.sort(
          (a, b) =>
            (b.pluginInstalls ?? 0) - (a.pluginInstalls ?? 0)
        );
        break;

      case "name":
        result.sort((a, b) =>
          (a.pluginName ?? "").localeCompare(b.pluginName ?? "")
        );
        break;
    }

    return result;
  }, [plugins, searchQuery, selectedHashtags, sortBy]);

  // Open the selected plugin.
  const handlePluginClick = (plugin: Plugin) => {
    if (isSelectMode) {
      navigation.navigate("GroupPlaylist", {
        targetId: frameId,
        selectedPluginId: plugin.pluginId,
      });
    } else {
      navigation.navigate("PreviewPage", {
        pluginId: plugin.pluginId,
        pluginName: plugin.pluginName,
        pluginDescription: plugin.pluginDescription,
      });
    }
  };

  // Render each app.
  const renderItem = ({ item }: { item: Plugin }) => (
    <View className="mb-5 w-1/3 px-2">
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handlePluginClick(item)}
        className="items-center"
        accessibilityRole="button"
        accessibilityLabel={item.pluginName}
      >
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
          {item.pluginLogoUrl ? (
            <Image
              source={{ uri: item.pluginLogoUrl }}
              className="h-full w-full"
              resizeMode="contain"
              accessibilityLabel={`${item.pluginName} icon`}
            />
          ) : (
            <Puzzle size={32} color="#9CA3AF" />
          )}
        </View>

        <Text
          className="mt-2 text-center text-xs font-semibold text-gray-900 dark:text-white"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.pluginName}
        </Text>

        <View className="mt-1 flex-row items-center">
          <Users size={12} color="#9CA3AF" />
          <Text className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            {item.pluginInstalls ?? 0}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center bg-white dark:bg-[#1a1a1a]">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading apps...
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 bg-white p-4 dark:bg-[#1a1a1a]">

        {/* Header */}
        <View className="mb-5">
          <Text bold className="text-2xl text-black dark:text-white">
            {isSelectMode ? "Select an App" : "Apps"}
          </Text>

          <Text className="mt-1 text-md text-gray-500 dark:text-gray-400">
            Browse and install community-built Apps
          </Text>
        </View>

        {/* Search */}
        <View className="mb-3 flex-row items-center rounded-xl bg-gray-100 px-3 dark:bg-gray-800">
          <Search size={18} color="#9CA3AF" />

          <TextInput
            placeholder="Search apps..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2 flex-1 py-3 text-black dark:text-white"
            returnKeyType="search"
            autoCorrect={false}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tag filter */}
        {allHashtags.length > 0 && (
          <View className="relative z-20 mb-3">
            <TouchableOpacity
              onPress={() =>
                setShowTagDropdown((previous) => !previous)
              }
              activeOpacity={0.7}
              className="flex-row items-center justify-between rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800"
            >
              <Text className="text-sm font-medium text-black dark:text-white">
                {selectedHashtags.length > 0
                  ? `Filter Tags (${selectedHashtags.length})`
                  : "Filter Tags"}
              </Text>

              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {showTagDropdown && (
              <View className="absolute left-0 right-0 top-12 max-h-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <ScrollView nestedScrollEnabled>
                  {allHashtags.map((tag) => {
                    const selected = selectedHashtags.includes(tag);

                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleHashtag(tag)}
                        className="flex-row items-center px-4 py-3"
                      >
                        <View
                          className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-400 bg-white"
                          }`}
                        >
                          {selected && (
                            <Text className="text-xs font-bold text-white">
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text className="text-sm text-black dark:text-white">
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Selected tags */}
        {selectedHashtags.length > 0 && (
          <View className="mb-3 flex-row flex-wrap">
            {selectedHashtags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleHashtag(tag)}
                className="mb-2 mr-2 flex-row items-center rounded-full bg-blue-600 px-3 py-2"
              >
                <Text className="mr-1 text-xs text-white">
                  #{tag}
                </Text>
                <X size={13} color="#FFFFFF" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setSelectedHashtags([])}
              className="mb-2 justify-center px-2"
            >
              <Text className="text-xs text-blue-600 dark:text-blue-400">
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sort */}
        <View className="relative z-10 mb-3">
          <TouchableOpacity
            onPress={() =>
              setShowSortDropdown((previous) => !previous)
            }
            activeOpacity={0.7}
            className="flex-row items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <View className="flex-row items-center">
              <ArrowUpDown size={16} color="#6B7280" />
              <Text className="ml-2 text-sm text-black dark:text-white">
                {sortOptions.find((option) => option.value === sortBy)?.label}
              </Text>
            </View>

            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>

          {showSortDropdown && (
            <View className="absolute left-0 right-0 top-12 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortDropdown(false);
                  }}
                  className="px-4 py-3"
                >
                  <Text className="text-sm text-black dark:text-white">
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Results count */}
        <Text className="mb-3 text-md text-gray-500 dark:text-gray-400">
          Showing {filteredAndSortedPlugins.length} apps
          {searchQuery.trim()
            ? ` for "${searchQuery.trim()}"`
            : ""}
        </Text>

        {/* Apps grid */}
      {/* Apps grid */}
{filteredAndSortedPlugins.length === 0 ? (
  <View className="flex-1 items-center justify-center">
    <Puzzle size={38} color="#9CA3AF" />

    <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">
      {searchQuery || selectedHashtags.length > 0
        ? "No apps found"
        : "No apps yet"}
    </Text>

    <Text className="mt-1 text-center text-xs text-gray-400">
      Try changing your search or filters.
    </Text>
  </View>
) : (
  <>
    <FlatList
      data={filteredAndSortedPlugins}
      renderItem={renderItem}
      keyExtractor={(item) => item.pluginId}
      numColumns={3}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 16,
      }}
      columnWrapperStyle={{
        justifyContent: "flex-start",
      }}
    />

    {/* Pagination */}
    {meta && meta.totalPages > 1 && (
      <View className="flex-row items-center justify-between border-t border-gray-200 py-4 dark:border-gray-700">

        {/* Previous */}
        <TouchableOpacity
          disabled={!meta.hasPrevious || loading}
          onPress={() => {
            setPage((previous) => Math.max(1, previous - 1));
          }}
          activeOpacity={0.7}
          className={`rounded-lg border px-4 py-2 ${
            !meta.hasPrevious
              ? "border-gray-200 opacity-40 dark:border-gray-700"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            Previous
          </Text>
        </TouchableOpacity>

        {/* Page number */}
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          Page {meta.page} of {meta.totalPages}
        </Text>

        {/* Next */}
        <TouchableOpacity
          disabled={!meta.hasNext || loading}
          onPress={() => {
            setPage((previous) => previous + 1);
          }}
          activeOpacity={0.7}
          className={`rounded-lg border px-4 py-2 ${
            !meta.hasNext
              ? "border-gray-200 opacity-40 dark:border-gray-700"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <Text className="text-sm font-medium text-gray-800 dark:text-white">
            Next
          </Text>
        </TouchableOpacity>

      </View>
    )}
  </>
)}
      </View>
    </AppLayout>
  );
}
