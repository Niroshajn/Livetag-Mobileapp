import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  Camera,
  Key,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Check,
} from "lucide-react-native";
import api from "../lib/api";
import EditProfileModal from "../modal/EditProfileModal";
import PasswordModal from "../modal/PasswordModal";
import AppLayout from "./Layout";
import { useTheme } from "../context/ThemeContext";

type ProfileData = {
  name: string;
  profilePic?: string | null;
};

export default function AccountScreen() {
 const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState({
    name: "",
    email: "", profilePic: "",
    createdAt: "",
  });

  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [name, setName] = useState(user.name);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/user/me");

        const userData = res.data?.userDetail ?? res.data;

        setUser({
          name: userData.name,
          email: userData.email,
          profilePic: userData.profilePic || "",
          createdAt: userData.createdAt,
        });

      } catch (err) {
        console.log("User fetch error:", err);
      }
    };

    fetchUser();
  }, []);
  return (
    <AppLayout>
      <ScrollView className="flex-1 bg-white dark:bg-[#1a1a1a] px-4 pt-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Account
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your profile, security, and preferences
          </Text>
        </View>

        {/* PROFILE CARD */}
        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-5">
          <View className="items-center">

            {/* Avatar */}
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]">
                <View className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center overflow-hidden">
                  {user.profilePic ? (
                    <Image
                      source={{ uri: user.profilePic }}
                      className="w-full h-full"
                    />
                  ) : (
                    <User size={40} color="gray" />
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setEditModal(true)}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full"
              >
                <Camera size={14} color="white" />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <Text className="text-xl font-bold text-gray-900 dark:text-white mt-3">
              {user.name}
            </Text>

            <View className="flex-row items-center mt-1">
              <Mail size={14} color="gray" />
              <Text className="ml-2 text-gray-500 dark:text-gray-400">
                {user.email}
              </Text>
            </View>

            <Text className="text-gray-400 text-sm mt-2">
              Member since {new Date(user.createdAt).toDateString()}
            </Text>

            <TouchableOpacity
              onPress={() => setEditModal(true)}
              className="mt-4 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-900 dark:text-white">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PERSONAL INFO */}
        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl mb-5">
          <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white flex-row">
              Personal Information
            </Text>
          </View>

          <View>
            <View className="px-5 py-4 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500 text-sm">Full Name</Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  {user.name}
                </Text>
              </View>
              <ChevronRight color="gray" />
            </View>

            <View className="px-5 py-4 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500 text-sm">Email</Text>
                <Text className="text-gray-900 dark:text-white font-medium">
                  {user.email}
                </Text>
              </View>

              <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                <Check size={12} color="green" />
                <Text className="text-green-700 text-xs ml-1">
                  Verified
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECURITY */}
        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl mb-5">

          <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Security
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setPasswordModal(true)}
            className="px-5 py-4 flex-row justify-between items-center"
          >
            <View className="flex-row items-center gap-3">
              <Key size={18} color="gray" />
              <Text className="text-gray-900 dark:text-white">
                Password
              </Text>
            </View>
            <ChevronRight color="gray" />
          </TouchableOpacity>

          <View className="px-5 py-4 flex-row justify-between items-center">
            <Text className="text-gray-500">Two-Factor Auth</Text>
            <Text className="text-xs bg-gray-200 px-2 py-1 rounded">
              Coming Soon
            </Text>
          </View>
        </View>

        {/* PREFERENCES */}
        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl mb-10">

          <View className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Preferences
            </Text>
          </View>

          {/* THEME */}
          <View className="px-5 py-3 flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              {theme === "dark" ? (
                <Sun size={20} color="white" />
              ) : (
                <Moon size={20} color="gray" />
              )}
              <Text className="text-gray-900 dark:text-white">
                Appearance
              </Text>
            </View>

            <TouchableOpacity
             onPress={toggleTheme}
              className={`w-12 h-6 rounded-full ${theme === "dark" ? "bg-blue-600" : "bg-gray-300"
                }`}
            >
              <View
                className={`w-5 h-5 bg-white rounded-full mt-[2px] ${theme === "dark" ? "ml-6" : "ml-1"
                  }`}
              />
            </TouchableOpacity>
          </View>

          {/* NOTIFICATION */}
          <View className="px-5 py-3 flex-row justify-between">
            <Text className="text-gray-900 dark:text-white">
              Notifications
            </Text>
            <Text className="text-xs bg-gray-200 px-2 py-1 rounded">
              Coming Soon
            </Text>
          </View>

          {/* LANGUAGE */}
          <View className="px-5 py-3 flex-row justify-between">
            <Text className="text-gray-900 dark:text-white">
              Language
            </Text>
            <Text className="text-gray-500">English</Text>
          </View>
        </View>

        {/* EDIT MODAL */}
        <Modal visible={editModal} transparent animationType="fade">
          <View className="flex-1 justify-center bg-black/50 p-4">
            <EditProfileModal
              user={user}
              onCancel={() => setEditModal(false)}
              onSave={async (data: ProfileData) => {
                try {
                  const res = await api.post("/auth/profile", {
                    name: data.name,
                    profilePic: data.profilePic,
                  });

                  const updatedUser = res.data?.user;

                  setUser((prev) => ({
                    ...prev,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    profilePic: updatedUser.profilePic,
                  }));

                  setEditModal(false); // close modal after save

                } catch (err) {
                  console.log("Update error:", err);
                }
              }}
            />
          </View>
        </Modal>

        {/* PASSWORD MODAL */}
        <Modal visible={passwordModal} transparent animationType="fade">
          <View className="flex-1 justify-center bg-black/50 p-4">
            <PasswordModal onCancel={() => setPasswordModal(false)} />
          </View>
        </Modal>
      </ScrollView>
    </AppLayout>
  );
}