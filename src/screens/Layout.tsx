import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Menu } from "lucide-react-native";
import Sidebar from "./Sidebar";
import { useColorScheme } from "nativewind"; 
export default function AppLayout({ children }: any) {
  const [open, setOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-1 bg-gray-100 dark:bg-[#1a1a1a] ">

      {/* HEADER (fixed menu icon for all screens) */}
      <View className="h-14 px-4 pt-7 flex-row items-center justify-between bg-white dark:bg-[#1a1a1a] ">
        <TouchableOpacity onPress={() => setOpen(true)}>
          <Menu size={26}  color={colorScheme === "dark" ? "white" : "black"} />
        </TouchableOpacity>

      </View>

      {/* SCREEN CONTENT */}
      <View className="flex-1">
        {children}
      </View>

      {/* OVERLAY */}
      {open && (
        <TouchableOpacity
          onPress={() => setOpen(false)}
          className="absolute inset-0 bg-black/50"
        />
      )}

      {/* SIDEBAR */}
      {open && (
        <View className="absolute left-0 top-0 bottom-0 w-[50%] z-50 bg-white dark:bg-[#1a1a1a]">
          <Sidebar closeSidebar={() => setOpen(false)} />
        </View>
      )}
    </View>
  );
}