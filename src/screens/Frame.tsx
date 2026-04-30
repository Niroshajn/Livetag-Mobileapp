import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Monitor, Trash2, Settings } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import api from "../lib/api";
import AppLayout from "./Layout";
import AddDeviceModal from "../modal/AddFramemodal";
import DeviceSettingsModal from "../modal/DeviceSettingsModal";
import DeleteModal from "../modal/DeleteModal";
import { Frame } from "../types/Frame";

function isDeviceOnline(updatedAt?: string) {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < 86400000;
}

function timeAgo(date?: string) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function FramesScreen({ navigation }: any) {
  const { colorScheme } = useColorScheme();

  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<Frame | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchFrames = async () => {
    try {
      const res = await api.get("/frames");
      const data = Array.isArray(res.data) ? res.data : [];

      setFrames(
        data.map((f: any) => ({
          id: f.id,
          name: f.name,
          timezone: f.timezone,
          isEnabled: f.isEnabled,
          updatedAt: f.updatedAt,
          previewImageUrl: f.CurrentPreviewImage
            ? `${f.CurrentPreviewImage}?t=${Date.now()}`
            : undefined,
          battery: f.telemetry?.battery ?? 0,
          wifiSSID: f.telemetry?.wifiSSID ?? "Unknown",
          signalStrength: f.telemetry?.rssi ?? 0,
          sleepConfig: f.sleepConfig ?? null,
          status: isDeviceOnline(f.updatedAt) ? "online" : "offline",
        }))
      );
    } catch (err) {
      console.log(err);
      setFrames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  useEffect(() => {
    if (selectedDevice) setOpenModal(true);
  }, [selectedDevice]);

  const deleteDevice = async (id: string) => {
    await api.delete(`/frames/${id}`);
    setFrames((prev) => prev.filter((f) => f.id !== id));
  };

  const renderItem = ({ item }: { item: Frame }) => (
    <TouchableOpacity
      className="bg-white dark:bg-gray-900 rounded-xl mb-4 overflow-hidden shadow p-5"
      onPress={() => navigation.navigate("PlayList", { id: item.id })}
    >
      <View className="w-full bg-gray-200 aspect-[5/3] justify-center items-center">
        {item.previewImageUrl ? (
          <Image source={{ uri: item.previewImageUrl }} className="w-full h-full" />
        ) : (
          <Monitor size={40} color="gray" />
        )}
      </View>

      <View className="p-4">
        <Text className="text-lg text-gray-900 dark:text-white font-semibold">{item.name}</Text>
        <Text className="text-gray-500 text-sm">
          Last seen: {timeAgo(item.updatedAt)}
        </Text>

        <View className="flex-row justify-between mt-3">
          <Text className="text-gray-900 dark:text-white text-sm">
            {item.status === "online" ? "Online" : "Offline"}
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedId(item.id);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedDevice(item);
              }}
            >
              <Settings size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <AppLayout navigation={navigation}>
       <View className="px-4 pt-4 pb-2 bg-white dark:bg-[#1a1a1a] ">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Frames
      </Text>

      <Text className="text-gray-500 text-sm mt-1">
        Manage your devices and monitor status
      </Text>
    </View>
      <FlatList
        data={frames}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      {selectedDevice && (
        <DeviceSettingsModal
          visible={openModal}
          device={selectedDevice}
          onClose={() => {
            setOpenModal(false);
            setSelectedDevice(null);
          }}
          onSave={(updated) => {
            setFrames((prev) =>
              prev.map((f) => (f.id === updated.id ? updated : f))
            );
          }}
        />
      )}

      <DeleteModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (selectedId) deleteDevice(selectedId);
          setShowDeleteModal(false);
        }}
      />
    </AppLayout>
  );
}