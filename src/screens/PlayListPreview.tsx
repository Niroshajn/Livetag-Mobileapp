// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { Play, RefreshCw } from "lucide-react-native";
// import api from "../lib/api";
// import { ConnectorCard, PluginInstance } from "../modal/ConnectorCard";
// import { useNavigation } from "@react-navigation/native";
// import * as Linking from "react-native";

// type Connector = {
//   type: string;
//   schema?: any;
// };

// type RouteParams = {
//   pluginId: string;
//   playlistItemId?: string;
//   cameFrom?: boolean;
//   pluginName?: string;
// };

// export default function PlayListPreview({
//   route,
// }: {
//   route: { params: RouteParams };
// }) {
//   const { pluginId, playlistItemId, cameFrom , pluginName } = route.params;

//   const [connectors, setConnectors] = useState<Connector[]>([]);
//   const [playgroundInstances, setPlaygroundInstances] = useState<
//     PluginInstance[]
//   >([]);

//   const [playgroundSession, setPlaygroundSession] = useState<any>(null);
//   const [playgroundSessionId, setPlaygroundSessionId] =
//     useState<string | null>(null);

//   const [openInstanceId, setOpenInstanceId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   const playlistLoadedRef = useRef(false);
//   const navigation = useNavigation<any>();

//   /* ================= API FUNCTIONS ================= */

//   const createPlaygroundSession = async () => {
//     const res = await api.post(
//       `/playground/${pluginId}/create-session`
//     );
//     return res.data.session;
//   };

//   const refreshPlaygroundSession = async () => {
//     const res = await api.get(`/playground/${pluginId}/refresh`);
//     return res.data;
//   };

//   const loadPlaygroundConnectors = async (sessionId: string) => {
//     const res = await api.get(
//       `/playground/${sessionId}/connectors`
//     );
//     setPlaygroundInstances(res.data);
//   };

//   const loadPlaylistPlayground = async (playlistItemId: string) => {
//     const res = await api.get(
//       `/playlist/${playlistItemId}/get-playground`
//     );

//     const data = res.data;

//     console.log("PLAYLIST:", playlistItemId);
//     console.log("SESSION:", data.playgroundSessionId);

//     setPlaygroundSession({ id: data.playgroundSessionId });
//     setPlaygroundSessionId(data.playgroundSessionId);
//     setPlaygroundInstances(data.playgroundConnectorConfigs || []);
//   };

//   /* ================= MAIN LOGIC ================= */
//   useEffect(() => {
//     // 🔥 reset everything when playlist changes
//     setPlaygroundSession(null);
//     setPlaygroundSessionId(null);
//     setPlaygroundInstances([]);
//   }, [playlistItemId]);

//   useEffect(() => {
//     if (!pluginId) return;

//     const load = async () => {
//       try {
//         setLoading(true);

//         const c = await api.get(`/test/data-connectors/connectors`);
//         setConnectors(c.data);

//         // 🔥 ALWAYS PRIORITIZE PLAYLIST
//         if (playlistItemId) {
//           await loadPlaylistPlayground(playlistItemId);
//           return;
//         }

//         // normal playground
//         const session = await createPlaygroundSession();
//         await loadPlaygroundConnectors(session.id);

//         setPlaygroundSession(session);
//         setPlaygroundSessionId(session.id);

//       } catch (err: any) {
//         console.log("ERROR:", err?.response?.data || err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, [pluginId, playlistItemId]);

//   /* ================= UPDATE CONFIG ================= */

//   const updatePlaygroundInstanceConfig = (
//     instanceId: string,
//     config: Record<string, any>
//   ) => {
//     setPlaygroundInstances((prev) =>
//       prev.map((i) =>
//         i.id === instanceId ? { ...i, config } : i
//       )
//     );

//     api.patch(
//       `/playground/${playgroundSessionId}/connector-instance/${instanceId}`,
//       { config }
//     );
//   };

//   const handleExecute = async () => {
//     if (!playgroundSessionId) return;

//     await api.get(`/execution/playground/${playgroundSessionId}`);
//     Alert.alert("Executed");
//   };

// const handleUpdatePlaylist = async () => {
//   if (!playlistItemId) return;

//   await api.post(
//     `/playlist/item/${playlistItemId}/sync-connectors`
//   );

//   Alert.alert("Success", "Playlist Updated", [
//     {
//       text: "OK",
//       onPress: () => {
//         navigation.goBack(); // ✅ GO BACK TO PLAYLIST
//       },
//     },
//   ]);
// };

// const syncPlaygroundState = async () => {
//   if (!playgroundSessionId) return;

//   try {
//     const [sessionRes, connectorsRes] = await Promise.all([
//       api.get(`/playground/${pluginId}/refresh`),
//       api.get(`/playground/${playgroundSessionId}/connectors`),
//     ]);

//     setPlaygroundSession(sessionRes.data);
//     setPlaygroundInstances(connectorsRes.data);
//   } catch (err) {
//     console.log("Sync failed", err);
//   }
// };

// const handleDisconnect = async (id: string) => {
//   try {
//     // 1. Optimistic UI update
//     setPlaygroundInstances((prev) =>
//       prev.map((i) =>
//         i.id === id ? { ...i, oauthTokenId: null } : i
//       )
//     );

//     // 2. Backend call
//     await api.delete(`/playground/connector/${id}/oauth/detach`);

//     // 3. IMPORTANT → re-sync from backend
//     await syncPlaygroundState();
//   } catch (err) {
//     console.log("Logout failed", err);
//   }
// };

//   /* ================= UI ================= */

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-white dark:bg-black ">

//       {/* ACTION BUTTONS */}
//       <View className="p-3 mt-7">
//         <Text className="text-semibold text-gray-900 dark:text-white text-lg p-3">
//           {pluginName}
//         </Text>
//         <TouchableOpacity
//           onPress={handleExecute}
//           className="bg-gray-400 dark:bg-gray-600 p-3 rounded mb-3"
//         >
//           <Text className="text-gray-100 dark:text-gray-400 text-center">
//             Execute
//           </Text>
//         </TouchableOpacity>

//         {cameFrom && (
//           <TouchableOpacity
//             onPress={handleUpdatePlaylist}
//             className="bg-blue-600 p-3 rounded"
//           >
//             <Text className="text-gray-100 dark:text-gray-200 text-center">
//               Update Playlist
//             </Text>
//           </TouchableOpacity>
//         )}

//       </View>
//       {/* CONNECTORS */}
//       <View className="flex-1 p-4">

//         {/* HEADER */}
//         <View className="flex-row items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-600 mb-3">
//           <Text className="text-gray-900 dark:text-gray-400 text-xs">
//             Connectors
//           </Text>
//         </View>

//         {/* LIST */}
//         <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
//           {playgroundInstances.map((inst) => (
//             <ConnectorCard
//               key={`${inst.id}-${playgroundSessionId}`}
//               instance={inst}
//               connectors={connectors}
//               mode="playground"
//               sessionId={playgroundSessionId || ""}
//               openInstanceId={openInstanceId}
//               setOpenInstanceId={setOpenInstanceId}
//               onConfigChange={updatePlaygroundInstanceConfig}
//                onDisconnect={handleDisconnect} 
//             />
//           ))}
//         </ScrollView>
//       </View>
//     </View>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Play } from "lucide-react-native";
import api from "../lib/api";
import { ConnectorCard, PluginInstance } from "../modal/ConnectorCard";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

type Connector = {
  type: string;
  schema?: any;
};

type RouteParams = {
  pluginId: string;
  playlistItemId?: string;
  cameFrom?: boolean;
  pluginName?: string;
};

export default function PlayListPreview({
  route,
}: {
  route: { params: RouteParams };
}) {
  const { pluginId, playlistItemId, cameFrom, pluginName } = route.params;
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [playgroundInstances, setPlaygroundInstances] = useState<
    PluginInstance[]
  >([]);

  const [playgroundSession, setPlaygroundSession] = useState<any>(null);
  const [playgroundSessionId, setPlaygroundSessionId] =
    useState<string | null>(null);

  const [openInstanceId, setOpenInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  /* ================= API ================= */

  const createPlaygroundSession = async () => {
    const res = await api.post(`/playground/${pluginId}/create-session`);
    return res.data.session;
  };

  const loadPlaygroundConnectors = async (sessionId: string) => {
    const res = await api.get(`/playground/${sessionId}/connectors`);
    setPlaygroundInstances(res.data);
  };

  const loadPlaylistPlayground = async (playlistItemId: string) => {
    const res = await api.get(
      `/playlist/${playlistItemId}/get-playground`
    );

    const data = res.data;

    setPlaygroundSession({ id: data.playgroundSessionId });
    setPlaygroundSessionId(data.playgroundSessionId);
    setPlaygroundInstances(data.playgroundConnectorConfigs || []);
  };

  const syncPlaygroundState = async () => {
    try {
      // ✅ PLAYLIST MODE
      if (playlistItemId) {
        console.log("Refreshing PLAYLIST data...");
        await loadPlaylistPlayground(playlistItemId);
        return;
      }

      // ✅ NORMAL MODE
      if (!playgroundSessionId) return;

      console.log("Refreshing NORMAL session...");

      const res = await api.get(
        `/playground/${playgroundSessionId}/connectors`
      );

      setPlaygroundInstances(res.data);

    } catch (err) {
      console.log("Sync failed", err);
    }
  };


  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const c = await api.get(`/test/data-connectors/connectors`);
        setConnectors(c.data);

        if (playlistItemId) {
          await loadPlaylistPlayground(playlistItemId);
          return;
        }

        const session = await createPlaygroundSession();
        await loadPlaygroundConnectors(session.id);

        setPlaygroundSession(session);
        setPlaygroundSessionId(session.id);
      } catch (err: any) {
        console.log("ERROR:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pluginId, playlistItemId]);

  /* ================= 🔥 OAUTH LISTENER ================= */

  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      console.log("OAuth redirect URL:", url);

      // safer check
      if (url.includes("oauth")) {
        console.log("OAuth SUCCESS");

        await syncPlaygroundState(); // 🔥 KEY FIX
      }
    });

    return () => sub.remove();
  }, [playgroundSessionId]);

  /* ================= CONFIG ================= */

  const updatePlaygroundInstanceConfig = (
    instanceId: string,
    config: Record<string, any>
  ) => {
    setPlaygroundInstances((prev) =>
      prev.map((i) =>
        i.id === instanceId ? { ...i, config } : i
      )
    );

    api.patch(
      `/playground/${playgroundSessionId}/connector-instance/${instanceId}`,
      { config }
    );
  };

  const handleExecute = async () => {
    if (!playgroundSessionId) return;

    await api.get(`/execution/playground/${playgroundSessionId}`);
    Alert.alert("Executed");
  };

  const handleUpdatePlaylist = async () => {
    if (!playlistItemId) return;

    await api.post(`/playlist/item/${playlistItemId}/sync-connectors`);

    Alert.alert("Success", "Playlist Updated", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handleDisconnect = async (id: string) => {
    try {
      setPlaygroundInstances((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, oauthTokenId: null } : i
        )
      );

      await api.delete(`/playground/connector/${id}/oauth/detach`);

      await syncPlaygroundState();
    } catch (err) {
      console.log("Logout failed", err);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="p-3 mt-7">
        <Text className="text-lg p-3">{pluginName}</Text>

        <TouchableOpacity
          onPress={handleExecute}
          className="bg-gray-400 p-3 rounded mb-3"
        >
          <Text className="text-center text-white">Execute</Text>
        </TouchableOpacity>

        {cameFrom && (
          <TouchableOpacity
            onPress={handleUpdatePlaylist}
            className="bg-blue-600 p-3 rounded"
          >
            <Text className="text-center text-white">
              Update Playlist
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 p-4">
        <Text className="text-xs mb-3">Connectors</Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {playgroundInstances.map((inst) => (
            <ConnectorCard
              key={`${inst.id}-${playgroundSessionId}`}
              instance={inst}
              connectors={connectors}
              mode="playground"
              sessionId={playgroundSessionId || ""}
              openInstanceId={openInstanceId}
              setOpenInstanceId={setOpenInstanceId}
              onConfigChange={updatePlaygroundInstanceConfig}
              onDisconnect={handleDisconnect}

              // 🔥 ADD THIS
              onStartOAuth={async (id, provider) => {
                try {
                  console.log("Starting OAuth for:", provider);

                  const res = await api.post(
                    `/playground/connector/${id}/oauth/connect`,
                    {
                      origin: "myapp://oauth", // 🔥 MUST match backend
                    }
                  );

                  console.log("OAuth URL:", res.data.url);

                  await Linking.openURL(res.data.url);

                } catch (err) {
                  console.log("OAuth start failed", err);
                }
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}