
import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Check,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import Text from "../components/AppText";
import api from "../lib/api";

interface Role {
  id: string;
  name: string;
}

interface CreateUserValues {
  name: string;
  email: string;
  phoneNo: string;
  password: string;
  confirmPassword: string;
  roleId: string;
}

const CreateUserSchema = Yup.object().shape({
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
      /^\+91[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number with +91"
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
    .required("Confirm Password is required"),

  roleId: Yup.string().required("Role is required"),
});

export default function CreateUserScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const iconSize = Math.max(18, Math.min(width * 0.05, 24));

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard visibility
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

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/tenant/roles");

        const responseData = res.data?.data ?? res.data;

        setRoles(Array.isArray(responseData) ? responseData : []);
      } catch (error: any) {
        console.log(
          "FETCH ROLES ERROR:",
          error?.response?.data || error?.message || error
        );

        Alert.alert("Error", "Failed to load roles");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Reusable input field
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    onBlur: (event?: any) => void,
    error?: string,
    options?: {
      placeholder?: string;
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "words" | "sentences";
      maxLength?: number;
      returnKeyType?: "next" | "done" | "go";
    }
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={options?.placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize || "none"}
        maxLength={options?.maxLength}
        returnKeyType={options?.returnKeyType || "next"}
        autoCorrect={false}
        editable
        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-3 rounded-md border border-gray-300 dark:border-gray-700"
      />

      {!!error && (
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );

  const handleCreateUser = async (
    values: CreateUserValues,
    setFieldError: (field: string, message: string) => void,
    setSubmitting: (isSubmitting: boolean) => void
  ) => {
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phoneNo: values.phoneNo.trim(),
        password: values.password,
        roleIds: [values.roleId],
      };

      console.log("CREATE USER REQUEST:", {
        name: payload.name,
        email: payload.email,
        phoneNo: payload.phoneNo,
        roleIds: payload.roleIds,
      });

      const res = await api.post("/tenant/create-user", payload);

      Alert.alert(
        "Success",
        res.data?.message || "User created successfully",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("UserManagement");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "CREATE USER ERROR:",
        error?.response?.data || error?.message || error
      );

      const message =
        error?.response?.data?.message || "Something went wrong";

      if (error?.response?.status === 409) {
        setFieldError("email", message);
      }

      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
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
            <View className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">

              <Formik<CreateUserValues>
                initialValues={{
                  name: "",
                  email: "",
                  phoneNo: "",
                  password: "",
                  confirmPassword: "",
                  roleId: "",
                }}
                validationSchema={CreateUserSchema}
                onSubmit={(values, { setFieldError, setSubmitting }) =>
                  handleCreateUser(values, setFieldError, setSubmitting)
                }
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                }) => (
                  <>
                    {/* Loading overlay */}
                    {isSubmitting && (
                      <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center rounded-2xl">
                        <ActivityIndicator
                          size="large"
                          color="#ffffff"
                        />
                        <Text className="text-white text-sm mt-3">
                          Creating user...
                        </Text>
                      </View>
                    )}

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                      <View className="flex-row items-center gap-2">
                        <View className="w-6 h-7 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                          <Text className="text-sm text-gray-800 dark:text-white">
                            #
                          </Text>
                        </View>

                        <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
                          LIVETAG
                        </Text>
                      </View>

                      <View className="bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
                        <Text className="text-sm font-medium text-gray-800 dark:text-white">
                          CREATE USER
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-5">
                      Create New User
                    </Text>

                    {/* Name */}
                    {renderInput(
                      "Name",
                      values.name,
                      handleChange("name"),
                      handleBlur("name"),
                      touched.name ? errors.name : undefined,
                      {
                        placeholder: "Enter your name",
                        autoCapitalize: "words",
                      }
                    )}

                    {/* Email */}
                    {renderInput(
                      "Email",
                      values.email,
                      handleChange("email"),
                      handleBlur("email"),
                      touched.email ? errors.email : undefined,
                      {
                        placeholder: "Enter your email",
                        keyboardType: "email-address",
                      }
                    )}

                    {/* Phone */}
                    {renderInput(
                      "Phone Number",
                      values.phoneNo,
                      handleChange("phoneNo"),
                      handleBlur("phoneNo"),
                      touched.phoneNo ? errors.phoneNo : undefined,
                      {
                        placeholder: "+919876543210",
                        keyboardType: "phone-pad",
                        maxLength: 13,
                      }
                    )}

                    {/* Role */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Role
                      </Text>

                      <Pressable
                        onPress={() => setShowRoleModal(true)}
                        disabled={rolesLoading || isSubmitting}
                        className="bg-gray-100 dark:bg-[#252525] px-3 py-3 rounded-md border border-gray-300 dark:border-gray-700 flex-row items-center justify-between"
                      >
                        <Text
                          className={`${
                            values.roleId
                              ? "text-black dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {rolesLoading
                            ? "Loading roles..."
                            : roles.find(
                                (role) => role.id === values.roleId
                              )?.name || "Select Role"}
                        </Text>

                        {rolesLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#6366f1"
                          />
                        ) : (
                          <ChevronDown size={20} color="#9CA3AF" />
                        )}
                      </Pressable>

                      {!!touched.roleId && !!errors.roleId && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.roleId}
                        </Text>
                      )}

                      {!rolesLoading && roles.length === 0 && (
                        <Text className="text-red-500 text-sm mt-1">
                          No roles available
                        </Text>
                      )}
                    </View>

                    {/* Password */}
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Password
                      </Text>

                      <View className="flex-row items-center bg-gray-100 dark:bg-[#252525] px-3 rounded-md border border-gray-300 dark:border-gray-700">
                        <TextInput
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          placeholder="Enter password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPass}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSubmitting}
                          className="flex-1 py-3 text-black dark:text-white"
                        />

                        <Pressable
                          disabled={isSubmitting}
                          onPress={() =>
                            setShowPass((prev) => !prev)
                          }
                        >
                          {showPass ? (
                            <EyeOff size={iconSize} color="#9CA3AF" />
                          ) : (
                            <Eye size={iconSize} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {!!touched.password && !!errors.password && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </Text>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <View className="mb-5">
                      <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Confirm Password
                      </Text>

                      <View className="flex-row items-center bg-gray-100 dark:bg-[#252525] px-3 rounded-md border border-gray-300 dark:border-gray-700">
                        <TextInput
                          value={values.confirmPassword}
                          onChangeText={handleChange("confirmPassword")}
                          onBlur={handleBlur("confirmPassword")}
                          placeholder="Confirm password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showConfirmPass}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSubmitting}
                          onSubmitEditing={() => Keyboard.dismiss()}
                          className="flex-1 py-3 text-black dark:text-white"
                        />

                        <Pressable
                          disabled={isSubmitting}
                          onPress={() =>
                            setShowConfirmPass((prev) => !prev)
                          }
                        >
                          {showConfirmPass ? (
                            <EyeOff size={iconSize} color="#9CA3AF" />
                          ) : (
                            <Eye size={iconSize} color="#9CA3AF" />
                          )}
                        </Pressable>
                      </View>

                      {!!touched.confirmPassword &&
                        !!errors.confirmPassword && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                          </Text>
                        )}
                    </View>

                    {/* Buttons */}
                    <View className="flex-col gap-3 pt-2">
                      <Pressable
                        onPress={() => handleSubmit()}
                        disabled={
                          isSubmitting ||
                          rolesLoading ||
                          roles.length === 0
                        }
                        className={`items-center justify-center rounded-lg py-3 ${
                          isSubmitting ||
                          rolesLoading ||
                          roles.length === 0
                            ? "bg-indigo-400"
                            : "bg-indigo-600"
                        }`}
                      >
                        {isSubmitting ? (
                          <View className="flex-row items-center">
                            <ActivityIndicator
                              color="#ffffff"
                              size="small"
                            />
                            <Text className="text-white font-semibold ml-2">
                              Creating...
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-white font-semibold">
                            Create User
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          navigation.navigate("Dashboard")
                        }
                        disabled={isSubmitting}
                        className="items-center justify-center border border-gray-300 dark:border-gray-700 rounded-lg py-3"
                      >
                        <Text className="font-semibold text-gray-700 dark:text-white">
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                    {/* Role selection modal */}
                    <Modal
                      visible={showRoleModal}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowRoleModal(false)}
                    >
                      <Pressable
                        onPress={() => setShowRoleModal(false)}
                        className="flex-1 bg-black/50 justify-end"
                      >
                        <Pressable
                          onPress={(event) => event.stopPropagation()}
                          className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl p-5 max-h-[65%]"
                        >
                          <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">
                              Select Role
                            </Text>

                            <Pressable
                              onPress={() => setShowRoleModal(false)}
                            >
                              <X size={22} color="#888888" />
                            </Pressable>
                          </View>

                          <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                          >
                            {roles.map((role) => {
                              const selected =
                                values.roleId === role.id;

                              return (
                                <Pressable
                                  key={role.id}
                                  onPress={() => {
                                    setFieldValue("roleId", role.id);
                                    setFieldTouched("roleId", true);
                                    setShowRoleModal(false);
                                  }}
                                  className="flex-row items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700"
                                >
                                  <Text className="text-gray-900 dark:text-white">
                                    {role.name}
                                  </Text>

                                  {selected && (
                                    <Check
                                      size={19}
                                      color="#6366f1"
                                    />
                                  )}
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        </Pressable>
                      </Pressable>
                    </Modal>
                  </>
                )}
              </Formik>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
