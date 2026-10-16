
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Check, Monitor, Wifi, X } from "lucide-react-native";

import apiClient from "../lib/api";
import {
  DEFAULT_DEVICE_PROFILE,
  type DeviceProfile,
} from "../../packages/ltag/device";

type FrameDevice = {
  modelNo?: string;
  displayInfo?: {
    displayResolutionWidth?: number;
    displayResolutionHeight?: number;
  };
};

type Frame = {
  id: number | string;
  name: string;
  friendlyId?: string;
  updatedAt?: string;
  devices?: FrameDevice[];
  status?: "online" | "offline";
};

export type SelectedFrame = {
  frameId: string;
  profile: DeviceProfile;
  width: number;
  height: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue: (selection: SelectedFrame) => void;
};

function isDeviceOnline(updatedAt?: string): boolean {
  if (!updatedAt) return false;

  const timestamp = new Date(updatedAt).getTime();

  return (
    Number.isFinite(timestamp) &&
    Date.now() - timestamp < 5 * 60 * 1000
  );
}

function getProfileFromDevice(
  device?: FrameDevice
): DeviceProfile {
  const width = device?.displayInfo?.displayResolutionWidth;
  const height = device?.displayInfo?.displayResolutionHeight;

  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    width <= 0 ||
    height <= 0
  ) {
    return DEFAULT_DEVICE_PROFILE;
  }

  return {
    ...DEFAULT_DEVICE_PROFILE,
    canvasWidth: width,
    canvasHeight: height,
  };
}

export default function SelectFrameModal({
  open,
  onClose,
  onContinue,
}: Props) {
  const { width } = useWindowDimensions();

  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrameId, setSelectedFrameId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchFrames() {
      setLoading(true);
      setLoadError("");
      setSelectedFrameId(null);

      try {
        const response = await apiClient.get<Frame[]>("/frames");
        const data = Array.isArray(response.data)
          ? response.data
          : [];

        if (!cancelled) {
          setFrames(
            data.map((frame) => ({
              ...frame,
              status: isDeviceOnline(frame.updatedAt)
                ? "online"
                : "offline",
            }))
          );
        }
      } catch (error) {
        console.error("LOAD FRAMES ERROR:", error);

        if (!cancelled) {
          setFrames([]);
          setLoadError(
            "Failed to load devices. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFrames();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedFrame = frames.find(
    (frame) => String(frame.id) === selectedFrameId
  );

  const selectedProfile = getProfileFromDevice(
    selectedFrame?.devices?.[0]
  );

  const handleContinue = () => {
    if (!selectedFrame || loading) return;

    onContinue({
      frameId: String(selectedFrame.id),
      profile: selectedProfile,
      width: selectedProfile.canvasWidth,
      height: selectedProfile.canvasHeight,
    });
  };

  const cardWidth = (width - 64) / 2;

  const retry = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await apiClient.get<Frame[]>("/frames");
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setFrames(
        data.map((frame) => ({
          ...frame,
          status: isDeviceOnline(frame.updatedAt)
            ? "online"
            : "offline",
        }))
      );
    } catch (error) {
      console.error("RETRY FRAMES ERROR:", error);
      setLoadError("Failed to load devices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View
          style={{
            width: Math.min(width - 32, 400),
            maxHeight: "85%",
          }}
          className="rounded-2xl bg-white p-5"
        >
          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-[#111827]">
                Select Device
              </Text>
              <Text className="mt-1 text-sm text-[#6B7280]">
                Choose a device to add this plugin to
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close device selector"
              hitSlop={10}
              className="p-1"
            >
              <X size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {loading ? (
            <View className="min-h-[180px] items-center justify-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="mt-3 text-sm text-[#6B7280]">
                Loading devices...
              </Text>
            </View>
          ) : loadError ? (
            <View className="items-center py-8">
              <Text className="text-center text-sm text-red-600">
                {loadError}
              </Text>

              <Pressable
                onPress={retry}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2"
              >
                <Text className="font-semibold text-white">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : frames.length === 0 ? (
            <View className="items-center py-10">
              <Monitor size={36} color="#9CA3AF" />
              <Text className="mt-3 text-sm text-[#6B7280]">
                No devices available
              </Text>
            </View>
          ) : (
            <FlatList
              data={frames}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 10,
              }}
              contentContainerStyle={{ paddingBottom: 4 }}
              renderItem={({ item }) => {
                const selected =
                  String(item.id) === selectedFrameId;

                return (
                  <Pressable
                    onPress={() =>
                      setSelectedFrameId((previous) =>
                        previous === String(item.id)
                          ? null
                          : String(item.id)
                      )
                    }
                    style={{ width: cardWidth }}
                    className={`relative min-h-[108px] justify-center rounded-xl border p-3 ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-[#E5E7EB] bg-[#F9FAFB]"
                    }`}
                  >
                    {selected && (
                      <View className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    )}

                    <View className="mb-2 items-center">
                      <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#E5E7EB]">
                        <Monitor size={19} color="#6B7280" />
                      </View>
                    </View>

                    <Text
                      numberOfLines={1}
                      className="text-center text-sm font-medium text-[#111827]"
                    >
                      {item.name}
                    </Text>

                    {item.friendlyId ? (
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-center text-xs text-[#6B7280]"
                      >
                        {item.friendlyId}
                      </Text>
                    ) : null}

                    {item.status === "online" ? (
                      <View className="mt-2 flex-row items-center justify-center gap-1">
                        <Wifi size={13} color="#16A34A" />
                        <Text className="text-xs text-green-600">
                          Online
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}

          <View className="mt-4 flex-row items-center justify-between border-t border-[#E5E7EB] pt-4">
            <Text className="text-xs text-[#6B7280]">
              {selectedFrameId ? "1 selected" : "0 selected"}
            </Text>

            <View className="flex-row items-center gap-3">
              <Pressable onPress={onClose} className="px-2 py-2">
                <Text className="text-sm font-medium text-[#4B5563]">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={!selectedFrameId || loading || !!loadError}
                onPress={handleContinue}
                className={`rounded-lg px-4 py-2 ${
                  selectedFrameId && !loading && !loadError
                    ? "bg-blue-600"
                    : "bg-blue-300"
                }`}
              >
                <Text className="text-sm font-semibold text-white">
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
