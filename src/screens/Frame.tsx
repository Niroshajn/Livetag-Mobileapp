
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import Text from "../components/AppText";

import {
  Monitor,
  Trash2,
  Settings,
  Battery,
  Wifi,
  Signal,
  ChevronRight,
  Plus,
  Folder,
  List,
} from "lucide-react-native";

import { useColorScheme } from "nativewind";
import { useAdmin } from "../context/AdminContext";
import api from "../lib/api";
import AppLayout from "./Layout";

import AddFrameModal from "../modal/AddFramemodal";
import AddGroupModal from "../modal/AddGroupModal";
import DeviceSettingsModal from "../modal/DeviceSettingsModal";
import DeleteModal from "../modal/DeleteModal";

import { Frame } from "../types/Frame";

// ------------------------------------------------
// TYPES
// ------------------------------------------------

type Orientation = "portrait" | "landscape";

interface DeviceFrame extends Frame {
  orientation?: Orientation;
  width?: number;
  height?: number;
  modelNo?: string;
  friendlyId?: string;
  battery?: number;
  wifiSSID?: string;
  signalStrength?: number;
  previewImageUrl?: string;
  status?: "online" | "offline";
  updatedAt?: string;
}

interface RouteParams {
  groupId?: string;
  groupName?: string;
  groupCount?: number;
  roles?: string[];
  selectedPluginId?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface GroupsResponse {
  data: Group[];
  meta?: PageMeta;
}

// ------------------------------------------------
// HELPERS
// ------------------------------------------------

function isDeviceOnline(updatedAt?: string) {
  if (!updatedAt) return false;

  const diff = Date.now() - new Date(updatedAt).getTime();

  return diff >= 0 && diff < 86400000;
}

function timeAgo(date?: string) {
  if (!date) return "Never";

  const diff = Date.now() - new Date(date).getTime();

  if (Number.isNaN(diff) || diff < 0) return "Never";

  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return "Just now";

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

const getDefaultOrientation = (
  width?: number,
  height?: number
): Orientation => {
  if (!width || !height) return "landscape";

  return width >= height ? "landscape" : "portrait";
};

const getOrientedDimensions = (
  width?: number,
  height?: number,
  orientation: Orientation = "landscape"
) => {
  const originalWidth = Number(width) || 800;
  const originalHeight = Number(height) || 480;

  const landscapeWidth = Math.max(originalWidth, originalHeight);
  const landscapeHeight = Math.min(originalWidth, originalHeight);

  if (orientation === "portrait") {
    return {
      width: landscapeHeight,
      height: landscapeWidth,
    };
  }

  return {
    width: landscapeWidth,
    height: landscapeHeight,
  };
};

// ------------------------------------------------
// SCREEN
// ------------------------------------------------

export default function FramesScreen({ navigation, route }: any) {
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  const params: RouteParams = route?.params || {};

  const selectedGroupId = params.groupId;
  const groupName = params.groupName;
  const selectedPluginId = params.selectedPluginId;

  // ------------------------------------------------
  // ADMIN
  // ------------------------------------------------

  const { isAdmin } = useAdmin();

  // ------------------------------------------------
  // STATES
  // ------------------------------------------------

  const [frames, setFrames] = useState<DeviceFrame[]>([]);

  const [groups, setGroups] = useState<Group[]>([]);

  const [totalGroups, setTotalGroups] = useState(0);

  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState<PageMeta | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);

  const [showGroupPopup, setShowGroupPopup] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<Frame | null>(null);

  const [openSettingsModal, setOpenSettingsModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [updatingOrientationId, setUpdatingOrientationId] =
    useState<string | null>(null);

  const [expandedMoveDeviceId, setExpandedMoveDeviceId] =
    useState<string | null>(null);

  const [movingDeviceId, setMovingDeviceId] = useState<string | null>(null);

  // ------------------------------------------------
  // GROUP VISIBILITY — SAME AS WEB
  // ------------------------------------------------

  // Only use the actual backend group count.
  const hasMultipleGroups = totalGroups > 1;

  // Match the web app:
  // const isDefaultGroup = currentGroup?.isSystemDefault === true;
  const isDefaultGroup = currentGroup?.isSystemDefault === true;

  // Add Group:
  // Admin + Default Group + Only one group.
  const showAddGroupButton =
    isAdmin === true &&
    isDefaultGroup &&
    !hasMultipleGroups;

  // Playlist:
  // Non-default group + Multiple groups + Selected group.
  const showPlaylistButton =
    !isDefaultGroup &&
    hasMultipleGroups &&
    !!selectedGroupId;

  // ------------------------------------------------
  // FETCH GROUPS
  // ------------------------------------------------

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<GroupsResponse>("/frame-groups");

      const groupData = res.data?.data ?? [];

      // Save groups.
      setGroups(groupData);

      // Use backend total, not frameCount.
      const apiTotal = Number(res.data?.meta?.total);

      const actualTotal =
        Number.isFinite(apiTotal) && apiTotal >= 0
          ? apiTotal
          : groupData.length;

      setTotalGroups(actualTotal);

      // Find the selected group.
      // If no groupId is passed, find the system Default Group.
      const found = selectedGroupId
        ? groupData.find(
            (group) =>
              String(group.id) === String(selectedGroupId)
          )
        : groupData.find(
            (group) => group.isSystemDefault === true
          );

      setCurrentGroup(found ?? null);

      // DEBUG
      console.log(
        "========== MOBILE GROUP VISIBILITY =========="
      );

      console.log({
        isAdmin,
        selectedGroupId,
        groupName,

        groups: groupData.map((group) => ({
          id: group.id,
          name: group.name,
          isSystemDefault: group.isSystemDefault,
          frameCount: group.frameCount,
        })),

        currentGroup: found?.name,

        isSystemDefault: found?.isSystemDefault,

        totalGroups: actualTotal,

        hasMultipleGroups: actualTotal > 1,

        showAddGroupButton:
          isAdmin === true &&
          found?.isSystemDefault === true &&
          actualTotal === 1,
      });

      console.log(
        "=============================================="
      );
    } catch (error: any) {
      console.log(
        "Fetch groups error:",
        error?.response?.data || error
      );

      setGroups([]);
      setTotalGroups(0);
      setCurrentGroup(null);
    }
  }, [selectedGroupId, groupName, isAdmin]);

  // ------------------------------------------------
  // FETCH FRAMES
  // ------------------------------------------------

  const fetchFrames = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = selectedGroupId
        ? `/frame-groups/${selectedGroupId}/frames?page=${page}`
        : `/frames?page=${page}`;

      const res = await api.get(endpoint);

      const response = res.data;

      const data = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setMeta(response?.meta ?? null);

      const formatted: DeviceFrame[] = data.map((f: any) => {
        const width =
          f.devices?.[0]?.displayInfo?.displayResolutionWidth;

        const height =
          f.devices?.[0]?.displayInfo?.displayResolutionHeight;

        const orientation: Orientation =
          f.orientation ??
          getDefaultOrientation(width, height);

        return {
          id: f.id,
          name: f.name,
          timezone: f.timezone,
          isEnabled: f.isEnabled,
          updatedAt: f.updatedAt,

          previewImageUrl: f.CurrentPreviewImage
            ? `${f.CurrentPreviewImage}?t=${Date.now()}`
            : undefined,

          battery: f.telemetry?.battery
            ? Number(f.telemetry.battery)
            : 0,

          wifiSSID: f.telemetry?.wifiSSID ?? "Unknown",

          signalStrength: f.telemetry?.rssi ?? 0,

          sleepConfig: f.sleepConfig ?? null,

          status: isDeviceOnline(f.updatedAt)
            ? "online"
            : "offline",

          modelNo: f.devices?.[0]?.modelNo,

          width,

          height,

          friendlyId: f.devices?.[0]?.friendlyId,

          orientation,
        };
      });

      setFrames(formatted);
    } catch (error: any) {
      console.log(
        "Frames error:",
        error?.response?.data || error
      );

      setFrames([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, page]);

  // ------------------------------------------------
  // EFFECTS
  // ------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [selectedGroupId]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ------------------------------------------------
  // ORIENTATION CHANGE
  // ------------------------------------------------

  const handleOrientationChange = async (
    device: DeviceFrame,
    orientation: Orientation
  ) => {
    if (device.orientation === orientation) return;

    try {
      setUpdatingOrientationId(device.id);

      await api.patch(`/frames/edit/${device.id}`, {
        orientation,
      });

      setFrames((previous) =>
        previous.map((frame) =>
          frame.id === device.id
            ? { ...frame, orientation }
            : frame
        )
      );
    } catch (error: any) {
      console.log(
        "Orientation update error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to change device orientation."
      );
    } finally {
      setUpdatingOrientationId(null);
    }
  };

  // ------------------------------------------------
  // SETTINGS
  // ------------------------------------------------

  const openSettings = async (device: DeviceFrame) => {
    try {
      const res = await api.get<Frame>(`/frames/${device.id}`);

      setSelectedDevice(res.data);

      setOpenSettingsModal(true);
    } catch (error: any) {
      console.log(
        "Settings error:",
        error?.response?.data || error
      );

      Alert.alert("Error", "Failed to load device settings.");
    }
  };

  // ------------------------------------------------
  // DELETE DEVICE
  // ------------------------------------------------

  const deleteDevice = async (frameId: string) => {
    try {
      await api.delete(`/frames/${frameId}`);

      setFrames((previous) =>
        previous.filter((frame) => frame.id !== frameId)
      );

      await fetchGroups();
    } catch (error: any) {
      console.log(
        "Delete device error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to delete device."
      );
    }
  };

  // ------------------------------------------------
  // MOVE DEVICE TO GROUP
  // ------------------------------------------------

  const moveDeviceToGroup = async (
    groupId: string,
    frameId: string
  ) => {
    try {
      setMovingDeviceId(frameId);

      await api.patch(
        `/frame-groups/${groupId}/frames/${frameId}`
      );

      setExpandedMoveDeviceId(null);

      await fetchFrames();

      await fetchGroups();

      Alert.alert("Success", "Device moved successfully.");
    } catch (error: any) {
      console.log(
        "Move device error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to move device."
      );
    } finally {
      setMovingDeviceId(null);
    }
  };

  // ------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------

  const openPlaylist = (device: DeviceFrame) => {
    const orientation =
      device.orientation ??
      getDefaultOrientation(device.width, device.height);

    const dimensions = getOrientedDimensions(
      device.width,
      device.height,
      orientation
    );

    navigation.navigate("PlayList", {
      id: device.id,
      selectedPluginId,
      deviceName: device.name,
      modelNo: device.modelNo,
      Modelno: device.modelNo,
      width: dimensions.width,
      height: dimensions.height,
      orientation,
    });
  };

  const openGroupPlaylist = () => {
    navigation.navigate("GroupPlaylist", {
      groupId: selectedGroupId,
      groupName: groupName || currentGroup?.name,
    });
  };

  // ------------------------------------------------
  // DEVICE CARD
  // ------------------------------------------------

  const renderItem = ({ item }: { item: DeviceFrame }) => {
    const online = item.status === "online";

    const orientation =
      item.orientation ??
      getDefaultOrientation(item.width, item.height);

    const isUpdatingOrientation =
      updatingOrientationId === item.id;

    const isMoving = movingDeviceId === item.id;

    const busy = isUpdatingOrientation || isMoving;

    const availableGroups = groups.filter(
      (group) =>
        String(group.id) !== String(selectedGroupId)
    );

    const iconColor = isDark ? "#D1D5DB" : "#4B5563";

    return (
      <Pressable
        onPress={() => openPlaylist(item)}
        className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]"
      >
        {/* PREVIEW */}

        <View
          className="w-full items-center justify-center bg-gray-200 dark:bg-gray-800"
          style={{ aspectRatio: 5 / 3 }}
        >
          {item.previewImageUrl ? (
            <Image
              source={{ uri: item.previewImageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Monitor
              size={40}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          )}
        </View>

        {/* INFO */}

        <View className="p-4">
          <View className="flex-row items-center">
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {item.name}
              </Text>

              {item.friendlyId ? (
                <Text className="text-xs text-gray-400">
                  ({item.friendlyId})
                </Text>
              ) : null}

              <Text className="mt-1 text-xs text-gray-500">
                Last seen: {timeAgo(item.updatedAt)}
              </Text>
            </View>

            <View className="ml-2 items-center">
              <Battery size={20} color={iconColor} />

              <Text className="mt-1 text-xs text-gray-500">
                {item.battery ?? 0}
              </Text>
            </View>

            <View className="ml-3 items-center">
              <Wifi size={20} color={iconColor} />

              <Text
                numberOfLines={1}
                className="mt-1 max-w-[65px] text-xs text-gray-500"
              >
                {item.wifiSSID}
              </Text>
            </View>

            <View className="ml-3 items-center">
              <Signal size={20} color={iconColor} />

              <Text className="mt-1 text-xs text-gray-500">
                {item.signalStrength ?? 0}
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#9CA3AF"
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* DEVICE ACTIONS */}

          <View className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
            {/* STATUS + SETTINGS + DELETE */}

            <View className="flex-row items-center justify-between">
              <View
                className={`rounded-full px-3 py-2 ${
                  online
                    ? "bg-green-100 dark:bg-green-900/40"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Text
                  className={
                    online
                      ? "text-xs font-medium text-green-700 dark:text-green-400"
                      : "text-xs font-medium text-gray-600 dark:text-gray-400"
                  }
                >
                  {online ? "Online" : "Offline"}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    openSettings(item);
                  }}
                  className="mr-2 rounded-lg border border-blue-500 p-2"
                >
                  <Settings size={18} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    setSelectedId(item.id);
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg border border-gray-300 p-2 dark:border-gray-700"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ORIENTATION */}

            <View className="mt-4 flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
              <Pressable
                disabled={busy}
                onPress={(event) => {
                  event.stopPropagation();
                  handleOrientationChange(item, "landscape");
                }}
                className={`flex-1 items-center justify-center py-3 ${
                  orientation === "landscape"
                    ? "bg-blue-600"
                    : "bg-white dark:bg-[#252525]"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    orientation === "landscape"
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Landscape
                </Text>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={(event) => {
                  event.stopPropagation();
                  handleOrientationChange(item, "portrait");
                }}
                className={`flex-1 items-center justify-center border-l border-gray-300 py-3 dark:border-gray-700 ${
                  orientation === "portrait"
                    ? "bg-blue-600"
                    : "bg-white dark:bg-[#252525]"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    orientation === "portrait"
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Portrait
                </Text>
              </Pressable>
            </View>

            {/* MOVE TO GROUP */}

            {hasMultipleGroups && (
              <View className="mt-4">
                <Pressable
                  disabled={isMoving}
                  onPress={(event) => {
                    event.stopPropagation();

                    setExpandedMoveDeviceId(
                      expandedMoveDeviceId === item.id
                        ? null
                        : item.id
                    );
                  }}
                  className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-[#252525]"
                >
                  <View className="flex-row items-center">
                    <Folder size={17} color="#6B7280" />

                    <Text className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Move to Group
                    </Text>
                  </View>

                  {isMoving ? (
                    <ActivityIndicator
                      size="small"
                      color="#2563EB"
                    />
                  ) : (
                    <ChevronRight
                      size={18}
                      color="#9CA3AF"
                      style={{
                        transform: [
                          {
                            rotate:
                              expandedMoveDeviceId === item.id
                                ? "90deg"
                                : "0deg",
                          },
                        ],
                      }}
                    />
                  )}
                </Pressable>

                {expandedMoveDeviceId === item.id && (
                  <View className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#252525]">
                    {availableGroups.length === 0 ? (
                      <Text className="p-3 text-sm text-gray-500">
                        No other groups available.
                      </Text>
                    ) : (
                      availableGroups.map((group) => (
                        <Pressable
                          key={group.id}
                          disabled={isMoving}
                          onPress={(event) => {
                            event.stopPropagation();

                            moveDeviceToGroup(
                              group.id,
                              item.id
                            );
                          }}
                          className="flex-row items-center border-b border-gray-100 px-3 py-3 dark:border-gray-700"
                        >
                          <Folder
                            size={16}
                            color="#2563EB"
                          />

                          <Text className="ml-2 text-sm text-gray-800 dark:text-gray-200">
                            {group.name}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  if (loading && frames.length === 0) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text className="mt-3 text-gray-500">
            Loading devices...
          </Text>
        </View>
      </AppLayout>
    );
  }

  // ------------------------------------------------
  // MAIN UI
  // ------------------------------------------------

  return (
    <AppLayout>
      {/* HEADER */}

      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {groupName || currentGroup?.name || "Devices"}
        </Text>

        <Text className="mt-1 text-sm text-gray-500">
          Manage your connected devices
        </Text>

        {/* ----------------------------------------
            ACTION BUTTONS
        ---------------------------------------- */}

        <View className="mt-4 flex-row flex-wrap items-center gap-2">

          {/* ADD GROUP */}

          {showAddGroupButton && (
            <Pressable
              onPress={() => setShowGroupPopup(true)}
              className="flex-row items-center justify-center rounded-lg border border-blue-500 px-3 py-2.5"
            >
              <Plus size={16} color="#3B82F6" />

              <Text className="ml-2 text-sm font-semibold text-blue-500">
                Add Group
              </Text>
            </Pressable>
          )}

          {/* PLAYLIST */}

          {showPlaylistButton && (
            <Pressable
              onPress={openGroupPlaylist}
              className="flex-row items-center justify-center rounded-lg border border-blue-500 px-3 py-2.5"
            >
              <List size={16} color="#3B82F6" />

              <Text className="ml-2 text-sm font-semibold text-blue-500">
                Playlist
              </Text>
            </Pressable>
          )}

          {/* ADD DEVICE — ALWAYS VISIBLE */}

          <Pressable
            onPress={() => setShowAddPopup(true)}
            className="flex-row items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5"
          >
            <Plus size={16} color="#FFFFFF" />

            <Text className="ml-2 text-sm font-semibold text-white">
              Add Device
            </Text>
          </Pressable>
        </View>

        {/* CURRENT GROUP BAR */}

        {selectedGroupId && (
          <View className="mt-4 flex-row items-center rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
            <Folder size={18} color="#2563EB" />

            <Text className="ml-2 flex-1 font-medium text-blue-600 dark:text-blue-400">
              {groupName || currentGroup?.name || "Selected Group"}
            </Text>

            <Text className="text-xs text-gray-500">
              {currentGroup?.frameCount ?? frames.length} devices
            </Text>
          </View>
        )}
      </View>

      {/* DEVICE LIST */}

      <FlatList
        data={frames}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchFrames}
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <Monitor size={50} color="#9CA3AF" />

            <Text className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
              No devices yet
            </Text>

            <Text className="mt-1 text-gray-500">
              Add your first device.
            </Text>
          </View>
        }
      />

      {/* PAGINATION */}

      {meta && frames.length > 0 && (
        <View className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <Pressable
            disabled={!meta.hasPrevious}
            onPress={() =>
              setPage((p) => Math.max(1, p - 1))
            }
            className={`rounded-lg px-4 py-2 ${
              meta.hasPrevious
                ? "bg-gray-200 dark:bg-gray-800"
                : "bg-gray-100 dark:bg-gray-900"
            }`}
          >
            <Text
              className={
                meta.hasPrevious
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-400"
              }
            >
              Previous
            </Text>
          </Pressable>

          <Text className="text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </Text>

          <Pressable
            disabled={!meta.hasNext}
            onPress={() => setPage((p) => p + 1)}
            className={`rounded-lg px-4 py-2 ${
              meta.hasNext
                ? "bg-blue-600"
                : "bg-gray-100 dark:bg-gray-900"
            }`}
          >
            <Text
              className={
                meta.hasNext
                  ? "text-white"
                  : "text-gray-400"
              }
            >
              Next
            </Text>
          </Pressable>
        </View>
      )}

      {/* ADD DEVICE MODAL */}

 <AddFrameModal
  visible={showAddPopup}
  onClose={() => setShowAddPopup(false)}
  onAdded={async () => {
    await fetchFrames();
    await fetchGroups();
  }}
  hideGroupSelect={true}
  groupId={selectedGroupId}
/>

      {/* ADD GROUP MODAL */}

      <AddGroupModal
        visible={showGroupPopup}
        onClose={() => setShowGroupPopup(false)}
        onCreated={async () => {
          setShowGroupPopup(false);

          await fetchGroups();

          navigation.navigate("Groups");
        }}
      />

      {/* DEVICE SETTINGS */}

      {selectedDevice && (
        <DeviceSettingsModal
          visible={openSettingsModal}
          device={selectedDevice}
          onClose={() => {
            setOpenSettingsModal(false);
            setSelectedDevice(null);
          }}
          onSave={(updated: Frame) => {
            setFrames((previous) =>
              previous.map((frame) =>
                frame.id === updated.id
                  ? { ...frame, ...updated }
                  : frame
              )
            );

            setOpenSettingsModal(false);
            setSelectedDevice(null);
          }}
        />
      )}

      {/* DELETE DEVICE */}

      <DeleteModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedId(null);
        }}
        onConfirm={async () => {
          if (selectedId) {
            await deleteDevice(selectedId);
          }
          setSelectedId(null);
          setShowDeleteModal(false);
        }}
      />
    </AppLayout>
  );
}
