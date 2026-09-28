import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

import {
  Monitor,
  Trash2,
  Settings,
  Battery,
  Wifi,
  Signal,
  ChevronRight,
  Plus,
  List,
  Folder,
  ChevronDown,
} from "lucide-react-native";

import { useColorScheme } from "nativewind";

import api from "../lib/api";
import AppLayout from "./Layout";

import AddDeviceModal from "../modal/AddFramemodal";
import DeviceSettingsModal from "../modal/DeviceSettingsModal";
import DeleteModal from "../modal/DeleteModal";

import { Frame } from "../types/Frame";

interface RouteParams {
  groupId?: string;
  groupName?: string;
  groupCount?: number;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;
}

interface GroupsResponse {
  data: Group[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface FramesResponse {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * --------------------------------
 * ONLINE STATUS
 * --------------------------------
 */
function isDeviceOnline(updatedAt?: string) {
  if (!updatedAt) return false;

  return (
    Date.now() -
      new Date(updatedAt).getTime() <
    86400000
  );
}

/**
 * --------------------------------
 * TIME AGO
 * --------------------------------
 */
function timeAgo(date?: string) {
  if (!date) return "Never";

  const diff =
    Date.now() -
    new Date(date).getTime();

  const hours = Math.floor(
    diff / 3600000
  );

  if (hours < 1) return "Just now";

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export default function FramesScreen({
  navigation,
  route,
}: any) {
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  const { width } = Dimensions.get("window");

  const iconSize = width * 0.05;

  /**
   * --------------------------------
   * GROUP PARAMS
   * --------------------------------
   */
  const params: RouteParams =
    route?.params || {};

  const selectedGroupId =
    params.groupId;

  const groupName =
    params.groupName;

  const groupCount =
    params.groupCount ?? 0;

  const [frames, setFrames] =
    useState<Frame[]>([]);

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [currentGroup, setCurrentGroup] =
    useState<Group | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [groupsLoading, setGroupsLoading] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [meta, setMeta] =
    useState<FramesResponse["meta"] | null>(
      null
    );

  const [showAddPopup, setShowAddPopup] =
    useState(false);

  const [selectedDevice, setSelectedDevice] =
    useState<Frame | null>(null);

  const [openSettingsModal, setOpenSettingsModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  /**
   * --------------------------------
   * FETCH GROUPS
   * --------------------------------
   */
  const fetchGroups = useCallback(async () => {
    try {
      setGroupsLoading(true);

      const res =
        await api.get<GroupsResponse>(
          "/frame-groups"
        );

      const groupData =
        res.data?.data ?? [];

      setGroups(groupData);

      if (selectedGroupId) {
        const found =
          groupData.find(
            (group) =>
              String(group.id) ===
              String(selectedGroupId)
          );

        setCurrentGroup(
          found ?? null
        );
      }
    } catch (error: any) {
      console.log(
        "Groups error:",
        error?.response?.data ||
          error
      );
    } finally {
      setGroupsLoading(false);
    }
  }, [selectedGroupId]);

  /**
   * --------------------------------
   * FETCH FRAMES
   * --------------------------------
   */
  const fetchFrames =
    useCallback(async () => {
      try {
        setLoading(true);

        let endpoint = "";

        if (selectedGroupId) {
          endpoint =
            `/frame-groups/${selectedGroupId}/frames?page=${page}`;
        } else {
          endpoint =
            `/frames?page=${page}`;
        }

        const res =
          await api.get(endpoint);

        /**
         * Your web API returns:
         *
         * {
         *   data: [],
         *   meta: {}
         * }
         *
         * But your old mobile code expected:
         *
         * []
         *
         * This handles BOTH.
         */
        const response =
          res.data;

        const data =
          Array.isArray(response)
            ? response
            : response?.data ?? [];

        const responseMeta =
          response?.meta ?? null;

        setMeta(responseMeta);

        const formatted =
          data.map((f: any) => ({
            id: f.id,
            name: f.name,
            timezone: f.timezone,
            isEnabled: f.isEnabled,
            updatedAt: f.updatedAt,

            previewImageUrl:
              f.CurrentPreviewImage
                ? `${f.CurrentPreviewImage}?t=${Date.now()}`
                : undefined,

            battery:
              f.telemetry?.battery
                ? Number(
                    f.telemetry.battery
                  )
                : 0,

            wifiSSID:
              f.telemetry?.wifiSSID ??
              "Unknown",

            signalStrength:
              f.telemetry?.rssi ?? 0,

            sleepConfig:
              f.sleepConfig ?? null,

            status:
              isDeviceOnline(
                f.updatedAt
              )
                ? "online"
                : "offline",

            modelNo:
              f.devices?.[0]?.modelNo,

            width:
              f.devices?.[0]
                ?.displayInfo
                ?.displayResolutionWidth,

            height:
              f.devices?.[0]
                ?.displayInfo
                ?.displayResolutionHeight,

            friendlyId:
              f.devices?.[0]
                ?.friendlyId,
          }));

        setFrames(formatted);
      } catch (error: any) {
        console.log(
          "Frames error:",
          error?.response?.data ||
            error
        );

        setFrames([]);
      } finally {
        setLoading(false);
      }
    }, [selectedGroupId, page]);

  /**
   * --------------------------------
   * INITIAL LOAD
   * --------------------------------
   */
  useEffect(() => {
    fetchFrames();
    fetchGroups();
  }, [fetchFrames, fetchGroups]);

  /**
   * --------------------------------
   * OPEN SETTINGS
   * --------------------------------
   */
  const openSettings = async (
    device: Frame
  ) => {
    try {
      const res =
        await api.get<Frame>(
          `/frames/${device.id}`
        );

      setSelectedDevice(res.data);
      setOpenSettingsModal(true);
    } catch (error: any) {
      console.log(
        "Settings error:",
        error?.response?.data ||
          error
      );
    }
  };

  /**
   * --------------------------------
   * DELETE DEVICE
   * --------------------------------
   */
  const deleteDevice = async (
    frameId: string
  ) => {
    try {
      await api.delete(
        `/frames/${frameId}`
      );

      setFrames((prev) =>
        prev.filter(
          (frame) =>
            frame.id !== frameId
        )
      );

      Alert.alert(
        "Success",
        "Device deleted successfully."
      );
    } catch (error: any) {
      console.log(
        "Delete device error:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to delete device."
      );
    }
  };

  /**
   * --------------------------------
   * MOVE DEVICE TO GROUP
   * --------------------------------
   */
  const moveDeviceToGroup = async (
    groupId: string,
    frameId: string
  ) => {
    try {
      await api.patch(
        `/frame-groups/${groupId}/frames/${frameId}`
      );

      /**
       * If viewing a specific group,
       * the device may disappear after
       * moving it.
       */
      await fetchFrames();

      Alert.alert(
        "Success",
        "Device moved successfully."
      );
    } catch (error: any) {
      console.log(
        "Move device error:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to move device."
      );
    }
  };

  /**
   * --------------------------------
   * DEVICE CARD
   * --------------------------------
   */
  const renderItem = ({
    item,
  }: {
    item: Frame;
  }) => {
    const online =
      item.status === "online";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="
          bg-white
          dark:bg-[#1a1a1a]
          border
          border-gray-200
          dark:border-gray-800
          rounded-2xl
          mb-4
          overflow-hidden
        "
        onPress={() =>
          navigation.navigate(
            "PlayList",
            {
              id: item.id,
              deviceName: item.name,
              modelNo: item.modelNo,
              width: item.width,
              height: item.height,
            }
          )
        }
      >
        {/* PREVIEW */}
        <View
          className="
            w-full
            bg-gray-200
            dark:bg-gray-800
            justify-center
            items-center
          "
          style={{
            aspectRatio: 5 / 3,
          }}
        >
          {item.previewImageUrl ? (
            <Image
              source={{
                uri: item.previewImageUrl,
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Monitor
              size={40}
              color={
                isDark
                  ? "white"
                  : "black"
              }
            />
          )}
        </View>

        {/* INFO */}
        <View className="p-4">
          <View className="flex-row justify-between">
            {/* DEVICE NAME */}
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="
                  text-lg
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                {item.name}
              </Text>

              {item.friendlyId && (
                <Text className="text-xs text-gray-400">
                  ({item.friendlyId})
                </Text>
              )}

              <Text className="text-xs text-gray-500 mt-1">
                Last seen:{" "}
                {timeAgo(
                  item.updatedAt
                )}
              </Text>
            </View>

            {/* BATTERY */}
            <View className="items-center ml-2">
              <Battery
                size={18}
                color={
                  isDark
                    ? "#D1D5DB"
                    : "#4B5563"
                }
              />

              <Text className="text-xs text-gray-500 mt-1">
                {item.battery}%
              </Text>
            </View>

            {/* WIFI */}
            <View className="items-center ml-3">
              <Wifi
                size={18}
                color={
                  isDark
                    ? "#D1D5DB"
                    : "#4B5563"
                }
              />

              <Text
                numberOfLines={1}
                className="
                  text-xs
                  text-gray-500
                  mt-1
                  max-w-[60px]
                "
              >
                {item.wifiSSID}
              </Text>
            </View>

            {/* SIGNAL */}
            <View className="items-center ml-3">
              <Signal
                size={18}
                color={
                  isDark
                    ? "#D1D5DB"
                    : "#4B5563"
                }
              />

              <Text className="text-xs text-gray-500 mt-1">
                {item.signalStrength}
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#9CA3AF"
            />
          </View>

          {/* BOTTOM */}
          <View
            className="
              flex-row
              justify-between
              items-center
              mt-4
              pt-3
              border-t
              border-gray-200
              dark:border-gray-800
            "
          >
            {/* ONLINE STATUS */}
            <View
              className={`
                px-3
                py-2
                rounded-full
                ${
                  online
                    ? "bg-green-100 dark:bg-green-900/40"
                    : "bg-gray-100 dark:bg-gray-800"
                }
              `}
            >
              <Text
                className={
                  online
                    ? "text-green-700 dark:text-green-400 text-xs font-medium"
                    : "text-gray-600 dark:text-gray-400 text-xs font-medium"
                }
              >
                {online
                  ? "Online"
                  : "Offline"}
              </Text>
            </View>

            {/* ACTIONS */}
            <View className="flex-row items-center">
              {/* MOVE TO GROUP */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();

                  Alert.alert(
                    "Move Device",
                    "Select a group",
                    [
                      ...groups
                        .filter(
                          (group) =>
                            group.id !==
                            selectedGroupId
                        )
                        .map((group) => ({
                          text: group.name,
                          onPress: () =>
                            moveDeviceToGroup(
                              group.id,
                              item.id
                            ),
                        })),
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                    ]
                  );
                }}
                className="
                  px-3
                  py-2
                  bg-blue-50
                  dark:bg-blue-900/30
                  rounded-lg
                  mr-2
                "
              >
                <View className="flex-row items-center">
                  <Folder
                    size={15}
                    color="#2563EB"
                  />

                  <Text className="text-blue-600 text-xs ml-1">
                    Move
                  </Text>
                </View>
              </TouchableOpacity>

              {/* SETTINGS */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  openSettings(item);
                }}
                className="p-2 mr-1"
              >
                <Settings
                  size={20}
                  color={
                    isDark
                      ? "white"
                      : "black"
                  }
                />
              </TouchableOpacity>

              {/* DELETE */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();

                  setSelectedId(
                    item.id
                  );

                  setShowDeleteModal(
                    true
                  );
                }}
                className="p-2"
              >
                <Trash2
                  size={20}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * --------------------------------
   * LOADING
   * --------------------------------
   */
  if (loading && frames.length === 0) {
    return (
      <AppLayout navigation={navigation}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text className="text-gray-500 mt-3">
            Loading devices...
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout navigation={navigation}>
      {/* HEADER */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="
                text-2xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              {groupName
                ? `${groupName} Frames`
                : "Devices"}
            </Text>

            <Text className="text-gray-500 text-sm mt-1">
              {groupName
                ? `Devices in ${groupName}`
                : "Manage your connected devices"}
            </Text>
          </View>

          {/* ADD DEVICE */}
          <Pressable
            onPress={() =>
              setShowAddPopup(true)
            }
            className="
              bg-blue-600
              rounded-xl
              px-4
              py-3
              flex-row
              items-center
            "
          >
            <Plus
              size={18}
              color="white"
            />

            <Text className="text-white font-semibold ml-1">
              Device
            </Text>
          </Pressable>
        </View>

        {/* CURRENT GROUP */}
        {selectedGroupId && (
          <View
            className="
              flex-row
              items-center
              mt-4
              bg-blue-50
              dark:bg-blue-900/20
              rounded-xl
              px-4
              py-3
            "
          >
            <Folder
              size={18}
              color="#2563EB"
            />

            <Text className="text-blue-600 font-medium ml-2 flex-1">
              {groupName ||
                currentGroup?.name ||
                "Selected Group"}
            </Text>

            <Text className="text-gray-500 text-xs">
              {currentGroup?.frameCount ??
                frames.length}{" "}
              devices
            </Text>
          </View>
        )}
      </View>

      {/* DEVICE LIST */}
      <FlatList
        data={frames}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.id
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={
          false
        }
        refreshing={loading}
        onRefresh={fetchFrames}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Monitor
              size={50}
              color="#9CA3AF"
            />

            <Text
              className="
                text-lg
                font-semibold
                text-gray-700
                dark:text-gray-300
                mt-4
              "
            >
              No devices yet
            </Text>

            <Text className="text-gray-500 mt-1">
              Add your first device.
            </Text>
          </View>
        }
      />

      {/* PAGINATION */}
      {meta && frames.length > 0 && (
        <View
          className="
            absolute
            bottom-5
            left-4
            right-4
            bg-white
            dark:bg-[#1a1a1a]
            border
            border-gray-200
            dark:border-gray-800
            rounded-xl
            p-3
            flex-row
            items-center
            justify-between
          "
        >
          <Pressable
            disabled={!meta.hasPrevious}
            onPress={() =>
              setPage((p) =>
                Math.max(1, p - 1)
              )
            }
            className="
              px-4
              py-2
              rounded-lg
              bg-gray-200
              dark:bg-gray-800
            "
          >
            <Text className="text-gray-700 dark:text-gray-300">
              Previous
            </Text>
          </Pressable>

          <Text className="text-gray-500">
            Page {meta.page} of{" "}
            {meta.totalPages}
          </Text>

          <Pressable
            disabled={!meta.hasNext}
            onPress={() =>
              setPage((p) => p + 1)
            }
            className={`
              px-4
              py-2
              rounded-lg
              ${
                meta.hasNext
                  ? "bg-blue-600"
                  : "bg-gray-100 dark:bg-gray-900"
              }
            `}
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

      {/* ADD DEVICE */}
      <AddDeviceModal
        visible={showAddPopup}
        onClose={() =>
          setShowAddPopup(false)
        }
        onAdded={fetchFrames}
        hideGroupSelect={true}
        groupId={selectedGroupId}
      />

      {/* SETTINGS */}
      {selectedDevice && (
        <DeviceSettingsModal
          visible={openSettingsModal}
          device={selectedDevice}
          onClose={() => {
            setOpenSettingsModal(false);
            setSelectedDevice(null);
          }}
          onSave={(updated: Frame) => {
            setFrames((prev) =>
              prev.map((frame) =>
                frame.id === updated.id
                  ? {
                      ...frame,
                      ...updated,
                    }
                  : frame
              )
            );

            setOpenSettingsModal(false);
          }}
        />
      )}

      {/* DELETE */}
      <DeleteModal
        visible={showDeleteModal}
        onCancel={() =>
          setShowDeleteModal(false)
        }
        onConfirm={async () => {
          if (selectedId) {
            await deleteDevice(
              selectedId
            );
          }

          setSelectedId(null);
          setShowDeleteModal(false);
        }}
      />
    </AppLayout>
  );
}