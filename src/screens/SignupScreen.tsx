import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  Alert,
    Keyboard,
  useWindowDimensions,
} from "react-native";
import Text from "../components/AppText";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik, type FormikErrors } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react-native";
import { RootStackParamList } from "../../App";
import api from "../lib/api";
import AppButton from "../components/AppButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type SignupValues = {
  name: string;
  email: string;
  phoneNo: string;
  password: string;
  confirmPassword: string;
};

const SignUpSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z]+(?: [a-zA-Z]+)*$/,
      "Only letters and single spaces between words are allowed"
    )
    .min(3, "Minimum 3 characters")
    .required("Name is required"),

  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),

  phoneNo: Yup.string()
    .matches(
      /^(?:\+91)?[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number"
    )
    .required("Phone number is required"),

  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Must contain at least one special character"
    )
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { width } = useWindowDimensions();
  const iconSize = Math.max(18, Math.min(width * 0.05, 24));
const [keyboardVisible, setKeyboardVisible] = useState(false);

useEffect(() => {
  const showEvent =
    Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

  const hideEvent =
    Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

  const showSubscription = Keyboard.addListener(showEvent, () => {
    setKeyboardVisible(true);
  });

  const hideSubscription = Keyboard.addListener(hideEvent, () => {
    setKeyboardVisible(false);
  });

  return () => {
    showSubscription.remove();
    hideSubscription.remove();
  };
}, []);
  const showMessage = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

const handleSignupAPI = async (
  values: SignupValues,
  setErrors: (
    errors: FormikErrors<SignupValues>
  ) => void
) => {
  if (loading) return;

  setLoading(true);

  try {
    // 1. Get the selected organization
    const tenantData = await AsyncStorage.getItem(
      "activeTenant"
    );

    if (!tenantData) {
      showMessage("Please select your organization first");

      navigation.replace("TenantSelection");
      return;
    }

    const tenant = JSON.parse(tenantData);

    if (!tenant?.id || !tenant?.domain) {
      showMessage("Invalid organization. Please select again.");

      navigation.replace("TenantSelection");
      return;
    }

    console.log("SIGNUP TENANT:", tenant.domain);

    // 2. Normalize phone number
    const phone = values.phoneNo.trim();

    const normalizedPhone = phone.startsWith("+91")
      ? phone
      : `+91${phone}`;

    // 3. Register under the selected tenant
    const res = await api.post("/auth/register", {
      name: values.name.trim(),
      email: values.email.trim(),
      phoneNo: normalizedPhone,
      password: values.password,
    });

    if (res.status >= 200 && res.status < 300) {
      showMessage(
        res.data?.message || "Registration successful"
      );

      // 4. Return to login for the same organization
      navigation.replace("Login");
      return;
    }

    const message = res.data?.message || "Signup failed";

    setErrors({ email: message });
    showMessage(message);

  } catch (err: any) {
    console.log(
      "SIGNUP ERROR:",
      err?.response?.data || err?.message || err
    );

    if (!err?.response) {
      showMessage("Server unreachable. Please try again.");
      return;
    }

    const backendMessage =
      err.response?.data?.message || "Something went wrong";

    if (err.response.status === 409) {
      setErrors({ email: backendMessage });
    }

    showMessage(backendMessage);

  } finally {
    setLoading(false);
  }
};

  return (
   <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: keyboardVisible ? "flex-start" : "center",
              paddingHorizontal: 16,
              paddingTop: keyboardVisible ? 12 : 24,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View className="w-full items-center">
            <View className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              {loading && (
                <View className="absolute inset-0 z-50 bg-black/70 items-center justify-center rounded-lg">
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text className="text-white text-sm mt-3">
                    Creating account...
                  </Text>
                </View>
              )}

              {/* HEADER */}
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

              {/* TOP RIGHT LABEL */}
              <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
                <Text className="text-sm font-medium text-gray-800 dark:text-white">
                  SIGN UP
                </Text>
              </View>

              <Formik<SignupValues>
                initialValues={{
                  name: "",
                  email: "",
                  phoneNo: "",
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={SignUpSchema}
                onSubmit={(values, { setErrors }) =>
                  handleSignupAPI(values, setErrors)
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
                    {/* NAME */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Name
                      </Text>

                      <TextInput
                        placeholder="Enter your name"
                        placeholderTextColor="#9CA3AF"
                        value={values.name}
                        onChangeText={handleChange("name")}
                        onBlur={handleBlur("name")}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        editable={!loading}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />

                      {errors.name && touched.name && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {errors.name}
                        </Text>
                      )}
                    </View>

                    {/* EMAIL */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Email
                      </Text>

                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        editable={!loading}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />

                      {errors.email && touched.email && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    {/* PHONE NUMBER */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Phone Number
                      </Text>

                      <TextInput
                        placeholder="+919876543210"
                        placeholderTextColor="#9CA3AF"
                        value={values.phoneNo}
                        onChangeText={handleChange("phoneNo")}
                        onBlur={handleBlur("phoneNo")}
                        keyboardType="phone-pad"
                        maxLength={13}
                        returnKeyType="next"
                        editable={!loading}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />

                      {errors.phoneNo && touched.phoneNo && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {errors.phoneNo}
                        </Text>
                      )}
                    </View>

                    {/* PASSWORD */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Password
                      </Text>

                      <View className="relative">
                        <TextInput
                          placeholder="Enter password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPass}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          editable={!loading}
                          className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                        />

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPass ? "Hide password" : "Show password"
                          }
                          disabled={loading}
                          onPress={() => setShowPass((prev) => !prev)}
                          className="absolute right-3 top-2.5"
                        >
                          {showPass ? (
                            <EyeOff size={iconSize} color="#9CA3AF" />
                          ) : (
                            <Eye size={iconSize} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {errors.password && touched.password && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {errors.password}
                        </Text>
                      )}
                    </View>

                    {/* CONFIRM PASSWORD */}
                    <View>
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Confirm Password
                      </Text>

                      <View className="relative">
                        <TextInput
                          placeholder="Confirm password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showConfirmPass}
                          value={values.confirmPassword}
                          onChangeText={handleChange("confirmPassword")}
                          onBlur={handleBlur("confirmPassword")}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          editable={!loading}
                          onSubmitEditing={() => Keyboard.dismiss()}
                          className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                        />

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            showConfirmPass
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          disabled={loading}
                          onPress={() =>
                            setShowConfirmPass((prev) => !prev)
                          }
                          className="absolute right-3 top-2.5"
                        >
                          {showConfirmPass ? (
                            <EyeOff size={iconSize} color="#9CA3AF" />
                          ) : (
                            <Eye size={iconSize} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {errors.confirmPassword &&
                        touched.confirmPassword && (
                          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {errors.confirmPassword}
                          </Text>
                        )}
                    </View>

                    {/* BUTTONS */}
                    <View className="flex-col gap-3 pt-2">
                      <AppButton
                        title={loading ? "Creating..." : "Sign Up"}
                        onPress={() => handleSubmit()}
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
};

export default SignupScreen;
