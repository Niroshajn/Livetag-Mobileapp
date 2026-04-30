// src/screens/ResetPasswordScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Formik } from "formik";
import * as Yup from "yup";
import api from "../lib/api";
import AppButton from "../components/AppButton";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ResetSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[0-9]/, "Must include a number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must include a special character")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (values: any) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        newPassword: values.password,
        token: values.token, // token should come from params or route
      });
      console.log(res.data);
      navigation.navigate("Login");
    } catch (err: any) {
      console.log("Error:", err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#f3f4f6", // gray-100
        }}
      >
        <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800 relative">

          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Reset Password
          </Text>

          {loading && (
            <View className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center rounded-lg">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white mt-2">Resetting...</Text>
            </View>
          )}

          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={ResetSchema}
            onSubmit={handleResetPassword}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View className="gap-4">
                {/* Password */}
                <View>
                  <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">New Password</Text>
                  <View className="relative">
                    <TextInput
                      value={values.password}
                      onChangeText={handleChange("password")}
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPass}
                      className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                    />
                    <Pressable
                      onPress={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5"
                    >
                      {showPass ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                    </Pressable>
                  </View>
                  {touched.password && errors.password && (
                    <Text className="text-sm text-red-500 mt-1">{errors.password}</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View>
                  <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">Confirm Password</Text>
                  <View className="relative">
                    <TextInput
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      placeholder="Confirm password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPass}
                      className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5"
                    >
                      {showConfirmPass ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                    </Pressable>
                  </View>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <Text className="text-sm text-red-500 mt-1">{errors.confirmPassword}</Text>
                  )}
                </View>

                {/* Buttons using AppButton */}
                <View className="flex-col gap-3 mt-4">
                  <AppButton
                    title={loading ? "Resetting..." : "Reset Password"}
                    onPress={handleSubmit as any}
                    variant="primary"
                    disabled={loading}
                  />

                  <AppButton
                    title="Back to Login"
                    onPress={() => navigation.navigate("Login")}
                    variant="outline"
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;