
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
  Keyboard,
  InteractionManager,
} from "react-native";

import {
  Monitor,
  ChevronDown,
  Check,
} from "lucide-react-native";

import api from "../lib/api";
import Text from "../components/AppText";

/* ================= TYPES ================= */

interface FrameGroup {
  id: string;
  name: string;
}

interface Frame {
  id: string;
  name: string;
  friendlyId?: string;
}

interface ApiResponse<T> {
  message?: string;
  data: T;
}

interface AddFrameModalProps {
  visible: boolean;
  onClose: () => void;
onAdded?: (newFrame?: Frame) => void | Promise<void>;
  hideGroupSelect?: boolean;
  groupId?: string;
  groups?: FrameGroup[];
}

/* ================= COMPONENT ================= */

export default function AddFrameModal({
  visible,
  onClose,
  onAdded,
  hideGroupSelect = false,
  groupId,
  groups = [],
}: AddFrameModalProps) {
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 700;

  const modalWidth = Math.min(width - 32, 500);

  /* ================= STATES ================= */

  const [name, setName] = useState("");

  const [code, setCode] = useState([
    "", "", "", "", "", "",
  ]);

  const [selectedGroupId, setSelectedGroupId] =
    useState(groupId || "");

  const [showGroupOptions, setShowGroupOptions] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");

  const [codeError, setCodeError] = useState("");

  /* ================= REFS ================= */

  const scrollRef = useRef<ScrollView>(null);

  const inputsRef = useRef<(TextInput | null)[]>([]);

  const inputPositions = useRef<number[]>([]);

  /* ================= RESET ================= */

  useEffect(() => {
    if (visible) {
      setName("");
      setCode(["", "", "", "", "", ""]);
      setSelectedGroupId(groupId || "");
      setShowGroupOptions(false);
      setLoading(false);
      setNameError("");
      setCodeError("");

      inputPositions.current = [];
    }
  }, [visible, groupId]);

  /* ================= SCROLL TO INPUT ================= */

  const scrollToInput = (index: number) => {
    InteractionManager.runAfterInteractions(() => {
      const position = inputPositions.current[index];

      if (position !== undefined) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, position - 100),
          animated: true,
        });
      }
    });
  };

  /* ================= DEVICE CODE ================= */

  const handleChange = (
    text: string,
    index: number
  ) => {
    const cleanedText = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    const newCode = [...code];

    if (!cleanedText) {
      newCode[index] = "";
      setCode(newCode);
      setCodeError("");
      return;
    }

    const characters = cleanedText.split("");

    characters.forEach((character, characterIndex) => {
      const targetIndex = index + characterIndex;

      if (targetIndex < 6) {
        newCode[targetIndex] = character;
      }
    });

    setCode(newCode);
    setCodeError("");

    const nextIndex = Math.min(
      index + characters.length,
      5
    );

    if (nextIndex < 5 || newCode[5]) {
      inputsRef.current[nextIndex]?.focus();
    }

    scrollToInput(nextIndex + 1);
  };

  /* ================= BACKSPACE ================= */

  const handleBackspace = (index: number) => {
    const newCode = [...code];

    if (newCode[index]) {
      newCode[index] = "";
      setCode(newCode);
      setCodeError("");
      return;
    }

    if (index > 0) {
      newCode[index - 1] = "";
      setCode(newCode);
      setCodeError("");

      inputsRef.current[index - 1]?.focus();
    }
  };

  /* ================= GROUP ================= */

  const selectedGroup = groups.find(
    (group) => group.id === selectedGroupId
  );

  const handleSelectGroup = (group: FrameGroup) => {
    setSelectedGroupId(group.id);
    setShowGroupOptions(false);
  };

  /* ================= ADD DEVICE ================= */

const handleAddDevice = async () => {
  Keyboard.dismiss();

  const trimmedName = name.trim();
  const friendlyId = code.join("");

  if (!trimmedName) {
    setNameError("Device name is required");
    return;
  }

  if (friendlyId.length !== 6) {
    setCodeError("Friendly ID must be 6 characters");
    return;
  }

  if (!hideGroupSelect && !selectedGroupId) {
    Alert.alert("Select Group", "Please select a device group.");
    return;
  }

  try {
    setLoading(true);

    console.log("========== ADD DEVICE START ==========");
    console.log("NAME:", trimmedName);
    console.log("FRIENDLY ID:", friendlyId);
    console.log("GROUP ID:", selectedGroupId);

    // STEP 1: Call claim API
    let response;

    try {
      response = await api.post("/frames/claim", {
        name: trimmedName,
        friendlyId,
        groupId: selectedGroupId,
      });

      console.log("CLAIM API STATUS:", response.status);
      console.log(
        "CLAIM API RESPONSE:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (apiError: any) {
      console.log("========== CLAIM API FAILED ==========");
      console.log("STATUS:", apiError?.response?.status);
      console.log(
        "SERVER RESPONSE:",
        JSON.stringify(apiError?.response?.data, null, 2)
      );
      console.log("ERROR MESSAGE:", apiError?.message);

      Alert.alert(
        "Claim API Error",
        apiError?.response?.data?.message ||
          apiError?.message ||
          "Unable to claim device."
      );

      return;
    }

    // STEP 2: A successful HTTP response means the claim succeeded.
    if (response.status >= 200 && response.status < 300) {
      Keyboard.dismiss();
      onClose();

      Alert.alert("Success", "Device added successfully.");

      // STEP 3: Refresh separately.
      try {
        await onAdded?.();
        console.log("DEVICE LIST REFRESH SUCCESS");
      } catch (refreshError: any) {
        console.log("DEVICE REFRESH FAILED:", refreshError);
        Alert.alert(
          "Device Added",
          "Device was added, but refreshing the device list failed. Please refresh manually."
        );
      }
    }
  } finally {
    setLoading(false);
  }
};

  /* ================= UI ================= */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
       <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={
                Platform.OS === "ios" ? "padding" : "height"
              }
              keyboardVerticalOffset={0}
            >
        <View className="flex-1 justify-center items-center px-4">

          {/* BACKGROUND OVERLAY */}

          <Pressable
            className="absolute inset-0 bg-black/60"
            disabled={loading}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />

          {/* MODAL CONTENT */}

          <View
            style={{
              width: modalWidth,
              maxHeight: height * 0.88,
            }}
            className="
              bg-white
              dark:bg-[#1e1e1e]
              rounded-2xl
              overflow-hidden
            "
          >
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios"
                  ? "interactive"
                  : "on-drag"
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                padding: isSmallScreen ? 16 : 20,
                paddingBottom: 24,
              }}
            >

              {/* HEADER */}

              <View className="flex-row items-center gap-3 mb-6">

                <View className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 items-center justify-center">
                  <Monitor
                    size={22}
                    color="#16A34A"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    Add Device
                  </Text>

                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    Connect a new display to Livetag
                  </Text>
                </View>

              </View>

              {/* DEVICE NAME */}

              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Device Name
                </Text>

                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);

                    if (value.trim()) {
                      setNameError("");
                    }
                  }}
                  onFocus={() => scrollToInput(0)}
                  onLayout={(event) => {
                    inputPositions.current[0] =
                      event.nativeEvent.layout.y;
                  }}
                  placeholder="e.g., Office Display"
                  placeholderTextColor="#888888"
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    inputsRef.current[0]?.focus()
                  }
                  className="
                    bg-gray-50 dark:bg-[#252525]
                    border border-gray-200 dark:border-gray-700
                    rounded-lg px-3 py-3
                    text-gray-900 dark:text-white
                  "
                />

                {!!nameError && (
                  <Text className="text-red-500 text-sm mt-1">
                    {nameError}
                  </Text>
                )}
              </View>

              {/* DEVICE GROUP */}

              {!hideGroupSelect && (
                <View className="mb-5">

                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Group
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={loading}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowGroupOptions(!showGroupOptions);
                    }}
                    className="
                      flex-row items-center justify-between
                      border border-gray-300 dark:border-gray-600
                      rounded-lg px-3 py-3
                      bg-white dark:bg-[#252525]
                    "
                  >
                    <Text
                      className={
                        selectedGroup
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400"
                      }
                    >
                      {selectedGroup?.name || "Select Group"}
                    </Text>

                    <ChevronDown
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {showGroupOptions && (
                    <View className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedGroupId("");
                          setShowGroupOptions(false);
                        }}
                        className="px-3 py-3 border-b border-gray-200 dark:border-gray-700"
                      >
                        <Text className="text-gray-500 dark:text-gray-400">
                          Select Group
                        </Text>
                      </TouchableOpacity>

                      {groups.length === 0 ? (
                        <View className="px-3 py-3">
                          <Text className="text-gray-400 text-sm">
                            No groups available
                          </Text>
                        </View>
                      ) : (
                        groups.map((group) => (
                          <TouchableOpacity
                            key={group.id}
                            onPress={() =>
                              handleSelectGroup(group)
                            }
                            className="
                              px-3 py-3
                              flex-row items-center justify-between
                              border-b border-gray-100 dark:border-gray-800
                            "
                          >
                            <Text className="text-gray-900 dark:text-white">
                              {group.name}
                            </Text>

                            {selectedGroupId === group.id && (
                              <Check
                                size={18}
                                color="#3B82F6"
                              />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* DEVICE CODE */}

              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Device Code
                </Text>

                <View className="flex-row justify-between gap-2">

                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(element) => {
                        inputsRef.current[index] = element;
                      }}
                      value={digit}
                      onChangeText={(text) =>
                        handleChange(text, index)
                      }
                      onFocus={() =>
                        scrollToInput(index + 1)
                      }
                      onLayout={(event) => {
                        inputPositions.current[index + 1] =
                          event.nativeEvent.layout.y;
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace") {
                          handleBackspace(index);
                        }
                      }}
                      maxLength={6}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!loading}
                      selectTextOnFocus
                      textAlign="center"
                      returnKeyType={
                        index === 5 ? "done" : "next"
                      }
                      onSubmitEditing={() => {
                        if (index < 5) {
                          inputsRef.current[index + 1]?.focus();
                        } else {
                          Keyboard.dismiss();
                        }
                      }}
                      className="
                        flex-1 h-12
                        text-center text-lg font-semibold
                        bg-gray-50 dark:bg-[#252525]
                        border border-gray-200 dark:border-gray-700
                        rounded-lg
                        text-gray-900 dark:text-white
                      "
                    />
                  ))}

                </View>

                <Text className="text-gray-400 dark:text-gray-500 text-xs text-center mt-2">
                  Enter the 6-character code shown on your device
                </Text>

                {!!codeError && (
                  <Text className="text-red-500 text-sm mt-2 text-center">
                    {codeError}
                  </Text>
                )}
              </View>

              {/* BUTTONS */}

              <View className="flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">

                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    onClose();
                  }}
                  disabled={loading}
                  className="
                    flex-1 py-3 rounded-lg
                    bg-gray-100 dark:bg-gray-800
                    items-center justify-center
                  "
                >
                  <Text className="font-semibold text-gray-700 dark:text-gray-200">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddDevice}
                  disabled={loading}
                  className={`
                    flex-1 py-3 rounded-lg
                    bg-blue-600
                    items-center justify-center flex-row
                    ${loading ? "opacity-60" : ""}
                  `}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />

                      <Text className="text-white font-semibold ml-2">
                        Adding...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white font-semibold">
                      Add Device
                    </Text>
                  )}
                </TouchableOpacity>

              </View>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
