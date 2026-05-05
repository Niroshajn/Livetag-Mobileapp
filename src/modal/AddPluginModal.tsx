import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
export default function AddPluginModal({
  open,
  onClose,
}: any) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  return (
    <Modal visible={open} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-center px-4">
        <View className="bg-white rounded-2xl p-5 max-h-[90%]">

          {/* HEADER */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Create App</Text>

            <TouchableOpacity onPress={onClose}>
              <X size={iconSize} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* NAME */}
            <Text className="text-sm mb-1">App Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter App name"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            {/* DESCRIPTION */}
            <Text className="text-sm mb-1">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            {/* TAGS (Simple Version) */}
            <Text className="text-sm mb-2">Tags</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {["AI", "Chat", "Tools"].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  className="bg-blue-100 px-3 py-1 rounded-md"
                >
                  <Text className="text-blue-700">#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* VISIBILITY */}
            <Text className="text-sm mb-2">Visibility</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={() => setIsPublic(true)}
                className={`flex-1 p-2 rounded-lg border ${
                  isPublic ? "bg-blue-200" : "bg-gray-100"
                }`}
              >
                <Text className="text-center">Public</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsPublic(false)}
                className={`flex-1 p-2 rounded-lg border ${
                  !isPublic ? "bg-blue-200" : "bg-gray-100"
                }`}
              >
                <Text className="text-center">Private</Text>
              </TouchableOpacity>
            </View>

            {/* STATUS */}
            <Text className="text-sm mb-2">Status</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={() => setIsEnabled(true)}
                className={`flex-1 p-2 rounded-lg border ${
                  isEnabled ? "bg-green-200" : "bg-gray-100"
                }`}
              >
                <Text className="text-center">Enabled</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsEnabled(false)}
                className={`flex-1 p-2 rounded-lg border ${
                  !isEnabled ? "bg-gray-300" : "bg-gray-100"
                }`}
              >
                <Text className="text-center">Disabled</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-lg bg-gray-200"
            >
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 py-3 rounded-lg bg-blue-500">
              <Text className="text-center text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}