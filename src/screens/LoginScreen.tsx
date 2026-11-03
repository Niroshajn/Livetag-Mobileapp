// import React, { useState , useEffect} from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {
//   View,
//   TextInput,
//   Pressable,
//   ScrollView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Keyboard,
//   Platform,
//   ToastAndroid,
//   Alert,
// } from "react-native";
// import Text from "../components/AppText";
// import { Eye, EyeOff } from "lucide-react-native";
// import { Formik } from "formik";
// import * as Yup from "yup";
// import { SafeAreaView } from "react-native-safe-area-context";

// import api from "../lib/api";
// import AppButton from "../components/AppButton";

// type Props = {
//   navigation: any;

//   // Login success callback from App.tsx
//   onLogin: (user: any, token: string) => void;
// };

// const LoginSchema = Yup.object().shape({
//   email: Yup.string()
//     .email("Invalid email")
//     .required("Email is required"),

//   password: Yup.string()
//     .min(6, "Password must be at least 6 characters")
//     .matches(/[a-z]/, "Must contain a lowercase letter")
//     .matches(/[A-Z]/, "Must contain an uppercase letter")
//     .matches(
//       /[!@#$%^&*(),.?":{}|<>]/,
//       "Must contain a special character"
//     )
//     .required("Password is required"),
// });

// const LoginScreen: React.FC<Props> = ({
//   navigation,
//   onLogin,
// }) => {
//   const [showPass, setShowPass] = useState(false);
//   const [loading, setLoading] = useState(false);

// const [keyboardVisible, setKeyboardVisible] = useState(false);

// useEffect(() => {
//   const showEvent =
//     Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

//   const hideEvent =
//     Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

//   const showSubscription = Keyboard.addListener(showEvent, () => {
//     setKeyboardVisible(true);
//   });

//   const hideSubscription = Keyboard.addListener(hideEvent, () => {
//     setKeyboardVisible(false);
//   });

//   return () => {
//     showSubscription.remove();
//     hideSubscription.remove();
//   };
// }, []);

//   const showMessage = (message: string) => {
//     if (Platform.OS === "android") {
//       ToastAndroid.show(message, ToastAndroid.SHORT);
//     } else {
//       Alert.alert("", message);
//     }
//   };


// const handleLogin = async (values: {
//   email: string;
//   password: string;
// }) => {
//   setLoading(true);

//   try {
//     // 1. Get selected tenant
//     const tenantData = await AsyncStorage.getItem(
//       "activeTenant"
//     );

//     if (!tenantData) {
//       showMessage("Please select your organization first");

//       navigation.replace("TenantSelection");
//       return;
//     }

//     const tenant = JSON.parse(tenantData);

//     // 2. Set tenant headers
//     api.defaults.headers.common["X-Tenant-ID"] =
//       tenant.id;

//     api.defaults.headers.common["X-Tenant-Domain"] =
//       tenant.domain;

//     console.log("LOGIN TENANT:", tenant.domain);

//     // 3. Login
//     const res = await api.post(
//       "/auth/login",
//       values
//     );

//     const token = res.data?.token;

//     if (!token) {
//       showMessage(
//         res.data?.message || "Login failed"
//       );
//       return;
//     }

//     // 4. Save token
//     await AsyncStorage.setItem("token", token);

//     // 5. Get full user details
//     const userRes = await api.get(
//       "/auth/user/me"
//     );

//     const fullUser = userRes.data;

//     // 6. Check admin role
//     const isAdmin =
//       fullUser?.roles?.some((role: any) => {
//         if (typeof role === "string") {
//           return role.toLowerCase() === "admin";
//         }

//         return (
//           role?.name?.toLowerCase() === "admin"
//         );
//       }) || false;

//     // 7. Save user details
//     await AsyncStorage.setItem(
//       "user",
//       JSON.stringify(fullUser)
//     );

//     await AsyncStorage.setItem(
//       "isAdmin",
//       JSON.stringify(isAdmin)
//     );

//     // 8. Update authentication context
//     onLogin(fullUser, token);

//     showMessage("Login successful!");

//   } catch (err: any) {
//     console.log(
//       "LOGIN ERROR:",
//       err?.response?.data || err
//     );

//     if (!err?.response) {
//       showMessage("Server unreachable");
//       return;
//     }

//     const backendMessage =
//       err?.response?.data?.message ||
//       "Something went wrong";

//     if (err?.response?.status === 401) {
//       await AsyncStorage.multiRemove([
//         "token",
//         "user",
//         "isAdmin",
//       ]);
//     }

//     showMessage(backendMessage);

//   } finally {
//     setLoading(false);
//   }
// };


//   return (
//  <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={0}
//       >
//         <ScrollView
//           style={{ flex: 1 }}
//           contentContainerStyle={{
//             flexGrow: 1,
//             justifyContent: keyboardVisible ? "flex-start" : "center",
//             paddingHorizontal: 16,
//             paddingTop: keyboardVisible ? 12 : 24,
//             paddingBottom: 32,
//           }}
//           keyboardShouldPersistTaps="handled"
//           keyboardDismissMode={
//             Platform.OS === "ios" ? "interactive" : "on-drag"
//           }
//           showsVerticalScrollIndicator={false}
//           nestedScrollEnabled
//         >
//           <View className="w-full items-center">
//             <View className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
//               <View className="flex-row items-center gap-2 mb-6">
//                 <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
//                   <Text className="text-sm font-thin text-gray-800 dark:text-gray-100">
//                     #
//                   </Text>
//                 </View>
//                 <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
//                   LIVETAG
//                 </Text>
//               </View>
//               <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
//                 <Text className="text-sm font-medium text-gray-800 dark:text-white">
//                   LOGIN
//                 </Text>
//               </View>
//               {loading && (
//                 <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center rounded-lg">

//                   <ActivityIndicator
//                     size="large"
//                     color="#ffffff"
//                   />

//                   <Text className="text-white mt-2">
//                     Logging in...
//                   </Text>

//                 </View>
//               )}
//               <Formik
//                 initialValues={{
//                   email: "",
//                   password: "",
//                 }}
//                 validationSchema={
//                   LoginSchema
//                 }
//                 onSubmit={
//                   handleLogin
//                 }
//               >
//                 {({
//                   handleChange,
//                   handleBlur,
//                   handleSubmit,
//                   values,
//                   errors,
//                   touched,
//                 }) => (
//                   <View className="gap-4">
//                     <View>
//                       <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
//                         Email
//                       </Text>
//                       <TextInput
//                         placeholder="Enter your email"
//                         placeholderTextColor="#9CA3AF"
//                         keyboardType="email-address"
//                         autoCapitalize="none"
//                         autoCorrect={false}
//                         value={values.email}
//                         onChangeText={handleChange(
//                           "email"
//                         )}
//                         onBlur={handleBlur(
//                           "email"
//                         )}
//                         className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
//                       />
//                       {errors.email &&
//                         touched.email && (
//                           <Text className="text-gray-400 text-sm mt-1">
//                             {errors.email}
//                           </Text>
//                         )}
//                     </View>
//                     <View>

//                       <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
//                         Password
//                       </Text>

//                       <View className="relative">

//                         <TextInput
//                           placeholder="Enter your password"
//                           placeholderTextColor="#9CA3AF"
//                           secureTextEntry={
//                             !showPass
//                           }
//                           value={
//                             values.password
//                           }
//                           onChangeText={handleChange(
//                             "password"
//                           )}
//                           onBlur={handleBlur(
//                             "password"
//                           )}
//                           className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
//                         />

//                         <Pressable
//                           onPress={() =>
//                             setShowPass(
//                               !showPass
//                             )
//                           }
//                           className="absolute right-3 top-2.5"
//                         >
//                           {showPass ? (
//                             <EyeOff
//                               size={18}
//                               color="#9CA3AF"
//                             />
//                           ) : (
//                             <Eye
//                               size={18}
//                               color="#9CA3AF"
//                             />
//                           )}
//                         </Pressable>

//                       </View>

//                       {errors.password &&
//                         touched.password && (
//                           <Text className="text-gray-400 text-sm mt-1">
//                             {
//                               errors.password
//                             }
//                           </Text>
//                         )}

//                     </View>
//                     <View className="flex-col gap-3 pt-2">
//                       <AppButton
//                         title={
//                           loading
//                             ? "Logging in..."
//                             : "Login"
//                         }
//                        onPress={() => handleSubmit()}
//                         variant="outline"
//                         loading={
//                           loading
//                         }
//                       />
//                       <AppButton
//                         title="Sign Up"
//                         onPress={() =>
//                           navigation.navigate(
//                             "Signup"
//                           )
//                         }
//                         variant="secondary"
//                       />
//                     </View>
//                     <View className="items-center">
//                       <Pressable
//                         onPress={() =>
//                           navigation.navigate(
//                             "ForgotPassword"
//                           )
//                         }
//                       >
//                         <Text className="text-sm text-gray-500 dark:text-gray-400">
//                           Forgot Password?
//                         </Text>
//                       </Pressable>
//                     </View>
//                   </View>
//                 )}
//               </Formik>
//               {/* FOOTER */}
//               <View className="items-center mt-4 gap-2">

//                 <Pressable
//                   onPress={() =>
//                     navigation.navigate(
//                       "TermsOfService"
//                     )
//                   }
//                 >
//                   <Text className="text-xs text-gray-500 dark:text-gray-400 underline">
//                     Terms of Service
//                   </Text>
//                 </Pressable>

//                 <Pressable
//                   onPress={() =>
//                     navigation.navigate(
//                       "PrivacyPolicy"
//                     )
//                   }
//                 >
//                   <Text className="text-xs text-gray-500 dark:text-gray-400 underline">
//                     Privacy Policy
//                   </Text>
//                 </Pressable>
//               </View>
//             </View>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default LoginScreen;


import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";

import Text from "../components/AppText";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../lib/api";
import AppButton from "../components/AppButton";

type Props = {
  navigation: any;
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [tenantDomain, setTenantDomain] = useState("");

  // ------------------------------------------
  // KEYBOARD LISTENERS
  // ------------------------------------------

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      showEvent,
      () => setKeyboardVisible(true)
    );

    const hideSubscription = Keyboard.addListener(
      hideEvent,
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ------------------------------------------
  // GET CURRENT TENANT
  // ------------------------------------------

  useEffect(() => {
    const getTenant = async () => {
      try {
        const tenantData = await AsyncStorage.getItem(
          "activeTenant"
        );

        if (tenantData) {
          const tenant = JSON.parse(tenantData);
          setTenantDomain(tenant?.domain || "");
        }
      } catch (error) {
        console.log("GET TENANT ERROR:", error);
      }
    };

    getTenant();
  }, []);

  // ------------------------------------------
  // SHOW MESSAGE
  // ------------------------------------------

  const showMessage = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

  // ------------------------------------------
  // CHANGE ORGANIZATION
  // ------------------------------------------

  const handleChangeOrganization = () => {
    if (loading) return;

    Keyboard.dismiss();

    // Replace Login with Tenant Selection.
    // This prevents returning to the old Login screen.
    navigation.replace("TenantSelection");
  };

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

  const handleLogin = async (values: {
    email: string;
    password: string;
  }) => {
    if (loading) return;

    setLoading(true);

    try {
      // 1. Get selected tenant
      const tenantData = await AsyncStorage.getItem(
        "activeTenant"
      );

      if (!tenantData) {
        showMessage(
          "Please select your organization first"
        );

        navigation.replace("TenantSelection");
        return;
      }

      const tenant = JSON.parse(tenantData);

      if (!tenant?.id || !tenant?.domain) {
        showMessage("Invalid organization. Please select again.");

        navigation.replace("TenantSelection");
        return;
      }

      // 2. Set tenant headers
      api.defaults.headers.common["X-Tenant-ID"] =
        tenant.id;

      api.defaults.headers.common["X-Tenant-Domain"] =
        tenant.domain;

      console.log("LOGIN TENANT:", tenant.domain);

      // 3. Login API
      const res = await api.post(
        "/auth/login",
        values
      );

      const token = res.data?.token;

      if (!token) {
        showMessage(
          res.data?.message || "Login failed"
        );
        return;
      }

      // 4. Save token
      await AsyncStorage.setItem("token", token);

      // 5. Get full user details
      const userRes = await api.get(
        "/auth/user/me"
      );

      const fullUser = userRes.data;

      // 6. Check admin role
      const isAdmin =
        fullUser?.roles?.some((role: any) => {
          if (typeof role === "string") {
            return role.toLowerCase() === "admin";
          }

          return (
            role?.name?.toLowerCase() === "admin"
          );
        }) || false;

      // 7. Save user details
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(fullUser)
      );

      await AsyncStorage.setItem(
        "isAdmin",
        JSON.stringify(isAdmin)
      );

      // 8. Update authentication context
      onLogin(fullUser, token);

      showMessage("Login successful!");

    } catch (err: any) {
      console.log(
        "LOGIN ERROR:",
        err?.response?.data || err
      );

      if (!err?.response) {
        showMessage("Server unreachable");
        return;
      }

      const backendMessage =
        err?.response?.data?.message ||
        "Something went wrong";

      if (err?.response?.status === 401) {
        await AsyncStorage.multiRemove([
          "token",
          "user",
          "isAdmin",
        ]);
      }

      showMessage(backendMessage);

    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // UI
  // ------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">

      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === "ios" ? "padding" : "height"
        }
        keyboardVerticalOffset={0}
      >

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: keyboardVisible
              ? "flex-start"
              : "center",
            paddingHorizontal: 16,
            paddingTop: keyboardVisible ? 12 : 24,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >

          <View className="w-full items-center">

            <View className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">

              {/* CHANGE ORGANIZATION BUTTON */}

              <Pressable
                onPress={handleChangeOrganization}
                disabled={loading}
                className="flex-row items-center self-start mb-5"
              >
                <ArrowLeft
                  size={18}
                  color="#3B82F6"
                />

                <Text className="text-sm text-blue-500 ml-2 font-medium">
                  Change Organization
                </Text>
              </Pressable>

              {/* ORGANIZATION DOMAIN */}

              {!!tenantDomain && (
                <View className="mb-5 bg-gray-100 dark:bg-[#252525] rounded-md px-3 py-2">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Selected Organization
                  </Text>

                  <Text className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {tenantDomain}
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

              <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
                <Text className="text-sm font-medium text-gray-800 dark:text-white">
                  LOGIN
                </Text>
              </View>

              {/* LOADING OVERLAY */}

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

              {/* LOGIN FORM */}

              <Formik
                initialValues={{
                  email: "",
                  password: "",
                }}
                validationSchema={LoginSchema}
                onSubmit={handleLogin}
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

                    {/* EMAIL */}

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
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        editable={!loading}
                        className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      />

                      {errors.email && touched.email && (
                        <Text className="text-gray-400 text-sm mt-1">
                          {errors.email}
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
                          placeholder="Enter your password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPass}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          editable={!loading}
                          className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 pr-10"
                        />

                        <Pressable
                          onPress={() => setShowPass(!showPass)}
                          disabled={loading}
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

                      {errors.password && touched.password && (
                        <Text className="text-gray-400 text-sm mt-1">
                          {errors.password}
                        </Text>
                      )}

                    </View>

                    {/* BUTTONS */}

                    <View className="flex-col gap-3 pt-2">

                      <AppButton
                        title={
                          loading
                            ? "Logging in..."
                            : "Login"
                        }
                        onPress={() => handleSubmit()}
                        variant="outline"
                        loading={loading}
                      />

                      <AppButton
                        title="Sign Up"
                        onPress={() =>
                          navigation.navigate("Signup")
                        }
                        variant="secondary"
                      />

                    </View>

                    {/* FORGOT PASSWORD */}

                    <View className="items-center">

                      <Pressable
                        onPress={() =>
                          navigation.navigate("ForgotPassword")
                        }
                        disabled={loading}
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
                    navigation.navigate("TermsOfService")
                  }
                >
                  <Text className="text-xs text-gray-500 dark:text-gray-400 underline">
                    Terms of Service
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    navigation.navigate("PrivacyPolicy")
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
