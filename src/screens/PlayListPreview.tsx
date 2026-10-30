import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "nativewind";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../components/AppText";
import WebView from "react-native-webview";
import { Liquid } from "liquidjs";
import {
  EpCanvas,
  EpRow,
  EpBlock,
  EpText,
  EpStat,
  EpImage,
  EpColumn,
  EpColumns,
} from "../ep-ui";

import type { EpNode } from "../../packages/ltag";

import { compileLTHtml } from "../../packages/ltag/compile/compiler";

import { resolveLayout } from "../../packages/ltag/resolve/resolveLayout";

import {
  DEFAULT_DEVICE_PROFILE,
  LTDP75BW_800x480,
  E6_73IN_800x480,
  E6_13IN_1200x1600,
} from "../../packages/ltag/device";

import type { DeviceProfile } from "../../packages/ltag/device";

import api from "../lib/api";

import {
  ConnectorCard,
  type PluginInstance,
} from "../modal/ConnectorCard";

/* ============================================================
   TYPES
============================================================ */

type Orientation = "landscape" | "portrait";

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
    label?: string;
    category?: string;

    config?: Record<string, any>;

    sampleResponse?: Record<string, any>;

    oauth?: {
      provider?: string;
    };

    [key: string]: any;
  };

  [key: string]: any;
};

type DisplayInfo = {
  displayId: string;
  modelNo: string;

  displayResolutionWidth: number;
  displayResolutionHeight: number;
};

type PlaygroundSessionResponse = {
  session: {
    id: string;
  };
};

type PlaylistPlaygroundResponse = {
  playgroundSessionId: string;

  playgroundConnectorConfigs: PluginInstance[];

  oauthTokens?: any;
};

type Props = {
  route: {
    params: {
      pluginId: string;

      playlistItemId?: string;

      width?: number;

      height?: number;
    };
  };
};

/* ============================================================
   HELPERS
============================================================ */

const normalizeInstanceKey = (key: string = "") =>
  key
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^[^a-zA-Z]+/, "");

const appendCacheVersion = (src: string, version: number) => {
  if (!src || !version) {
    return src;
  }

  return `${src}${src.includes("?") ? "&" : "?"}v=${version}`;
};

const getDefaultOrientation = (
  width: number,
  height: number
): Orientation => (width >= height ? "landscape" : "portrait");

const getOrientedDimensions = (
  width: number,
  height: number,
  orientation: Orientation
) => {
  const max = Math.max(width, height);
  const min = Math.min(width, height);

  if (orientation === "landscape") {
    return {
      width: max,
      height: min,
    };
  }

  return {
    width: min,
    height: max,
  };
};

const getOrientedProfile = (
  baseProfile: DeviceProfile,
  orientation: Orientation
): DeviceProfile => {
  const dimensions = getOrientedDimensions(
    baseProfile.canvasWidth,
    baseProfile.canvasHeight,
    orientation
  );

  return {
    ...baseProfile,

    canvasWidth: dimensions.width,

    canvasHeight: dimensions.height,
  };
};

/* ============================================================
   EXECUTION CONTEXT NORMALIZER
============================================================ */

function normalizeExecutionContext(
  raw: any
): Record<string, any> {
  if (!raw) {
    return {};
  }

  if (!Array.isArray(raw) && typeof raw === "object") {
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

  if (Array.isArray(raw)) {
    const context: Record<string, any> = {};

    raw.forEach((item: any, index: number) => {
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
          typeof value.data === "object" &&
          !Array.isArray(value.data)
        ) {
          value = value.data;
        } else if (
          value.result &&
          typeof value.result === "object" &&
          !Array.isArray(value.result)
        ) {
          value = value.result;
        }
      }

      if (key) {
        context[normalizeInstanceKey(String(key))] =
          value ?? {};

        return;
      }

      if (
        typeof item === "object" &&
        !Array.isArray(item)
      ) {
        const keys = Object.keys(item);

        const looksLikeContext =
          keys.length > 0 &&
          keys.some(
            (itemKey) =>
              item[itemKey] &&
              typeof item[itemKey] === "object"
          );

        if (looksLikeContext) {
          Object.assign(context, item);

          return;
        }
      }

      console.log(
        `⚠️ UNKNOWN EXECUTION ITEM ${index}:`,
        item
      );
    });

    return context;
  }

  return {};
}

/* ============================================================
   SCREEN
============================================================ */

export default function PlaylistPlaygroundScreen({
  route,
}: Props) {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
const { colorScheme } = useColorScheme();
const isDark = colorScheme === "dark";
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(
      showEvent,
      () => setKeyboardVisible(true)
    );

    const hideSubscription = Keyboard.addListener(
      hideEvent,
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const pluginId = route?.params?.pluginId;

  const playlistItemId = route?.params?.playlistItemId;

  const initialWidth = route?.params?.width || 800;

  const initialHeight = route?.params?.height || 480;

  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const engine = useMemo(() => new Liquid(), []);
  const [loading, setLoading] = useState(true);

  const [plugin, setPlugin] = useState<Plugin | null>(null);

  const [connectors, setConnectors] = useState<Connector[]>([]);

  const [
    playgroundSessionId,
    setPlaygroundSessionId,
  ] = useState<string | null>(null);

  const [
    playgroundInstances,
    setPlaygroundInstances,
  ] = useState<PluginInstance[]>([]);

  const [
    playgroundExecutionData,
    setPlaygroundExecutionData,
  ] = useState<any>(null);

  const [markup, setMarkup] = useState("");

  const [epuiTree, setEpuiTree] =
    useState<EpNode | null>(null);

  const [compileError, setCompileError] =
    useState<string | null>(null);

const [openInstanceId, setOpenInstanceId] = useState<string | null>(
  playgroundInstances[0]?.id ?? null
);

useEffect(() => {
  if (playgroundInstances.length > 0) {
    setOpenInstanceId(playgroundInstances[0].id);
  }
}, [playgroundInstances]);

  const [orientation, setOrientation] =
    useState<Orientation>(
      getDefaultOrientation(
        initialWidth,
        initialHeight
      )
    );

  const [deviceWidth, setDeviceWidth] =
    useState(initialWidth);

  const [deviceHeight, setDeviceHeight] =
    useState(initialHeight);

  const [isExecuting, setIsExecuting] =
    useState(false);

  const [hasChanges, setHasChanges] =
    useState(false);

  const [imageVersion, setImageVersion] =
    useState(0);

  const [devices, setDevices] =
    useState<DisplayInfo[]>([]);

  const [
    dataContextExpanded,
    setDataContextExpanded,
  ] = useState(false);

  const mountedRef = useRef(false);

  const configTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const compileRequestRef = useRef(0);
const [isUpdatingPlaylist, setIsUpdatingPlaylist] =
  useState(false);

  const baseProfile = useMemo<DeviceProfile>(() => {
    const width = deviceWidth;
    const height = deviceHeight;

    if (
      (width === 1200 && height === 1600) ||
      (width === 1600 && height === 1200)
    ) {
      return E6_13IN_1200x1600;
    }

    if (
      (width === 800 && height === 480) ||
      (width === 480 && height === 800)
    ) {
      return E6_73IN_800x480;
    }

    return DEFAULT_DEVICE_PROFILE;
  }, [deviceWidth, deviceHeight]);

  const profile = useMemo(
    () =>
      getOrientedProfile(
        baseProfile,
        orientation
      ),
    [baseProfile, orientation]
  );

  const orientedDevice = useMemo(
    () =>
      getOrientedDimensions(
        deviceWidth,
        deviceHeight,
        orientation
      ),
    [
      deviceWidth,
      deviceHeight,
      orientation,
    ]
  );

  const previewWidth = Math.max(
    screenWidth - 24,
    100
  );

  const previewHeight = Math.max(
    screenHeight * 0.52,
    150
  );

const handleUpdatePlaylist = useCallback(async () => {
  if (!playlistItemId) {
    Alert.alert("Error", "Playlist item ID is missing.");
    return;
  }

  try {
    setIsUpdatingPlaylist(true);

    // Sync connector data
    await api.post(
      `/playlist/item/${playlistItemId}/sync-connectors`
    );

    // Force render the playlist item
    await api.post(
      `/playlist/force-render/${playlistItemId}`
    );

    setHasChanges(false);

    Alert.alert(
      "Success",
      "Playlist updated successfully."
    );
  } catch (error: any) {
    console.error(
      "UPDATE PLAYLIST ERROR:",
      error?.response?.data ?? error
    );

    Alert.alert(
      "Update failed",
      error?.response?.data?.message ??
        "Failed to update playlist. Please try again."
    );
  } finally {
    setIsUpdatingPlaylist(false);
  }
}, [playlistItemId, api]);

  const scale = Math.min(
    previewWidth / orientedDevice.width,
    previewHeight / orientedDevice.height,
    1
  );

  const scaledWidth =
    orientedDevice.width * scale;

  const scaledHeight =
    orientedDevice.height * scale;

  const createPlaygroundSession =
    useCallback(async () => {
      const response =
        await api.post<PlaygroundSessionResponse>(
          `/playground/${pluginId}/create-session`
        );

      console.log(
        "========== CREATED SESSION =========="
      );

      console.log(response.data);

      return response.data.session;
    }, [pluginId]);


  const refreshPlaygroundSession =
    useCallback(async () => {
      const response =
        await api.get<{ id: string }>(
          `/playground/${pluginId}/refresh`
        );

      console.log(
        "========== REFRESHED SESSION =========="
      );

      console.log(response.data);

      return response.data;
    }, [pluginId]);

 
  const loadPlaygroundConnectors =
    useCallback(async (sessionId: string) => {
      const response =
        await api.get<PluginInstance[]>(
          `/playground/${sessionId}/connectors`
        );

      const list = response.data ?? [];

      console.log(
        "========== PLAYGROUND CONNECTORS =========="
      );

      console.log(
        JSON.stringify(list, null, 2)
      );

      setPlaygroundInstances(list);

      return list;
    }, []);

  /* ==========================================================
     LOAD EXECUTION
  ========================================================== */

  const loadExecution =
    useCallback(async (sessionId: string) => {
      const response =
        await api.get<any>(
          `/execution/playground/${sessionId}`
        );

      const executionData = response.data;

      console.log(
        "================================="
      );

      console.log(
        "EXECUTION SESSION:",
        sessionId
      );

      console.log(
        "PLAYGROUND EXECUTION:"
      );

      console.log(
        JSON.stringify(
          executionData,
          null,
          2
        )
      );

      console.log(
        "================================="
      );

      setPlaygroundExecutionData(
        executionData
      );

      return executionData;
    }, []);

  /* ==========================================================
     LOAD DEVICES
  ========================================================== */

  const loadDevices = useCallback(
    async () => {
      try {
        const response =
          await api.get<DisplayInfo[]>(
            "/device/display-infos"
          );

        const list = response.data ?? [];

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

        if (
          list.length > 0 &&
          !route?.params?.width &&
          !route?.params?.height
        ) {
          const first = list[0];

          setDeviceWidth(
            first.displayResolutionWidth
          );

          setDeviceHeight(
            first.displayResolutionHeight
          );

          setOrientation(
            getDefaultOrientation(
              first.displayResolutionWidth,
              first.displayResolutionHeight
            )
          );
        }
      } catch (error) {
        console.log(
          "DEVICE LOAD ERROR:",
          error
        );
      }
    },
    [
      route?.params?.width,
      route?.params?.height,
    ]
  );

  /* ==========================================================
     LOAD PLUGIN
  ========================================================== */

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
        "PLUGIN:",
        response.data
      );

      setPlugin(response.data);

      setMarkup(
        response.data?.pluginCode ?? ""
      );
    }, [pluginId]);

  /* ==========================================================
     LOAD CONNECTOR TYPES
  ========================================================== */

  const loadConnectorTypes =
    useCallback(async () => {
      const response =
        await api.get<Connector[]>(
          "/test/data-connectors/connectors"
        );

      setConnectors(
        response.data ?? []
      );
    }, []);

  /* ==========================================================
     LOAD PLAYLIST PLAYGROUND
  ========================================================== */

  const loadPlaylistPlayground =
    useCallback(
      async (itemId: string) => {
        const response =
          await api.get<PlaylistPlaygroundResponse>(
            `/playlist/${itemId}/get-playground`
          );

        const data = response.data;

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
          data.playgroundConnectorConfigs ?? []
        );

        setPlaygroundExecutionData(null);

        await loadExecution(
          data.playgroundSessionId
        );

        return data;
      },
      [loadExecution]
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (!pluginId) {
      return;
    }

    if (mountedRef.current) {
      return;
    }

    mountedRef.current = true;

    const load = async () => {
      try {
        setLoading(true);

        await Promise.all([
          loadPlugin(),
          loadConnectorTypes(),
          loadDevices(),
        ]);

        if (playlistItemId) {
          await loadPlaylistPlayground(
            playlistItemId
          );
        } else {
          const session =
            await createPlaygroundSession();

          setPlaygroundSessionId(
            session.id
          );

          await loadPlaygroundConnectors(
            session.id
          );

          await loadExecution(
            session.id
          );

          setHasChanges(false);
        }
      } catch (error: any) {
        console.log(
          "PLUGIN LOAD ERROR:",
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Error",
          error?.response?.data?.message ??
            "Failed to load playground."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    pluginId,
    playlistItemId,
    loadPlugin,
    loadConnectorTypes,
    loadDevices,
    loadPlaylistPlayground,
    createPlaygroundSession,
    loadPlaygroundConnectors,
    loadExecution,
  ]);

  /* ==========================================================
     DATA CONTEXT
  ========================================================== */

  const dataContext = useMemo(
    () =>
      normalizeExecutionContext(
        playgroundExecutionData
      ),
    [playgroundExecutionData]
  );

  /* ==========================================================
     DEBUG DATA
  ========================================================== */

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
      Object.keys(dataContext)
    );

    console.log(
      "RSS:",
      dataContext?.rss
    );

    console.log(
      "RSS ITEMS:",
      dataContext?.rss?.items
    );

    console.log(
      "=============================================="
    );
  }, [dataContext]);

  /* ==========================================================
     COMPILE LIQUID
  ========================================================== */

  useEffect(() => {
    if (!markup) {
      setEpuiTree(null);
      return;
    }

    const requestId =
      ++compileRequestRef.current;

    let cancelled = false;

    const compile = async () => {
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

        const html =
          await engine.parseAndRender(
            markup,
            dataContext
          );

        if (
          cancelled ||
          requestId !==
            compileRequestRef.current
        ) {
          return;
        }

        console.log(
          "========== MOBILE LIQUID HTML =========="
        );

        console.log(html);

        const rawTree =
          compileLTHtml(html);

        if (
          cancelled ||
          requestId !==
            compileRequestRef.current
        ) {
          return;
        }

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

        const resolvedTree =
          resolveLayout(
            rawTree,
            profile
          );

        console.log(
          "========== COLUMN DEBUG =========="
        );

        const resolvedRoot =
          resolvedTree as any;

        console.log(
          "ROOT TYPE:",
          resolvedRoot?.type
        );

        const columnsNode =
          resolvedRoot?.children?.find(
            (child: any) =>
              child?.type === "columns"
          );

        console.log(
          "COLUMNS NODE:",
          JSON.stringify(
            columnsNode,
            null,
            2
          )
        );

        console.log(
          "COLUMN COUNT:",
          columnsNode?.columns?.length
        );

        console.log(
          "ITEM COUNT PER COLUMN:",
          columnsNode?.columns?.map(
            (column: any[]) =>
              column?.length
          )
        );

        console.log(
          "================================="
        );

        if (
          cancelled ||
          requestId !==
            compileRequestRef.current
        ) {
          return;
        }

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

        setEpuiTree(resolvedTree);
      } catch (error: any) {
        console.log(
          "LIQUID / COMPILE ERROR:",
          error
        );

        if (!cancelled) {
          setCompileError(
            error?.message ??
              "Failed to compile."
          );

          setEpuiTree(null);
        }
      }
    };

    compile();

    return () => {
      cancelled = true;
    };
  }, [
    markup,
    dataContext,
    profile,
    engine,
  ]);

  /* ==========================================================
     UPDATE CONNECTOR
  ========================================================== */

  const updateConnector =
    useCallback(
      (
        id: string,
        config: Record<string, any>
      ) => {
        setPlaygroundInstances(
          (previous) =>
            previous.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      config,
                    }
                  : item
            )
        );

        setHasChanges(true);

        const oldTimer =
          configTimers.current[id];

        if (oldTimer) {
          clearTimeout(oldTimer);
        }

        configTimers.current[id] =
          setTimeout(async () => {
            if (!playgroundSessionId) {
              return;
            }

            try {
              await api.patch(
                `/playground/${playgroundSessionId}/connector-instance/${id}`,
                {
                  config,
                }
              );

              console.log(
                "CONNECTOR UPDATED:",
                id
              );
            } catch (error: any) {
              console.log(
                "CONNECTOR UPDATE ERROR:",
                error?.response?.data ??
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ??
                  "Failed to update connector."
              );
            }
          }, 400);
      },
      [playgroundSessionId]
    );

  /* ==========================================================
     DISCONNECT
  ========================================================== */

  const disconnect =
    useCallback(
      async (id: string) => {
        setPlaygroundInstances(
          (previous) =>
            previous.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      oauthTokenId: null,
                    }
                  : item
            )
        );

        setHasChanges(true);
      },
      []
    );

  /* ==========================================================
     OAUTH
  ========================================================== */

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

          if (!response.data?.url) {
            throw new Error(
              "OAuth URL was not returned."
            );
          }

          await Linking.openURL(
            response.data.url
          );
        } catch (error: any) {
          console.log(
            "OAUTH ERROR:",
            error?.response?.data ??
              error
          );

          Alert.alert(
            "OAuth failed",
            error?.response?.data
              ?.message ??
              `Failed to connect ${provider}.`
          );
        }
      },
      []
    );

  /* ==========================================================
     OAUTH DEEP LINK
  ========================================================== */

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

        if (!playgroundSessionId) {
          return;
        }

        try {
          const session =
            await refreshPlaygroundSession();

          setPlaygroundSessionId(
            session.id
          );

          await loadPlaygroundConnectors(
            session.id
          );

          await loadExecution(
            session.id
          );

          setImageVersion(
            (value) => value + 1
          );

          setHasChanges(true);
        } catch (error) {
          console.log(
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
      .then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      })
      .catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [
    playgroundSessionId,
    refreshPlaygroundSession,
    loadPlaygroundConnectors,
    loadExecution,
  ]);

  /* ==========================================================
     EXECUTE
  ========================================================== */

  const execute =
    useCallback(async () => {
      if (!playgroundSessionId) {
        return;
      }

      try {
        setIsExecuting(true);

        console.log(
          "================================="
        );

        console.log(
          "EXECUTE - OLD SESSION:",
          playgroundSessionId
        );

        const refreshedSession =
          await refreshPlaygroundSession();

        const sessionId =
          refreshedSession.id;

        console.log(
          "EXECUTE - NEW SESSION:",
          sessionId
        );

        setPlaygroundSessionId(
          sessionId
        );

        await loadPlaygroundConnectors(
          sessionId
        );

        await loadExecution(
          sessionId
        );

        setImageVersion(
          (value) => value + 1
        );

        setHasChanges(false);

        console.log(
          "EXECUTE COMPLETE"
        );

        console.log(
          "================================="
        );
      } catch (error: any) {
        console.log(
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
    }, [
      playgroundSessionId,
      refreshPlaygroundSession,
      loadPlaygroundConnectors,
      loadExecution,
    ]);

  /* ==========================================================
     ORIENTATION
  ========================================================== */

  const changeOrientation =
    useCallback(
      (next: Orientation) => {
        if (next === orientation) {
          return;
        }

        setOrientation(next);

        setImageVersion(
          (value) => value + 1
        );
      },
      [orientation]
    );

  /* ==========================================================
     DEVICE
  ========================================================== */

  const changeDevice =
    useCallback(
      (selectedDevice: DisplayInfo) => {
        const width =
          selectedDevice.displayResolutionWidth;

        const height =
          selectedDevice.displayResolutionHeight;

        setDeviceWidth(width);

        setDeviceHeight(height);

        setOrientation(
          getDefaultOrientation(
            width,
            height
          )
        );

        setImageVersion(
          (value) => value + 1
        );
      },
      []
    );
const renderEpNode = useCallback(
  (
    node: EpNode,
    key?: string | number,
    isOverlay: boolean = false,
    inheritedHAlign?: "left" | "center" | "right",
    inheritedVAlign?: "top" | "center" | "bottom"
  ): React.ReactNode => {
    if (!node) {
      return null;
    }

    const n = node as any;

    switch (n.type) {
      case "segment":
        return (
          <View
            key={key}
            style={{
              width: orientedDevice.width,
              height: orientedDevice.height,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-segment-${index}`,
                  isOverlay,
                  inheritedHAlign,
                  inheritedVAlign
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
              left: n.regionBox?.offsetX ?? 0,
              top: n.regionBox?.offsetY ?? 0,
              width:
                n.regionBox?.width ??
                orientedDevice.width,
              height:
                n.regionBox?.height ??
                orientedDevice.height,
              overflow: "hidden",
            }}
          >
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-segment-view-${index}`,
                  isOverlay,
                  inheritedHAlign,
                  inheritedVAlign
                )
            )}
          </View>
        );
      case "canvas":
        return (
          <EpCanvas
            key={key}
            full={n.full}
            profile={profile}
            overlay={
              Array.isArray(n.overlay)
                ? n.overlay.map(
                    (child: EpNode, index: number) =>
                      renderEpNode(
                        child,
                        `${key}-overlay-${index}`,
                        true
                      )
                  )
                : undefined
            }
          >
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-canvas-${index}`,
                  false
                )
            )}
          </EpCanvas>
        );

      case "row":
        return (
          <EpRow key={key}>
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-row-${index}`,
                  isOverlay,
                  inheritedHAlign,
                  inheritedVAlign
                )
            )}
          </EpRow>
        );
      case "columns": {
        const columns: EpNode[][] =
          Array.isArray(n.columns)
            ? n.columns
            : [];

        if (columns.length === 0) {
          return null;
        }

        return (
          <EpColumns
            key={key}
            columns={columns.length}
          >
            {columns.map(
              (
                column: EpNode[],
                columnIndex: number
              ) => (
                <EpColumn
                  key={`${key}-column-${columnIndex}`}
                >
                  {column.map(
                    (
                      child: EpNode,
                      childIndex: number
                    ) =>
                      renderEpNode(
                        child,
                        `${key}-column-${columnIndex}-${childIndex}`,
                        isOverlay,
                        inheritedHAlign,
                        inheritedVAlign
                      )
                  )}
                </EpColumn>
              )
            )}
          </EpColumns>
        );
      }
      case "column":
        return (
          <EpColumn key={key}>
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-column-${index}`,
                  isOverlay,
                  inheritedHAlign,
                  inheritedVAlign
                )
            )}
          </EpColumn>
        );

      case "block": {
        const blockHAlign =
          n.hAlign ?? inheritedHAlign ?? "left";

        const blockVAlign =
          n.vAlign ?? inheritedVAlign ?? "top";

        return (
          <EpBlock
            key={key}
            full={n.full}
            border={n.border}
            hAlign={blockHAlign}
            vAlign={blockVAlign}
          >
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-block-${index}`,
                  isOverlay,
                  blockHAlign,
                  blockVAlign
                )
            )}
          </EpBlock>
        );
      }

      case "text": {
        const effectiveHAlign =
          n.hAlign ??
          n.align ??
          inheritedHAlign ??
          "left";

        const effectiveVAlign =
          n.vAlign ??
          inheritedVAlign ??
          "top";

        const align =
          effectiveHAlign === "center"
            ? "center"
            : effectiveHAlign === "right"
              ? "right"
              : "left";

        const vAlign =
          effectiveVAlign === "center"
            ? "center"
            : undefined;

        return (
          <EpText
            key={key}
            profile={profile}
            size={
              n.size === "large"
                ? "large"
                : n.size === "small"
                  ? "small"
                  : "medium"
            }
            align={align}
            vAlign={vAlign}
            width={
              typeof n.width === "number"
                ? n.width
                : undefined
            }
            height={
              typeof n.height === "number"
                ? n.height
                : undefined
            }
          >
            {n.text ?? ""}
          </EpText>
        );
      }
case "stat": {
  const effectiveHAlign =
    n.hAlign ??
    inheritedHAlign ??
    "right";
                                                                                          
// EpStat supports only "center" and "right".
  const statAlign: "center" | "right" =
    effectiveHAlign === "center"
      ? "center"
      : "right";

  return (
    <EpStat
      key={key}
      value={String(n.value ?? "")}
      label={n.label}
      size={
        n.size === "small"
          ? "small"
          : n.size === "large"
            ? "large"
            : "medium"
      }
      align={statAlign}
      profile={profile}
    />
  );
}
      case "image": {
        if (!n.src) {
          return null;
        }

        const imageSrc = appendCacheVersion(
          n.src,
          imageVersion
        );

        return (
          <EpImage
            key={`${key}-image-${imageVersion}`}
            src={imageSrc}
            isOverlay={isOverlay}
            overlayText={n.overlayText}
            overlayImage={n.overlayImage}
            width={n.width}
            height={n.height}
            fit={
              n.fit ??
              (isOverlay ? "contain" : "cover")
            }
            align={n.align ?? "center"}
          />
        );
      }

      /* =====================================================
         IFRAME
      ===================================================== */

      case "iframe": {
        if (!n.src) {
          console.warn(
            "[PLAYLIST IFRAME] Missing src:",
            n
          );
          return null;
        }

        const resolveDimension = (
          value: any,
          available: number,
          fallback: number
        ): number => {
          if (
            typeof value === "number" &&
            value > 0
          ) {
            return value;
          }

          if (typeof value === "string") {
            const trimmed = value.trim();

            if (trimmed.endsWith("%")) {
              const percentage =
                parseFloat(trimmed) / 100;

              if (
                Number.isFinite(percentage) &&
                percentage > 0
              ) {
                return Math.round(
                  available * percentage
                );
              }
            }

            const numericValue =
              parseFloat(trimmed);

            if (
              Number.isFinite(numericValue) &&
              numericValue > 0
            ) {
              return numericValue;
            }
          }

          return fallback;
        };

        const iframeWidth =
          typeof n.regionBox?.width === "number" &&
          n.regionBox.width > 0
            ? n.regionBox.width
            : resolveDimension(
                n.width,
                orientedDevice.width,
                orientedDevice.width
              );

        const iframeHeight =
          typeof n.regionBox?.height === "number" &&
          n.regionBox.height > 0
            ? n.regionBox.height
            : resolveDimension(
                n.height,
                orientedDevice.height,
                orientedDevice.height
              );

        return (
          <View
            key={key}
            pointerEvents="none"
            style={{
              width: iframeWidth,
              height: iframeHeight,
              overflow: "hidden",
            }}
          >
            <WebView
              source={{ uri: n.src }}
              pointerEvents="none"
              scrollEnabled={false}
              nestedScrollEnabled={false}
              bounces={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
              style={{
                width: iframeWidth,
                height: iframeHeight,
                backgroundColor: "#ffffff",
              }}
              onLoad={() =>
                console.log(
                  "[PLAYLIST IFRAME] Loaded:",
                  n.src
                )
              }
              onError={(event) =>
                console.warn(
                  "[PLAYLIST IFRAME] Error:",
                  event.nativeEvent
                )
              }
              onHttpError={(event) =>
                console.warn(
                  "[PLAYLIST IFRAME] HTTP error:",
                  event.nativeEvent
                )
              }
            />
          </View>
        );
      }

      /* =====================================================
         FOOTER
      ===================================================== */

      case "footer":
        return (
          <View
            key={key}
            className="w-full min-h-[20px] items-center justify-center bg-white"
          >
            {(n.children ?? []).map(
              (child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-footer-${index}`,
                  isOverlay,
                  inheritedHAlign,
                  inheritedVAlign
                )
            )}
          </View>
        );

      /* =====================================================
         UNKNOWN NODE
      ===================================================== */

      default:
        console.warn(
          "[PLAYLIST EP] Unknown node:",
          n.type,
          n
        );

        return null;
    }
  },
  [
    profile,
    orientedDevice,
    imageVersion,
  ]
);

  /* ==========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      Object.values(
        configTimers.current
      ).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading || !plugin) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-[14px] text-[#666666]">
          Loading playground...
        </Text>
      </View>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */


return (
  <SafeAreaView
    className="flex-1 bg-[#f5f5f5] dark:bg-[#111111]"
    edges={["top", "left", "right"]}
  >
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 bg-[#f5f5f5] dark:bg-[#111111]">

        {/* ================= HEADER ================= */}
        <View className="
          min-h-[64px] flex-row items-center
          border-b border-[#dddddd] dark:border-gray-700
          bg-white dark:bg-[#1C1C1E]
          px-4 py-2.5
        ">
          <View className="flex-1 pr-2.5">
            <Text
              bold
              numberOfLines={1}
              className="text-[15px] text-[#111111] dark:text-white"
            >
              {plugin.pluginName}
            </Text>

            <Text
              numberOfLines={1}
              className="mt-[3px] text-[11px] text-[#777777] dark:text-gray-400"
            >
              {plugin.pluginDescription ?? "No description"}
            </Text>
          </View>

          {/* EXECUTE BUTTON */}
          <TouchableOpacity
            onPress={execute}
            disabled={!hasChanges || isExecuting}
            className={`
              h-8 min-w-[80px] items-center justify-center
              rounded-[6px] border border-[#1683ff]
              bg-white dark:bg-[#252527]
              px-3.5
              ${!hasChanges || isExecuting ? "opacity-50" : ""}
            `}
          >
            {isExecuting ? (
              <ActivityIndicator
                color={isDark ? "#60A5FA" : "#1683ff"}
                size="small"
              />
            ) : (
              <Text bold className="text-[12px] text-[#1683ff]">
                Execute
              </Text>
            )}
          </TouchableOpacity>

          {/* UPDATE TO PLAYLIST */}
          {playlistItemId ? (
            <TouchableOpacity
              onPress={handleUpdatePlaylist}
              disabled={isUpdatingPlaylist}
              className={`
                ml-1 h-8 flex-row items-center justify-center
                rounded-[4px] border border-[#1683ff]
                bg-white dark:bg-[#252527]
                px-2
                ${isUpdatingPlaylist ? "opacity-50" : ""}
              `}
            >
              {isUpdatingPlaylist ? (
                <>
                  <ActivityIndicator
                    color={isDark ? "#60A5FA" : "#1683ff"}
                    size="small"
                  />
                  <Text
                    bold
                    className="ml-2 text-[11px] text-[#1683ff]"
                  >
                    Updating...
                  </Text>
                </>
              ) : (
                <Text
                  bold
                  className="text-[11px] text-[#1683ff]"
                >
                  Update to Playlist
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ================= ORIENTATION ================= */}
        {/*
        <View className="
          min-h-[52px] flex-row items-center justify-between
          border-b border-[#dddddd] dark:border-gray-700
          bg-white dark:bg-[#1C1C1E] px-3
        ">
          <View>
            <Text className="font-mono text-[11px] text-[#666666] dark:text-gray-300">
              {orientedDevice.width} × {orientedDevice.height}
            </Text>

            <Text className="mt-[3px] text-[9px] capitalize text-[#999999] dark:text-gray-400">
              {orientation}
            </Text>
          </View>

          <View className="flex-row overflow-hidden rounded-[6px] border border-[#dddddd] dark:border-gray-600">
            <TouchableOpacity
              onPress={() => changeOrientation("landscape")}
              className={`px-2.5 py-1.5 ${
                orientation === "landscape"
                  ? "bg-[#2563eb]"
                  : "bg-white dark:bg-[#252527]"
              }`}
            >
              <Text
                bold
                className={`text-[10px] ${
                  orientation === "landscape"
                    ? "text-white"
                    : "text-[#666666] dark:text-gray-300"
                }`}
              >
                Landscape
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeOrientation("portrait")}
              className={`px-2.5 py-1.5 ${
                orientation === "portrait"
                  ? "bg-[#2563eb]"
                  : "bg-white dark:bg-[#252527]"
              }`}
            >
              <Text
                bold
                className={`text-[10px] ${
                  orientation === "portrait"
                    ? "text-white"
                    : "text-[#666666] dark:text-gray-300"
                }`}
              >
                Portrait
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        */}

        {/* ================= MAIN ================= */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? 24 : 40,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >

          {/* ================= PREVIEW ================= */}
          <View className="
            min-h-[280px] items-center justify-center
            bg-[#e5e5e5] dark:bg-[#252527]
            p-3
          ">
            <Text
              bold
              className="mb-2 self-start text-[13px] text-[#222222] dark:text-white"
            >
              Preview
            </Text>

            {/* DEVICE CANVAS - ALWAYS WHITE */}
            <View
              className="overflow-hidden rounded-[1px] bg-white"
              style={{
                width: scaledWidth,
                height: scaledHeight,
              }}
            >
              <View
                className="overflow-hidden bg-white"
                style={{
                  width: orientedDevice.width,
                  height: orientedDevice.height,
                  transform: [{ scale }],
                  transformOrigin: "top left",
                }}
              >
                {compileError ? (
                  <View className="
                    flex-1 items-center justify-center
                    bg-[#fff5f5] p-5
                  ">
                    <Text
                      bold
                      className="mb-1.5 text-[14px] text-[#dc2626]"
                    >
                      Compile Error
                    </Text>

                    <Text className="text-center text-[11px] text-[#ef4444]">
                      {compileError}
                    </Text>
                  </View>
                ) : epuiTree ? (
                  renderEpNode(epuiTree, "root")
                ) : (
                  <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator
                      color={isDark ? "#60A5FA" : "#2563EB"}
                    />

                    <Text className="mt-2 text-[12px] text-[#999999]">
                      Loading preview...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ================= DEVICES ================= */}
          {/*
          {devices.length > 0 && (
            <View className="
              border-b border-[#dddddd] dark:border-gray-700
              bg-white dark:bg-[#1C1C1E] p-3
            >
              <Text
                bold
                className="mb-2.5 text-[12px] uppercase text-[#555555] dark:text-gray-300"
              >
                Devices
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {devices.map((item) => (
                  <TouchableOpacity
                    key={item.displayId}
                    onPress={() => changeDevice(item)}
                    className="
                      mr-2 rounded-[6px]
                      border border-[#dddddd] dark:border-gray-600
                      bg-white dark:bg-[#252527]
                      px-3 py-2
                    "
                  >
                    <Text bold className="text-[11px] text-[#222222] dark:text-white">
                      {item.modelNo}
                    </Text>

                    <Text className="mt-[3px] text-[10px] text-[#888888] dark:text-gray-400">
                      {item.displayResolutionWidth} × {item.displayResolutionHeight}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          */}

          {/* ================= SETTINGS ================= */}
          <View className="
            bg-white dark:bg-[#1C1C1E]
            p-3
          ">
            <Text
              bold
              className="
                mb-2.5 text-[12px] uppercase
                text-[#555555] dark:text-gray-300
              "
            >
              Settings
            </Text>

            {playgroundInstances.map((instance) => (
              <ConnectorCard
                key={instance.id}
                mode="playground"
                sessionId={playgroundSessionId ?? ""}
                instance={instance}
                connectors={connectors}
                openInstanceId={openInstanceId}
                setOpenInstanceId={setOpenInstanceId}
                onStartOAuth={startOAuth}
                onConfigChange={updateConnector}
                onDisconnect={disconnect}
                cropAspect={deviceWidth / deviceHeight}
              />
            ))}

            {playgroundInstances.length === 0 && (
              <Text className="
                py-5 text-center text-[11px]
                text-[#999999] dark:text-gray-400
              ">
                No settings configured
              </Text>
            )}
          </View>

          {/* ================= DATA CONTEXT ================= */}
          {/*
          <Pressable
            onPress={() =>
              setDataContextExpanded((value) => !value)
            }
            className="
              min-h-[46px] flex-row items-center
              border-b border-t border-[#dddddd] dark:border-gray-700
              bg-white dark:bg-[#1C1C1E] px-3
            "
          >
            <Text
              bold
              className="text-[12px] uppercase text-[#555555] dark:text-gray-300"
            >
              Data Context
            </Text>

            <Text className="ml-auto text-[11px] text-[#777777] dark:text-gray-400">
              {dataContextExpanded ? "▲" : "▼"}
            </Text>
          </Pressable>
          */}

          {dataContextExpanded && (
            <ScrollView
              horizontal
              className="max-h-[350px] bg-[#111111] p-3"
            >
              <Text className="font-mono text-[10px] text-[#eeeeee]">
                {JSON.stringify(dataContext, null, 2)}
              </Text>
            </ScrollView>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

}