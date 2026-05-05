import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Clock, Zap, X, ToggleRight } from "lucide-react-native";
import type { Plugin } from "./SelectPluginModal";
import apiClient from "../lib/api";
import { ChevronUp } from "lucide-react-native";
import { ChevronDown } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dimensions } from "react-native";

interface PlaylistItem {
  id: string;
  pluginId: string;
  startTime: string;
  endTime: string;
  priority: number;
  refreshSeconds: number;
  isEnabled: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pluginName: string;
  selectedItem: PlaylistItem | null;
  plugin: Plugin;
  onSaved?: () => void;
  frameId: string; // ✅ ADD frameId to props
}

export default function PlaylistItemModal({
  open,
  onClose,
  pluginName,
  plugin,
  selectedItem,
  frameId,
  onSaved,
}: Props) {
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:45");
  const [priority, setPriority] = useState("1");
  const [refreshSeconds, setRefreshSeconds] = useState(3600); // ✅ number
  const [isEnabled, setIsEnabled] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const refreshOptions = [
    { label: "Every 5 Mins", value: 300 },
    { label: "Every 10 Mins", value: 600 },
    { label: "Every 15 Mins", value: 900 },
    { label: "Every 20 Mins", value: 1200 },
    { label: "Every 1 Hour", value: 3600 },
    { label: "Every 4 Hour", value: 14400 },
    { label: "Once per day", value: 86400 },
  ];
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  const selectedLabel =
    refreshOptions.find((i) => i.value === refreshSeconds)?.label;
  useEffect(() => {
    if (selectedItem) {
      setStartTime(convertTo24Hour(selectedItem.startTime));
      setEndTime(convertTo24Hour(selectedItem.endTime));
      setPriority(String(selectedItem.priority));
      setRefreshSeconds(selectedItem.refreshSeconds);
      setIsEnabled(selectedItem.isEnabled);
    } else {
      setStartTime("00:00");
      setEndTime("23:45");
      setPriority("1");
      setRefreshSeconds(3600);
      setIsEnabled(true);
    }
  }, [selectedItem, open])
  const convertTo24Hour = (time: string) => {
    if (!time) return "00:00";

    // Already 24-hour (like 23:45:00 or 23:45)
    if (!time.toLowerCase().includes("am") && !time.toLowerCase().includes("pm")) {
      return time.slice(0, 5);
    }

    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":");

    let h = parseInt(hours, 10);

    if (modifier.toLowerCase() === "pm" && h !== 12) {
      h += 12;
    }

    if (modifier.toLowerCase() === "am" && h === 12) {
      h = 0;
    }

    return `${h.toString().padStart(2, "0")}:${minutes}`;
  };

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");

      setStartTime(`${hours}:${minutes}`);// ✅ 24-hour format
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");

      setEndTime(`${hours}:${minutes}`);
    }
  };

  const handleSave = async () => {
    try {
      const formatTime = (time: string) =>
        time.length === 5 ? `${time}:00` : time;
      const payload = {
        pluginId: plugin.pluginId,
        startTime: startTime.slice(0, 5),
        endTime: endTime.slice(0, 5),
        priority: priority ? Number(priority) : 1,
        refreshSeconds: Number(refreshSeconds),
        isEnabled: Boolean(isEnabled),
        data: { name: pluginName || "" },
        config: {},
      };
      console.log("📤 PAYLOAD:", payload);
      if (selectedItem?.id) {
        const res = await apiClient.patch(
          `/playlist/item/${selectedItem.id}`,
          payload
        );
        console.log("✅ PATCH RESPONSE:", res.data);
      } else {
        const res = await apiClient.post(
          `/playlist/item/frame/${frameId}`,
          payload
        );
        console.log("✅ POST RESPONSE:", res.data);
      }
      await onSaved?.();
    } catch (err: any) {
      console.log("❌ BACKEND MESSAGE:", err?.response?.data?.message);
      console.log("❌ FULL ERROR:", err?.response?.data);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-4">
        <View className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-md">

          {/* HEADER */}
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedItem ? "Edit Playlist Item" : "Add to Playlist"}
              </Text>
              <Text className="text-gray-500 text-sm">
                {pluginName}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <X size={iconSize} color="gray" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* TIME */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">

                <Clock size={iconSize} color="gray" />


                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Display Time
                </Text>
              </View>
              <View className="flex-row gap-2">

                {/* START TIME */}
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex-row items-center"
                >
                  <Text className="text-gray-700 dark:text-gray-300 ml-2 flex-1 justify-between"> 
                    {startTime || "Start Time"}
                  </Text>
                  
                  <Clock size={iconSize} color="gray" />
                </TouchableOpacity>

                {/* END TIME */}
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex-row items-center"
                >
                 
                  <Text className="text-gray-700 dark:text-gray-300 ml-2 flex-1 justify-between">
                    {endTime || "End Time"}
                  </Text>
                   <Clock size={iconSize} color="gray" />
                </TouchableOpacity>

              </View>
            </View>
            {/* PRIORITY */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </Text>
              <TextInput
                value={priority}
                onChangeText={setPriority}
                keyboardType="numeric"
                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg"
              />
            </View>

            {/* <View className="flex-row items-center mb-2"> */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Zap size={iconSize} color="gray" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Refresh Interval
                </Text>
              </View>

              {/* BUTTON */}
              <TouchableOpacity
                onPress={() => setDropdownOpen(!dropdownOpen)}
                className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"

              >
                <Text className="text-black dark:text-white">
                  {selectedLabel || "Select refresh time"}
                </Text>

                {dropdownOpen ? (
                  <ChevronUp size={iconSize} color="gray" />
                ) : (
                  <ChevronDown size={iconSize} color="gray" />
                )}
              </TouchableOpacity>

              {/* DROPDOWN */}
              {dropdownOpen && (<View className="border border-gray-300 rounded-xl mt-2 bg-white dark:bg-[#1a1a1a] overflow-hidden">
                {refreshOptions.map((item) => {
                  const isSelected = item.value === refreshSeconds;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setRefreshSeconds(item.value);
                        setDropdownOpen(false);
                      }}
                      className={`px-4 py-3 ${isSelected
                        ? "bg-blue-600"
                        : "bg-white dark:bg-[#1a1a1a]"
                        }`}
                    >
                      <Text
                        className={
                          isSelected
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                        }
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              )}
              {/* </View> */}
            </View>
            {/* SWITCH */}
            <View className="flex-row justify-between items-center p-4 bg-gray-100 dark:bg-[#252525] rounded-lg border border-gray-300 dark:border-gray-700">

              {/* LEFT SIDE (ICON + TEXT) */}
              <View className="flex-row items-center">

                {/* ICON BOX */}
                <View className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#333] items-center justify-center">
                  <ToggleRight size={iconSize} color="#6B7280" />
                </View>

                {/* TEXT */}
                <View className="ml-3">
                  <Text className="text-gray-900 dark:text-white font-medium">
                    Enable this item
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    Show on device when active
                  </Text>
                </View>
              </View>

              {/* SWITCH */}
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
              />
            </View>

          </ScrollView>

          {/* BUTTONS */}
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-200 p-3 rounded-lg items-center"
            >
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                console.log("🔥 SAVE BUTTON CLICKED");
                handleSave();
              }}
              className="flex-1 bg-blue-600 p-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">
                Save
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
      {showStartPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={onStartChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={onEndChange}
        />
      )}
    </Modal>
  );
}