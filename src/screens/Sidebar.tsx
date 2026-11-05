
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  DeviceEventEmitter,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import {
  LayoutDashboard,
  Monitor,
  Puzzle,
  User,
  LogOut,
  X,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react-native";

import Text from "../components/AppText";
import { useTheme } from "../context/ThemeContext";
import LogoutModal from "../modal/Logout";
import apiClient from "../lib/api";

/* ================= TYPES ================= */

type Props = {
  closeSidebar: () => void;
};

interface FrameGroup {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;
}

interface FrameGroupsResponse {
  data: FrameGroup[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

type MenuItem = {
  name: string;
  route: string;
  icon: React.ComponentType<any>;
  params?: Record<string, any>;
};

/* ================= SIDEBAR ================= */

export default function Sidebar({ closeSidebar }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();

  const iconSize = Math.max(20, Math.min(width * 0.055, 26));

  const [showLogout, setShowLogout] = useState(false);

  const [groupCount, setGroupCount] = useState<number | null>(null);

  const [defaultGroup, setDefaultGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const isDark = theme === "dark";
  const iconColor = "#6B7280";

  /* ================= FETCH GROUPS ================= */

  const fetchGroups = useCallback(async () => {
    try {
      const res = await apiClient.get<FrameGroupsResponse>(
        "/frame-groups?page=1"
      );

      const groups = res.data?.data ?? [];
      const totalGroups = res.data?.meta?.total ?? groups.length;

      setGroupCount(totalGroups);

      console.log("Mobile Sidebar groups:", groups);
      console.log("Mobile Sidebar total groups:", totalGroups);

      // Exactly one system-default group.
      if (
        totalGroups === 1 &&
        groups.length === 1 &&
        groups[0].isSystemDefault === true
      ) {
        setDefaultGroup({
          id: groups[0].id,
          name: groups[0].name,
        });

        console.log("Only Default Group exists:", groups[0]);
      } else {
        setDefaultGroup(null);

        console.log("Groups menu will be displayed");
      }
    } catch (error: any) {
      console.error(
        "Failed to fetch groups:",
        error?.response?.data || error
      );

      setGroupCount(0);
      setDefaultGroup(null);
    }
  }, []);

 
  useEffect(() => {
    // Fetch only when Sidebar mounts.
    fetchGroups();

    // Listen for group create/delete/update events.
    const subscription = DeviceEventEmitter.addListener(
      "groupsUpdated",
      () => {
        console.log("Groups changed → refreshing mobile sidebar");

        fetchGroups();
      }
    );

    return () => {
      subscription.remove();
    };
  }, [fetchGroups]);


  const navigateTo = (
    screen: string,
    params?: Record<string, any>
  ) => {
    closeSidebar();

    if (params) {
      navigation.navigate(screen, params);
    } else {
      navigation.navigate(screen);
    }
  };

  /* ================= MENU ITEMS ================= */

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      route: "Dashboard",
    },

    ...(groupCount === null
      ? []
      : groupCount === 0
        ? []
        : defaultGroup
          ? [
              {
                name: "Devices",
                icon: Monitor,
                route: "Frame",
                params: {
                  groupId: defaultGroup.id,
                  groupName: defaultGroup.name,
                  groupCount: 1,
                },
              },
            ]
          : [
              {
                name: "Groups",
                icon: User,
                route: "Groups",
              },
            ]),

    {
      name: "Apps",
      icon: Puzzle,
      route: "Apps",
    },

    // Developer is intentionally hidden on mobile for all roles.

    {
      name: "Account",
      icon: User,
      route: "Account",
    },
  ];

  /* ================= ACTIVE ROUTE ================= */

  const isActiveRoute = (item: MenuItem) => {
    return route.name === item.route;
  };

  /* ================= UI ================= */

  return (
    <View
      className="flex-1 bg-white dark:bg-[#090909]"
      style={{ width: 240 }}
    >
      {/* HEADER */}

      <View className="mt-8 flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-6 items-center justify-center border border-blue-300 bg-gray-50 dark:bg-black">
            <Text className="text-xs text-gray-700 dark:text-gray-300">
              #
            </Text>
          </View>

          <Text className="text-xl font-semibold text-gray-900 dark:text-white">
            LIVETAG
          </Text>
        </View>

        <TouchableOpacity
          onPress={closeSidebar}
          accessibilityRole="button"
          accessibilityLabel="Close navigation menu"
          hitSlop={8}
        >
          <X size={iconSize} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* NAVIGATION */}

      <ScrollView
        className="mt-4 flex-1"
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item);

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => navigateTo(item.route, item.params)}
              activeOpacity={0.7}
              className={`mx-2 mb-1 flex-row items-center gap-3 rounded-xl px-3 py-3 ${
                isActive
                  ? "bg-gray-200 dark:bg-[#1F2937]"
                  : "bg-transparent"
              }`}
            >
              <Icon size={iconSize} color={iconColor} />

              <Text
                className={`text-base ${
                  isActive
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* HELP */}

        <TouchableOpacity
          onPress={() => navigateTo("Help")}
          activeOpacity={0.7}
          className={`mx-2 mb-1 flex-row items-center gap-3 rounded-xl px-3 py-3 ${
            route.name === "Help"
              ? "bg-gray-200 dark:bg-[#1F2937]"
              : "bg-transparent"
          }`}
        >
          <HelpCircle size={iconSize} color={iconColor} />

          <Text
            className={`text-base ${
              route.name === "Help"
                ? "font-semibold text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Help
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}

      <View className="border-t border-gray-200 p-4 dark:border-gray-800">
        {/* THEME */}

        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          className="flex-row items-center gap-3 py-3"
        >
          {isDark ? (
            <Sun size={iconSize} color={iconColor} />
          ) : (
            <Moon size={iconSize} color={iconColor} />
          )}

          <Text className="text-base text-gray-600 dark:text-gray-400">
            {isDark ? "Light Mode" : "Dark Mode"}
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}

        <TouchableOpacity
          onPress={() => setShowLogout(true)}
          activeOpacity={0.7}
          className="flex-row items-center gap-3 py-3"
        >
          <LogOut size={iconSize} color={iconColor} />

          <Text className="text-base text-gray-600 dark:text-gray-400">
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT MODAL */}

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </View>
  );
}
