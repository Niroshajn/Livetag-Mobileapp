
import React, { useEffect, useState } from "react";

import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import Text from "../components/AppText";
import api from "../lib/api";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "EditFrame"
>;

interface Frame {
  id: string;
  name: string;
  friendlyId?: string;
}

interface EditFrameResponse {
  message?: string;
  frame: Frame;
}

export default function EditFrame({
  navigation,
  route,
}: Props) {
  const { id } = route.params;

  const [frame, setFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ----------------------------------
  // LOAD DEVICE
  // ----------------------------------

  useEffect(() => {
    let mounted = true;

    const loadFrame = async () => {
      try {
        const res = await api.get<Frame>(
          `/frames/${id}`
        );

        if (mounted) {
          setFrame(res.data);
        }
      } catch (error: any) {
        console.log(
          "Load device error:",
          error?.response?.data || error
        );

        Alert.alert(
          "Error",
          "Failed to load device.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFrame();

    return () => {
      mounted = false;
    };
  }, [id, navigation]);

  // ----------------------------------
  // SAVE DEVICE
  // ----------------------------------

  const save = async () => {
    if (!frame || !frame.name.trim()) {
      Alert.alert(
        "Validation",
        "Device name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const res = await api.patch<EditFrameResponse>(
        `/frames/edit/${frame.id}`,
        {
          name: frame.name.trim(),
        }
      );

      Alert.alert(
        "Success",
        res.data.message || "Device updated successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Frame");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "Update device error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to update device."
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------
  // LOADING
  // ----------------------------------

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text className="text-gray-500 mt-3">
          Loading device...
        </Text>
      </View>
    );
  }

  if (!frame) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center p-5">
        <Text className="text-gray-600 dark:text-gray-300">
          Device not found.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-600 px-5 py-3 rounded-xl mt-4"
        >
          <Text className="text-white font-semibold">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-black"
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-xl self-center bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#1f1f1f] rounded-2xl p-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Edit Device
          </Text>

          {/* DEVICE NAME */}

          <View className="mb-5">
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Device Name
            </Text>

            <TextInput
              value={frame.name}
              onChangeText={(value) =>
                setFrame((prev) =>
                  prev
                    ? {
                        ...prev,
                        name: value,
                      }
                    : prev
                )
              }
              placeholder="Enter device name"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
            />
          </View>

          {/* FRIENDLY ID */}

          {frame.friendlyId && (
            <View className="mb-5">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Device ID
              </Text>

              <Text className="text-gray-800 dark:text-gray-200 mt-1">
                {frame.friendlyId}
              </Text>
            </View>
          )}

          {/* BUTTONS */}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={save}
              disabled={saving}
              className={`flex-1 rounded-xl py-3 items-center ${
                saving
                  ? "bg-blue-400"
                  : "bg-blue-600"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={saving}
              className="flex-1 rounded-xl py-3 items-center bg-gray-200 dark:bg-gray-800"
            >
              <Text className="text-gray-800 dark:text-white font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
