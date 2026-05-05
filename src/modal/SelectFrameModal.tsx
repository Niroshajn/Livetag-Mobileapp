import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { Wifi, Monitor, Check, X } from "lucide-react-native";
import apiClient from "../lib/api";

  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
type Frame = {
  id: number | string;
  name: string;
  friendlyId?: string;
  updatedAt?: string;
  status?: "online" | "offline";
};

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue: (frameId: string) => void;
};

export default function SelectFrameModal({
  open,
  onClose,
  onContinue,
}: Props) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!open) return;
    fetchFrames();
  }, [open]);

  const fetchFrames = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/frames");
      const data = Array.isArray(res.data) ? res.data : [];

      setFrames(
        data.map((f) => ({
          ...f,
          status: f.updatedAt ? "online" : "offline",
        }))
      );
    } catch {
      setFrames([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFrame = (id: string) => {
    setSelectedFrameId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      {/* Overlay */}
      <View className="flex-1 bg-black/60 justify-center items-center px-4">

        {/* Modal Box */}
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
              Select Device
            </Text>
            <Text className="text-gray-500 text-sm">
              Choose a device
            </Text>

            <TouchableOpacity
              onPress={onClose}
              className="absolute right-0 top-0"
            >
              <X size={iconSize} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          {loading ? (
            <View className="flex-row flex-wrap gap-3">
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  className="w-[48%] h-28 bg-gray-200 rounded-xl"
                />
              ))}
            </View>
          ) : frames.length === 0 ? (
            <View className="items-center py-10">
              <Monitor size={iconSize} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">
                No devices available
              </Text>
            </View>
          ) : (
            <FlatList
              data={frames}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 10,
              }}
              renderItem={({ item }) => {
                const isSelected = selectedFrameId === String(item.id);

                return (
                  <TouchableOpacity
                    style={{ width: "48%" }}
                    onPress={() => toggleFrame(String(item.id))}
                    className={`relative p-4 rounded-xl border ${
                      isSelected
                        ? "border-blue-500"
                        : "border-gray-300"
                    } bg-gray-100 dark:bg-[#252525]`}
                  >
                    {/* Check */}
                    {isSelected && (
                      <View className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                        <Check size={iconSize} color="white" />
                      </View>
                    )}

                    {/* Icon */}
                    <View className="items-center mb-2">
                      <View className="w-10 h-10 bg-gray-300 rounded-lg items-center justify-center">
                        <Monitor size={iconSize} color="#555" />
                      </View>
                    </View>

                    {/* Name */}
                    <Text
                      numberOfLines={1}
                      className="text-center text-gray-900 font-medium"
                    >
                      {item.name}
                    </Text>

                    {/* Friendly ID */}
                    {item.friendlyId && (
                      <Text
                        numberOfLines={1}
                        className="text-xs text-center text-gray-500"
                      >
                        {item.friendlyId}
                      </Text>
                    )}

                    {/* Status */}
                    {item.status === "online" && (
                      <View className="flex-row justify-center items-center mt-2 gap-1">
                        <Wifi size={iconSize} color="green" />
                        <Text className="text-xs text-green-600">
                          Online
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* FOOTER */}
          <View className="flex-row justify-between mt-5 pt-3 border-t">
            <Text className="text-gray-500">
              {selectedFrameId ? "1 selected" : "0 selected"}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!selectedFrameId}
                onPress={() =>
                  selectedFrameId && onContinue(selectedFrameId)
                }
                className={`px-4 py-2 rounded-lg ${
                  selectedFrameId
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              >
                <Text className="text-white">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}