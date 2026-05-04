import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react-native";
import api from "../lib/api";
import { launchImageLibrary } from "react-native-image-picker";
import { Image } from "react-native";
import { colorScheme, useColorScheme } from "nativewind";
export type ConnectorMode = "config" | "design" | "playground";

export type PluginInstance = {
  id: string;
  instanceKey: string;
  connectorType: string;
  config: Record<string, any>;
  scope?: "author" | "user";
  oauthTokenId?: string | null;
};

type ConfigFormProps = {
  instance: PluginInstance;
  connectors: any[];
  onConfigChange: (id: string, config: Record<string, any>) => void;
  mode: ConnectorMode;
  sessionId: string;
};

function ConfigForm({
  instance,
  connectors,
  onConfigChange,
  mode,
  sessionId,
}: ConfigFormProps) {
  const connector = connectors.find(
    (c) => c.type === instance.connectorType
  );

  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!connector?.schema?.config) return null;

  const isFileEnabled =
    mode === "playground" && instance.scope === "user";

  return (
    <>
      {Object.entries(connector.schema.config).map(([key, field]: any) => {
        const isImage =
          connector?.type === "image" ||
          connector?.schema?.category === "image";

        /* ================= IMAGE ================= */
        if (isImage && mode !== "design") {
          return (
            <View key={key} className="mb-4">
              <Text className="text-xs text-gray-900 dark:text-gray-400 mb-2">
                {field.label}
              </Text>

              {/* ✅ CURRENT IMAGE (FROM BACKEND) */}
              {instance.config?.[key] && !selectedImage && (
                <Image
                  source={{ uri: instance.config[key] + "?t=" + Date.now() }}
                  key={instance.config[key]}   // 🔥 FORCE REFRESH
                  className="w-full h-32"
                  resizeMode="cover"
                />
              )}

              {/* PICK IMAGE */}
              <TouchableOpacity
                disabled={!isFileEnabled}
                onPress={() => {
                  launchImageLibrary(
                    { mediaType: "photo" },
                    (res) => {
                      const uri = res.assets?.[0]?.uri;
                      if (uri) setSelectedImage(uri);
                    }
                  );
                }}
                className="bg-gray-400 dark:bg-gray-700 px-3 py-2 rounded mt-2"
              >
                <Text className="text-white text-xs">
                  Choose Image
                </Text>
              </TouchableOpacity>

              {/* ✅ SELECTED IMAGE PREVIEW */}
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-32 rounded mt-2"
                  resizeMode="cover"
                />
              )}

              {/* UPLOAD */}
              {selectedImage && (
                <TouchableOpacity
                  disabled={uploading}
                  onPress={async () => {
                    try {
                      setUploading(true);

                      const formData = new FormData();
                      formData.append("file", {
                        uri: selectedImage,
                        name: "upload.jpg",
                        type: "image/jpeg",
                      } as any);

                      const res = await api.post("/upload", formData, {
                        headers: {
                          "Content-Type": "multipart/form-data",
                        },
                      });

                      const fileUrl = res.data.url;

                      const updatedConfig = {
                        ...instance.config,
                        [key]: fileUrl,
                      };

                      onConfigChange(instance.id, updatedConfig);

                      await api.patch(
                        `/playground/${sessionId}/connector-instance/${instance.id}`,
                        { config: updatedConfig }
                      );

                      setSelectedImage(null);
                    } catch (err) {
                      console.log("Upload failed", err);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="bg-blue-600 px-3 py-2 rounded mt-2"
                >
                  <Text className="text-white text-xs">
                    {uploading ? "Uploading..." : "Upload"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* DELETE (ONLY AFTER UPLOAD EXISTS) */}
              {instance.config?.[key] && !selectedImage && (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setUploading(true);

                      await api.delete(
                        `/playground/${sessionId}/connector-instance/${instance.id}/delete-image`
                      );

                      const updatedConfig = {
                        ...instance.config,
                        [key]: "",
                      };

                      onConfigChange(instance.id, updatedConfig);
                    } catch (err) {
                      console.log("Delete failed", err);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="bg-gray-300 dark:bg-gray-600 px-3 py-2 rounded mt-2"
                >
                  <Text className="text-gray-900 dark:text-white text-xs">
                    Delete
                  </Text>
                </TouchableOpacity>
              )}

              {uploading && <ActivityIndicator />}
            </View>
          );
        }        /* ================= TEXT ================= */
        return (
          <View key={key} className="mb-3">
            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1 p-2">
              {field.label}
            </Text>

            <TextInput
              value={instance.config?.[key] || ""}
              onChangeText={(text) => {
                const updatedConfig = {
                  ...instance.config,
                  [key]: text,
                };
                console.log("CONFIG AFTER UPLOAD:", instance.config);
                // ✅ UI FIRST
                onConfigChange(instance.id, updatedConfig);

                // ✅ API (non-blocking)
                api.patch(
                  `/playground/${sessionId}/connector-instance/${instance.id}`,
                  { config: updatedConfig }
                );
              }}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white "
            />
          </View>
        );
      })}
    </>
  );
}

type ConnectorCardProps = {
  sessionId: string;
  mode: ConnectorMode;
  instance: PluginInstance;
  connectors: any[];
  openInstanceId?: string | null;
  setOpenInstanceId?: (id: string | null) => void;
  onConfigChange: (id: string, config: Record<string, any>) => void;
  onDisconnect?: (id: string) => void;
  onStartOAuth?: (id: string, provider: string) => void;
};

export function ConnectorCard({
  mode,
  sessionId,
  instance,
  connectors,
  openInstanceId,
  setOpenInstanceId,
  onConfigChange,
  onDisconnect,
  onStartOAuth,
}: ConnectorCardProps) {
  const connector = connectors.find(
    (c) => c.type === instance.connectorType
  );

  const isOpen = openInstanceId === instance.id;
  const isConnected = !!instance.oauthTokenId;
  const { colorScheme } = useColorScheme();
  return (
    <View className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] mb-3">
      <TouchableOpacity
        onPress={() =>
          setOpenInstanceId?.(isOpen ? null : instance.id)
        }
        className="flex-row justify-between px-4 py-3"
      >
        <View>
          <Text className="text-blue-400 text-sm">
            {"{{ " + instance.instanceKey + " }}"}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs p-2">
            {connector?.schema?.label}
          </Text>
        </View>
        {isOpen ? (
          <ChevronUp
            size={18}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        ) : (
          <ChevronDown
            size={18}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View className="px-4 pb-4  border-t border-gray-300 dark:border-gray-600">
          {/* OAuth */}
          {connector?.schema?.oauth && (
            <View className="mt-3 mb-4">
              {isConnected ? (
                <View className="flex-row justify-between items-center bg-green-900 px-3 py-6 rounded">
                  <Text className="text-green-400 text-sm">
                    Connected
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDisconnect?.(instance.id)}
                  >
                    <Text className="bg-gray-300 dark:bg-gray-600 px-3 py-2 rounded text-gray-900 dark:text-white text-xs">
                    <Text className="text-gray-900 dark:text-white text-xs">
                      Logout
                    </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    onStartOAuth?.(
                      instance.id,
                      connector.schema.oauth.provider
                    )
                  }
                  className="bg-blue-600 py-2 rounded"
                >
                  <Text className="text-gray-900 dark:text-white text-xs text-center">
                    Connect {connector.schema.oauth.provider}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* CONFIG */}
          <ConfigForm
            instance={instance}
            connectors={connectors}
            onConfigChange={onConfigChange}
            mode={mode}
            sessionId={sessionId}
          />
        </View>
      )}
    </View>
  );
}