import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import api from "../lib/api";
import AppButton from "../components/AppButton";
import { Formik } from "formik";
import * as Yup from "yup";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: any;
  onLogin: () => void; // 🔥 ADD THIS
};
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const LoginScreen: React.FC<Props> = ({ navigation, onLogin }) => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", values);
      if (res.data?.token) {
        await AsyncStorage.setItem("token", res.data.token);
        ToastAndroid.show("Login successful!", ToastAndroid.SHORT);

        onLogin(); 
      } else {
        ToastAndroid.show(res.data?.message || "Login failed", ToastAndroid.SHORT);
      }
    } catch (err: any) {
      ToastAndroid.show(err?.response?.data?.message || "Something went wrong", ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center px-4">
            <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <View className="flex-row items-center gap-2">
                <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                  <Text className="text-xs text-gray-800 dark:text-gray-100">#</Text>
                </View>

                <Text className="text-lg font-semibold text-black dark:text-white ml-2 ">
                  LIVETAG
                </Text>
              </View>
              {/* LOGIN TAG */}
              <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded-bl">
                <Text className="text-sm text-gray-800 dark:text-white">LOGIN</Text>
              </View>
              {/* Loader */}
              {loading && (
                <View className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center rounded-lg">
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text className="text-white mt-2">Logging in...</Text>
                </View>
              )}
              {/* Formik */}
              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={LoginSchema}
                onSubmit={handleLogin}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <View className="gap-4 mt-4">
                    {/* Email */}
                    <View>
                      <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">Email</Text>
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />
                      {errors.email && touched.email && (
                        <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                      )}
                    </View>
                    {/* Password */}
                    <View>
                      <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1 mt-4">Password</Text>
                      <View className="relative">
                        <TextInput
                          placeholder="Enter password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPass}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                        />
                        <Pressable
                          onPress={() => setShowPass(!showPass)}
                          className="absolute right-3 top-2.5"
                        >
                          {showPass ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                        </Pressable>
                      </View>
                      {errors.password && touched.password && (
                        <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
                      )}
                    </View>
                    {/* Buttons */}
                    <View className="flex-col gap-3 mt-6">
                      <AppButton
                        title="Login"
                        onPress={handleSubmit}
                        variant="outline"
                        loading={loading}
                      />
                      <AppButton
                        title="Sign Up"
                        onPress={() => navigation.navigate("Signup")}
                        variant="primary"
                      />
                    </View>
                    {/* Forgot */}
                    <Text
                      onPress={() => navigation.navigate("ForgotPassword")}
                      className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      Forgot Password?
                    </Text>
                  </View>
                )}
              </Formik>
              <View className="flex-row justify-center mt-4 gap-4">
                <Text
                  onPress={() => navigation.navigate("TermsOfService")}
                  className="text-blue-500 text-sm"
                >
                  Terms of Service
                </Text>

                <Text className="text-gray-500">|</Text>

                <Text
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                  className="text-blue-500 text-sm"
                >
                  Privacy Policy
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

export default LoginScreen;