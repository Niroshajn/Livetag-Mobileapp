import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react-native";
import { RootStackParamList } from "../../App";
import api from "../lib/api";
import { ToastAndroid } from "react-native";
import AppButton from "../components/AppButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SignUpSchema = Yup.object().shape({
  name: Yup.string()
    .matches(/^[a-zA-Z]+(?: [a-zA-Z]+)*$/, "Only letters and single spaces allowed")
    .min(3, "Minimum 3 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignupAPI = async (values: any, setErrors: any) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (res.status >= 200 && res.status < 300) {
        ToastAndroid.show(res.data?.message || "Signup successful!", ToastAndroid.SHORT);
        setTimeout(() => navigation.navigate("Login"), 1000);
      } else {
        setErrors({ email: res.data?.message || "Signup failed" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong";
      if (err?.response?.status === 409) {
        setErrors({ email: msg });
      }
      ToastAndroid.show(msg, ToastAndroid.SHORT);
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
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center px-4">

          <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                <Text className="text-xs text-gray-800 dark:text-gray-100">#</Text>
              </View>

              <Text className="text-lg font-semibold text-black dark:text-white ml-2">
                LIVETAG
              </Text>
            </View>

            {/* SIGNUP TAG */}
            <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded-bl">
              <Text className="text-sm text-gray-800 dark:text-white">SIGN UP</Text>
            </View>

            {/* Loader */}
            {loading && (
              <View className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center rounded-lg">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white mt-2">Creating account...</Text>
              </View>
            )}

            {/* FORM */}
            <Formik
              initialValues={{
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              }}
              validationSchema={SignUpSchema}
              onSubmit={(values, { setErrors }) =>
                handleSignupAPI(values, setErrors)
              }
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View className="gap-4">

                  {/* Name */}
                  <View>
                    <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1 mt-2">Name</Text>
                    <TextInput
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                    />
                    {errors.name && touched.name && (
                      <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                    )}
                  </View>

                  {/* Email */}
                  <View>
                    <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1 mt-4">Email</Text>
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
                  </View>

                  {/* Confirm Password */}
                  <View>
                    <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1 mt-4">Confirm Password</Text>
                    <View className="relative">
                      <TextInput
                        placeholder="Confirm password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPass}
                        value={values.confirmPassword}
                        onChangeText={handleChange("confirmPassword")}
                        onBlur={handleBlur("confirmPassword")}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                      />
                      <Pressable
                        onPress={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5"
                      >
                        {showConfirmPass ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                      </Pressable>
                    </View>
                  </View>

                  {/* Buttons */}
                  <View className="flex-col gap-3 mt-6">
                    <AppButton
                      title="Sign Up"
                      onPress={handleSubmit}
                      variant="outline"
                      loading={loading}
                    />

                    <AppButton
                      title="Back to Login"
                      onPress={() => navigation.navigate("Login")}
                      variant="primary"
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
}
export default SignupScreen;