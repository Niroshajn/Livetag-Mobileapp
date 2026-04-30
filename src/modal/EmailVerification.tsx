import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { XCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmailVerificationFailed() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center px-4">

        {/* CARD */}
        <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 items-center">

          {/* ICON */}
          <XCircle size={50} color="#dc2626" />

          {/* TITLE */}
          <Text className="text-xl font-semibold text-black dark:text-white mt-4 text-center">
            Email Verification Failed
          </Text>

          {/* DESCRIPTION */}
          <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mt-2">
            The verification link is invalid or has expired. Please try again.
          </Text>

          {/* PRIMARY BUTTON */}
          <TouchableOpacity
            onPress={() => navigation.replace("Signup")} // better than login here
            className="w-full bg-red-600 py-3 rounded-xl mt-6"
          >
            <Text className="text-center text-white font-medium">
              Create Account Again
            </Text>
          </TouchableOpacity>

          {/* SECONDARY ACTION */}
          <TouchableOpacity
            onPress={() => navigation.replace("Login")}
            className="mt-3"
          >
            <Text className="text-blue-500 text-sm">
              Go to Login instead
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}