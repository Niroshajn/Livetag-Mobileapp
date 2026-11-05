import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Monitor,
  Wifi,
  WifiOff,
  Activity,
  Server,
  Users,
  UserPlus,
  ChevronRight,
} from "lucide-react-native";
import AppLayout from "./Layout";
import Text from "../components/AppText";
import api from "../lib/api";

interface Device {
  id: string;
  name: string;
  updatedAt: string;
  friendlyId?: string;
  status?: "online" | "offline";
  telemetry?: {
    battery?: string;
    rssi?: string;
    wifiSSID?: string;
  };
}

interface Plugin {
  pluginId: number;
  pluginName: string;
  pluginIsEnabled: boolean;
  pluginConfig: any[];
}

interface User {
  id: string;
  name: string;
  email?: string;
  roles?: (
    | string
    | {
        id?: string;
        name?: string;
        roleName?: string;
      }
  )[];
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pluginsLoading, setPluginsLoading] = useState(true);

  // Check device online status
// Check device online status (same logic as WEB)
const isDeviceOnline = (updatedAt?: string) => {
  if (!updatedAt) return false;

  const now = new Date();
  const lastUpdate = new Date(updatedAt);

  const diffMs = now.getTime() - lastUpdate.getTime();

  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours < 24;
};

  // Calculate time since last update
  const timeAgo = (date?: string) => {
    if (!date) return "Never";

    const diffMs = Date.now() - new Date(date).getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
      return "Unknown";
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";

    return "Good evening";
  };

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const [userResponse, deviceResponse, pluginResponse] =
        await Promise.allSettled([
          api.get("/auth/user/me"),
          api.get("/frames"),
          api.get("/plugin/me"),
        ]);

      // User
      if (userResponse.status === "fulfilled") {
        const responseData = userResponse.value.data;

        setUser(responseData?.data ?? responseData);
      }

      // Devices
      if (deviceResponse.status === "fulfilled") {
        const responseData = deviceResponse.value.data;

        const deviceList: Device[] =
          responseData?.data ?? responseData ?? [];

        const updatedDevices = deviceList.map((device) => ({
          ...device,
          status: isDeviceOnline(device.updatedAt)
            ? ("online" as const)
            : ("offline" as const),
        }));

        setDevices(updatedDevices);
      } else {
        setDevices([]);
      }

      // Plugins
      if (pluginResponse.status === "fulfilled") {
        const responseData = pluginResponse.value.data;

        setPlugins(responseData?.data ?? responseData ?? []);
      } else {
        setPlugins([]);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPluginsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Device counts
  const onlineDevices = devices.filter(
    (device) => device.status === "online"
  );

  const offlineDevices = devices.filter(
    (device) => device.status === "offline"
  );

  const totalDevices = devices.length;

  const isAdmin =
    Array.isArray(user?.roles) &&
    user.roles.some((role) => {
      const roleName =
        typeof role === "string"
          ? role
          : role?.name ?? role?.roleName;

      return (
        typeof roleName === "string" &&
        roleName.trim().toLowerCase() === "admin"
      );
    });

  // Reusable statistic card
  const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
  }: {
    title: string;
    value: string | number;
    icon: any;
    iconColor: string;
  }) => (
    <View className="w-[48%] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-md text-gray-500 dark:text-gray-400">
          {title}
        </Text>

        <Icon size={20} color={iconColor} />
      </View>

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
        {value}
      </Text>
    </View>
  );

  // Section heading
  const SectionHeader = ({
    title,
    onPress,
    actionText = "View all",
  }: {
    title: string;
    onPress?: () => void;
    actionText?: string;
  }) => (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </Text>

      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          className="flex-row items-center"
        >
          <Text className="text-md text-blue-600 dark:text-blue-400">
            {actionText}
          </Text>
          <ChevronRight size={16} color="#3b82f6" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Device card
  const DeviceItem = ({
    device,
    online,
  }: {
    device: Device;
    online: boolean;
  }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("Frame")}
      activeOpacity={0.8}
      className="flex-row items-center justify-between bg-white dark:bg-[#252525] rounded-lg p-3 mb-2"
    >
      <View className="flex-row items-center flex-1 mr-2">
        <View
          className={`w-2.5 h-2.5 rounded-full mr-3 ${
            online ? "bg-green-500" : "bg-gray-400"
          }`}
        />

        <View className="flex-1">
          <Text
            className="text-md font-medium text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {device.name}
          </Text>

          <Text className="text-md text-gray-500 dark:text-gray-400 mt-1">
            Last seen: {timeAgo(device.updatedAt)}
          </Text>

          {device.friendlyId && (
            <Text className="text-md text-gray-500 dark:text-gray-400 mt-1">
              {device.friendlyId}
            </Text>
          )}
        </View>
      </View>

      <View
        className={`px-2.5 py-1 rounded-full ${
          online
            ? "bg-green-100 dark:bg-green-950"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <Text
          className={`text-md font-medium ${
            online
              ? "text-green-700 dark:text-green-400"
              : "text-gray-600 dark:text-gray-300"
          }`}
        >
          {online ? "Online" : "Offline"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />

        <Text className="text-gray-500 dark:text-gray-400 mt-3">
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingTop: 16,
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
        >
          {/* HEADER */}

          <View className="flex-row items-start justify-between mb-6">
            <View className="flex-1 pr-2">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {getGreeting()},
              </Text>

              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || "User"}
              </Text>

              <Text className="text-md text-gray-500 dark:text-gray-400 mt-1">
                Here's an overview of your LIVETAG system
              </Text>
            </View>

            {/* ADMIN BUTTONS */}

            {isAdmin && (
              <View className="flex-row items-center gap-1 mt-7">
                <TouchableOpacity
                  onPress={() => navigation.navigate("CreateUser")}
                  activeOpacity={0.7}
                  className="border border-blue-500 rounded-lg px-2 py-2"
                >
                  <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Add User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("UserManagement")}
                  activeOpacity={0.7}
                  className="border border-blue-500 rounded-lg px-2 py-2"
                >
                  <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Users
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* STATISTICS */}

          <View className="gap-3">
            {/* TOTAL DEVICES */}

            <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Total Devices
                </Text>
                <Monitor size={17} color="#6b7280" />
              </View>

              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {totalDevices}
              </Text>
            </View>

            {/* ONLINE DEVICES */}

            <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Online Devices
                </Text>
                <Wifi size={17} color="#6b7280" />
              </View>

              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {onlineDevices.length}
              </Text>
            </View>

            {/* OFFLINE DEVICES */}

            <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Offline Devices
                </Text>
                <WifiOff size={17} color="#6b7280" />
              </View>

              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {offlineDevices.length}
              </Text>
            </View>

            {/* SYSTEM STATUS */}

            <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  System Status
                </Text>
                <Activity size={17} color="#6b7280" />
              </View>

              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                Active
              </Text>
            </View>
          </View>

          {/* DEVICE STATUS */}

          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 mt-4">
            <SectionHeader
              title="Device Status"
              onPress={() => navigation.navigate("Frame")}
            />

            {devices.length === 0 ? (
              <View className="items-center py-6">
                <Monitor size={38} color="#9ca3af" />

                <Text className="text-md text-gray-500 dark:text-gray-400 mt-3">
                  No devices registered yet
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Frame")}
                  className="mt-3"
                >
                  <Text className="text-md text-blue-600 dark:text-blue-400">
                    Add your first device
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* ONLINE DEVICES */}

                {onlineDevices.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-md text-gray-500 dark:text-gray-400 mb-2">
                      Online
                    </Text>

                    {onlineDevices.map((device) => (
                      <DeviceItem
                        key={device.id}
                        device={device}
                        online={true}
                      />
                    ))}
                  </View>
                )}

                {/* OFFLINE DEVICES */}

                {offlineDevices.length > 0 && (
                  <View>
                    <Text className="text-md text-gray-500 dark:text-gray-400 mb-2">
                      Offline
                    </Text>

                    {offlineDevices.slice(0, 5).map((device) => (
                      <DeviceItem
                        key={device.id}
                        device={device}
                        online={false}
                      />
                    ))}

                    {offlineDevices.length > 5 && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Frame")}
                        className="py-3"
                      >
                        <Text className="text-center text-md text-blue-600 dark:text-blue-400">
                          +{offlineDevices.length - 5} more devices
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* SYSTEM INFORMATION */}

          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-4">
            <View className="flex-row items-center mb-4">
              <Server size={19} color="#9ca3af" />

              <Text className="text-base font-semibold text-gray-900 dark:text-white ml-3">
                System Information
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-md text-gray-500 dark:text-gray-400">
                Host URL
              </Text>

              <Text className="text-sm text-gray-900 dark:text-white mt-1">
                {api.defaults.baseURL || "Not configured"}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Total Devices
                </Text>

                <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {totalDevices}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Online
                </Text>

                <Text className="text-lg font-semibold text-green-600 dark:text-green-500 mt-1">
                  {onlineDevices.length}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Offline
                </Text>

                <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-1">
                  {offlineDevices.length}
                </Text>
              </View>
            </View>
          </View>

          {/* MY APPS */}

          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-4 mb-4">
            <SectionHeader
              title="My Apps"
              onPress={() => navigation.navigate("Apps")}
            />

            {pluginsLoading ? (
              <ActivityIndicator color="#6366f1" />
            ) : plugins.length === 0 ? (
              <Text className="text-md text-gray-500 dark:text-gray-400 py-3">
                No apps installed.
              </Text>
            ) : (
              plugins.map((plugin) => (
                <TouchableOpacity
                  key={plugin.pluginId}
                  onPress={() =>
                    navigation.navigate("PreviewPage", {
                      pluginId: plugin.pluginId,
                      pluginName: plugin.pluginName,
                    })
                  }
                  activeOpacity={0.8}
                  className="flex-row items-center justify-between bg-gray-100 dark:bg-[#252525] rounded-lg p-3 mb-2"
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-md font-medium text-gray-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {plugin.pluginName}
                    </Text>
                  </View>

                  <Text
                    className={`text-md ${
                      plugin.pluginIsEnabled
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {plugin.pluginIsEnabled ? "Enabled" : "Disabled"}
                  </Text>

                  <ChevronRight
                    size={17}
                    color="#9ca3af"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </AppLayout>
  );
}