import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Monitor,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react-native";

import Text from "../components/AppText";
import api from "../lib/api";
import AppLayout from "./Layout";

/* ================= TYPES ================= */

type Device = {
  id: string | number;
  name: string;
  updatedAt?: string;
  friendlyId?: string;
  status?: "online" | "offline";
  telemetry?: {
    battery?: string;
    rssi?: string;
    wifiSSID?: string;
  };
};

type Plugin = {
  pluginId: number;
  pluginName: string;
  pluginIsEnabled: boolean;
  pluginConfig?: any[];
};

type User = {
  name: string;
};

function extractArray<T>(
  response: any,
  alternateKey: string
): T[] {
  const body = response?.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.[alternateKey])) {
    return body[alternateKey];
  }
  return [];
}

// Same calculation as the web dashboard.
function isDeviceOnline(updatedAt?: string): boolean {
  if (!updatedAt) {
    return false;
  }

  const now = new Date();
  const lastUpdate = new Date(updatedAt);
  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 24;
}

// Same last-seen calculation as the web dashboard.
function timeAgo(date?: string): string {
  if (!date) {
    return "Never";
  }
  const diffMs = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(diffMs)) {
    return "Never";
  }
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    return "Just now";
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

/* ================= COMPONENT ================= */

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const iconSize = Math.max(20, Math.min(width * 0.05, 26));

  const [devices, setDevices] = useState<Device[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User>({
    name: "",
  });

  /* ================= API ================= */

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      try {
        const [deviceResult, pluginResult, userResult] =
          await Promise.allSettled([
            api.get("/frames"),
            api.get("/plugin/me"),
            api.get("/auth/user/me"),
          ]);

        if (!mounted) {
          return;
        }

        // DEVICES
        if (deviceResult.status === "fulfilled") {
          const deviceData = extractArray<Device>(
            deviceResult.value,
            "frames"
          );

          const updatedDevices = deviceData.map((device) => ({
            ...device,
            status: isDeviceOnline(device.updatedAt)
              ? ("online" as const)
              : ("offline" as const),
          }));

          setDevices(updatedDevices);
        } else {
          console.error(
            "Failed to fetch devices:",
            deviceResult.reason
          );
          setDevices([]);
        }

        // PLUGINS
        if (pluginResult.status === "fulfilled") {
          const pluginData = extractArray<Plugin>(
            pluginResult.value,
            "plugins"
          );

          setPlugins(pluginData);
        } else {
          console.error(
            "Failed to fetch plugins:",
            pluginResult.reason
          );
          setPlugins([]);
        }

        // USER
        if (userResult.status === "fulfilled") {
          const responseData = userResult.value.data;

          const userData =
            responseData?.userDetail ?? responseData?.data?.userDetail ?? responseData?.data ?? responseData;

          setUser({
            name: userData?.name ?? "",
          });
        } else {
          console.error(
            "Failed to fetch user:",
            userResult.reason
          );
          setUser({ name: "" });
        }
      } catch (error) {
        console.error("Dashboard API error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= DEVICE STATUS ================= */

  const onlineDevices = devices.filter(
    (device) => device.status === "online"
  );

  const offlineDevices = devices.filter(
    (device) => device.status === "offline"
  );

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center bg-white dark:bg-[#1a1a1a]">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </Text>
        </View>
      </AppLayout>
    );
  }

  /* ================= UI ================= */

  return (
    <AppLayout>
      <ScrollView
        className="flex-1 bg-white px-4 pt-6 dark:bg-[#1a1a1a]"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <Text className="text-lg font-semibold text-black dark:text-white">
          {getGreeting()}, {user.name || "User"}
        </Text>

        <Text className="mb-5 text-sm text-gray-600 dark:text-gray-400">
          Here's an overview of your LIVETAG system
        </Text>

        {/* ================= STAT CARDS ================= */}

        <View className="gap-3">
          {/* TOTAL DEVICES */}

          <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Total Devices
              </Text>

              <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                {devices.length}
              </Text>
            </View>

            <Monitor size={iconSize} color="#9CA3AF" />
          </View>

          {/* ONLINE DEVICES */}

          <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Online Devices
              </Text>

              <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                {onlineDevices.length}
              </Text>
            </View>

            <Wifi size={iconSize} color="#9CA3AF" />
          </View>

          {/* OFFLINE DEVICES */}

          <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Offline Devices
              </Text>

              <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                {offlineDevices.length}
              </Text>
            </View>

            <WifiOff size={iconSize} color="#9CA3AF" />
          </View>

          {/* SYSTEM STATUS */}

          <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                System Status
              </Text>

              <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                Active
              </Text>
            </View>

            <Activity size={iconSize} color="#9CA3AF" />
          </View>
        </View>

        {/* ================= DEVICE STATUS ================= */}

        <View className="mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              Device Status
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Frame")}
              activeOpacity={0.7}
            >
              <Text className="text-sm text-blue-500">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {/* EMPTY DEVICES */}

          {devices.length === 0 ? (
            <View className="items-center py-6">
              <Monitor
                size={40}
                color="#9CA3AF"
              />

              <Text className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                No devices registered yet
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate("Frame")}
                className="mt-3"
                activeOpacity={0.7}
              >
                <Text className="text-sm text-blue-500">
                  Add your first device
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ONLINE LIST */}

              {onlineDevices.length > 0 && (
                <View className="mb-3">
                  <Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    Online
                  </Text>

                  {onlineDevices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      onPress={() => navigation.navigate("Frame")}
                      activeOpacity={0.7}
                      className="mb-2 flex-row items-center justify-between rounded-lg bg-gray-100 px-3 py-3 dark:bg-[#252525]"
                    >
                      <View className="mr-2 flex-1 flex-row items-center gap-3">
                        <View className="h-2 w-2 rounded-full bg-green-500" />

                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-sm text-gray-900 dark:text-white"
                          >
                            {device.name}
                          </Text>

                          <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Last seen: {timeAgo(device.updatedAt)}
                          </Text>

                          {!!device.friendlyId && (
                            <Text className="mt-1 text-xs text-gray-500">
                              {device.friendlyId}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="rounded-md bg-green-100 px-2 py-1 dark:bg-green-900">
                        <Text className="text-xs text-green-700 dark:text-green-300">
                          Online
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* OFFLINE LIST */}

              {offlineDevices.length > 0 && (
                <View>
                  <Text className="mb-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Offline
                  </Text>

                  {offlineDevices.slice(0, 5).map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      onPress={() => navigation.navigate("Frame")}
                      activeOpacity={0.7}
                      className="mb-2 flex-row items-center justify-between rounded-lg bg-gray-100 px-3 py-3 dark:bg-[#252525]"
                    >
                      <View className="mr-2 flex-1 flex-row items-center gap-3">
                        <View className="h-2 w-2 rounded-full bg-gray-400" />

                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-sm text-gray-900 dark:text-white"
                          >
                            {device.name}
                          </Text>

                          {!!device.friendlyId && (
                            <Text className="mt-1 text-xs text-gray-500">
                              {device.friendlyId}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="rounded-md bg-gray-200 px-2 py-1 dark:bg-gray-700">
                        <Text className="text-xs text-gray-700 dark:text-gray-200">
                          Offline
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {offlineDevices.length > 5 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Frame")}
                      activeOpacity={0.7}
                    >
                      <Text className="mt-2 text-center text-sm text-blue-500">
                        +{offlineDevices.length - 5} more devices
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* ================= MY APPS ================= */}

        <View className="mb-8 mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <Text className="mb-4 text-base font-medium text-gray-900 dark:text-white">
            My Apps
          </Text>

          {plugins.length === 0 ? (
            <View className="py-3">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                No apps installed.
              </Text>
            </View>
          ) : (
            plugins.map((plugin) => (
              <TouchableOpacity
                key={plugin.pluginId}
                onPress={() =>
                  navigation.navigate("Apps")
                }
                activeOpacity={0.7}
                className="mb-2 flex-row items-center justify-between rounded-lg bg-gray-100 px-3 py-3 dark:bg-[#252525]"
              >
                <Text
                  numberOfLines={1}
                  className="mr-3 flex-1 text-sm text-gray-900 dark:text-white"
                >
                  {plugin.pluginName}
                </Text>

                <Text
                  className={`text-xs ${
                    plugin.pluginIsEnabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {plugin.pluginIsEnabled ? "Enabled" : "Disabled"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </AppLayout>
  );
}
