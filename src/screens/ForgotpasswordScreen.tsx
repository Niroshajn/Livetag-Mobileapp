import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";

import { RootStackParamList } from "../../App";
import Text from "../components/AppText";
import api from "../lib/api";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type ForgotPasswordResponse = {
  success?: boolean;
  message?: string;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showMessage = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("LIVETAG", message);
    }
  };

  const handleReset = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        {
          email: trimmedEmail,
        }
      );

      showMessage(
        response.data?.message || "Reset link sent to your email!"
      );

      navigation.navigate("Login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Failed to send reset link. Please try again.";

      setError(message);
      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full items-center">
            <View className="relative w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1a1a1a]">
              {/* Back to Login */}
              <Pressable
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
                accessibilityRole="button"
                className="mb-6 flex-row items-center gap-2 self-start"
              >
                <ArrowLeft size={18} color="#9CA3AF" />

                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  Back to Login
                </Text>
              </Pressable>

              {/* LIVETAG Logo */}
              <View className="mb-6 flex-row items-center gap-2">
                <View className="h-6 w-5 items-center justify-center border border-highlight bg-gray-100 dark:bg-black">
                  <Text className="text-sm font-light text-gray-800 dark:text-gray-100">
                    #
                  </Text>
                </View>

                <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                  LIVETAG
                </Text>
              </View>

              {/* Title */}
              <View className="absolute right-0 top-0 rounded-b bg-gray-300 px-3 py-1.5 dark:bg-gray-700">
                <Text className="text-sm font-medium text-gray-800 dark:text-white">
                  FORGOT PASSWORD
                </Text>
              </View>

              {/* Description */}
              <Text className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Enter your email address and we'll send you a link to reset
                your password.
              </Text>

              {/* Email */}
              <View className="mb-5">
                <Text className="mb-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Email Address
                </Text>

                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                  editable={!loading}
                  accessibilityLabel="Email address"
                  className="rounded-md border border-gray-300 bg-gray-100 px-3 py-3 text-black dark:border-gray-700 dark:bg-[#252525] dark:text-white"
                />

                {error ? (
                  <Text className="mt-1.5 text-sm text-red-500">
                    {error}
                  </Text>
                ) : null}
              </View>

              {/* Send Reset Link */}
              <Pressable
                onPress={handleReset}
                disabled={loading}
                accessibilityRole="button"
                className={`min-h-12 flex-row items-center justify-center rounded-md border border-gray-400 px-4 py-3 dark:border-gray-600 ${
                  loading ? "opacity-60" : "active:opacity-70"
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#9CA3AF"
                    />
                    <Text className="ml-2 text-center text-black dark:text-white">
                      Sending...
                    </Text>
                  </>
                ) : (
                  <Text className="text-center font-medium text-black dark:text-white">
                    Send Reset Link
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;