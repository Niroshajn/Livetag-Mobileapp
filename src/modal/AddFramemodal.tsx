import React, { useState, useRef } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, Alert, Dimensions } from "react-native";
import { Monitor } from "lucide-react-native";
import api from "../lib/api";

export default function AddFrameModal({ visible, onClose }: any) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  const handleChange = (text: string, index: number) => {
    const value = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!value) return;

    const newCode = [...code];
    newCode[index] = value[0];
    setCode(newCode);

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    const newCode = [...code];

    if (newCode[index]) {
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    if (index > 0) {
      newCode[index - 1] = "";
      setCode(newCode);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-center px-4">

        {/* Overlay */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "black", opacity: 0.5 }]} />

        <View className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5">

          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Monitor size={iconSize} color="#3b82f6" />
            </View>

            <View>
              <Text className="text-lg font-bold text-black dark:text-white">
                Add Device
              </Text>
              <Text className="text-gray-500 text-sm">
                Connect a new display
              </Text>
            </View>
          </View>

          {/* Device Name */}
          <View className="mb-5">
            <Text className="text-sm mb-2 text-gray-700 dark:text-gray-300">
              Device Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Office Display"
              placeholderTextColor="#888"
              className="bg-gray-100 dark:bg-[#252525] p-3 rounded-lg text-black dark:text-white"
            />
          </View>

          {/* OTP */}
          <View className="mb-5">
            <Text className="text-sm mb-3 text-gray-700 dark:text-gray-300">
              Device Code
            </Text>

            <View className="flex-row justify-between">
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, i)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") {
                      handleBackspace(i);
                    }
                  }}
                  maxLength={1}
                  className="w-10 h-12 text-center text-lg font-bold bg-gray-100 dark:bg-[#252525] rounded-lg text-black dark:text-white border border-gray-300 dark:border-gray-700"
                />
              ))}
            </View>

            <Text className="text-xs text-gray-400 text-center mt-2">
              Enter 6-character code
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              <Text className="text-center text-black dark:text-white">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 rounded-lg bg-blue-600"
              onPress={async () => {
                if (!name || code.join("").length !== 6) {
                  Alert.alert("Error", "Enter valid details");
                  return;
                }

                try {
                  await api.post("/frames/claim", {
                    name,
                    friendlyId: code.join(""),
                  });

                  Alert.alert("Success", "Device Added Successfully ✅");
                  onClose();
                } catch (err) {
                  console.log(err);
                  Alert.alert("Error", "Failed to add device ❌");
                }
              }}
            >
              <Text className="text-center text-white font-semibold">
                Add Device
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}