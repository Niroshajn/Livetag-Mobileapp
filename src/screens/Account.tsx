
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import Text from "../components/AppText";
import {
  User,
  Mail,
  ChevronRight,
  Camera,
  Key,
  Moon,
  Sun,
  Check,
  Pencil,
  X,
  Trash2,
} from "lucide-react-native";

import api from "../lib/api";
import PasswordModal from "../modal/PasswordModal";
import AppLayout from "./Layout";
import { useTheme } from "../context/ThemeContext";
import { useColorScheme } from "nativewind";

type UserData = {
  name: string;
  email: string;
  profilePic: string;
  createdAt: string;
};

export default function AccountScreen() {
  const { theme, toggleTheme } = useTheme();
  const { colorScheme } = useColorScheme();

  const [user, setUser] = useState<UserData>({
    name: "",
    email: "",
    profilePic: "",
    createdAt: "",
  });

  const [nameModal, setNameModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [editedName, setEditedName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [savingName, setSavingName] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const iconSize = Math.max(
    18,
    Math.min(Dimensions.get("window").width * 0.05, 24)
  );

  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#111827";

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/user/me");
      const data = res.data?.userDetail ?? res.data?.user ?? res.data;

      setUser({
        name: data?.name ?? "",
        email: data?.email ?? "",
        profilePic: data?.profilePic ?? "",
        createdAt: data?.createdAt ?? "",
      });
    } catch (error) {
      console.log("User fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // NAME: open a name-only editor
  const openNameEditor = () => {
    setEditedName(user.name);
    setNameModal(true);
  };

  const saveName = async () => {
    const trimmedName = editedName.trim();

    if (!trimmedName) {
      Alert.alert("Full name required", "Please enter your full name.");
      return;
    }

    if (trimmedName === user.name) {
      setNameModal(false);
      return;
    }

    try {
      setSavingName(true);

      const res = await api.post("/auth/profile", {
        name: trimmedName,
        profilePic: user.profilePic || "",
      });

      const updated =
        res.data?.user ?? res.data?.userDetail ?? res.data;

      setUser((previous) => ({
        ...previous,
        name: updated?.name ?? trimmedName,
        email: updated?.email ?? previous.email,
        profilePic:
          updated?.profilePic !== undefined
            ? updated.profilePic ?? ""
            : previous.profilePic,
      }));

      setNameModal(false);
      Alert.alert("Success", "Your name has been updated.");
    } catch (error: any) {
      console.log("Name update error:", error);
      Alert.alert(
        "Update failed",
        error?.response?.data?.message ??
          "Unable to update your name. Please try again."
      );
    } finally {
      setSavingName(false);
    }
  };

  // IMAGE: choose an image without opening the name editor
  const chooseImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert(
          "Image selection failed",
          result.errorMessage ?? "Please try again."
        );
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (uri) {
        setSelectedImage(uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Unable to open the image library.");
    }
  };

  // Save selected image using the existing profile endpoint
  const saveImage = async () => {
    if (!selectedImage) {
      Alert.alert("Select an image", "Please choose an image first.");
      return;
    }

    try {
      setSavingImage(true);

      // This assumes the API accepts the provided URI.
      // If the backend requires a file upload, upload the image first
      // and send the returned image URL here instead.
      const res = await api.post("/auth/profile", {
        name: user.name,
        profilePic: selectedImage,
      });

      const updated =
        res.data?.user ?? res.data?.userDetail ?? res.data;

      const savedImage = updated?.profilePic ?? selectedImage;

      setUser((previous) => ({
        ...previous,
        name: updated?.name ?? previous.name,
        email: updated?.email ?? previous.email,
        profilePic: savedImage,
      }));

      setSelectedImage(null);
      setImageModal(false);
      Alert.alert("Success", "Your profile image has been updated.");
    } catch (error: any) {
      console.log("Image update error:", error);
      Alert.alert(
        "Update failed",
        error?.response?.data?.message ??
          "Unable to update the image. Your server may require an image upload first."
      );
    } finally {
      setSavingImage(false);
    }
  };

  // Delete the profile image
  const deleteImage = () => {
    Alert.alert(
      "Delete profile image",
      "Are you sure you want to remove your profile image?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingImage(true);

              const res = await api.post("/auth/profile", {
                name: user.name,
                profilePic: "",
              });

              const updated =
                res.data?.user ?? res.data?.userDetail ?? res.data;

              setUser((previous) => ({
                ...previous,
                name: updated?.name ?? previous.name,
                email: updated?.email ?? previous.email,
                profilePic:
                  updated?.profilePic !== undefined
                    ? updated.profilePic ?? ""
                    : "",
              }));

              setSelectedImage(null);
              setImageModal(false);
              Alert.alert("Success", "Your profile image has been removed.");
            } catch (error: any) {
              console.log("Delete image error:", error);
              Alert.alert(
                "Delete failed",
                error?.response?.data?.message ??
                  "Unable to delete your profile image."
              );
            } finally {
              setSavingImage(false);
            }
          },
        },
      ]
    );
  };

  // Change password
  const handleSavePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid password",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    try {
      await api.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword,
      });

      setPasswordModal(false);
      Alert.alert("Success", "Your password has been changed.");
    } catch (error: any) {
      Alert.alert(
        "Password change failed",
        error?.response?.data?.message ??
          "Unable to change your password. Please try again."
      );
    }
  };

  return (
    <AppLayout>
      <ScrollView
        className="flex-1 bg-white px-4 pt-6 dark:bg-black"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PAGE HEADER */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Account
          </Text>
          <Text className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your profile, security, and preferences
          </Text>
        </View>

        {/* PROFILE CARD */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="flex-row items-center gap-4">
            {/* PROFILE IMAGE */}
            <View className="relative">
              <View className="h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
                {user.profilePic ? (
                  <Image
                    key={user.profilePic}
                    source={{ uri: user.profilePic }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <User size={32} color={iconColor} />
                  </View>
                )}
              </View>

              {/* CAMERA: IMAGE ONLY */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedImage(null);
                  setImageModal(true);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Edit profile image"
                className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2"
              >
                <Camera size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* NAME AND EMAIL */}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.name || "Your Name"}
                </Text>

                {/* PENCIL: NAME ONLY */}
                <TouchableOpacity
                  onPress={openNameEditor}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit full name"
                  className="rounded-md border border-gray-300 p-1.5 dark:border-gray-700"
                >
                  <Pencil size={15} color={iconColor} />
                </TouchableOpacity>
              </View>

              <View className="mt-1 flex-row items-center">
                <Mail size={14} color="#6B7280" />
                <Text className="ml-2 flex-1 text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </Text>
              </View>

              {!!user.createdAt && (
                <Text className="mt-1 text-xs text-gray-400">
                  Member since {new Date(user.createdAt).toDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Personal Information
            </Text>
          </View>

          {/* FULL NAME: NAME ONLY */}
          <TouchableOpacity
            onPress={openNameEditor}
            activeOpacity={0.7}
            className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800"
          >
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Full Name
              </Text>
              <Text className="mt-1 font-medium text-gray-900 dark:text-white">
                {user.name || "Not provided"}
              </Text>
            </View>
            <ChevronRight size={20} color={iconColor} />
          </TouchableOpacity>

          {/* EMAIL */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Email Address
              </Text>
              <Text className="mt-1 font-medium text-gray-900 dark:text-white">
                {user.email}
              </Text>
            </View>

            <View className="flex-row items-center rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
              <Check size={13} color="#16A34A" />
              <Text className="ml-1 text-xs text-green-700 dark:text-green-400">
                Verified
              </Text>
            </View>
          </View>
        </View>

        {/* SECURITY */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Security
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setPasswordModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between px-5 py-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                <Key size={19} color="#6B7280" />
              </View>

              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Password
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  Change your password
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* PREFERENCES */}
        <View className="mb-10 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Preferences
            </Text>
          </View>

          {/* APPEARANCE */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center gap-3">
              {theme === "dark" ? (
                <Sun size={20} color="#FFFFFF" />
              ) : (
                <Moon size={20} color="#6B7280" />
              )}

              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Appearance
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityState={{ checked: theme === "dark" }}
              accessibilityLabel="Toggle appearance"
              className={`h-6 w-12 justify-center rounded-full ${
                theme === "dark" ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white ${
                  theme === "dark" ? "ml-6" : "ml-0.5"
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* LANGUAGE */}
          <View className="flex-row justify-between px-5 py-4">
            <Text className="text-gray-900 dark:text-white">Language</Text>
            <Text className="text-gray-500 dark:text-gray-400">
              English
            </Text>
          </View>
        </View>

        {/* EDIT NAME MODAL */}
        <Modal
          visible={nameModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setNameModal(false)}
        >
          <View className="flex-1 justify-center bg-black/60 px-5">
            <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Full Name
                </Text>

                <TouchableOpacity
                  onPress={() => setNameModal(false)}
                  disabled={savingName}
                  hitSlop={10}
                >
                  <X size={21} color={iconColor} />
                </TouchableOpacity>
              </View>

              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Text>

              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!savingName}
                returnKeyType="done"
                onSubmitEditing={saveName}
                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-[#252525] dark:text-white"
              />

              <View className="mt-6 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => setNameModal(false)}
                  disabled={savingName}
                  className="items-center justify-center rounded-lg px-4 py-3"
                >
                  <Text className="text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveName}
                  disabled={savingName}
                  className="min-w-28 items-center justify-center rounded-lg bg-blue-600 px-5 py-3"
                >
                  {savingName ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-semibold text-white">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* EDIT IMAGE MODAL */}
        <Modal
          visible={imageModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            setImageModal(false);
            setSelectedImage(null);
          }}
        >
          <View className="flex-1 justify-center bg-black/60 px-5">
            <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Profile Image
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setImageModal(false);
                    setSelectedImage(null);
                  }}
                  disabled={savingImage}
                  hitSlop={10}
                >
                  <X size={21} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* IMAGE PREVIEW */}
              <View className="mb-5 items-center">
                <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
                  {(selectedImage || user.profilePic) ? (
                    <Image
                      source={{
                        uri: selectedImage || user.profilePic,
                      }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <User size={42} color={iconColor} />
                    </View>
                  )}
                </View>
              </View>

              {/* CHOOSE IMAGE */}
              <TouchableOpacity
                onPress={chooseImage}
                disabled={savingImage}
                activeOpacity={0.7}
                className="mb-3 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
              >
                <Camera size={18} color={iconColor} />
                <Text className="font-medium text-gray-900 dark:text-white">
                  {selectedImage ? "Choose Another Image" : "Change Image"}
                </Text>
              </TouchableOpacity>

              {/* DELETE IMAGE */}
             <TouchableOpacity
  onPress={deleteImage}
  disabled={savingImage || !user.profilePic}
  activeOpacity={0.7}
  className="flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
>
  <Trash2 size={17} color="#6B7280" />
  <Text className="font-medium text-gray-700 dark:text-gray-300">
    Delete Profile Image
  </Text>
</TouchableOpacity>

              {/* ACTIONS */}
              <View className="mt-5 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setImageModal(false);
                    setSelectedImage(null);
                  }}
                  disabled={savingImage}
                  className="items-center justify-center rounded-lg px-4 py-3"
                >
                  <Text className="text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveImage}
                  disabled={savingImage || !selectedImage}
                  className={`min-w-24 items-center justify-center rounded-lg px-5 py-3 ${
                    selectedImage ? "bg-blue-600" : "bg-gray-400"
                  }`}
                >
                  {savingImage ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-semibold text-white">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CHANGE PASSWORD MODAL */}
        <Modal
          visible={passwordModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPasswordModal(false)}
        >
          <View className="flex-1 justify-center bg-black/50 p-4">
            <PasswordModal
              onCancel={() => setPasswordModal(false)}
              onSave={handleSavePassword}
            />
          </View>
        </Modal>
      </ScrollView>
    </AppLayout>
  );
}
