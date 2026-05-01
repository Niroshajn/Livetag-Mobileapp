import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Play, Plus } from "lucide-react-native";
import api from "../lib/api";
import { ConnectorCard, PluginInstance } from "../modal/ConnectorCard";
import { Linking } from "react-native";
// ✅ ONLY REQUIRED MODALS
import SelectFrameModal from "../modal/SelectFrameModal";
import PlaylistItemModal from "../modal/PlaylistItemModal";

type Connector = {
  type: string;
  schema?: any;
};

type RouteParams = {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
};

export default function PreviewPage({
  route,
}: {
  route: { params: RouteParams };
}) {
  const { pluginId, pluginName, pluginDescription } = route.params;

  const [instances, setInstances] = useState<PluginInstance[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openInstanceId, setOpenInstanceId] = useState<string | null>(null);

  // ✅ MODAL STATES
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // ✅ STORE FRAME ID
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      console.log("OAuth redirect:", url);

      if (url.includes("oauth")) {
        console.log("OAuth SUCCESS → refreshing UI");

        try {
          const res = await api.get(
            `/playground/${sessionId}/connectors`
          );

          setInstances(res.data);
        } catch (err) {
          console.log("Refresh failed", err);
        }
      }
    });

    return () => sub.remove();
  }, [sessionId]);
  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const connectorRes = await api.get(
          `/test/data-connectors/connectors`
        );
        setConnectors(connectorRes.data);

        const sessionRes = await api.post(
          `/playground/${pluginId}/create-session`
        );
        const session = sessionRes.data?.session?.id;
        if (!session) throw new Error("No session");

        setSessionId(session);

        const instRes = await api.get(
          `/playground/${session}/connectors`
        );

        const data = instRes.data;

        if (Array.isArray(data)) setInstances(data);
        else if (Array.isArray(data.connectors))
          setInstances(data.connectors);
        else if (Array.isArray(data.data)) setInstances(data.data);
        else setInstances([]);
      } catch (err: any) {
        console.log("ERROR:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pluginId]);

  const handleExecute = () => {
    Alert.alert("Execute", "Execution triggered");
  };

  // ✅ OPEN FRAME MODAL
  const handleAddToPlaylist = () => {
    setShowFrameModal(true);
  };
const handleDisconnect = async (id: string) => {
  try {
    // ✅ update correct state
    setInstances((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, oauthTokenId: null } : i
      )
    );

    await api.delete(`/playground/connector/${id}/oauth/detach`);

    const res = await api.get(
      `/playground/${sessionId}/connectors`
    );

    setInstances(res.data);

  } catch (err) {
    console.log("Logout failed", err);
  }
};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-[#0a0a0a]">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#0a0a0a]">

      {/* HEADER */}
      <View className="px-4 py-4 border-b border-gray-400 dark:border-gray-600 mt-8">
        <Text className="text-gray-900 dark:text-white text-base font-semibold">
          {pluginName}
        </Text>
        <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          {pluginDescription || "No description"}
        </Text>
      </View>

      {/* ACTIONS */}
      <View className="flex-row px-4 py-3 gap-2">
        <TouchableOpacity
          onPress={handleExecute}
          className="flex-1 border border-gray-400 dark:border-gray-600 py-2 rounded flex-row items-center justify-center"
        >
          <Play size={14} color="white" />
          <Text className="text-gray-900 dark:text-white text-xs ml-1">Execute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddToPlaylist}
          className="flex-1 border border-gray-400 dark:border-gray-600 py-2 rounded flex-row items-center justify-center"
        >
          <Plus size={14} color="white" />
          <Text className="text-gray-900 dark:text-white text-xs ml-1">
            Add to Playlist
          </Text>
        </TouchableOpacity>
      </View>

      {/* SETTINGS */}
      <View className="px-4 py-2">
        <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase">
          Settings
        </Text>
      </View>

      {/* LIST */}
      <ScrollView className="flex-1 px-3">
        {instances.length === 0 ? (
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-10">
            No connectors available
          </Text>
        ) : (
          instances.map((inst) => (
            <ConnectorCard
              key={inst.id}
              instance={inst}
              connectors={connectors}
              mode="playground"
              sessionId={sessionId || ""}
              openInstanceId={openInstanceId}
              setOpenInstanceId={setOpenInstanceId}
              onConfigChange={(id, config) => {
                setInstances((prev) =>
                  prev.map((item) =>
                    item.id === id
                      ? { ...item, config: { ...item.config, ...config } }
                      : item
                  )
                );
              }}
              onDisconnect={handleDisconnect}
              onStartOAuth={async (id) => {
                const res = await api.post(
                  `/playground/connector/${id}/oauth/connect`,
                  {
                    origin: "myapp://oauth"
                  }
                );

                const { Linking } = await import("react-native");
                Linking.openURL(res.data.url);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* ✅ FRAME MODAL */}
      <SelectFrameModal
        open={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        onContinue={(frameId: string) => {
          console.log("Selected Frame:", frameId);

          setSelectedFrameId(frameId);
          setShowFrameModal(false);

          // 👉 OPEN NEXT MODAL
          setShowItemModal(true);
        }}
      />

      {selectedFrameId && (
        <PlaylistItemModal
          open={showItemModal}
          onClose={() => setShowItemModal(false)}
          pluginName={pluginName}
          plugin={{ pluginId, pluginName }}
          selectedItem={null}
          frameId={selectedFrameId}   // ✅ now always string
          onSaved={() => {
            setShowItemModal(false);
            Alert.alert("Success", "Added to playlist");
          }}
        />
      )}
    </View>
  );
}