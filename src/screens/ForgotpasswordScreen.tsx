
import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import Text from "../components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const validate = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    setError("");
    return true;
  };

  const handleReset = async () => {
    if (loading || !validate()) return;

    try {
      setLoading(true);
      Keyboard.dismiss();

      // Keep your existing reset flow here.
      // This timeout is only a placeholder; it does not send a reset email.
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1500);
      });

      showMessage("Please connect the password reset API.");
    } catch (err) {
      setError("Something went wrong");
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
              {/* BACK TO LOGIN */}
              <Pressable
                onPress={() => navigation.navigate("Login")}
                className="mb-4"
                disabled={loading}
              >
                <Text className="text-gray-500 dark:text-gray-400">
                  ← Back to Login
                </Text>
              </Pressable>

              {/* LOGO */}
              <View className="flex-row items-center gap-2 mb-6">
                <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                  <Text className="text-xs text-gray-800 dark:text-gray-100">
                    #
                  </Text>
                </View>

                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  LIVETAG
                </Text>
              </View>

              {/* TITLE TAG */}
              <View className="absolute right-0 top-0 bg-gray-300 dark:bg-gray-700 px-3 py-1.5 rounded-b">
                <Text className="text-sm text-gray-800 dark:text-white">
                  FORGOT PASSWORD
                </Text>
              </View>

              {/* DESCRIPTION */}
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Enter your email to receive a reset link.
              </Text>

              {error ? (
                <Text className="text-red-500 text-sm mb-3">
                  {error}
                </Text>
              ) : null}

              {/* EMAIL */}
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                editable={!loading}
                accessibilityLabel="Email address"
                className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-700 mb-4"
              />

              {/* SEND RESET LINK */}
              <Pressable
                onPress={handleReset}
                disabled={loading}
                className="border border-gray-400 p-3 rounded-md items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#9CA3AF" />
                ) : (
                  <Text className="text-center text-black dark:text-white">
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
