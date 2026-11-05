// import React, { useCallback, useEffect, useState } from "react";
// import {
//   View,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   Modal,
//   Alert,
//   TextInput,
//   ActivityIndicator,
// } from "react-native";
// import { launchImageLibrary, type Asset } from "react-native-image-picker";
// import Text from "../components/AppText";
// import {
//   User,
//   Mail,
//   ChevronRight,
//   Camera,
//   Key,
//   Moon,
//   Sun,
//   Check,
//   Pencil,
//   X,
//   Trash2,
// } from "lucide-react-native";
// import ReactNativeBlobUtil from "react-native-blob-util";
// import api from "../lib/api";
// import PasswordModal from "../modal/PasswordModal";
// import AppLayout from "./Layout";
// import { useTheme } from "../context/ThemeContext";
// import { useColorScheme } from "nativewind";

// type UserData = {
//   id?: string;
//   name: string;
//   email: string;
//   profilePic: string;
//   createdAt: string;
// };

// type PresignedUploadResponse = {
//   uploadUrl: string;
//   fileUrl: string;
// };

// const PROFILE_AVATAR_UPLOAD_TYPE = "profile-avatar";
// const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// const getErrorMessage = (
//   error: any,
//   fallback: string
// ): string => {
//   const message =
//     error?.response?.data?.message ??
//     error?.response?.data?.error ??
//     error?.message;

//   if (typeof message === "string" && message.trim()) {
//     return message;
//   }

//   if (Array.isArray(message)) {
//     return message
//       .map((item) => {
//         if (typeof item === "string") return item;
//         if (item && typeof item.message === "string") return item.message;
//         return "";
//       })
//       .filter(Boolean)
//       .join("\n") || fallback;
//   }

//   if (message && typeof message === "object") {
//     try {
//       return JSON.stringify(message);
//     } catch {
//       return fallback;
//     }
//   }

//   return fallback;
// };

// const addCacheBuster = (url?: string | null): string => {
//   if (!url) return "";
//   const separator = url.includes("?") ? "&" : "?";
//   return `${url}${separator}t=${Date.now()}`;
// };

// const getFileName = (asset: Asset): string => {
//   const originalName = asset.fileName?.trim();
//   if (originalName) return originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

//   const extension =
//     asset.type?.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
//   return `profile-${Date.now()}.${extension}`;
// };

// export default function AccountScreen() {
//   const { theme, toggleTheme } = useTheme();
//   const { colorScheme } = useColorScheme();

//   const [user, setUser] = useState<UserData>({
//     name: "",
//     email: "",
//     profilePic: "",
//     createdAt: "",
//   });

//   const [nameModal, setNameModal] = useState(false);
//   const [imageModal, setImageModal] = useState(false);
//   const [passwordModal, setPasswordModal] = useState(false);

//   const [editedName, setEditedName] = useState("");
//   const [selectedImage, setSelectedImage] = useState<Asset | null>(
//     null
//   );

//   const [loadingUser, setLoadingUser] = useState(true);
//   const [savingName, setSavingName] = useState(false);
//   const [savingImage, setSavingImage] = useState(false);

//   const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#111827";

//   const fetchUser = useCallback(async () => {
//     try {
//       const res = await api.get("/auth/user/me");
//       const data =
//         res.data?.userDetail ?? res.data?.user ?? res.data;

//       setUser({
//         id: data?.id,
//         name: data?.name ?? "",
//         email: data?.email ?? "",
//         profilePic: data?.profilePic
//           ? addCacheBuster(data.profilePic)
//           : "",
//         createdAt: data?.createdAt ?? "",
//       });
//     } catch (error) {
//       console.log("User fetch error:", error);
//       Alert.alert(
//         "Unable to load account",
//         getErrorMessage(error, "Please try again.")
//       );
//     } finally {
//       setLoadingUser(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUser();
//   }, [fetchUser]);

//   const openNameEditor = () => {
//     setEditedName(user.name);
//     setNameModal(true);
//   };

//   // Same endpoint and request body as the web app.
//   const saveName = async () => {
//     const trimmedName = editedName.trim();

//     if (!trimmedName) {
//       Alert.alert("Full name required", "Please enter your full name.");
//       return;
//     }

//     if (trimmedName === user.name) {
//       setNameModal(false);
//       return;
//     }

//     try {
//       setSavingName(true);
//       const res = await api.post("/auth/profile", {
//         name: trimmedName,
//       });

//       const updated =
//         res.data?.user ?? res.data?.userDetail ?? res.data;

//       setUser((previous) => ({
//         ...previous,
//         name: updated?.name ?? trimmedName,
//         email: updated?.email ?? previous.email,
//         profilePic:
//           updated?.profilePic !== undefined
//             ? updated.profilePic
//               ? addCacheBuster(updated.profilePic)
//               : ""
//             : previous.profilePic,
//       }));

//       setNameModal(false);
//       Alert.alert("Success", "Your name has been updated.");
//     } catch (error) {
//       console.log("Name update error:", error);
//       Alert.alert(
//         "Update failed",
//         getErrorMessage(error, "Unable to update your name. Please try again.")
//       );
//     } finally {
//       setSavingName(false);
//     }
//   };

//   const chooseImage = async () => {
//     try {
//       const result = await launchImageLibrary({
//         mediaType: "photo",
//         selectionLimit: 1,
//         quality: 0.9,
//       });

//       if (result.didCancel) return;

//       if (result.errorCode) {
//         Alert.alert(
//           "Image selection failed",
//           result.errorMessage || "Please try again."
//         );
//         return;
//       }

//       const asset = result.assets?.[0];
//       if (!asset?.uri) {
//         Alert.alert("Image selection failed", "The selected image is invalid.");
//         return;
//       }

//       if (asset.type && !asset.type.startsWith("image/")) {
//         Alert.alert("Invalid file", "Please select an image file.");
//         return;
//       }

//       if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
//         Alert.alert("Image too large", "Image size should be less than 5MB.");
//         return;
//       }

//       setSelectedImage(asset);
//     } catch (error) {
//       console.log("Image picker error:", error);
//       Alert.alert("Error", "Unable to open the image library.");
//     }
//   };

// const uploadProfileImage = async (asset: Asset) => {
//   if (!asset.uri) {
//     throw new Error("The selected image does not have a valid URI.");
//   }

//   const mimeType = asset.type || "image/jpeg";
//   const originalName = getFileName(asset);

//   // STEP 1: get presigned URL
//   const presignedResponse = await api.post<PresignedUploadResponse>(
//     "/s3/presigned-upload",
//     {
//       mimeType,
//       originalName,
//       uploadType: PROFILE_AVATAR_UPLOAD_TYPE,
//     }
//   );

//   const { uploadUrl, fileUrl } = presignedResponse.data ?? {};
//   if (!uploadUrl || !fileUrl) {
//     throw new Error("S3 upload URL was not returned by the server.");
//   }

//   // STEP 2: read local file as a blob and PUT it to S3
//   const localFile = await fetch(asset.uri);
//   const blob = await localFile.blob();

//   const s3Response = await fetch(uploadUrl, {
//     method: "PUT",
//     headers: { "Content-Type": mimeType },
//     body: blob,
//   });

//   if (!s3Response.ok) {
//     const text = await s3Response.text().catch(() => "");
//     console.log("S3 error body:", text);
//     throw new Error(`S3 upload failed with status ${s3Response.status}`);
//   }

//   // STEP 3: save the URL on the profile
//   await api.post("/auth/profile", { profilePic: fileUrl });

//   return fileUrl;
// };

//   const saveImage = async () => {
//     if (!selectedImage) {
//       Alert.alert("Select an image", "Please choose an image first.");
//       return;
//     }

//     try {
//       setSavingImage(true);
//       const fileUrl = await uploadProfileImage(selectedImage);
//       const updatedImageUrl = addCacheBuster(fileUrl);

//       setUser((previous) => ({
//         ...previous,
//         profilePic: updatedImageUrl,
//       }));

//       setSelectedImage(null);
//       setImageModal(false);
//       Alert.alert("Success", "Profile image updated successfully!");
//     } catch (error) {
//       console.log("Profile image upload error:", error);
//       Alert.alert(
//         "Upload failed",
//         getErrorMessage(error, "Failed to update profile image.")
//       );
//     } finally {
//       setSavingImage(false);
//     }
//   };

//   // Same DELETE endpoint and request body as the web app.
//   const deleteImage = () => {
//     if (!user.profilePic) {
//       Alert.alert("No profile image", "There is no profile image to remove.");
//       return;
//     }

//     Alert.alert(
//       "Delete profile image",
//       "Are you sure you want to remove your profile image?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setSavingImage(true);
//               await api.delete("/auth/profile/delete-avatar", {
//                 data: { profilePic: "" },
//               });

//               setUser((previous) => ({
//                 ...previous,
//                 profilePic: "",
//               }));

//               setSelectedImage(null);
//               setImageModal(false);
//               Alert.alert(
//                 "Success",
//                 "Profile image removed successfully!"
//               );
//             } catch (error) {
//               console.log("Delete image error:", error);
//               Alert.alert(
//                 "Delete failed",
//                 getErrorMessage(error, "Failed to remove your profile image.")
//               );
//             } finally {
//               setSavingImage(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleSavePassword = async (
//     currentPassword: string,
//     newPassword: string
//   ) => {
//     if (!currentPassword || !newPassword) {
//       Alert.alert("Missing fields", "Please fill in all password fields.");
//       return;
//     }

//     if (newPassword.length < 8) {
//       Alert.alert(
//         "Invalid password",
//         "Password must be at least 8 characters."
//       );
//       return;
//     }

//     try {
//       await api.post("/auth/change-password", {
//         oldPassword: currentPassword,
//         newPassword,
//       });

//       setPasswordModal(false);
//       Alert.alert("Success", "Password changed successfully.");
//     } catch (error) {
//       Alert.alert(
//         "Password change failed",
//         getErrorMessage(error, "Failed to change password.")
//       );
//     }
//   };

//   const closeImageModal = () => {
//     if (savingImage) return;
//     setImageModal(false);
//     setSelectedImage(null);
//   };

//   if (loadingUser) {
//     return (
//       <AppLayout>
//         <View className="flex-1 items-center justify-center bg-white dark:bg-black">
//           <ActivityIndicator size="large" color="#2563EB" />
//           <Text className="mt-3 text-gray-500 dark:text-gray-400">
//             Loading account...
//           </Text>
//         </View>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <ScrollView
//         className="flex-1 bg-white px-4 pt-6 dark:bg-black"
//         contentContainerStyle={{ paddingBottom: 32 }}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* PAGE HEADER */}
//         <View className="mb-6">
//           <Text className="text-2xl font-bold text-gray-900 dark:text-white">
//             Account
//           </Text>
//           <Text className="mt-1 text-gray-500 dark:text-gray-400">
//             Manage your profile, security, and preferences
//           </Text>
//         </View>

//         {/* PROFILE CARD */}
//         <View className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
//           <View className="flex-row items-center gap-4">
//             <View className="relative">
//               <View className="h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
//                 {user.profilePic ? (
//                   <Image
//                     key={user.profilePic}
//                     source={{ uri: user.profilePic }}
//                     className="h-full w-full"
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <View className="flex-1 items-center justify-center">
//                     <User size={32} color={iconColor} />
//                   </View>
//                 )}
//               </View>

//               <TouchableOpacity
//                 onPress={() => {
//                   setSelectedImage(null);
//                   setImageModal(true);
//                 }}
//                 activeOpacity={0.8}
//                 accessibilityRole="button"
//                 accessibilityLabel="Edit profile image"
//                 className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2"
//               >
//                 <Camera size={15} color="#FFFFFF" />
//               </TouchableOpacity>
//             </View>

//             <View className="flex-1">
//               <View className="flex-row items-center gap-2">
//                 <Text bold className="text-lg text-gray-900 dark:text-white">
//                   {user.name || "Your Name"}
//                 </Text>
//                 <TouchableOpacity
//                   onPress={openNameEditor}
//                   activeOpacity={0.7}
//                   accessibilityRole="button"
//                   accessibilityLabel="Edit full name"
//                   className="rounded-md border border-gray-300 p-1.5 dark:border-gray-700"
//                 >
//                   <Pencil size={15} color={iconColor} />
//                 </TouchableOpacity>
//               </View>

//               <View className="mt-1 flex-row items-center">
//                 <Mail size={14} color="#6B7280" />
//                 <Text className="ml-2 flex-1 text-md text-gray-500 dark:text-gray-400">
//                   {user.email}
//                 </Text>
//               </View>

//               {!!user.createdAt && (
//                 <Text className="mt-1 text-md text-gray-400">
//                   Member since {new Date(user.createdAt).toDateString()}
//                 </Text>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* PERSONAL INFORMATION */}
//         <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
//           <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
//             <Text className="font-semibold text-gray-900 dark:text-white">
//               Personal Information
//             </Text>
//           </View>

//           <TouchableOpacity
//             onPress={openNameEditor}
//             activeOpacity={0.7}
//             className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800"
//           >
//             <View className="flex-1">
//               <Text className="text-md text-gray-500 dark:text-gray-400">
//                 Full Name
//               </Text>
//               <Text className="mt-1 font-medium text-gray-900 dark:text-white">
//                 {user.name || "Not provided"}
//               </Text>
//             </View>
//             <ChevronRight size={20} color={iconColor} />
//           </TouchableOpacity>

//           <View className="flex-row items-center justify-between px-5 py-4">
//             <View className="flex-1">
//               <Text className="text-md text-gray-500 dark:text-gray-400">
//                 Email Address
//               </Text>
//               <Text className="mt-1 font-medium text-gray-900 dark:text-white">
//                 {user.email}
//               </Text>
//             </View>

//             <View className="flex-row items-center rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
//               <Check size={13} color="#16A34A" />
//               <Text className="ml-1 text-md text-green-700 dark:text-green-400">
//                 Verified
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* SECURITY */}
//         <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
//           <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
//             <Text className="text-md text-gray-900 dark:text-white">
//               Security
//             </Text>
//           </View>

//           <TouchableOpacity
//             onPress={() => setPasswordModal(true)}
//             activeOpacity={0.7}
//             className="flex-row items-center justify-between px-5 py-4"
//           >
//             <View className="flex-row items-center gap-3">
//               <View className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
//                 <Key size={19} color="#6B7280" />
//               </View>

//               <View>
//                 <Text className="font-medium text-gray-900 dark:text-white">
//                   Password
//                 </Text>
//                 <Text className="text-md text-gray-500 dark:text-gray-400">
//                   Change your password
//                 </Text>
//               </View>
//             </View>

//             <ChevronRight size={20} color={iconColor} />
//           </TouchableOpacity>
//         </View>

//         {/* PREFERENCES */}
//         <View className="mb-10 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
//           <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
//             <Text className="font-semibold text-gray-900 dark:text-white">
//               Preferences
//             </Text>
//           </View>

//           <View className="flex-row items-center justify-between px-5 py-4">
//             <View className="flex-row items-center gap-3">
//               {theme === "dark" ? (
//                 <Sun size={20} color="#FFFFFF" />
//               ) : (
//                 <Moon size={20} color="#6B7280" />
//               )}

//               <View>
//                 <Text className="font-medium text-gray-900 dark:text-white">
//                   Appearance
//                 </Text>
//                 <Text className="text-md text-gray-500 dark:text-gray-400">
//                   {theme === "dark" ? "Dark mode" : "Light mode"}
//                 </Text>
//               </View>
//             </View>

//             <TouchableOpacity
//               onPress={toggleTheme}
//               activeOpacity={0.8}
//               accessibilityRole="switch"
//               accessibilityState={{ checked: theme === "dark" }}
//               accessibilityLabel="Toggle appearance"
//               className={`h-6 w-12 justify-center rounded-full ${
//                 theme === "dark" ? "bg-blue-600" : "bg-gray-300"
//               }`}
//             >
//               <View
//                 className={`h-5 w-5 rounded-full bg-white ${
//                   theme === "dark" ? "ml-6" : "ml-0.5"
//                 }`}
//               />
//             </TouchableOpacity>
//           </View>

//           <View className="flex-row justify-between px-5 py-4">
//             <Text className="text-gray-900 dark:text-white">Language</Text>
//             <Text className="text-gray-500 dark:text-gray-400">English</Text>
//           </View>
//         </View>

//         {/* EDIT NAME MODAL */}
//         <Modal
//           visible={nameModal}
//           transparent
//           animationType="fade"
//           statusBarTranslucent
//           onRequestClose={() => {
//             if (!savingName) setNameModal(false);
//           }}
//         >
//           <View className="flex-1 justify-center bg-black/60 px-5">
//             <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
//               <View className="mb-5 flex-row items-center justify-between">
//                 <Text bold className="text-lg text-gray-900 dark:text-white">
//                   Edit Full Name
//                 </Text>

//                 <TouchableOpacity
//                   onPress={() => setNameModal(false)}
//                   disabled={savingName}
//                   hitSlop={10}
//                 >
//                   <X size={21} color={iconColor} />
//                 </TouchableOpacity>
//               </View>

//               <Text className="mb-2 text-md font-medium text-gray-700 dark:text-gray-300">
//                 Full Name
//               </Text>

//               <TextInput
//                 value={editedName}
//                 onChangeText={setEditedName}
//                 placeholder="Enter your full name"
//                 placeholderTextColor="#9CA3AF"
//                 autoCapitalize="words"
//                 autoCorrect={false}
//                 editable={!savingName}
//                 returnKeyType="done"
//                 onSubmitEditing={saveName}
//                 className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-[#252525] dark:text-white"
//               />

//               <View className="mt-6 flex-row justify-end gap-3">
//                 <TouchableOpacity
//                   onPress={() => setNameModal(false)}
//                   disabled={savingName}
//                   className="items-center justify-center rounded-lg px-4 py-3"
//                 >
//                   <Text className="text-gray-700 dark:text-gray-300">
//                     Cancel
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={saveName}
//                   disabled={savingName}
//                   className="min-w-28 items-center justify-center rounded-lg bg-blue-600 px-5 py-3"
//                 >
//                   {savingName ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <Text className="text-md text-white">Save Changes</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>

//         {/* EDIT IMAGE MODAL */}
//         <Modal
//           visible={imageModal}
//           transparent
//           animationType="fade"
//           statusBarTranslucent
//           onRequestClose={closeImageModal}
//         >
//           <View className="flex-1 justify-center bg-black/60 px-5">
//             <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
//               <View className="mb-5 flex-row items-center justify-between">
//                 <Text className="text-lg font-semibold text-gray-900 dark:text-white">
//                   Edit Profile Image
//                 </Text>

//                 <TouchableOpacity
//                   onPress={closeImageModal}
//                   disabled={savingImage}
//                   hitSlop={10}
//                 >
//                   <X size={21} color={iconColor} />
//                 </TouchableOpacity>
//               </View>

//               <View className="mb-5 items-center">
//                 <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
//                   {selectedImage?.uri || user.profilePic ? (
//                     <Image
//                       source={{
//                         uri: selectedImage?.uri || user.profilePic,
//                       }}
//                       className="h-full w-full"
//                       resizeMode="cover"
//                     />
//                   ) : (
//                     <View className="flex-1 items-center justify-center">
//                       <User size={42} color={iconColor} />
//                     </View>
//                   )}
//                 </View>
//               </View>

//               <TouchableOpacity
//                 onPress={chooseImage}
//                 disabled={savingImage}
//                 activeOpacity={0.7}
//                 className="mb-3 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
//               >
//                 <Camera size={18} color={iconColor} />
//                 <Text className="font-medium text-gray-900 dark:text-white">
//                   {selectedImage ? "Choose Another Image" : "Change Image"}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={deleteImage}
//                 disabled={savingImage || !user.profilePic}
//                 activeOpacity={0.7}
//                 className="flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
//               >
//                 <Trash2 size={17} color="#6B7280" />
//                 <Text className="font-medium text-gray-700 dark:text-gray-300">
//                   Delete Profile Image
//                 </Text>
//               </TouchableOpacity>

//               <View className="mt-5 flex-row justify-end gap-3">
//                 <TouchableOpacity
//                   onPress={closeImageModal}
//                   disabled={savingImage}
//                   className="items-center justify-center rounded-lg px-4 py-3"
//                 >
//                   <Text className="text-gray-700 dark:text-gray-300">
//                     Cancel
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={saveImage}
//                   disabled={savingImage || !selectedImage}
//                   className={`min-w-24 items-center justify-center rounded-lg px-5 py-3 ${
//                     selectedImage ? "bg-blue-600" : "bg-gray-400"
//                   }`}
//                 >
//                   {savingImage ? (
//                     <ActivityIndicator color="#FFFFFF" />
//                   ) : (
//                     <Text className="font-semibold text-white">Save</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>

//         {/* CHANGE PASSWORD MODAL */}
//         <Modal
//           visible={passwordModal}
//           transparent
//           animationType="fade"
//           statusBarTranslucent
//           onRequestClose={() => setPasswordModal(false)}
//         >
//           <View className="flex-1 justify-center bg-black/50 p-4">
//             <PasswordModal
//               onCancel={() => setPasswordModal(false)}
//               onSave={handleSavePassword}
//             />
//           </View>
//         </Modal>
//       </ScrollView>
//     </AppLayout>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { launchImageLibrary, type Asset } from "react-native-image-picker";
import Text from "../components/AppText";
import {
  User,
  Mail,
  ChevronRight,
  Camera,
  Key,
  Moon,
  Sun,
  Check,
  Pencil,
  X,
  Trash2,
} from "lucide-react-native";
import api from "../lib/api";
import PasswordModal from "../modal/PasswordModal";
import AppLayout from "./Layout";
import { useTheme } from "../context/ThemeContext";
import { useColorScheme } from "nativewind";

type UserData = {
  id?: string;
  name: string;
  email: string;
  profilePic: string;
  createdAt: string;
};

type PresignedUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
};

const PROFILE_AVATAR_UPLOAD_TYPE = "profile-avatar";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const getErrorMessage = (error: any, fallback: string): string => {
  const message =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    return (
      message
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.message === "string") return item.message;
          return "";
        })
        .filter(Boolean)
        .join("\n") || fallback
    );
  }

  if (message && typeof message === "object") {
    try {
      return JSON.stringify(message);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const addCacheBuster = (url?: string | null): string => {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
};

// Same idea as the web app: unique prefix + original file name
const getUniqueFileName = (asset: Asset): string => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const extension =
    asset.type?.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

  const originalName =
    asset.fileName?.trim()?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
    `profile.${extension}`;

  return `${unique}-${originalName}`;
};

// PUT using XHR + { uri } (fallback if blob reading fails)
const putWithXhr = (url: string, uri: string, mimeType: string) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        console.log("S3 XHR error body:", xhr.responseText);
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("S3 network error"));
    xhr.ontimeout = () => reject(new Error("S3 upload timed out"));
    xhr.timeout = 60000;

    xhr.send({ uri } as any);
  });

// PUT the local file to S3 (same as web: PUT with Content-Type + file body)
const putFileToS3 = async (
  uploadUrl: string,
  uri: string,
  mimeType: string
) => {
  try {
    const localFile = await fetch(uri);
    const blob = await localFile.blob();

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: blob,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("S3 error body:", text);
      throw new Error(`S3 upload failed with status ${res.status}`);
    }
  } catch (error: any) {
    // Only fall back on network-level failures, not on S3 HTTP errors
    if (error?.message?.startsWith("S3 upload failed with status")) {
      throw error;
    }
    console.log("Blob upload failed, trying XHR fallback:", error);
    await putWithXhr(uploadUrl, uri, mimeType);
  }
};

export default function AccountScreen() {
  const { theme, toggleTheme } = useTheme();
  const { colorScheme } = useColorScheme();

  const [user, setUser] = useState<UserData>({
    name: "",
    email: "",
    profilePic: "",
    createdAt: "",
  });

  const [nameModal, setNameModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);

  const [editedName, setEditedName] = useState("");
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#111827";

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/user/me");
      const data = res.data?.userDetail ?? res.data?.user ?? res.data;

      setUser({
        id: data?.id,
        name: data?.name ?? "",
        email: data?.email ?? "",
        profilePic: data?.profilePic ? addCacheBuster(data.profilePic) : "",
        createdAt: data?.createdAt ?? "",
      });
    } catch (error) {
      console.log("User fetch error:", error);
      Alert.alert(
        "Unable to load account",
        getErrorMessage(error, "Please try again.")
      );
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const openNameEditor = () => {
    setEditedName(user.name);
    setNameModal(true);
  };

  // Same endpoint and body as the web app
  const saveName = async () => {
    const trimmedName = editedName.trim();

    if (!trimmedName) {
      Alert.alert("Full name required", "Please enter your full name.");
      return;
    }

    if (trimmedName === user.name) {
      setNameModal(false);
      return;
    }

    try {
      setSavingName(true);
      const res = await api.post("/auth/profile", { name: trimmedName });

      const updated = res.data?.user ?? res.data?.userDetail ?? res.data;

      setUser((previous) => ({
        ...previous,
        name: updated?.name ?? trimmedName,
        email: updated?.email ?? previous.email,
        profilePic:
          updated?.profilePic !== undefined
            ? updated.profilePic
              ? addCacheBuster(updated.profilePic)
              : ""
            : previous.profilePic,
      }));

      setNameModal(false);
      Alert.alert("Success", "Your name has been updated.");
    } catch (error) {
      console.log("Name update error:", error);
      Alert.alert(
        "Update failed",
        getErrorMessage(error, "Unable to update your name. Please try again.")
      );
    } finally {
      setSavingName(false);
    }
  };

  const chooseImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.9,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert(
          "Image selection failed",
          result.errorMessage || "Please try again."
        );
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert("Image selection failed", "The selected image is invalid.");
        return;
      }

      if (asset.type && !asset.type.startsWith("image/")) {
        Alert.alert("Invalid file", "Please select an image file.");
        return;
      }

      if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
        Alert.alert("Image too large", "Image size should be less than 5MB.");
        return;
      }

      setSelectedImage(asset);
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Unable to open the image library.");
    }
  };

  // Same flow as the web app:
  // 1) presigned URL  2) PUT file to S3  3) save fileUrl on profile
  const uploadProfileImage = async (asset: Asset): Promise<string> => {
    if (!asset.uri) {
      throw new Error("The selected image does not have a valid URI.");
    }

    const mimeType = asset.type || "image/jpeg";
    const originalName = getUniqueFileName(asset);

    // STEP 1
    console.log("STEP 1: Requesting S3 upload URL");
    const { data } = await api.post<PresignedUploadResponse>(
      "/s3/presigned-upload",
      {
        mimeType,
        originalName,
        uploadType: PROFILE_AVATAR_UPLOAD_TYPE,
      }
    );

    const { uploadUrl, fileUrl } = data ?? ({} as PresignedUploadResponse);
    if (!uploadUrl || !fileUrl) {
      throw new Error("S3 upload URL was not returned by the server.");
    }
    console.log("STEP 1 SUCCESS");

    // STEP 2
    console.log("STEP 2: Uploading to S3", asset.uri, mimeType);
    await putFileToS3(uploadUrl, asset.uri, mimeType);
    console.log("STEP 2 SUCCESS");

    // STEP 3
    console.log("STEP 3: Updating profile");
    await api.post("/auth/profile", { profilePic: fileUrl });
    console.log("STEP 3 SUCCESS");

    return fileUrl;
  };

  const saveImage = async () => {
    if (!selectedImage) {
      Alert.alert("Select an image", "Please choose an image first.");
      return;
    }

    try {
      setSavingImage(true);
      const fileUrl = await uploadProfileImage(selectedImage);

      setUser((previous) => ({
        ...previous,
        profilePic: addCacheBuster(fileUrl),
      }));

      setSelectedImage(null);
      setImageModal(false);
      Alert.alert("Success", "Profile image updated successfully!");
    } catch (error) {
      console.log("Profile image upload error:", error);
      Alert.alert(
        "Upload failed",
        getErrorMessage(error, "Failed to update profile image.")
      );
    } finally {
      setSavingImage(false);
    }
  };

  // Same DELETE endpoint and body as the web app
  const deleteImage = () => {
    if (!user.profilePic) {
      Alert.alert("No profile image", "There is no profile image to remove.");
      return;
    }

    Alert.alert(
      "Delete profile image",
      "Are you sure you want to remove your profile image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingImage(true);
              await api.delete("/auth/profile/delete-avatar", {
                data: { profilePic: "" },
              });

              setUser((previous) => ({ ...previous, profilePic: "" }));
              setSelectedImage(null);
              setImageModal(false);
              Alert.alert("Success", "Profile image removed successfully!");
            } catch (error) {
              console.log("Delete image error:", error);
              Alert.alert(
                "Delete failed",
                getErrorMessage(error, "Failed to remove your profile image.")
              );
            } finally {
              setSavingImage(false);
            }
          },
        },
      ]
    );
  };

  const handleSavePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Invalid password", "Password must be at least 8 characters.");
      return;
    }

    try {
      await api.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword,
      });

      setPasswordModal(false);
      Alert.alert("Success", "Password changed successfully.");
    } catch (error) {
      Alert.alert(
        "Password change failed",
        getErrorMessage(error, "Failed to change password.")
      );
    }
  };

  const closeImageModal = () => {
    if (savingImage) return;
    setImageModal(false);
    setSelectedImage(null);
  };

  if (loadingUser) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-3 text-gray-500 dark:text-gray-400">
            Loading account...
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView
        className="flex-1 bg-white px-4 pt-6 dark:bg-black"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PAGE HEADER */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Account
          </Text>
          <Text className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your profile, security, and preferences
          </Text>
        </View>

        {/* PROFILE CARD */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <View className="h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
                {user.profilePic ? (
                  <Image
                    key={user.profilePic}
                    source={{ uri: user.profilePic }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <User size={32} color={iconColor} />
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedImage(null);
                  setImageModal(true);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Edit profile image"
                className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2"
              >
                <Camera size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text bold className="text-lg text-gray-900 dark:text-white">
                  {user.name || "Your Name"}
                </Text>
                <TouchableOpacity
                  onPress={openNameEditor}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit full name"
                  className="rounded-md border border-gray-300 p-1.5 dark:border-gray-700"
                >
                  <Pencil size={15} color={iconColor} />
                </TouchableOpacity>
              </View>

              <View className="mt-1 flex-row items-center">
                <Mail size={14} color="#6B7280" />
                <Text className="ml-2 flex-1 text-md text-gray-500 dark:text-gray-400">
                  {user.email}
                </Text>
              </View>

              {!!user.createdAt && (
                <Text className="mt-1 text-md text-gray-400">
                  Member since {new Date(user.createdAt).toDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Personal Information
            </Text>
          </View>

          <TouchableOpacity
           
            className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800"
          >
            <View className="flex-1">
              <Text className="text-md text-gray-500 dark:text-gray-400">
                Full Name
              </Text>
              <Text className="mt-1 font-medium text-gray-900 dark:text-white">
                {user.name || "Not provided"}
              </Text>
            </View>
            {/* <ChevronRight size={20} color={iconColor} /> */}
          </TouchableOpacity>

          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-1">
              <Text className="text-md text-gray-500 dark:text-gray-400">
                Email Address
              </Text>
              <Text className="mt-1 font-medium text-gray-900 dark:text-white">
                {user.email}
              </Text>
            </View>

            <View className="flex-row items-center rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
              <Check size={13} color="#16A34A" />
              <Text className="ml-1 text-md text-green-700 dark:text-green-400">
                Verified
              </Text>
            </View>
          </View>
        </View>

        {/* SECURITY */}
        <View className="mb-5 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Security
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setPasswordModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between px-5 py-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                <Key size={19} color="#6B7280" />
              </View>

              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Password
                </Text>
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  Change your password
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* PREFERENCES */}
        <View className="mb-10 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
          <View className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <Text className="font-semibold text-gray-900 dark:text-white">
              Preferences
            </Text>
          </View>

          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center gap-3">
              {theme === "dark" ? (
                <Sun size={20} color="#FFFFFF" />
              ) : (
                <Moon size={20} color="#6B7280" />
              )}

              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Appearance
                </Text>
                <Text className="text-md text-gray-500 dark:text-gray-400">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityState={{ checked: theme === "dark" }}
              accessibilityLabel="Toggle appearance"
              className={`h-6 w-12 justify-center rounded-full ${
                theme === "dark" ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white ${
                  theme === "dark" ? "ml-6" : "ml-0.5"
                }`}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between px-5 py-4">
            <Text className="text-gray-900 dark:text-white">Language</Text>
            <Text className="text-gray-500 dark:text-gray-400">English</Text>
          </View>
        </View>

        {/* EDIT NAME MODAL */}
        <Modal
          visible={nameModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (!savingName) setNameModal(false);
          }}
        >
          <View className="flex-1 justify-center bg-black/60 px-5">
            <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
              <View className="mb-5 flex-row items-center justify-between">
                <Text bold className="text-lg text-gray-900 dark:text-white">
                  Edit Full Name
                </Text>

                <TouchableOpacity
                  onPress={() => setNameModal(false)}
                  disabled={savingName}
                  hitSlop={10}
                >
                  <X size={21} color={iconColor} />
                </TouchableOpacity>
              </View>

              <Text className="mb-2 text-md font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Text>

              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!savingName}
                returnKeyType="done"
                onSubmitEditing={saveName}
                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-[#252525] dark:text-white"
              />

              <View className="mt-6 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => setNameModal(false)}
                  disabled={savingName}
                  className="items-center justify-center rounded-lg px-4 py-3"
                >
                  <Text className="text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveName}
                  disabled={savingName}
                  className="min-w-28 items-center justify-center rounded-lg bg-blue-600 px-5 py-3"
                >
                  {savingName ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-md text-white">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* EDIT IMAGE MODAL */}
        <Modal
          visible={imageModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeImageModal}
        >
          <View className="flex-1 justify-center bg-black/60 px-5">
            <View className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Profile Image
                </Text>

                <TouchableOpacity
                  onPress={closeImageModal}
                  disabled={savingImage}
                  hitSlop={10}
                >
                  <X size={21} color={iconColor} />
                </TouchableOpacity>
              </View>

              <View className="mb-5 items-center">
                <View className="h-28 w-28 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-100 dark:bg-gray-800">
                  {selectedImage?.uri || user.profilePic ? (
                    <Image
                      source={{ uri: selectedImage?.uri || user.profilePic }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <User size={42} color={iconColor} />
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={chooseImage}
                disabled={savingImage}
                activeOpacity={0.7}
                className="mb-3 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
              >
                <Camera size={18} color={iconColor} />
                <Text className="font-medium text-gray-900 dark:text-white">
                  {selectedImage ? "Choose Another Image" : "Change Image"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deleteImage}
                disabled={savingImage || !user.profilePic}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-700"
              >
                <Trash2 size={17} color="#6B7280" />
                <Text className="font-medium text-gray-700 dark:text-gray-300">
                  Delete Profile Image
                </Text>
              </TouchableOpacity>

              <View className="mt-5 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={closeImageModal}
                  disabled={savingImage}
                  className="items-center justify-center rounded-lg px-4 py-3"
                >
                  <Text className="text-gray-700 dark:text-gray-300">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveImage}
                  disabled={savingImage || !selectedImage}
                  className={`min-w-24 items-center justify-center rounded-lg px-5 py-3 ${
                    selectedImage ? "bg-blue-600" : "bg-gray-400"
                  }`}
                >
                  {savingImage ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="font-semibold text-white">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CHANGE PASSWORD MODAL */}
        <Modal
          visible={passwordModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPasswordModal(false)}
        >
          <View className="flex-1 justify-center bg-black/50 p-4">
            <PasswordModal
              onCancel={() => setPasswordModal(false)}
              onSave={handleSavePassword}
            />
          </View>
        </Modal>
      </ScrollView>
    </AppLayout>
  );
}