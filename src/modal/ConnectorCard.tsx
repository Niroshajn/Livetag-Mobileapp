import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
  InteractionManager,
} from "react-native";

import Text from "../components/AppText";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
} from "lucide-react-native";
import api from "../lib/api";
import {
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from "react-native-image-picker";
import { useColorScheme } from "nativewind";
import { uploadToS3 } from "../types/uploadtoS3";
import { UploadType } from "../types/upload";

export type ConnectorMode = "config" | "design" | "playground";
export type OAuthProvider = "google" | "notion";

export type PluginInstance = {
  id: string;
  instanceKey: string;
  connectorType: string;
  config: Record<string, any>;
  configScope?: "author" | "user";
  scope?: "author" | "user";
  isConnected?: boolean;
  oauthTokenId?: string | null;
  playgroundSessionId?: string;
};

type SelectedImage = {
  key: string;
  uri: string;
  type: string;
  fileName: string;
};

type ConfigFormProps = {
  instance: PluginInstance;
  connectors: any[];
  onConfigChange: (id: string, config: Record<string, any>) => void;
  disabled?: boolean;
  mode: ConnectorMode;
  sessionId: string;
  cropAspect?: number;
  onImageUploaded?: () => void;
  scrollInputIntoView: (target: TextInput | null) => void;
};

type ConnectorCardProps = {
  sessionId: string;
  mode: ConnectorMode;
  instance: PluginInstance;
  connectors: any[];
  openInstanceId?: string | null;
  setOpenInstanceId?: (id: string | null) => void;
  onRemove?: (instanceKey: string) => void | Promise<void>;
  onUpdateScope?: (id: string, scope: "author" | "user") => void;
  onConfigChange: (id: string, config: Record<string, any>) => void;
  onDisconnect?: (id: string) => void | Promise<void>;
  onStartOAuth?: (
    id: string,
    provider: OAuthProvider
  ) => void | Promise<void>;
  onImageUploaded?: () => void;
  cropAspect?: number;
};

function getSafeFileName(asset: Asset): string {
  if (asset.fileName) return asset.fileName;

  const extension = asset.type?.split("/")[1] || "jpg";
  return `upload-${Date.now()}.${extension}`;
}

function getMimeType(asset: Asset): string {
  if (asset.type) return asset.type;

  const fileName = asset.fileName?.toLowerCase() || "";

  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";

  if (
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    return "image/heic";
  }

  return "image/jpeg";
}

function withCacheBust(url: string, version: number): string {
  if (!url) return "";

  return `${url}${url.includes("?") ? "&" : "?"}t=${version}`;
}

function ConfigForm({
  instance,
  connectors,
  onConfigChange,
  disabled = false,
  mode,
  sessionId,
  cropAspect = 1,
  onImageUploaded,
  scrollInputIntoView,
}: ConfigFormProps) {
  const connector = connectors.find(
    (item) => item.type === instance.connectorType
  );

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<SelectedImage | null>(null);
  const [imageVersion, setImageVersion] = useState(Date.now());

  // Keep the actual native TextInput refs.
  // Do not use event.target as a TextInput ref.
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const isFileEnabled =
    mode === "playground" &&
    instance.scope === "user" &&
    !disabled;

  const chooseImage = useCallback(
    (key: string) => {
      if (!isFileEnabled) return;

      launchImageLibrary(
        {
          mediaType: "photo",
          selectionLimit: 1,
          quality: 1,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) return;

          if (response.errorCode) {
            Alert.alert(
              "Image Picker",
              response.errorMessage || "Unable to select image."
            );
            return;
          }

          const asset = response.assets?.[0];

          if (!asset?.uri) {
            Alert.alert("Image Picker", "No image was selected.");
            return;
          }

          setSelectedImage({
            key,
            uri: asset.uri,
            type: getMimeType(asset),
            fileName: getSafeFileName(asset),
          });
        }
      );
    },
    [isFileEnabled]
  );

  const uploadImage = useCallback(
    async (key: string, image: SelectedImage) => {
      if (!isFileEnabled) return;

      try {
        setUploadingKey(key);

        const fileUrl = await uploadToS3(
          image.uri,
          UploadType.PLAYGROUND_CONNECTOR_INSTANCE,
          {
            playgroundConnectorConfigInstanceId: instance.id,
          },
          image.fileName,
          image.type
        );

        const updatedConfig = {
          ...instance.config,
          [key]: fileUrl,
        };

        const response = await api.patch(
          `/playground/${sessionId}/connector-instance/${instance.id}`,
          { config: updatedConfig }
        );

        const savedConfig = response.data?.config ?? updatedConfig;

        onConfigChange(instance.id, savedConfig);
        setSelectedImage(null);
        setImageVersion(Date.now());
        onImageUploaded?.();

        Alert.alert("Success", "Image uploaded successfully.");
      } catch (error: any) {
        console.log(
          "Image upload error:",
          error?.response?.data ?? error
        );

        Alert.alert(
          "Upload failed",
          String(
            error?.response?.data?.message ??
              error?.response?.data?.error ??
              error?.message ??
              "Unable to upload image."
          )
        );
      } finally {
        setUploadingKey(null);
      }
    },
    [
      isFileEnabled,
      instance.id,
      instance.config,
      sessionId,
      onConfigChange,
      onImageUploaded,
    ]
  );

  const deleteImage = useCallback(
    async (key: string) => {
      if (!isFileEnabled || !instance.config?.[key]) return;

      try {
        setUploadingKey(key);

        await api.delete(
          `/playground/${sessionId}/connector-instance/${instance.id}/delete-image`
        );

        const updatedConfig = {
          ...instance.config,
          [key]: "",
        };

        onConfigChange(instance.id, updatedConfig);

        setSelectedImage((current) =>
          current?.key === key ? null : current
        );

        setImageVersion(Date.now());
        onImageUploaded?.();

        Alert.alert("Image deleted", "Image deleted successfully.");
      } catch (error: any) {
        console.log(
          "Delete image failed:",
          error?.response?.data ?? error
        );

        Alert.alert(
          "Delete failed",
          String(
            error?.response?.data?.message ??
              error?.response?.data?.error ??
              error?.message ??
              "Unable to delete image."
          )
        );
      } finally {
        setUploadingKey(null);
      }
    },
    [
      isFileEnabled,
      instance.id,
      instance.config,
      sessionId,
      onConfigChange,
      onImageUploaded,
    ]
  );

  if (!connector?.schema?.config) return null;

  const isImageConnector =
    connector.type === "image" ||
    connector.schema?.category === "image";

  return (
    <View className="gap-5">
      {Object.entries(connector.schema.config).map(
        ([key, field]: [string, any]) => {
          const label = field?.label || key;

          if (isImageConnector && mode !== "design") {
            const currentImageUrl = instance.config?.[key];

            const selectedForThisField =
              selectedImage?.key === key ? selectedImage : null;

            const isUploading = uploadingKey === key;
            const hasCurrentImage = !!currentImageUrl;

            const previewUri =
              selectedForThisField?.uri ||
              (hasCurrentImage
                ? withCacheBust(
                    String(currentImageUrl),
                    imageVersion
                  )
                : null);

            return (
              <View key={key} className="gap-3">
                <Text
                  bold
                  className="text-[10px] uppercase tracking-widest text-gray-500"
                >
                  {label}
                </Text>

                <TouchableOpacity
                  disabled={!isFileEnabled || isUploading}
                  onPress={() => chooseImage(key)}
                  activeOpacity={0.7}
                  className={`self-start rounded px-4 py-2 ${
                    isFileEnabled && !isUploading
                      ? "bg-gray-500"
                      : "bg-gray-300 dark:bg-gray-800"
                  }`}
                >
                  <Text bold className="text-xs text-white">
                    {hasCurrentImage || selectedForThisField
                      ? "Change Image"
                      : "Choose Image"}
                  </Text>
                </TouchableOpacity>

                {previewUri && (
                  <View className="h-40 w-40 overflow-hidden rounded border border-gray-300 dark:border-gray-700">
                    <Image
                      source={{ uri: previewUri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                )}

                {selectedForThisField && (
                  <Text className="text-[10px] text-gray-500">
                    {selectedForThisField.fileName}
                  </Text>
                )}

                {selectedForThisField && (
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      disabled={!isFileEnabled || isUploading}
                      onPress={() =>
                        uploadImage(key, selectedForThisField)
                      }
                      className={`rounded px-4 py-2 ${
                        isUploading ? "bg-blue-400" : "bg-blue-600"
                      }`}
                    >
                      <View className="flex-row items-center gap-2">
                        {isUploading && (
                          <ActivityIndicator
                            size="small"
                            color="#ffffff"
                          />
                        )}

                        <Text bold className="text-xs text-white">
                          {isUploading ? "Uploading..." : "Upload"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isUploading}
                      onPress={() => setSelectedImage(null)}
                      className="rounded bg-gray-200 px-4 py-2 dark:bg-gray-700"
                    >
                      <Text
                        bold
                        className="text-xs text-gray-900 dark:text-white"
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {hasCurrentImage && !selectedForThisField && (
                  <TouchableOpacity
                    disabled={!isFileEnabled || isUploading}
                    onPress={() => deleteImage(key)}
                    className={`self-start rounded px-4 py-2 ${
                      isFileEnabled && !isUploading
                        ? "bg-gray-500"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  >
                    <Text bold className="text-xs text-white">
                      {isUploading ? "Deleting..." : "Delete"}
                    </Text>
                  </TouchableOpacity>
                )}

                {!isFileEnabled && (
                  <Text className="text-[10px] text-gray-400">
                    Image upload is available for user-scoped playground connectors.
                  </Text>
                )}

                {cropAspect > 0 && (
                  <Text className="text-[10px] text-gray-400">
                    Aspect ratio: {cropAspect.toFixed(2)}
                  </Text>
                )}
              </View>
            );
          }

          const value = instance.config?.[key];

          const isBooleanField =
            field?.type === "boolean" ||
            typeof value === "boolean" ||
            value === "true" ||
            value === "false";

          const isDateField =
            /date/i.test(key) || /date/i.test(label);

          return (
            <View key={key} className="gap-2">
              <Text
                bold
                className="text-[10px] uppercase tracking-widest text-gray-500"
              >
                {label}
              </Text>

              {isBooleanField ? (
                <View className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-[#0d0d0d]">
                  <Text className="flex-1 text-xs text-gray-900 dark:text-white">
                    {value === true || value === "true"
                      ? "Enabled"
                      : "Disabled"}
                  </Text>

                  <Switch
                    value={value === true || value === "true"}
                    disabled={disabled}
                    onValueChange={(checked) =>
                      onConfigChange(instance.id, {
                        ...instance.config,
                        [key]: checked,
                      })
                    }
                    trackColor={{
                      false: "#9ca3af",
                      true: "#2563eb",
                    }}
                    thumbColor="#ffffff"
                  />
                </View>
              ) : (
                <TextInput
                  ref={(input) => {
                    inputRefs.current[key] = input;
                  }}
                  editable={!disabled}
                  value={value == null ? "" : String(value)}
                  onFocus={() => {
                    // Pass the actual TextInput instance.
                    scrollInputIntoView(inputRefs.current[key]);
                  }}
                  onBlur={() => {
                    // Keep the ref available until React unmounts it.
                  }}
                  onChangeText={(text) =>
                    onConfigChange(instance.id, {
                      ...instance.config,
                      [key]: text,
                    })
                  }
                  placeholder={
                    field?.placeholder ||
                    (isDateField
                      ? `${label} (YYYY-MM-DD)`
                      : field?.label || key)
                  }
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline={false}
                  selectTextOnFocus={false}
                  keyboardType={
                    isDateField
                      ? "numbers-and-punctuation"
                      : "default"
                  }
                  returnKeyType="done"
                  blurOnSubmit={false}
                  className={`w-full rounded border border-gray-300 px-3 py-3 text-xs dark:border-gray-700 ${
                    disabled
                      ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
                      : "bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-white"
                  }`}
                />
              )}
            </View>
          );
        }
      )}
    </View>
  );
}

export function ConnectorCard({
  mode,
  sessionId,
  instance,
  connectors,
  openInstanceId,
  setOpenInstanceId,
  onRemove,
  onUpdateScope,
  onConfigChange,
  onDisconnect,
  onStartOAuth,
  onImageUploaded,
  cropAspect = 1,
}: ConnectorCardProps) {
  const connector = connectors.find(
    (item) => item.type === instance.connectorType
  );

  const isCollapsible = mode !== "config";
  const isOpen = !isCollapsible || openInstanceId === instance.id;

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#ffffff" : "#111111";

  const isConnected = !!instance.oauthTokenId;
  const oauthProvider = connector?.schema?.oauth?.provider;

  const isSupportedOAuthProvider =
    oauthProvider === "google" || oauthProvider === "notion";

  const { height: windowHeight } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const viewportHeightRef = useRef(0);
  const pendingScrollRef = useRef<{ cancel?: () => void } | null>(
    null
  );

  const connectorFormMaxHeight = Math.max(
    180,
    Math.min(560, windowHeight * 0.65)
  );

  const toggleOpen = () => {
    if (!isCollapsible || !setOpenInstanceId) return;

    setOpenInstanceId(isOpen ? null : instance.id);
  };

  /**
   * Scroll the real focused input into the visible part
   * of the connector's inner ScrollView.
   */
const scrollInputIntoView = useCallback(
  (target: TextInput | null) => {
    if (!target) return;

    focusedInputRef.current = target;

    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        const currentScroll = scrollRef.current;
        const input = focusedInputRef.current;

        if (!currentScroll || !input) return;

        // Get the actual native ScrollView component.
        const scrollNativeRef = currentScroll.getNativeScrollRef();

        if (!scrollNativeRef) return;

        input.measureLayout(
          scrollNativeRef,
          (_x, y, _width, height) => {
            const viewportHeight =
              viewportHeightRef.current || connectorFormMaxHeight;

            const topPadding = 20;
            const bottomPadding = 48;

            const inputBottom = y + height;
            const visibleBottom = viewportHeight - bottomPadding;

            if (inputBottom > visibleBottom) {
              currentScroll.scrollTo({
                y: Math.max(
                  0,
                  inputBottom - visibleBottom + 12
                ),
                animated: true,
              });
            } else if (y < topPadding) {
              currentScroll.scrollTo({
                y: Math.max(0, y - topPadding),
                animated: true,
              });
            }
          },
          () => {
            // Layout may not be ready while Android resizes
            // the screen for the keyboard.
          }
        );
      });
    });

    pendingScrollRef.current = task;
  },
  [connectorFormMaxHeight]
);

  // When the keyboard appears, scroll the focused field again.
  // This is useful on devices that resize the screen later.
  useEffect(() => {
    const keyboardShowSubscription = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        const focusedInput = focusedInputRef.current;

        if (focusedInput) {
          scrollInputIntoView(focusedInput);
        }
      }
    );

    return () => {
      keyboardShowSubscription.remove();
      pendingScrollRef.current?.cancel?.();
    };
  }, [scrollInputIntoView]);

  const handleDisconnect = async () => {
    if (isDisconnecting) return;

    setIsDisconnecting(true);

    try {
      await api.delete(
        `/playground/connector/${instance.id}/oauth/detach`
      );

      await onDisconnect?.(instance.id);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.log(
          "Disconnect failed:",
          error?.response?.data ?? error
        );

        Alert.alert(
          "Logout failed",
          String(
            error?.response?.data?.message ??
              error?.response?.data?.error ??
              error?.message ??
              "Unable to disconnect account."
          )
        );
      } else {
        await onDisconnect?.(instance.id);
      }
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleStartOAuth = () => {
    if (
      instance.scope === "author" ||
      !onStartOAuth ||
      !isSupportedOAuthProvider
    ) {
      return;
    }

    Promise.resolve(
      onStartOAuth(instance.id, oauthProvider as OAuthProvider)
    ).catch((error) => {
      console.log("OAuth connect failed:", error);

      Alert.alert("OAuth", "Unable to connect account.");
    });
  };

  const handleRemove = () => {
    if (!onRemove || isRemoving) return;

    Alert.alert(
      "Remove connector",
      `Are you sure you want to remove "${instance.instanceKey}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsRemoving(true);

            try {
              await onRemove(instance.instanceKey);
            } catch (error) {
              console.log("Remove connector failed:", error);

              Alert.alert(
                "Remove failed",
                "Unable to remove connector."
              );
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0d0d0d]">
      <TouchableOpacity
        activeOpacity={isCollapsible ? 0.7 : 1}
        disabled={!isCollapsible || !setOpenInstanceId}
        onPress={toggleOpen}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1">
          <Text className="text-sm text-blue-600 dark:text-blue-400">
            {"{{ " + instance.instanceKey + " }}"}
          </Text>

          <Text
            bold
            className="mt-1 text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-500"
          >
            {connector?.schema?.label || instance.connectorType}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {onRemove && (
            <TouchableOpacity
              disabled={isRemoving}
              onPress={handleRemove}
              hitSlop={8}
              className="p-1"
            >
              <Trash2 size={17} color={iconColor} />
            </TouchableOpacity>
          )}

          {isCollapsible &&
            (isOpen ? (
              <ChevronUp size={18} color={iconColor} />
            ) : (
              <ChevronDown size={18} color={iconColor} />
            ))}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <KeyboardAvoidingView
          style={{ flexShrink: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
<ScrollView
  ref={scrollRef}
  style={{
    maxHeight: connectorFormMaxHeight,
    flexShrink: 1,
  }}
  contentContainerStyle={{
    padding: 16,
    paddingBottom: 150,
  }}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode={
    Platform.OS === "ios" ? "interactive" : "on-drag"
  }
  nestedScrollEnabled
  automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
  showsVerticalScrollIndicator
>
            <View className="gap-5">
              {connector?.schema?.oauth && (
                <View className="gap-3">
                  <Text
                    bold
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    Authentication Required
                  </Text>

                  {isConnected ? (
                    <View className="flex-row items-center justify-between gap-2 rounded border border-green-500/20 bg-green-400/5 px-3 py-3">
                      <View className="flex-1 flex-row items-center gap-2">
                        <CheckCircle2 size={17} color="#4ade80" />

                        <Text className="flex-1 text-xs text-green-400">
                          Connected to {oauthProvider || "Account"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        disabled={isDisconnecting}
                        onPress={handleDisconnect}
                        className={`rounded px-3 py-2 ${
                          isDisconnecting
                            ? "bg-gray-400"
                            : "bg-gray-500"
                        }`}
                      >
                        <Text bold className="text-xs text-white">
                          {isDisconnecting
                            ? "Logging out..."
                            : "Logout"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={
                        instance.scope === "author" ||
                        !onStartOAuth ||
                        !isSupportedOAuthProvider
                      }
                      onPress={handleStartOAuth}
                      className={`w-full rounded py-3 ${
                        instance.scope === "author" ||
                        !onStartOAuth ||
                        !isSupportedOAuthProvider
                          ? "bg-blue-300 dark:bg-blue-900"
                          : "bg-blue-600"
                      }`}
                    >
                      <Text
                        bold
                        className="text-center text-xs text-white"
                      >
                        Connect {oauthProvider || "Account"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {onUpdateScope && (
                <View className="gap-2">
                  <Text
                    bold
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    Config Scope
                  </Text>

                  <View className="flex-row rounded border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-black">
                    {(["author", "user"] as const).map((scope) => {
                      const selectedScope =
                        instance.configScope ??
                        instance.scope ??
                        "user";

                      const selected = selectedScope === scope;

                      return (
                        <TouchableOpacity
                          key={scope}
                          disabled={selected}
                          onPress={() =>
                            onUpdateScope(instance.id, scope)
                          }
                          className={`flex-1 items-center rounded py-2 ${
                            selected ? "bg-white dark:bg-gray-800" : ""
                          }`}
                        >
                          <Text
                            bold={selected}
                            className={`text-[10px] uppercase ${
                              selected
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {scope}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className="gap-3">
                <Text
                  bold
                  className="text-[10px] uppercase tracking-widest text-gray-500"
                >
                  Parameters
                </Text>

                <ConfigForm
                  instance={instance}
                  connectors={connectors}
                  onConfigChange={onConfigChange}
                  disabled={
                    mode === "playground" &&
                    instance.scope === "author"
                  }
                  mode={mode}
                  sessionId={sessionId}
                  cropAspect={cropAspect}
                  onImageUploaded={onImageUploaded}
                  scrollInputIntoView={scrollInputIntoView}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
