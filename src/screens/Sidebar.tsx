import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
import { useTheme } from "../context/ThemeContext";
import LogoutModal from "../modal/Logout";
import { Dimensions } from "react-native";
type Props = {
  closeSidebar: () => void;
};

export default function Sidebar({ closeSidebar }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
const [showLogout, setShowLogout] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, route: "Dashboard" },
    { name: "Devices", icon: Monitor, route: "Frame" },
    { name: "Apps", icon: Puzzle, route: "Apps" },
    { name: "Account", icon: User, route: "Account" },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 mt-8 border-b border-gray-800">
        <View className="flex-row items-center gap-2">
          <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
            <Text className="text-xs text-gray-800 dark:text-gray-100">#</Text>
          </View>
          <Text className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            LIVETAG
          </Text>
        </View>

        <TouchableOpacity onPress={closeSidebar}>
          <X size={iconSize} color={theme === "dark" ? "white" : "black"} />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <ScrollView className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = route.name === item.route;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => {
                navigation.navigate(item.route);
                closeSidebar();
              }}
              className={`flex-row items-center gap-3 py-3 px-3 mx-2 rounded-lg ${isActive ? "bg-gray-300" : ""
                }`}
            >
              <Icon
                size={iconSize}
               color={theme === "dark" ? "white" : "gray"} 
              />
              <Text
                className={`text-md ${isActive
                    ? "text-white"
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
          onPress={() => {
            navigation.navigate("Help");
            closeSidebar();
          }}
          className="flex-row items-center gap-3 py-3 px-3 mx-2 rounded-lg"
        >
          <HelpCircle size={iconSize} color={theme === "dark" ? "white" : "gray"} />
          <Text className="text-gray-800 dark:text-gray-100">Help</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}
      <View className="border-t border-gray-800 p-4">

        {/* THEME TOGGLE */}
        <TouchableOpacity
          onPress={toggleTheme}
          className="flex-row items-center gap-3 py-3"
        >
          {theme === "dark" ? (
            <Sun size={iconSize} color="white" />
          ) : (
            <Moon size={iconSize} color="gray" />
          )}

          <Text className="text-gray-800 dark:text-gray-100">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={() => setShowLogout(true)}
          className="flex-row items-center gap-3 py-3"
        >
          <LogOut size={iconSize} color={theme === "dark" ? "white" : "gray"} />
          <Text className="text-gray-800 dark:text-gray-100">
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