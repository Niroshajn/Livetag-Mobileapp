import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Switch, 
  TextInput,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import Text from "../components/AppText";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Clock,
  Zap,
  X,
  ToggleRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";

import type { Plugin } from "./SelectPluginModal";
import apiClient from "../lib/api";

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
  frameId: string;
}

const REFRESH_OPTIONS = [
  { label: "Every 5 Mins", value: 300 },
  { label: "Every 10 Mins", value: 600 },
  { label: "Every 15 Mins", value: 900 },
  { label: "Every 20 Mins", value: 1200 },
  { label: "Every 1 Hour", value: 3600 },
  { label: "Every 4 Hours", value: 14400 },
  { label: "Once per day", value: 86400 },
];

/**
 * Converts supported time strings to 24-hour HH:mm format.
 *
 * Examples:
 * 09:30     -> 09:30
 * 09:30:00  -> 09:30
 * 9:30 PM   -> 21:30
 * 12:00 AM  -> 00:00
 * 12:00 PM  -> 12:00
 */
function convertTo24Hour(time?: string): string {
  if (!time || typeof time !== "string") {
    return "00:00";
  }

  const normalized = time.trim();

  const match = normalized.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (!match) {
    return "00:00";
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > (period ? 12 : 23) ||
    minutes < 0 ||
    minutes > 59 ||
    (period && hours < 1)
  ) {
    return "00:00";
  }

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Converts HH:mm into a Date required by DateTimePicker.
 */
function timeToDate(time: string): Date {
  const normalized = convertTo24Hour(time);
  const [hours, minutes] = normalized.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}

/**
 * Converts a selected DateTimePicker value to HH:mm.
 */
function dateToTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Converts an API error to a safe string for Alert.alert().
 */
function getErrorMessage(error: any): string {
  const responseData = error?.response?.data;
  const message = responseData?.message;

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .map((item: unknown) =>
        typeof item === "string" ? item : ""
      )
      .filter(Boolean)
      .join("\n") || "Could not save the playlist item. Please try again.";
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  return "Could not save the playlist item. Please try again.";
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
  const [refreshSeconds, setRefreshSeconds] = useState(3600);
  const [isEnabled, setIsEnabled] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const iconSize = Dimensions.get("window").width * 0.05;

  const selectedLabel = REFRESH_OPTIONS.find(
    (item) => item.value === refreshSeconds
  )?.label;

  useEffect(() => {
    if (!open) {
      return;
    }

    setDropdownOpen(false);
    setShowStartPicker(false);
    setShowEndPicker(false);

    if (selectedItem) {
      setStartTime(convertTo24Hour(selectedItem.startTime));
      setEndTime(convertTo24Hour(selectedItem.endTime));
      setPriority(String(selectedItem.priority ?? 1));
      setRefreshSeconds(selectedItem.refreshSeconds ?? 3600);
      setIsEnabled(selectedItem.isEnabled ?? true);
    } else {
      setStartTime("00:00");
      setEndTime("23:45");
      setPriority("1");
      setRefreshSeconds(3600);
      setIsEnabled(true);
    }
  }, [selectedItem, open]);

  const handleSave = async () => {
    if (!plugin?.pluginId) {
      Alert.alert("Error", "Plugin information is missing.");
      return;
    }

    if (!selectedItem?.id && !frameId) {
      Alert.alert("Error", "Please select a device first.");
      return;
    }

    const parsedPriority = Number(priority);

    if (!Number.isFinite(parsedPriority) || parsedPriority < 1) {
      Alert.alert(
        "Invalid priority",
        "Enter a priority of 1 or higher."
      );
      return;
    }

    // Ensure both times are sent in HH:mm format.
    const normalizedStartTime = convertTo24Hour(startTime);
    const normalizedEndTime = convertTo24Hour(endTime);

    const payload = {
      pluginId: plugin.pluginId,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      priority: parsedPriority,
      refreshSeconds,
      isEnabled,
      data: {
        name: pluginName || "",
      },
      config: {},
    };

    console.log("SAVE PLAYLIST ITEM PAYLOAD:", payload);

    setSaving(true);

    try {
      if (selectedItem?.id) {
        await apiClient.patch(
          `/playlist/item/${selectedItem.id}`,
          payload
        );
      } else {
        await apiClient.post(
          `/playlist/item/frame/${frameId}`,
          payload
        );
      }

     setDropdownOpen(false);
setShowStartPicker(false);
setShowEndPicker(false);

onSaved?.();
    } catch (error: any) {
      console.error(
        "SAVE PLAYLIST ITEM ERROR:",
        error?.response?.data ?? error
      );

      Alert.alert("Save failed", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/40 px-4">
        <View className="max-h-[88%] w-full self-center rounded-2xl bg-white p-5 dark:bg-[#1a1a1a]">
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedItem ? "Edit Playlist Item" : "Add to Playlist"}
              </Text>

              <Text className="mt-1 text-sm text-gray-500">
                {pluginName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Close playlist item modal"
              hitSlop={10}
            >
              <X size={iconSize} color="gray" />
            </TouchableOpacity>
          </View>

         <ScrollView
  style={{ flexShrink: 1 }}
  contentContainerStyle={{
    paddingBottom: 12,
  }}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode={
    Platform.OS === "ios" ? "interactive" : "on-drag"
  }
  automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
  nestedScrollEnabled
  showsVerticalScrollIndicator
>
            {/* Display Time */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center">
                <Clock size={iconSize} color="gray" />

                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Display Time (24-hour format)
                </Text>
              </View>

              <View className="flex-row gap-2">
                {/* Start Time */}
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => {
                    setShowEndPicker(false);
                    setShowStartPicker(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Start time ${startTime}`}
                  className="flex-1 flex-row items-center rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
                >
                  <View className="flex-1">
                    <Text className="mb-1 text-xs text-gray-500">
                      Start
                    </Text>
                    <Text className="text-base text-gray-700 dark:text-gray-300">
                      {startTime}
                    </Text>
                  </View>
                  <Clock size={iconSize} color="gray" />
                </TouchableOpacity>

                {/* End Time */}
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => {
                    setShowStartPicker(false);
                    setShowEndPicker(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`End time ${endTime}`}
                  className="flex-1 flex-row items-center rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
                >
                  <View className="flex-1">
                    <Text className="mb-1 text-xs text-gray-500">
                      End
                    </Text>
                    <Text className="text-base text-gray-700 dark:text-gray-300">
                      {endTime}
                    </Text>
                  </View>
                  <Clock size={iconSize} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Priority */}
            <View className="mb-4">
              <Text className="mb-1 text-gray-700 dark:text-gray-300">
                Priority
              </Text>
              <TextInput
                value={priority}
                onChangeText={setPriority}
                keyboardType="number-pad"
                editable={!saving}
                className="rounded-lg bg-gray-100 p-3 text-gray-900 dark:bg-gray-800 dark:text-white"
                placeholder="Enter priority"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Refresh Interval */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center">
                <Zap size={iconSize} color="gray" />

                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Refresh Interval
                </Text>
              </View>

              <TouchableOpacity
                disabled={saving}
                onPress={() => setDropdownOpen((value) => !value)}
                className="flex-row items-center justify-between rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700"
              >
                <Text className="text-gray-900 dark:text-white">
                  {selectedLabel ?? "Select refresh time"}
                </Text>

                {dropdownOpen ? (
                  <ChevronUp size={iconSize} color="gray" />
                ) : (
                  <ChevronDown size={iconSize} color="gray" />
                )}
              </TouchableOpacity>

              {dropdownOpen && (
                <View className="mt-2 overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
                  {REFRESH_OPTIONS.map((item) => {
                    const selected = item.value === refreshSeconds;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        disabled={saving}
                        onPress={() => {
                          setRefreshSeconds(item.value);
                          setDropdownOpen(false);
                        }}
                        className={`px-4 py-3 ${
                          selected
                            ? "bg-blue-600"
                            : "bg-white dark:bg-[#1a1a1a]"
                        }`}
                      >
                        <Text
                          className={
                            selected
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
            </View>
            {/* Enabled */}
            <View className="flex-row items-center justify-between rounded-lg border border-gray-300 bg-gray-100 p-4 dark:border-gray-700 dark:bg-[#252525]">
              <View className="flex-1 flex-row items-center pr-3">
                <View className="h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-[#333]">
                  <ToggleRight size={iconSize} color="#6B7280" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900 dark:text-white">
                    Enable this item
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500">
                    Show on device when active
                  </Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                disabled={saving}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 items-center rounded-lg bg-gray-200 p-3 dark:bg-gray-700"
            >
              <Text className="font-medium text-gray-800 dark:text-white">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className={`flex-1 flex-row items-center justify-center rounded-lg p-3 ${
                saving ? "bg-blue-400" : "bg-blue-600"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="font-semibold text-white">
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Start Time Picker */}
      {showStartPicker && (
        <DateTimePicker
          value={timeToDate(startTime)}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (event.type === "set" && date) {
              setStartTime(dateToTime(date));
            }
          }}
        />
      )}

      {/* End Time Picker */}
      {showEndPicker && (
        <DateTimePicker
          value={timeToDate(endTime)}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (event.type === "set" && date) {
              setEndTime(dateToTime(date));
            }
          }}
        />
      )}
    </Modal>
  );
}