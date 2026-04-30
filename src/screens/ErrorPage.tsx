import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export default function NotFound() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 bg-white dark:bg-black items-center justify-center px-6">

      {/* 404 */}
      <Text className="text-6xl font-bold text-gray-400">
        404
      </Text>

      {/* Title */}
      <Text className="mt-4 text-xl font-semibold text-gray-900 dark:text-white text-center">
        OOPS PAGE NOT FOUND
      </Text>

      {/* Description */}
      <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </Text>

      {/* Buttons */}
      <View className="mt-6 flex-row gap-4">

        {/* Go Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white rounded"
        >
          <ArrowLeft size={16} color="#fff" />
          <Text className="text-white dark:text-black font-semibold">
            Go Back
          </Text>
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          className="px-4 py-2 bg-gray-900 dark:bg-white rounded"
        >
          <Text className="text-white dark:text-black font-semibold">
            Go Home
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}