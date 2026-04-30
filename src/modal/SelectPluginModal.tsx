import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Modal,
  Dimensions,
} from "react-native";

import { Monitor, Check, Search, X } from "lucide-react-native";
import apiClient from "../lib/api";

const { width } = Dimensions.get("window");

export interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
  pluginIsEnabled?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/plugin/all");
      setPlugins(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (plugin: Plugin) => {
    setSelectedPlugin((prev) =>
      prev?.pluginId === plugin.pluginId ? null : plugin
    );
  };

  const handleAdd = () => {
    if (!selectedPlugin) return;
    onSelect([selectedPlugin]);
    onClose();
  };

  const filteredPlugins = plugins.filter((p) =>
    p.pluginName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* OVERLAY */}
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View
          style={{
            width: width > 500 ? 400 : "100%",
            maxHeight: "85%",
          }}
          className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5"
        >
          {/* HEADER */}
          <View className="mb-4 relative">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Select Plugin
            </Text>
            <Text className="text-gray-500 text-sm">
              Choose one plugin to add
            </Text>

            {/* CLOSE BUTTON */}
            <TouchableOpacity
              onPress={onClose}
              className="absolute right-0 top-0 p-1"
            >
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* SEARCH */}
          <View className="relative mb-4">
            <View className="absolute left-3 top-3 z-10">
              <Search size={16} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Search plugins..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </View>

          {/* CONTENT */}
          {loading ? (
            <View className="flex-row flex-wrap gap-3">
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  className="w-[48%] h-24 bg-gray-200 dark:bg-gray-800 rounded-lg"
                />
              ))}
            </View>
          ) : filteredPlugins.length === 0 ? (
            <View className="items-center py-10">
              <Monitor size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No plugins found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPlugins}
              keyExtractor={(item) => item.pluginId}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const isSelected =
                  selectedPlugin?.pluginId === item.pluginId;

                return (
                  <TouchableOpacity
                    onPress={() => handleClick(item)}
                    style={{ width: "48%" }}
                    className={`relative p-3 rounded-xl border ${
                      isSelected
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-700"
                    } bg-gray-100 dark:bg-[#252525]`}
                  >
                    {/* CHECK */}
                    {isSelected && (
                      <View className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                        <Check size={12} color="white" />
                      </View>
                    )}

                    <View className="flex-row gap-2">
                      {item.pluginLogoUrl ? (
                        <Image
                          source={{ uri: item.pluginLogoUrl }}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <View className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg items-center justify-center">
                          <Monitor size={16} color="#9CA3AF" />
                        </View>
                      )}

                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-gray-900 dark:text-white font-medium"
                        >
                          {item.pluginName}
                        </Text>

                        {item.pluginDescription && (
                          <Text
                            numberOfLines={2}
                            className="text-gray-500 text-xs mt-1"
                          >
                            {item.pluginDescription}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* FOOTER */}
          <View className="flex-row justify-between items-center mt-5 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Text className="text-sm text-gray-500 pt-2">
              {selectedPlugin ? "1 selected" : "0 selected"}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-500 pt-2">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!selectedPlugin}
                onPress={handleAdd}
                className={`px-4 py-2 rounded-lg ${
                  selectedPlugin ? "bg-blue-500" : "bg-blue-500"
                }`}
              >
                <Text className="text-white font-medium">
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