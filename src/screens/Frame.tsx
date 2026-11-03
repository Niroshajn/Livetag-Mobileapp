// import React, {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Image,
//   Pressable,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import Text from "../components/AppText";

// import {
//   Monitor,
//   Trash2,
//   Settings,
//   Battery,
//   Wifi,
//   Signal,
//   ChevronRight,
//   Plus,
//   Folder,
// } from "lucide-react-native";

// import { useColorScheme } from "nativewind";

// import api from "../lib/api";
// import AppLayout from "./Layout";

// import AddDeviceModal from "../modal/AddFramemodal";
// import AddGroupModal from "../modal/AddGroupModal";
// import DeviceSettingsModal from "../modal/DeviceSettingsModal";
// import DeleteModal from "../modal/DeleteModal";

// import { Frame } from "../types/Frame";

// type Orientation = "portrait" | "landscape";

// interface DeviceFrame extends Frame {
//   orientation?: Orientation;
//   width?: number;
//   height?: number;
//   modelNo?: string;
//   friendlyId?: string;
//   battery?: number;
//   wifiSSID?: string;
//   signalStrength?: number;
//   previewImageUrl?: string;
//   status?: "online" | "offline";
//   updatedAt?: string;
// }

// interface RouteParams {
//   groupId?: string;
//   groupName?: string;
//   groupCount?: number;
//   roles?: string[];
//   selectedPluginId?: string;
// }

// interface Group {
//   id: string;
//   name: string;
//   description?: string;
//   frameCount: number;
//   isSystemDefault?: boolean;
// }

// interface GroupsResponse {
//   data: Group[];
//   meta?: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//     hasNext: boolean;
//     hasPrevious: boolean;
//   };
// }

// interface FramesResponse {
//   data: any[];
//   meta: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//     hasNext: boolean;
//     hasPrevious: boolean;
//   };
// }

// function isDeviceOnline(updatedAt?: string) {
//   if (!updatedAt) return false;

//   const diff = Date.now() - new Date(updatedAt).getTime();

//   return diff >= 0 && diff < 86400000;
// }

// function timeAgo(date?: string) {
//   if (!date) return "Never";

//   const diff = Date.now() - new Date(date).getTime();

//   if (Number.isNaN(diff) || diff < 0) {
//     return "Never";
//   }

//   const hours = Math.floor(diff / 3600000);

//   if (hours < 1) return "Just now";

//   if (hours < 24) {
//     return `${hours}h ago`;
//   }

//   return `${Math.floor(hours / 24)}d ago`;
// }

// const getDefaultOrientation = (
//   width?: number,
//   height?: number
// ): Orientation => {
//   if (!width || !height) {
//     return "landscape";
//   }

//   return width >= height ? "landscape" : "portrait";
// };

// const getOrientedDimensions = (
//   width?: number,
//   height?: number,
//   orientation: Orientation = "landscape"
// ) => {
//   // Use a default resolution if the API does not return dimensions.
//   const originalWidth = Number(width) || 800;
//   const originalHeight = Number(height) || 480;

//   const landscapeWidth = Math.max(
//     originalWidth,
//     originalHeight
//   );

//   const landscapeHeight = Math.min(
//     originalWidth,
//     originalHeight
//   );

//   if (orientation === "portrait") {
//     return {
//       width: landscapeHeight,
//       height: landscapeWidth,
//     };
//   }

//   return {
//     width: landscapeWidth,
//     height: landscapeHeight,
//   };
// };

// export default function FramesScreen({
//   navigation,
//   route,
// }: any) {
//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === "dark";

//   const params: RouteParams = route?.params || {};

//   const selectedGroupId = params.groupId;
//   const groupName = params.groupName;
//   const selectedPluginId = params.selectedPluginId;

//   // ------------------------------------------------
//   // STATES
//   // ------------------------------------------------

//   const [frames, setFrames] = useState<DeviceFrame[]>([]);
//   const [groups, setGroups] = useState<Group[]>([]);

//   const [currentGroup, setCurrentGroup] =
//     useState<Group | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [groupsLoading, setGroupsLoading] = useState(false);

//   const [page, setPage] = useState(1);

//   const [meta, setMeta] =
//     useState<FramesResponse["meta"] | null>(null);

//   const [showAddPopup, setShowAddPopup] = useState(false);
//   const [showGroupPopup, setShowGroupPopup] = useState(false);

//   const [selectedDevice, setSelectedDevice] =
//     useState<Frame | null>(null);

//   const [openSettingsModal, setOpenSettingsModal] =
//     useState(false);

//   const [showDeleteModal, setShowDeleteModal] =
//     useState(false);

//   const [selectedId, setSelectedId] =
//     useState<string | null>(null);

//   // Orientation update state
//   const [updatingOrientationId, setUpdatingOrientationId] =
//     useState<string | null>(null);

//   // Move device dropdown state
//   const [expandedMoveDeviceId, setExpandedMoveDeviceId] =
//     useState<string | null>(null);

//   const [movingDeviceId, setMovingDeviceId] =
//     useState<string | null>(null);

//   // ------------------------------------------------
//   // GROUP CONDITIONS
//   // ------------------------------------------------

//   const userRoles = params.roles ?? [];
//   const isAdmin = userRoles.includes("admin");

//   const groupCount = params.groupCount ?? groups.length;
//   const hasMultipleGroups = groupCount > 1;

//   const isDefaultGroup =
//     currentGroup?.isSystemDefault === true;

//   const showAddGroupButton =
//     isAdmin &&
//     isDefaultGroup &&
//     !hasMultipleGroups;

//   // ------------------------------------------------
//   // FETCH GROUPS
//   // ------------------------------------------------

//   const fetchGroups = useCallback(async () => {
//     try {
//       setGroupsLoading(true);

//       const res = await api.get<GroupsResponse>(
//         "/frame-groups"
//       );

//       const groupData = res.data?.data ?? [];

//       setGroups(groupData);

//       const foundGroup = selectedGroupId
//         ? groupData.find(
//             (group) =>
//               String(group.id) === String(selectedGroupId)
//           )
//         : groupData.find(
//             (group) => group.isSystemDefault === true
//           );

//       setCurrentGroup(foundGroup ?? null);
//     } catch (error: any) {
//       console.log(
//         "Groups error:",
//         error?.response?.data || error
//       );
//     } finally {
//       setGroupsLoading(false);
//     }
//   }, [selectedGroupId]);

//   // ------------------------------------------------
//   // FETCH FRAMES
//   // ------------------------------------------------

//   const fetchFrames = useCallback(async () => {
//     try {
//       setLoading(true);

//       const endpoint = selectedGroupId
//         ? `/frame-groups/${selectedGroupId}/frames?page=${page}`
//         : `/frames?page=${page}`;

//       const res = await api.get(endpoint);

//       const response = res.data;

//       const data = Array.isArray(response)
//         ? response
//         : response?.data ?? [];

//       setMeta(response?.meta ?? null);

//       const formatted: DeviceFrame[] = data.map(
//         (f: any) => {
//           const width =
//             f.devices?.[0]?.displayInfo
//               ?.displayResolutionWidth;

//           const height =
//             f.devices?.[0]?.displayInfo
//               ?.displayResolutionHeight;

//           const orientation: Orientation =
//             f.orientation ??
//             getDefaultOrientation(width, height);

//           return {
//             id: f.id,
//             name: f.name,
//             timezone: f.timezone,
//             isEnabled: f.isEnabled,
//             updatedAt: f.updatedAt,

//             previewImageUrl: f.CurrentPreviewImage
//               ? `${f.CurrentPreviewImage}?t=${Date.now()}`
//               : undefined,

//             battery: f.telemetry?.battery
//               ? Number(f.telemetry.battery)
//               : 0,

//             wifiSSID:
//               f.telemetry?.wifiSSID ?? "Unknown",

//             signalStrength:
//               f.telemetry?.rssi ?? 0,

//             sleepConfig:
//               f.sleepConfig ?? null,

//             status: isDeviceOnline(f.updatedAt)
//               ? "online"
//               : "offline",

//             modelNo: f.devices?.[0]?.modelNo,

//             width,
//             height,

//             friendlyId:
//               f.devices?.[0]?.friendlyId,

//             orientation,
//           };
//         }
//       );

//       setFrames(formatted);
//     } catch (error: any) {
//       console.log(
//         "Frames error:",
//         error?.response?.data || error
//       );

//       setFrames([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedGroupId, page]);

//   // ------------------------------------------------
//   // INITIAL FETCH
//   // ------------------------------------------------

//   useEffect(() => {
//     fetchFrames();
//   }, [fetchFrames]);

//   useEffect(() => {
//     fetchGroups();
//   }, [fetchGroups]);

//   // ------------------------------------------------
//   // ADD GROUP CALLBACK
//   // ------------------------------------------------

//   const handleGroupCreated = async () => {
//     await fetchGroups();
//   };

//   // ------------------------------------------------
//   // ORIENTATION CHANGE
//   // Same API as web:
//   // PATCH /frames/edit/:frameId
//   // ------------------------------------------------

//   const handleOrientationChange = async (
//     device: DeviceFrame,
//     orientation: Orientation
//   ) => {
//     if (device.orientation === orientation) {
//       return;
//     }

//     try {
//       setUpdatingOrientationId(device.id);

//       await api.patch(
//         `/frames/edit/${device.id}`,
//         {
//           orientation,
//         }
//       );

//       setFrames((previous) =>
//         previous.map((frame) =>
//           frame.id === device.id
//             ? {
//                 ...frame,
//                 orientation,
//               }
//             : frame
//         )
//       );

//       Alert.alert(
//         "Success",
//         `${orientation === "landscape" ? "Landscape" : "Portrait"} selected`
//       );
//     } catch (error: any) {
//       console.log(
//         "Orientation update error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//           "Failed to change device orientation."
//       );
//     } finally {
//       setUpdatingOrientationId(null);
//     }
//   };

//   // ------------------------------------------------
//   // OPEN DEVICE SETTINGS
//   // ------------------------------------------------

//   const openSettings = async (device: DeviceFrame) => {
//     try {
//       const res = await api.get<Frame>(
//         `/frames/${device.id}`
//       );

//       setSelectedDevice(res.data);
//       setOpenSettingsModal(true);
//     } catch (error: any) {
//       console.log(
//         "Settings error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         "Failed to load device settings."
//       );
//     }
//   };

//   // ------------------------------------------------
//   // DELETE DEVICE
//   // ------------------------------------------------

//   const deleteDevice = async (frameId: string) => {
//     try {
//       await api.delete(`/frames/${frameId}`);

//       setFrames((previous) =>
//         previous.filter(
//           (frame) => frame.id !== frameId
//         )
//       );

//       Alert.alert(
//         "Success",
//         "Device deleted successfully."
//       );
//     } catch (error: any) {
//       console.log(
//         "Delete device error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//           "Failed to delete device."
//       );
//     }
//   };

//   // ------------------------------------------------
//   // MOVE DEVICE TO GROUP
//   // ------------------------------------------------

//   const moveDeviceToGroup = async (
//     groupId: string,
//     frameId: string
//   ) => {
//     try {
//       setMovingDeviceId(frameId);

//       await api.patch(
//         `/frame-groups/${groupId}/frames/${frameId}`
//       );

//       setExpandedMoveDeviceId(null);

//       await fetchFrames();
//       await fetchGroups();

//       Alert.alert(
//         "Success",
//         "Device moved successfully."
//       );
//     } catch (error: any) {
//       console.log(
//         "Move device error:",
//         error?.response?.data || error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//           "Failed to move device."
//       );
//     } finally {
//       setMovingDeviceId(null);
//     }
//   };

//   // ------------------------------------------------
//   // OPEN PLAYLIST
//   // Pass orientation-adjusted dimensions
//   // ------------------------------------------------

//   const openPlaylist = (device: DeviceFrame) => {
//     const orientation =
//       device.orientation ??
//       getDefaultOrientation(device.width, device.height);

//     const dimensions = getOrientedDimensions(
//       device.width,
//       device.height,
//       orientation
//     );

//     navigation.navigate("PlayList", {
//       id: device.id,
//       selectedPluginId,
//       deviceName: device.name,
//       modelNo: device.modelNo,
//       Modelno: device.modelNo,
//       width: dimensions.width,
//       height: dimensions.height,
//       orientation,
//     });
//   };

//   // ------------------------------------------------
//   // RENDER DEVICE CARD
//   // ------------------------------------------------

//   const renderItem = ({
//     item,
//   }: {
//     item: DeviceFrame;
//   }) => {
//     const online = item.status === "online";

//     const orientation =
//       item.orientation ??
//       getDefaultOrientation(item.width, item.height);

//     const isUpdatingOrientation =
//       updatingOrientationId === item.id;

//     const isMoving = movingDeviceId === item.id;

//     const availableGroups = groups.filter(
//       (group) =>
//         String(group.id) !== String(selectedGroupId)
//     );

//     return (
//       <Pressable
//         onPress={() => openPlaylist(item)}
//         className="
//           bg-white
//           dark:bg-[#1a1a1a]
//           border
//           border-gray-200
//           dark:border-gray-800
//           rounded-2xl
//           mb-4
//           overflow-hidden
//         "
//       >
//         {/* DEVICE PREVIEW */}

//         <View
//           className="
//             w-full
//             bg-gray-200
//             dark:bg-gray-800
//             justify-center
//             items-center
//           "
//           style={{
//             aspectRatio: 5 / 3,
//           }}
//         >
//           {item.previewImageUrl ? (
//             <Image
//               source={{
//                 uri: item.previewImageUrl,
//               }}
//               className="w-full h-full"
//               resizeMode="cover"
//             />
//           ) : (
//             <Monitor
//               size={40}
//               color={isDark ? "#9CA3AF" : "#000000"}
//             />
//           )}
//         </View>

//         {/* DEVICE INFORMATION */}

//         <View className="p-4">
//           <View className="flex-row items-center">
//             {/* NAME */}

//             <View className="flex-1 min-w-0">
//               <Text
//                 numberOfLines={1}
//                 className="
//                   text-lg
//                   font-semibold
//                   text-gray-900
//                   dark:text-white
//                 "
//               >
//                 {item.name}
//               </Text>

//               {item.friendlyId && (
//                 <Text className="text-xs text-gray-400">
//                   ({item.friendlyId})
//                 </Text>
//               )}

//               <Text className="text-xs text-gray-500 mt-1">
//                 Last seen: {timeAgo(item.updatedAt)}
//               </Text>
//             </View>

//             {/* BATTERY */}

//             <View className="items-center ml-2">
//               <Battery
//                 size={20}
//                 color={isDark ? "#D1D5DB" : "#4B5563"}
//               />

//               <Text className="text-xs text-gray-500 mt-1">
//                 {item.battery ?? 0}%
//               </Text>
//             </View>

//             {/* WIFI */}

//             <View className="items-center ml-3">
//               <Wifi
//                 size={20}
//                 color={isDark ? "#D1D5DB" : "#4B5563"}
//               />

//               <Text
//                 numberOfLines={1}
//                 className="
//                   text-xs
//                   text-gray-500
//                   mt-1
//                   max-w-[65px]
//                 "
//               >
//                 {item.wifiSSID}
//               </Text>
//             </View>

//             {/* SIGNAL */}

//             <View className="items-center ml-3">
//               <Signal
//                 size={20}
//                 color={isDark ? "#D1D5DB" : "#4B5563"}
//               />

//               <Text className="text-xs text-gray-500 mt-1">
//                 {item.signalStrength ?? 0}
//               </Text>
//             </View>

//             <ChevronRight
//               size={20}
//               color="#9CA3AF"
//               style={{ marginLeft: 8 }}
//             />
//           </View>

//           {/* DIVIDER */}

//           <View
//             className="
//               mt-4
//               pt-3
//               border-t
//               border-gray-200
//               dark:border-gray-800
//             "
//           >
//             {/* STATUS AND ACTIONS */}

//             <View className="flex-row items-center justify-between flex-wrap gap-3">
//               {/* ONLINE / OFFLINE */}

//               <View
//                 className={`
//                   px-3
//                   py-2
//                   rounded-full
//                   ${
//                     online
//                       ? "bg-green-100 dark:bg-green-900/40"
//                       : "bg-gray-100 dark:bg-gray-800"
//                   }
//                 `}
//               >
//                 <Text
//                   className={
//                     online
//                       ? "text-green-700 dark:text-green-400 text-xs font-medium"
//                       : "text-gray-600 dark:text-gray-400 text-xs font-medium"
//                   }
//                 >
//                   {online ? "Online" : "Offline"}
//                 </Text>
//               </View>

//               {/* RIGHT SIDE ACTIONS */}

//               <View className="flex-row items-center flex-wrap">
//                 {/* ORIENTATION BUTTONS */}

//                 <View
//                   className="
//                     flex-row
//                     rounded-lg
//                     overflow-hidden
//                     border
//                     border-gray-300
//                     dark:border-gray-700
//                     mr-2
//                   "
//                 >
//                   {/* LANDSCAPE */}

//                   <Pressable
//                     disabled={isUpdatingOrientation || isMoving}
//                     onPress={(event) => {
//                       event.stopPropagation();

//                       handleOrientationChange(
//                         item,
//                         "landscape"
//                       );
//                     }}
//                     className={`
//                       px-2
//                       py-2
//                       ${
//                         orientation === "landscape"
//                           ? "bg-blue-600"
//                           : "bg-white dark:bg-[#252525]"
//                       }
//                     `}
//                   >
//                     <Text
//                       className={`
//                         text-xs
//                         font-medium
//                         ${
//                           orientation === "landscape"
//                             ? "text-white"
//                             : "text-gray-600 dark:text-gray-300"
//                         }
//                       `}
//                     >
//                       Landscape
//                     </Text>
//                   </Pressable>

//                   {/* PORTRAIT */}

//                   <Pressable
//                     disabled={isUpdatingOrientation || isMoving}
//                     onPress={(event) => {
//                       event.stopPropagation();

//                       handleOrientationChange(
//                         item,
//                         "portrait"
//                       );
//                     }}
//                     className={`
//                       px-2
//                       py-2
//                       border-l
//                       border-gray-300
//                       dark:border-gray-700
//                       ${
//                         orientation === "portrait"
//                           ? "bg-blue-600"
//                           : "bg-white dark:bg-[#252525]"
//                       }
//                     `}
//                   >
//                     <Text
//                       className={`
//                         text-xs
//                         font-medium
//                         ${
//                           orientation === "portrait"
//                             ? "text-white"
//                             : "text-gray-600 dark:text-gray-300"
//                         }
//                       `}
//                     >
//                       Portrait
//                     </Text>
//                   </Pressable>
//                 </View>

//                 {/* SETTINGS */}

//                 <TouchableOpacity
//                   onPress={(event) => {
//                     event.stopPropagation();
//                     openSettings(item);
//                   }}
//                   className="p-2 mr-1"
//                 >
//                   <Settings
//                     size={20}
//                     color={isDark ? "white" : "black"}
//                   />
//                 </TouchableOpacity>

//                 {/* DELETE */}

//                 <TouchableOpacity
//                   onPress={(event) => {
//                     event.stopPropagation();

//                     setSelectedId(item.id);
//                     setShowDeleteModal(true);
//                   }}
//                   className="p-2"
//                 >
//                   <Trash2
//                     size={20}
//                     color="#EF4444"
//                   />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* MOVE TO GROUP */}

//             {groups.length > 1 && (
//               <View className="mt-4">
//                 <Pressable
//                   disabled={isMoving}
//                   onPress={(event) => {
//                     event.stopPropagation();

//                     setExpandedMoveDeviceId(
//                       expandedMoveDeviceId === item.id
//                         ? null
//                         : item.id
//                     );
//                   }}
//                   className="
//                     flex-row
//                     items-center
//                     justify-between
//                     rounded-lg
//                     border
//                     border-gray-200
//                     dark:border-gray-700
//                     bg-gray-50
//                     dark:bg-[#252525]
//                     px-3
//                     py-3
//                   "
//                 >
//                   <View className="flex-row items-center">
//                     <Folder
//                       size={17}
//                       color="#6B7280"
//                     />

//                     <Text className="text-sm text-gray-700 dark:text-gray-300 ml-2">
//                       Move to Group
//                     </Text>
//                   </View>

//                   {isMoving ? (
//                     <ActivityIndicator
//                       size="small"
//                       color="#2563EB"
//                     />
//                   ) : (
//                     <ChevronRight
//                       size={18}
//                       color="#9CA3AF"
//                       style={{
//                         transform: [
//                           {
//                             rotate:
//                               expandedMoveDeviceId === item.id
//                                 ? "90deg"
//                                 : "0deg",
//                           },
//                         ],
//                       }}
//                     />
//                   )}
//                 </Pressable>

//                 {/* GROUP OPTIONS */}

//                 {expandedMoveDeviceId === item.id && (
//                   <View
//                     className="
//                       mt-2
//                       rounded-lg
//                       border
//                       border-gray-200
//                       dark:border-gray-700
//                       overflow-hidden
//                       bg-white
//                       dark:bg-[#252525]
//                     "
//                   >
//                     {availableGroups.length === 0 ? (
//                       <Text className="text-sm text-gray-500 p-3">
//                         No other groups available.
//                       </Text>
//                     ) : (
//                       availableGroups.map((group) => (
//                         <Pressable
//                           key={group.id}
//                           disabled={isMoving}
//                           onPress={(event) => {
//                             event.stopPropagation();

//                             moveDeviceToGroup(
//                               group.id,
//                               item.id
//                             );
//                           }}
//                           className="
//                             px-3
//                             py-3
//                             border-b
//                             border-gray-100
//                             dark:border-gray-700
//                             flex-row
//                             items-center
//                           "
//                         >
//                           <Folder
//                             size={16}
//                             color="#2563EB"
//                           />

//                           <Text className="text-sm text-gray-800 dark:text-gray-200 ml-2">
//                             {group.name}
//                           </Text>
//                         </Pressable>
//                       ))
//                     )}
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>
//         </View>
//       </Pressable>
//     );
//   };

//   // ------------------------------------------------
//   // LOADING
//   // ------------------------------------------------

//   if (loading && frames.length === 0) {
//     return (
//       <AppLayout>
//         <View className="flex-1 items-center justify-center">
//           <ActivityIndicator
//             size="large"
//             color="#2563EB"
//           />

//           <Text className="text-gray-500 mt-3">
//             Loading devices...
//           </Text>
//         </View>
//       </AppLayout>
//     );
//   }

//   // ------------------------------------------------
//   // MAIN UI
//   // ------------------------------------------------

//   return (
//     <AppLayout>
//       {/* HEADER */}

//       <View className="px-4 pt-4 pb-3">
//         <View className="flex-row items-center justify-between">
//           <View className="flex-1 mr-2">
//             <Text
//               className="
//                 text-2xl
//                 font-bold
//                 text-gray-900
//                 dark:text-white
//               "
//             >
//               {groupName || currentGroup?.name
//                 ? groupName || currentGroup?.name
//                 : "Devices"}
//             </Text>

//             <Text className="text-gray-500 text-sm mt-1">
//               Manage your connected devices
//             </Text>
//           </View>

//           {/* HEADER BUTTONS */}

//           <View className="flex-row items-center gap-2">
//             {/* ADD GROUP */}

//             {showAddGroupButton && (
//               <Pressable
//                 onPress={() => setShowGroupPopup(true)}
//                 className="
//                   bg-blue-100
//                   dark:bg-blue-900/30
//                   rounded-xl
//                   px-3
//                   py-3
//                   flex-row
//                   items-center
//                 "
//               >
//                 <Plus
//                   size={18}
//                   color="#2563EB"
//                 />

//                 <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-1">
//                   Group
//                 </Text>
//               </Pressable>
//             )}

//             {/* ADD DEVICE */}

//             <Pressable
//               onPress={() => setShowAddPopup(true)}
//               className="
//                 bg-blue-600
//                 rounded-xl
//                 px-3
//                 py-3
//                 flex-row
//                 items-center
//               "
//             >
//               <Plus
//                 size={18}
//                 color="white"
//               />

//               <Text className="text-white font-semibold ml-1">
//                 Device
//               </Text>
//             </Pressable>
//           </View>
//         </View>

//         {/* CURRENT GROUP */}

//         {selectedGroupId && (
//           <View
//             className="
//               flex-row
//               items-center
//               mt-4
//               bg-blue-50
//               dark:bg-blue-900/20
//               rounded-xl
//               px-4
//               py-3
//             "
//           >
//             <Folder
//               size={18}
//               color="#2563EB"
//             />

//             <Text className="text-blue-600 dark:text-blue-400 font-medium ml-2 flex-1">
//               {groupName ||
//                 currentGroup?.name ||
//                 "Selected Group"}
//             </Text>

//             <Text className="text-gray-500 text-xs">
//               {currentGroup?.frameCount ?? frames.length}{" "}
//               devices
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* DEVICE LIST */}

//       <FlatList
//         data={frames}
//         renderItem={renderItem}
//         keyExtractor={(item) => String(item.id)}
//         contentContainerStyle={{
//           paddingHorizontal: 16,
//           paddingBottom: 120,
//           flexGrow: 1,
//         }}
//         showsVerticalScrollIndicator={false}
//         refreshing={loading}
//         onRefresh={fetchFrames}
//         ListEmptyComponent={
//           <View className="items-center mt-20">
//             <Monitor
//               size={50}
//               color="#9CA3AF"
//             />

//             <Text
//               className="
//                 text-lg
//                 font-semibold
//                 text-gray-700
//                 dark:text-gray-300
//                 mt-4
//               "
//             >
//               No devices yet
//             </Text>

//             <Text className="text-gray-500 mt-1">
//               Add your first device.
//             </Text>
//           </View>
//         }
//       />

//       {/* PAGINATION */}

//       {meta && frames.length > 0 && (
//         <View
//           className="
//             absolute
//             bottom-5
//             left-4
//             right-4
//             bg-white
//             dark:bg-[#1a1a1a]
//             border
//             border-gray-200
//             dark:border-gray-800
//             rounded-xl
//             p-3
//             flex-row
//             items-center
//             justify-between
//           "
//         >
//           <Pressable
//             disabled={!meta.hasPrevious}
//             onPress={() =>
//               setPage((previous) =>
//                 Math.max(1, previous - 1)
//               )
//             }
//             className={`
//               px-4
//               py-2
//               rounded-lg
//               ${
//                 meta.hasPrevious
//                   ? "bg-gray-200 dark:bg-gray-800"
//                   : "bg-gray-100 dark:bg-gray-900"
//               }
//             `}
//           >
//             <Text className="text-gray-700 dark:text-gray-300">
//               Previous
//             </Text>
//           </Pressable>

//           <Text className="text-gray-500">
//             Page {meta.page} of {meta.totalPages}
//           </Text>

//           <Pressable
//             disabled={!meta.hasNext}
//             onPress={() =>
//               setPage((previous) => previous + 1)
//             }
//             className={`
//               px-4
//               py-2
//               rounded-lg
//               ${
//                 meta.hasNext
//                   ? "bg-blue-600"
//                   : "bg-gray-100 dark:bg-gray-900"
//               }
//             `}
//           >
//             <Text
//               className={
//                 meta.hasNext
//                   ? "text-white"
//                   : "text-gray-400"
//               }
//             >
//               Next
//             </Text>
//           </Pressable>
//         </View>
//       )}

//       {/* ADD DEVICE MODAL */}

//       <AddDeviceModal
//         visible={showAddPopup}
//         onClose={() => setShowAddPopup(false)}
//         onAdded={(newFrame: Frame) => {
//           console.log("NEW FRAME ADDED:", newFrame);

//           fetchFrames();
//           fetchGroups();
//         }}
//         hideGroupSelect={true}
//         groupId={selectedGroupId}
//       />

//       {/* ADD GROUP MODAL */}

//       <AddGroupModal
//         visible={showGroupPopup}
//         onClose={() => setShowGroupPopup(false)}
//         onCreated={async () => {
//           await handleGroupCreated();
//         }}
//       />

//       {/* DEVICE SETTINGS */}

//       {selectedDevice && (
//         <DeviceSettingsModal
//           visible={openSettingsModal}
//           device={selectedDevice}
//           onClose={() => {
//             setOpenSettingsModal(false);
//             setSelectedDevice(null);
//           }}
//           onSave={(updated: Frame) => {
//             setFrames((previous) =>
//               previous.map((frame) =>
//                 frame.id === updated.id
//                   ? {
//                       ...frame,
//                       ...updated,
//                     }
//                   : frame
//               )
//             );

//             setOpenSettingsModal(false);
//             setSelectedDevice(null);
//           }}
//         />
//       )}

//       {/* DELETE DEVICE */}

//       <DeleteModal
//         visible={showDeleteModal}
//         onCancel={() => {
//           setShowDeleteModal(false);
//           setSelectedId(null);
//         }}
//         onConfirm={async () => {
//           if (selectedId) {
//             await deleteDevice(selectedId);
//           }

//           setSelectedId(null);
//           setShowDeleteModal(false);
//         }}
//       />
//     </AppLayout>
//   );
// }
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

import Text from "../components/AppText";

import {
  Monitor,
  Trash2,
  Settings,
  Battery,
  Wifi,
  Signal,
  ChevronRight,
  Plus,
  Folder,
  List,
} from "lucide-react-native";

import { useColorScheme } from "nativewind";
import { useUser } from "../context/UserContext";
import api from "../lib/api";
import AppLayout from "./Layout";

import AddDeviceModal from "../modal/AddFramemodal";
import AddGroupModal from "../modal/AddGroupModal";
import DeviceSettingsModal from "../modal/DeviceSettingsModal";
import DeleteModal from "../modal/DeleteModal";

import { Frame } from "../types/Frame";

type Orientation = "portrait" | "landscape";

interface DeviceFrame extends Frame {
  orientation?: Orientation;
  width?: number;
  height?: number;
  modelNo?: string;
  friendlyId?: string;
  battery?: number;
  wifiSSID?: string;
  signalStrength?: number;
  previewImageUrl?: string;
  status?: "online" | "offline";
  updatedAt?: string;
}

interface RouteParams {
  groupId?: string;
  groupName?: string;
  groupCount?: number;
  roles?: string[];
  selectedPluginId?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  frameCount: number;
  isSystemDefault?: boolean;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface GroupsResponse {
  data: Group[];
  meta?: PageMeta;
}

// ------------------------------------------------
// HELPERS
// ------------------------------------------------

function isDeviceOnline(updatedAt?: string) {
  if (!updatedAt) return false;
  const diff = Date.now() - new Date(updatedAt).getTime();
  return diff >= 0 && diff < 86400000;
}

function timeAgo(date?: string) {
  if (!date) return "Never";

  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff) || diff < 0) return "Never";

  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

const getDefaultOrientation = (
  width?: number,
  height?: number
): Orientation => {
  if (!width || !height) return "landscape";
  return width >= height ? "landscape" : "portrait";
};

const getOrientedDimensions = (
  width?: number,
  height?: number,
  orientation: Orientation = "landscape"
) => {
  const originalWidth = Number(width) || 800;
  const originalHeight = Number(height) || 480;

  const landscapeWidth = Math.max(originalWidth, originalHeight);
  const landscapeHeight = Math.min(originalWidth, originalHeight);

  if (orientation === "portrait") {
    return { width: landscapeHeight, height: landscapeWidth };
  }

  return { width: landscapeWidth, height: landscapeHeight };
};

// ------------------------------------------------
// SCREEN
// ------------------------------------------------

export default function FramesScreen({ navigation, route }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const params: RouteParams = route?.params || {};

  const selectedGroupId = params.groupId;
  const groupName = params.groupName;
  const selectedPluginId = params.selectedPluginId;

  // STATES

  const [frames, setFrames] = useState<DeviceFrame[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);

  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PageMeta | null>(null);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showGroupPopup, setShowGroupPopup] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<Frame | null>(null);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [updatingOrientationId, setUpdatingOrientationId] =
    useState<string | null>(null);

  const [expandedMoveDeviceId, setExpandedMoveDeviceId] =
    useState<string | null>(null);

  const [movingDeviceId, setMovingDeviceId] = useState<string | null>(null);

 // DELETE this:
const { user } = useUser();

// Same check as the web AdminContext
const isAdmin =
  user?.roles?.some((role: any) =>
    typeof role === "string"
      ? role.toLowerCase() === "admin"
      : role?.name?.toLowerCase() === "admin"
  ) ?? false;

  const hasMultipleGroups = totalGroups > 1;

  const isDefaultGroup =
    currentGroup?.isSystemDefault === true ||
    (currentGroup?.name ?? groupName ?? "")
      .toLowerCase()
      .includes("default");

  const showAddGroupButton = isAdmin && isDefaultGroup && !hasMultipleGroups;

  const showPlaylistButton =
    !!selectedGroupId && !isDefaultGroup && hasMultipleGroups;

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<GroupsResponse>("/frame-groups");
      const groupData = res.data?.data ?? [];
      setGroups(groupData);
      setTotalGroups(res.data?.meta?.total ?? groupData.length);

      const found = selectedGroupId
        ? groupData.find((g) => String(g.id) === String(selectedGroupId))
        : groupData.find((g) => g.isSystemDefault === true);

      setCurrentGroup(found ?? null);
    } catch (error: any) {
      console.log("Groups error:", error?.response?.data || error);
    }
  }, [selectedGroupId]);

  // ------------------------------------------------
  // FETCH FRAMES
  // ------------------------------------------------

  const fetchFrames = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = selectedGroupId
        ? `/frame-groups/${selectedGroupId}/frames?page=${page}`
        : `/frames?page=${page}`;

      const res = await api.get(endpoint);
      const response = res.data;

      const data = Array.isArray(response) ? response : response?.data ?? [];

      setMeta(response?.meta ?? null);

      const formatted: DeviceFrame[] = data.map((f: any) => {
        const width = f.devices?.[0]?.displayInfo?.displayResolutionWidth;
        const height = f.devices?.[0]?.displayInfo?.displayResolutionHeight;

        const orientation: Orientation =
          f.orientation ?? getDefaultOrientation(width, height);

        return {
          id: f.id,
          name: f.name,
          timezone: f.timezone,
          isEnabled: f.isEnabled,
          updatedAt: f.updatedAt,

          previewImageUrl: f.CurrentPreviewImage
            ? `${f.CurrentPreviewImage}?t=${Date.now()}`
            : undefined,

          battery: f.telemetry?.battery ? Number(f.telemetry.battery) : 0,
          wifiSSID: f.telemetry?.wifiSSID ?? "Unknown",
          signalStrength: f.telemetry?.rssi ?? 0,
          sleepConfig: f.sleepConfig ?? null,

          status: isDeviceOnline(f.updatedAt) ? "online" : "offline",

          modelNo: f.devices?.[0]?.modelNo,
          width,
          height,
          friendlyId: f.devices?.[0]?.friendlyId,
          orientation,
        };
      });

      setFrames(formatted);
    } catch (error: any) {
      console.log("Frames error:", error?.response?.data || error);
      setFrames([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedGroupId]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ------------------------------------------------
  // ORIENTATION CHANGE  (PATCH /frames/edit/:id)
  // ------------------------------------------------

  const handleOrientationChange = async (
    device: DeviceFrame,
    orientation: Orientation
  ) => {
    if (device.orientation === orientation) return;

    try {
      setUpdatingOrientationId(device.id);

      await api.patch(`/frames/edit/${device.id}`, { orientation });

      setFrames((previous) =>
        previous.map((frame) =>
          frame.id === device.id ? { ...frame, orientation } : frame
        )
      );
    } catch (error: any) {
      console.log("Orientation update error:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to change device orientation."
      );
    } finally {
      setUpdatingOrientationId(null);
    }
  };

  // ------------------------------------------------
  // SETTINGS / DELETE / MOVE
  // ------------------------------------------------

  const openSettings = async (device: DeviceFrame) => {
    try {
      const res = await api.get<Frame>(`/frames/${device.id}`);
      setSelectedDevice(res.data);
      setOpenSettingsModal(true);
    } catch (error: any) {
      console.log("Settings error:", error?.response?.data || error);
      Alert.alert("Error", "Failed to load device settings.");
    }
  };

  const deleteDevice = async (frameId: string) => {
    try {
      await api.delete(`/frames/${frameId}`);

      setFrames((previous) =>
        previous.filter((frame) => frame.id !== frameId)
      );

      fetchGroups();
    } catch (error: any) {
      console.log("Delete device error:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to delete device."
      );
    }
  };

  const moveDeviceToGroup = async (groupId: string, frameId: string) => {
    try {
      setMovingDeviceId(frameId);

      await api.patch(`/frame-groups/${groupId}/frames/${frameId}`);

      setExpandedMoveDeviceId(null);

      await fetchFrames();
      await fetchGroups();

      Alert.alert("Success", "Device moved successfully.");
    } catch (error: any) {
      console.log("Move device error:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to move device."
      );
    } finally {
      setMovingDeviceId(null);
    }
  };

  // ------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------

  const openPlaylist = (device: DeviceFrame) => {
    const orientation =
      device.orientation ?? getDefaultOrientation(device.width, device.height);

    const dimensions = getOrientedDimensions(
      device.width,
      device.height,
      orientation
    );

    navigation.navigate("PlayList", {
      id: device.id,
      selectedPluginId,
      deviceName: device.name,
      modelNo: device.modelNo,
      Modelno: device.modelNo,
      width: dimensions.width,
      height: dimensions.height,
      orientation,
    });
  };

  const openGroupPlaylist = () => {
    // Change "GroupPlaylist" to your actual route name
    navigation.navigate("GroupPlaylist", {
      groupId: selectedGroupId,
      groupName: groupName || currentGroup?.name,
    });
  };

  // ------------------------------------------------
  // DEVICE CARD
  // ------------------------------------------------

  const renderItem = ({ item }: { item: DeviceFrame }) => {
    const online = item.status === "online";

    const orientation =
      item.orientation ?? getDefaultOrientation(item.width, item.height);

    const isUpdatingOrientation = updatingOrientationId === item.id;
    const isMoving = movingDeviceId === item.id;
    const busy = isUpdatingOrientation || isMoving;

    const availableGroups = groups.filter(
      (group) => String(group.id) !== String(selectedGroupId)
    );

    const iconColor = isDark ? "#D1D5DB" : "#4B5563";

    return (
      <Pressable
        onPress={() => openPlaylist(item)}
        className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]"
      >
        {/* PREVIEW */}

        <View
          className="w-full items-center justify-center bg-gray-200 dark:bg-gray-800"
          style={{ aspectRatio: 5 / 3 }}
        >
          {item.previewImageUrl ? (
            <Image
              source={{ uri: item.previewImageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Monitor size={40} color={isDark ? "#9CA3AF" : "#6B7280"} />
          )}
        </View>

        {/* INFO */}

        <View className="p-4">
          <View className="flex-row items-center">
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {item.name}
              </Text>

              {item.friendlyId ? (
                <Text className="text-xs text-gray-400">
                  ({item.friendlyId})
                </Text>
              ) : null}

              <Text className="mt-1 text-xs text-gray-500">
                Last seen: {timeAgo(item.updatedAt)}
              </Text>
            </View>

            <View className="ml-2 items-center">
              <Battery size={20} color={iconColor} />
              <Text className="mt-1 text-xs text-gray-500">
                {item.battery ?? 0}
              </Text>
            </View>

            <View className="ml-3 items-center">
              <Wifi size={20} color={iconColor} />
              <Text
                numberOfLines={1}
                className="mt-1 max-w-[65px] text-xs text-gray-500"
              >
                {item.wifiSSID}
              </Text>
            </View>

            <View className="ml-3 items-center">
              <Signal size={20} color={iconColor} />
              <Text className="mt-1 text-xs text-gray-500">
                {item.signalStrength ?? 0}
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#9CA3AF"
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* DIVIDER */}

          <View className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
            {/* ROW 1: STATUS + SETTINGS + DELETE */}

            <View className="flex-row items-center justify-between">
              <View
                className={`rounded-full px-3 py-2 ${
                  online
                    ? "bg-green-100 dark:bg-green-900/40"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Text
                  className={
                    online
                      ? "text-xs font-medium text-green-700 dark:text-green-400"
                      : "text-xs font-medium text-gray-600 dark:text-gray-400"
                  }
                >
                  {online ? "Online" : "Offline"}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    openSettings(item);
                  }}
                  className="mr-2 rounded-lg border border-blue-500 p-2"
                >
                  <Settings size={18} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    setSelectedId(item.id);
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg border border-gray-300 p-2 dark:border-gray-700"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ROW 2: ORIENTATION (full width) */}

            <View className="mt-4 flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
              <Pressable
                disabled={busy}
                onPress={(event) => {
                  event.stopPropagation();
                  handleOrientationChange(item, "landscape");
                }}
                className={`flex-1 items-center justify-center py-3 ${
                  orientation === "landscape"
                    ? "bg-blue-600"
                    : "bg-white dark:bg-[#252525]"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    orientation === "landscape"
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Landscape
                </Text>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={(event) => {
                  event.stopPropagation();
                  handleOrientationChange(item, "portrait");
                }}
                className={`flex-1 items-center justify-center border-l border-gray-300 py-3 dark:border-gray-700 ${
                  orientation === "portrait"
                    ? "bg-blue-600"
                    : "bg-white dark:bg-[#252525]"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    orientation === "portrait"
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Portrait
                </Text>
              </Pressable>
            </View>

            {/* ROW 3: MOVE TO GROUP */}

            {hasMultipleGroups && (
              <View className="mt-4">
                <Pressable
                  disabled={isMoving}
                  onPress={(event) => {
                    event.stopPropagation();
                    setExpandedMoveDeviceId(
                      expandedMoveDeviceId === item.id ? null : item.id
                    );
                  }}
                  className="flex-row items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-[#252525]"
                >
                  <View className="flex-row items-center">
                    <Folder size={17} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Move to Group
                    </Text>
                  </View>

                  {isMoving ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <ChevronRight
                      size={18}
                      color="#9CA3AF"
                      style={{
                        transform: [
                          {
                            rotate:
                              expandedMoveDeviceId === item.id
                                ? "90deg"
                                : "0deg",
                          },
                        ],
                      }}
                    />
                  )}
                </Pressable>

                {expandedMoveDeviceId === item.id && (
                  <View className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#252525]">
                    {availableGroups.length === 0 ? (
                      <Text className="p-3 text-sm text-gray-500">
                        No other groups available.
                      </Text>
                    ) : (
                      availableGroups.map((group) => (
                        <Pressable
                          key={group.id}
                          disabled={isMoving}
                          onPress={(event) => {
                            event.stopPropagation();
                            moveDeviceToGroup(group.id, item.id);
                          }}
                          className="flex-row items-center border-b border-gray-100 px-3 py-3 dark:border-gray-700"
                        >
                          <Folder size={16} color="#2563EB" />
                          <Text className="ml-2 text-sm text-gray-800 dark:text-gray-200">
                            {group.name}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ------------------------------------------------
  // LOADING (first load)
  // ------------------------------------------------

  if (loading && frames.length === 0) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-3 text-gray-500">Loading devices...</Text>
        </View>
      </AppLayout>
    );
  }

  // ------------------------------------------------
  // MAIN UI
  // ------------------------------------------------

  return (
    <AppLayout>
      {/* HEADER */}

      <View className="px-4 pb-3 pt-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {groupName || currentGroup?.name || "Devices"}
        </Text>

        <Text className="mt-1 text-sm text-gray-500">
          Manage your connected devices
        </Text>

        {/* ACTION BUTTONS (same rules as web) */}

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          {showAddGroupButton && (
            <Pressable
              onPress={() => setShowGroupPopup(true)}
              className="flex-row items-center rounded-lg border border-blue-500 px-3 py-2.5"
            >
              <Plus size={16} color="#3B82F6" />
              <Text className="ml-1 text-sm font-semibold text-blue-500">
                Add Group
              </Text>
            </Pressable>
          )}

          {showPlaylistButton && (
            <Pressable
              onPress={openGroupPlaylist}
              className="flex-row items-center rounded-lg border border-blue-500 px-3 py-2.5"
            >
              <List size={16} color="#3B82F6" />
              <Text className="ml-1 text-sm font-semibold text-blue-500">
                Playlist
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setShowAddPopup(true)}
            className="flex-row items-center rounded-lg bg-blue-600 px-3 py-2.5"
          >
            <Plus size={16} color="white" />
            <Text className="ml-1 text-sm font-semibold text-white">
              Add Device
            </Text>
          </Pressable>
        </View>

        {/* CURRENT GROUP BAR */}

        {selectedGroupId && (
          <View className="mt-4 flex-row items-center rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
            <Folder size={18} color="#2563EB" />

            <Text className="ml-2 flex-1 font-medium text-blue-600 dark:text-blue-400">
              {groupName || currentGroup?.name || "Selected Group"}
            </Text>

            <Text className="text-xs text-gray-500">
              {currentGroup?.frameCount ?? frames.length} devices
            </Text>
          </View>
        )}
      </View>

      {/* DEVICE LIST */}

      <FlatList
        data={frames}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchFrames}
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <Monitor size={50} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
              No devices yet
            </Text>
            <Text className="mt-1 text-gray-500">Add your first device.</Text>
          </View>
        }
      />

      {/* PAGINATION */}

      {meta && frames.length > 0 && (
        <View className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#1a1a1a]">
          <Pressable
            disabled={!meta.hasPrevious}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            className={`rounded-lg px-4 py-2 ${
              meta.hasPrevious
                ? "bg-gray-200 dark:bg-gray-800"
                : "bg-gray-100 dark:bg-gray-900"
            }`}
          >
            <Text
              className={
                meta.hasPrevious
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-400"
              }
            >
              Previous
            </Text>
          </Pressable>

          <Text className="text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </Text>

          <Pressable
            disabled={!meta.hasNext}
            onPress={() => setPage((p) => p + 1)}
            className={`rounded-lg px-4 py-2 ${
              meta.hasNext ? "bg-blue-600" : "bg-gray-100 dark:bg-gray-900"
            }`}
          >
            <Text className={meta.hasNext ? "text-white" : "text-gray-400"}>
              Next
            </Text>
          </Pressable>
        </View>
      )}

      {/* ADD DEVICE MODAL */}

      <AddDeviceModal
        visible={showAddPopup}
        onClose={() => setShowAddPopup(false)}
        onAdded={() => {
          fetchFrames();
          fetchGroups();
        }}
        hideGroupSelect={true}
        groupId={selectedGroupId}
      />

      {/* ADD GROUP MODAL */}

      <AddGroupModal
        visible={showGroupPopup}
        onClose={() => setShowGroupPopup(false)}
        onCreated={async () => {
          setShowGroupPopup(false);
          await fetchGroups();
          navigation.navigate("Groups"); // same as web: navigate("/groups")
        }}
      />

      {/* DEVICE SETTINGS */}

      {selectedDevice && (
        <DeviceSettingsModal
          visible={openSettingsModal}
          device={selectedDevice}
          onClose={() => {
            setOpenSettingsModal(false);
            setSelectedDevice(null);
          }}
          onSave={(updated: Frame) => {
            setFrames((previous) =>
              previous.map((frame) =>
                frame.id === updated.id ? { ...frame, ...updated } : frame
              )
            );
            setOpenSettingsModal(false);
            setSelectedDevice(null);
          }}
        />
      )}

      {/* DELETE DEVICE */}

      <DeleteModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedId(null);
        }}
        onConfirm={async () => {
          if (selectedId) {
            await deleteDevice(selectedId);
          }
          setSelectedId(null);
          setShowDeleteModal(false);
        }}
      />
    </AppLayout>
  );
}