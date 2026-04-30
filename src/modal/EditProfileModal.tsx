import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera, User, X } from "lucide-react-native";
import { launchImageLibrary } from "react-native-image-picker";
import api from "../lib/api";
import { uploadToS3 } from "../types/uploadtoS3"; // ✅ FIXED
import { UploadType } from "../types/upload";

export default function EditProfileModal({ user, onCancel, onSave }: any) {
  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState<string | null>(user.profilePic || null);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  /* ================= PICK IMAGE ================= */
const pickImage = async () => {
  console.log("📸 Image picker opened");

  const result = await launchImageLibrary({
    mediaType: "photo",
    quality: 0.8,
  });

  console.log("📦 Picker result:", result);

  if (result.didCancel) {
    console.log("❌ User cancelled image picker");
    return;
  }

  const asset = result.assets?.[0];

  console.log("🖼️ Selected asset:", asset);

  if (!asset?.uri) {
    console.log("❌ No URI found in asset");
    return;
  }

  try {
    setLoading(true);

    console.log("🚀 Starting upload...");
    console.log("📁 URI:", asset.uri);
    console.log("📄 TYPE:", asset.type);
    console.log("📛 FILE NAME:", asset.fileName);

    // 1️⃣ Preview first
    setImage(asset.uri);

    // 2️⃣ Upload
    const uploadedUrl = await uploadToS3(
      asset.uri,
      UploadType.PROFILE_AVATAR
    );

    console.log("✅ Upload success URL:", uploadedUrl);

    // 3️⃣ Set final image
    setImage(uploadedUrl);

    Alert.alert("Success", "Image uploaded successfully");
  } catch (err) {
    console.log("🚨 UPLOAD ERROR FULL:", err);
    Alert.alert("Error", "Image upload failed");
  } finally {
    console.log("🏁 Upload finished");
    setLoading(false);
  }
};
  /* ================= SAVE ================= */
 const handleSave = async () => {
  try {
    setLoading(true);

    // ❌ REMOVE API CALL FROM HERE

    onSave?.({
      name,
      profilePic: deleted ? "" : image,
    });

    onCancel();
  } catch (err) {
    console.log(err);
    Alert.alert("Error", "Failed to update profile");
  } finally {
    setLoading(false);
  }
};

  /* ================= UI ================= */
  return (
    <View className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden">

      {/* HEADER */}
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-lg font-semibold text-black dark:text-white">
          Edit Profile
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View className="p-5">
        <View className="flex-row items-center gap-5">

          {/* Avatar */}
          <View className="relative">
            <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 overflow-hidden items-center justify-center">
              {image ? (
                <Image source={{ uri: image }} className="w-full h-full" />
              ) : (
                <User size={36} color="gray" />
              )}
            </View>

            <TouchableOpacity
              onPress={pickImage}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Camera size={14} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View className="flex-1">
            <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-black dark:text-white"
            />
          </View>
        </View>

        {/* Delete */}
        {user?.profilePic && !deleted && (
          <TouchableOpacity
            onPress={() => {
              setImage(null);
              setDeleted(true);
            }}
            className="mt-4 bg-gray-400 px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-center">
              Delete Profile Image
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FOOTER */}
      <View className="flex-row gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 border border-gray-300 dark:border-gray-700 py-3 rounded-lg"
        >
          <Text className="text-center text-black dark:text-white">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="flex-1 bg-blue-600 py-3 rounded-lg"
        >
          <Text className="text-white text-center">
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}