// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";

// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Linking,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   useWindowDimensions,
// } from "react-native";

// import { WebView } from "react-native-webview";
// import { Liquid } from "liquidjs";

// import { EpImage } from "../ep-ui";

// import type { EpNode } from "../../packages/ltag";

// import { compileLTHtml } from "../../packages/ltag/compile/compiler";

// import { resolveLayout } from "../../packages/ltag/resolve/resolveLayout";

// import {
//   DEFAULT_DEVICE_PROFILE,
//   LTDP75BW_800x480,
//   E6_73IN_800x480,
//   E6_13IN_1200x1600,
// } from "../../packages/ltag/device";

// import type {
//   DeviceProfile,
// } from "../../packages/ltag/device";

// import api from "../lib/api";

// import { ConnectorCard } from "../modal/ConnectorCard";

// /* =========================================================
//    TYPES
// ========================================================= */

// type PlaygroundSessionResponse = {
//   session: {
//     id: string;
//   };
// };

// type PlaygroundInstance = {
//   id: string;
//   instanceKey: string;
//   connectorType: string;
//   config: Record<string, any>;

//   oauthTokenId?: string | null;

//   scope?: "user" | "author";

//   configScope?: "user" | "author";

//   pluginConnectorInstanceId?: string;

//   updatedAt?: string;
// };

// type Plugin = {
//   pluginId: string;
//   pluginName: string;
//   pluginCode: string;
//   pluginDescription?: string;
// };

// type Connector = {
//   id: number;
//   type: string;

//   config?: Record<string, any>;

//   schema?: {
//     sampleResponse?: Record<string, any>;

//     [key: string]: any;
//   };
// };

// type DisplayInfo = {
//   displayId: string;
//   modelNo: string;
//   displayResolutionWidth: number;
//   displayResolutionHeight: number;
// };

// type PlaylistPlaygroundResponse = {
//   playgroundSessionId: string;

//   playgroundConnectorConfigs: PlaygroundInstance[];

//   oauthTokens: any;
// };

// type Props = {
//   route: {
//     params: {
//       pluginId: string;
//       playlistItemId?: string;
//     };
//   };
// };

// /* =========================================================
//    HELPERS
// ========================================================= */

// const normalizeInstanceKey = (
//   key: string = ""
// ) =>
//   key
//     .trim()
//     .replace(/\s+/g, "_")
//     .replace(/^[^a-zA-Z]+/, "");

// function appendCacheVersion(
//   src: string,
//   version: number
// ) {
//   if (!src || !version) {
//     return src;
//   }

//   return `${src}${
//     src.includes("?") ? "&" : "?"
//   }v=${version}`;
// }

// /* =========================================================
//    EXECUTION DATA NORMALIZER
// ========================================================= */

// function normalizeExecutionContext(
//   raw: any
// ): Record<string, any> {
//   if (!raw) {
//     return {};
//   }

//   /* -------------------------------------------------------
//      Already an object
//   ------------------------------------------------------- */

//   if (
//     !Array.isArray(raw) &&
//     typeof raw === "object"
//   ) {
//     if (
//       raw.data &&
//       typeof raw.data === "object" &&
//       !Array.isArray(raw.data)
//     ) {
//       return raw.data;
//     }

//     if (
//       raw.result &&
//       typeof raw.result === "object" &&
//       !Array.isArray(raw.result)
//     ) {
//       if (
//         raw.result.data &&
//         typeof raw.result.data === "object" &&
//         !Array.isArray(raw.result.data)
//       ) {
//         return raw.result.data;
//       }

//       return raw.result;
//     }

//     return raw;
//   }

//   /* -------------------------------------------------------
//      Array response
//   ------------------------------------------------------- */

//   if (Array.isArray(raw)) {
//     const context: Record<string, any> = {};

//     raw.forEach(
//       (
//         item: any,
//         index: number
//       ) => {
//         if (!item) {
//           return;
//         }

//         const key =
//           item.instanceKey ??
//           item.connectorKey ??
//           item.key ??
//           item.connectorType;

//         let value =
//           item.result ??
//           item.data ??
//           item.response ??
//           item.executionResult;

//         if (
//           value &&
//           typeof value === "object" &&
//           !Array.isArray(value)
//         ) {
//           if (
//             value.data &&
//             typeof value.data === "object"
//           ) {
//             value = value.data;
//           } else if (
//             value.result &&
//             typeof value.result === "object"
//           ) {
//             value = value.result;
//           }
//         }

//         if (key) {
//           context[
//             normalizeInstanceKey(
//               String(key)
//             )
//           ] = value ?? {};

//           return;
//         }

//         if (
//           typeof item === "object" &&
//           !Array.isArray(item)
//         ) {
//           const itemKeys =
//             Object.keys(item);

//           const looksLikeContext =
//             itemKeys.length > 0 &&
//             itemKeys.some(
//               (itemKey) =>
//                 item[itemKey] &&
//                 typeof item[itemKey] ===
//                   "object"
//             );

//           if (looksLikeContext) {
//             Object.assign(
//               context,
//               item
//             );

//             return;
//           }
//         }

//         console.log(
//           `⚠️ UNKNOWN EXECUTION ITEM ${index}:`,
//           item
//         );
//       }
//     );

//     return context;
//   }

//   return {};
// }

// /* =========================================================
//    SCREEN
// ========================================================= */

// export default function PluginPlaygroundScreen({
//   route,
// }: Props) {
//   const pluginId =
//     route?.params?.pluginId;

//   const playlistItemId =
//     route?.params?.playlistItemId;

//   const {
//     width: screenWidth,
//     height: screenHeight,
//   } = useWindowDimensions();

//   const engine = useMemo(
//     () => new Liquid(),
//     []
//   );

//   /* =======================================================
//      STATE
//   ======================================================= */

//   const [loading, setLoading] =
//     useState(true);

//   const [plugin, setPlugin] =
//     useState<Plugin | null>(null);

//   const [connectors, setConnectors] =
//     useState<Connector[]>([]);

//   const [
//     playgroundInstances,
//     setPlaygroundInstances,
//   ] = useState<
//     PlaygroundInstance[]
//   >([]);

//   const [
//     playgroundSessionId,
//     setPlaygroundSessionId,
//   ] = useState<string | null>(
//     null
//   );

//   const [
//     playgroundExecutionData,
//     setPlaygroundExecutionData,
//   ] = useState<any>(null);

//   const [devices, setDevices] =
//     useState<DisplayInfo[]>([]);

//   const [device, setDevice] =
//     useState<DisplayInfo | null>(
//       null
//     );

//   const [
//     currentDeviceProfile,
//     setCurrentDeviceProfile,
//   ] = useState<DeviceProfile>(
//     DEFAULT_DEVICE_PROFILE
//   );

//   const [epuiTree, setEpuiTree] =
//     useState<EpNode | null>(null);

//   const [compileError, setCompileError] =
//     useState<string | null>(null);

//   const [
//     openInstanceId,
//     setOpenInstanceId,
//   ] = useState<string | null>(null);

//   const [hasChanges, setHasChanges] =
//     useState(false);

//   const [isExecuting, setIsExecuting] =
//     useState(false);

//   const [
//     isUpdatingPlaylist,
//     setIsUpdatingPlaylist,
//   ] = useState(false);

//   const [
//     showDeviceSelector,
//     setShowDeviceSelector,
//   ] = useState(false);

//   const [
//     dataContextExpanded,
//     setDataContextExpanded,
//   ] = useState(false);

//   const [
//     imageVersion,
//     setImageVersion,
//   ] = useState(0);

//   const configTimers =
//     useRef<
//       Record<
//         string,
//         ReturnType<typeof setTimeout>
//       >
//     >({});

//   const compileRequestRef =
//     useRef(0);

//   /* =======================================================
//      DEVICE SIZE
     
//      IMPORTANT:
//      DeviceProfile already has:
//        canvasWidth
//        canvasHeight
//   ======================================================= */

//   const deviceWidth =
//     currentDeviceProfile.canvasWidth;

//   const deviceHeight =
//     currentDeviceProfile.canvasHeight;

//   /* =======================================================
//      DEVICE PROFILE
//   ======================================================= */

//   const getDeviceProfile =
//     useCallback(
//       (
//         display: DisplayInfo
//       ): DeviceProfile => {
//         const model =
//           display.modelNo
//             ?.toUpperCase()
//             ?.replace(/\s/g, "");

//         if (
//           model.includes("LTDP75BW")
//         ) {
//           return LTDP75BW_800x480;
//         }

//         if (
//           model.includes("E6_73") ||
//           model.includes("E673")
//         ) {
//           return E6_73IN_800x480;
//         }

//         if (
//           model.includes("E6_13") ||
//           model.includes("E613")
//         ) {
//           return E6_13IN_1200x1600;
//         }

//         if (
//           display.displayResolutionWidth ===
//             1200 &&
//           display.displayResolutionHeight ===
//             1600
//         ) {
//           return E6_13IN_1200x1600;
//         }

//         return DEFAULT_DEVICE_PROFILE;
//       },
//       []
//     );

//   useEffect(() => {
//     if (!device) {
//       return;
//     }

//     const profile =
//       getDeviceProfile(device);

//     console.log(
//       "========== DEVICE =========="
//     );

//     console.log(
//       "MODEL:",
//       device.modelNo
//     );

//     console.log(
//       "RESOLUTION:",
//       device.displayResolutionWidth,
//       "x",
//       device.displayResolutionHeight
//     );

//     console.log(
//       "CANVAS:",
//       profile.canvasWidth,
//       "x",
//       profile.canvasHeight
//     );

//     setCurrentDeviceProfile(
//       profile
//     );

//     setImageVersion(
//       (value) => value + 1
//     );
//   }, [
//     device,
//     getDeviceProfile,
//   ]);

//   /* =======================================================
//      LOAD DEVICES
//   ======================================================= */

//   const loadDevices =
//     useCallback(async () => {
//       try {
//         const response =
//           await api.get<DisplayInfo[]>(
//             "/device/display-infos"
//           );

//         const list =
//           response.data ?? [];

//         console.log(
//           "========== DEVICES =========="
//         );

//         console.log(
//           JSON.stringify(
//             list,
//             null,
//             2
//           )
//         );

//         setDevices(list);

//         if (list.length > 0) {
//           setDevice(list[0]);
//         }
//       } catch (error: any) {
//         console.error(
//           "DEVICE LOAD ERROR:",
//           error?.response?.data ??
//             error
//         );

//         Alert.alert(
//           "Error",
//           "Failed to load devices."
//         );
//       }
//     }, []);

//   /* =======================================================
//      LOAD PLUGIN
//   ======================================================= */

//   const loadPlugin =
//     useCallback(async () => {
//       const response =
//         await api.get<Plugin>(
//           `/plugin/${pluginId}`
//         );

//       console.log(
//         "========== PLUGIN =========="
//       );

//       console.log(
//         "PLUGIN ID:",
//         response.data?.pluginId
//       );

//       console.log(
//         "PLUGIN NAME:",
//         response.data?.pluginName
//       );

//       console.log(
//         "PLUGIN CODE:",
//         response.data?.pluginCode
//       );

//       setPlugin(
//         response.data
//       );
//     }, [pluginId]);

//   /* =======================================================
//      LOAD CONNECTORS
//   ======================================================= */

//   const loadConnectors =
//     useCallback(async () => {
//       const response =
//         await api.get<Connector[]>(
//           "/test/data-connectors/connectors"
//         );

//       const list =
//         response.data ?? [];

//       console.log(
//         "========== CONNECTORS =========="
//       );

//       console.log(
//         JSON.stringify(
//           list,
//           null,
//           2
//         )
//       );

//       setConnectors(list);
//     }, []);

//   /* =======================================================
//      CREATE PLAYGROUND SESSION
//   ======================================================= */

//   const createPlaygroundSession =
//     useCallback(async () => {
//       const response =
//         await api.post<PlaygroundSessionResponse>(
//           `/playground/${pluginId}/create-session`
//         );

//       console.log(
//         "========== CREATED SESSION =========="
//       );

//       console.log(
//         response.data
//       );

//       return response.data.session;
//     }, [pluginId]);

//   /* =======================================================
//      REFRESH PLAYGROUND SESSION
//   ======================================================= */

//   const refreshPlaygroundSession =
//     useCallback(async () => {
//       const response =
//         await api.get<{
//           id: string;
//         }>(
//           `/playground/${pluginId}/refresh`
//         );

//       console.log(
//         "========== REFRESHED SESSION =========="
//       );

//       console.log(
//         response.data
//       );

//       return response.data;
//     }, [pluginId]);

//   /* =======================================================
//      LOAD PLAYGROUND CONNECTORS
//   ======================================================= */

//   const loadPlaygroundConnectors =
//     useCallback(
//       async (
//         sessionId: string
//       ) => {
//         const response =
//           await api.get<
//             PlaygroundInstance[]
//           >(
//             `/playground/${sessionId}/connectors`
//           );

//         const list =
//           response.data ?? [];

//         console.log(
//           "========== PLAYGROUND CONNECTORS =========="
//         );

//         console.log(
//           JSON.stringify(
//             list,
//             null,
//             2
//           )
//         );

//         setPlaygroundInstances(
//           list
//         );

//         return list;
//       },
//       []
//     );

//   /* =======================================================
//      LOAD EXECUTION
//   ======================================================= */

//   const playgroundExecution =
//     useCallback(
//       async (
//         sessionId: string
//       ) => {
//         const response =
//           await api.get<any>(
//             `/execution/playground/${sessionId}`
//           );

//         const executionData =
//           response.data;

//         console.log(
//           "========== RAW EXECUTION RESPONSE =========="
//         );

//         console.log(
//           JSON.stringify(
//             executionData,
//             null,
//             2
//           )
//         );

//         setPlaygroundExecutionData(
//           executionData
//         );

//         return executionData;
//       },
//       []
//     );

//   /* =======================================================
//      LOAD PLAYLIST PLAYGROUND
//   ======================================================= */

//   const loadPlaylistPlayground =
//     useCallback(
//       async (
//         itemId: string
//       ) => {
//         const response =
//           await api.get<PlaylistPlaygroundResponse>(
//             `/playlist/${itemId}/get-playground`
//           );

//         const data =
//           response.data;

//         console.log(
//           "========== PLAYLIST PLAYGROUND =========="
//         );

//         console.log(
//           JSON.stringify(
//             data,
//             null,
//             2
//           )
//         );

//         setPlaygroundSessionId(
//           data.playgroundSessionId
//         );

//         setPlaygroundInstances(
//           data.playgroundConnectorConfigs ??
//             []
//         );

//         /*
//          * Do not use oauthTokens as
//          * Liquid data context.
//          *
//          * Fetch the actual execution
//          * response below.
//          */
//         setPlaygroundExecutionData(
//           null
//         );

//         await playgroundExecution(
//           data.playgroundSessionId
//         );

//         return data;
//       },
//       [playgroundExecution]
//     );

//   /* =======================================================
//      INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {
//     let cancelled = false;

//     const load =
//       async () => {
//         try {
//           setLoading(true);

//           await Promise.all([
//             loadPlugin(),
//             loadConnectors(),
//             loadDevices(),
//           ]);

//           if (cancelled) {
//             return;
//           }

//           if (playlistItemId) {
//             await loadPlaylistPlayground(
//               playlistItemId
//             );
//           } else {
//             const session =
//               await createPlaygroundSession();

//             if (cancelled) {
//               return;
//             }

//             setPlaygroundSessionId(
//               session.id
//             );

//             await loadPlaygroundConnectors(
//               session.id
//             );

//             await playgroundExecution(
//               session.id
//             );
//           }
//         } catch (error: any) {
//           console.error(
//             "PLUGIN PLAYGROUND LOAD ERROR:",
//             error?.response?.data ??
//               error
//           );

//           Alert.alert(
//             "Error",
//             error?.response?.data
//               ?.message ??
//               "Failed to load PluginIDE."
//           );
//         } finally {
//           if (!cancelled) {
//             setLoading(false);
//           }
//         }
//       };

//     if (pluginId) {
//       load();
//     }

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     pluginId,
//     playlistItemId,
//     loadPlugin,
//     loadConnectors,
//     loadDevices,
//     createPlaygroundSession,
//     loadPlaygroundConnectors,
//     playgroundExecution,
//     loadPlaylistPlayground,
//   ]);

//   /* =======================================================
//      LIQUID DATA CONTEXT
//   ======================================================= */

//   const dataContext =
//     useMemo(
//       () =>
//         normalizeExecutionContext(
//           playgroundExecutionData
//         ),
//       [playgroundExecutionData]
//     );

//   /* =======================================================
//      DEBUG DATA
//   ======================================================= */

//   useEffect(() => {
//     console.log(
//       "========== FINAL LIQUID DATA CONTEXT =========="
//     );

//     console.log(
//       JSON.stringify(
//         dataContext,
//         null,
//         2
//       )
//     );

//     console.log(
//       "LIQUID KEYS:",
//       Object.keys(
//         dataContext
//       )
//     );

//     console.log(
//       "RSS:",
//       dataContext?.rss
//     );

//     console.log(
//       "RSS ITEMS:",
//       dataContext?.rss
//         ?.items
//     );
//   }, [dataContext]);

//   /* =======================================================
//      COMPILE
//   ======================================================= */

//   useEffect(() => {
//     if (!plugin) {
//       return;
//     }

//     if (!plugin.pluginCode) {
//       setEpuiTree(null);
//       return;
//     }

//     const requestId =
//       ++compileRequestRef.current;

//     const compile =
//       async () => {
//         try {
//           setCompileError(null);

//           console.log(
//             "========================================"
//           );

//           console.log(
//             "🔥 START MOBILE LIQUID COMPILE"
//           );

//           console.log(
//             "========================================"
//           );

//           console.log(
//             "LIQUID CONTEXT:"
//           );

//           console.log(
//             JSON.stringify(
//               dataContext,
//               null,
//               2
//             )
//           );

//           /* -------------------------------------------
//              Liquid
//           ------------------------------------------- */

//           const html =
//             await engine.parseAndRender(
//               plugin.pluginCode,
//               dataContext
//             );

//           console.log(
//             "========== MOBILE LIQUID HTML =========="
//           );

//           console.log(html);

//           if (
//             requestId !==
//             compileRequestRef.current
//           ) {
//             return;
//           }

//           /* -------------------------------------------
//              Compile HTML -> EP Tree
//           ------------------------------------------- */

//           const rawTree =
//             compileLTHtml(
//               html
//             );

//           console.log(
//             "========== MOBILE RAW EP TREE =========="
//           );

//           console.log(
//             JSON.stringify(
//               rawTree,
//               null,
//               2
//             )
//           );

//           if (
//             requestId !==
//             compileRequestRef.current
//           ) {
//             return;
//           }

//           /* -------------------------------------------
//              Resolve Layout
//           ------------------------------------------- */

//           const resolvedTree =
//             resolveLayout(
//               rawTree,
//               currentDeviceProfile
//             );

//           console.log(
//             "========== MOBILE RESOLVED EP TREE =========="
//           );

//           console.log(
//             JSON.stringify(
//               resolvedTree,
//               null,
//               2
//             )
//           );

//           if (
//             requestId !==
//             compileRequestRef.current
//           ) {
//             return;
//           }

//           setEpuiTree(
//             resolvedTree
//           );

//           console.log(
//             "========== COMPILE COMPLETE =========="
//           );
//         } catch (error: any) {
//           console.error(
//             "EP COMPILE ERROR:",
//             error
//           );

//           setCompileError(
//             error?.message ??
//               "Failed to compile plugin."
//           );

//           setEpuiTree(null);
//         }
//       };

//     compile();
//   }, [
//     plugin,
//     dataContext,
//     engine,
//     currentDeviceProfile,
//   ]);

//   /* =======================================================
//      EXECUTE
//   ======================================================= */

//   const executePlayground =
//     useCallback(
//       async () => {
//         if (
//           !playgroundSessionId
//         ) {
//           return;
//         }

//         try {
//           setIsExecuting(true);

//           console.log(
//             "========== EXECUTE PLAYGROUND =========="
//           );

//           const session =
//             await refreshPlaygroundSession();

//           setPlaygroundSessionId(
//             session.id
//           );

//           await playgroundExecution(
//             session.id
//           );

//           await loadPlaygroundConnectors(
//             session.id
//           );

//           setHasChanges(false);

//           setImageVersion(
//             (value) =>
//               value + 1
//           );
//         } catch (error: any) {
//           console.error(
//             "EXECUTION ERROR:",
//             error?.response?.data ??
//               error
//           );

//           Alert.alert(
//             "Execution failed",
//             error?.response?.data
//               ?.message ??
//               "Failed to execute playground."
//           );
//         } finally {
//           setIsExecuting(false);
//         }
//       },
//       [
//         playgroundSessionId,
//         refreshPlaygroundSession,
//         playgroundExecution,
//         loadPlaygroundConnectors,
//       ]
//     );

//   /* =======================================================
//      CONFIG UPDATE
//   ======================================================= */

//   const updatePlaygroundInstanceConfig =
//     useCallback(
//       (
//         instanceId: string,
//         config: Record<string, any>
//       ) => {
//         setPlaygroundInstances(
//           (previous) =>
//             previous.map(
//               (instance) =>
//                 instance.id ===
//                 instanceId
//                   ? {
//                       ...instance,
//                       config,
//                     }
//                   : instance
//             )
//         );

//         setHasChanges(true);

//         const oldTimer =
//           configTimers.current[
//             instanceId
//           ];

//         if (oldTimer) {
//           clearTimeout(
//             oldTimer
//           );
//         }

//         configTimers.current[
//           instanceId
//         ] = setTimeout(
//           async () => {
//             if (
//               !playgroundSessionId
//             ) {
//               return;
//             }

//             try {
//               await api.patch(
//                 `/playground/${playgroundSessionId}/connector-instance/${instanceId}`,
//                 {
//                   config,
//                 }
//               );
//             } catch (error: any) {
//               console.error(
//                 "CONFIG UPDATE ERROR:",
//                 error?.response
//                   ?.data ??
//                   error
//               );

//               Alert.alert(
//                 "Error",
//                 error?.response
//                   ?.data
//                   ?.message ??
//                   "Failed to update connector."
//               );
//             }
//           },
//           400
//         );
//       },
//       [playgroundSessionId]
//     );

//   /* =======================================================
//      OAUTH
//   ======================================================= */

//   const startOAuth =
//     useCallback(
//       async (
//         instanceId: string,
//         provider:
//           | "google"
//           | "notion"
//       ) => {
//         try {
//           const response =
//             await api.post<{
//               url: string;
//             }>(
//               `/playground/connector/${instanceId}/oauth/connect`,
//               {
//                 origin:
//                   "myapp://oauth",
//               }
//             );

//           if (
//             !response.data?.url
//           ) {
//             throw new Error(
//               "OAuth URL was not returned."
//             );
//           }

//           await Linking.openURL(
//             response.data.url
//           );
//         } catch (error: any) {
//           console.error(
//             "OAUTH ERROR:",
//             error?.response
//               ?.data ??
//               error
//           );

//           Alert.alert(
//             "OAuth failed",
//             error?.response
//               ?.data
//               ?.message ??
//               `Failed to connect ${provider}.`
//           );
//         }
//       },
//       []
//     );

//   /* =======================================================
//      OAUTH RETURN
//   ======================================================= */

//   useEffect(() => {
//     const handleDeepLink =
//       async ({
//         url,
//       }: {
//         url: string;
//       }) => {
//         if (
//           !url.startsWith(
//             "myapp://oauth"
//           )
//         ) {
//           return;
//         }

//         try {
//           if (
//             !playgroundSessionId
//           ) {
//             return;
//           }

//           const session =
//             await refreshPlaygroundSession();

//           setPlaygroundSessionId(
//             session.id
//           );

//           await playgroundExecution(
//             session.id
//           );

//           await loadPlaygroundConnectors(
//             session.id
//           );

//           setHasChanges(true);

//           setImageVersion(
//             (value) =>
//               value + 1
//           );
//         } catch (error) {
//           console.error(
//             "OAUTH REFRESH ERROR:",
//             error
//           );
//         }
//       };

//     const subscription =
//       Linking.addEventListener(
//         "url",
//         handleDeepLink
//       );

//     Linking.getInitialURL()
//       .then(
//         (url) => {
//           if (url) {
//             handleDeepLink({
//               url,
//             });
//           }
//         }
//       )
//       .catch(() => {});

//     return () => {
//       subscription.remove();
//     };
//   }, [
//     playgroundSessionId,
//     refreshPlaygroundSession,
//     playgroundExecution,
//     loadPlaygroundConnectors,
//   ]);

//   /* =======================================================
//      PLAYLIST UPDATE
//   ======================================================= */

//   const handleUpdatePlaylist =
//     useCallback(
//       async () => {
//         if (!playlistItemId) {
//           Alert.alert(
//             "Error",
//             "Playlist item not found."
//           );

//           return;
//         }

//         try {
//           setIsUpdatingPlaylist(
//             true
//           );

//           await api.post(
//             `/playlist/item/${playlistItemId}/sync-connectors`
//           );

//           Alert.alert(
//             "Success",
//             "Playlist updated successfully."
//           );
//         } catch (error: any) {
//           console.error(
//             "PLAYLIST UPDATE ERROR:",
//             error?.response
//               ?.data ??
//               error
//           );

//           Alert.alert(
//             "Error",
//             error?.response
//               ?.data
//               ?.message ??
//               "Failed to update playlist."
//           );
//         } finally {
//           setIsUpdatingPlaylist(
//             false
//           );
//         }
//       },
//       [playlistItemId]
//     );

//   /* =======================================================
//      RENDER EP NODE
     
//      IMPORTANT:
//      For the basic EP layout we intentionally use
//      native React Native View/Text.
     
//      This avoids flex/layout behavior from the
//      old EpCanvas/EpColumns/EpBlock wrappers.
//   ======================================================= */

// /* =========================================================
//    RENDER EP NODE
// ========================================================= */

// const renderEpNode = useCallback(
//   (
//     node: EpNode,
//     key?: string | number,
//     isOverlay: boolean = false
//   ): React.ReactNode => {
//     const n = node as any;

//     if (!n) {
//       return null;
//     }

//     switch (n.type) {
//       /* =====================================================
//          CANVAS
//       ===================================================== */

//       case "canvas":
//         return (
//           <View
//             key={key}
//             style={{
//               width: deviceWidth,
//               height: deviceHeight,

//               backgroundColor: "#ffffff",

//               position: "relative",

//               overflow: "hidden",
//             }}
//           >
//             {/* =================================================
//                 MAIN CONTENT
//             ================================================= */}

//             <View
//               style={{
//                 position: "absolute",

//                 left: 0,
//                 top: 0,
//                 right: 0,
//                 bottom: 0,

//                 overflow: "hidden",
//               }}
//             >
//               {(n.children ?? []).map(
//                 (
//                   child: EpNode,
//                   index: number
//                 ) =>
//                   renderEpNode(
//                     child,
//                     `${key}-child-${index}`,
//                     false
//                   )
//               )}
//             </View>

//             {/* =================================================
//                 CANVAS OVERLAY
//             ================================================= */}

//             <View
//               pointerEvents="none"
//               style={{
//                 position: "absolute",

//                 left: 0,
//                 right: 0,
//                 bottom: 0,

//                 height: 80,

//                 alignItems: "flex-end",
//                 justifyContent: "flex-end",

//                 paddingRight: 24,
//                 paddingBottom: 10,

//                 backgroundColor: "transparent",

//                 zIndex: 1000,
//                 elevation: 1000,
//               }}
//             >
//               {(n.overlay ?? []).map(
//                 (
//                   child: EpNode,
//                   index: number
//                 ) =>
//                   renderEpNode(
//                     child,
//                     `${key}-overlay-${index}`,
//                     true
//                   )
//               )}
//             </View>
//           </View>
//         );

//       /* =====================================================
//          COLUMNS
//          Match the web preview's row-by-row grid order.
//       ===================================================== */

//  case "columns": {
//         const columns: EpNode[][] =
//           Array.isArray(n.columns)
//             ? n.columns
//             : [];

//         if (columns.length === 0) {
//           return null;
//         }

//         return (
//           <View
//             key={key}
//             style={{
//               flex: 1,

//               width: "100%",

//               flexDirection: "row",

//               minWidth: 0,
//               minHeight: 0,

//               overflow: "hidden",
//             }}
//           >
//             {columns.map(
//               (
//                 column: EpNode[],
//                 columnIndex: number
//               ) => (
//                 <View
//                   key={`${key}-column-${columnIndex}`}
//                   style={{
//                     /*
//                      * Every column gets an equal
//                      * share unless your resolver
//                      * later provides a weight.
//                      */
//                     flex: 1,

//                     minWidth: 0,
//                     minHeight: 0,

//                     height: "100%",

//                     flexDirection:
//                       "column",

//                     overflow:
//                       "hidden",
//                   }}
//                 >
//                   {column.map(
//                     (
//                       child: EpNode,
//                       childIndex: number
//                     ) =>
//                       renderEpNode(
//                         child,
//                         `${key}-column-${columnIndex}-${childIndex}`,
//                         isOverlay
//                       )
//                   )}
//                 </View>
//               )
//             )}
//           </View>
//         );
//       }

//       /* =====================================================
//          COLUMN
//       ===================================================== */

//       case "column":
//         return (
//           <View
//             key={key}
//             style={{
//               flex: 1,

//               width: "100%",
//               height: "100%",

//               flexDirection: "column",

//               overflow: "hidden",
//             }}
//           >
//             {(n.children ?? []).map(
//               (
//                 child: EpNode,
//                 index: number
//               ) =>
//                 renderEpNode(
//                   child,
//                   `${key}-column-${index}`,
//                   isOverlay
//                 )
//             )}
//           </View>
//         );

//       /* =====================================================
//          BLOCK
//       ===================================================== */

//     case "block": {
//   const hasBorder =
//     n.border === true ||
//     n.border === 1 ||
//     n.border === "true" ||
//     n.className?.includes("ep-block--border") ||
//     n.class?.includes("ep-block--border") ||
//     n.classes?.includes?.("ep-block--border");

//   return (
//     <View
//       key={key}
//       style={{
//         flex: isOverlay ? 0 : 1,
//         width: isOverlay
//           ? "auto"
//           : "100%",

//         minWidth: 0,
//         minHeight: 0,

//         alignSelf: isOverlay
//           ? "flex-end"
//           : "stretch",

//         flexDirection: "column",

//         justifyContent:
//           n.vAlign === "center"
//             ? "center"
//             : n.vAlign === "bottom"
//             ? "flex-end"
//             : "flex-start",

//         alignItems:
//           n.hAlign === "center"
//             ? "center"
//             : n.hAlign === "right"
//             ? "flex-end"
//             : isOverlay
//             ? "flex-end"
//             : "stretch",

//         padding: isOverlay
//           ? 0
//           : n.full
//           ? 0
//           : 12,

//         /*
//          * =============================================
//          * BORDER
//          * =============================================
//          */
//         borderWidth:
//           hasBorder && !isOverlay
//             ? currentDeviceProfile.blockBorder || 1
//             : 0,

//         borderColor:
//           hasBorder && !isOverlay
//             ? "#000000"
//             : "transparent",

//         /*
//          * Prevent content from escaping.
//          */
//         overflow: "hidden",

//         backgroundColor: "#ffffff",
//       }}
//     >
//       {(n.children ?? []).map(
//         (
//           child: EpNode,
//           index: number
//         ) =>
//           renderEpNode(
//             child,
//             `${key}-block-${index}`,
//             isOverlay
//           )
//       )}
//     </View>
//   );
// }
//       /* =====================================================
//          TEXT
//       ===================================================== */

//       case "text": {
//         const fontSize =
//           n.size === "large"
//             ? currentDeviceProfile
//                 .textSizes.large
//             : n.size === "small"
//             ? currentDeviceProfile
//                 .textSizes.small
//             : currentDeviceProfile
//                 .textSizes.medium;

//         return (
//           <Text
//             key={key}
//             style={{
//               color: "#000000",

//               fontSize,

//               lineHeight:
//                 currentDeviceProfile.lineHeight,

//               fontWeight: "400",

//               flexShrink: 1,

//               textAlign:
//                 n.align === "center"
//                   ? "center"
//                   : "left",

//               includeFontPadding: true,
//             }}
//           >
//             {n.text ?? ""}
//           </Text>
//         );
//       }

//       /* =====================================================
//          STAT
//       ===================================================== */

//       case "stat": {
//         const statSize =
//           n.size === "large"
//             ? currentDeviceProfile
//                 .statSizes.large
//             : n.size === "small"
//             ? currentDeviceProfile
//                 .statSizes.small
//             : currentDeviceProfile
//                 .statSizes.medium;

//         return (
//           <Text
//             key={key}
//             style={{
//               color: "#000000",

//               fontSize: statSize.fontSize,

//               lineHeight:
//                 statSize.lineHeight,

//               fontWeight: "700",

//               textAlign:
//                 n.hAlign === "center"
//                   ? "center"
//                   : "right",

//               includeFontPadding: true,
//             }}
//           >
//             {n.value ?? ""}
//           </Text>
//         );
//       }

//       /* =====================================================
//          IMAGE
//       ===================================================== */

//       case "image": {
//         const imageSrc =
//           appendCacheVersion(
//             n.src,
//             imageVersion
//           );

//         /*
//          * IMPORTANT:
//          *
//          * Overlay images must NOT use EpImage,
//          * because EpImage uses flex:1 / width:100% /
//          * height:100% and will stretch the image.
//          */
//         if (isOverlay) {
//           const overlayWidth =
//             typeof n.width === "number" &&
//             n.width > 0
//               ? n.width
//               : 60;

//           const overlayHeight =
//             typeof n.height === "number" &&
//             n.height > 0
//               ? n.height
//               : 60;

//           return (
//             <View
//               key={`${n.src}-overlay-${imageVersion}`}
//               style={{
//                 width: overlayWidth,
//                 height: overlayHeight,

//                 alignItems: "center",
//                 justifyContent: "center",

//                 overflow: "hidden",
//               }}
//             >
//               <Image
//                 source={{
//                   uri: imageSrc,
//                 }}
//                 style={{
//                   width: overlayWidth,
//                   height: overlayHeight,
//                 }}
//                 resizeMode="contain"
//               />

//               {n.overlayText ? (
//                 <View
//                   style={{
//                     position: "absolute",

//                     left: 0,
//                     right: 0,
//                     bottom: 0,

//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <Text
//                     style={{
//                       color: "#000000",

//                       fontSize: 12,

//                       fontWeight: "700",
//                     }}
//                   >
//                     {n.overlayText}
//                   </Text>
//                 </View>
//               ) : null}
//             </View>
//           );
//         }

//         /*
//          * Normal images keep your existing EpImage.
//          */
//         return (
//           <EpImage
//             key={`${n.src}-${imageVersion}`}
//             src={imageSrc}
//             overlayText={
//               n.overlayText
//             }
//           />
//         );
//       }

//       /* =====================================================
//          IFRAME
//       ===================================================== */

//   case "iframe":
//   return (
//     <View
//       key={key}
//       pointerEvents="none"
//       style={{
//         flex: 1,
//         width: "100%",
//         minWidth: 0,
//         minHeight: 0,
//         overflow: "hidden",
//         backgroundColor: "#ffffff",
//       }}
//     >
//       {n.src ? (
//         <WebView
//           source={{
//             uri: n.src,
//           }}
//           pointerEvents="none"
//           scrollEnabled={false}
//           nestedScrollEnabled={false}
//           bounces={false}
//           javaScriptEnabled={true}
//           domStorageEnabled={true}
//           originWhitelist={["*"]}
//           showsVerticalScrollIndicator={false}
//           showsHorizontalScrollIndicator={false}
//           style={{
//             flex: 1,
//             width: "100%",
//             height: "100%",
//             backgroundColor: "transparent",
//           }}
//           onError={(event) => {
//             console.log(
//               "WEBVIEW ERROR:",
//               event.nativeEvent
//             );
//           }}
//         />
//       ) : null}
//     </View>
//   );
   
//   case "row":
//   return (
//     <View
//       key={key}
//       style={{
//         width: "100%",
//         flex: 1,
//         minWidth: 0,
//         minHeight: 0,

//         flexDirection: "row",
//         alignItems: "stretch",

//         overflow: "hidden",
//       }}
//     >
//       {(n.children ?? []).map(
//         (child: EpNode, index: number) =>
//           renderEpNode(
//             child,
//             `${key}-row-${index}`,
//             isOverlay
//           )
//       )}
//     </View>
//   );

//       case "segment":
//         return (
//           <View
//             key={key}
//             style={{
//               width: deviceWidth,
//               height: deviceHeight,

//               position: "relative",

//               backgroundColor:
//                 "#ffffff",

//               overflow: "hidden",
//             }}
//           >
//             {(n.children ?? []).map(
//               (
//                 child: EpNode,
//                 index: number
//               ) =>
//                 renderEpNode(
//                   child,
//                   `${key}-segment-${index}`,
//                   isOverlay
//                 )
//             )}
//           </View>
//         );

//       case "segment-view":
//         return (
//           <View
//             key={key}
//             style={{
//               position: "absolute",

//               left:
//                 n.regionBox?.offsetX ??
//                 0,
//               top:
//                 n.regionBox?.offsetY ??
//                 0,
//               width:
//                 n.regionBox?.width ??
//                 deviceWidth,

//               height:
//                 n.regionBox?.height ??
//                 deviceHeight,

//               overflow: "hidden",
//             }}
//           >
//             {(n.children ?? []).map(
//               (
//                 child: EpNode,
//                 index: number
//               ) =>
//                 renderEpNode(
//                   child,
//                   `${key}-view-${index}`,
//                   isOverlay
//                 )
//             )}
//           </View>
//         );

//       case "footer":
//         return (
//           <View
//             key={key}
//             style={{
//               width: "100%",
//               minHeight: 20,
//               justifyContent: "center",
//               alignItems: "center",
//               backgroundColor:
//                 "#ffffff",
//             }}
//           >
//             {(n.children ?? []).map(
//               (
//                 child: EpNode,
//                 index: number
//               ) =>
//                 renderEpNode(
//                   child,
//                   `${key}-footer-${index}`,
//                   isOverlay
//                 )
//             )}
//           </View>
//         );

//       default:
//         console.warn(
//           "UNKNOWN EP NODE:",
//           n.type,
//           n
//         );
//         return null;
//     }
//   },
//   [
//     deviceWidth,
//     deviceHeight,
//     currentDeviceProfile,
//     imageVersion,
//   ]
// );                                                                                                                                                                                                                                                                                                                                                         
//   const previewWidth =
//     Math.max(
//       0,
//       screenWidth - 24
//     );

//   const previewHeight =
//     Math.max(
//       260,
//       screenHeight * 0.45
//     );

//   const scale =
//     Math.min(
//       previewWidth /
//         deviceWidth,
//       previewHeight /
//         deviceHeight,
//       1
//     );

//   const scaledWidth =
//     deviceWidth *
//     scale;

//   const scaledHeight =
//     deviceHeight *
//     scale;

//   /* =======================================================
//      CLEANUP CONFIG TIMERS
//   ======================================================= */

//   useEffect(() => {
//     return () => {
//       Object.values(
//         configTimers.current
//       ).forEach(
//         (timer) => {
//           clearTimeout(
//             timer
//           );
//         }
//       );
//     };
//   }, []);

//   /* =======================================================
//      LOADING
//   ======================================================= */

//   if (
//     loading ||
//     !plugin
//   ) {
//     return (
//       <View
//         style={
//           styles.loadingContainer
//         }
//       >
//         <ActivityIndicator
//           size="large"
//         />

//         <Text
//           style={
//             styles.loadingText
//           }
//         >
//           Loading PluginIDE...
//         </Text>
//       </View>
//     );
//   }

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <View
//       style={
//         styles.container
//       }
//     >
//       {/* =================================================
//           HEADER
//       ================================================= */}

//       <View
//         style={
//           styles.header
//         }
//       >
//         <View
//           style={{
//             flex: 1,
//             paddingRight: 8,
//           }}
//         >
//           <Text
//             numberOfLines={1}
//             style={
//               styles.pluginName
//             }
//           >
//             {
//               plugin.pluginName
//             }
//           </Text>

//           <Text
//             numberOfLines={1}
//             style={
//               styles.pluginDescription
//             }
//           >
//             {
//               plugin.pluginDescription ??
//               "No description"
//             }
//           </Text>
//         </View>

//         <Pressable
//           disabled={
//             !hasChanges ||
//             isExecuting
//           }
//           onPress={
//             executePlayground
//           }
//           style={[
//             styles.executeButton,

//             (!hasChanges ||
//               isExecuting) &&
//               styles.disabledButton,
//           ]}
//         >
//           {isExecuting ? (
//             <ActivityIndicator
//               size="small"
//             />
//           ) : (
//             <Text
//               style={
//                 styles.executeText
//               }
//             >
//               Execute
//             </Text>
//           )}
//         </Pressable>
//       </View>

//       {/* =================================================
//           DEVICE SELECTOR
//       ================================================= */}

//       <View
//         style={
//           styles.deviceToolbar
//         }
//       >
//         <Pressable
//           onPress={() =>
//             setShowDeviceSelector(
//               (value) =>
//                 !value
//             )
//           }
//           style={
//             styles.deviceButton
//           }
//         >
//           <Text
//             style={
//               styles.deviceButtonText
//             }
//           >
//             {
//               device?.modelNo ??
//               "Device"
//             }
//           </Text>

//           <Text
//             style={
//               styles.deviceResolution
//             }
//           >
//             {device
//               ? `${device.displayResolutionWidth}×${device.displayResolutionHeight}`
//               : ""}
//           </Text>
//         </Pressable>

//         {showDeviceSelector ? (
//           <View
//             style={
//               styles.deviceDropdown
//             }
//           >
//             {devices.map(
//               (item) => {
//                 const selected =
//                   item.displayId ===
//                   device?.displayId;

//                 return (
//                   <Pressable
//                     key={
//                       item.displayId
//                     }
//                     onPress={() => {
//                       setDevice(
//                         item
//                       );

//                       setShowDeviceSelector(
//                         false
//                       );
//                     }}
//                     style={[
//                       styles.deviceOption,

//                       selected &&
//                         styles.selectedDeviceOption,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         styles.deviceOptionTitle,

//                         selected &&
//                           styles.selectedDeviceText,
//                       ]}
//                     >
//                       {
//                         item.modelNo
//                       }
//                     </Text>

//                     <Text
//                       style={
//                         styles.deviceOptionResolution
//                       }
//                     >
//                       {
//                         item.displayResolutionWidth
//                       }
//                       ×
//                       {
//                         item.displayResolutionHeight
//                       }
//                     </Text>
//                   </Pressable>
//                 );
//               }
//             )}
//           </View>
//         ) : null}
//       </View>

//       {/* =================================================
//           MAIN
//       ================================================= */}

//       <ScrollView
//         style={
//           styles.mainScroll
//         }
//         contentContainerStyle={
//           styles.mainContent
//         }
//         showsVerticalScrollIndicator={
//           false
//         }
//       >
//         {/* ===============================================
//             PREVIEW
//         =============================================== */}

//         <View
//           style={
//             styles.previewSection
//           }
//         >
//           <Text
//             style={
//               styles.sectionTitle
//             }
//           >
//             Preview
//           </Text>

//           <View
//             style={[
//               styles.previewOuter,
//               {
//                 height:
//                   scaledHeight +
//                   32,
//               },
//             ]}
//           >
//             <View
//               style={{
//                 width:
//                   scaledWidth,

//                 height:
//                   scaledHeight,

//                 backgroundColor:
//                   "#ffffff",

//                 overflow:
//                   "hidden",
//               }}
//             >
//               <View
//                 style={{
//                   width:
//                     deviceWidth,

//                   height:
//                     deviceHeight,

//                   overflow:
//                     "hidden",

//                   transform: [
//                     {
//                       scale,
//                     },
//                   ],

//                   transformOrigin:
//                     "top left",
//                 }}
//               >
//                 {compileError ? (
//                   <View
//                     style={
//                       styles.compileError
//                     }
//                   >
//                     <Text
//                       style={
//                         styles.compileErrorText
//                       }
//                     >
//                       {
//                         compileError
//                       }
//                     </Text>
//                   </View>
//                 ) : epuiTree ? (
//                   renderEpNode(
//                     epuiTree,
//                     "root"
//                   )
//                 ) : (
//                   <View
//                     style={
//                       styles.emptyPreview
//                     }
//                   >
//                     <Text
//                       style={
//                         styles.emptyPreviewText
//                       }
//                     >
//                       Rendering
//                       preview...
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* ===============================================
//             SETTINGS
//         =============================================== */}

//         <View
//           style={
//             styles.settingsSection
//           }
//         >
//           <Text
//             style={
//               styles.sectionTitle
//             }
//           >
//             Settings
//           </Text>

//           {playgroundInstances.length ===
//           0 ? (
//             <View
//               style={
//                 styles.emptySettings
//               }
//             >
//               <Text
//                 style={
//                   styles.emptySettingsText
//                 }
//               >
//                 No connectors
//               </Text>
//             </View>
//           ) : (
//             playgroundInstances.map(
//               (instance) => (
//                 <ConnectorCard
//                   key={
//                     instance.id
//                   }
//                   sessionId={
//                     playgroundSessionId ??
//                     ""
//                   }
//                   mode="playground"
//                   instance={
//                     instance
//                   }
//                   connectors={
//                     connectors
//                   }
//                   openInstanceId={
//                     openInstanceId
//                   }
//                   setOpenInstanceId={
//                     setOpenInstanceId
//                   }
//                   onStartOAuth={
//                     startOAuth
//                   }
//                   onConfigChange={
//                     updatePlaygroundInstanceConfig
//                   }
//                   onDisconnect={(
//                     id
//                   ) => {
//                     setPlaygroundInstances(
//                       (
//                         previous
//                       ) =>
//                         previous.map(
//                           (
//                             item
//                           ) =>
//                             item.id ===
//                             id
//                               ? {
//                                   ...item,
//                                   oauthTokenId:
//                                     null,
//                                 }
//                               : item
//                         )
//                     );

//                     setHasChanges(
//                       true
//                     );
//                   }}
//                   cropAspect={
//                     device
//                       ? device.displayResolutionWidth /
//                         device.displayResolutionHeight
//                       : 1
//                   }
//                 />
//               )
//             )
//           )}
//         </View>

//         {/* ===============================================
//             PLAYLIST
//         =============================================== */}

//         {playlistItemId ? (
//           <Pressable
//             disabled={
//               isUpdatingPlaylist
//             }
//             onPress={
//               handleUpdatePlaylist
//             }
//             style={[
//               styles.playlistButton,

//               isUpdatingPlaylist &&
//                 styles.disabledButton,
//             ]}
//           >
//             {isUpdatingPlaylist ? (
//               <ActivityIndicator
//                 color="#ffffff"
//               />
//             ) : (
//               <Text
//                 style={
//                   styles.playlistButtonText
//                 }
//               >
//                 Update to Playlist
//               </Text>
//             )}
//           </Pressable>
//         ) : null}

//         {/* ===============================================
//             DATA CONTEXT
//         =============================================== */}

//         <Pressable
//           onPress={() =>
//             setDataContextExpanded(
//               (value) =>
//                 !value
//             )
//           }
//           style={
//             styles.dataContextHeader
//           }
//         >
//           <Text
//             style={
//               styles.dataContextTitle
//             }
//           >
//             Data Context
//           </Text>

//           <Text
//             style={
//               styles.expandIcon
//             }
//           >
//             {dataContextExpanded
//               ? "▲"
//               : "▼"}
//           </Text>
//         </Pressable>

//         {dataContextExpanded ? (
//           <ScrollView
//             horizontal
//             style={
//               styles.dataContextBox
//             }
//           >
//             <Text
//               style={
//                 styles.dataContextText
//               }
//             >
//               {JSON.stringify(
//                 dataContext,
//                 null,
//                 2
//               )}
//             </Text>
//           </ScrollView>
//         ) : null}
//       </ScrollView>
//     </View>
//   );
// }

// /* =========================================================
//    STYLES
// ========================================================= */

// const styles =
//   StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor:
//         "#f5f5f5",
//     },

//     loadingContainer: {
//       flex: 1,
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       backgroundColor:
//         "#f5f5f5",
//     },

//     loadingText: {
//       marginTop: 12,
//       color:
//         "#666666",
//       fontSize: 14,
//     },

//     header: {
//       minHeight: 64,
//       paddingHorizontal: 14,
//       paddingVertical: 10,
//       backgroundColor:
//         "#ffffff",
//       borderBottomWidth: 1,
//       borderBottomColor:
//         "#e5e5e5",
//       flexDirection:
//         "row",
//       alignItems:
//         "center",
//     },

//     pluginName: {
//       fontSize: 15,
//       fontWeight:
//         "700",
//       color:
//         "#111111",
//     },

//     pluginDescription: {
//       marginTop: 2,
//       fontSize: 11,
//       color:
//         "#777777",
//     },

//     executeButton: {
//       minWidth: 76,
//       height: 36,
//       paddingHorizontal: 12,
//       borderRadius: 8,
//       borderWidth: 1,
//       borderColor:
//         "#cccccc",
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       backgroundColor:
//         "#ffffff",
//     },

//     executeText: {
//       fontSize: 12,
//       fontWeight:
//         "600",
//       color:
//         "#111111",
//     },

//     disabledButton: {
//       opacity: 0.45,
//     },

//     deviceToolbar: {
//       minHeight: 52,
//       paddingHorizontal: 14,
//       paddingVertical: 8,
//       backgroundColor:
//         "#ffffff",
//       borderBottomWidth: 1,
//       borderBottomColor:
//         "#e5e5e5",
//       position:
//         "relative",
//       zIndex: 100,
//     },

//     deviceButton: {
//       alignSelf:
//         "flex-start",
//       minHeight: 34,
//       paddingHorizontal: 12,
//       borderWidth: 1,
//       borderColor:
//         "#dddddd",
//       borderRadius: 8,
//       flexDirection:
//         "row",
//       alignItems:
//         "center",
//     },

//     deviceButtonText: {
//       fontSize: 12,
//       fontWeight:
//         "600",
//       color:
//         "#222222",
//     },

//     deviceResolution: {
//       marginLeft: 8,
//       fontSize: 10,
//       color:
//         "#888888",
//     },

//     deviceDropdown: {
//       position:
//         "absolute",
//       left: 14,
//       top: 46,
//       width: 220,
//       backgroundColor:
//         "#ffffff",
//       borderRadius: 10,
//       borderWidth: 1,
//       borderColor:
//         "#dddddd",
//       elevation: 8,
//       shadowColor:
//         "#000000",
//       shadowOpacity:
//         0.15,
//       shadowRadius: 8,
//       shadowOffset: {
//         width: 0,
//         height: 4,
//       },
//       zIndex: 999,
//     },

//     deviceOption: {
//       paddingHorizontal: 14,
//       paddingVertical: 10,
//       borderBottomWidth: 1,
//       borderBottomColor:
//         "#eeeeee",
//     },

//     selectedDeviceOption: {
//       backgroundColor:
//         "#eef5ff",
//     },

//     deviceOptionTitle: {
//       fontSize: 12,
//       fontWeight:
//         "600",
//       color:
//         "#333333",
//     },

//     selectedDeviceText: {
//       color:
//         "#2563eb",
//     },

//     deviceOptionResolution: {
//       marginTop: 2,
//       fontSize: 10,
//       color:
//         "#888888",
//     },

//     mainScroll: {
//       flex: 1,
//     },

//     mainContent: {
//       paddingBottom: 30,
//     },

//     previewSection: {
//       padding: 12,
//     },

//     sectionTitle: {
//       marginBottom: 8,
//       fontSize: 13,
//       fontWeight:
//         "700",
//       color:
//         "#222222",
//     },

//     previewOuter: {
//       width: "100%",
//       backgroundColor:
//         "#e9e9e9",
//       borderRadius: 12,
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       overflow:
//         "hidden",
//       borderWidth: 1,
//       borderColor:
//         "#dddddd",
//     },

//     emptyPreview: {
//       flex: 1,
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       backgroundColor:
//         "#ffffff",
//     },

//     emptyPreviewText: {
//       color:
//         "#888888",
//       fontSize: 12,
//     },

//     compileError: {
//       flex: 1,
//       padding: 20,
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       backgroundColor:
//         "#fff5f5",
//     },

//     compileErrorText: {
//       color:
//         "#dc2626",
//       fontSize: 12,
//       textAlign:
//         "center",
//     },

//     settingsSection: {
//       paddingHorizontal: 12,
//       paddingBottom: 12,
//     },

//     emptySettings: {
//       padding: 20,
//       borderRadius: 10,
//       backgroundColor:
//         "#ffffff",
//       alignItems:
//         "center",
//     },

//     emptySettingsText: {
//       color:
//         "#888888",
//       fontSize: 12,
//     },

//     playlistButton: {
//       marginHorizontal: 12,
//       marginBottom: 12,
//       height: 42,
//       borderRadius: 9,
//       alignItems:
//         "center",
//       justifyContent:
//         "center",
//       backgroundColor:
//         "#2563eb",
//     },

//     playlistButtonText: {
//       color:
//         "#ffffff",
//       fontSize: 13,
//       fontWeight:
//         "600",
//     },

//     dataContextHeader: {
//       minHeight: 46,
//       paddingHorizontal: 14,
//       backgroundColor:
//         "#ffffff",
//       borderTopWidth: 1,
//       borderBottomWidth: 1,
//       borderColor:
//         "#e5e5e5",
//       flexDirection:
//         "row",
//       alignItems:
//         "center",
//     },

//     dataContextTitle: {
//       fontSize: 13,
//       fontWeight:
//         "700",
//       color:
//         "#222222",
//     },

//     expandIcon: {
//       marginLeft:
//         "auto",
//       color:
//         "#777777",
//       fontSize: 11,
//     },

//     dataContextBox: {
//       maxHeight: 300,
//       backgroundColor:
//         "#111111",
//       padding: 12,
//     },

//     dataContextText: {
//       color:
//         "#eeeeee",
//       fontFamily:
//         "monospace",
//       fontSize: 10,
//     },
//   });



import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { WebView } from "react-native-webview";
import { Liquid } from "liquidjs";

import { EpImage } from "../ep-ui";

import type { EpNode } from "../../packages/ltag";

import { compileLTHtml } from "../../packages/ltag/compile/compiler";

import { resolveLayout } from "../../packages/ltag/resolve/resolveLayout";

import {
  DEFAULT_DEVICE_PROFILE,
  LTDP75BW_800x480,
  E6_73IN_800x480,
  E6_13IN_1200x1600,
} from "../../packages/ltag/device";

import type {
  DeviceProfile,
} from "../../packages/ltag/device";

import api from "../lib/api";

import { ConnectorCard } from "../modal/ConnectorCard";

/* =========================================================
   TYPES
========================================================= */

type PlaygroundSessionResponse = {
  session: {
    id: string;
  };
};

type PlaygroundInstance = {
  id: string;
  instanceKey: string;
  connectorType: string;
  config: Record<string, any>;

  oauthTokenId?: string | null;

  scope?: "user" | "author";

  configScope?: "user" | "author";

  pluginConnectorInstanceId?: string;

  updatedAt?: string;
};

type Plugin = {
  pluginId: string;
  pluginName: string;
  pluginCode: string;
  pluginDescription?: string;
};

type Connector = {
  id: number;
  type: string;

  config?: Record<string, any>;

  schema?: {
    sampleResponse?: Record<string, any>;

    [key: string]: any;
  };
};

type DisplayInfo = {
  displayId: string;
  modelNo: string;
  displayResolutionWidth: number;
  displayResolutionHeight: number;
};

type PlaylistPlaygroundResponse = {
  playgroundSessionId: string;

  playgroundConnectorConfigs: PlaygroundInstance[];

  oauthTokens: any;
};

type Props = {
  route: {
    params: {
      pluginId: string;
      playlistItemId?: string;
    };
  };
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeInstanceKey = (
  key: string = ""
) =>
  key
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^[^a-zA-Z]+/, "");

function appendCacheVersion(
  src: string,
  version: number
) {
  if (!src || !version) {
    return src;
  }

  return `${src}${
    src.includes("?") ? "&" : "?"
  }v=${version}`;
}

/* =========================================================
   EXECUTION DATA NORMALIZER
========================================================= */

function normalizeExecutionContext(
  raw: any
): Record<string, any> {
  if (!raw) {
    return {};
  }

  /* -------------------------------------------------------
     Already an object
  ------------------------------------------------------- */

  if (
    !Array.isArray(raw) &&
    typeof raw === "object"
  ) {
    if (
      raw.data &&
      typeof raw.data === "object" &&
      !Array.isArray(raw.data)
    ) {
      return raw.data;
    }

    if (
      raw.result &&
      typeof raw.result === "object" &&
      !Array.isArray(raw.result)
    ) {
      if (
        raw.result.data &&
        typeof raw.result.data === "object" &&
        !Array.isArray(raw.result.data)
      ) {
        return raw.result.data;
      }

      return raw.result;
    }

    return raw;
  }

  /* -------------------------------------------------------
     Array response
  ------------------------------------------------------- */

  if (Array.isArray(raw)) {
    const context: Record<string, any> = {};

    raw.forEach(
      (
        item: any,
        index: number
      ) => {
        if (!item) {
          return;
        }

        const key =
          item.instanceKey ??
          item.connectorKey ??
          item.key ??
          item.connectorType;

        let value =
          item.result ??
          item.data ??
          item.response ??
          item.executionResult;

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          if (
            value.data &&
            typeof value.data === "object"
          ) {
            value = value.data;
          } else if (
            value.result &&
            typeof value.result === "object"
          ) {
            value = value.result;
          }
        }

        if (key) {
          context[
            normalizeInstanceKey(
              String(key)
            )
          ] = value ?? {};

          return;
        }

        if (
          typeof item === "object" &&
          !Array.isArray(item)
        ) {
          const itemKeys =
            Object.keys(item);

          const looksLikeContext =
            itemKeys.length > 0 &&
            itemKeys.some(
              (itemKey) =>
                item[itemKey] &&
                typeof item[itemKey] ===
                  "object"
            );

          if (looksLikeContext) {
            Object.assign(
              context,
              item
            );

            return;
          }
        }

        console.log(
          `⚠️ UNKNOWN EXECUTION ITEM ${index}:`,
          item
        );
      }
    );

    return context;
  }

  return {};
}

/* =========================================================
   SCREEN
========================================================= */

export default function PluginPlaygroundScreen({
  route,
}: Props) {
  const pluginId =
    route?.params?.pluginId;

  const playlistItemId =
    route?.params?.playlistItemId;

  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const engine = useMemo(
    () => new Liquid(),
    []
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [plugin, setPlugin] =
    useState<Plugin | null>(null);

  const [connectors, setConnectors] =
    useState<Connector[]>([]);

  const [
    playgroundInstances,
    setPlaygroundInstances,
  ] = useState<
    PlaygroundInstance[]
  >([]);

  const [
    playgroundSessionId,
    setPlaygroundSessionId,
  ] = useState<string | null>(
    null
  );

  const [
    playgroundExecutionData,
    setPlaygroundExecutionData,
  ] = useState<any>(null);

  const [devices, setDevices] =
    useState<DisplayInfo[]>([]);

  const [device, setDevice] =
    useState<DisplayInfo | null>(
      null
    );

  const [
    currentDeviceProfile,
    setCurrentDeviceProfile,
  ] = useState<DeviceProfile>(
    DEFAULT_DEVICE_PROFILE
  );

  const [epuiTree, setEpuiTree] =
    useState<EpNode | null>(null);

  const [compileError, setCompileError] =
    useState<string | null>(null);

  const [
    openInstanceId,
    setOpenInstanceId,
  ] = useState<string | null>(null);

  const [hasChanges, setHasChanges] =
    useState(false);

  const [isExecuting, setIsExecuting] =
    useState(false);

  const [
    isUpdatingPlaylist,
    setIsUpdatingPlaylist,
  ] = useState(false);

  const [
    showDeviceSelector,
    setShowDeviceSelector,
  ] = useState(false);

  const [
    dataContextExpanded,
    setDataContextExpanded,
  ] = useState(false);

  const [
    imageVersion,
    setImageVersion,
  ] = useState(0);

  // Measured preview viewport. This keeps mobile scaling in sync with the
  // actual space available to the preview, instead of guessing a height.
  const [previewViewport, setPreviewViewport] = useState({
    width: 0,
    height: 0,
  });

  const configTimers =
    useRef<
      Record<
        string,
        ReturnType<typeof setTimeout>
      >
    >({});

  const compileRequestRef =
    useRef(0);

  /* =======================================================
     DEVICE SIZE
     
     IMPORTANT:
     DeviceProfile already has:
       canvasWidth
       canvasHeight
  ======================================================= */

  const deviceWidth =
    currentDeviceProfile.canvasWidth;

  const deviceHeight =
    currentDeviceProfile.canvasHeight;

  /* =======================================================
     DEVICE PROFILE
  ======================================================= */

  const getDeviceProfile =
    useCallback(
      (
        display: DisplayInfo
      ): DeviceProfile => {
        const model =
          display.modelNo
            ?.toUpperCase()
            ?.replace(/\s/g, "");

        if (
          model.includes("LTDP75BW")
        ) {
          return LTDP75BW_800x480;
        }

        if (
          model.includes("E6_73") ||
          model.includes("E673")
        ) {
          return E6_73IN_800x480;
        }

        if (
          model.includes("E6_13") ||
          model.includes("E613")
        ) {
          return E6_13IN_1200x1600;
        }

        if (
          display.displayResolutionWidth ===
            1200 &&
          display.displayResolutionHeight ===
            1600
        ) {
          return E6_13IN_1200x1600;
        }

        return DEFAULT_DEVICE_PROFILE;
      },
      []
    );

  useEffect(() => {
    if (!device) {
      return;
    }

    // Re-measure after changing the physical display/aspect ratio.
    setPreviewViewport({ width: 0, height: 0 });

    const profile =
      getDeviceProfile(device);

    console.log(
      "========== DEVICE =========="
    );

    console.log(
      "MODEL:",
      device.modelNo
    );

    console.log(
      "RESOLUTION:",
      device.displayResolutionWidth,
      "x",
      device.displayResolutionHeight
    );

    console.log(
      "CANVAS:",
      profile.canvasWidth,
      "x",
      profile.canvasHeight
    );

    setCurrentDeviceProfile(
      profile
    );

    setImageVersion(
      (value) => value + 1
    );
  }, [
    device,
    getDeviceProfile,
  ]);

  /* =======================================================
     LOAD DEVICES
  ======================================================= */

  const loadDevices =
    useCallback(async () => {
      try {
        const response =
          await api.get<DisplayInfo[]>(
            "/device/display-infos"
          );

        const list =
          response.data ?? [];

        console.log(
          "========== DEVICES =========="
        );

        console.log(
          JSON.stringify(
            list,
            null,
            2
          )
        );

        setDevices(list);

        if (list.length > 0) {
          setDevice(list[0]);
        }
      } catch (error: any) {
        console.error(
          "DEVICE LOAD ERROR:",
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Error",
          "Failed to load devices."
        );
      }
    }, []);

  /* =======================================================
     LOAD PLUGIN
  ======================================================= */

  const loadPlugin =
    useCallback(async () => {
      const response =
        await api.get<Plugin>(
          `/plugin/${pluginId}`
        );

      console.log(
        "========== PLUGIN =========="
      );

      console.log(
        "PLUGIN ID:",
        response.data?.pluginId
      );

      console.log(
        "PLUGIN NAME:",
        response.data?.pluginName
      );

      console.log(
        "PLUGIN CODE:",
        response.data?.pluginCode
      );

      setPlugin(
        response.data
      );
    }, [pluginId]);

  /* =======================================================
     LOAD CONNECTORS
  ======================================================= */

  const loadConnectors =
    useCallback(async () => {
      const response =
        await api.get<Connector[]>(
          "/test/data-connectors/connectors"
        );

      const list =
        response.data ?? [];

      console.log(
        "========== CONNECTORS =========="
      );

      console.log(
        JSON.stringify(
          list,
          null,
          2
        )
      );

      setConnectors(list);
    }, []);

  /* =======================================================
     CREATE PLAYGROUND SESSION
  ======================================================= */

  const createPlaygroundSession =
    useCallback(async () => {
      const response =
        await api.post<PlaygroundSessionResponse>(
          `/playground/${pluginId}/create-session`
        );

      console.log(
        "========== CREATED SESSION =========="
      );

      console.log(
        response.data
      );

      return response.data.session;
    }, [pluginId]);

  /* =======================================================
     REFRESH PLAYGROUND SESSION
  ======================================================= */

  const refreshPlaygroundSession =
    useCallback(async () => {
      const response =
        await api.get<{
          id: string;
        }>(
          `/playground/${pluginId}/refresh`
        );

      console.log(
        "========== REFRESHED SESSION =========="
      );

      console.log(
        response.data
      );

      return response.data;
    }, [pluginId]);

  /* =======================================================
     LOAD PLAYGROUND CONNECTORS
  ======================================================= */

  const loadPlaygroundConnectors =
    useCallback(
      async (
        sessionId: string
      ) => {
        const response =
          await api.get<
            PlaygroundInstance[]
          >(
            `/playground/${sessionId}/connectors`
          );

        const list =
          response.data ?? [];

        console.log(
          "========== PLAYGROUND CONNECTORS =========="
        );

        console.log(
          JSON.stringify(
            list,
            null,
            2
          )
        );

        setPlaygroundInstances(
          list
        );

        return list;
      },
      []
    );

  /* =======================================================
     LOAD EXECUTION
  ======================================================= */

  const playgroundExecution =
    useCallback(
      async (
        sessionId: string
      ) => {
        const response =
          await api.get<any>(
            `/execution/playground/${sessionId}`
          );

        const executionData =
          response.data;

        console.log(
          "========== RAW EXECUTION RESPONSE =========="
        );

        console.log(
          JSON.stringify(
            executionData,
            null,
            2
          )
        );

        setPlaygroundExecutionData(
          executionData
        );

        return executionData;
      },
      []
    );

  /* =======================================================
     LOAD PLAYLIST PLAYGROUND
  ======================================================= */

  const loadPlaylistPlayground =
    useCallback(
      async (
        itemId: string
      ) => {
        const response =
          await api.get<PlaylistPlaygroundResponse>(
            `/playlist/${itemId}/get-playground`
          );

        const data =
          response.data;

        console.log(
          "========== PLAYLIST PLAYGROUND =========="
        );

        console.log(
          JSON.stringify(
            data,
            null,
            2
          )
        );

        setPlaygroundSessionId(
          data.playgroundSessionId
        );

        setPlaygroundInstances(
          data.playgroundConnectorConfigs ??
            []
        );

        /*
         * Do not use oauthTokens as
         * Liquid data context.
         *
         * Fetch the actual execution
         * response below.
         */
        setPlaygroundExecutionData(
          null
        );

        await playgroundExecution(
          data.playgroundSessionId
        );

        return data;
      },
      [playgroundExecution]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const load =
      async () => {
        try {
          setLoading(true);

          await Promise.all([
            loadPlugin(),
            loadConnectors(),
            loadDevices(),
          ]);

          if (cancelled) {
            return;
          }

          if (playlistItemId) {
            await loadPlaylistPlayground(
              playlistItemId
            );
          } else {
            const session =
              await createPlaygroundSession();

            if (cancelled) {
              return;
            }

            setPlaygroundSessionId(
              session.id
            );

            await loadPlaygroundConnectors(
              session.id
            );

            await playgroundExecution(
              session.id
            );
          }
        } catch (error: any) {
          console.error(
            "PLUGIN PLAYGROUND LOAD ERROR:",
            error?.response?.data ??
              error
          );

          Alert.alert(
            "Error",
            error?.response?.data
              ?.message ??
              "Failed to load PluginIDE."
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    if (pluginId) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [
    pluginId,
    playlistItemId,
    loadPlugin,
    loadConnectors,
    loadDevices,
    createPlaygroundSession,
    loadPlaygroundConnectors,
    playgroundExecution,
    loadPlaylistPlayground,
  ]);

  /* =======================================================
     LIQUID DATA CONTEXT
  ======================================================= */

  const dataContext =
    useMemo(
      () =>
        normalizeExecutionContext(
          playgroundExecutionData
        ),
      [playgroundExecutionData]
    );

  /* =======================================================
     DEBUG DATA
  ======================================================= */

  useEffect(() => {
    console.log(
      "========== FINAL LIQUID DATA CONTEXT =========="
    );

    console.log(
      JSON.stringify(
        dataContext,
        null,
        2
      )
    );

    console.log(
      "LIQUID KEYS:",
      Object.keys(
        dataContext
      )
    );

    console.log(
      "RSS:",
      dataContext?.rss
    );

    console.log(
      "RSS ITEMS:",
      dataContext?.rss
        ?.items
    );
  }, [dataContext]);

  /* =======================================================
     COMPILE
  ======================================================= */

  useEffect(() => {
    if (!plugin) {
      return;
    }

    if (!plugin.pluginCode) {
      setEpuiTree(null);
      return;
    }

    const requestId =
      ++compileRequestRef.current;

    const compile =
      async () => {
        try {
          setCompileError(null);

          console.log(
            "========================================"
          );

          console.log(
            "🔥 START MOBILE LIQUID COMPILE"
          );

          console.log(
            "========================================"
          );

          console.log(
            "LIQUID CONTEXT:"
          );

          console.log(
            JSON.stringify(
              dataContext,
              null,
              2
            )
          );

          /* -------------------------------------------
             Liquid
          ------------------------------------------- */

          const html =
            await engine.parseAndRender(
              plugin.pluginCode,
              dataContext
            );

          console.log(
            "========== MOBILE LIQUID HTML =========="
          );

          console.log(html);

          if (
            requestId !==
            compileRequestRef.current
          ) {
            return;
          }

          /* -------------------------------------------
             Compile HTML -> EP Tree
          ------------------------------------------- */

          const rawTree =
            compileLTHtml(
              html
            );

          console.log(
            "========== MOBILE RAW EP TREE =========="
          );

          console.log(
            JSON.stringify(
              rawTree,
              null,
              2
            )
          );

          if (
            requestId !==
            compileRequestRef.current
          ) {
            return;
          }

          /* -------------------------------------------
             Resolve Layout
          ------------------------------------------- */

          const resolvedTree =
            resolveLayout(
              rawTree,
              currentDeviceProfile
            );

          console.log(
            "========== MOBILE RESOLVED EP TREE =========="
          );

          console.log(
            JSON.stringify(
              resolvedTree,
              null,
              2
            )
          );

          if (
            requestId !==
            compileRequestRef.current
          ) {
            return;
          }

          setEpuiTree(
            resolvedTree
          );

          console.log(
            "========== COMPILE COMPLETE =========="
          );
        } catch (error: any) {
          console.error(
            "EP COMPILE ERROR:",
            error
          );

          setCompileError(
            error?.message ??
              "Failed to compile plugin."
          );

          setEpuiTree(null);
        }
      };

    compile();
  }, [
    plugin,
    dataContext,
    engine,
    currentDeviceProfile,
  ]);

  /* =======================================================
     EXECUTE
  ======================================================= */

  /*
   * Web-equivalent refresh/execution path:
   * refresh session -> fetch latest execution -> reload connector instances
   * -> invalidate images -> clear dirty state.
   */
  const executePlayground =
    useCallback(
      async () => {
        if (
          !playgroundSessionId
        ) {
          return;
        }

        try {
          setIsExecuting(true);

          console.log(
            "========== EXECUTE PLAYGROUND =========="
          );

          const session =
            await refreshPlaygroundSession();

          setPlaygroundSessionId(
            session.id
          );

          await playgroundExecution(
            session.id
          );

          await loadPlaygroundConnectors(
            session.id
          );

          setHasChanges(false);

          setImageVersion(
            (value) =>
              value + 1
          );
        } catch (error: any) {
          console.error(
            "EXECUTION ERROR:",
            error?.response?.data ??
              error
          );

          Alert.alert(
            "Execution failed",
            error?.response?.data
              ?.message ??
              "Failed to execute playground."
          );
        } finally {
          setIsExecuting(false);
        }
      },
      [
        playgroundSessionId,
        refreshPlaygroundSession,
        playgroundExecution,
        loadPlaygroundConnectors,
      ]
    );

  /* =======================================================
     CONFIG UPDATE
  ======================================================= */

  const updatePlaygroundInstanceConfig =
    useCallback(
      (
        instanceId: string,
        config: Record<string, any>
      ) => {
        setPlaygroundInstances(
          (previous) =>
            previous.map(
              (instance) =>
                instance.id ===
                instanceId
                  ? {
                      ...instance,
                      config,
                    }
                  : instance
            )
        );

        setHasChanges(true);

        const oldTimer =
          configTimers.current[
            instanceId
          ];

        if (oldTimer) {
          clearTimeout(
            oldTimer
          );
        }

        configTimers.current[
          instanceId
        ] = setTimeout(
          async () => {
            if (
              !playgroundSessionId
            ) {
              return;
            }

            try {
              await api.patch(
                `/playground/${playgroundSessionId}/connector-instance/${instanceId}`,
                {
                  config,
                }
              );
            } catch (error: any) {
              console.error(
                "CONFIG UPDATE ERROR:",
                error?.response
                  ?.data ??
                  error
              );

              Alert.alert(
                "Error",
                error?.response
                  ?.data
                  ?.message ??
                  "Failed to update connector."
              );
            }
          },
          400
        );
      },
      [playgroundSessionId]
    );

  /* =======================================================
     OAUTH
  ======================================================= */

  const startOAuth =
    useCallback(
      async (
        instanceId: string,
        provider:
          | "google"
          | "notion"
      ) => {
        try {
          const response =
            await api.post<{
              url: string;
            }>(
              `/playground/connector/${instanceId}/oauth/connect`,
              {
                origin:
                  "myapp://oauth",
              }
            );

          if (
            !response.data?.url
          ) {
            throw new Error(
              "OAuth URL was not returned."
            );
          }

          await Linking.openURL(
            response.data.url
          );
        } catch (error: any) {
          console.error(
            "OAUTH ERROR:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "OAuth failed",
            error?.response
              ?.data
              ?.message ??
              `Failed to connect ${provider}.`
          );
        }
      },
      []
    );

  /* =======================================================
     OAUTH RETURN
  ======================================================= */

  useEffect(() => {
    const handleDeepLink =
      async ({
        url,
      }: {
        url: string;
      }) => {
        if (
          !url.startsWith(
            "myapp://oauth"
          )
        ) {
          return;
        }

        try {
          if (
            !playgroundSessionId
          ) {
            return;
          }

          const session =
            await refreshPlaygroundSession();

          setPlaygroundSessionId(
            session.id
          );

          await playgroundExecution(
            session.id
          );

          await loadPlaygroundConnectors(
            session.id
          );

          setHasChanges(true);

          setImageVersion(
            (value) =>
              value + 1
          );
        } catch (error) {
          console.error(
            "OAUTH REFRESH ERROR:",
            error
          );
        }
      };

    const subscription =
      Linking.addEventListener(
        "url",
        handleDeepLink
      );

    Linking.getInitialURL()
      .then(
        (url) => {
          if (url) {
            handleDeepLink({
              url,
            });
          }
        }
      )
      .catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [
    playgroundSessionId,
    refreshPlaygroundSession,
    playgroundExecution,
    loadPlaygroundConnectors,
  ]);

  /* =======================================================
     PLAYLIST UPDATE
  ======================================================= */

  const handleUpdatePlaylist =
    useCallback(
      async () => {
        if (!playlistItemId) {
          Alert.alert(
            "Error",
            "Playlist item not found."
          );

          return;
        }

        try {
          setIsUpdatingPlaylist(
            true
          );

          await api.post(
            `/playlist/item/${playlistItemId}/sync-connectors`
          );

          Alert.alert(
            "Success",
            "Playlist updated successfully."
          );
        } catch (error: any) {
          console.error(
            "PLAYLIST UPDATE ERROR:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Error",
            error?.response
              ?.data
              ?.message ??
              "Failed to update playlist."
          );
        } finally {
          setIsUpdatingPlaylist(
            false
          );
        }
      },
      [playlistItemId]
    );

  /* =======================================================
     RENDER EP NODE
     
     IMPORTANT:
     For the basic EP layout we intentionally use
     native React Native View/Text.
     
     This avoids flex/layout behavior from the
     old EpCanvas/EpColumns/EpBlock wrappers.
  ======================================================= */

/* =========================================================
   RENDER EP NODE
========================================================= */

const renderEpNode = useCallback(
  (
    node: EpNode,
    key?: string | number,
    isOverlay: boolean = false
  ): React.ReactNode => {
    const n = node as any;

    if (!n) {
      return null;
    }

    switch (n.type) {
      /* =====================================================
         CANVAS
      ===================================================== */

      case "canvas":
        return (
          <View
            key={key}
            style={{
              width: deviceWidth,
              height: deviceHeight,

              backgroundColor: "#ffffff",

              position: "relative",

              overflow: "hidden",
            }}
          >
            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <View
              style={{
                position: "absolute",

                left: 0,
                top: 0,
                right: 0,
                bottom: 0,

                overflow: "hidden",
              }}
            >
              {(n.children ?? []).map(
                (
                  child: EpNode,
                  index: number
                ) =>
                  renderEpNode(
                    child,
                    `${key}-child-${index}`,
                    false
                  )
              )}
            </View>

            {/* =================================================
                CANVAS OVERLAY
            ================================================= */}

            <View
              pointerEvents="none"
              style={{
                position: "absolute",

                left: 0,
                right: 0,
                bottom: 0,

                height: 80,

                alignItems: "flex-end",
                justifyContent: "flex-end",

                paddingRight: 24,
                paddingBottom: 10,

                backgroundColor: "transparent",

                zIndex: 1000,
                elevation: 1000,
              }}
            >
              {(n.overlay ?? []).map(
                (
                  child: EpNode,
                  index: number
                ) =>
                  renderEpNode(
                    child,
                    `${key}-overlay-${index}`,
                    true
                  )
              )}
            </View>
          </View>
        );

      /* =====================================================
         COLUMNS
         Match the web preview's row-by-row grid order.
      ===================================================== */

 case "columns": {
        const columns: EpNode[][] =
          Array.isArray(n.columns)
            ? n.columns
            : [];

        if (columns.length === 0) {
          return null;
        }

        return (
          <View
            key={key}
            style={{
              flex: 1,

              width: "100%",

              flexDirection: "row",

              minWidth: 0,
              minHeight: 0,

              overflow: "hidden",
            }}
          >
            {columns.map(
              (
                column: EpNode[],
                columnIndex: number
              ) => (
                <View
                  key={`${key}-column-${columnIndex}`}
                  style={{
                    /*
                     * Every column gets an equal
                     * share unless your resolver
                     * later provides a weight.
                     */
                    flex: 1,

                    minWidth: 0,
                    minHeight: 0,

                    height: "100%",

                    flexDirection:
                      "column",

                    overflow:
                      "hidden",
                  }}
                >
                  {column.map(
                    (
                      child: EpNode,
                      childIndex: number
                    ) =>
                      renderEpNode(
                        child,
                        `${key}-column-${columnIndex}-${childIndex}`,
                        isOverlay
                      )
                  )}
                </View>
              )
            )}
          </View>
        );
      }

      /* =====================================================
         COLUMN
      ===================================================== */

      case "column":
        return (
          <View
            key={key}
            style={{
              flex: 1,

              width: "100%",
              height: "100%",

              flexDirection: "column",

              overflow: "hidden",
            }}
          >
            {(n.children ?? []).map(
              (
                child: EpNode,
                index: number
              ) =>
                renderEpNode(
                  child,
                  `${key}-column-${index}`,
                  isOverlay
                )
            )}
          </View>
        );

      /* =====================================================
         BLOCK
      ===================================================== */

    case "block": {
  const hasBorder =
    n.border === true ||
    n.border === 1 ||
    n.border === "true" ||
    n.className?.includes("ep-block--border") ||
    n.class?.includes("ep-block--border") ||
    n.classes?.includes?.("ep-block--border");

  return (
    <View
      key={key}
      style={{
        flex: isOverlay ? 0 : 1,
        width: isOverlay
          ? "auto"
          : "100%",

        minWidth: 0,
        minHeight: 0,

        alignSelf: isOverlay
          ? "flex-end"
          : "stretch",

        flexDirection: "column",

        justifyContent:
          n.vAlign === "center"
            ? "center"
            : n.vAlign === "bottom"
            ? "flex-end"
            : "flex-start",

        alignItems:
          n.hAlign === "center"
            ? "center"
            : n.hAlign === "right"
            ? "flex-end"
            : isOverlay
            ? "flex-end"
            : "stretch",

        padding: isOverlay
          ? 0
          : n.full
          ? 0
          : 12,

        /*
         * =============================================
         * BORDER
         * =============================================
         */
        borderWidth:
          hasBorder && !isOverlay
            ? currentDeviceProfile.blockBorder || 1
            : 0,

        borderColor:
          hasBorder && !isOverlay
            ? "#000000"
            : "transparent",

        /*
         * Prevent content from escaping.
         */
        overflow: "hidden",

        backgroundColor: "#ffffff",
      }}
    >
      {(n.children ?? []).map(
        (
          child: EpNode,
          index: number
        ) =>
          renderEpNode(
            child,
            `${key}-block-${index}`,
            isOverlay
          )
      )}
    </View>
  );
}
      /* =====================================================
         TEXT
      ===================================================== */

      case "text": {
        const fontSize =
          n.size === "large"
            ? currentDeviceProfile
                .textSizes.large
            : n.size === "small"
            ? currentDeviceProfile
                .textSizes.small
            : currentDeviceProfile
                .textSizes.medium;

        return (
          <Text
            key={key}
            style={{
              color: "#000000",

              fontSize,

              lineHeight:
                currentDeviceProfile.lineHeight,

              fontWeight: "400",

              flexShrink: 1,

              textAlign:
                n.align === "center"
                  ? "center"
                  : "left",

              includeFontPadding: true,
            }}
          >
            {n.text ?? ""}
          </Text>
        );
      }

      /* =====================================================
         STAT
      ===================================================== */

      case "stat": {
        const statSize =
          n.size === "large"
            ? currentDeviceProfile
                .statSizes.large
            : n.size === "small"
            ? currentDeviceProfile
                .statSizes.small
            : currentDeviceProfile
                .statSizes.medium;

        return (
          <Text
            key={key}
            style={{
              color: "#000000",

              fontSize: statSize.fontSize,

              lineHeight:
                statSize.lineHeight,

              fontWeight: "700",

              textAlign:
                n.hAlign === "center"
                  ? "center"
                  : "right",

              includeFontPadding: true,
            }}
          >
            {n.value ?? ""}
          </Text>
        );
      }

      /* =====================================================
         IMAGE
      ===================================================== */

      case "image": {
        const imageSrc =
          appendCacheVersion(
            n.src,
            imageVersion
          );

        /*
         * IMPORTANT:
         *
         * Overlay images must NOT use EpImage,
         * because EpImage uses flex:1 / width:100% /
         * height:100% and will stretch the image.
         */
        if (isOverlay) {
          const overlayWidth =
            typeof n.width === "number" &&
            n.width > 0
              ? n.width
              : 60;

          const overlayHeight =
            typeof n.height === "number" &&
            n.height > 0
              ? n.height
              : 60;

          return (
            <View
              key={`${n.src}-overlay-${imageVersion}`}
              style={{
                width: overlayWidth,
                height: overlayHeight,

                alignItems: "center",
                justifyContent: "center",

                overflow: "hidden",
              }}
            >
              <Image
                source={{
                  uri: imageSrc,
                }}
                style={{
                  width: overlayWidth,
                  height: overlayHeight,
                }}
                resizeMode="contain"
              />

              {n.overlayText ? (
                <View
                  style={{
                    position: "absolute",

                    left: 0,
                    right: 0,
                    bottom: 0,

                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#000000",

                      fontSize: 12,

                      fontWeight: "700",
                    }}
                  >
                    {n.overlayText}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        }

        /*
         * Normal images keep your existing EpImage.
         */
        return (
          <EpImage
            key={`${n.src}-${imageVersion}`}
            src={imageSrc}
            overlayText={
              n.overlayText
            }
          />
        );
      }

      /* =====================================================
         IFRAME
      ===================================================== */

  case "iframe":
  return (
    <View
      key={key}
      pointerEvents="none"
      style={{
        flex: 1,
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {n.src ? (
        <WebView
          source={{
            uri: n.src,
          }}
          pointerEvents="none"
          scrollEnabled={false}
          nestedScrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
          onError={(event) => {
            console.log(
              "WEBVIEW ERROR:",
              event.nativeEvent
            );
          }}
        />
      ) : null}
    </View>
  );
   
  case "row":
  return (
    <View
      key={key}
      style={{
        width: "100%",
        flex: 1,
        minWidth: 0,
        minHeight: 0,

        flexDirection: "row",
        alignItems: "stretch",

        overflow: "hidden",
      }}
    >
      {(n.children ?? []).map(
        (child: EpNode, index: number) =>
          renderEpNode(
            child,
            `${key}-row-${index}`,
            isOverlay
          )
      )}
    </View>
  );

      case "segment":
        return (
          <View
            key={key}
            style={{
              width: deviceWidth,
              height: deviceHeight,

              position: "relative",

              backgroundColor:
                "#ffffff",

              overflow: "hidden",
            }}
          >
            {(n.children ?? []).map(
              (
                child: EpNode,
                index: number
              ) =>
                renderEpNode(
                  child,
                  `${key}-segment-${index}`,
                  isOverlay
                )
            )}
          </View>
        );

      case "segment-view":
        return (
          <View
            key={key}
            style={{
              position: "absolute",

              left:
                n.regionBox?.offsetX ??
                0,
              top:
                n.regionBox?.offsetY ??
                0,
              width:
                n.regionBox?.width ??
                deviceWidth,

              height:
                n.regionBox?.height ??
                deviceHeight,

              overflow: "hidden",
            }}
          >
            {(n.children ?? []).map(
              (
                child: EpNode,
                index: number
              ) =>
                renderEpNode(
                  child,
                  `${key}-view-${index}`,
                  isOverlay
                )
            )}
          </View>
        );

      case "footer":
        return (
          <View
            key={key}
            style={{
              width: "100%",
              minHeight: 20,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor:
                "#ffffff",
            }}
          >
            {(n.children ?? []).map(
              (
                child: EpNode,
                index: number
              ) =>
                renderEpNode(
                  child,
                  `${key}-footer-${index}`,
                  isOverlay
                )
            )}
          </View>
        );

      default:
        console.warn(
          "UNKNOWN EP NODE:",
          n.type,
          n
        );
        return null;
    }
  },
  [
    deviceWidth,
    deviceHeight,
    currentDeviceProfile,
    imageVersion,
  ]
);                                                                                                                                                                                                                                                                                                                                                         
  /*
   * Fit the physical display canvas into the actual preview viewport.
   * The viewport is measured from the rendered mobile layout.
   */
  const previewWidth =
    previewViewport.width > 0
      ? previewViewport.width
      : Math.max(0, screenWidth - 24);

  const previewHeight =
    previewViewport.height > 0
      ? previewViewport.height
      : Math.max(260, screenHeight * 0.45);

  const scale =
    deviceWidth > 0 && deviceHeight > 0
      ? Math.min(
          previewWidth / deviceWidth,
          previewHeight / deviceHeight,
          1
        )
      : 1;

  const scaledWidth = deviceWidth * scale;
  const scaledHeight = deviceHeight * scale;

  /* =======================================================
     CLEANUP CONFIG TIMERS
  ======================================================= */

  useEffect(() => {
    return () => {
      Object.values(
        configTimers.current
      ).forEach(
        (timer) => {
          clearTimeout(
            timer
          );
        }
      );
    };
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !plugin
  ) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading PluginIDE...
        </Text>
      </View>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={{
            flex: 1,
            paddingRight: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={
              styles.pluginName
            }
          >
            {
              plugin.pluginName
            }
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.pluginDescription
            }
          >
            {
              plugin.pluginDescription ??
              "No description"
            }
          </Text>
        </View>

    <Pressable
  disabled={isExecuting}
  onPress={executePlayground}
  style={[
    styles.executeButton,
    isExecuting &&
      styles.disabledButton,
  ]}
>
  {isExecuting ? (
    <ActivityIndicator
      size="small"
    />
  ) : (
    <Text
      style={styles.executeText}
    >
      {hasChanges
        ? "Execute"
        : "Refresh"}
    </Text>
  )}
</Pressable>
      </View>

      {/* =================================================
          DEVICE SELECTOR
      ================================================= */}

      <View
        style={
          styles.deviceToolbar
        }
      >
        <Pressable
          onPress={() =>
            setShowDeviceSelector(
              (value) =>
                !value
            )
          }
          style={
            styles.deviceButton
          }
        >
          <Text
            style={
              styles.deviceButtonText
            }
          >
            {
              device?.modelNo ??
              "Device"
            }
          </Text>

          <Text
            style={
              styles.deviceResolution
            }
          >
            {device
              ? `${device.displayResolutionWidth}×${device.displayResolutionHeight}`
              : ""}
          </Text>
        </Pressable>

        {showDeviceSelector ? (
          <View
            style={
              styles.deviceDropdown
            }
          >
            {devices.map(
              (item) => {
                const selected =
                  item.displayId ===
                  device?.displayId;

                return (
                  <Pressable
                    key={
                      item.displayId
                    }
                    onPress={() => {
                      setDevice(
                        item
                      );

                      setShowDeviceSelector(
                        false
                      );
                    }}
                    style={[
                      styles.deviceOption,

                      selected &&
                        styles.selectedDeviceOption,
                    ]}
                  >
                    <Text
                      style={[
                        styles.deviceOptionTitle,

                        selected &&
                          styles.selectedDeviceText,
                      ]}
                    >
                      {
                        item.modelNo
                      }
                    </Text>

                    <Text
                      style={
                        styles.deviceOptionResolution
                      }
                    >
                      {
                        item.displayResolutionWidth
                      }
                      ×
                      {
                        item.displayResolutionHeight
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        ) : null}
      </View>

      {/* =================================================
          MAIN
      ================================================= */}

      <ScrollView
        style={
          styles.mainScroll
        }
        contentContainerStyle={
          styles.mainContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ===============================================
            PREVIEW
        =============================================== */}

        <View
          style={
            styles.previewSection
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Preview
          </Text>

          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;

              setPreviewViewport((previous) => {
                if (
                  Math.abs(previous.width - width) < 0.5 &&
                  Math.abs(previous.height - height) < 0.5
                ) {
                  return previous;
                }

                return { width, height };
              });
            }}
            style={[
              styles.previewOuter,
              {
                aspectRatio:
                  deviceWidth > 0 && deviceHeight > 0
                    ? deviceWidth / deviceHeight
                    : 1,
              },
            ]}
          >
            <View
              style={{
                width: scaledWidth,
                height: scaledHeight,
                backgroundColor: "#ffffff",
                overflow: "hidden",
                position: "absolute",
                left: 0,
                top: 0,
              }}
            >
              <View
                style={{
                  width:
                    deviceWidth,

                  height:
                    deviceHeight,

                  overflow:
                    "hidden",

                  transform: [
                    {
                      scale,
                    },
                  ],

                  transformOrigin:
                    "top left",
                }}
              >
                {compileError ? (
                  <View
                    style={
                      styles.compileError
                    }
                  >
                    <Text
                      style={
                        styles.compileErrorText
                      }
                    >
                      {
                        compileError
                      }
                    </Text>
                  </View>
                ) : epuiTree ? (
                  renderEpNode(
                    epuiTree,
                    "root"
                  )
                ) : (
                  <View
                    style={
                      styles.emptyPreview
                    }
                  >
                    <Text
                      style={
                        styles.emptyPreviewText
                      }
                    >
                      Rendering
                      preview...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ===============================================
            SETTINGS
        =============================================== */}

        <View
          style={
            styles.settingsSection
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Settings
          </Text>

          {playgroundInstances.length ===
          0 ? (
            <View
              style={
                styles.emptySettings
              }
            >
              <Text
                style={
                  styles.emptySettingsText
                }
              >
                No connectors
              </Text>
            </View>
          ) : (
            playgroundInstances.map(
              (instance) => (
                <ConnectorCard
                  key={
                    instance.id
                  }
                  sessionId={
                    playgroundSessionId ??
                    ""
                  }
                  mode="playground"
                  instance={
                    instance
                  }
                  connectors={
                    connectors
                  }
                  openInstanceId={
                    openInstanceId
                  }
                  setOpenInstanceId={
                    setOpenInstanceId
                  }
                  onStartOAuth={
                    startOAuth
                  }
                  onConfigChange={
                    updatePlaygroundInstanceConfig
                  }
                  onDisconnect={(
                    id
                  ) => {
                    setPlaygroundInstances(
                      (
                        previous
                      ) =>
                        previous.map(
                          (
                            item
                          ) =>
                            item.id ===
                            id
                              ? {
                                  ...item,
                                  oauthTokenId:
                                    null,
                                }
                              : item
                        )
                    );

                    setHasChanges(
                      true
                    );
                  }}
                  cropAspect={
                    device
                      ? device.displayResolutionWidth /
                        device.displayResolutionHeight
                      : 1
                  }
                />
              )
            )
          )}
        </View>

        {/* ===============================================
            PLAYLIST
        =============================================== */}

        {playlistItemId ? (
          <Pressable
            disabled={
              isUpdatingPlaylist
            }
            onPress={
              handleUpdatePlaylist
            }
            style={[
              styles.playlistButton,

              isUpdatingPlaylist &&
                styles.disabledButton,
            ]}
          >
            {isUpdatingPlaylist ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.playlistButtonText
                }
              >
                Update to Playlist
              </Text>
            )}
          </Pressable>
        ) : null}

        {/* ===============================================
            DATA CONTEXT
        =============================================== */}

        <Pressable
          onPress={() =>
            setDataContextExpanded(
              (value) =>
                !value
            )
          }
          style={
            styles.dataContextHeader
          }
        >
          <Text
            style={
              styles.dataContextTitle
            }
          >
            Data Context
          </Text>

          <Text
            style={
              styles.expandIcon
            }
          >
            {dataContextExpanded
              ? "▲"
              : "▼"}
          </Text>
        </Pressable>

        {dataContextExpanded ? (
          <ScrollView
            horizontal
            style={
              styles.dataContextBox
            }
          >
            <Text
              style={
                styles.dataContextText
              }
            >
              {JSON.stringify(
                dataContext,
                null,
                2
              )}
            </Text>
          </ScrollView>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f5f5f5",
    },

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f5f5f5",
    },

    loadingText: {
      marginTop: 12,
      color:
        "#666666",
      fontSize: 14,
    },

    header: {
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e5e5e5",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    pluginName: {
      fontSize: 15,
      fontWeight:
        "700",
      color:
        "#111111",
    },

    pluginDescription: {
      marginTop: 2,
      fontSize: 11,
      color:
        "#777777",
    },

    executeButton: {
      minWidth: 76,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        "#cccccc",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
    },

    executeText: {
      fontSize: 12,
      fontWeight:
        "600",
      color:
        "#111111",
    },

    disabledButton: {
      opacity: 0.45,
    },

    deviceToolbar: {
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e5e5e5",
      position:
        "relative",
      zIndex: 100,
    },

    deviceButton: {
      alignSelf:
        "flex-start",
      minHeight: 34,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor:
        "#dddddd",
      borderRadius: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    deviceButtonText: {
      fontSize: 12,
      fontWeight:
        "600",
      color:
        "#222222",
    },

    deviceResolution: {
      marginLeft: 8,
      fontSize: 10,
      color:
        "#888888",
    },

    deviceDropdown: {
      position:
        "absolute",
      left: 14,
      top: 46,
      width: 220,
      backgroundColor:
        "#ffffff",
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        "#dddddd",
      elevation: 8,
      shadowColor:
        "#000000",
      shadowOpacity:
        0.15,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      zIndex: 999,
    },

    deviceOption: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eeeeee",
    },

    selectedDeviceOption: {
      backgroundColor:
        "#eef5ff",
    },

    deviceOptionTitle: {
      fontSize: 12,
      fontWeight:
        "600",
      color:
        "#333333",
    },

    selectedDeviceText: {
      color:
        "#2563eb",
    },

    deviceOptionResolution: {
      marginTop: 2,
      fontSize: 10,
      color:
        "#888888",
    },

    mainScroll: {
      flex: 1,
    },

    mainContent: {
      paddingBottom: 30,
    },

    previewSection: {
      padding: 12,
    },

    sectionTitle: {
      marginBottom: 8,
      fontSize: 13,
      fontWeight:
        "700",
      color:
        "#222222",
    },

    previewOuter: {
      width: "100%",
      backgroundColor:
        "#e9e9e9",
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#dddddd",
    },

    emptyPreview: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
    },

    emptyPreviewText: {
      color:
        "#888888",
      fontSize: 12,
    },

    compileError: {
      flex: 1,
      padding: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#fff5f5",
    },

    compileErrorText: {
      color:
        "#dc2626",
      fontSize: 12,
      textAlign:
        "center",
    },

    settingsSection: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },

    emptySettings: {
      padding: 20,
      borderRadius: 10,
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
    },

    emptySettingsText: {
      color:
        "#888888",
      fontSize: 12,
    },

    playlistButton: {
      marginHorizontal: 12,
      marginBottom: 12,
      height: 42,
      borderRadius: 9,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#2563eb",
    },

    playlistButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "600",
    },

    dataContextHeader: {
      minHeight: 46,
      paddingHorizontal: 14,
      backgroundColor:
        "#ffffff",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor:
        "#e5e5e5",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    dataContextTitle: {
      fontSize: 13,
      fontWeight:
        "700",
      color:
        "#222222",
    },

    expandIcon: {
      marginLeft:
        "auto",
      color:
        "#777777",
      fontSize: 11,
    },

    dataContextBox: {
      maxHeight: 300,
      backgroundColor:
        "#111111",
      padding: 12,
    },

    dataContextText: {
      color:
        "#eeeeee",
      fontFamily:
        "monospace",
      fontSize: 10,
    },
  });