import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

import {
  ChevronDown,
  ChevronUp,
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
/* ============================================================
   TYPES
============================================================ */

export type ConnectorMode =
  | "config"
  | "design"
  | "playground";

export type OAuthProvider =
  | "google"
  | "notion";

export type PluginInstance = {
  id: string;
  instanceKey: string;
  connectorType: string;

  config: Record<string, any>;

  scope?: "author" | "user";

  oauthTokenId?: string | null;
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

  onConfigChange: (
    id: string,
    config: Record<string, any>
  ) => void;

  mode: ConnectorMode;

  sessionId: string;

  cropAspect?: number;

  /**
   * Optional callback.
   *
   * Useful for the parent screen to increment
   * its image cache version / refresh preview.
   */
  onImageUploaded?: () => void;
};

type ConnectorCardProps = {
  sessionId: string;

  mode: ConnectorMode;

  instance: PluginInstance;

  connectors: any[];

  openInstanceId?: string | null;

  cropAspect?: number;

  setOpenInstanceId?: (
    id: string | null
  ) => void;

  onConfigChange: (
    id: string,
    config: Record<string, any>
  ) => void;

  onDisconnect?: (
    id: string
  ) => void | Promise<void>;

  onStartOAuth?: (
    id: string,
    provider: OAuthProvider
  ) => void | Promise<void>;

  /**
   * Optional callback for refreshing the preview
   * after image upload/delete.
   */
  onImageUploaded?: () => void;
};

/* ============================================================
   HELPERS
============================================================ */

/**
 * Make a safe filename for React Native FormData.
 */
function getSafeFileName(
  asset: Asset
): string {
  if (asset.fileName) {
    return asset.fileName;
  }

  const extension =
    asset.type?.split("/")[1] || "jpg";

  return `upload-${Date.now()}.${extension}`;
}

/**
 * Get the MIME type from the selected asset.
 */
function getMimeType(
  asset: Asset
): string {
  if (asset.type) {
    return asset.type;
  }

  const fileName =
    asset.fileName?.toLowerCase() || "";

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (
    fileName.endsWith(".webp")
  ) {
    return "image/webp";
  }

  if (
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    return "image/heic";
  }

  return "image/jpeg";
}

/**
 * Add a cache-busting query parameter without
 * breaking an existing query string.
 */
function withCacheBust(
  url: string,
  version: number
): string {
  if (!url) {
    return "";
  }

  const separator = url.includes("?")
    ? "&"
    : "?";

  return `${url}${separator}t=${version}`;
}

/* ============================================================
   CONFIG FORM
============================================================ */

function ConfigForm({
  instance,
  connectors,
  onConfigChange,
  mode,
  sessionId,
  cropAspect,
  onImageUploaded,
}: ConfigFormProps) {
  const connector = connectors.find(
    (c) =>
      c.type === instance.connectorType
  );

  /**
   * Upload state.
   *
   * We keep the key so if there are multiple image
   * fields, only the active field shows Uploading...
   */
  const [uploadingKey, setUploadingKey] =
    useState<string | null>(null);

  /**
   * Selected image is associated with a specific
   * connector config key.
   */
  const [selectedImage, setSelectedImage] =
    useState<SelectedImage | null>(null);

  /**
   * Used to force the already-uploaded image to
   * reload after upload/delete.
   */
  const [imageVersion, setImageVersion] =
    useState(() => Date.now());

  if (!connector?.schema?.config) {
    return null;
  }

  /**
   * Images are only editable in playground mode
   * for user-scoped connector instances.
   */
  const isFileEnabled =
    mode === "playground" &&
    instance.scope === "user";

  /* ============================================================
     PICK IMAGE
  ============================================================ */

  const chooseImage = useCallback(
    (key: string) => {
      if (!isFileEnabled) {
        return;
      }

      launchImageLibrary(
        {
          mediaType: "photo",
          selectionLimit: 1,
          quality: 1,
        },
        (
          response: ImagePickerResponse
        ) => {
          if (response.didCancel) {
            return;
          }

          if (response.errorCode) {
            console.log(
              "Image picker error:",
              response.errorCode,
              response.errorMessage
            );

            Alert.alert(
              "Image Picker",
              response.errorMessage ||
                "Unable to select image."
            );

            return;
          }

          const asset =
            response.assets?.[0];

          if (!asset?.uri) {
            Alert.alert(
              "Image Picker",
              "No image was selected."
            );

            return;
          }

          const type =
            getMimeType(asset);

          const fileName =
            getSafeFileName(asset);

          setSelectedImage({
            key,
            uri: asset.uri,
            type,
            fileName,
          });
        }
      );
    },
    [isFileEnabled]
  );

  /* ============================================================
     UPLOAD IMAGE
  ============================================================ */

 const uploadImage = useCallback(
  async (key: string, image: SelectedImage) => {
    try {
      setUploadingKey(key);

      // 1. Upload image to S3
      const fileUrl = await uploadToS3(
        image.uri,
        UploadType.PLAYGROUND_CONNECTOR_INSTANCE,
        {
          playgroundConnectorConfigInstanceId: instance.id,
        },
        image.fileName,
        image.type
      );

      // 2. Save image URL to the backend
      const updatedConfig = {
        ...instance.config,
        [key]: fileUrl,
      };

      const response = await api.patch(
        `/playground/${sessionId}/connector-instance/${instance.id}`,
        {
          config: updatedConfig,
        }
      );

      // 3. Update local connector state
      const savedConfig =
        response.data?.config ?? updatedConfig;

      onConfigChange(instance.id, savedConfig);

      // 4. Refresh the image and preview
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
    instance.id,
    instance.config,
    sessionId,
    onConfigChange,
    onImageUploaded,
  ]
);
  /* ============================================================
     DELETE IMAGE
  ============================================================ */

  const deleteImage = useCallback(
    async (key: string) => {
      if (!instance.config?.[key]) {
        return;
      }

      try {
        setUploadingKey(key);

        await api.delete(
          `/playground/${sessionId}/connector-instance/${instance.id}/delete-image`
        );

        /**
         * Remove the image URL from this config field.
         */
        const updatedConfig = {
          ...instance.config,
          [key]: "",
        };

        /**
         * Let parent persist the config.
         */
        onConfigChange(
          instance.id,
          updatedConfig
        );

        /**
         * Clear selected image if it belongs
         * to this field.
         */
        setSelectedImage(
          (current) =>
            current?.key === key
              ? null
              : current
        );

        /**
         * Force image area to refresh.
         */
        setImageVersion(
          Date.now()
        );

        onImageUploaded?.();

        Alert.alert(
          "Image deleted",
          "Image deleted successfully."
        );
      } catch (error: any) {
        console.log(
          "Delete image failed:",
          error
        );

        console.log(
          "Delete error response:",
          error?.response?.data
        );

        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to delete image.";

        Alert.alert(
          "Delete failed",
          String(message)
        );
      } finally {
        setUploadingKey(null);
      }
    },
    [
      instance.id,
      instance.config,
      onConfigChange,
      onImageUploaded,
      sessionId,
    ]
  );

  /* ============================================================
     RENDER CONFIG FIELDS
  ============================================================ */

  return (
    <>
      {Object.entries(
        connector.schema.config
      ).map(
        ([key, field]: [
          string,
          any
        ]) => {
          const isImage =
            connector?.type === "image" ||
            connector?.schema?.category ===
              "image";

          /* ======================================================
             IMAGE CONFIG
          ====================================================== */

          if (
            isImage &&
            mode !== "design"
          ) {
            const currentImageUrl =
              instance.config?.[key];

            const selectedForThisField =
              selectedImage?.key === key
                ? selectedImage
                : null;

            const isUploading =
              uploadingKey === key;

            const hasCurrentImage =
              !!currentImageUrl;

            return (
              <View
                key={key}
                className="mb-5"
              >
                {/* ================================================
                   LABEL
                ================================================= */}

                <Text className="text-xs text-gray-900 dark:text-gray-400 mb-2">
                  {field?.label || key}
                </Text>

                {/* ================================================
                   CURRENT IMAGE
                ================================================= */}

                {hasCurrentImage &&
                  !selectedForThisField && (
                    <View className="w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        source={{
                          uri: withCacheBust(
                            String(
                              currentImageUrl
                            ),
                            imageVersion
                          ),
                        }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                    </View>
                  )}

                {/* ================================================
                   SELECT IMAGE
                ================================================= */}

                <TouchableOpacity
                  disabled={
                    !isFileEnabled ||
                    isUploading
                  }
                  onPress={() =>
                    chooseImage(key)
                  }
                  className={`px-3 py-3 rounded mt-2 ${
                    isFileEnabled &&
                    !isUploading
                      ? "bg-gray-600 dark:bg-gray-700"
                      : "bg-gray-300 dark:bg-gray-800"
                  }`}
                >
                  <Text className="text-white text-xs text-center">
                    {selectedForThisField
                      ? "Choose Another Image"
                      : "Choose Image"}
                  </Text>
                </TouchableOpacity>

                {/* ================================================
                   SELECTED IMAGE PREVIEW
                ================================================= */}

                {selectedForThisField && (
                  <View className="mt-2">
                    <View className="w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        source={{
                          uri: selectedForThisField.uri,
                        }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                    </View>

                    <Text className="text-gray-500 dark:text-gray-400 text-[10px] mt-1">
                      {selectedForThisField.fileName}
                    </Text>
                  </View>
                )}

                {/* ================================================
                   UPLOAD
                ================================================= */}

                {selectedForThisField && (
                  <TouchableOpacity
                    disabled={
                      isUploading ||
                      !isFileEnabled
                    }
                    onPress={() =>
                      uploadImage(
                        key,
                        selectedForThisField
                      )
                    }
                    className={`px-3 py-3 rounded mt-2 ${
                      isUploading
                        ? "bg-blue-400"
                        : "bg-blue-600"
                    }`}
                  >
                    {isUploading ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator
                          size="small"
                          color="#ffffff"
                        />

                        <Text className="text-white text-xs ml-2">
                          Uploading...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white text-xs text-center font-medium">
                        Upload
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* ================================================
                   CANCEL SELECTED IMAGE
                ================================================= */}

                {selectedForThisField && (
                  <TouchableOpacity
                    disabled={isUploading}
                    onPress={() =>
                      setSelectedImage(
                        null
                      )
                    }
                    className="px-3 py-2 rounded mt-2 bg-gray-200 dark:bg-gray-700"
                  >
                    <Text className="text-gray-800 dark:text-white text-xs text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ================================================
                   DELETE CURRENT IMAGE
                ================================================= */}

                {hasCurrentImage &&
                  !selectedForThisField && (
                    <TouchableOpacity
                      disabled={
                        isUploading ||
                        !isFileEnabled
                      }
                      onPress={() =>
                        deleteImage(key)
                      }
                      className={`px-3 py-3 rounded mt-2 ${
                        isFileEnabled &&
                        !isUploading
                          ? "bg-gray-300 dark:bg-gray-600"
                          : "bg-gray-200 dark:bg-gray-800"
                      }`}
                    >
                      {isUploading ? (
                        <View className="flex-row justify-center items-center">
                          <ActivityIndicator
                            size="small"
                            color={
                              "#6b7280"
                            }
                          />

                          <Text className="text-gray-700 dark:text-white text-xs ml-2">
                            Deleting...
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-gray-900 dark:text-white text-xs text-center">
                          Delete
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                {/* ================================================
                   DISABLED MESSAGE
                ================================================= */}

                {!isFileEnabled && (
                  <Text className="text-[10px] text-gray-400 mt-2">
                    Image upload is available for
                    user-scoped playground
                    connectors.
                  </Text>
                )}

                {/* ================================================
                   CROP ASPECT
                ================================================= */}

                {cropAspect &&
                  cropAspect > 0 && (
                    <Text className="text-[9px] text-gray-400 mt-1">
                      Aspect ratio:{" "}
                      {cropAspect.toFixed(2)}
                    </Text>
                  )}
              </View>
            );
          }

          /* ======================================================
             NORMAL TEXT CONFIG
          ====================================================== */

          return (
            <View
              key={key}
              className="mb-3"
            >
              <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1 px-2">
                {field?.label || key}
              </Text>

              <TextInput
                value={
                  instance.config?.[
                    key
                  ] ?? ""
                }
                onChangeText={(
                  text
                ) => {
                  const updatedConfig =
                    {
                      ...instance.config,
                      [key]: text,
                    };

                  /**
                   * IMPORTANT:
                   *
                   * Only update parent state here.
                   *
                   * The parent PluginPlaygroundScreen
                   * should perform the debounced PATCH.
                   *
                   * Do NOT call api.patch() on every
                   * keystroke from this component.
                   */
                  onConfigChange(
                    instance.id,
                    updatedConfig
                  );
                }}
                placeholder={
                  field?.placeholder ||
                  field?.label ||
                  key
                }
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              />
            </View>
          );
        }
      )}
    </>
  );
}

/* ============================================================
   CONNECTOR CARD
============================================================ */

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
  cropAspect = 1,
  onImageUploaded,
}: ConnectorCardProps) {
  const connector = connectors.find(
    (c) =>
      c.type === instance.connectorType
  );

  const isOpen =
    openInstanceId === instance.id;

  const isConnected =
    !!instance.oauthTokenId;

  const { colorScheme } =
    useColorScheme();

  const iconColor =
    colorScheme === "dark"
      ? "#ffffff"
      : "#000000";

  /* ============================================================
     OAUTH PROVIDER
  ============================================================ */

  const getOAuthProvider =
    (): OAuthProvider | null => {
      const provider =
        connector?.schema?.oauth
          ?.provider;

      if (
        provider === "google" ||
        provider === "notion"
      ) {
        return provider;
      }

      return null;
    };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <View className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] mb-3">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setOpenInstanceId?.(
            isOpen
              ? null
              : instance.id
          );
        }}
        className="flex-row justify-between px-4 py-3"
      >
        <View className="flex-1">
          <Text className="text-blue-400 text-sm">
            {"{{ " +
              instance.instanceKey +
              " }}"}
          </Text>

          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {connector?.schema?.label ||
              instance.connectorType}
          </Text>
        </View>

        {isOpen ? (
          <ChevronUp
            size={18}
            color={iconColor}
          />
        ) : (
          <ChevronDown
            size={18}
            color={iconColor}
          />
        )}
      </TouchableOpacity>

      {/* ======================================================
          BODY
      ====================================================== */}

      {isOpen && (
        <View className="px-4 pb-4 border-t border-gray-300 dark:border-gray-600">
          {/* ==================================================
              OAUTH
          ================================================== */}

          {connector?.schema?.oauth && (
            <View className="mt-3 mb-4">
              {isConnected ? (
                <View className="flex-row justify-between items-center bg-green-900 px-3 py-4 rounded">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />

                    <Text className="text-green-400 text-sm">
                      Connected
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      onDisconnect?.(
                        instance.id
                      )
                    }
                    className="bg-gray-300 dark:bg-gray-600 px-3 py-2 rounded"
                  >
                    <Text className="text-gray-900 dark:text-white text-xs">
                      Logout
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={
                    0.7
                  }
                  onPress={() => {
                    const provider =
                      getOAuthProvider();

                    if (!provider) {
                      console.log(
                        "Unsupported OAuth provider:",
                        connector?.schema
                          ?.oauth
                          ?.provider
                      );

                      Alert.alert(
                        "OAuth",
                        "Unsupported OAuth provider."
                      );

                      return;
                    }

                    onStartOAuth?.(
                      instance.id,
                      provider
                    );
                  }}
                  className="bg-blue-600 py-3 rounded"
                >
                  <Text className="text-white text-xs text-center font-medium">
                    Connect{" "}
                    {connector?.schema
                      ?.oauth
                      ?.provider ||
                      "Account"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ==================================================
              CONFIGURATION
          ================================================== */}

          <ConfigForm
            instance={instance}
            connectors={connectors}
            onConfigChange={
              onConfigChange
            }
            mode={mode}
            sessionId={sessionId}
            cropAspect={cropAspect}
            onImageUploaded={
              onImageUploaded
            }
          />
        </View>
      )}
    </View>
  );
}

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   Image,
// } from "react-native";

// import {
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react-native";

// import api from "../lib/api";
// import { launchImageLibrary } from "react-native-image-picker";
// import { useColorScheme } from "nativewind";

// /* =========================================================
//    TYPES
// ========================================================= */

// export type ConnectorMode =
//   | "config"
//   | "design"
//   | "playground";

// export type PluginInstance = {
//   id: string;
//   instanceKey: string;
//   connectorType: string;
//   config: Record<string, any>;
//   scope?: "author" | "user";
//   oauthTokenId?: string | null;
// };

// type ConfigFormProps = {
//   instance: PluginInstance;
//   connectors: any[];
//   onConfigChange: (
//     id: string,
//     config: Record<string, any>
//   ) => void;
//   mode: ConnectorMode;
//   sessionId: string;
// };

// /* =========================================================
//    CONFIG FORM
// ========================================================= */

// function ConfigForm({
//   instance,
//   connectors,
//   onConfigChange,
//   mode,
//   sessionId,
// }: ConfigFormProps) {
//   const connector = connectors.find(
//     (c) =>
//       c.type === instance.connectorType
//   );

//   const [uploading, setUploading] =
//     useState(false);

//   const [selectedImage, setSelectedImage] =
//     useState<string | null>(null);

//   if (!connector?.schema?.config) {
//     return null;
//   }

//   const isFileEnabled =
//     mode === "playground" &&
//     instance.scope === "user";

//   return (
//     <>
//       {Object.entries(
//         connector.schema.config
//       ).map(([key, field]: any) => {
//         const isImage =
//           connector?.type === "image" ||
//           connector?.schema?.category ===
//             "image";

//         /* =================================================
//            IMAGE
//         ================================================= */

//         if (
//           isImage &&
//           mode !== "design"
//         ) {
//           return (
//             <View
//               key={key}
//               className="mb-4"
//             >
//               <Text className="text-xs text-gray-900 dark:text-gray-400 mb-2">
//                 {field.label}
//               </Text>

//               {/* CURRENT IMAGE */}

//               {instance.config?.[key] &&
//                 !selectedImage && (
//                   <Image
//                     source={{
//                       uri:
//                         instance.config[key] +
//                         "?t=" +
//                         Date.now(),
//                     }}
//                     key={
//                       instance.config[key]
//                     }
//                     className="w-full h-32"
//                     resizeMode="cover"
//                   />
//                 )}

//               {/* CHOOSE IMAGE */}

//               <TouchableOpacity
//                 disabled={
//                   !isFileEnabled
//                 }
//                 onPress={() => {
//                   launchImageLibrary(
//                     {
//                       mediaType: "photo",
//                     },
//                     (res) => {
//                       const uri =
//                         res.assets?.[0]?.uri;

//                       if (uri) {
//                         setSelectedImage(
//                           uri
//                         );
//                       }
//                     }
//                   );
//                 }}
//                 className="bg-gray-400 dark:bg-gray-700 px-3 py-2 rounded mt-2"
//               >
//                 <Text className="text-white text-xs">
//                   Choose Image
//                 </Text>
//               </TouchableOpacity>

//               {/* SELECTED IMAGE */}

//               {selectedImage && (
//                 <Image
//                   source={{
//                     uri: selectedImage,
//                   }}
//                   className="w-full h-32 rounded mt-2"
//                   resizeMode="cover"
//                 />
//               )}

//               {/* UPLOAD */}

//               {selectedImage && (
//                 <TouchableOpacity
//                   disabled={uploading}
//                   onPress={async () => {
//                     try {
//                       setUploading(
//                         true
//                       );

//                       const formData =
//                         new FormData();

//                       formData.append(
//                         "file",
//                         {
//                           uri:
//                             selectedImage,
//                           name:
//                             "upload.jpg",
//                           type:
//                             "image/jpeg",
//                         } as any
//                       );

//                       const res =
//                         await api.post(
//                           "/upload",
//                           formData,
//                           {
//                             headers: {
//                               "Content-Type":
//                                 "multipart/form-data",
//                             },
//                           }
//                         );

//                       const fileUrl =
//                         res.data.url;

//                       const updatedConfig =
//                         {
//                           ...instance.config,
//                           [key]:
//                             fileUrl,
//                         };

//                       /*
//                        * Update UI
//                        */
//                       onConfigChange(
//                         instance.id,
//                         updatedConfig
//                       );

//                       /*
//                        * Save backend
//                        */
//                       await api.patch(
//                         `/playground/${sessionId}/connector-instance/${instance.id}`,
//                         {
//                           config:
//                             updatedConfig,
//                         }
//                       );

//                       setSelectedImage(
//                         null
//                       );
//                     } catch (err) {
//                       console.log(
//                         "Upload failed",
//                         err
//                       );
//                     } finally {
//                       setUploading(
//                         false
//                       );
//                     }
//                   }}
//                   className="bg-blue-600 px-3 py-2 rounded mt-2"
//                 >
//                   <Text className="text-white text-xs">
//                     {uploading
//                       ? "Uploading..."
//                       : "Upload"}
//                   </Text>
//                 </TouchableOpacity>
//               )}

//               {/* DELETE */}

//               {instance.config?.[
//                 key
//               ] &&
//                 !selectedImage && (
//                   <TouchableOpacity
//                     onPress={async () => {
//                       try {
//                         setUploading(
//                           true
//                         );

//                         await api.delete(
//                           `/playground/${sessionId}/connector-instance/${instance.id}/delete-image`
//                         );

//                         const updatedConfig =
//                           {
//                             ...instance.config,
//                             [key]: "",
//                           };

//                         onConfigChange(
//                           instance.id,
//                           updatedConfig
//                         );
//                       } catch (err) {
//                         console.log(
//                           "Delete failed",
//                           err
//                         );
//                       } finally {
//                         setUploading(
//                           false
//                         );
//                       }
//                     }}
//                     className="bg-gray-300 dark:bg-gray-600 px-3 py-2 rounded mt-2"
//                   >
//                     <Text className="text-gray-900 dark:text-white text-xs">
//                       Delete
//                     </Text>
//                   </TouchableOpacity>
//                 )}

//               {uploading && (
//                 <ActivityIndicator />
//               )}
//             </View>
//           );
//         }

//         /* =================================================
//            TEXT CONFIG
//         ================================================= */

//         return (
//           <View
//             key={key}
//             className="mb-3"
//           >
//             <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1 p-2">
//               {field.label}
//             </Text>

//             <TextInput
//               value={
//                 instance.config?.[
//                   key
//                 ] || ""
//               }
//               onChangeText={(
//                 text
//               ) => {
//                 const updatedConfig =
//                   {
//                     ...instance.config,
//                     [key]: text,
//                   };

//                 /*
//                  * Update UI immediately.
//                  */
//                 onConfigChange(
//                   instance.id,
//                   updatedConfig
//                 );

//                 /*
//                  * DO NOT directly patch here.
//                  *
//                  * PreviewPage handles the
//                  * debounced backend update.
//                  */
//               }}
//               className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
//               placeholder={
//                 field.label
//               }
//               placeholderTextColor="#9ca3af"
//             />
//           </View>
//         );
//       })}
//     </>
//   );
// }

// /* =========================================================
//    CONNECTOR CARD PROPS
// ========================================================= */

// type ConnectorCardProps = {
//   sessionId: string;
//   mode: ConnectorMode;
//   instance: PluginInstance;
//   connectors: any[];
//   openInstanceId?: string | null;
//   setOpenInstanceId?: (
//     id: string | null
//   ) => void;

//   onConfigChange: (
//     id: string,
//     config: Record<string, any>
//   ) => void;

//   onDisconnect?: (
//     id: string
//   ) => void;

//   /*
//    * IMPORTANT:
//    *
//    * provider is string because the provider
//    * comes dynamically from connector.schema.oauth.
//    */
//   onStartOAuth?: (
//     id: string,
//     provider: string
//   ) => void;
// };

// /* =========================================================
//    CONNECTOR CARD
// ========================================================= */

// export function ConnectorCard({
//   mode,
//   sessionId,
//   instance,
//   connectors,
//   openInstanceId,
//   setOpenInstanceId,
//   onConfigChange,
//   onDisconnect,
//   onStartOAuth,
// }: ConnectorCardProps) {
//   const connector = connectors.find(
//     (c) =>
//       c.type ===
//       instance.connectorType
//   );

//   const isOpen =
//     openInstanceId ===
//     instance.id;

//   const isConnected =
//     !!instance.oauthTokenId;

//   const { colorScheme } =
//     useColorScheme();

//   return (
//     <View className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] mb-3">

//       {/* ===================================================
//           HEADER
//       =================================================== */}

//       <TouchableOpacity
//         onPress={() =>
//           setOpenInstanceId?.(
//             isOpen
//               ? null
//               : instance.id
//           )
//         }
//         className="flex-row justify-between px-4 py-3"
//       >
//         <View className="flex-1">

//           <Text className="text-blue-400 text-sm">
//             {"{{ " +
//               instance.instanceKey +
//               " }}"}
//           </Text>

//           <Text className="text-gray-500 dark:text-gray-400 text-xs p-2">
//             {
//               connector?.schema
//                 ?.label
//             }
//           </Text>

//         </View>

//         {isOpen ? (
//           <ChevronUp
//             size={18}
//             color={
//               colorScheme ===
//               "dark"
//                 ? "white"
//                 : "black"
//             }
//           />
//         ) : (
//           <ChevronDown
//             size={18}
//             color={
//               colorScheme ===
//               "dark"
//                 ? "white"
//                 : "black"
//             }
//           />
//         )}
//       </TouchableOpacity>

//       {/* ===================================================
//           CONTENT
//       =================================================== */}

//       {isOpen && (
//         <View className="px-4 pb-4 border-t border-gray-300 dark:border-gray-600">

//           {/* =================================================
//               OAUTH
//           ================================================= */}

//           {connector?.schema
//             ?.oauth && (
//             <View className="mt-3 mb-4">

//               {isConnected ? (
//                 <View className="flex-row justify-between items-center bg-green-900 px-3 py-4 rounded">

//                   <Text className="text-green-400 text-sm">
//                     Connected
//                   </Text>

//                   <TouchableOpacity
//                     onPress={() =>
//                       onDisconnect?.(
//                         instance.id
//                       )
//                     }
//                   >
//                     <View className="bg-gray-300 dark:bg-gray-600 px-3 py-2 rounded">
//                       <Text className="text-gray-900 dark:text-white text-xs">
//                         Logout
//                       </Text>
//                     </View>
//                   </TouchableOpacity>

//                 </View>
//               ) : (
//                 <TouchableOpacity
//                   onPress={() =>
//                     onStartOAuth?.(
//                       instance.id,
//                       connector.schema
//                         .oauth
//                         .provider
//                     )
//                   }
//                   className="bg-blue-600 py-2 rounded"
//                 >
//                   <Text className="text-white text-xs text-center">
//                     Connect{" "}
//                     {
//                       connector
//                         .schema
//                         .oauth
//                         .provider
//                     }
//                   </Text>
//                 </TouchableOpacity>
//               )}

//             </View>
//           )}

//           {/* =================================================
//               CONFIG
//           ================================================= */}

//           <ConfigForm
//             instance={
//               instance
//             }
//             connectors={
//               connectors
//             }
//             onConfigChange={
//               onConfigChange
//             }
//             mode={mode}
//             sessionId={
//               sessionId
//             }
//           />

//         </View>
//       )}

//     </View>
//   );
// }

