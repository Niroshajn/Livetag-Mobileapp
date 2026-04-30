import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Puzzle, ChevronDown } from "lucide-react-native";
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
  pluginInstalls: number;
  createdAt?: string;
  hashtags?: Tag[];
}

type SortOption = "newest" | "oldest" | "popular" | "name";

export default function Apps({ navigation }: any) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // 🔥 FETCH
  const fetchPlugins = async () => {
    try {
      const res = await api.get("/plugin/all");
      setPlugins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Error:", err);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  // 🔹 ALL TAGS
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    plugins.forEach((p) => {
      p.hashtags?.forEach((t) => tags.add(t.name));
    });
    return Array.from(tags);
  }, [plugins]);

  // 🔹 FILTER + SORT
  const filteredPlugins = useMemo(() => {
    let result = [...plugins];

    // SEARCH
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.pluginName.toLowerCase().includes(q) ||
          p.pluginDescription?.toLowerCase().includes(q)
      );
    }

    // TAG FILTER
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        p.hashtags?.some((tag) => selectedTags.includes(tag.name))
      );
    }

    // SORT
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
        result.sort((a, b) => b.pluginInstalls - a.pluginInstalls);
        break;
      case "name":
        result.sort((a, b) =>
          a.pluginName.localeCompare(b.pluginName)
        );
        break;
    }

    return result;
  }, [plugins, searchQuery, selectedTags, sortBy]);

  // 🔹 TOGGLE TAG
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  // 🔹 CARD
  const renderItem = ({ item }: { item: Plugin }) => (
    <TouchableOpacity
      className="bg-white dark:bg-gray-900 rounded-xl mb-4 overflow-hidden shadow"
      onPress={() => {
        navigation.navigate("PreviewPage", {
          pluginId: item.pluginId,
          pluginName: item.pluginName,
          pluginDescription: item.pluginDescription,
        });
      }
      }
    >
      {/* IMAGE */}
      <View className="w-full bg-gray-200 dark:bg-gray-800 aspect-[1/1] justify-center items-center">
        {item.pluginLogoUrl ? (
          <Image
            source={{ uri: item.pluginLogoUrl }}
            className="w-full h-full"
            resizeMode="contain"   // 🔥 change here
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Puzzle size={40} color="gray" />
          </View>
        )}
      </View>

      {/* INFO */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-black dark:text-white">
          {item.pluginName}
        </Text>

        <Text className="text-gray-500 text-sm mt-1">
          {item.pluginDescription || "No description"}
        </Text>

        <Text className="text-xs text-gray-400 mt-2">
          Installs: {item.pluginInstalls}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 🔄 LOADING
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 bg-white dark:bg-[#1a1a1a]  p-4">
        {/* 🔹 HEADER */}
        <Text className="text-xl font-bold text-black dark:text-white mb-3">
          Apps / Plugins
        </Text>

        {/* 🔹 SEARCH */}
        <TextInput
          placeholder="Search apps..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-gray-200 dark:bg-gray-900 p-3 rounded-lg mb-3 text-black dark:text-white"
        />

        {/* 🔹 FILTER DROPDOWN */}
        <View className="relative mb-3">
          <TouchableOpacity
            onPress={() => setShowTagDropdown(!showTagDropdown)}
            className="flex-row justify-between items-center px-4 py-2 bg-gray-300 dark:bg-gray-800 rounded-lg"
          >
            <Text className="text-black dark:text-white text-sm">
              Filter Tags
            </Text>
            <ChevronDown size={16} color="gray" />
          </TouchableOpacity>

          {showTagDropdown && (
            <View className="absolute top-12 w-full bg-white dark:bg-gray-900 border border-gray-300 rounded-lg max-h-60 z-50">
              <ScrollView>
                {allTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className="flex-row items-center px-3 py-2"
                  >
                    <View
                      className={`w-4 h-4 mr-2 border rounded ${selectedTags.includes(tag)
                        ? "bg-blue-500"
                        : "bg-white"
                        }`}
                    />
                    <Text className="text-black dark:text-white text-sm">
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 🔹 SELECTED TAGS */}
        {selectedTags.length > 0 && (
          <View className="flex-row flex-wrap mb-3">
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                className="bg-blue-500 px-3 py-1 rounded mr-2 mb-2 flex-row items-center"
              >
                <Text className="text-white text-xs">#{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 🔹 LIST */}
        {filteredPlugins.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Puzzle size={50} color="gray" />
            <Text className="text-gray-500 mt-2">
              No apps found
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPlugins}
            renderItem={renderItem}
            keyExtractor={(item) => item.pluginId}
          />
        )}
      </View>
    </AppLayout>
  );
}