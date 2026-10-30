
import React, { useState } from "react";
import {
  View,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Menu } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./Sidebar";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();

const sidebarWidth = Math.min(width * 0.65, 250);
  const iconSize = Math.max(20, Math.min(width * 0.055, 26));

  return (
    <View className="flex-1 bg-gray-100 dark:bg-[#1a1a1a]">
      {/* HEADER */}
      <SafeAreaView
        edges={["top"]}
        className="bg-white dark:bg-[#1a1a1a]"
      >
        <View className="flex-row items-center px-4 pb-3">
          <TouchableOpacity
            onPress={() => setOpen(true)}
            disabled={open}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            hitSlop={10}
          >
            <Menu
              size={iconSize}
              color={
                colorScheme === "dark" ? "#FFFFFF" : "#111827"
              }
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* SCREEN CONTENT */}
      <View
        className="flex-1"
        style={{
          zIndex: 0,
          elevation: 0,
        }}
      >
        {children}
      </View>

      {/* OVERLAY: ABOVE ALL SCREEN CONTENT */}
      {open && (
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close navigation menu"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 10,
            elevation: 10,
          }}
        />
      )}

      {/* SIDEBAR: ABOVE THE OVERLAY */}
      {open && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: sidebarWidth,
            zIndex: 20,
            elevation: 20,
            backgroundColor:
              colorScheme === "dark" ? "#000000" : "#FFFFFF",
          }}
        >
          <Sidebar closeSidebar={() => setOpen(false)} />
        </View>
      )}
    </View>
  );
}
