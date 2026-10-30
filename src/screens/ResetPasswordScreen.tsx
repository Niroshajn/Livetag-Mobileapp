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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { Formik } from "formik";
import * as Yup from "yup";

import { RootStackParamList } from "../../App";
import Text from "../components/AppText";
import AppButton from "../components/AppButton";
import api from "../lib/api";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "ResetPassword"
>;

type ResetPasswordResponse = {
  success?: boolean;
  message?: string;
};

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

const ResetSchema = Yup.object({
  password: Yup.string()
    .min(8, "Must be at least 8 characters")
    .matches(/[0-9]/, "Must contain a number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Must contain a special character"
    )
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const ResetPasswordScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = route.params?.token;

  const showMessage = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("LIVETAG", message);
    }
  };

  const handleResetPassword = async (values: ResetFormValues) => {
    if (loading) return;

    if (!token?.trim()) {
      showMessage("Invalid or expired password reset link.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<ResetPasswordResponse>(
        "/auth/reset-password",
        {
          token,
          newPassword: values.password,
        }
      );

      showMessage(
        response.data?.message || "Password reset successfully"
      );

      navigation.navigate("Login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Unable to reset password. Please try again.";

      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token?.trim()) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 px-6 dark:bg-black">
        <View className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <Text className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            Invalid Reset Link
          </Text>

          <Text className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            This password reset link is missing its token or has expired.
            Please request a new link.
          </Text>

          <AppButton
            title="Forgot Password"
            onPress={() => navigation.navigate("ForgotPassword")}
            variant="primary"
          />

          <View className="mt-3">
            <AppButton
              title="Back to Login"
              onPress={() => navigation.navigate("Login")}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <View className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1a1a1a]">
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

              {/* Title Tag */}
              <View className="absolute right-0 top-0 rounded-b bg-gray-300 px-3 py-1.5 dark:bg-gray-700">
                <Text className="text-sm font-medium text-gray-800 dark:text-white">
                  RESET PASSWORD
                </Text>
              </View>

              <Text className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Enter your new password and confirm it to reset your account
                password.
              </Text>

              <Formik<ResetFormValues>
                initialValues={{
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={ResetSchema}
                validateOnMount
                onSubmit={handleResetPassword}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  isValid,
                }) => (
                  <View className="gap-5">
                    {/* New Password */}
                    <View>
                      <Text className="mb-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                        New Password
                      </Text>

                      <View className="relative justify-center">
                        <TextInput
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          placeholder="Enter your password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          editable={!loading}
                          returnKeyType="next"
                          accessibilityLabel="New password"
                          className="rounded-md border border-gray-300 bg-gray-100 py-3 pl-3 pr-12 text-black dark:border-gray-700 dark:bg-[#252525] dark:text-white"
                        />

                        <Pressable
                          onPress={() =>
                            setShowPassword((previous) => !previous)
                          }
                          disabled={loading}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-3 items-center justify-center"
                          hitSlop={8}
                        >
                          {showPassword ? (
                            <EyeOff size={20} color="#9CA3AF" />
                          ) : (
                            <Eye size={20} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {touched.password && errors.password ? (
                        <Text className="ml-1 mt-1.5 text-sm text-red-500">
                          {errors.password}
                        </Text>
                      ) : null}
                    </View>

                    {/* Confirm Password */}
                    <View>
                      <Text className="mb-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Confirm Password
                      </Text>

                      <View className="relative justify-center">
                        <TextInput
                          value={values.confirmPassword}
                          onChangeText={handleChange("confirmPassword")}
                          onBlur={handleBlur("confirmPassword")}
                          placeholder="Confirm password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          editable={!loading}
                          returnKeyType="done"
                          onSubmitEditing={() => handleSubmit()}
                          accessibilityLabel="Confirm password"
                          className="rounded-md border border-gray-300 bg-gray-100 py-3 pl-3 pr-12 text-black dark:border-gray-700 dark:bg-[#252525] dark:text-white"
                        />

                        <Pressable
                          onPress={() =>
                            setShowConfirmPassword((previous) => !previous)
                          }
                          disabled={loading}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="absolute right-3 items-center justify-center"
                          hitSlop={8}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} color="#9CA3AF" />
                          ) : (
                            <Eye size={20} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {touched.confirmPassword && errors.confirmPassword ? (
                        <Text className="ml-1 mt-1.5 text-sm text-red-500">
                          {errors.confirmPassword}
                        </Text>
                      ) : null}
                    </View>

                    {/* Buttons */}
                    <View className="mt-2 gap-3">
                      <AppButton
                        title={loading ? "Resetting..." : "Reset Password"}
                        onPress={() => handleSubmit()}
                        variant="primary"
                        disabled={loading || !isValid}
                      />

                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color="#9CA3AF"
                        />
                      ) : null}

                      <AppButton
                        title="Back to Login"
                        onPress={() => navigation.navigate("Login")}
                        variant="outline"
                        disabled={loading}
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;