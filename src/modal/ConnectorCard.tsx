// // import React, {
// //   useCallback,
// //   useEffect,
// //   useRef,
// //   useState,
// // } from "react";

// // import {
// //   View,
// //   TouchableOpacity,
// //   TextInput,
// //   ActivityIndicator,
// //   Image,
// //   Alert,
// //   Switch,
// //   ScrollView,
// //   KeyboardAvoidingView,
// //   Platform,
// //   useWindowDimensions,
// //   Keyboard,
// //   InteractionManager,
// // } from "react-native";

// // import Text from "../components/AppText";
// // import {
// //   ChevronDown,
// //   ChevronUp,
// //   Trash2,
// //   CheckCircle2,
// // } from "lucide-react-native";
// // import api from "../lib/api";
// // import {
// //   launchImageLibrary,
// //   type Asset,
// //   type ImagePickerResponse,
// // } from "react-native-image-picker";
// // import { useColorScheme } from "nativewind";
// // import { uploadToS3 } from "../types/uploadtoS3";
// // import { UploadType } from "../types/upload";

// // export type ConnectorMode = "config" | "design" | "playground";
// // export type OAuthProvider = "google" | "notion";

// // export type PluginInstance = {
// //   id: string;
// //   instanceKey: string;
// //   connectorType: string;
// //   config: Record<string, any>;
// //   configScope?: "author" | "user";
// //   scope?: "author" | "user";
// //   isConnected?: boolean;
// //   oauthTokenId?: string | null;
// //   playgroundSessionId?: string;
// // };

// // type SelectedImage = {
// //   key: string;
// //   uri: string;
// //   type: string;
// //   fileName: string;
// // };

// // type ConfigFormProps = {
// //   instance: PluginInstance;
// //   connectors: any[];
// //   onConfigChange: (id: string, config: Record<string, any>) => void;
// //   disabled?: boolean;
// //   mode: ConnectorMode;
// //   sessionId: string;
// //   cropAspect?: number;
// //   onImageUploaded?: () => void;
// //   scrollInputIntoView: (target: TextInput | null) => void;
// // };

// // type ConnectorCardProps = {
// //   sessionId: string;
// //   mode: ConnectorMode;
// //   instance: PluginInstance;
// //   connectors: any[];
// //   openInstanceId?: string | null;
// //   setOpenInstanceId?: (id: string | null) => void;
// //   onRemove?: (instanceKey: string) => void | Promise<void>;
// //   onUpdateScope?: (id: string, scope: "author" | "user") => void;
// //   onConfigChange: (id: string, config: Record<string, any>) => void;
// //   onDisconnect?: (id: string) => void | Promise<void>;
// //   onStartOAuth?: (
// //     id: string,
// //     provider: OAuthProvider
// //   ) => void | Promise<void>;
// //   onImageUploaded?: () => void;
// //   cropAspect?: number;
// // };

// // function getSafeFileName(asset: Asset): string {
// //   if (asset.fileName) return asset.fileName;

// //   const extension = asset.type?.split("/")[1] || "jpg";
// //   return `upload-${Date.now()}.${extension}`;
// // }

// // function getMimeType(asset: Asset): string {
// //   if (asset.type) return asset.type;

// //   const fileName = asset.fileName?.toLowerCase() || "";

// //   if (fileName.endsWith(".png")) return "image/png";
// //   if (fileName.endsWith(".webp")) return "image/webp";

// //   if (
// //     fileName.endsWith(".heic") ||
// //     fileName.endsWith(".heif")
// //   ) {
// //     return "image/heic";
// //   }

// //   return "image/jpeg";
// // }

// // function withCacheBust(url: string, version: number): string {
// //   if (!url) return "";

// //   return `${url}${url.includes("?") ? "&" : "?"}t=${version}`;
// // }

// // function ConfigForm({
// //   instance,
// //   connectors,
// //   onConfigChange,
// //   disabled = false,
// //   mode,
// //   sessionId,
// //   cropAspect = 1,
// //   onImageUploaded,
// //   scrollInputIntoView,
// // }: ConfigFormProps) {
// //   const connector = connectors.find(
// //     (item) => item.type === instance.connectorType
// //   );

// //   const [uploadingKey, setUploadingKey] = useState<string | null>(null);
// //   const [selectedImage, setSelectedImage] =
// //     useState<SelectedImage | null>(null);
// //   const [imageVersion, setImageVersion] = useState(Date.now());

// //   // Keep the actual native TextInput refs.
// //   // Do not use event.target as a TextInput ref.
// //   const inputRefs = useRef<Record<string, TextInput | null>>({});

// //   const isFileEnabled =
// //     mode === "playground" &&
// //     instance.scope === "user" &&
// //     !disabled;

// //   const chooseImage = useCallback(
// //     (key: string) => {
// //       if (!isFileEnabled) return;

// //       launchImageLibrary(
// //         {
// //           mediaType: "photo",
// //           selectionLimit: 1,
// //           quality: 1,
// //         },
// //         (response: ImagePickerResponse) => {
// //           if (response.didCancel) return;

// //           if (response.errorCode) {
// //             Alert.alert(
// //               "Image Picker",
// //               response.errorMessage || "Unable to select image."
// //             );
// //             return;
// //           }

// //           const asset = response.assets?.[0];

// //           if (!asset?.uri) {
// //             Alert.alert("Image Picker", "No image was selected.");
// //             return;
// //           }

// //           setSelectedImage({
// //             key,
// //             uri: asset.uri,
// //             type: getMimeType(asset),
// //             fileName: getSafeFileName(asset),
// //           });
// //         }
// //       );
// //     },
// //     [isFileEnabled]
// //   );

// //   const uploadImage = useCallback(
// //     async (key: string, image: SelectedImage) => {
// //       if (!isFileEnabled) return;

// //       try {
// //         setUploadingKey(key);

// //         const fileUrl = await uploadToS3(
// //           image.uri,
// //           UploadType.PLAYGROUND_CONNECTOR_INSTANCE,
// //           {
// //             playgroundConnectorConfigInstanceId: instance.id,
// //           },
// //           image.fileName,
// //           image.type
// //         );

// //         const updatedConfig = {
// //           ...instance.config,
// //           [key]: fileUrl,
// //         };

// //         const response = await api.patch(
// //           `/playground/${sessionId}/connector-instance/${instance.id}`,
// //           { config: updatedConfig }
// //         );

// //         const savedConfig = response.data?.config ?? updatedConfig;

// //         onConfigChange(instance.id, savedConfig);
// //         setSelectedImage(null);
// //         setImageVersion(Date.now());
// //         onImageUploaded?.();

// //         Alert.alert("Success", "Image uploaded successfully.");
// //       } catch (error: any) {
// //         console.log(
// //           "Image upload error:",
// //           error?.response?.data ?? error
// //         );

// //         Alert.alert(
// //           "Upload failed",
// //           String(
// //             error?.response?.data?.message ??
// //               error?.response?.data?.error ??
// //               error?.message ??
// //               "Unable to upload image."
// //           )
// //         );
// //       } finally {
// //         setUploadingKey(null);
// //       }
// //     },
// //     [
// //       isFileEnabled,
// //       instance.id,
// //       instance.config,
// //       sessionId,
// //       onConfigChange,
// //       onImageUploaded,
// //     ]
// //   );

// //   const deleteImage = useCallback(
// //     async (key: string) => {
// //       if (!isFileEnabled || !instance.config?.[key]) return;

// //       try {
// //         setUploadingKey(key);

// //         await api.delete(
// //           `/playground/${sessionId}/connector-instance/${instance.id}/delete-image`
// //         );

// //         const updatedConfig = {
// //           ...instance.config,
// //           [key]: "",
// //         };

// //         onConfigChange(instance.id, updatedConfig);

// //         setSelectedImage((current) =>
// //           current?.key === key ? null : current
// //         );

// //         setImageVersion(Date.now());
// //         onImageUploaded?.();

// //         Alert.alert("Image deleted", "Image deleted successfully.");
// //       } catch (error: any) {
// //         console.log(
// //           "Delete image failed:",
// //           error?.response?.data ?? error
// //         );

// //         Alert.alert(
// //           "Delete failed",
// //           String(
// //             error?.response?.data?.message ??
// //               error?.response?.data?.error ??
// //               error?.message ??
// //               "Unable to delete image."
// //           )
// //         );
// //       } finally {
// //         setUploadingKey(null);
// //       }
// //     },
// //     [
// //       isFileEnabled,
// //       instance.id,
// //       instance.config,
// //       sessionId,
// //       onConfigChange,
// //       onImageUploaded,
// //     ]
// //   );

// //   if (!connector?.schema?.config) return null;

// //   const isImageConnector =
// //     connector.type === "image" ||
// //     connector.schema?.category === "image";

// //   return (
// //     <View className="gap-5">
// //       {Object.entries(connector.schema.config).map(
// //         ([key, field]: [string, any]) => {
// //           const label = field?.label || key;

// //           if (isImageConnector && mode !== "design") {
// //             const currentImageUrl = instance.config?.[key];

// //             const selectedForThisField =
// //               selectedImage?.key === key ? selectedImage : null;

// //             const isUploading = uploadingKey === key;
// //             const hasCurrentImage = !!currentImageUrl;

// //             const previewUri =
// //               selectedForThisField?.uri ||
// //               (hasCurrentImage
// //                 ? withCacheBust(
// //                     String(currentImageUrl),
// //                     imageVersion
// //                   )
// //                 : null);

// //             return (
// //               <View key={key} className="gap-3">
// //                 <Text
// //                   bold
// //                   className="text-[10px] uppercase tracking-widest text-gray-500"
// //                 >
// //                   {label}
// //                 </Text>

// //                 <TouchableOpacity
// //                   disabled={!isFileEnabled || isUploading}
// //                   onPress={() => chooseImage(key)}
// //                   activeOpacity={0.7}
// //                   className={`self-start rounded px-4 py-2 ${
// //                     isFileEnabled && !isUploading
// //                       ? "bg-gray-500"
// //                       : "bg-gray-300 dark:bg-gray-800"
// //                   }`}
// //                 >
// //                   <Text bold className="text-xs text-white">
// //                     {hasCurrentImage || selectedForThisField
// //                       ? "Change Image"
// //                       : "Choose Image"}
// //                   </Text>
// //                 </TouchableOpacity>

// //                 {previewUri && (
// //                   <View className="h-40 w-40 overflow-hidden rounded border border-gray-300 dark:border-gray-700">
// //                     <Image
// //                       source={{ uri: previewUri }}
// //                       className="h-full w-full"
// //                       resizeMode="cover"
// //                     />
// //                   </View>
// //                 )}

// //                 {selectedForThisField && (
// //                   <Text className="text-[10px] text-gray-500">
// //                     {selectedForThisField.fileName}
// //                   </Text>
// //                 )}

// //                 {selectedForThisField && (
// //                   <View className="flex-row flex-wrap gap-2">
// //                     <TouchableOpacity
// //                       disabled={!isFileEnabled || isUploading}
// //                       onPress={() =>
// //                         uploadImage(key, selectedForThisField)
// //                       }
// //                       className={`rounded px-4 py-2 ${
// //                         isUploading ? "bg-blue-400" : "bg-blue-600"
// //                       }`}
// //                     >
// //                       <View className="flex-row items-center gap-2">
// //                         {isUploading && (
// //                           <ActivityIndicator
// //                             size="small"
// //                             color="#ffffff"
// //                           />
// //                         )}

// //                         <Text bold className="text-xs text-white">
// //                           {isUploading ? "Uploading..." : "Upload"}
// //                         </Text>
// //                       </View>
// //                     </TouchableOpacity>

// //                     <TouchableOpacity
// //                       disabled={isUploading}
// //                       onPress={() => setSelectedImage(null)}
// //                       className="rounded bg-gray-200 px-4 py-2 dark:bg-gray-700"
// //                     >
// //                       <Text
// //                         bold
// //                         className="text-xs text-gray-900 dark:text-white"
// //                       >
// //                         Cancel
// //                       </Text>
// //                     </TouchableOpacity>
// //                   </View>
// //                 )}

// //                 {hasCurrentImage && !selectedForThisField && (
// //                   <TouchableOpacity
// //                     disabled={!isFileEnabled || isUploading}
// //                     onPress={() => deleteImage(key)}
// //                     className={`self-start rounded px-4 py-2 ${
// //                       isFileEnabled && !isUploading
// //                         ? "bg-gray-500"
// //                         : "bg-gray-200 dark:bg-gray-800"
// //                     }`}
// //                   >
// //                     <Text bold className="text-xs text-white">
// //                       {isUploading ? "Deleting..." : "Delete"}
// //                     </Text>
// //                   </TouchableOpacity>
// //                 )}

// //                 {!isFileEnabled && (
// //                   <Text className="text-[10px] text-gray-400">
// //                     Image upload is available for user-scoped playground connectors.
// //                   </Text>
// //                 )}

// //                 {cropAspect > 0 && (
// //                   <Text className="text-[10px] text-gray-400">
// //                     Aspect ratio: {cropAspect.toFixed(2)}
// //                   </Text>
// //                 )}
// //               </View>
// //             );
// //           }

// //           const value = instance.config?.[key];

// //           const isBooleanField =
// //             field?.type === "boolean" ||
// //             typeof value === "boolean" ||
// //             value === "true" ||
// //             value === "false";

// //           const isDateField =
// //             /date/i.test(key) || /date/i.test(label);

// //           return (
// //             <View key={key} className="gap-2">
// //               <Text
// //                 bold
// //                 className="text-[10px] uppercase tracking-widest text-gray-500"
// //               >
// //                 {label}
// //               </Text>

// //               {isBooleanField ? (
// //                 <View className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-[#0d0d0d]">
// //                   <Text className="flex-1 text-xs text-gray-900 dark:text-white">
// //                     {value === true || value === "true"
// //                       ? "Enabled"
// //                       : "Disabled"}
// //                   </Text>

// //                   <Switch
// //                     value={value === true || value === "true"}
// //                     disabled={disabled}
// //                     onValueChange={(checked) =>
// //                       onConfigChange(instance.id, {
// //                         ...instance.config,
// //                         [key]: checked,
// //                       })
// //                     }
// //                     trackColor={{
// //                       false: "#9ca3af",
// //                       true: "#2563eb",
// //                     }}
// //                     thumbColor="#ffffff"
// //                   />
// //                 </View>
// //               ) : (
// //                 <TextInput
// //                   ref={(input) => {
// //                     inputRefs.current[key] = input;
// //                   }}
// //                   editable={!disabled}
// //                   value={value == null ? "" : String(value)}
// //                   onFocus={() => {
// //                     // Pass the actual TextInput instance.
// //                     scrollInputIntoView(inputRefs.current[key]);
// //                   }}
// //                   onBlur={() => {
// //                     // Keep the ref available until React unmounts it.
// //                   }}
// //                   onChangeText={(text) =>
// //                     onConfigChange(instance.id, {
// //                       ...instance.config,
// //                       [key]: text,
// //                     })
// //                   }
// //                   placeholder={
// //                     field?.placeholder ||
// //                     (isDateField
// //                       ? `${label} (YYYY-MM-DD)`
// //                       : field?.label || key)
// //                   }
// //                   placeholderTextColor="#9ca3af"
// //                   autoCapitalize="none"
// //                   autoCorrect={false}
// //                   multiline={false}
// //                   selectTextOnFocus={false}
// //                   keyboardType={
// //                     isDateField
// //                       ? "numbers-and-punctuation"
// //                       : "default"
// //                   }
// //                   returnKeyType="done"
// //                   blurOnSubmit={false}
// //                   className={`w-full rounded border border-gray-300 px-3 py-3 text-xs dark:border-gray-700 ${
// //                     disabled
// //                       ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
// //                       : "bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-white"
// //                   }`}
// //                 />
// //               )}
// //             </View>
// //           );
// //         }
// //       )}
// //     </View>
// //   );
// // }

// // export function ConnectorCard({
// //   mode,
// //   sessionId,
// //   instance,
// //   connectors,
// //   openInstanceId,
// //   setOpenInstanceId,
// //   onRemove,
// //   onUpdateScope,
// //   onConfigChange,
// //   onDisconnect,
// //   onStartOAuth,
// //   onImageUploaded,
// //   cropAspect = 1,
// // }: ConnectorCardProps) {
// //   const connector = connectors.find(
// //     (item) => item.type === instance.connectorType
// //   );

// //   const isCollapsible = mode !== "config";
// //   const isOpen = !isCollapsible || openInstanceId === instance.id;

// //   const [isDisconnecting, setIsDisconnecting] = useState(false);
// //   const [isRemoving, setIsRemoving] = useState(false);

// //   const { colorScheme } = useColorScheme();
// //   const iconColor = colorScheme === "dark" ? "#ffffff" : "#111111";

// //   const isConnected = !!instance.oauthTokenId;
// //   const oauthProvider = connector?.schema?.oauth?.provider;

// //   const isSupportedOAuthProvider =
// //     oauthProvider === "google" || oauthProvider === "notion";

// //   const { height: windowHeight } = useWindowDimensions();

// //   const scrollRef = useRef<ScrollView>(null);
// //   const focusedInputRef = useRef<TextInput | null>(null);
// //   const viewportHeightRef = useRef(0);
// //   const pendingScrollRef = useRef<{ cancel?: () => void } | null>(
// //     null
// //   );

// //   const connectorFormMaxHeight = Math.max(
// //     180,
// //     Math.min(560, windowHeight * 0.65)
// //   );

// //   const toggleOpen = () => {
// //     if (!isCollapsible || !setOpenInstanceId) return;

// //     setOpenInstanceId(isOpen ? null : instance.id);
// //   };

// //   /**
// //    * Scroll the real focused input into the visible part
// //    * of the connector's inner ScrollView.
// //    */
// // const scrollInputIntoView = useCallback(
// //   (target: TextInput | null) => {
// //     if (!target) return;

// //     focusedInputRef.current = target;

// //     const task = InteractionManager.runAfterInteractions(() => {
// //       requestAnimationFrame(() => {
// //         const currentScroll = scrollRef.current;
// //         const input = focusedInputRef.current;

// //         if (!currentScroll || !input) return;

// //         // Get the actual native ScrollView component.
// //         const scrollNativeRef = currentScroll.getNativeScrollRef();

// //         if (!scrollNativeRef) return;

// //         input.measureLayout(
// //           scrollNativeRef,
// //           (_x, y, _width, height) => {
// //             const viewportHeight =
// //               viewportHeightRef.current || connectorFormMaxHeight;

// //             const topPadding = 20;
// //             const bottomPadding = 48;

// //             const inputBottom = y + height;
// //             const visibleBottom = viewportHeight - bottomPadding;

// //             if (inputBottom > visibleBottom) {
// //               currentScroll.scrollTo({
// //                 y: Math.max(
// //                   0,
// //                   inputBottom - visibleBottom + 12
// //                 ),
// //                 animated: true,
// //               });
// //             } else if (y < topPadding) {
// //               currentScroll.scrollTo({
// //                 y: Math.max(0, y - topPadding),
// //                 animated: true,
// //               });
// //             }
// //           },
// //           () => {
// //             // Layout may not be ready while Android resizes
// //             // the screen for the keyboard.
// //           }
// //         );
// //       });
// //     });

// //     pendingScrollRef.current = task;
// //   },
// //   [connectorFormMaxHeight]
// // );

// //   // When the keyboard appears, scroll the focused field again.
// //   // This is useful on devices that resize the screen later.
// //   useEffect(() => {
// //     const keyboardShowSubscription = Keyboard.addListener(
// //       "keyboardDidShow",
// //       () => {
// //         const focusedInput = focusedInputRef.current;

// //         if (focusedInput) {
// //           scrollInputIntoView(focusedInput);
// //         }
// //       }
// //     );

// //     return () => {
// //       keyboardShowSubscription.remove();
// //       pendingScrollRef.current?.cancel?.();
// //     };
// //   }, [scrollInputIntoView]);

// //   const handleDisconnect = async () => {
// //     if (isDisconnecting) return;

// //     setIsDisconnecting(true);

// //     try {
// //       await api.delete(
// //         `/playground/connector/${instance.id}/oauth/detach`
// //       );

// //       await onDisconnect?.(instance.id);
// //     } catch (error: any) {
// //       if (error?.response?.status !== 404) {
// //         console.log(
// //           "Disconnect failed:",
// //           error?.response?.data ?? error
// //         );

// //         Alert.alert(
// //           "Logout failed",
// //           String(
// //             error?.response?.data?.message ??
// //               error?.response?.data?.error ??
// //               error?.message ??
// //               "Unable to disconnect account."
// //           )
// //         );
// //       } else {
// //         await onDisconnect?.(instance.id);
// //       }
// //     } finally {
// //       setIsDisconnecting(false);
// //     }
// //   };

// //   const handleStartOAuth = () => {
// //     if (
// //       instance.scope === "author" ||
// //       !onStartOAuth ||
// //       !isSupportedOAuthProvider
// //     ) {
// //       return;
// //     }

// //     Promise.resolve(
// //       onStartOAuth(instance.id, oauthProvider as OAuthProvider)
// //     ).catch((error) => {
// //       console.log("OAuth connect failed:", error);

// //       Alert.alert("OAuth", "Unable to connect account.");
// //     });
// //   };

// //   const handleRemove = () => {
// //     if (!onRemove || isRemoving) return;

// //     Alert.alert(
// //       "Remove connector",
// //       `Are you sure you want to remove "${instance.instanceKey}"?`,
// //       [
// //         {
// //           text: "Cancel",
// //           style: "cancel",
// //         },
// //         {
// //           text: "Remove",
// //           style: "destructive",
// //           onPress: async () => {
// //             setIsRemoving(true);

// //             try {
// //               await onRemove(instance.instanceKey);
// //             } catch (error) {
// //               console.log("Remove connector failed:", error);

// //               Alert.alert(
// //                 "Remove failed",
// //                 "Unable to remove connector."
// //               );
// //             } finally {
// //               setIsRemoving(false);
// //             }
// //           },
// //         },
// //       ]
// //     );
// //   };

// //   return (
// //     <View className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0d0d0d]">
// //       <TouchableOpacity
// //         activeOpacity={isCollapsible ? 0.7 : 1}
// //         disabled={!isCollapsible || !setOpenInstanceId}
// //         onPress={toggleOpen}
// //         className="flex-row items-center justify-between px-4 py-3"
// //       >
// //         <View className="flex-1">
// //           <Text className="text-sm text-blue-600 dark:text-blue-400">
// //             {"{{ " + instance.instanceKey + " }}"}
// //           </Text>

// //           <Text
// //             bold
// //             className="mt-1 text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-500"
// //           >
// //             {connector?.schema?.label || instance.connectorType}
// //           </Text>
// //         </View>

// //         <View className="flex-row items-center gap-3">
// //           {onRemove && (
// //             <TouchableOpacity
// //               disabled={isRemoving}
// //               onPress={handleRemove}
// //               hitSlop={8}
// //               className="p-1"
// //             >
// //               <Trash2 size={17} color={iconColor} />
// //             </TouchableOpacity>
// //           )}

// //           {isCollapsible &&
// //             (isOpen ? (
// //               <ChevronUp size={18} color={iconColor} />
// //             ) : (
// //               <ChevronDown size={18} color={iconColor} />
// //             ))}
// //         </View>
// //       </TouchableOpacity>

// //       {isOpen && (
// //         <KeyboardAvoidingView
// //           style={{ flexShrink: 1 }}
// //           behavior={Platform.OS === "ios" ? "padding" : undefined}
// //           keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
// //         >
// // <ScrollView
// //   ref={scrollRef}
// //   style={{
// //     maxHeight: connectorFormMaxHeight,
// //     flexShrink: 1,
// //   }}
// //   contentContainerStyle={{
// //     padding: 16,
// //     paddingBottom: 150,
// //   }}
// //   keyboardShouldPersistTaps="handled"
// //   keyboardDismissMode={
// //     Platform.OS === "ios" ? "interactive" : "on-drag"
// //   }
// //   nestedScrollEnabled
// //   automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
// //   showsVerticalScrollIndicator
// // >
// //             <View className="gap-5">
// //               {connector?.schema?.oauth && (
// //                 <View className="gap-3">
// //                   <Text
// //                     bold
// //                     className="text-[10px] uppercase tracking-widest text-gray-500"
// //                   >
// //                     Authentication Required
// //                   </Text>

// //                   {isConnected ? (
// //                     <View className="flex-row items-center justify-between gap-2 rounded border border-green-500/20 bg-green-400/5 px-3 py-3">
// //                       <View className="flex-1 flex-row items-center gap-2">
// //                         <CheckCircle2 size={17} color="#4ade80" />

// //                         <Text className="flex-1 text-xs text-green-400">
// //                           Connected to {oauthProvider || "Account"}
// //                         </Text>
// //                       </View>

// //                       <TouchableOpacity
// //                         disabled={isDisconnecting}
// //                         onPress={handleDisconnect}
// //                         className={`rounded px-3 py-2 ${
// //                           isDisconnecting
// //                             ? "bg-gray-400"
// //                             : "bg-gray-500"
// //                         }`}
// //                       >
// //                         <Text bold className="text-xs text-white">
// //                           {isDisconnecting
// //                             ? "Logging out..."
// //                             : "Logout"}
// //                         </Text>
// //                       </TouchableOpacity>
// //                     </View>
// //                   ) : (
// //                     <TouchableOpacity
// //                       disabled={
// //                         instance.scope === "author" ||
// //                         !onStartOAuth ||
// //                         !isSupportedOAuthProvider
// //                       }
// //                       onPress={handleStartOAuth}
// //                       className={`w-full rounded py-3 ${
// //                         instance.scope === "author" ||
// //                         !onStartOAuth ||
// //                         !isSupportedOAuthProvider
// //                           ? "bg-blue-300 dark:bg-blue-900"
// //                           : "bg-blue-600"
// //                       }`}
// //                     >
// //                       <Text
// //                         bold
// //                         className="text-center text-xs text-white"
// //                       >
// //                         Connect {oauthProvider || "Account"}
// //                       </Text>
// //                     </TouchableOpacity>
// //                   )}
// //                 </View>
// //               )}

// //               {onUpdateScope && (
// //                 <View className="gap-2">
// //                   <Text
// //                     bold
// //                     className="text-[10px] uppercase tracking-widest text-gray-500"
// //                   >
// //                     Config Scope
// //                   </Text>

// //                   <View className="flex-row rounded border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-black">
// //                     {(["author", "user"] as const).map((scope) => {
// //                       const selectedScope =
// //                         instance.configScope ??
// //                         instance.scope ??
// //                         "user";

// //                       const selected = selectedScope === scope;

// //                       return (
// //                         <TouchableOpacity
// //                           key={scope}
// //                           disabled={selected}
// //                           onPress={() =>
// //                             onUpdateScope(instance.id, scope)
// //                           }
// //                           className={`flex-1 items-center rounded py-2 ${
// //                             selected ? "bg-white dark:bg-gray-800" : ""
// //                           }`}
// //                         >
// //                           <Text
// //                             bold={selected}
// //                             className={`text-[10px] uppercase ${
// //                               selected
// //                                 ? "text-gray-900 dark:text-white"
// //                                 : "text-gray-500"
// //                             }`}
// //                           >
// //                             {scope}
// //                           </Text>
// //                         </TouchableOpacity>
// //                       );
// //                     })}
// //                   </View>
// //                 </View>
// //               )}

// //               <View className="gap-3">
// //                 <Text
// //                   bold
// //                   className="text-[10px] uppercase tracking-widest text-gray-500"
// //                 >
// //                   Parameters
// //                 </Text>

// //                 <ConfigForm
// //                   instance={instance}
// //                   connectors={connectors}
// //                   onConfigChange={onConfigChange}
// //                   disabled={
// //                     mode === "playground" &&
// //                     instance.scope === "author"
// //                   }
// //                   mode={mode}
// //                   sessionId={sessionId}
// //                   cropAspect={cropAspect}
// //                   onImageUploaded={onImageUploaded}
// //                   scrollInputIntoView={scrollInputIntoView}
// //                 />
// //               </View>
// //             </View>
// //           </ScrollView>
// //         </KeyboardAvoidingView>
// //       )}
// //     </View>
// //   );
// // }

// import React, {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import {
//   View,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   Image,
//   Alert,
//   Switch,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   useWindowDimensions,
//   Keyboard,
//   InteractionManager,
// } from "react-native";

// import Text from "../components/AppText";

// import {
//   ChevronDown,
//   ChevronUp,
//   Trash2,
//   CheckCircle2,
//   X,
//   Plus,
// } from "lucide-react-native";

// import api from "../lib/api";

// import {
//   launchImageLibrary,
//   type Asset,
//   type ImagePickerResponse,
// } from "react-native-image-picker";

// import { useColorScheme } from "nativewind";

// import { uploadToS3 } from "../types/uploadtoS3";
// import { UploadType } from "../types/upload";

// // --------------------------------------------------
// // TYPES
// // --------------------------------------------------

// export type ConnectorMode =
//   | "config"
//   | "design"
//   | "playground";

// export type OAuthProvider =
//   | "google"
//   | "notion";

// export type PluginInstance = {
//   id: string;

//   pluginConnectorInstanceId?: string;

//   instanceKey: string;

//   connectorType: string;

//   config: Record<string, any>;

//   configScope?: "author" | "user";

//   scope?: "author" | "user";

//   isConnected?: boolean;

//   oauthTokenId?: string | null;

//   playgroundSessionId?: string;
// };

// type DynamicOption = {
//   label: string;
//   value: string;
// };

// type DynamicOptionsMap = Record<
//   string,
//   DynamicOption[]
// >;

// type SelectedImage = {
//   key: string;
//   asset: Asset;
// };

// type ConfigFormProps = {
//   instance: PluginInstance;
//   connectors: any[];

//   onConfigChange: (
//     id: string,
//     config: Record<string, any>
//   ) => void;

//   disabled?: boolean;

//   mode: ConnectorMode;

//   sessionId: string;

//   cropAspect?: number;

//   onImageUploaded?: () => void;

//   scrollInputIntoView: (
//     target: TextInput | null
//   ) => void;
// };

// type ConnectorCardProps = {
//   sessionId: string;

//   mode: ConnectorMode;

//   instance: PluginInstance;

//   connectors: any[];

//   openInstanceId?: string | null;

//   setOpenInstanceId?: (
//     id: string | null
//   ) => void;

//   onRemove?: (
//     instanceKey: string
//   ) => void | Promise<void>;

//   onUpdateScope?: (
//     id: string,
//     scope: "author" | "user"
//   ) => void;

//   onConfigChange: (
//     id: string,
//     config: Record<string, any>
//   ) => void;

//   onDisconnect?: (
//     id: string
//   ) => void | Promise<void>;

//   onStartOAuth?: (
//     id: string,
//     provider: OAuthProvider
//   ) => void | Promise<void>;

//   onImageUploaded?: () => void;

//   cropAspect?: number;
// };

// // --------------------------------------------------
// // HELPERS
// // --------------------------------------------------

// const getSafeFileName = (
//   asset: Asset
// ): string => {
//   if (asset.fileName) {
//     return asset.fileName;
//   }

//   const extension =
//     asset.type?.split("/")[1] || "jpg";

//   return `upload-${Date.now()}.${extension}`;
// };

// const getMimeType = (
//   asset: Asset
// ): string => {
//   if (asset.type) {
//     return asset.type;
//   }

//   const name =
//     asset.fileName?.toLowerCase() || "";

//   if (name.endsWith(".png")) {
//     return "image/png";
//   }

//   if (name.endsWith(".webp")) {
//     return "image/webp";
//   }

//   if (
//     name.endsWith(".heic") ||
//     name.endsWith(".heif")
//   ) {
//     return "image/heic";
//   }

//   return "image/jpeg";
// };

// const normalizeImageConfig = (
//   config: Record<string, any>
// ) => {
//   const images = Array.isArray(config.images)
//     ? config.images.map(
//         (image: any, index: number) => ({
//           ...image,
//           index,
//         })
//       )
//     : [];

//   if (images.length === 0) {
//     return {
//       ...config,
//       images: [],
//       currentIndex: undefined,
//     };
//   }

//   let currentIndex = Number(
//     config.currentIndex
//   );

//   if (
//     !Number.isInteger(currentIndex) ||
//     currentIndex < 1 ||
//     currentIndex > images.length
//   ) {
//     currentIndex = 1;
//   }

//   return {
//     ...config,
//     images,
//     currentIndex,
//   };
// };

// // ==================================================
// // CONFIG FORM
// // ==================================================

// function ConfigForm({
//   instance,
//   connectors,
//   onConfigChange,
//   disabled = false,
//   mode,
//   sessionId,
//   cropAspect = 1,
//   onImageUploaded,
//   scrollInputIntoView,
// }: ConfigFormProps) {
//   const connector = connectors.find(
//     (item) =>
//       item.type === instance.connectorType
//   );

//   const [selectedImages, setSelectedImages] =
//     useState<SelectedImage[]>([]);

//   const [uploading, setUploading] =
//     useState(false);

//   const [openSelect, setOpenSelect] =
//     useState<string | null>(null);

//   const [dynamicOptions, setDynamicOptions] =
//     useState<DynamicOptionsMap>({});

//   const [loadingDynamicOptions, setLoadingDynamicOptions] =
//     useState<Record<string, boolean>>({});

//   const [dynamicOptionError, setDynamicOptionError] =
//     useState<Record<string, boolean>>({});

//   const inputRefs = useRef<
//     Record<string, TextInput | null>
//   >({});

//   const dynamicFetchKeyRef = useRef<
//     Set<string>
//   >(new Set());

//   const effectiveScope =
//     mode === "config"
//       ? instance.configScope ?? "user"
//       : instance.scope ?? "user";

//   const isImageConnector =
//     connector?.type === "image" ||
//     connector?.schema?.category === "image";

//   const isFileEnabled =
//     mode === "config" ||
//     (mode === "playground" &&
//       effectiveScope === "user" &&
//       !disabled);

//   const isImageEditEnabled =
//     mode === "config" ||
//     (mode === "playground" &&
//       effectiveScope === "user" &&
//       !disabled);

//   if (!connector?.schema?.config) {
//     return null;
//   }
//   const schema = connector.schema.config;
//   const maxFiles =
//     schema?.images?.ui?.maxFiles ?? 5;

//   const images: any[] = Array.isArray(
//     instance.config?.images
//   )
//     ? instance.config.images
//     : [];


//   const updateConnectorConfig = async (
//     newConfig: Record<string, any>
//   ) => {
//     if (mode === "config") {
//       const id =
//         instance.pluginConnectorInstanceId ??
//         instance.id;

//       await api.patch(
//         `/plugin/connector-instance/${id}`,
//         {
//           config: newConfig,
//         }
//       );
//     } else if (mode === "playground") {
//       await api.patch(
//         `/playground/${sessionId}/connector-instance/${instance.id}`,
//         {
//           config: newConfig,
//         }
//       );
//     }
//     onConfigChange(
//       instance.id,
//       newConfig
//     );
//   };
//   const getImageUploadMetadata = () => {
//     if (mode === "config") {
//       return {
//         pluginConnectorInstanceId:
//           instance.pluginConnectorInstanceId ??
//           instance.id,
//       };
//     }
//     return {
//       playgroundConnectorConfigInstanceId:
//         instance.id,
//     };
//   };
//   const getImageUploadType = () => {
//     return mode === "config"
//       ? UploadType.PLUGIN_CONNECTOR_INSTANCE
//       : UploadType.PLAYGROUND_CONNECTOR_INSTANCE;
//   };

//   const chooseImages = useCallback(() => {
//     if (!isFileEnabled || uploading) {
//       return;
//     }

//     const remaining =
//       maxFiles - images.length;

//     if (remaining <= 0) {
//       Alert.alert(
//         "Maximum images reached",
//         `You can upload a maximum of ${maxFiles} images.`
//       );

//       return;
//     }

//     launchImageLibrary(
//       {
//         mediaType: "photo",
//         selectionLimit: remaining,
//         quality: 1,
//       },
//       (response: ImagePickerResponse) => {
//         if (response.didCancel) {
//           return;
//         }

//         if (response.errorCode) {
//           Alert.alert(
//             "Image Picker",
//             response.errorMessage ||
//               "Unable to select images."
//           );

//           return;
//         }

//         const assets = response.assets || [];

//         if (!assets.length) {
//           return;
//         }

//         const validAssets = assets.filter(
//           (asset) => !!asset.uri
//         );

//         setSelectedImages(
//           validAssets.map((asset) => ({
//             key: `${Date.now()}-${Math.random()}`,
//             asset,
//           }))
//         );
//       }
//     );
//   }, [
//     isFileEnabled,
//     uploading,
//     maxFiles,
//     images.length,
//   ]);

//   // --------------------------------------------------
//   // REMOVE SELECTED IMAGE
//   // --------------------------------------------------

//   const removeSelectedImage = (
//     key: string
//   ) => {
//     setSelectedImages((previous) =>
//       previous.filter(
//         (item) => item.key !== key
//       )
//     );
//   };

//   const uploadImages = async () => {
//     if (
//       !isFileEnabled ||
//       uploading ||
//       selectedImages.length === 0
//     ) {
//       return;
//     }

//     if (
//       images.length + selectedImages.length >
//       maxFiles
//     ) {
//       Alert.alert(
//         "Maximum images",
//         `Only ${maxFiles} images are allowed.`
//       );

//       return;
//     }

//     try {
//       setUploading(true);

//       const uploadedImages: any[] = [];

//       const uploadType =
//         getImageUploadType();

//       const metadata =
//         getImageUploadMetadata();

//       for (const selected of selectedImages) {
//         const asset = selected.asset;

//         if (!asset.uri) {
//           continue;
//         }

//         const fileUrl = await uploadToS3(
//           asset.uri,
//           uploadType,
//           metadata,
//           getSafeFileName(asset),
//           getMimeType(asset)
//         );

//         uploadedImages.push({
//           imageUrl: fileUrl,
//         });
//       }

//       if (uploadedImages.length === 0) {
//         throw new Error(
//           "No images were uploaded."
//         );
//       }

//       const updatedImages = [
//         ...images,
//         ...uploadedImages,
//       ];

//       let currentIndex = Number(
//         instance.config?.currentIndex
//       );

//       if (
//         !Number.isInteger(currentIndex) ||
//         currentIndex < 1 ||
//         currentIndex > updatedImages.length
//       ) {
//         currentIndex = 1;
//       }

//       const newConfig =
//         normalizeImageConfig({
//           ...instance.config,
//           images: updatedImages,
//           currentIndex,
//         });

//       await updateConnectorConfig(
//         newConfig
//       );

//       setSelectedImages([]);

//       onImageUploaded?.();

//       Alert.alert(
//         "Success",
//         "Images uploaded successfully."
//       );
//     } catch (error: any) {
//       console.log(
//         "Image upload failed:",
//         error?.response?.data ?? error
//       );

//       Alert.alert(
//         "Upload failed",
//         String(
//           error?.response?.data?.message ||
//             error?.message ||
//             "Unable to upload images."
//         )
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   // --------------------------------------------------
//   // DELETE SINGLE IMAGE
//   // --------------------------------------------------

//   const deleteSingleImage = async (
//     imageUrl: string
//   ) => {
//     if (
//       !isImageEditEnabled ||
//       !imageUrl ||
//       uploading
//     ) {
//       return;
//     }

//     Alert.alert(
//       "Delete image",
//       "Are you sure you want to delete this image?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setUploading(true);

//               if (mode === "config") {
//                 const id =
//                   instance.pluginConnectorInstanceId ??
//                   instance.id;

//                 await api.delete(
//                   `/plugin/connector-instance/${id}/image`,
//                   {
//                     params: {
//                       imageUrl,
//                     },
//                   }
//                 );
//               } else {
//                 await api.delete(
//                   `/playground/item/${instance.id}/image`,
//                   {
//                     data: {
//                       imageUrl,
//                     },
//                   }
//                 );
//               }

//               const updatedImages =
//                 images
//                   .filter(
//                     (image: any) =>
//                       image.imageUrl !== imageUrl
//                   );

//               let currentIndex = Number(
//                 instance.config?.currentIndex
//               );

//               if (
//                 updatedImages.length === 0
//               ) {
//                 currentIndex = undefined as any;
//               } else if (
//                 !Number.isInteger(currentIndex) ||
//                 currentIndex < 1 ||
//                 currentIndex >
//                   updatedImages.length
//               ) {
//                 currentIndex = 1;
//               }

//               const newConfig =
//                 normalizeImageConfig({
//                   ...instance.config,
//                   images: updatedImages,
//                   currentIndex,
//                 });

//               onConfigChange(
//                 instance.id,
//                 newConfig
//               );

//               onImageUploaded?.();

//               Alert.alert(
//                 "Success",
//                 "Image deleted successfully."
//               );
//             } catch (error: any) {
//               console.log(
//                 "Image deletion failed:",
//                 error?.response?.data ?? error
//               );

//               Alert.alert(
//                 "Delete failed",
//                 String(
//                   error?.response?.data?.message ||
//                     error?.message ||
//                     "Unable to delete image."
//                 )
//               );
//             } finally {
//               setUploading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // --------------------------------------------------
//   // DELETE ALL IMAGES
//   // --------------------------------------------------

//   const deleteAllImages = () => {
//     if (
//       !isImageEditEnabled ||
//       images.length === 0 ||
//       uploading
//     ) {
//       return;
//     }

//     Alert.alert(
//       "Delete all images",
//       "Are you sure you want to delete all images?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete All",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setUploading(true);

//               if (mode === "config") {
//                 const id =
//                   instance.pluginConnectorInstanceId ??
//                   instance.id;

//                 await api.delete(
//                   `/plugin/connector-instance/${id}/deleteImage`
//                 );
//               } else {
//                 await api.delete(
//                   `/playground/item/${instance.id}/deleteImage`
//                 );
//               }

//               const newConfig =
//                 normalizeImageConfig({
//                   ...instance.config,
//                   images: [],
//                   currentIndex: undefined,
//                 });

//               onConfigChange(
//                 instance.id,
//                 newConfig
//               );

//               setSelectedImages([]);

//               onImageUploaded?.();

//               Alert.alert(
//                 "Success",
//                 "All images deleted successfully."
//               );
//             } catch (error: any) {
//               console.log(
//                 "Delete all failed:",
//                 error?.response?.data ?? error
//               );

//               Alert.alert(
//                 "Delete failed",
//                 String(
//                   error?.response?.data?.message ||
//                     error?.message ||
//                     "Unable to delete images."
//                 )
//               );
//             } finally {
//               setUploading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // --------------------------------------------------
//   // DYNAMIC OPTIONS API
//   // --------------------------------------------------

//   const fetchDynamicOptions = useCallback(
//     async (
//       fieldName: string,
//       config: Record<string, any>
//     ) => {
//       const connectorInstanceId =
//         mode === "config"
//           ? instance.pluginConnectorInstanceId ??
//             instance.id
//           : instance.id;

//       const endpoint =
//         mode === "config"
//           ? `/execution/connector-instance/${connectorInstanceId}/field-options`
//           : `/execution/playground-connector-config/${connectorInstanceId}/field-options`;

//       try {
//         setLoadingDynamicOptions(
//           (previous) => ({
//             ...previous,
//             [fieldName]: true,
//           })
//         );

//         setDynamicOptionError(
//           (previous) => ({
//             ...previous,
//             [fieldName]: false,
//           })
//         );

//         const response = await api.post(
//           endpoint,
//           {
//             field: fieldName,
//             config,
//           }
//         );

//         const options: DynamicOption[] =
//           Array.isArray(response.data)
//             ? response.data
//             : [];

//         setDynamicOptions(
//           (previous) => ({
//             ...previous,
//             [fieldName]: options,
//           })
//         );
//       } catch (error: any) {
//         console.log(
//           "Dynamic options error:",
//           error?.response?.data ?? error
//         );

//         setDynamicOptions(
//           (previous) => ({
//             ...previous,
//             [fieldName]: [],
//           })
//         );

//         setDynamicOptionError(
//           (previous) => ({
//             ...previous,
//             [fieldName]: true,
//           })
//         );
//       } finally {
//         setLoadingDynamicOptions(
//           (previous) => ({
//             ...previous,
//             [fieldName]: false,
//           })
//         );
//       }
//     },
//     [
//       mode,
//       instance.id,
//       instance.pluginConnectorInstanceId,
//     ]
//   );

//   // --------------------------------------------------
//   // INITIAL DYNAMIC OPTIONS
//   // --------------------------------------------------

//   useEffect(() => {
//     if (
//       mode !== "config" &&
//       mode !== "playground"
//     ) {
//       return;
//     }

//     Object.entries(schema).forEach(
//       ([fieldKey, field]: [string, any]) => {
//         const isDynamic =
//           field?.ui?.dynamic === true ||
//           field?.ui?.dynamicOptions === true;

//         if (!isDynamic) {
//           return;
//         }

//         const dependencies =
//           field?.ui?.dependsOn ?? [];

//         const dependenciesReady =
//           dependencies.every(
//             (dependency: string) => {
//               const value =
//                 instance.config?.[dependency];

//               return (
//                 value !== undefined &&
//                 value !== null &&
//                 value !== ""
//               );
//             }
//           );

//         if (!dependenciesReady) {
//           setDynamicOptions((previous) => ({
//             ...previous,
//             [fieldKey]: [],
//           }));

//           return;
//         }

//         const dependencyValues =
//           dependencies.map(
//             (dependency: string) =>
//               instance.config?.[dependency]
//           );

//         const fetchKey = JSON.stringify({
//           id: instance.id,
//           fieldKey,
//           dependencyValues,
//           oauthTokenId: instance.oauthTokenId,
//         });

//         if (
//           dynamicFetchKeyRef.current.has(
//             fetchKey
//           )
//         ) {
//           return;
//         }

//         dynamicFetchKeyRef.current.add(
//           fetchKey
//         );

//         fetchDynamicOptions(
//           fieldKey,
//           instance.config ?? {}
//         );
//       }
//     );
//   }, [
//     mode,
//     instance.id,
//     instance.config,
//     instance.oauthTokenId,
//     schema,
//     fetchDynamicOptions,
//   ]);

//   // --------------------------------------------------
//   // UPDATE FIELD
//   // --------------------------------------------------

//   const updateField = (
//     key: string,
//     value: any
//   ) => {
//     onConfigChange(
//       instance.id,
//       {
//         ...instance.config,
//         [key]: value,
//       }
//     );
//   };

//   // ==================================================
//   // IMAGE CONNECTOR UI
//   // ==================================================

//   if (isImageConnector && mode !== "design") {
//     const imageField =
//       schema.images ?? {};

//     const currentIndex = Number(
//       instance.config?.currentIndex
//     );

//     return (
//       <View className="gap-4">
//         <Text
//           bold
//           className="text-[10px] uppercase tracking-widest text-gray-500"
//         >
//           {imageField.label || "Images"}
//         </Text>

//         {/* IMAGE COUNT */}

//         <View className="flex-row items-center justify-between">
//           <Text className="text-xs text-gray-500">
//             {images.length}/{maxFiles} images
//           </Text>

//           <Text className="text-[10px] text-gray-500">
//             Aspect ratio: {cropAspect.toFixed(2)}
//           </Text>
//         </View>

//         {/* EXISTING IMAGES */}

//         {images.length > 0 && (
//           <View className="gap-3">
//             {images.map(
//               (image: any, index: number) => (
//                 <View
//                   key={
//                     image.imageUrl ||
//                     `image-${index}`
//                   }
//                   className="flex-row items-center gap-3 rounded-lg border border-gray-200 p-2 dark:border-gray-800"
//                 >
//                   <Image
//                     source={{
//                       uri: image.imageUrl,
//                     }}
//                     className="h-20 w-20 rounded"
//                     resizeMode="cover"
//                   />

//                   <View className="flex-1 gap-1">
//                     <Text
//                       bold
//                       className="text-xs text-gray-900 dark:text-white"
//                     >
//                       Image {index + 1}
//                     </Text>

//                     <Text className="text-[10px] text-gray-500">
//                       {currentIndex === index + 1
//                         ? "Current image"
//                         : `Position ${index + 1}`}
//                     </Text>
//                   </View>

//                   <TouchableOpacity
//                     disabled={
//                       uploading ||
//                       !isImageEditEnabled
//                     }
//                     onPress={() =>
//                       deleteSingleImage(
//                         image.imageUrl
//                       )
//                     }
//                     className="p-2"
//                   >
//                     <X
//                       size={18}
//                       color="#ef4444"
//                     />
//                   </TouchableOpacity>
//                 </View>
//               )
//             )}
//           </View>
//         )}

//         {/* ADD IMAGES */}

//         {images.length < maxFiles && (
//           <TouchableOpacity
//             disabled={
//               !isFileEnabled || uploading
//             }
//             onPress={chooseImages}
//             className={`flex-row items-center justify-center gap-2 rounded py-3 ${
//               isFileEnabled
//                 ? "bg-gray-600"
//                 : "bg-gray-300 dark:bg-gray-800"
//             }`}
//           >
//             <Plus
//               size={16}
//               color="#ffffff"
//             />

//             <Text
//               bold
//               className="text-xs text-white"
//             >
//               {images.length === 0
//                 ? "Choose Images"
//                 : "Add Images"}
//             </Text>
//           </TouchableOpacity>
//         )}

//         {/* SELECTED IMAGE PREVIEWS */}

//         {selectedImages.length > 0 && (
//           <View className="gap-3">
//             <Text
//               bold
//               className="text-xs text-gray-500"
//             >
//               Selected Images
//             </Text>

//             {selectedImages.map((item) => (
//               <View
//                 key={item.key}
//                 className="flex-row items-center gap-3"
//               >
//                 <Image
//                   source={{
//                     uri: item.asset.uri,
//                   }}
//                   className="h-16 w-16 rounded"
//                   resizeMode="cover"
//                 />

//                 <View className="flex-1">
//                   <Text
//                     className="text-xs text-gray-800 dark:text-white"
//                     numberOfLines={2}
//                   >
//                     {getSafeFileName(item.asset)}
//                   </Text>
//                 </View>

//                 <TouchableOpacity
//                   disabled={uploading}
//                   onPress={() =>
//                     removeSelectedImage(item.key)
//                   }
//                 >
//                   <X
//                     size={18}
//                     color="#ef4444"
//                   />
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* UPLOAD BUTTON */}

//         {selectedImages.length > 0 && (
//           <TouchableOpacity
//             disabled={uploading}
//             onPress={uploadImages}
//             className="flex-row items-center justify-center gap-2 rounded bg-blue-600 py-3"
//           >
//             {uploading && (
//               <ActivityIndicator
//                 size="small"
//                 color="#ffffff"
//               />
//             )}

//             <Text
//               bold
//               className="text-xs text-white"
//             >
//               {uploading
//                 ? "Uploading..."
//                 : `Upload ${selectedImages.length} Image${
//                     selectedImages.length > 1
//                       ? "s"
//                       : ""
//                   }`}
//             </Text>
//           </TouchableOpacity>
//         )}

//         {/* DELETE ALL */}

//         {images.length > 0 && (
//           <TouchableOpacity
//             disabled={
//               uploading ||
//               !isImageEditEnabled
//             }
//             onPress={deleteAllImages}
//             className="flex-row items-center justify-center gap-2 rounded bg-gray-600 py-3"
//           >
//             <Trash2
//               size={15}
//               color="#ffffff"
//             />

//             <Text
//               bold
//               className="text-xs text-white"
//             >
//               Delete All Images
//             </Text>
//           </TouchableOpacity>
//         )}

//         {/* CURRENT INDEX */}

//         {images.length > 0 && (
//           <View className="gap-2">
//             <Text
//               bold
//               className="text-[10px] uppercase tracking-widest text-gray-500"
//             >
//               {schema.currentIndex?.label ||
//                 "Restart from image"}
//             </Text>

//             <TextInput
//               editable={!disabled}
//               keyboardType="number-pad"
//               value={String(
//                 Number.isInteger(currentIndex) &&
//                   currentIndex >= 1 &&
//                   currentIndex <= images.length
//                   ? currentIndex
//                   : 1
//               )}
//               onChangeText={(value) => {
//                 if (!/^\d+$/.test(value)) {
//                   return;
//                 }

//                 const number = Number(value);

//                 if (
//                   number < 1 ||
//                   number > images.length
//                 ) {
//                   return;
//                 }

//                 updateField(
//                   "currentIndex",
//                   number
//                 );
//               }}
//               className="rounded border border-gray-300 bg-white px-3 py-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-black dark:text-white"
//               placeholder="Enter image number"
//               placeholderTextColor="#9ca3af"
//             />

//             <Text className="text-[10px] text-gray-500">
//               Select image 1 to {images.length}
//             </Text>
//           </View>
//         )}

//         {!isFileEnabled && (
//           <Text className="text-[10px] text-gray-400">
//             Image upload is available for user-scoped playground connectors and config mode.
//           </Text>
//         )}
//       </View>
//     );
//   }

//   // ==================================================
//   // NORMAL CONNECTOR PARAMETERS
//   // ==================================================

//   return (
//     <View className="gap-5">
//       {Object.entries(schema).map(
//         ([key, field]: [string, any]) => {
//           const value =
//             instance.config?.[key] ??
//             field?.default ??
//             "";

//           const isBoolean =
//             field?.type === "boolean" ||
//             typeof value === "boolean";

//           const isNumber =
//             field?.type === "number";

//           const isDate =
//             /date/i.test(key) ||
//             /date/i.test(field?.label || "");

//           const isStaticSelect =
//             field?.ui?.component === "select" &&
//             Array.isArray(field?.ui?.options);

//           const isDynamicSelect =
//             field?.ui?.dynamic === true ||
//             field?.ui?.dynamicOptions === true;

//           const isSelect =
//             isStaticSelect || isDynamicSelect;

//           const options: DynamicOption[] =
//             isDynamicSelect
//               ? dynamicOptions[key] ?? []
//               : (field?.ui?.options ?? []).map(
//                   (option: string) => ({
//                     label: option,
//                     value: option,
//                   })
//                 );

//           const isLoading =
//             loadingDynamicOptions[key] === true;

//           return (
//             <View
//               key={key}
//               className="gap-2"
//             >
//               <Text
//                 bold
//                 className="text-[10px] uppercase tracking-widest text-gray-500"
//               >
//                 {field?.label || key}
//               </Text>

//               {/* BOOLEAN */}

//               {isBoolean ? (
//                 <View className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-[#0d0d0d]">
//                   <Text className="flex-1 text-xs text-gray-900 dark:text-white">
//                     {value === true ||
//                     value === "true"
//                       ? "Enabled"
//                       : "Disabled"}
//                   </Text>

//                   <Switch
//                     value={
//                       value === true ||
//                       value === "true"
//                     }
//                     disabled={disabled}
//                     onValueChange={(checked) =>
//                       updateField(key, checked)
//                     }
//                     trackColor={{
//                       false: "#9ca3af",
//                       true: "#2563eb",
//                     }}
//                     thumbColor="#ffffff"
//                   />
//                 </View>
//               ) : null}

//               {/* STATIC / DYNAMIC SELECT */}

//               {isSelect && (
//                 <View className="gap-2">
//                   <TouchableOpacity
//                     disabled={
//                       disabled || isLoading
//                     }
//                     onPress={() =>
//                       setOpenSelect(
//                         openSelect === key
//                           ? null
//                           : key
//                       )
//                     }
//                     className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-black"
//                   >
//                     <Text
//                       className="flex-1 text-xs text-gray-900 dark:text-white"
//                       numberOfLines={1}
//                     >
//                       {isLoading
//                         ? "Loading..."
//                         : options.find(
//                             (option) =>
//                               option.value ===
//                               String(value)
//                           )?.label ||
//                           `Select ${field?.label || key}`}
//                     </Text>

//                     {isLoading ? (
//                       <ActivityIndicator
//                         size="small"
//                         color="#2563eb"
//                       />
//                     ) : (
//                       <ChevronDown
//                         size={17}
//                         color="#9ca3af"
//                       />
//                     )}
//                   </TouchableOpacity>

//                   {openSelect === key &&
//                     !isLoading && (
//                       <View className="rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-[#111111]">
//                         <ScrollView
//                           nestedScrollEnabled
//                           style={{
//                             maxHeight: 200,
//                           }}
//                         >
//                           {options.map(
//                             (option) => {
//                               const selected =
//                                 String(value) ===
//                                 option.value;

//                               return (
//                                 <TouchableOpacity
//                                   key={option.value}
//                                   onPress={() => {
//                                     const newConfig = {
//                                       ...instance.config,
//                                       [key]: option.value,
//                                     };

//                                     const dependentFields =
//                                       Object.entries(
//                                         schema
//                                       ).filter(
//                                         ([, dependentField]: any) =>
//                                           dependentField?.ui?.dependsOn?.includes(
//                                             key
//                                           )
//                                       );

//                                     dependentFields.forEach(
//                                       ([dependentKey]) => {
//                                         newConfig[
//                                           dependentKey
//                                         ] = "";
//                                       }
//                                     );

//                                     onConfigChange(
//                                       instance.id,
//                                       newConfig
//                                     );

//                                     setOpenSelect(null);

//                                     // Clear old dependent options.
//                                     setDynamicOptions(
//                                       (previous) => {
//                                         const updated = {
//                                           ...previous,
//                                         };

//                                         dependentFields.forEach(
//                                           ([dependentKey]) => {
//                                             updated[
//                                               dependentKey
//                                             ] = [];
//                                           }
//                                         );

//                                         return updated;
//                                       }
//                                     );

//                                     // Fetch dependent options.
//                                     dependentFields.forEach(
//                                       ([dependentKey, dependentField]: any) => {
//                                         const dynamic =
//                                           dependentField?.ui?.dynamic === true ||
//                                           dependentField?.ui?.dynamicOptions === true;

//                                         if (!dynamic) {
//                                           return;
//                                         }

//                                         const dependencies =
//                                           dependentField?.ui?.dependsOn ?? [];

//                                         const ready =
//                                           dependencies.every(
//                                             (dependency: string) =>
//                                               newConfig[dependency] !== undefined &&
//                                               newConfig[dependency] !== null &&
//                                               newConfig[dependency] !== ""
//                                           );

//                                         if (ready) {
//                                           fetchDynamicOptions(
//                                             dependentKey,
//                                             newConfig
//                                           );
//                                         }
//                                       }
//                                     );
//                                   }}
//                                   className={`flex-row items-center justify-between rounded px-3 py-3 ${
//                                     selected
//                                       ? "bg-blue-100 dark:bg-blue-900/30"
//                                       : ""
//                                   }`}
//                                 >
//                                   <Text
//                                     className={`text-xs ${
//                                       selected
//                                         ? "text-blue-600 dark:text-blue-400"
//                                         : "text-gray-900 dark:text-white"
//                                     }`}
//                                   >
//                                     {option.label}
//                                   </Text>

//                                   {selected && (
//                                     <CheckCircle2
//                                       size={16}
//                                       color="#2563eb"
//                                     />
//                                   )}
//                                 </TouchableOpacity>
//                               );
//                             }
//                           )}

//                           {options.length === 0 && (
//                             <Text className="p-3 text-xs text-gray-500">
//                               No options available.
//                             </Text>
//                           )}
//                         </ScrollView>
//                       </View>
//                     )}

//                   {dynamicOptionError[key] && (
//                     <Text className="text-[10px] text-red-500">
//                       Failed to load options.
//                     </Text>
//                   )}
//                 </View>
//               )}

//               {/* NUMBER */}

//               {!isBoolean &&
//                 !isSelect &&
//                 isNumber && (
//                   <TextInput
//                     ref={(input) => {
//                       inputRefs.current[key] =
//                         input;
//                     }}
//                     editable={!disabled}
//                     keyboardType="numeric"
//                     value={
//                       value === "" ||
//                       value == null
//                         ? ""
//                         : String(value)
//                     }
//                     onFocus={() =>
//                       scrollInputIntoView(
//                         inputRefs.current[key]
//                       )
//                     }
//                     onChangeText={(text) => {
//                       updateField(
//                         key,
//                         text === ""
//                           ? ""
//                           : Number(text)
//                       );
//                     }}
//                     placeholder={
//                       field?.placeholder ||
//                       field?.label ||
//                       key
//                     }
//                     placeholderTextColor="#9ca3af"
//                     className="rounded border border-gray-300 bg-white px-3 py-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-[#0d0d0d] dark:text-white"
//                   />
//                 )}

//               {/* TEXT / DATE */}

//               {!isBoolean &&
//                 !isSelect &&
//                 !isNumber && (
//                   <TextInput
//                     ref={(input) => {
//                       inputRefs.current[key] =
//                         input;
//                     }}
//                     editable={!disabled}
//                     value={
//                       value == null
//                         ? ""
//                         : String(value)
//                     }
//                     onFocus={() =>
//                       scrollInputIntoView(
//                         inputRefs.current[key]
//                       )
//                     }
//                     onChangeText={(text) =>
//                       updateField(key, text)
//                     }
//                     placeholder={
//                       field?.placeholder ||
//                       (isDate
//                         ? `${field?.label || key} (YYYY-MM-DD)`
//                         : field?.label || key)
//                     }
//                     placeholderTextColor="#9ca3af"
//                     autoCapitalize="none"
//                     autoCorrect={false}
//                     keyboardType={
//                       isDate
//                         ? "numbers-and-punctuation"
//                         : "default"
//                     }
//                     returnKeyType="done"
//                     className="rounded border border-gray-300 bg-white px-3 py-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-[#0d0d0d] dark:text-white"
//                   />
//                 )}
//             </View>
//           );
//         }
//       )}
//     </View>
//   );
// }

// // ==================================================
// // SAMPLE RESPONSE
// // ==================================================

// function SampleResponse({
//   sampleResponse,
// }: {
//   sampleResponse: any;
// }) {
//   const [open, setOpen] = useState(false);

//   if (!sampleResponse) {
//     return null;
//   }

//   return (
//     <View className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
//       <TouchableOpacity
//         onPress={() =>
//           setOpen((previous) => !previous)
//         }
//         className="flex-row items-center justify-between bg-gray-100 px-3 py-3 dark:bg-[#111]"
//       >
//         <Text
//           bold
//           className="text-[10px] uppercase tracking-widest text-gray-500"
//         >
//           Sample Response
//         </Text>

//         {open ? (
//           <ChevronUp
//             size={17}
//             color="#9ca3af"
//           />
//         ) : (
//           <ChevronDown
//             size={17}
//             color="#9ca3af"
//           />
//         )}
//       </TouchableOpacity>

//       {open && (
//         <ScrollView
//           nestedScrollEnabled
//           style={{
//             maxHeight: 300,
//           }}
//           className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-black"
//         >
//           <Text
//             className="text-[10px] leading-5 text-gray-700 dark:text-gray-300"
//             selectable
//           >
//             {JSON.stringify(
//               sampleResponse,
//               null,
//               2
//             )}
//           </Text>
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// // ==================================================
// // CONNECTOR CARD
// // ==================================================

// export function ConnectorCard({
//   mode,
//   sessionId,
//   instance,
//   connectors,
//   openInstanceId,
//   setOpenInstanceId,
//   onRemove,
//   onUpdateScope,
//   onConfigChange,
//   onDisconnect,
//   onStartOAuth,
//   onImageUploaded,
//   cropAspect = 1,
// }: ConnectorCardProps) {
//   const connector = connectors.find(
//     (item) =>
//       item.type === instance.connectorType
//   );

//   const isCollapsible =
//     mode !== "config";

//   const isOpen =
//     !isCollapsible ||
//     openInstanceId === instance.id;

//   const [isDisconnecting, setIsDisconnecting] =
//     useState(false);

//   const [isRemoving, setIsRemoving] =
//     useState(false);

//   const { colorScheme } =
//     useColorScheme();

//   const iconColor =
//     colorScheme === "dark"
//       ? "#ffffff"
//       : "#111111";

//   const [isConnected, setIsConnected] =
//     useState(!!instance.oauthTokenId);

//   const { height: windowHeight } =
//     useWindowDimensions();

//   const scrollRef =
//     useRef<ScrollView>(null);

//   const focusedInputRef =
//     useRef<TextInput | null>(null);

//   const viewportHeightRef =
//     useRef(0);

//   const pendingScrollRef =
//     useRef<{ cancel?: () => void } | null>(
//       null
//     );

//   const connectorFormMaxHeight =
//     Math.max(
//       180,
//       Math.min(560, windowHeight * 0.65)
//     );

//   const oauthProvider =
//     connector?.schema?.oauth?.provider;

//   const isSupportedOAuthProvider =
//     oauthProvider === "google" ||
//     oauthProvider === "notion";

//   const effectiveScope =
//     mode === "config"
//       ? instance.configScope
//       : instance.scope;

//   const canUseOAuth =
//     mode === "config"
//       ? effectiveScope === "author" ||
//         effectiveScope === "user"
//       : effectiveScope === "user";

//   // --------------------------------------------------
//   // SYNC OAUTH STATUS
//   // --------------------------------------------------

//   useEffect(() => {
//     setIsConnected(
//       !!instance.oauthTokenId
//     );
//   }, [instance.oauthTokenId]);

//   // --------------------------------------------------
//   // EXPAND / COLLAPSE
//   // --------------------------------------------------

//   const toggleOpen = () => {
//     if (
//       !isCollapsible ||
//       !setOpenInstanceId
//     ) {
//       return;
//     }

//     setOpenInstanceId(
//       isOpen ? null : instance.id
//     );
//   };

//   // --------------------------------------------------
//   // KEYBOARD SCROLL HANDLING
//   // --------------------------------------------------

//   const scrollInputIntoView = useCallback(
//     (target: TextInput | null) => {
//       if (!target) {
//         return;
//       }

//       focusedInputRef.current = target;

//       const task =
//         InteractionManager.runAfterInteractions(
//           () => {
//             requestAnimationFrame(() => {
//               const currentScroll =
//                 scrollRef.current;

//               const input =
//                 focusedInputRef.current;

//               if (!currentScroll || !input) {
//                 return;
//               }

//               const nativeScrollRef =
//                 currentScroll.getNativeScrollRef();

//               if (!nativeScrollRef) {
//                 return;
//               }

//               input.measureLayout(
//                 nativeScrollRef,
//                 (_x, y, _width, height) => {
//                   const viewportHeight =
//                     viewportHeightRef.current ||
//                     connectorFormMaxHeight;

//                   const topPadding = 20;
//                   const bottomPadding = 48;

//                   const inputBottom =
//                     y + height;

//                   const visibleBottom =
//                     viewportHeight -
//                     bottomPadding;

//                   if (
//                     inputBottom > visibleBottom
//                   ) {
//                     currentScroll.scrollTo({
//                       y: Math.max(
//                         0,
//                         inputBottom -
//                           visibleBottom +
//                           12
//                       ),
//                       animated: true,
//                     });
//                   } else if (
//                     y < topPadding
//                   ) {
//                     currentScroll.scrollTo({
//                       y: Math.max(
//                         0,
//                         y - topPadding
//                       ),
//                       animated: true,
//                     });
//                   }
//                 },
//                 () => {}
//               );
//             });
//           }
//         );

//       pendingScrollRef.current = task;
//     },
//     [connectorFormMaxHeight]
//   );

//   useEffect(() => {
//     const subscription =
//       Keyboard.addListener(
//         "keyboardDidShow",
//         () => {
//           if (focusedInputRef.current) {
//             scrollInputIntoView(
//               focusedInputRef.current
//             );
//           }
//         }
//       );

//     return () => {
//       subscription.remove();

//       pendingScrollRef.current?.cancel?.();
//     };
//   }, [scrollInputIntoView]);

//   // --------------------------------------------------
//   // OAUTH CONNECT
//   // --------------------------------------------------

//   const handleConnect = async () => {
//     if (
//       !connector?.schema?.oauth ||
//       !canUseOAuth ||
//       !isSupportedOAuthProvider ||
//       !onStartOAuth
//     ) {
//       return;
//     }

//     try {
//       await onStartOAuth(
//         instance.id,
//         oauthProvider as OAuthProvider
//       );
//     } catch (error: any) {
//       console.log(
//         "OAuth connect failed:",
//         error?.response?.data ?? error
//       );

//       Alert.alert(
//         "OAuth",
//         error?.response?.data?.message ||
//           error?.message ||
//           "Unable to connect account."
//       );
//     }
//   };

//   // --------------------------------------------------
//   // OAUTH DISCONNECT
//   // --------------------------------------------------

//   const handleDisconnect = async () => {
//     if (
//       !canUseOAuth ||
//       isDisconnecting
//     ) {
//       return;
//     }

//     try {
//       setIsDisconnecting(true);

//       if (mode === "config") {
//         await api.post(
//           `/plugin/${instance.id}/oauth/disconnect`
//         );
//       } else {
//         await api.delete(
//           `/playground/connector/${instance.id}/oauth/detach`
//         );
//       }

//       setIsConnected(false);

//       await onDisconnect?.(instance.id);
//     } catch (error: any) {
//       console.log(
//         "OAuth disconnect failed:",
//         error?.response?.data ?? error
//       );

//       Alert.alert(
//         "Logout failed",
//         error?.response?.data?.message ||
//           error?.message ||
//           "Unable to disconnect account."
//       );
//     } finally {
//       setIsDisconnecting(false);
//     }
//   };

//   // --------------------------------------------------
//   // REMOVE CONNECTOR
//   // --------------------------------------------------

//   const handleRemove = () => {
//     if (!onRemove || isRemoving) {
//       return;
//     }

//     Alert.alert(
//       "Remove connector",
//       `Are you sure you want to remove "${instance.instanceKey}"?`,
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Remove",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setIsRemoving(true);

//               await onRemove(
//                 instance.instanceKey
//               );
//             } catch (error) {
//               console.log(
//                 "Remove connector failed:",
//                 error
//               );

//               Alert.alert(
//                 "Remove failed",
//                 "Unable to remove connector."
//               );
//             } finally {
//               setIsRemoving(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // ==================================================
//   // CONNECTOR CARD UI
//   // ==================================================

//   return (
//     <View className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0d0d0d]">
//       {/* HEADER */}

//       <TouchableOpacity
//         activeOpacity={
//           isCollapsible ? 0.7 : 1
//         }
//         disabled={
//           !isCollapsible ||
//           !setOpenInstanceId
//         }
//         onPress={toggleOpen}
//         className="flex-row items-center justify-between px-4 py-3"
//       >
//         <View className="flex-1">
//           <Text className="text-sm text-blue-600 dark:text-blue-400">
//             {"{{ " +
//               instance.instanceKey +
//               " }}"}
//           </Text>

//           <Text
//             bold
//             className="mt-1 text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-500"
//           >
//             {connector?.schema?.label ||
//               instance.connectorType}
//           </Text>
//         </View>

//         <View className="flex-row items-center gap-3">
//           {onRemove && (
//             <TouchableOpacity
//               disabled={isRemoving}
//               onPress={handleRemove}
//               hitSlop={8}
//               className="p-1"
//             >
//               {isRemoving ? (
//                 <ActivityIndicator
//                   size="small"
//                   color={iconColor}
//                 />
//               ) : (
//                 <Trash2
//                   size={17}
//                   color={iconColor}
//                 />
//               )}
//             </TouchableOpacity>
//           )}

//           {isCollapsible &&
//             (isOpen ? (
//               <ChevronUp
//                 size={18}
//                 color={iconColor}
//               />
//             ) : (
//               <ChevronDown
//                 size={18}
//                 color={iconColor}
//               />
//             ))}
//         </View>
//       </TouchableOpacity>

//       {/* CONTENT */}

//       {isOpen && (
//         <KeyboardAvoidingView
//           style={{
//             flexShrink: 1,
//           }}
//           behavior={
//             Platform.OS === "ios"
//               ? "padding"
//               : undefined
//           }
//           keyboardVerticalOffset={
//             Platform.OS === "ios" ? 90 : 0
//           }
//         >
//           <ScrollView
//             ref={scrollRef}
//             style={{
//               maxHeight:
//                 connectorFormMaxHeight,
//               flexShrink: 1,
//             }}
//             onLayout={(event) => {
//               viewportHeightRef.current =
//                 event.nativeEvent.layout.height;
//             }}
//             contentContainerStyle={{
//               padding: 16,
//               paddingBottom: 150,
//             }}
//             keyboardShouldPersistTaps="handled"
//             keyboardDismissMode={
//               Platform.OS === "ios"
//                 ? "interactive"
//                 : "on-drag"
//             }
//             nestedScrollEnabled
//             automaticallyAdjustKeyboardInsets={
//               Platform.OS === "ios"
//             }
//             showsVerticalScrollIndicator
//           >
//             <View className="gap-5">

//               {/* OAUTH */}

//               {connector?.schema?.oauth && (
//                 <View className="gap-3">
//                   <Text
//                     bold
//                     className="text-[10px] uppercase tracking-widest text-gray-500"
//                   >
//                     Authentication Required
//                   </Text>

//                   {isConnected ? (
//                     <View className="flex-row items-center justify-between gap-2 rounded border border-green-500/20 bg-green-400/5 px-3 py-3">
//                       <View className="flex-1 flex-row items-center gap-2">
//                         <CheckCircle2
//                           size={17}
//                           color="#4ade80"
//                         />

//                         <Text className="flex-1 text-xs text-green-400">
//                           Connected to{" "}
//                           {oauthProvider ||
//                             "Account"}
//                         </Text>
//                       </View>

//                       <TouchableOpacity
//                         disabled={
//                           isDisconnecting ||
//                           !canUseOAuth
//                         }
//                         onPress={
//                           handleDisconnect
//                         }
//                         className={`rounded px-3 py-2 ${
//                           isDisconnecting
//                             ? "bg-gray-400"
//                             : "bg-gray-500"
//                         }`}
//                       >
//                         <Text
//                           bold
//                           className="text-xs text-white"
//                         >
//                           {isDisconnecting
//                             ? "Logging out..."
//                             : "Logout"}
//                         </Text>
//                       </TouchableOpacity>
//                     </View>
//                   ) : (
//                     <TouchableOpacity
//                       disabled={
//                         !canUseOAuth ||
//                         !onStartOAuth ||
//                         !isSupportedOAuthProvider
//                       }
//                       onPress={handleConnect}
//                       className={`w-full rounded py-3 ${
//                         canUseOAuth &&
//                         onStartOAuth &&
//                         isSupportedOAuthProvider
//                           ? "bg-blue-600"
//                           : "bg-blue-300 dark:bg-blue-900"
//                       }`}
//                     >
//                       <Text
//                         bold
//                         className="text-center text-xs text-white"
//                       >
//                         Connect{" "}
//                         {oauthProvider ||
//                           "Account"}
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                 </View>
//               )}

//               {/* CONFIG SCOPE */}

//               {onUpdateScope && (
//                 <View className="gap-2">
//                   <Text
//                     bold
//                     className="text-[10px] uppercase tracking-widest text-gray-500"
//                   >
//                     Config Scope
//                   </Text>

//                   <View className="flex-row rounded border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-black">
//                     {(
//                       ["author", "user"] as const
//                     ).map((scope) => {
//                       const selectedScope =
//                         instance.configScope ??
//                         instance.scope ??
//                         "user";

//                       const selected =
//                         selectedScope === scope;

//                       return (
//                         <TouchableOpacity
//                           key={scope}
//                           disabled={selected}
//                           onPress={() =>
//                             onUpdateScope(
//                               instance.id,
//                               scope
//                             )
//                           }
//                           className={`flex-1 items-center rounded py-2 ${
//                             selected
//                               ? "bg-white dark:bg-gray-800"
//                               : ""
//                           }`}
//                         >
//                           <Text
//                             bold={selected}
//                             className={`text-[10px] uppercase ${
//                               selected
//                                 ? "text-gray-900 dark:text-white"
//                                 : "text-gray-500"
//                             }`}
//                           >
//                             {scope}
//                           </Text>
//                         </TouchableOpacity>
//                       );
//                     })}
//                   </View>
//                 </View>
//               )}

//               {/* PARAMETERS */}

//               <View className="gap-3">
//                 <Text
//                   bold
//                   className="text-[10px] uppercase tracking-widest text-gray-500"
//                 >
//                   Parameters
//                 </Text>

//                 <ConfigForm
//                   instance={instance}
//                   connectors={connectors}
//                   onConfigChange={
//                     onConfigChange
//                   }
//                   disabled={
//                     mode === "playground" &&
//                     instance.scope === "author"
//                   }
//                   mode={mode}
//                   sessionId={sessionId}
//                   cropAspect={cropAspect}
//                   onImageUploaded={
//                     onImageUploaded
//                   }
//                   scrollInputIntoView={
//                     scrollInputIntoView
//                   }
//                 />
//               </View>

//               {/* SAMPLE RESPONSE */}

//               {mode === "design" &&
//                 connector?.schema?.sampleResponse && (
//                   <SampleResponse
//                     sampleResponse={
//                       connector.schema.sampleResponse
//                     }
//                   />
//                 )}
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       )}
//     </View>
//   );
// }

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
  Linking,
} from "react-native";
import Text from "../components/AppText";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react-native";
import InAppBrowser from "react-native-inappbrowser-reborn";
import {
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from "react-native-image-picker";
import { useColorScheme } from "nativewind";
import api from "../lib/api";
import { uploadToS3 } from "../types/uploadtoS3";
import { UploadType } from "../types/upload";

// Sent to the backend as `origin` (the web app sends window.location.origin).
// Change this to whatever your backend expects for the mobile app.
const APP_ORIGIN = "https://demoapp.livetag.in";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type ConnectorMode = "config" | "design" | "playground";
export type OAuthProvider = "google" | "notion";

export type PluginInstance = {
  id: string;
  pluginConnectorInstanceId?: string;
  instanceKey: string;
  connectorType: string;
  config: Record<string, any>;
  configScope?: "author" | "user";
  scope?: "author" | "user";
  isConnected?: boolean;
  oauthTokenId?: string | null;
  playgroundSessionId?: string;
};

type DynamicOption = { label: string; value: string };
type DynamicOptionsMap = Record<string, DynamicOption[]>;
type SelectedImage = { key: string; asset: Asset };
type OAuthConnectResponse = { url: string };

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
  onStartOAuth?: (id: string, provider: OAuthProvider) => void | Promise<void>;
  onOAuthConnected?: (instanceId: string) => Promise<boolean>;
  onImageUploaded?: () => void;
  cropAspect?: number;
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getErrorText = (error: any, fallback: string): string =>
  String(
    error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      fallback
  );

const getSafeFileName = (asset: Asset): string => {
  if (asset.fileName) return asset.fileName;
  const extension = asset.type?.split("/")[1] || "jpg";
  return `upload-${Date.now()}.${extension}`;
};

const getMimeType = (asset: Asset): string => {
  if (asset.type) return asset.type;
  const name = asset.fileName?.toLowerCase() || "";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
};

// Same as the web app
const normalizeImageConfig = (config: any) => {
  const images = Array.isArray(config?.images)
    ? config.images.map((image: any, index: number) => ({
        imageUrl: image.imageUrl,
        index,
      }))
    : [];

  if (images.length === 0) {
    return { ...config, images: [], currentIndex: undefined };
  }

  let currentIndex = Number(config?.currentIndex);
  if (
    !Number.isInteger(currentIndex) ||
    currentIndex < 1 ||
    currentIndex > images.length
  ) {
    currentIndex = 1;
  }

  return { ...config, images, currentIndex };
};

// ==================================================
// CONFIG FORM
// ==================================================

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

  const schema: Record<string, any> = connector?.schema?.config ?? {};

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptionsMap>({});
  const [loadingDynamicOptions, setLoadingDynamicOptions] = useState<
    Record<string, boolean>
  >({});
  const [dynamicOptionError, setDynamicOptionError] = useState<
    Record<string, boolean>
  >({});

  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const effectiveScope = instance.scope ?? instance.configScope;

  const isImageConnector =
    connector?.type === "image" || connector?.schema?.category === "image";

  // Same rules as web: config = always, playground = user scope only
  const isFileEnabled =
    mode === "config" || (mode === "playground" && effectiveScope === "user");
  const isImageEditEnabled = isFileEnabled;

  const maxFiles = schema?.images?.ui?.maxFiles ?? 5;

  const images: any[] = Array.isArray(instance.config?.images)
    ? instance.config.images
    : [];

  // currentIndex (1-based, never 0)
  const backendIndex = Number(instance.config?.currentIndex);
  const currentIndex =
    Number.isInteger(backendIndex) &&
    backendIndex >= 1 &&
    backendIndex <= images.length
      ? backendIndex
      : 1;

  const [indexText, setIndexText] = useState(String(currentIndex));

  useEffect(() => {
    setIndexText(String(currentIndex));
  }, [currentIndex]);

  // --------------------------------------------------
  // IDS / ENDPOINT HELPERS (same as web)
  // --------------------------------------------------

  const getPluginConnectorInstanceId = () => {
    const id = instance.pluginConnectorInstanceId ?? instance.id;
    if (!id) throw new Error("Missing pluginConnectorInstanceId");
    return id;
  };

  const getPlaygroundConnectorConfigId = () => {
    if (!instance.id) throw new Error("Missing playground connector config ID");
    return instance.id;
  };

  const updateConnectorConfig = async (newConfig: Record<string, any>) => {
    if (mode === "config") {
      const id = getPluginConnectorInstanceId();

      await api.patch(`/plugin/connector-instance/${id}`, {
        config: newConfig,
      });

      onConfigChange(instance.id, newConfig);
      return;
    }

    if (mode === "playground") {
      const playgroundSessionId = instance.playgroundSessionId ?? sessionId;
      if (!playgroundSessionId) throw new Error("Missing playgroundSessionId");

      await api.patch(
        `/playground/${playgroundSessionId}/connector-instance/${instance.id}`,
        { config: newConfig }
      );

      onConfigChange(instance.id, newConfig);
    }
  };

  const getImageUploadType = (): UploadType =>
    mode === "config"
      ? UploadType.PLUGIN_CONNECTOR_INSTANCE
      : UploadType.PLAYGROUND_CONNECTOR_INSTANCE;

  const getImageUploadMetadata = () => {
    if (!instance.id) throw new Error("Missing connector instance id");

    if (mode === "config") {
      return {
        pluginConnectorInstanceId:
          instance.pluginConnectorInstanceId ?? instance.id,
      };
    }

    return { playgroundConnectorConfigInstanceId: instance.id };
  };

  // CONFIG:     DELETE /plugin/connector-instance/{id}/image?imageUrl=...
  // PLAYGROUND: DELETE /playground/item/{id}/image   body { imageUrl }
  const deleteSingleImageApi = async (imageUrl: string) => {
    if (!imageUrl) throw new Error("Missing imageUrl");

    if (mode === "config") {
      const id = getPluginConnectorInstanceId();
      await api.delete(`/plugin/connector-instance/${id}/image`, {
        params: { imageUrl },
      });
      return;
    }

    const id = getPlaygroundConnectorConfigId();
    await api.delete(`/playground/item/${id}/image`, {
      data: { imageUrl },
    });
  };

  // CONFIG:     DELETE /plugin/connector-instance/{id}/deleteImage
  // PLAYGROUND: DELETE /playground/item/{id}/deleteImage
  const deleteAllImagesApi = async () => {
    if (mode === "config") {
      const id = getPluginConnectorInstanceId();
      await api.delete(`/plugin/connector-instance/${id}/deleteImage`);
      return;
    }

    const id = getPlaygroundConnectorConfigId();
    await api.delete(`/playground/item/${id}/deleteImage`);
  };

  // --------------------------------------------------
  // DYNAMIC OPTIONS (same endpoints as web)
  // --------------------------------------------------

  const fetchDynamicOptions = useCallback(
    async (fieldName: string, config: Record<string, any>) => {
      const connectorInstanceId =
        mode === "playground"
          ? instance.id
          : instance.pluginConnectorInstanceId ?? instance.id;

      if (!connectorInstanceId) return;

      const endpoint =
        mode === "playground"
          ? `/execution/playground-connector-config/${instance.id}/field-options`
          : `/execution/connector-instance/${connectorInstanceId}/field-options`;

      try {
        setDynamicOptionError((prev) => ({ ...prev, [fieldName]: false }));
        setLoadingDynamicOptions((prev) => ({ ...prev, [fieldName]: true }));

        const response = await api.post<DynamicOption[]>(endpoint, {
          field: fieldName,
          config,
        });

        const apiOptions = Array.isArray(response.data) ? response.data : [];

        setDynamicOptions((prev) => ({ ...prev, [fieldName]: apiOptions }));
      } catch (error: any) {
        console.log(
          "Dynamic options error:",
          error?.response?.data ?? error
        );
        setDynamicOptionError((prev) => ({ ...prev, [fieldName]: true }));
        setDynamicOptions((prev) => ({ ...prev, [fieldName]: [] }));
      } finally {
        setLoadingDynamicOptions((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [mode, instance.id, instance.pluginConnectorInstanceId]
  );

  // Load dynamic options on mount / OAuth change (same as web)
  useEffect(() => {
    if (mode !== "config" && mode !== "playground") return;

    Object.entries(schema).forEach(([fieldKey, field]: [string, any]) => {
      const isDynamic =
        field?.ui?.dynamic === true || field?.ui?.dynamicOptions === true;
      if (!isDynamic) return;

      const dependencies: string[] = field?.ui?.dependsOn ?? [];

      const dependenciesReady = dependencies.every((dependency) => {
        const value = instance.config?.[dependency];
        return value !== undefined && value !== null && value !== "";
      });

      if (dependencies.length === 0 || dependenciesReady) {
        fetchDynamicOptions(fieldKey, instance.config ?? {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    instance.id,
    instance.pluginConnectorInstanceId,
    instance.oauthTokenId,
    fetchDynamicOptions,
  ]);

  // --------------------------------------------------
  // IMAGE ACTIONS
  // --------------------------------------------------

  const chooseImages = useCallback(() => {
    if (!isFileEnabled || uploading) return;

    const remaining = maxFiles - images.length;

    if (remaining <= 0) {
      Alert.alert(
        "Maximum images reached",
        `Maximum ${maxFiles} images are allowed.`
      );
      return;
    }

    launchImageLibrary(
      { mediaType: "photo", selectionLimit: remaining, quality: 1 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;

        if (response.errorCode) {
          Alert.alert(
            "Image Picker",
            response.errorMessage || "Unable to select images."
          );
          return;
        }

        const assets = (response.assets || []).filter((a) => !!a.uri);
        if (!assets.length) return;

        setSelectedImages(
          assets.map((asset) => ({
            key: `${Date.now()}-${Math.random()}`,
            asset,
          }))
        );
      }
    );
  }, [isFileEnabled, uploading, maxFiles, images.length]);

  const removeSelectedImage = (key: string) => {
    setSelectedImages((prev) => prev.filter((item) => item.key !== key));
  };

  const uploadImages = async () => {
    if (!isFileEnabled || uploading || selectedImages.length === 0) return;

    if (images.length + selectedImages.length > maxFiles) {
      Alert.alert("Maximum images", `Only ${maxFiles} images are allowed.`);
      return;
    }

    try {
      setUploading(true);

      const uploadedImages: { imageUrl: string }[] = [];
      const uploadType = getImageUploadType();
      const uploadMetadata = getImageUploadMetadata();

      for (const selected of selectedImages) {
        const asset = selected.asset;
        if (!asset.uri) continue;

        const fileUrl = await uploadToS3(
          asset.uri,
          uploadType,
          uploadMetadata,
          getSafeFileName(asset),
          getMimeType(asset)
        );

        uploadedImages.push({ imageUrl: fileUrl });
      }

      if (uploadedImages.length === 0) {
        throw new Error("No images were uploaded.");
      }

      const updatedImages = [
        ...images,
        ...uploadedImages.map((image, index) => ({
          ...image,
          index: images.length + index,
        })),
      ];

      let nextIndex = Number(instance.config?.currentIndex);
      if (
        !Number.isInteger(nextIndex) ||
        nextIndex < 1 ||
        nextIndex > updatedImages.length
      ) {
        nextIndex = 1;
      }

      const newConfig = normalizeImageConfig({
        ...instance.config,
        images: updatedImages,
        currentIndex: nextIndex,
      });

      await updateConnectorConfig(newConfig);

      setSelectedImages([]);
      onImageUploaded?.();
      Alert.alert("Success", "Images uploaded successfully.");
    } catch (error: any) {
      console.log("FAILED TO UPLOAD IMAGES:", error?.response?.data ?? error);
      Alert.alert(
        "Upload failed",
        getErrorText(error, "Unable to upload images.")
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteSingleImage = (imageUrl: string) => {
    if (!isImageEditEnabled || !imageUrl || uploading) return;

    Alert.alert("Delete image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setUploading(true);

            await deleteSingleImageApi(imageUrl);

            const updatedImages = images
              .filter((image: any) => image.imageUrl !== imageUrl)
              .map((image: any, i: number) => ({ ...image, index: i }));

            let nextIndex = Number(instance.config?.currentIndex);
            if (
              !Number.isInteger(nextIndex) ||
              nextIndex < 1 ||
              nextIndex > updatedImages.length
            ) {
              nextIndex = 1;
            }

            const newConfig = normalizeImageConfig({
              ...instance.config,
              images: updatedImages,
              currentIndex: updatedImages.length > 0 ? nextIndex : undefined,
            });

            onConfigChange(instance.id, newConfig);
            onImageUploaded?.();
          } catch (error: any) {
            console.log(
              "Failed to delete image:",
              error?.response?.data ?? error
            );
            Alert.alert(
              "Delete failed",
              getErrorText(error, "Unable to delete image.")
            );
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const deleteAllImages = () => {
    if (!isImageEditEnabled || images.length === 0 || uploading) return;

    Alert.alert(
      "Delete all images",
      "Are you sure you want to delete all images?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              setUploading(true);

              await deleteAllImagesApi();

              const newConfig = normalizeImageConfig({
                ...instance.config,
                images: [],
                currentIndex: undefined,
              });

              onConfigChange(instance.id, newConfig);
              setSelectedImages([]);
              onImageUploaded?.();
            } catch (error: any) {
              console.log(
                "Failed to delete all images:",
                error?.response?.data ?? error
              );
              Alert.alert(
                "Delete failed",
                getErrorText(error, "Unable to delete images.")
              );
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  // --------------------------------------------------
  // FIELD HELPERS
  // --------------------------------------------------

  const updateField = (key: string, value: any) => {
    onConfigChange(instance.id, { ...instance.config, [key]: value });
  };

  // Same behaviour as the web <select> onChange
  const handleSelectChange = async (key: string, value: string) => {
    const newConfig: Record<string, any> = {
      ...instance.config,
      [key]: value,
    };

    const dependentFields = Object.entries(schema).filter(
      ([, dependentField]: [string, any]) =>
        dependentField?.ui?.dependsOn?.includes(key)
    );

    dependentFields.forEach(([dependentKey]) => {
      newConfig[dependentKey] = "";
    });

    onConfigChange(instance.id, newConfig);
    setOpenSelect(null);

    setDynamicOptions((prev) => {
      const updated = { ...prev };
      dependentFields.forEach(([dependentKey]) => {
        updated[dependentKey] = [];
      });
      return updated;
    });

    for (const [dependentKey, dependentField] of dependentFields as [
      string,
      any
    ][]) {
      const isDependentDynamic =
        dependentField?.ui?.dynamic === true ||
        dependentField?.ui?.dynamicOptions === true;

      if (!isDependentDynamic) continue;

      await fetchDynamicOptions(dependentKey, newConfig);
    }
  };

  // Early return AFTER all hooks
  if (!connector?.schema?.config) {
    return null;
  }

  // ==================================================
  // IMAGE CONNECTOR UI (same as web, also shown in design mode)
  // ==================================================

  if (isImageConnector) {
    const imageField = schema.images ?? {};
    const hasImagesField = !!schema.images;

    if (hasImagesField) {
      return (
        <View className="gap-4">
          <Text
            bold
            className="text-[10px] uppercase tracking-widest text-gray-500"
          >
            {imageField.label || "Images"}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">
              {images.length}/{maxFiles} images
            </Text>
            <Text className="text-[10px] text-gray-500">
              Aspect ratio: {cropAspect.toFixed(2)}
            </Text>
          </View>

          {/* EXISTING IMAGES */}
          {images.length > 0 && (
            <View className="gap-3">
              {images.map((image: any, index: number) => (
                <View
                  key={image.imageUrl || `image-${index}`}
                  className="flex-row items-center gap-3 rounded-lg border border-gray-200 p-2 dark:border-gray-800"
                >
                  <Image
                    source={{ uri: image.imageUrl }}
                    className="h-20 w-20 rounded"
                    resizeMode="cover"
                  />

                  <View className="flex-1 gap-1">
                    <Text
                      bold
                      className="text-xs text-gray-900 dark:text-white"
                    >
                      Image {index + 1}
                    </Text>
                    <Text className="text-[10px] text-gray-500">
                      {currentIndex === index + 1
                        ? "Current image"
                        : `Position ${index + 1}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={uploading || !isImageEditEnabled}
                    onPress={() => deleteSingleImage(image.imageUrl)}
                    className={`p-2 ${
                      isImageEditEnabled ? "" : "opacity-40"
                    }`}
                  >
                    <X size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* CHOOSE / ADD */}
          {images.length < maxFiles ? (
            <TouchableOpacity
              disabled={!isFileEnabled || uploading}
              onPress={chooseImages}
              className={`flex-row items-center justify-center gap-2 rounded py-3 ${
                isFileEnabled ? "bg-gray-600" : "bg-gray-300 dark:bg-gray-800"
              }`}
            >
              <Plus size={16} color="#ffffff" />
              <Text bold className="text-xs text-white">
                {images.length === 0 ? "Choose Images" : "Add Images"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-[10px] text-gray-500">
              Maximum {maxFiles} images selected.
            </Text>
          )}

          {/* SELECTED (not yet uploaded) */}
          {selectedImages.length > 0 && (
            <View className="gap-3">
              <Text bold className="text-xs text-gray-500">
                Selected Images
              </Text>

              {selectedImages.map((item, index) => (
                <View key={item.key} className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: item.asset.uri }}
                    className="h-16 w-16 rounded"
                    resizeMode="cover"
                  />

                  <View className="flex-1">
                    <Text
                      className="text-xs text-gray-800 dark:text-white"
                      numberOfLines={2}
                    >
                      {images.length + index + 1}.{" "}
                      {getSafeFileName(item.asset)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={uploading}
                    onPress={() => removeSelectedImage(item.key)}
                  >
                    <X size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* UPLOAD */}
          {selectedImages.length > 0 && (
            <TouchableOpacity
              disabled={uploading || !isFileEnabled}
              onPress={uploadImages}
              className={`flex-row items-center justify-center gap-2 rounded py-3 ${
                uploading ? "bg-blue-400" : "bg-blue-600"
              }`}
            >
              {uploading && <ActivityIndicator size="small" color="#ffffff" />}
              <Text bold className="text-xs text-white">
                {uploading
                  ? "Uploading..."
                  : `Upload ${selectedImages.length} Image${
                      selectedImages.length > 1 ? "s" : ""
                    }`}
              </Text>
            </TouchableOpacity>
          )}

          {/* DELETE ALL */}
          {images.length > 0 && (
            <TouchableOpacity
              disabled={uploading || !isImageEditEnabled}
              onPress={deleteAllImages}
              className={`flex-row items-center justify-center gap-2 rounded py-3 ${
                isImageEditEnabled ? "bg-gray-600" : "bg-gray-300"
              }`}
            >
              <Trash2 size={15} color="#ffffff" />
              <Text bold className="text-xs text-white">
                Delete All Images
              </Text>
            </TouchableOpacity>
          )}

          {/* RESTART FROM IMAGE */}
          {images.length > 0 && (
            <View className="gap-2">
              <Text
                bold
                className="text-[10px] uppercase tracking-widest text-gray-500"
              >
                {schema.currentIndex?.label || "Restart from image"}
              </Text>

              <TextInput
                editable={!disabled}
                keyboardType="number-pad"
                value={indexText}
                onChangeText={(text) => {
                  setIndexText(text);

                  if (!/^\d+$/.test(text)) return;

                  const value = Number(text);
                  // NEVER allow 0 or out of range
                  if (value < 1 || value > images.length) return;
                  if (value === currentIndex) return;

                  onConfigChange(
                    instance.id,
                    normalizeImageConfig({
                      ...instance.config,
                      currentIndex: value,
                    })
                  );
                }}
                onBlur={() => setIndexText(String(currentIndex))}
                placeholder="Enter image number"
                placeholderTextColor="#9ca3af"
                className="rounded border border-gray-300 bg-white px-3 py-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-black dark:text-white"
              />

              <Text className="text-[10px] text-gray-500">
                Select image 1 to {images.length}
              </Text>
            </View>
          )}

          {!isFileEnabled && (
            <Text className="text-[10px] text-gray-400">
              Image upload is available in config mode and for user-scoped
              playground connectors.
            </Text>
          )}
        </View>
      );
    }
  }

  // ==================================================
  // NORMAL PARAMETERS
  // ==================================================

  return (
    <View className="gap-5">
      {Object.entries(schema).map(([key, field]: [string, any]) => {
        const value = instance.config?.[key] ?? field?.default ?? "";

        const isBoolean = field?.type === "boolean";
        const isNumber = field?.type === "number";
        const isDate =
          /date/i.test(key) || /date/i.test(field?.label || "");

        const isStaticSelect =
          field?.ui?.component === "select" && Array.isArray(field?.ui?.options);

        const isDynamicSelect =
          field?.ui?.dynamic === true || field?.ui?.dynamicOptions === true;

        const isSelect = isStaticSelect || isDynamicSelect;

        const options: DynamicOption[] = isDynamicSelect
          ? dynamicOptions[key] ?? []
          : (field?.ui?.options ?? []).map((option: string) => ({
              label: option,
              value: option,
            }));

        const isLoading = loadingDynamicOptions[key] === true;

        return (
          <View key={key} className="gap-2">
            <Text
              bold
              className="text-[10px] uppercase tracking-widest text-gray-500"
            >
              {field?.label || key}
            </Text>

            {/* BOOLEAN */}
            {isBoolean && (
              <View className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-[#0d0d0d]">
                <Text className="flex-1 text-xs text-gray-900 dark:text-white">
                  {value === true || value === "true" ? "Enabled" : "Disabled"}
                </Text>
                <Switch
                  value={value === true || value === "true"}
                  disabled={disabled}
                  onValueChange={(checked) => updateField(key, checked)}
                  trackColor={{ false: "#9ca3af", true: "#2563eb" }}
                  thumbColor="#ffffff"
                />
              </View>
            )}

            {/* SELECT (static + dynamic) */}
            {!isBoolean && isSelect && (
              <View className="gap-2">
                <TouchableOpacity
                  disabled={disabled || isLoading}
                  onPress={() => setOpenSelect(openSelect === key ? null : key)}
                  className="min-h-[44px] flex-row items-center justify-between rounded border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-black"
                >
                  <Text
                    className="flex-1 text-xs text-gray-900 dark:text-white"
                    numberOfLines={1}
                  >
                    {isLoading
                      ? "Loading..."
                      : options.find((o) => o.value === String(value))?.label ||
                        `Select ${field?.label || key}`}
                  </Text>

                  {isLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <ChevronDown size={17} color="#9ca3af" />
                  )}
                </TouchableOpacity>

                {openSelect === key && !isLoading && (
                  <View className="rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-[#111111]">
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {/* Empty option, like the web <option value=""> */}
                      <TouchableOpacity
                        onPress={() => handleSelectChange(key, "")}
                        className="rounded px-3 py-3"
                      >
                        <Text className="text-xs text-gray-500">
                          Select {field?.label || key}
                        </Text>
                      </TouchableOpacity>

                      {options.map((option) => {
                        const selected = String(value) === option.value;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() =>
                              handleSelectChange(key, option.value)
                            }
                            className={`flex-row items-center justify-between rounded px-3 py-3 ${
                              selected ? "bg-blue-100 dark:bg-blue-900/30" : ""
                            }`}
                          >
                            <Text
                              className={`flex-1 text-xs ${
                                selected
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {option.label}
                            </Text>
                            {selected && (
                              <CheckCircle2 size={16} color="#2563eb" />
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {options.length === 0 && (
                        <Text className="p-3 text-xs text-gray-500">
                          No options available.
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}

                {dynamicOptionError[key] && (
                  <Text className="text-[10px] text-red-500">
                    Failed to load options
                  </Text>
                )}
              </View>
            )}

            {/* NUMBER */}
            {!isBoolean && !isSelect && isNumber && (
              <TextInput
                ref={(input) => {
                  inputRefs.current[key] = input;
                }}
                editable={!disabled}
                keyboardType="numeric"
                value={value === "" || value == null ? "" : String(value)}
                onFocus={() => scrollInputIntoView(inputRefs.current[key])}
                onChangeText={(text) => {
                  if (text === "") {
                    updateField(key, "");
                    return;
                  }
                  const parsed = Number(text);
                  if (Number.isNaN(parsed)) return;
                  updateField(key, parsed);
                }}
                placeholder={field?.placeholder || field?.label || key}
                placeholderTextColor="#9ca3af"
                className={`rounded border border-gray-300 px-3 py-3 text-xs dark:border-gray-700 ${
                  disabled
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    : "bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-white"
                }`}
              />
            )}

            {/* TEXT / DATE */}
            {!isBoolean && !isSelect && !isNumber && (
              <TextInput
                ref={(input) => {
                  inputRefs.current[key] = input;
                }}
                editable={!disabled}
                value={value == null ? "" : String(value)}
                onFocus={() => scrollInputIntoView(inputRefs.current[key])}
                onChangeText={(text) => updateField(key, text)}
                placeholder={
                  field?.placeholder ||
                  (isDate
                    ? `${field?.label || key} (YYYY-MM-DD)`
                    : field?.label || key)
                }
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={isDate ? "numbers-and-punctuation" : "default"}
                returnKeyType="done"
                className={`rounded border border-gray-300 px-3 py-3 text-xs dark:border-gray-700 ${
                  disabled
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    : "bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-white"
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ==================================================
// SAMPLE RESPONSE
// ==================================================

function SampleResponse({ sampleResponse }: { sampleResponse: any }) {
  const [open, setOpen] = useState(false);

  if (!sampleResponse) return null;

  return (
    <View className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        className="flex-row items-center justify-between bg-gray-100 px-3 py-3 dark:bg-[#111]"
      >
        <Text
          bold
          className="text-[10px] uppercase tracking-widest text-gray-500"
        >
          Sample Response
        </Text>
        {open ? (
          <ChevronUp size={17} color="#9ca3af" />
        ) : (
          <ChevronDown size={17} color="#9ca3af" />
        )}
      </TouchableOpacity>

      {open && (
        <ScrollView
          nestedScrollEnabled
          style={{ maxHeight: 300 }}
          className="border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-black"
        >
          <Text
            className="text-[10px] leading-5 text-gray-700 dark:text-gray-300"
            selectable
          >
            {JSON.stringify(sampleResponse, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ==================================================
// CONNECTOR CARD
// ==================================================

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
  onOAuthConnected,
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
  const [isConnected, setIsConnected] = useState(!!instance.oauthTokenId);

  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#ffffff" : "#111111";

  const { height: windowHeight } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const viewportHeightRef = useRef(0);
  const pendingScrollRef = useRef<{ cancel?: () => void } | null>(null);
  const oauthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectorFormMaxHeight = Math.max(
    180,
    Math.min(560, windowHeight * 0.65)
  );

  // Same scope rules as web
  const effectiveScope =
    mode === "config" ? instance.configScope : instance.scope;

  const canUseOAuth =
    mode === "config"
      ? effectiveScope === "author" || effectiveScope === "user"
      : effectiveScope === "user";

  const oauthProvider = connector?.schema?.oauth?.provider as
    | OAuthProvider
    | undefined;

  useEffect(() => {
    setIsConnected(!!instance.oauthTokenId);
  }, [instance.oauthTokenId]);

  const stopOAuthPolling = useCallback(() => {
    if (oauthPollRef.current) {
      clearInterval(oauthPollRef.current);
      oauthPollRef.current = null;
    }
  }, []);

  useEffect(() => stopOAuthPolling, [stopOAuthPolling]);

  const toggleOpen = () => {
    if (!isCollapsible || !setOpenInstanceId) return;
    setOpenInstanceId(isOpen ? null : instance.id);
  };

  // --------------------------------------------------
  // KEYBOARD SCROLL
  // --------------------------------------------------

  const scrollInputIntoView = useCallback(
    (target: TextInput | null) => {
      if (!target) return;

      focusedInputRef.current = target;

      const task = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          const currentScroll = scrollRef.current;
          const input = focusedInputRef.current;
          if (!currentScroll || !input) return;

          const nativeScrollRef = currentScroll.getNativeScrollRef();
          if (!nativeScrollRef) return;

          input.measureLayout(
            nativeScrollRef,
            (_x, y, _width, height) => {
              const viewportHeight =
                viewportHeightRef.current || connectorFormMaxHeight;

              const topPadding = 20;
              const bottomPadding = 48;
              const inputBottom = y + height;
              const visibleBottom = viewportHeight - bottomPadding;

              if (inputBottom > visibleBottom) {
                currentScroll.scrollTo({
                  y: Math.max(0, inputBottom - visibleBottom + 12),
                  animated: true,
                });
              } else if (y < topPadding) {
                currentScroll.scrollTo({
                  y: Math.max(0, y - topPadding),
                  animated: true,
                });
              }
            },
            () => {}
          );
        });
      });

      pendingScrollRef.current = task;
    },
    [connectorFormMaxHeight]
  );

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      if (focusedInputRef.current) {
        scrollInputIntoView(focusedInputRef.current);
      }
    });

    return () => {
      subscription.remove();
      pendingScrollRef.current?.cancel?.();
    };
  }, [scrollInputIntoView]);

  // --------------------------------------------------
  // OAUTH CONNECT (same APIs as web)
  // --------------------------------------------------

  const startOAuthPolling = () => {
    stopOAuthPolling();
    if (!onOAuthConnected) return;

    let tries = 0;

    oauthPollRef.current = setInterval(async () => {
      tries += 1;

      try {
        const connected = await onOAuthConnected(instance.id);
        if (connected) {
          setIsConnected(true);
          stopOAuthPolling();
          return;
        }
      } catch {
        // keep polling
      }

      if (tries >= 20) stopOAuthPolling();
    }, 2000);
  };

  const openOAuthUrl = async (url: string) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });
      } else {
        await Linking.openURL(url);
      }
    } catch {
      await Linking.openURL(url);
    }
  };

  const handleConnect = async () => {
    if (!connector?.schema?.oauth || !canUseOAuth || !oauthProvider) return;

    try {
      // CONFIG: POST /plugin/{id}/oauth/connect  { origin }
      if (mode === "config") {
        const res = await api.post<OAuthConnectResponse>(
          `/plugin/${instance.id}/oauth/connect`,
          { origin: APP_ORIGIN }
        );

        if (!res.data?.url) {
          throw new Error("OAuth URL was not returned by the backend.");
        }

        startOAuthPolling();
        await openOAuthUrl(res.data.url);

        // Browser closed: check one last time
        if (onOAuthConnected) {
          const connected = await onOAuthConnected(instance.id).catch(
            () => false
          );
          if (connected) {
            setIsConnected(true);
            stopOAuthPolling();
          }
        }
        return;
      }

      // PLAYGROUND: keep the existing parent-driven flow
      if (mode === "playground" && onStartOAuth) {
        await onStartOAuth(instance.id, oauthProvider);
      }
    } catch (error: any) {
      console.log("OAuth connect failed:", error?.response?.data ?? error);
      stopOAuthPolling();
      Alert.alert(
        "OAuth",
        getErrorText(error, "OAuth connection failed.")
      );
    }
  };

  // --------------------------------------------------
  // OAUTH DISCONNECT (same APIs as web)
  // --------------------------------------------------

  const handleDisconnect = async () => {
    if (!canUseOAuth || isDisconnecting) return;

    try {
      setIsDisconnecting(true);

      if (mode === "config") {
        await api.post(`/plugin/${instance.id}/oauth/disconnect`);
      } else if (mode === "playground") {
        await api.delete(`/playground/connector/${instance.id}/oauth/detach`);
      }

      setIsConnected(false);
      await onDisconnect?.(instance.id);
    } catch (error: any) {
      console.log("OAuth logout failed:", error?.response?.data ?? error);
      Alert.alert(
        "Logout failed",
        getErrorText(error, "Failed to log out. Please try again.")
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  // --------------------------------------------------
  // REMOVE
  // --------------------------------------------------

  const handleRemove = () => {
    if (!onRemove || isRemoving) return;

    Alert.alert(
      "Remove connector",
      `Are you sure you want to remove "${instance.instanceKey}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setIsRemoving(true);
              await onRemove(instance.instanceKey);
            } catch (error) {
              console.log("Remove connector failed:", error);
              Alert.alert("Remove failed", "Unable to remove connector.");
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <View className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0d0d0d]">
      {/* HEADER */}
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
              {isRemoving ? (
                <ActivityIndicator size="small" color={iconColor} />
              ) : (
                <Trash2 size={17} color={iconColor} />
              )}
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

      {/* CONTENT: hidden instead of unmounted (like web), so state is kept */}
      <View style={{ display: isOpen ? "flex" : "none" }}>
        <KeyboardAvoidingView
          style={{ flexShrink: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ maxHeight: connectorFormMaxHeight, flexShrink: 1 }}
            onLayout={(event) => {
              viewportHeightRef.current = event.nativeEvent.layout.height;
            }}
            contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            nestedScrollEnabled
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator
            className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/40"
          >
            <View className="gap-5">
              {/* OAUTH */}
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
                        <Text className="flex-1 text-xs text-green-500">
                          Connected to {oauthProvider || "Account"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        disabled={isDisconnecting || !canUseOAuth}
                        onPress={handleDisconnect}
                        className={`rounded px-3 py-2 ${
                          canUseOAuth && !isDisconnecting
                            ? "bg-gray-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <Text bold className="text-xs text-white">
                          {isDisconnecting ? "Logging out..." : "Logout"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={!canUseOAuth}
                      onPress={handleConnect}
                      className={`w-full rounded py-3 ${
                        canUseOAuth ? "bg-blue-600" : "bg-gray-400"
                      }`}
                    >
                      <Text bold className="text-center text-xs text-white">
                        Connect {oauthProvider || "Account"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* CONFIG SCOPE (same condition as web) */}
              {onUpdateScope && instance.configScope && (
                <View className="gap-2">
                  <Text
                    bold
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    Config Scope
                  </Text>

                  <View className="flex-row rounded border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-black">
                    {(["author", "user"] as const).map((scope) => {
                      const selected = instance.configScope === scope;

                      return (
                        <TouchableOpacity
                          key={scope}
                          onPress={() => onUpdateScope(instance.id, scope)}
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

              {/* PARAMETERS */}
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
                  disabled={mode === "playground" && instance.scope === "author"}
                  mode={mode}
                  sessionId={sessionId}
                  cropAspect={cropAspect}
                  onImageUploaded={onImageUploaded}
                  scrollInputIntoView={scrollInputIntoView}
                />
              </View>

              {/* SAMPLE RESPONSE */}
              {mode === "design" && connector?.schema?.sampleResponse && (
                <SampleResponse
                  sampleResponse={connector.schema.sampleResponse}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}