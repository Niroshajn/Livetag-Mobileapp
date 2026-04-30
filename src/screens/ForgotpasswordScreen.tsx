import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const validate = () => {
        if (!email.includes("@")) {
            setError("Invalid email");
            return false;
        }
        setError("");
        return true;
    };

    const handleReset = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            console.log("Reset email:", email);

            setTimeout(() => {
                setLoading(false);
                navigation.navigate("Login");
            }, 1500);

        } catch (err) {
            setLoading(false);
            setError("Something went wrong");
        }
    };

    return (
        <View className="flex-1 bg-gray-100 dark:bg-black justify-center items-center px-4">
            <View className="w-full max-w-md bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                <Pressable
                    onPress={() => navigation.navigate("Login")}
                    className="mb-4"
                >
                    <Text className="text-gray-500 dark:text-gray-400">
                        ← Back to Login
                    </Text>
                </Pressable>
                {/* Logo */}
                <View className="flex-row items-center gap-2">
                    <View className="w-5 h-6 items-center justify-center border border-blue-300 bg-gray-100 dark:bg-black">
                        <Text className="text-xs text-gray-800 dark:text-gray-100">#</Text>
                    </View>

                    <Text className="text-lg font-semibold text-white p-2">
                        LIVETAG
                    </Text>
                </View>

                {/* Title Tag */}
                <View className="absolute right-0  bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded-b">
                    <Text className="text-sm text-gray-800 dark:text-white">
                        FORGOT PASSWORD
                    </Text>
                </View>

                {/* Description */}
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Enter your email to receive a reset link.
                </Text>
                {error ? (
                    <Text className="text-red-500 mb-3">{error}</Text>
                ) : null}
                <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-700 mb-4"
                />
                <Pressable
                    onPress={handleReset}
                    className="border border-gray-400 p-3 rounded-md"
                >
                    {loading ? (
                        <ActivityIndicator />
                    ) : (
                        <Text className="text-center text-black dark:text-white">
                            Send Reset Link
                        </Text>
                    )}
                </Pressable>

            </View>
        </View>
    );
};

export default ForgotPasswordScreen;