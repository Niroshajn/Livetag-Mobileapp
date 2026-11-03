
import React, { useState } from "react";
import {
  View,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import Text from "../components/AppText";
import AppButton from "../components/AppButton";
import api from "../lib/api";

import {
  normalizeTenantDomain,
  resolveTenant,
} from "../services/tenantService";

import type { Tenant } from "../types/tenant";

type Props = {
  navigation: any;
  onTenantSelected: () => void;
};

const TenantSelectionScreen = ({
  navigation,
  onTenantSelected,
}: Props) => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!domain.trim()) {
      Alert.alert(
        "Organization required",
        "Please enter your organization URL."
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // 1. Normalize the manually entered organization URL
      const hostname = normalizeTenantDomain(domain);

      console.log("ENTERED ORGANIZATION:", hostname);

      // 2. Find the organization using the backend
      const tenant: Tenant = await resolveTenant(hostname);

      if (!tenant?.id || !tenant?.domain) {
        throw new Error("Invalid organization details received.");
      }

      // 3. Clear previous tenant authentication
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "isAdmin",
      ]);

      // 4. Save the newly identified organization
      await AsyncStorage.setItem(
        "activeTenant",
        JSON.stringify(tenant)
      );

      // 5. Set organization headers
      api.defaults.headers.common["X-Tenant-ID"] =
        tenant.id;

      api.defaults.headers.common["X-Tenant-Domain"] =
        tenant.domain;

      console.log("ORGANIZATION IDENTIFIED:", tenant.domain);

      // 6. Update App.tsx state
      onTenantSelected();

      // 7. Navigate to Login screen
      navigation.replace("Login");

    } catch (error: any) {
      console.log(
        "TENANT RESOLUTION ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Organization not found",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to identify your organization. Please check the URL."
      );
    } finally {
      setLoading(false);
    }
  };

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
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">

            {/* Organization Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                # LIVETAG
              </Text>

              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Enter your organization URL to continue
              </Text>
            </View>

            {/* Organization URL Input */}
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization URL
            </Text>

            <TextInput
              value={domain}
              onChangeText={setDomain}
              placeholder="test.livetag.in"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="url"
              keyboardType="url"
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={handleContinue}
              className="bg-gray-100 dark:bg-[#252525] text-black dark:text-white px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700"
            />

            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Example: test.livetag.in
            </Text>

            {/* Continue Button */}
            <View className="mt-6">
              <AppButton
                title="Continue"
                onPress={handleContinue}
                loading={loading}
                variant="outline"
              />
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View className="flex-row items-center justify-center mt-4">
                <ActivityIndicator color="#3B82F6" />

                <Text className="ml-2 text-gray-500 dark:text-gray-400">
                  Identifying organization...
                </Text>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TenantSelectionScreen;
