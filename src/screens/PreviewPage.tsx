import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "nativewind";
import SelectFrameModal, {
  type SelectedFrame,
} from "../modal/SelectFrameModal";
import PlaylistItemModal from "../modal/PlaylistItemModal";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Platform,
  View,
  Keyboard,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import Text from "../components/AppText";
import { WebView } from "react-native-webview";
import { Liquid } from "liquidjs";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  EpCanvas,
  EpRow,
  EpBlock,
  EpText,
  EpStat,
  EpColumn,
  EpColumns,
  EpImage,
} from "../ep-ui";
import type { EpNode } from "../../packages/ltag";
import { compileLTHtml } from "../../packages/ltag/compile/compiler";
import { resolveLayout } from "../../packages/ltag/resolve/resolveLayout";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { useNavigation } from "@react-navigation/native";

import {
  DEFAULT_DEVICE_PROFILE,
  LTDP75BW_800x480,
  E6_73IN_800x480,
  E6_13IN_1200x1600,
} from "../../packages/ltag/device";
import type { DeviceProfile } from "../../packages/ltag/device";
import api from "../lib/api";
import { ConnectorCard } from "../modal/ConnectorCard";

const OAUTH_REDIRECT = "myapp://oauth";

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

const normalizeInstanceKey = (key: string = "") =>
  key
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^[^a-zA-Z]+/, "");

function appendCacheVersion(src: string, version: number) {
  if (!src || !version) {
    return src;
  }

  if (src.startsWith("data:")) {
    return src;
  }

  return `${src}${src.includes("?") ? "&" : "?"}v=${version}`;
}

function normalizeExecutionContext(raw: any): Record<string, any> {
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

    raw.forEach((item: any) => {
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

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (value.data && typeof value.data === "object") {
          value = value.data;
        } else if (value.result && typeof value.result === "object") {
          value = value.result;
        }
      }

      if (key) {
        context[normalizeInstanceKey(String(key))] = value ?? {};
        return;
      }

      if (typeof item === "object" && !Array.isArray(item)) {
        const itemKeys = Object.keys(item);

        const looksLikeContext =
          itemKeys.length > 0 &&
          itemKeys.some(
            (itemKey) =>
              item[itemKey] && typeof item[itemKey] === "object"
          );

        if (looksLikeContext) {
          Object.assign(context, item);
          return;
        }
      }
    });

    return context;
  }

  return {};
}

export default function PluginPlaygroundScreen({ route }: Props) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
const { colorScheme } = useColorScheme();
const isDark = colorScheme === "dark";
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );

    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const pluginId = route?.params?.pluginId;
  const playlistItemId = route?.params?.playlistItemId;

  const { width: screenWidth, height: screenHeight } =
    useWindowDimensions();

  const engine = useMemo(() => new Liquid(), []);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [showFrameSelect, setShowFrameSelect] = useState(false);
  const [showPlaylistItem, setShowPlaylistItem] = useState(false);
  const [selectedFrame, setSelectedFrame] =
    useState<SelectedFrame | null>(null);

  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  const [playgroundInstances, setPlaygroundInstances] = useState<
    PlaygroundInstance[]
  >([]);

  const [playgroundSessionId, setPlaygroundSessionId] = useState<
    string | null
  >(null);

  const [playgroundExecutionData, setPlaygroundExecutionData] =
    useState<any>(null);

  const [devices, setDevices] = useState<DisplayInfo[]>([]);
  const [device, setDevice] = useState<DisplayInfo | null>(null);

  const [currentDeviceProfile, setCurrentDeviceProfile] =
    useState<DeviceProfile>(DEFAULT_DEVICE_PROFILE);

  const [epuiTree, setEpuiTree] = useState<EpNode | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  const [openInstanceId, setOpenInstanceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (playgroundInstances.length > 0) {
      setOpenInstanceId((currentId) => {
        // Keep the current dropdown open if it still exists.
        if (
          currentId &&
          playgroundInstances.some((instance) => instance.id === currentId)
        ) {
          return currentId;
        }

        // Open the first connector by default.
        return playgroundInstances[0].id;
      });
    }
  }, [playgroundInstances]);

  const [hasChanges, setHasChanges] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isUpdatingPlaylist, setIsUpdatingPlaylist] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [dataContextExpanded] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  const [previewViewport, setPreviewViewport] = useState({
    width: 0,
    height: 0,
  });

  const configTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  const compileRequestRef = useRef(0);

  // OAuth tracking
  const oauthInFlightRef = useRef(false);
  const isRefreshingOAuthRef = useRef(false);

  const deviceWidth = currentDeviceProfile.canvasWidth;
  const deviceHeight = currentDeviceProfile.canvasHeight;

  const getDeviceProfile = useCallback(
    (display: DisplayInfo): DeviceProfile => {
      const model = (display.modelNo ?? "")
        .toUpperCase()
        .replace(/\s/g, "");

      if (model.includes("LTDP75BW")) {
        return LTDP75BW_800x480;
      }

      if (model.includes("E6_73") || model.includes("E673")) {
        return E6_73IN_800x480;
      }

      if (model.includes("E6_13") || model.includes("E613")) {
        return E6_13IN_1200x1600;
      }

      if (
        display.displayResolutionWidth === 1200 &&
        display.displayResolutionHeight === 1600
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

    setPreviewViewport({ width: 0, height: 0 });

    const profile = getDeviceProfile(device);

    setCurrentDeviceProfile(profile);
    setImageVersion((value) => value + 1);
  }, [device, getDeviceProfile]);

  const loadDevices = useCallback(async () => {
    try {
      const response = await api.get<DisplayInfo[]>("/device/display-infos");

      const list = response.data ?? [];

      setDevices(list);

      if (list.length > 0) {
        setDevice(list[0]);
      }
    } catch (error: any) {
      console.error("DEVICE LOAD ERROR:", error?.response?.data ?? error);

      Alert.alert("Error", "Failed to load devices.");
    }
  }, []);

  const loadPlugin = useCallback(async () => {
    const response = await api.get<Plugin>(`/plugin/${pluginId}`);

    setPlugin(response.data);
  }, [pluginId]);

  const loadConnectors = useCallback(async () => {
    const response = await api.get<Connector[]>(
      "/test/data-connectors/connectors"
    );

    setConnectors(response.data ?? []);
  }, []);

  const createPlaygroundSession = useCallback(async () => {
    const response = await api.post<PlaygroundSessionResponse>(
      `/playground/${pluginId}/create-session`
    );

    return response.data.session;
  }, [pluginId]);

  const refreshPlaygroundSession = useCallback(async () => {
    const response = await api.get<{ id: string }>(
      `/playground/${pluginId}/refresh`
    );

    return response.data;
  }, [pluginId]);

  const loadPlaygroundConnectors = useCallback(
    async (sessionId: string) => {
      const response = await api.get<PlaygroundInstance[]>(
        `/playground/${sessionId}/connectors`
      );

      const list = response.data ?? [];

      setPlaygroundInstances(list);

      return list;
    },
    []
  );

  const playgroundExecution = useCallback(async (sessionId: string) => {
    const response = await api.get<any>(
      `/execution/playground/${sessionId}`
    );

    const executionData = response.data;

    setPlaygroundExecutionData(executionData);

    return executionData;
  }, []);

  const loadPlaylistPlayground = useCallback(
    async (itemId: string) => {
      const response = await api.get<PlaylistPlaygroundResponse>(
        `/playlist/${itemId}/get-playground`
      );

      const data = response.data;

      setPlaygroundSessionId(data.playgroundSessionId);

      setPlaygroundInstances(data.playgroundConnectorConfigs ?? []);

      setPlaygroundExecutionData(null);

      await playgroundExecution(data.playgroundSessionId);

      return data;
    },
    [playgroundExecution]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        await Promise.all([loadPlugin(), loadConnectors(), loadDevices()]);

        if (cancelled) {
          return;
        }

        if (playlistItemId) {
          await loadPlaylistPlayground(playlistItemId);
        } else {
          const session = await createPlaygroundSession();

          if (cancelled) {
            return;
          }

          setPlaygroundSessionId(session.id);

          await loadPlaygroundConnectors(session.id);

          await playgroundExecution(session.id);
        }
      } catch (error: any) {
        console.error(
          "PLUGIN PLAYGROUND LOAD ERROR:",
          error?.response?.data ?? error
        );

        Alert.alert(
          "Error",
          error?.response?.data?.message ?? "Failed to load PluginIDE."
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

  const dataContext = useMemo(
    () => normalizeExecutionContext(playgroundExecutionData),
    [playgroundExecutionData]
  );

  useEffect(() => {
    if (!plugin) {
      return;
    }

    if (!plugin.pluginCode) {
      setEpuiTree(null);
      return;
    }

    const requestId = ++compileRequestRef.current;

    const compile = async () => {
      try {
        setCompileError(null);

        const html = await engine.parseAndRender(
          plugin.pluginCode,
          dataContext
        );

        if (requestId !== compileRequestRef.current) {
          return;
        }

        const rawTree = compileLTHtml(html);

        if (requestId !== compileRequestRef.current) {
          return;
        }

        const resolvedTree = resolveLayout(rawTree, currentDeviceProfile);

        if (requestId !== compileRequestRef.current) {
          return;
        }

        setEpuiTree(resolvedTree);
      } catch (error: any) {
        console.error("EP COMPILE ERROR:", error);

        setCompileError(error?.message ?? "Failed to compile plugin.");
        setEpuiTree(null);
      }
    };

    compile();
  }, [plugin, dataContext, engine, currentDeviceProfile]);

  const executePlayground = useCallback(async () => {
    if (!playgroundSessionId) {
      return;
    }

    try {
      setIsExecuting(true);

      const session = await refreshPlaygroundSession();

      const [executionData, updatedInstances] = await Promise.all([
        playgroundExecution(session.id),
        loadPlaygroundConnectors(session.id),
      ]);

      setPlaygroundSessionId(session.id);
      setPlaygroundExecutionData(executionData);
      setPlaygroundInstances(updatedInstances);

      setHasChanges(false);
      setImageVersion((value) => value + 1);
    } catch (error: any) {
      console.error("[EXECUTE] Failed:", error?.response?.data ?? error);

      Alert.alert(
        "Execution failed",
        error?.response?.data?.message ?? "Failed to execute playground."
      );
    } finally {
      setIsExecuting(false);
    }
  }, [
    playgroundSessionId,
    refreshPlaygroundSession,
    playgroundExecution,
    loadPlaygroundConnectors,
  ]);

  const updatePlaygroundInstanceConfig = useCallback(
    (instanceId: string, config: Record<string, any>) => {
      setPlaygroundInstances((previous) =>
        previous.map((instance) =>
          instance.id === instanceId ? { ...instance, config } : instance
        )
      );

      setHasChanges(true);

      const oldTimer = configTimers.current[instanceId];

      if (oldTimer) {
        clearTimeout(oldTimer);
      }

      configTimers.current[instanceId] = setTimeout(async () => {
        if (!playgroundSessionId) {
          return;
        }

        try {
          await api.patch(
            `/playground/${playgroundSessionId}/connector-instance/${instanceId}`,
            { config }
          );
        } catch (error: any) {
          console.error(
            "CONFIG UPDATE ERROR:",
            error?.response?.data ?? error
          );

          Alert.alert(
            "Error",
            error?.response?.data?.message ?? "Failed to update connector."
          );
        }
      }, 400);
    },
    [playgroundSessionId]
  );

  /* =========================================================
     OAUTH
  ========================================================= */

  const refreshAfterOAuth = useCallback(async () => {
    const session = await refreshPlaygroundSession();

    await Promise.all([
      playgroundExecution(session.id),
      loadPlaygroundConnectors(session.id),
    ]);

    setPlaygroundSessionId(session.id);

    // Same as web: lets Execute reflect the change.
    setHasChanges(true);
    setImageVersion((value) => value + 1);
  }, [
    refreshPlaygroundSession,
    playgroundExecution,
    loadPlaygroundConnectors,
  ]);
 
  const finishOAuth = useCallback(
    async (silent = false) => {
      if (isRefreshingOAuthRef.current) {
        return;
      }

      isRefreshingOAuthRef.current = true;

      try {
        try {
          InAppBrowser.closeAuth();
        } catch {
        }
        await refreshAfterOAuth();
        if (!silent) {
          Alert.alert("Connected", "Account connected successfully.");
        }
      } catch (error: any) {
        console.error(
          "[OAUTH RETURN] Refresh failed:",
          error?.response?.data ?? error
        );
        if (!silent) {
          Alert.alert(
            "OAuth",
            "Connected, but failed to refresh the preview."
          );
        }
      } finally {
        oauthInFlightRef.current = false;
        isRefreshingOAuthRef.current = false;
      }
    },
    [refreshAfterOAuth]
  );

const startOAuth = useCallback(
  async (instanceId: string, provider: "google" | "notion") => {
    let pollId: ReturnType<typeof setInterval> | null = null;
    let connected = false;

    try {
      const response = await api.post<{ url: string }>(
        `/playground/connector/${instanceId}/oauth/connect`,
        { origin: OAUTH_REDIRECT }
      );
      const authUrl = response.data?.url;
      if (!authUrl) throw new Error("OAuth URL was not returned.");
      oauthInFlightRef.current = true;
      if (!(await InAppBrowser.isAvailable())) {
        await Linking.openURL(authUrl);
        return;
      }
      // Poll while the sheet is open; close it once the token exists.
      if (playgroundSessionId) {
        pollId = setInterval(async () => {
          try {
            const res = await api.get<PlaygroundInstance[]>(
              `/playground/${playgroundSessionId}/connectors`
            );
            const inst = res.data?.find((i) => i.id === instanceId);
            if (inst?.oauthTokenId) {
              connected = true;
              if (pollId) clearInterval(pollId);
              pollId = null;
              InAppBrowser.closeAuth();
            }
          } catch {
            // ignore and try again on the next tick
          }
        }, 2000);
      }
      const result = await InAppBrowser.openAuth(authUrl, OAUTH_REDIRECT, {
        ephemeralWebSession: false,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        showInRecents: false,
        forceCloseOnRedirection: true,
      });

      // success = redirect caught; cancel = closed by user or by our poll.
      await finishOAuth(result.type === "success" ? false : !connected);
    } catch (error: any) {
      oauthInFlightRef.current = false;
      console.error("OAUTH ERROR:", error?.response?.data ?? error);
      Alert.alert(
        "OAuth failed",
        error?.response?.data?.message ?? `Failed to connect ${provider}.`
      );
    } finally {
      if (pollId) clearInterval(pollId);
    }
  },
  [finishOAuth, playgroundSessionId]
);

  // Deep link: myapp://oauth (Android delivers the redirect here)
  useEffect(() => {
  const handleDeepLink = ({ url }: { url: string }) => {
  if (!url?.startsWith(OAUTH_REDIRECT)) return;
  const success = url.includes("success=true");
  if (!success) {
    oauthInFlightRef.current = false;
    try { InAppBrowser.closeAuth(); } catch {}
    return;
  }

  void finishOAuth(false);
};
    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      })
      .catch((error) => {
        console.error("[OAUTH RETURN] Could not read initial URL:", error);
      });
    return () => {
      subscription.remove();
    };
  }, [finishOAuth]);

  // Fallback: app returns to foreground while OAuth was pending
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !oauthInFlightRef.current) {
        return;
      }

      // Give the deep link a moment to arrive first.
      setTimeout(() => {
        if (oauthInFlightRef.current) {
          void finishOAuth(true);
        }
      }, 1500);
    });

    return () => {
      subscription.remove();
    };
  }, [finishOAuth]);

  const handleUpdatePlaylist = useCallback(async () => {
    if (!playlistItemId) {
      Alert.alert("Error", "Playlist item not found.");
      return;
    }

    try {
      setIsUpdatingPlaylist(true);

      await api.post(`/playlist/item/${playlistItemId}/sync-connectors`);

      Alert.alert("Success", "Playlist updated successfully.");
    } catch (error: any) {
      console.error(
        "PLAYLIST UPDATE ERROR:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ?? "Failed to update playlist."
      );
    } finally {
      setIsUpdatingPlaylist(false);
    }
  }, [playlistItemId]);

  const renderEpNode = useCallback(
    (
      node: EpNode,
      key?: string | number,
      inheritedHAlign?: "left" | "center" | "right",
      inheritedVAlign?: "top" | "center" | "bottom",
      isOverlay: boolean = false
    ): React.ReactNode => {
      if (!node) {
        return null;
      }

      const n = node as any;

      switch (n.type) {
        case "canvas":
          return (
            <EpCanvas
              key={key}
              full={n.full}
              profile={currentDeviceProfile}
              overlay={
                Array.isArray(n.overlay)
                  ? n.overlay.map((child: EpNode, index: number) =>
                      renderEpNode(
                        child,
                        `${key}-overlay-${index}`,
                        undefined,
                        undefined,
                        true
                      )
                    )
                  : undefined
              }
            >
              {(n.children ?? []).map((child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-child-${index}`,
                  undefined,
                  undefined,
                  false
                )
              )}
            </EpCanvas>
          );

        case "row":
          return (
            <EpRow key={key}>
              {(n.children ?? []).map((child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-row-${index}`,
                  inheritedHAlign,
                  inheritedVAlign,
                  isOverlay
                )
              )}
            </EpRow>
          );

        case "columns": {
          const columns: EpNode[][] = Array.isArray(n.columns)
            ? n.columns
            : [];

          if (columns.length === 0) {
            return null;
          }

          return (
            <EpColumns key={key} columns={columns.length}>
              {columns.map((column: EpNode[], columnIndex: number) => (
                <EpColumn key={`${key}-column-${columnIndex}`}>
                  {column.map((child: EpNode, childIndex: number) =>
                    renderEpNode(
                      child,
                      `${key}-column-${columnIndex}-${childIndex}`,
                      inheritedHAlign,
                      inheritedVAlign,
                      isOverlay
                    )
                  )}
                </EpColumn>
              ))}
            </EpColumns>
          );
        }

        case "column":
          return (
            <EpColumn key={key}>
              {(n.children ?? []).map((child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-column-${index}`,
                  inheritedHAlign,
                  inheritedVAlign,
                  isOverlay
                )
              )}
            </EpColumn>
          );

        case "block": {
          const blockHAlign = n.hAlign ?? "left";
          const blockVAlign = n.vAlign ?? "top";

          return (
            <EpBlock
              key={key}
              full={n.full}
              border={n.border}
              hAlign={blockHAlign}
              vAlign={blockVAlign}
            >
              {(n.children ?? []).map((child: EpNode, index: number) =>
                renderEpNode(
                  child,
                  `${key}-block-${index}`,
                  blockHAlign,
                  blockVAlign,
                  isOverlay
                )
              )}
            </EpBlock>
          );
        }

        case "iframe": {
          if (!n.src) {
            console.warn("[MOBILE IFRAME] No src found", n);
            return null;
          }

          const canvasWidth = Number(currentDeviceProfile.canvasWidth);
          const canvasHeight = Number(currentDeviceProfile.canvasHeight);

          const resolveDimension = (
            value: any,
            available: number,
            fallback: number
          ) => {
            if (typeof value === "number" && value > 0) {
              return value;
            }

            if (typeof value === "string") {
              const valueString = value.trim();

              if (valueString.endsWith("%")) {
                const percentage = parseFloat(valueString) / 100;

                if (Number.isFinite(percentage) && percentage > 0) {
                  return Math.round(available * percentage);
                }
              }

              const numericValue = parseFloat(valueString);

              if (Number.isFinite(numericValue) && numericValue > 0) {
                return numericValue;
              }
            }

            return fallback;
          };

          const iframeWidth =
            typeof n.regionBox?.width === "number" && n.regionBox.width > 0
              ? n.regionBox.width
              : resolveDimension(n.width, canvasWidth, canvasWidth);

          const iframeHeight =
            typeof n.regionBox?.height === "number" &&
            n.regionBox.height > 0
              ? n.regionBox.height
              : resolveDimension(n.height, canvasHeight, canvasHeight);

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
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={["*"]}
                mixedContentMode="always"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                automaticallyAdjustContentInsets={false}
                style={{
                  width: iframeWidth,
                  height: iframeHeight,
                  backgroundColor: "#ffffff",
                }}
                onError={(event) => {
                  console.log("[MOBILE IFRAME] ERROR", event.nativeEvent);
                }}
                onHttpError={(event) => {
                  console.log(
                    "[MOBILE IFRAME] HTTP ERROR",
                    event.nativeEvent
                  );
                }}
              />
            </View>
          );
        }

        case "image": {
          const imageSrc = appendCacheVersion(n.src, imageVersion);

          return (
            <EpImage
              key={`${key}-${imageVersion}`}
              src={imageSrc}
              isOverlay={isOverlay}
              overlayText={n.overlayText}
              width={n.width}
              height={n.height}
              fit={n.fit ?? (isOverlay ? "contain" : "cover")}
              align={n.align ?? "center"}
            />
          );
        }

        case "text": {
          const effectiveHAlign = n.hAlign ?? inheritedHAlign ?? "left";
          const effectiveVAlign = n.vAlign ?? inheritedVAlign ?? "top";

          const align =
            effectiveHAlign === "center"
              ? "center"
              : effectiveHAlign === "right"
                ? "right"
                : "left";

          const vAlign = effectiveVAlign === "center" ? "center" : undefined;

          return (
            <EpText
              key={key}
              profile={currentDeviceProfile}
              size={
                n.size === "large"
                  ? "large"
                  : n.size === "small"
                    ? "small"
                    : "medium"
              }
              align={align}
              vAlign={vAlign}
              width={typeof n.width === "number" ? n.width : undefined}
              height={typeof n.height === "number" ? n.height : undefined}
            >
              {n.text ?? ""}
            </EpText>
          );
        }

        case "stat": {
          const statAlign =
            n.hAlign === "center" || inheritedHAlign === "center"
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
              profile={currentDeviceProfile}
            />
          );
        }

        case "footer":
          return (
            <View
              key={key}
              className="w-full min-h-[20px] justify-center items-center bg-white"
            >
              {(n.children ?? []).map((child: EpNode, index: number) =>
                renderEpNode(child, `${key}-footer-${index}`)
              )}
            </View>
          );

        default:
          console.warn("[MOBILE EP] Unknown node:", n.type);
          return null;
      }
    },
    [currentDeviceProfile, imageVersion]
  );

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
      ? Math.min(previewWidth / deviceWidth, previewHeight / deviceHeight, 1)
      : 1;

  const scaledWidth = deviceWidth * scale;
  const scaledHeight = deviceHeight * scale;

  useEffect(() => {
    return () => {
      Object.values(configTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  if (loading || !plugin) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f5f5]">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-[#666666] text-sm">
          Loading PluginIDE...
        </Text>
      </View>
    );
  }

 
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
          min-h-[64px] px-3.5 py-2.5
          bg-white dark:bg-[#1C1C1E]
          border-b border-[#e5e5e5] dark:border-gray-700
          flex-row items-center
        ">
          <View className="flex-1 pr-2">
            <Text
              bold
              numberOfLines={1}
              className="text-[15px] text-[#111111] dark:text-white"
            >
              {plugin.pluginName}
            </Text>

            <Text
              numberOfLines={1}
              className="mt-0.5 text-[11px] text-[#777777] dark:text-gray-400"
            >
              {plugin.pluginDescription ?? "No description"}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 p-3">

            {/* EXECUTE */}
            <Pressable
              disabled={!hasChanges || isExecuting}
              onPress={executePlayground}
              className={`
                h-9 px-3 rounded-lg border border-[#1683ff]
                items-center justify-center
                bg-white dark:bg-[#1C1C1E]
                ${!hasChanges || isExecuting ? "opacity-45" : ""}
              `}
            >
              {isExecuting ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#60A5FA" : "#1683ff"}
                />
              ) : (
                <Text bold className="text-xs text-[#1683ff]">
                  Execute
                </Text>
              )}
            </Pressable>

            {/* UPDATE TO PLAYLIST */}
            {playlistItemId ? (
              <Pressable
                disabled={isUpdatingPlaylist}
                onPress={handleUpdatePlaylist}
                className={`
                  h-9 px-3 rounded-lg items-center justify-center
                  border border-[#1683ff] bg-[#1683ff]
                  ${isUpdatingPlaylist ? "opacity-45" : ""}
                `}
              >
                {isUpdatingPlaylist ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <Text bold className="text-xs text-white">
                    Update to Playlist
                  </Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowFrameSelect(true)}
                className="
                  h-9 flex-row items-center justify-center
                  rounded-lg border border-[#1683ff]
                  bg-white dark:bg-[#1C1C1E]
                  px-3
                "
              >
                <Text bold className="text-xs text-[#1683ff]">
                  + Add to Playlist
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ================= DEVICE SELECTOR ================= */}
        <View className="
          min-h-[52px] px-3.5 py-2
          bg-white dark:bg-[#1C1C1E]
          border-b border-[#e5e5e5] dark:border-gray-700
          relative z-[100]
        ">
          <Pressable
            onPress={() => setShowDeviceSelector((value) => !value)}
            className="
              self-start min-h-[34px] px-3
              border border-[#dddddd] dark:border-gray-600
              rounded-lg flex-row items-center
              bg-white dark:bg-[#252527]
            "
          >
            <Text bold className="text-xs text-[#222222] dark:text-white">
              {device?.modelNo ?? "Device"}
            </Text>

            <Text className="ml-2 text-[10px] text-[#888888] dark:text-gray-400">
              {device
                ? `${device.displayResolutionWidth}×${device.displayResolutionHeight}`
                : ""}
            </Text>
          </Pressable>

          {/* DEVICE DROPDOWN */}
          {showDeviceSelector ? (
            <View
              className="
                absolute left-3.5 top-[46px] w-[220px]
                bg-white dark:bg-[#252527]
                rounded-[10px]
                border border-[#dddddd] dark:border-gray-600
                z-[999]
              "
              style={{
                elevation: 8,
                shadowColor: "#000000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {devices.map((item) => {
                const selected =
                  item.displayId === device?.displayId;

                return (
                  <Pressable
                    key={item.displayId}
                    onPress={() => {
                      setDevice(item);
                      setShowDeviceSelector(false);
                    }}
                    className={`
                      px-3.5 py-2.5
                      border-b border-[#eeeeee] dark:border-gray-700
                      ${selected
                        ? "bg-[#eef5ff] dark:bg-[#1e3a5f]"
                        : ""
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-xs font-semibold
                        ${selected
                          ? "text-[#2563eb] dark:text-blue-400"
                          : "text-[#333333] dark:text-gray-200"
                        }
                      `}
                    >
                      {item.modelNo}
                    </Text>

                    <Text className="mt-0.5 text-[10px] text-[#888888] dark:text-gray-400">
                      {item.displayResolutionWidth}×
                      {item.displayResolutionHeight}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* ================= BODY ================= */}
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
          <View className="p-3">
            <Text bold className="
              mb-2 text-[13px]
              text-[#222222] dark:text-white
            ">
              Preview
            </Text>

            <View
              onLayout={(event) => {
                const { width, height } =
                  event.nativeEvent.layout;

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
              className="
                w-full
                bg-[#e9e9e9] dark:bg-[#252527]
                items-center justify-center
                overflow-hidden
                border border-[#dddddd] dark:border-gray-700
              "
              style={{
                aspectRatio:
                  deviceWidth > 0 && deviceHeight > 0
                    ? deviceWidth / deviceHeight
                    : 1,
              }}
            >
              {/* SCALED PREVIEW */}
              <View
                className="absolute left-0 top-0 bg-white overflow-hidden"
                style={{
                  width: scaledWidth,
                  height: scaledHeight,
                }}
              >
                {/* ACTUAL DEVICE CANVAS */}
                <View
                  className="overflow-hidden"
                  style={{
                    width: deviceWidth,
                    height: deviceHeight,
                    transform: [{ scale }],
                    transformOrigin: "top left",
                  }}
                >
                  {compileError ? (
                    <View className="
                      flex-1 p-5 items-center justify-center
                      bg-[#fff5f5]
                    ">
                      <Text className="text-[#dc2626] text-xs text-center">
                        {compileError}
                      </Text>
                    </View>
                  ) : epuiTree ? (
                    renderEpNode(epuiTree, "root")
                  ) : (
                    <View className="
                      flex-1 items-center justify-center
                      bg-white
                    ">
                      <Text className="text-[#888888] text-xs">
                        Rendering preview...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* ================= SETTINGS ================= */}
          <View className="px-3 pb-3">
            <Text className="
              mb-2 text-[13px] font-bold
              text-[#222222] dark:text-white
            ">
              Settings
            </Text>

            {playgroundInstances.length === 0 ? (
              <View className="
                p-5 rounded-[10px]
                bg-white dark:bg-[#1C1C1E]
                border border-gray-200 dark:border-gray-700
                items-center
              ">
                <Text className="text-[#888888] dark:text-gray-400 text-xs">
                  No connectors
                </Text>
              </View>
            ) : (
              playgroundInstances.map((instance) => (
                <ConnectorCard
                  key={instance.id}
                  sessionId={playgroundSessionId ?? ""}
                  mode="playground"
                  instance={instance}
                  connectors={connectors}
                  openInstanceId={openInstanceId}
                  setOpenInstanceId={setOpenInstanceId}
                  onStartOAuth={startOAuth}
                  onConfigChange={updatePlaygroundInstanceConfig}
                  onDisconnect={async () => {
                    // ConnectorCard already called the detach API.
                    // Refresh instances so the card updates.
                    try {
                      await loadPlaygroundConnectors(
                        playgroundSessionId!
                      );

                      setHasChanges(true);
                    } catch (error: any) {
                      console.error(
                        "[OAUTH] Disconnect refresh failed:",
                        error?.response?.data ?? error
                      );

                      Alert.alert(
                        "Disconnect failed",
                        error?.response?.data?.message ??
                          "Unable to refresh after disconnect."
                      );
                    }
                  }}
                  cropAspect={
                    device
                      ? device.displayResolutionWidth /
                        device.displayResolutionHeight
                      : 1
                  }
                />
              ))
            )}
          </View>

          {/* ================= DATA CONTEXT ================= */}
          {dataContextExpanded ? (
            <ScrollView
              horizontal
              className="
                max-h-[300px]
                bg-[#111111] dark:bg-black
                p-3
              "
            >
              <Text
                className="text-[#eeeeee] text-[10px]"
                style={{ fontFamily: "monospace" }}
              >
                {JSON.stringify(dataContext, null, 2)}
              </Text>
            </ScrollView>
          ) : null}
        </ScrollView>

        {/* ================= SELECT FRAME MODAL ================= */}
        <SelectFrameModal
          open={showFrameSelect}
          onClose={() => setShowFrameSelect(false)}
          onContinue={(selection) => {
            setSelectedFrame(selection);
            setShowFrameSelect(false);
            setShowPlaylistItem(true);
          }}
        />

        {/* ================= PLAYLIST ITEM MODAL ================= */}
        {selectedFrame && plugin && (
          <PlaylistItemModal
            open={showPlaylistItem}
            onClose={() => {
              setShowPlaylistItem(false);
            }}
            pluginName={plugin.pluginName}
            plugin={plugin}
            selectedItem={null}
            frameId={selectedFrame.frameId}
            onSaved={() => {
              const frameId = selectedFrame.frameId;

              setShowPlaylistItem(false);
              setShowFrameSelect(false);
              setSelectedFrame(null);
              navigation.navigate("PlayList", {
                id: String(frameId),
              });
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}