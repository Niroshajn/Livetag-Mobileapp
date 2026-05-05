import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Monitor,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react-native";
import api from "../lib/api";
import AppLayout from "./Layout";
import { Dimensions } from "react-native";
/* ================= TYPES ================= */

type Device = {
  id: string | number;
  name: string;
  friendlyId?: string;
  updatedAt?: string;
  sleepConfig?: {
    updatedAt?: string;
  };
};

type Plugin = {
  pluginId: number;
  pluginName: string;
  pluginIsEnabled: boolean;
};

/* ================= COMPONENT ================= */

export default function DashboardScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    name: "",
  });
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  /* ================= HELPERS ================= */

  const isOnline = (date?: string) => {
    if (!date) return false;
    const diff =
      (Date.now() - new Date(date).getTime()) /
      (1000 * 60 * 60);
    return diff < 24;
  };

  const timeAgo = (date?: string) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  /* ================= API ================= */

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const deviceRes = await api.get("/frames");
        const pluginRes = await api.get("/plugin/me");
        const userRes = await api.get("/auth/user/me");
        const userData = userRes.data?.userDetail ?? userRes.data;
        setUser({
          name: userData.name,
        });
        console.log("DEVICE API:", deviceRes.data);
        console.log("PLUGIN API:", pluginRes.data);
        const deviceData = Array.isArray(deviceRes.data)
          ? deviceRes.data
          : deviceRes.data?.frames ?? [];
        const pluginData = Array.isArray(pluginRes.data)
          ? pluginRes.data
          : pluginRes.data?.plugins ?? [];
        setDevices(deviceData);
        setPlugins(pluginData);
      } catch (e: any) {
        console.log("API ERROR:", e);
        console.log("STATUS:", e.response?.status);
        console.log("ERROR DATA:", e.response?.data);
        setDevices([]);   // fallback
        setPlugins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);
  const online = devices.filter((d) => isOnline(d.sleepConfig?.updatedAt));
  const offline = devices.filter((d) => !isOnline(d.sleepConfig?.updatedAt));

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-black justify-center items-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <AppLayout>
      <ScrollView className="flex-1 bg-white dark:bg-[#1a1a1a] px-4 pt-6">

        {/* HEADER */}
        <Text className="text-black dark:text-white text-lg font-semibold">
           {getGreeting()}, {user.name || "User"}
        </Text>
        <Text className="text-gray-800 dark:text-gray-400 text-sm mb-5">
          Here's an overview of your LIVETAG system
        </Text>

        {/* ================= STATS ================= */}

        <View className="space-y-4">

          {/* Total */}
          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 flex-row justify-between items-center">
            <View>
              <Text className="text-gray-800 dark:text-gray-400 text-sm">
                Total Devices
              </Text>
              <Text className="text-gray-800 dark:text-gray-400 text-2xl font-semibold">
                {devices.length}
              </Text>
            </View>
            <Monitor color="#9CA3AF" size={iconSize} />
          </View>

          {/* Online */}
          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-gray-900 dark:text-white text-sm">
                Online Devices
              </Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-semibold">
                {online.length}
              </Text>
            </View>
            <Wifi color="#9CA3AF" size={iconSize} />
          </View>

          {/* Offline */}
          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-gray-900 dark:text-white text-sm">
                Offline Devices
              </Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-semibold">
                {offline.length}
              </Text>
            </View>
            <WifiOff color="#9CA3AF" size={18} />
          </View>

          {/* System */}
          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-gray-900 dark:text-white text-sm">
                System Status
              </Text>
              <Text className="text-gray-800 dark:text-gray-400 text-2xl font-semibold">
                Active
              </Text>
            </View>
            <Activity color="#9CA3AF" size={18} />
          </View>
        </View>

        {/* ================= DEVICE STATUS ================= */}

        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl p-4 mt-5">

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-900 dark:text-white text-base font-medium">
              Device Status
            </Text>
            <Text className="text-blue-400 text-sm">
              View all
            </Text>
          </View>

          {/* ONLINE */}
          {online.length > 0 && (
            <>
              <Text className="text-gray-900 dark:text-white text-sm mb-2">
                Online
              </Text>

              {online.map((d) => (
                <View
                  key={d.id}
                  className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded px-3 py-3 mb-2 flex-row justify-between items-center"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                    <View>
                      <Text className="text-gray-900 dark:text-white text-sm">
                        {d.name}
                      </Text>
                      <Text className="text-gray-900 dark:text-white text-xs">
                        Last seen: {timeAgo(d.sleepConfig?.updatedAt)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-green-900 px-3 py-1 rounded">
                    <Text className="text-green-400 text-xs">
                      ● Online
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* OFFLINE */}
          {offline.length > 0 && (
            <>
              <Text className="text-gray-900 dark:text-white text-sm mt-3 mb-2">
                Offline
              </Text>

              {offline.map((d) => (
                <View
                  key={d.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded px-3 py-3 mb-2 flex-row justify-between items-center"
                >
                  <Text className="text-gray-900 dark:text-white text-sm">
                    {d.name}
                  </Text>

                  <View className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded">
                    <Text className="text-black dark:text-white text-xs">
                      Offline
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ================= PLUGINS ================= */}

        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl p-4 mt-5 mb-10">
          <Text className="text-gray-900 dark:text-white text-base font-medium mb-3">
            My Apps
          </Text>

          {plugins.length === 0 ? (
            <Text className="text-gray-900 dark:text-white text-sm">
              No apps installed.
            </Text>
          ) : (
            plugins.map((p) => (
              <View
                key={p.pluginId}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 px-3 py-3 rounded mb-2 flex-row justify-between"
              >
                <Text className="text-gray-900 dark:text-white text-sm">
                  {p.pluginName}
                </Text>
                <Text className="text-gray-900 dark:text-white text-xs">
                  {p.pluginIsEnabled ? "Enabled" : "Disabled"}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </AppLayout>
  );
}