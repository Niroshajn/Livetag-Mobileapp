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
  Alert,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../lib/api";
import AppButton from "../components/AppButton";

type Props = {
  navigation: any;

  // Login success callback from App.tsx
  onLogin: (user: any, token: string) => void;
};

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[a-z]/, "Must contain a lowercase letter")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Must contain a special character"
    )
    .required("Password is required"),
});

const LoginScreen: React.FC<Props> = ({
  navigation,
  onLogin,
}) => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

  const handleLogin = async (values: {
    email: string;
    password: string;
  }) => {
    setLoading(true);

    try {
      console.log("LOGIN REQUEST:", values.email);

      // --------------------------------------------------
      // 1. LOGIN
      // --------------------------------------------------

      const res = await api.post(
        "/auth/login",
        values
      );

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data?.token;

      if (!token) {
        showMessage(
          res.data?.message || "Login failed"
        );
        return;
      }

      // --------------------------------------------------
      // 2. SAVE TOKEN
      // --------------------------------------------------

      await AsyncStorage.setItem(
        "token",
        token
      );

      // --------------------------------------------------
      // 3. GET FULL USER DETAILS
      // --------------------------------------------------

      const userRes = await api.get(
        "/auth/user/me"
      );

      const fullUser = userRes.data;

      console.log(
        "FULL USER:",
        fullUser
      );

      // --------------------------------------------------
      // 4. CHECK ADMIN ROLE
      // --------------------------------------------------

      const isAdmin =
        fullUser?.roles?.some(
          (role: any) => {
            if (typeof role === "string") {
              return (
                role.toLowerCase() ===
                "admin"
              );
            }

            return (
              role?.name?.toLowerCase() ===
              "admin"
            );
          }
        ) || false;

      console.log(
        "IS ADMIN:",
        isAdmin
      );

      // --------------------------------------------------
      // 5. SAVE USER
      // --------------------------------------------------

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(fullUser)
      );

      // --------------------------------------------------
      // 6. SAVE ADMIN STATUS
      // --------------------------------------------------

      await AsyncStorage.setItem(
        "isAdmin",
        JSON.stringify(isAdmin)
      );

      // --------------------------------------------------
      // 7. LOGIN SUCCESS
      // --------------------------------------------------

      showMessage(
        "Login successful!"
      );

      // --------------------------------------------------
      // 8. UPDATE APP AUTH STATE
      // --------------------------------------------------

      onLogin(
        fullUser,
        token
      );

    } catch (err: any) {
      console.log(
        "LOGIN ERROR:",
        err?.response?.data || err
      );

      // --------------------------------------------------
      // SERVER NOT REACHABLE
      // --------------------------------------------------

      if (!err?.response) {
        showMessage(
          "Server unreachable"
        );

        return;
      }

      // --------------------------------------------------
      // BACKEND ERROR MESSAGE
      // --------------------------------------------------

      const backendMessage =
        err?.response?.data?.message ||
        "Something went wrong";

      // --------------------------------------------------
      // 401 UNAUTHORIZED
      // --------------------------------------------------

      if (
        err?.response?.status === 401
      ) {
        console.log(
          "Unauthorized access - 401",
          backendMessage
        );

        await AsyncStorage.removeItem(
          "token"
        );

        await AsyncStorage.removeItem(
          "user"
        );

        await AsyncStorage.removeItem(
          "isAdmin"
        );
      }

      showMessage(
        backendMessage
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center px-4">
            <View className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <View className="flex-row items-center gap-2 mb-6">
                <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                  <Text className="text-sm font-thin text-gray-800 dark:text-gray-100">
                    #
                  </Text>
                </View>
                <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                  LIVETAG
                </Text>
              </View>
              <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
                <Text className="text-sm font-medium text-gray-800 dark:text-white">
                  LOGIN
                </Text>
              </View>
              {loading && (
                <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center rounded-lg">

                  <ActivityIndicator
                    size="large"
                    color="#ffffff"
                  />

                  <Text className="text-white mt-2">
                    Logging in...
                  </Text>

                </View>
              )}
              <Formik
                initialValues={{
                  email: "",
                  password: "",
                }}
                validationSchema={
                  LoginSchema
                }
                onSubmit={
                  handleLogin
                }
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <View className="gap-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Email
                      </Text>
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={values.email}
                        onChangeText={handleChange(
                          "email"
                        )}
                        onBlur={handleBlur(
                          "email"
                        )}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />
                      {errors.email &&
                        touched.email && (
                          <Text className="text-gray-400 text-sm mt-1">
                            {errors.email}
                          </Text>
                        )}
                    </View>
                    <View>

                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Password
                      </Text>

                      <View className="relative">

                        <TextInput
                          placeholder="Enter your password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={
                            !showPass
                          }
                          value={
                            values.password
                          }
                          onChangeText={handleChange(
                            "password"
                          )}
                          onBlur={handleBlur(
                            "password"
                          )}
                          className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                        />

                        <Pressable
                          onPress={() =>
                            setShowPass(
                              !showPass
                            )
                          }
                          className="absolute right-3 top-2.5"
                        >
                          {showPass ? (
                            <EyeOff
                              size={18}
                              color="#9CA3AF"
                            />
                          ) : (
                            <Eye
                              size={18}
                              color="#9CA3AF"
                            />
                          )}
                        </Pressable>

                      </View>

                      {errors.password &&
                        touched.password && (
                          <Text className="text-gray-400 text-sm mt-1">
                            {
                              errors.password
                            }
                          </Text>
                        )}

                    </View>
                    <View className="flex-col gap-3 pt-2">
                      <AppButton
                        title={
                          loading
                            ? "Logging in..."
                            : "Login"
                        }
                       onPress={() => handleSubmit()}
                        variant="outline"
                        loading={
                          loading
                        }
                      />
                      <AppButton
                        title="Sign Up"
                        onPress={() =>
                          navigation.navigate(
                            "Signup"
                          )
                        }
                        variant="secondary"
                      />
                    </View>
                    <View className="items-center">
                      <Pressable
                        onPress={() =>
                          navigation.navigate(
                            "ForgotPassword"
                          )
                        }
                      >
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                          Forgot Password?
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Formik>
              {/* FOOTER */}
              <View className="items-center mt-4 gap-2">

                <Pressable
                  onPress={() =>
                    navigation.navigate(
                      "TermsOfService"
                    )
                  }
                >
                  <Text className="text-xs text-gray-500 dark:text-gray-400 underline">
                    Terms of Service
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    navigation.navigate(
                      "PrivacyPolicy"
                    )
                  }
                >
                  <Text className="text-xs text-gray-500 dark:text-gray-400 underline">
                    Privacy Policy
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;