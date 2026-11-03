
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
  Clock,
  Zap,
  X,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Puzzle,
  ArrowUpDown,
} from "lucide-react-native";

import Text from "../components/AppText";
import apiClient from "../lib/api";

import type { PlaylistItem } from "../types/Playlist";
import type { DeviceProfile } from "../../packages/ltag/device";

/* ================= PROPS ================= */

interface Props {
  open: boolean;
  onClose: () => void;

  frameId: string;
  pluginId: string;
  pluginName: string;

  selectedItem: PlaylistItem | null;

  onSaved?: () => void | Promise<void>;

  profile?: DeviceProfile | null;
  width?: number;
  height?: number;

  isGroup?: boolean;
}

/* ================= TYPES ================= */

type RefreshOption = {
  label: string;
  value: string;
};

type TenantConfigResponse = {
  allowed_refresh_duration?: string[];
};

/* ================= TIME HELPERS ================= */

function convertTo24Hour(time?: string): string {
  if (!time) return "00:00";

  const match = time.trim().match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (!match) return "00:00";

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59 ||
    hours < 0 ||
    hours > (period ? 12 : 23) ||
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

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

function timeToDate(time: string): Date {
  const normalized = convertTo24Hour(time);
  const [hours, minutes] = normalized.split(":").map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

/* ================= ERROR HELPER ================= */

function getErrorMessage(error: any): string {
  const responseData = error?.response?.data;
  const message = responseData?.message;

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message)) {
    return (
      message
        .map((item: unknown) =>
          typeof item === "string" ? item : ""
        )
        .filter(Boolean)
        .join("\n") || "Could not save playlist item."
    );
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  return "Could not save playlist item. Please try again.";
}

/* ================= COMPONENT ================= */

export default function PlaylistItemModal({
  open,
  onClose,
  frameId,
  pluginId: initialPluginId,
  pluginName,
  selectedItem,
  onSaved,
  isGroup = false,
}: Props) {
  const [pluginId, setPluginId] = useState<string | null>(
    initialPluginId || null
  );

  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:45");

  const [priority, setPriority] = useState(1);

  const [refreshSeconds, setRefreshSeconds] = useState("");

  const [refreshOptions, setRefreshOptions] = useState<
    RefreshOption[]
  >([]);

  const [isEnabled, setIsEnabled] = useState(true);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [loadingRefreshOptions, setLoadingRefreshOptions] =
    useState(false);

  const [saving, setSaving] = useState(false);

  /* ================= LOAD REFRESH OPTIONS ================= */

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchRefreshOptions = async () => {
      setLoadingRefreshOptions(true);

      try {
        const response =
          await apiClient.get<TenantConfigResponse>(
            "/tenant-config"
          );

        const allowedOptions =
          response.data?.allowed_refresh_duration ?? [];

        const options: RefreshOption[] = allowedOptions.map(
          (option) => ({
            label: option,
            value: option,
          })
        );

        if (!cancelled) {
          setRefreshOptions(options);

          // Same default behavior as web app.
          if (!selectedItem && options.length > 0) {
            setRefreshSeconds(options[0].value);
          }
        }
      } catch (error) {
        console.error(
          "LOAD REFRESH OPTIONS ERROR:",
          error
        );

        if (!cancelled) {
          setRefreshOptions([]);

          Alert.alert(
            "Error",
            "Failed to load refresh options."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRefreshOptions(false);
        }
      }
    };

    fetchRefreshOptions();

    return () => {
      cancelled = true;
    };
  }, [open, selectedItem]);

  /* ================= LOAD SELECTED ITEM ================= */

  useEffect(() => {
    if (!open) return;

    setDropdownOpen(false);
    setShowStartPicker(false);
    setShowEndPicker(false);

    if (selectedItem) {
      // Edit existing playlist item.
      setPluginId(selectedItem.pluginId);

      setStartTime(
        convertTo24Hour(selectedItem.startTime)
      );

      setEndTime(
        convertTo24Hour(selectedItem.endTime)
      );

      setPriority(
        Math.max(1, Number(selectedItem.priority) || 1)
      );

      setRefreshSeconds(
        String(selectedItem.refreshSeconds ?? "")
      );

      setIsEnabled(selectedItem.isEnabled ?? true);
    } else {
      // Add new playlist item.
      setPluginId(initialPluginId || null);

      setStartTime("00:00");
      setEndTime("23:45");
      setPriority(1);
      setRefreshSeconds("");
      setIsEnabled(true);
    }
  }, [open, selectedItem, initialPluginId]);

  /* ================= PRIORITY ================= */

  const decreasePriority = () => {
    setPriority((previous) => Math.max(1, previous - 1));
  };

  const increasePriority = () => {
    setPriority((previous) => previous + 1);
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (saving) return;

    if (!pluginId) {
      Alert.alert("Error", "Plugin required.");
      return;
    }

    if (!selectedItem?.id && !frameId) {
      Alert.alert(
        "Error",
        "Please select a device or group first."
      );
      return;
    }

    if (!startTime || !endTime) {
      Alert.alert(
        "Invalid time",
        "Start and end time are required."
      );
      return;
    }

    if (!refreshSeconds) {
      Alert.alert(
        "Refresh interval required",
        "Please select a refresh interval."
      );
      return;
    }

    if (!Number.isInteger(priority) || priority < 1) {
      Alert.alert(
        "Invalid priority",
        "Priority must be 1 or higher."
      );
      return;
    }

    const payload = {
      pluginId,
      startTime: convertTo24Hour(startTime),
      endTime: convertTo24Hour(endTime),
      priority,
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
        // Same PATCH endpoint as web.
        await apiClient.patch(
          `/playlist/item/${selectedItem.id}`,
          payload
        );

        Alert.alert(
          "Success",
          "Playlist item updated successfully."
        );
      } else {
        // Same POST endpoint as web.
        await apiClient.post(
          `/playlist/item/frame-or-group/${frameId}`,
          payload
        );

        Alert.alert(
          "Success",
          "Playlist item added successfully."
        );
      }

      setDropdownOpen(false);
      setShowStartPicker(false);
      setShowEndPicker(false);

      await onSaved?.();

      onClose();
    } catch (error: any) {
      console.error(
        "SAVE PLAYLIST ITEM ERROR:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Save failed",
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= CLOSE ================= */

  const handleClose = () => {
    if (saving) return;

    setDropdownOpen(false);
    setShowStartPicker(false);
    setShowEndPicker(false);

    onClose();
  };

  const selectedRefreshLabel =
    refreshOptions.find(
      (option) => option.value === refreshSeconds
    )?.label ?? "Select refresh time";

  /* ================= UI ================= */

  return (
    <>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="max-h-[88%] w-full self-center rounded-2xl bg-white p-5 dark:bg-[#1a1a1a]">

            {/* HEADER */}

            <View className="mb-5 flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Puzzle size={24} color="#9333EA" />
              </View>

              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedItem
                    ? "Edit Playlist Item"
                    : "Add to Playlist"}
                </Text>

                <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {pluginName}
                </Text>

                {isGroup && (
                  <Text className="mt-1 text-xs text-blue-500">
                    Group playlist
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleClose}
                disabled={saving}
                hitSlop={10}
              >
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios"
                  ? "interactive"
                  : "on-drag"
              }
              automaticallyAdjustKeyboardInsets={
                Platform.OS === "ios"
              }
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >

              {/* DISPLAY TIME */}

              <View className="mb-5">
                <View className="mb-3 flex-row items-center">
                  <Clock size={17} color="#6B7280" />

                  <Text className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Time
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    disabled={saving}
                    onPress={() => {
                      setShowEndPicker(false);
                      setShowStartPicker(true);
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#252525]"
                  >
                    <Text className="mb-1 text-xs text-gray-500">
                      Start
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-gray-900 dark:text-white">
                        {startTime}
                      </Text>

                      <Clock size={17} color="#6B7280" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={saving}
                    onPress={() => {
                      setShowStartPicker(false);
                      setShowEndPicker(true);
                    }}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#252525]"
                  >
                    <Text className="mb-1 text-xs text-gray-500">
                      End
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-gray-900 dark:text-white">
                        {endTime}
                      </Text>

                      <Clock size={17} color="#6B7280" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PRIORITY */}

              <View className="mb-5">
                <View className="mb-2 flex-row items-center">
                  <ArrowUpDown size={17} color="#6B7280" />

                  <Text className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </Text>
                </View>

                <View className="h-12 flex-row items-center overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <TouchableOpacity
                    onPress={decreasePriority}
                    disabled={saving || priority <= 1}
                    className="h-full w-12 items-center justify-center bg-gray-100 dark:bg-[#2b2b2b]"
                  >
                    <Minus size={17} color="#6B7280" />
                  </TouchableOpacity>

                  <View className="flex-1 items-center justify-center">
                    <TextInput
                      value={String(priority)}
                      onChangeText={(value) => {
                        if (value === "") {
                          setPriority(1);
                          return;
                        }

                        const parsed = Number(value);

                        if (
                          Number.isInteger(parsed) &&
                          parsed >= 1
                        ) {
                          setPriority(parsed);
                        }
                      }}
                      keyboardType="number-pad"
                      editable={!saving}
                      selectTextOnFocus
                      className="w-full text-center text-base text-gray-900 dark:text-white"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={increasePriority}
                    disabled={saving}
                    className="h-full w-12 items-center justify-center bg-gray-100 dark:bg-[#2b2b2b]"
                  >
                    <Plus size={17} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* REFRESH INTERVAL */}

              <View className="mb-5">
                <View className="mb-2 flex-row items-center">
                  <Zap size={17} color="#6B7280" />

                  <Text className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Refresh Interval
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={saving || loadingRefreshOptions}
                  onPress={() =>
                    setDropdownOpen((previous) => !previous)
                  }
                  className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-[#252525]"
                >
                  <Text className="flex-1 text-sm text-gray-900 dark:text-white">
                    {loadingRefreshOptions
                      ? "Loading refresh options..."
                      : selectedRefreshLabel}
                  </Text>

                  {loadingRefreshOptions ? (
                    <ActivityIndicator
                      size="small"
                      color="#2563EB"
                    />
                  ) : dropdownOpen ? (
                    <ChevronUp size={19} color="#6B7280" />
                  ) : (
                    <ChevronDown size={19} color="#6B7280" />
                  )}
                </TouchableOpacity>

                {dropdownOpen && (
                  <View className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    {refreshOptions.length === 0 ? (
                      <View className="p-3">
                        <Text className="text-sm text-gray-500">
                          No refresh options available.
                        </Text>
                      </View>
                    ) : (
                      refreshOptions.map((option) => {
                        const selected =
                          option.value === refreshSeconds;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            disabled={saving}
                            onPress={() => {
                              setRefreshSeconds(option.value);
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
                                  ? "font-medium text-white"
                                  : "text-gray-900 dark:text-white"
                              }
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>

              {/* ENABLED */}

              <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#252525]">
                <View className="flex-1 flex-row items-center pr-3">
                  <ToggleRight size={21} color="#6B7280" />

                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-gray-900 dark:text-white">
                      Enable this item
                    </Text>

                    <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Show on device when active
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isEnabled}
                  onValueChange={setIsEnabled}
                  disabled={saving}
                  trackColor={{
                    false: "#D1D5DB",
                    true: "#2563EB",
                  }}
                />
              </View>

            </ScrollView>

            {/* FOOTER */}

            <View className="mt-4 flex-row gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <TouchableOpacity
                onPress={handleClose}
                disabled={saving}
                className="flex-1 items-center rounded-xl bg-gray-200 p-3 dark:bg-gray-700"
              >
                <Text className="font-medium text-gray-800 dark:text-white">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || loadingRefreshOptions}
                className={`flex-1 flex-row items-center justify-center rounded-xl p-3 ${
                  saving || loadingRefreshOptions
                    ? "bg-blue-400"
                    : "bg-blue-600"
                }`}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Text className="font-semibold text-white">
                    {selectedItem
                      ? "Save Changes"
                      : "Add to Playlist"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* START TIME PICKER */}

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

      {/* END TIME PICKER */}

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
    </>
  );
}
