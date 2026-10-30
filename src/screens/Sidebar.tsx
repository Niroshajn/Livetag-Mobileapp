import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
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

type Props = {
  closeSidebar: () => void;
};

export default function Sidebar({ closeSidebar }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [showLogout, setShowLogout] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const iconSize = Math.max(20, Math.min(width * 0.055, 26));

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, route: "Dashboard" },
    { name: "Devices", icon: Monitor, route: "Frame" },
    { name: "Apps", icon: Puzzle, route: "Apps" },
    { name: "Account", icon: User, route: "Account" },
  ];

  const navigateTo = (screen: string) => {
    closeSidebar();
    navigation.navigate(screen);
  };

return (
  <View
    className="flex-1 bg-white dark:bg-black"
    style={{ width: 240 }}
  >
      <View className="mt-8 flex-row items-center justify-between border-b border-gray-300 px-4 py-3 dark:border-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
            <Text className="text-xs text-gray-800 dark:text-gray-100">
              #
            </Text>
          </View>

          <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            LIVETAG
          </Text>
        </View>

        <TouchableOpacity
          onPress={closeSidebar}
          accessibilityRole="button"
          accessibilityLabel="Close navigation menu"
          hitSlop={8}
        >
          <X
            size={iconSize}
            color={theme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
      </View>

      {/* MENU ITEMS */}
      <ScrollView
        className="mt-4 flex-1"
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = route.name === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => navigateTo(item.route)}
              activeOpacity={0.7}
              className={`mx-3 mb-1 flex-row items-center gap-3 rounded-xl px-3 py-2 ${
                isActive ? "bg-gray-300 dark:bg-gray-700" : ""
              }`}
            >
              <Icon
                size={iconSize}
                color={
                  theme === "dark"
                    ? "#FFFFFF"
                    : isActive
                      ? "#374151"
                      : "#6B7280"
                }
              />

              <Text
                className={`text-base ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-800 dark:text-gray-100"
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
          className="mx-3 mb-1 flex-row items-center gap-3 rounded-xl px-3 py-4"
        >
          <HelpCircle
            size={iconSize}
            color={theme === "dark" ? "#FFFFFF" : "#6B7280"}
          />

          <Text className="text-base text-gray-800 dark:text-gray-100">
            Help
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}
      <View className="border-t border-gray-300 p-4 dark:border-gray-800">
        {/* THEME */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          className="flex-row items-center gap-3 py-3"
        >
          {theme === "dark" ? (
            <Sun size={iconSize} color="#FFFFFF" />
          ) : (
            <Moon size={iconSize} color="#6B7280" />
          )}

          <Text className="text-base text-gray-800 dark:text-gray-100">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={() => setShowLogout(true)}
          activeOpacity={0.7}
          className="flex-row items-center gap-3 py-3"
        >
          <LogOut
            size={iconSize}
            color={theme === "dark" ? "#FFFFFF" : "#6B7280"}
          />

          <Text className="text-base text-gray-800 dark:text-gray-100">
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </View>
  );
}
