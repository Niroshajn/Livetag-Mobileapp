import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { XCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export default function EmailVerificationFailed() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black px-4">

      {/* CARD */}
      <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 items-center">

        {/* ICON */}
        <XCircle size={50} color="#dc2626" />

        {/* TITLE */}
        <Text className="text-xl font-semibold text-black dark:text-white mt-4">
          Email Verification Failed
        </Text>

        {/* DESCRIPTION */}
        <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mt-2">
          Oops! We couldn’t verify your email. The link may be invalid or expired.
        </Text>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={() => navigation.replace("Login")} // or "Signup"
          className="w-full bg-red-600 py-3 rounded-xl mt-6"
        >
          <Text className="text-center text-white font-medium">
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}