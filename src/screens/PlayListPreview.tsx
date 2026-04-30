import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Play, RefreshCw } from "lucide-react-native";
import api from "../lib/api";
import { ConnectorCard, PluginInstance } from "../modal/ConnectorCard";

type Connector = {
  type: string;
  schema?: any;
};

type RouteParams = {
  pluginId: string;
  playlistItemId?: string;
  cameFrom?: boolean;
};

export default function PlayListPreview({
  route,
}: {
  route: { params: RouteParams };
}) {
  const { pluginId, playlistItemId, cameFrom } = route.params;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [playgroundInstances, setPlaygroundInstances] = useState<
    PluginInstance[]
  >([]);

  const [playgroundSession, setPlaygroundSession] = useState<any>(null);
  const [playgroundSessionId, setPlaygroundSessionId] =
    useState<string | null>(null);

  const [openInstanceId, setOpenInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const playlistLoadedRef = useRef(false);

  /* ================= API FUNCTIONS ================= */

  const createPlaygroundSession = async () => {
    const res = await api.post(
      `/playground/${pluginId}/create-session`
    );
    return res.data.session;
  };

  const refreshPlaygroundSession = async () => {
    const res = await api.get(`/playground/${pluginId}/refresh`);
    return res.data;
  };

  const loadPlaygroundConnectors = async (sessionId: string) => {
    const res = await api.get(
      `/playground/${sessionId}/connectors`
    );
    setPlaygroundInstances(res.data);
  };

  const loadPlaylistPlayground = async (playlistItemId: string) => {
    const res = await api.get(
      `/playlist/${playlistItemId}/get-playground`
    );

    const data = res.data;

    console.log("PLAYLIST:", playlistItemId);
    console.log("SESSION:", data.playgroundSessionId);

    setPlaygroundSession({ id: data.playgroundSessionId });
    setPlaygroundSessionId(data.playgroundSessionId);
    setPlaygroundInstances(data.playgroundConnectorConfigs || []);
  };

  /* ================= MAIN LOGIC ================= */
  useEffect(() => {
    // 🔥 reset everything when playlist changes
    setPlaygroundSession(null);
    setPlaygroundSessionId(null);
    setPlaygroundInstances([]);
  }, [playlistItemId]);

  useEffect(() => {
    if (!pluginId) return;

    const load = async () => {
      try {
        setLoading(true);

        const c = await api.get(`/test/data-connectors/connectors`);
        setConnectors(c.data);

        // 🔥 ALWAYS PRIORITIZE PLAYLIST
        if (playlistItemId) {
          await loadPlaylistPlayground(playlistItemId);
          return;
        }

        // normal playground
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
  /* ================= UPDATE CONFIG ================= */

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

    await api.post(
      `/playlist/item/${playlistItemId}/sync-connectors`
    );

    Alert.alert("Playlist Updated");
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
    <View className="flex-1 bg-white dark:bg-black ">

      {/* ACTION BUTTONS */}
      <View className="p-3 mt-7">

        <TouchableOpacity
          onPress={handleExecute}
          className="bg-gray-400 dark:bg-gray-600 p-3 rounded mb-3"
        >
          <Text className="text-gray-100 dark:text-gray-400 text-center">
            Execute
          </Text>
        </TouchableOpacity>

        {cameFrom && (
          <TouchableOpacity
            onPress={handleUpdatePlaylist}
            className="bg-blue-600 p-3 rounded"
          >
            <Text className="text-gray-100 dark:text-gray-200 text-center">
              Update Playlist
            </Text>
          </TouchableOpacity>
        )}

      </View>
      {/* CONNECTORS */}
      <View className="flex-1 p-4">

        {/* HEADER */}
        <View className="flex-row items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-600 mb-3">
          <Text className="text-gray-900 dark:text-gray-400 text-xs">
            Connectors
          </Text>
        </View>

        {/* LIST */}
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
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}