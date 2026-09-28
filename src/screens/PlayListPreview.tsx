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
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import WebView from "react-native-webview";

import { Liquid } from "liquidjs";

import { EpImage } from "../ep-ui";

import type { EpNode } from "../../packages/ltag";

import {
  compileLTHtml,
} from "../../packages/ltag/compile/compiler";

import {
  resolveLayout,
} from "../../packages/ltag/resolve/resolveLayout";

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

import {
  ConnectorCard,
  type PluginInstance,
} from "../modal/ConnectorCard";

/* ============================================================
   TYPES
============================================================ */

type Orientation =
  | "landscape"
  | "portrait";

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

  playgroundConnectorConfigs:
    PluginInstance[];

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

const normalizeInstanceKey = (
  key: string = ""
) =>
  key
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^[^a-zA-Z]+/, "");

const appendCacheVersion = (
  src: string,
  version: number
) => {
  if (!src || !version) {
    return src;
  }

  return `${src}${
    src.includes("?")
      ? "&"
      : "?"
  }v=${version}`;
};

const getDefaultOrientation = (
  width: number,
  height: number
): Orientation =>
  width >= height
    ? "landscape"
    : "portrait";

const getOrientedDimensions = (
  width: number,
  height: number,
  orientation: Orientation
) => {
  const max = Math.max(
    width,
    height
  );

  const min = Math.min(
    width,
    height
  );

  if (
    orientation ===
    "landscape"
  ) {
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
  const dimensions =
    getOrientedDimensions(
      baseProfile.canvasWidth,
      baseProfile.canvasHeight,
      orientation
    );

  return {
    ...baseProfile,

    canvasWidth:
      dimensions.width,

    canvasHeight:
      dimensions.height,
  };
};

/* ============================================================
   EXECUTION CONTEXT NORMALIZER

   Backend may return:

   {
     rss: {
       title: "...",
       items: []
     }
   }

   OR:

   [
     {
       instanceKey: "rss",
       result: {
         title: "...",
         items: []
       }
     }
   ]

   Liquid should receive:

   {
     rss: {
       title: "...",
       items: []
     }
   }
============================================================ */

function normalizeExecutionContext(
  raw: any
): Record<string, any> {
  if (!raw) {
    return {};
  }

  /* ----------------------------------------------------------
     Already an object
  ---------------------------------------------------------- */

  if (
    !Array.isArray(raw) &&
    typeof raw === "object"
  ) {
    if (
      raw.data &&
      typeof raw.data ===
        "object" &&
      !Array.isArray(raw.data)
    ) {
      return raw.data;
    }

    if (
      raw.result &&
      typeof raw.result ===
        "object" &&
      !Array.isArray(raw.result)
    ) {
      if (
        raw.result.data &&
        typeof raw.result.data ===
          "object" &&
        !Array.isArray(
          raw.result.data
        )
      ) {
        return raw.result.data;
      }

      return raw.result;
    }

    return raw;
  }

  /* ----------------------------------------------------------
     Array response
  ---------------------------------------------------------- */

  if (Array.isArray(raw)) {
    const context: Record<
      string,
      any
    > = {};

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
          typeof value ===
            "object" &&
          !Array.isArray(value)
        ) {
          if (
            value.data &&
            typeof value.data ===
              "object" &&
            !Array.isArray(
              value.data
            )
          ) {
            value =
              value.data;
          } else if (
            value.result &&
            typeof value.result ===
              "object" &&
            !Array.isArray(
              value.result
            )
          ) {
            value =
              value.result;
          }
        }

        if (key) {
          context[
            normalizeInstanceKey(
              String(key)
            )
          ] =
            value ?? {};

          return;
        }

        if (
          typeof item ===
            "object" &&
          !Array.isArray(item)
        ) {
          const keys =
            Object.keys(item);

          const looksLikeContext =
            keys.length > 0 &&
            keys.some(
              (itemKey) =>
                item[itemKey] &&
                typeof item[
                  itemKey
                ] ===
                  "object"
            );

          if (
            looksLikeContext
          ) {
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

/* ============================================================
   SCREEN
============================================================ */

export default function PluginPlaygroundScreen({
  route,
}: Props) {
  const pluginId =
    route?.params?.pluginId;

  const playlistItemId =
    route?.params?.playlistItemId;

  const initialWidth =
    route?.params?.width ||
    800;

  const initialHeight =
    route?.params?.height ||
    480;

  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const engine = useMemo(
    () => new Liquid(),
    []
  );

  /* ==========================================================
     STATE
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [plugin, setPlugin] =
    useState<Plugin | null>(
      null
    );

  const [connectors, setConnectors] =
    useState<Connector[]>([]);

  const [
    playgroundSessionId,
    setPlaygroundSessionId,
  ] = useState<
    string | null
  >(null);

  const [
    playgroundInstances,
    setPlaygroundInstances,
  ] = useState<
    PluginInstance[]
  >([]);

  /*
   * IMPORTANT:
   *
   * Do not type this as PlaygroundExecution[].
   * Your real response is the Liquid data object.
   */
  const [
    playgroundExecutionData,
    setPlaygroundExecutionData,
  ] = useState<any>(null);

  const [markup, setMarkup] =
    useState("");

  const [epuiTree, setEpuiTree] =
    useState<EpNode | null>(
      null
    );

  const [
    compileError,
    setCompileError,
  ] = useState<
    string | null
  >(null);

  const [
    openInstanceId,
    setOpenInstanceId,
  ] = useState<
    string | null
  >(null);

  const [
    orientation,
    setOrientation,
  ] = useState<Orientation>(
    getDefaultOrientation(
      initialWidth,
      initialHeight
    )
  );

  const [
    deviceWidth,
    setDeviceWidth,
  ] = useState(
    initialWidth
  );

  const [
    deviceHeight,
    setDeviceHeight,
  ] = useState(
    initialHeight
  );

  const [
    isExecuting,
    setIsExecuting,
  ] = useState(false);

  const [
    hasChanges,
    setHasChanges,
  ] = useState(false);

  const [
    imageVersion,
    setImageVersion,
  ] = useState(0);

  const [
    devices,
    setDevices,
  ] = useState<
    DisplayInfo[]
  >([]);

  const [
    dataContextExpanded,
    setDataContextExpanded,
  ] = useState(false);

  const mountedRef =
    useRef(false);

  const configTimers =
    useRef<
      Record<
        string,
        ReturnType<typeof setTimeout>
      >
    >({});

  const compileRequestRef =
    useRef(0);

  /* ==========================================================
     DEVICE PROFILE
  ========================================================== */

  const baseProfile =
    useMemo<DeviceProfile>(() => {
      const width =
        deviceWidth;

      const height =
        deviceHeight;

      if (
        (width === 1200 &&
          height === 1600) ||
        (width === 1600 &&
          height === 1200)
      ) {
        return E6_13IN_1200x1600;
      }

      if (
        (width === 800 &&
          height === 480) ||
        (width === 480 &&
          height === 800)
      ) {
        return E6_73IN_800x480;
      }

      return DEFAULT_DEVICE_PROFILE;
    }, [
      deviceWidth,
      deviceHeight,
    ]);

  const profile =
    useMemo(
      () =>
        getOrientedProfile(
          baseProfile,
          orientation
        ),
      [
        baseProfile,
        orientation,
      ]
    );

  const orientedDevice =
    useMemo(
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

  /* ==========================================================
     PREVIEW SCALE
  ========================================================== */

  const previewWidth =
    Math.max(
      screenWidth - 24,
      100
    );

  const previewHeight =
    Math.max(
      screenHeight * 0.52,
      150
    );

  const scale =
    Math.min(
      previewWidth /
        orientedDevice.width,

      previewHeight /
        orientedDevice.height,

      1
    );

  const scaledWidth =
    orientedDevice.width *
    scale;

  const scaledHeight =
    orientedDevice.height *
    scale;

  /* ==========================================================
     CREATE SESSION
  ========================================================== */

  const createPlaygroundSession =
    useCallback(
      async () => {
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

        return response.data
          .session;
      },
      [pluginId]
    );

  /* ==========================================================
     REFRESH SESSION
  ========================================================== */

  const refreshPlaygroundSession =
    useCallback(
      async () => {
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
      },
      [pluginId]
    );

  /* ==========================================================
     LOAD CONNECTORS
  ========================================================== */

  const loadPlaygroundConnectors =
    useCallback(
      async (
        sessionId: string
      ) => {
        const response =
          await api.get<
            PluginInstance[]
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

  /* ==========================================================
     LOAD EXECUTION
  ========================================================== */

  const loadExecution =
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
      },
      []
    );

  /* ==========================================================
     LOAD DEVICES
  ========================================================== */

  const loadDevices =
    useCallback(async () => {
      try {
        const response =
          await api.get<
            DisplayInfo[]
          >(
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

        /*
         * Do not override an explicitly supplied
         * route resolution.
         */
        if (
          list.length > 0 &&
          !route?.params?.width &&
          !route?.params?.height
        ) {
          const first =
            list[0];

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
    }, [
      route?.params?.width,
      route?.params?.height,
    ]);

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

      setPlugin(
        response.data
      );

      setMarkup(
        response.data
          ?.pluginCode ??
          ""
      );
    }, [pluginId]);

  /* ==========================================================
     LOAD CONNECTOR TYPES
  ========================================================== */

  const loadConnectorTypes =
    useCallback(async () => {
      const response =
        await api.get<
          Connector[]
        >(
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
         * IMPORTANT:
         *
         * Do NOT use oauthTokens as the
         * Liquid data context.
         *
         * Fetch actual execution data.
         */
        setPlaygroundExecutionData(
          null
        );

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

    if (
      mountedRef.current
    ) {
      return;
    }

    mountedRef.current =
      true;

    const load =
      async () => {
        try {
          setLoading(true);

          await Promise.all([
            loadPlugin(),
            loadConnectorTypes(),
            loadDevices(),
          ]);

          if (
            playlistItemId
          ) {
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

            /*
             * Keep Execute disabled until a connector
             * actually changes.
             */
            setHasChanges(
              false
            );
          }
        } catch (error: any) {
          console.log(
            "PLUGIN LOAD ERROR:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Error",
            error?.response
              ?.data
              ?.message ??
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

  const dataContext =
    useMemo(
      () =>
        normalizeExecutionContext(
          playgroundExecutionData
        ),
      [
        playgroundExecutionData,
      ]
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

    let cancelled =
      false;

    const compile =
      async () => {
        try {
          setCompileError(
            null
          );

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

          console.log(
            html
          );

          const rawTree =
            compileLTHtml(
              html
            );

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

          setEpuiTree(
            resolvedTree
          );
        } catch (
          error: any
        ) {
          console.log(
            "LIQUID / COMPILE ERROR:",
            error
          );

          if (!cancelled) {
            setCompileError(
              error?.message ??
                "Failed to compile."
            );

            setEpuiTree(
              null
            );
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
                item.id ===
                id
                  ? {
                      ...item,
                      config,
                    }
                  : item
            )
        );

        setHasChanges(
          true
        );

        /*
         * Debounce backend PATCH.
         */
        const oldTimer =
          configTimers.current[
            id
          ];

        if (oldTimer) {
          clearTimeout(
            oldTimer
          );
        }

        configTimers.current[
          id
        ] = setTimeout(
          async () => {
            if (
              !playgroundSessionId
            ) {
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
            } catch (
              error: any
            ) {
              console.log(
                "CONNECTOR UPDATE ERROR:",
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
      [
        playgroundSessionId,
      ]
    );

  /* ==========================================================
     DISCONNECT
  ========================================================== */

  const disconnect =
    useCallback(
      async (
        id: string
      ) => {
        setPlaygroundInstances(
          (previous) =>
            previous.map(
              (item) =>
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
        } catch (
          error: any
        ) {
          console.log(
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

        if (
          !playgroundSessionId
        ) {
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
            (value) =>
              value + 1
          );

          setHasChanges(
            true
          );
        } catch (
          error
        ) {
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
    loadPlaygroundConnectors,
    loadExecution,
  ]);

  /* ==========================================================
     EXECUTE
  ========================================================== */

  const execute =
    useCallback(
      async () => {
        if (
          !playgroundSessionId
        ) {
          return;
        }

        try {
          setIsExecuting(
            true
          );

          console.log(
            "================================="
          );

          console.log(
            "EXECUTE - OLD SESSION:",
            playgroundSessionId
          );

          /*
           * Refresh may return a different
           * session ID.
           */
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
            (value) =>
              value + 1
          );

          setHasChanges(
            false
          );

          console.log(
            "EXECUTE COMPLETE"
          );

          console.log(
            "================================="
          );
        } catch (
          error: any
        ) {
          console.log(
            "EXECUTION ERROR:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Execution failed",
            error?.response
              ?.data
              ?.message ??
              "Failed to execute playground."
          );
        } finally {
          setIsExecuting(
            false
          );
        }
      },
      [
        playgroundSessionId,
        refreshPlaygroundSession,
        loadPlaygroundConnectors,
        loadExecution,
      ]
    );

  /* ==========================================================
     ORIENTATION
  ========================================================== */

  const changeOrientation =
    useCallback(
      (
        next: Orientation
      ) => {
        if (
          next ===
          orientation
        ) {
          return;
        }

        setOrientation(
          next
        );

        setImageVersion(
          (value) =>
            value + 1
        );
      },
      [orientation]
    );

  /* ==========================================================
     DEVICE
  ========================================================== */

  const changeDevice =
    useCallback(
      (
        selectedDevice: DisplayInfo
      ) => {
        const width =
          selectedDevice.displayResolutionWidth;

        const height =
          selectedDevice.displayResolutionHeight;

        setDeviceWidth(
          width
        );

        setDeviceHeight(
          height
        );

        setOrientation(
          getDefaultOrientation(
            width,
            height
          )
        );

        setImageVersion(
          (value) =>
            value + 1
        );
      },
      []
    );

  /* ==========================================================
     RENDER EP NODE

     IMPORTANT:
     Native View/Text are used for the layout.

     Normal images:
       -> EpImage

     Overlay images:
       -> native Image with fixed size
  ========================================================== */
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
         SEGMENT
      ===================================================== */

      case "segment":
        return (
          <View
            key={key}
            style={{
              width: orientedDevice.width,
              height: orientedDevice.height,

              position: "relative",

              backgroundColor: "#ffffff",

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

      /* =====================================================
         SEGMENT VIEW
      ===================================================== */

      case "segment-view":
        return (
          <View
            key={key}
            style={{
              position: "absolute",

              left:
                n.regionBox?.offsetX ?? 0,

              top:
                n.regionBox?.offsetY ?? 0,

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

      /* =====================================================
         CANVAS
      ===================================================== */

      case "canvas":
        return (
          <View
            key={key}
            style={{
              width: orientedDevice.width,
              height: orientedDevice.height,

              position: "relative",

              backgroundColor: "#ffffff",

              overflow: "hidden",
            }}
          >
            {/* MAIN CONTENT */}

            <View
              style={{
                flex: 1,

                width: "100%",
                height: "100%",

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
                    `${key}-canvas-${index}`,
                    false
                  )
              )}
            </View>

            {/* OVERLAY */}

            {(n.overlay ?? []).length >
              0 && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",

                  left: 0,
                  right: 0,
                  bottom: 0,

                  minHeight: 60,

                  alignItems:
                    "flex-end",

                  justifyContent:
                    "flex-end",

                  paddingRight: 20,
                  paddingBottom: 10,

                  zIndex: 999,

                  elevation: 999,
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
            )}
          </View>
        );

      /* =====================================================
         ROW
      ===================================================== */

      case "row":
        return (
          <View
            key={key}
            style={{
              flex: 1,

              width: "100%",

              flexDirection: "column",

              minWidth: 0,
              minHeight: 0,

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
                  `${key}-row-${index}`,
                  isOverlay
                )
            )}
          </View>
        );

      /* =====================================================
         COLUMNS
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

              minWidth: 0,
              minHeight: 0,

              flexDirection:
                "column",

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
        /*
         * width from resolveLayout is a WEIGHT,
         * not a pixel width.
         */
        const blockWeight =
          typeof n.width === "number" &&
          n.width > 0
            ? n.width
            : 1;

        return (
          <View
            key={key}
            style={{
              /*
               * Overlay block should only consume
               * its content size.
               */
              flex: isOverlay
                ? 0
                : blockWeight,

              width: "100%",

              minWidth: 0,
              minHeight: 0,

              flexDirection:
                "column",

              alignSelf:
                isOverlay
                  ? "flex-end"
                  : "stretch",

              justifyContent:
                n.vAlign === "center"
                  ? "center"
                  : "flex-start",

              alignItems:
                n.hAlign === "center"
                  ? "center"
                  : "stretch",

              padding:
                isOverlay
                  ? 0
                  : n.full
                  ? 0
                  : 12,

              borderWidth:
                n.border &&
                !isOverlay
                  ? 1
                  : 0,

              borderColor:
                "#000000",

              overflow:
                "hidden",

              /*
               * VERY IMPORTANT.
               */
              flexGrow:
                isOverlay
                  ? 0
                  : blockWeight,

              flexShrink: 1,

              flexBasis:
                isOverlay
                  ? "auto"
                  : 0,
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
            ? profile.textSizes.large
            : n.size === "small"
            ? profile.textSizes.small
            : profile.textSizes.medium;

        return (
          <Text
            key={key}
            style={{
              color: "#000000",

              fontSize,

              lineHeight:
                profile.lineHeight,

              fontWeight: "400",

              flexShrink: 1,

              width: "100%",

              textAlign:
                n.align === "center"
                  ? "center"
                  : "left",

              includeFontPadding: true,

              /*
               * Text should occupy only its
               * natural height.
               */
              flexGrow: 0,
              flexBasis: "auto",
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
            ? profile.statSizes.large
            : n.size === "small"
            ? profile.statSizes.small
            : profile.statSizes.medium;

        return (
          <Text
            key={key}
            style={{
              color: "#000000",

              fontSize:
                statSize.fontSize,

              lineHeight:
                statSize.lineHeight,

              fontWeight: "700",

              textAlign:
                n.hAlign === "center"
                  ? "center"
                  : "right",

              includeFontPadding: true,

              flexGrow: 0,

              flexBasis: "auto",
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
        if (!n.src) {
          return null;
        }

        const imageSrc =
          appendCacheVersion(
            n.src,
            imageVersion
          );

        /*
         * -----------------------------------------------
         * OVERLAY IMAGE
         * -----------------------------------------------
         */

        if (isOverlay) {
          const width =
            typeof n.width ===
              "number" &&
            n.width > 0
              ? n.width
              : 60;

          const height =
            typeof n.height ===
              "number" &&
            n.height > 0
              ? n.height
              : 60;

          return (
            <View
              key={`${key}-overlay-image-${imageVersion}`}
              style={{
                width,
                height,

                alignItems:
                  "center",

                justifyContent:
                  "center",

                overflow:
                  "hidden",
              }}
            >
              <Image
                source={{
                  uri: imageSrc,
                }}
                style={{
                  width,
                  height,
                }}
                resizeMode="contain"
              />
            </View>
          );
        }

        /*
         * -----------------------------------------------
         * NORMAL IMAGE
         *
         * Important:
         *
         * Image gets the remaining height after text.
         * -----------------------------------------------
         */

        return (
          <View
            key={`${key}-image-${imageVersion}`}
            style={{
              flex: 1,

              width: "100%",

              minWidth: 0,
              minHeight: 0,

              marginTop: 8,

              overflow: "hidden",

              alignItems:
                "stretch",

              justifyContent:
                "center",
            }}
          >
            <Image
              source={{
                uri: imageSrc,
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode={
                n.fit === "contain"
                  ? "contain"
                  : "cover"
              }
            />

            {n.overlayText ? (
              <View
                style={{
                  position:
                    "absolute",

                  left: 0,
                  right: 0,
                  bottom: 8,

                  paddingHorizontal: 8,

                  alignItems:
                    "center",
                }}
              >
                <Text
                  style={{
                    color:
                      "#000000",

                    fontSize: 14,

                    fontWeight:
                      "700",

                    textAlign:
                      "center",
                  }}
                >
                  {n.overlayText}
                </Text>
              </View>
            ) : null}
          </View>
        );
      }

      /* =====================================================
         IFRAME
      ===================================================== */

      case "iframe":
        return (
          <View
            key={key}
            style={{
              flex: 1,

              width: "100%",

              minWidth: 0,
              minHeight: 0,

              overflow: "hidden",

              backgroundColor:
                "#ffffff",
            }}
          >
            {n.src ? (
              <WebView
                source={{
                  uri: n.src,
                }}
                style={{
                  flex: 1,

                  width: "100%",
                  height: "100%",

                  backgroundColor:
                    "transparent",
                }}
                scrollEnabled={
                  false
                }
                showsVerticalScrollIndicator={
                  false
                }
                showsHorizontalScrollIndicator={
                  false
                }
                javaScriptEnabled={
                  true
                }
                domStorageEnabled={
                  true
                }
                originWhitelist={[
                  "*",
                ]}
              />
            ) : null}
          </View>
        );

      /* =====================================================
         FOOTER
      ===================================================== */

      case "footer":
        return (
          <View
            key={key}
            style={{
              width: "100%",

              minHeight: 20,

              alignItems:
                "center",

              justifyContent:
                "center",

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

      /* =====================================================
         UNKNOWN
      ===================================================== */

      default:
        console.log(
          "UNKNOWN EP NODE:",
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
      ).forEach(
        (timer) => {
          clearTimeout(
            timer
          );
        }
      );
    };
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading ||
    !plugin
  ) {
    return (
      <View
        style={
          styles.loading
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
          Loading playground...
        </Text>
      </View>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={{
            flex: 1,

            paddingRight: 10,
          }}
        >
          <Text
            numberOfLines={1}
            style={
              styles.title
            }
          >
            {
              plugin.pluginName
            }
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.description
            }
          >
            {
              plugin.pluginDescription ??
              "No description"
            }
          </Text>
        </View>

        <TouchableOpacity
          onPress={
            execute
          }
          disabled={
            !hasChanges ||
            isExecuting
          }
          style={[
            styles.executeButton,

            (!hasChanges ||
              isExecuting) &&
              styles.disabledButton,
          ]}
        >
          {isExecuting ? (
            <ActivityIndicator
              color="#ffffff"
              size="small"
            />
          ) : (
            <Text
              style={
                styles.executeText
              }
            >
              Execute
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ====================================================
          ORIENTATION
      ==================================================== */}

      <View
        style={
          styles.orientationBar
        }
      >
        <View>
          <Text
            style={
              styles.resolution
            }
          >
            {
              orientedDevice.width
            }{" "}
            ×{" "}
            {
              orientedDevice.height
            }
          </Text>

          <Text
            style={
              styles.orientationLabel
            }
          >
            {orientation}
          </Text>
        </View>

        <View
          style={
            styles.orientationButtons
          }
        >
          <TouchableOpacity
            onPress={() =>
              changeOrientation(
                "landscape"
              )
            }
            style={[
              styles.orientationButton,

              orientation ===
                "landscape" &&
                styles.selectedOrientation,
            ]}
          >
            <Text
              style={
                orientation ===
                "landscape"
                  ? styles.selectedOrientationText
                  : styles.orientationText
              }
            >
              Landscape
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              changeOrientation(
                "portrait"
              )
            }
            style={[
              styles.orientationButton,

              orientation ===
                "portrait" &&
                styles.selectedOrientation,
            ]}
          >
            <Text
              style={
                orientation ===
                "portrait"
                  ? styles.selectedOrientationText
                  : styles.orientationText
              }
            >
              Portrait
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ==================================================
            PREVIEW
        ================================================== */}

        <View
          style={
            styles.previewContainer
          }
        >
          <Text
            style={
              styles.previewTitle
            }
          >
            Preview
          </Text>

          <View
            style={{
              width:
                scaledWidth,

              height:
                scaledHeight,

              backgroundColor:
                "#ffffff",

              overflow:
                "hidden",

              borderRadius:
                8,
            }}
          >
            <View
              style={{
                width:
                  orientedDevice.width,

                height:
                  orientedDevice.height,

                transform: [
                  {
                    scale,
                  },
                ],

                transformOrigin:
                  "top left",

                backgroundColor:
                  "#ffffff",

                overflow:
                  "hidden",
              }}
            >
              {compileError ? (
                <View
                  style={
                    styles.errorContainer
                  }
                >
                  <Text
                    style={
                      styles.errorTitle
                    }
                  >
                    Compile Error
                  </Text>

                  <Text
                    style={
                      styles.errorText
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
                  <ActivityIndicator />

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Loading preview...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ==================================================
            DEVICES
        ================================================== */}

        {devices.length >
          0 && (
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Devices
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              {devices.map(
                (
                  item
                ) => (
                  <TouchableOpacity
                    key={
                      item.displayId
                    }
                    onPress={() =>
                      changeDevice(
                        item
                      )
                    }
                    style={
                      styles.deviceButton
                    }
                  >
                    <Text
                      style={
                        styles.deviceName
                      }
                    >
                      {
                        item.modelNo
                      }
                    </Text>

                    <Text
                      style={
                        styles.deviceResolution
                      }
                    >
                      {
                        item.displayResolutionWidth
                      }{" "}
                      ×{" "}
                      {
                        item.displayResolutionHeight
                      }
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

        {/* ==================================================
            SETTINGS
        ================================================== */}

        <View
          style={
            styles.settings
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Settings
          </Text>

          {playgroundInstances.map(
            (
              instance
            ) => (
              <ConnectorCard
                key={
                  instance.id
                }
                mode="playground"
                sessionId={
                  playgroundSessionId ??
                  ""
                }
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
                  updateConnector
                }
                onDisconnect={
                  disconnect
                }
                cropAspect={
                  deviceWidth /
                  deviceHeight
                }
              />
            )
          )}

          {playgroundInstances.length ===
            0 && (
            <Text
              style={
                styles.emptySettings
              }
            >
              No settings configured
            </Text>
          )}
        </View>

        {/* ==================================================
            DATA CONTEXT
        ================================================== */}

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
              styles.sectionTitle
            }
          >
            Data Context
          </Text>

          <Text
            style={
              styles.expandIcon
            }
          >
            {
              dataContextExpanded
                ? "▲"
                : "▼"
            }
          </Text>
        </Pressable>

        {dataContextExpanded && (
          <ScrollView
            horizontal
            style={
              styles.dataContext
            }
          >
            <Text
              style={
                styles.json
              }
            >
              {JSON.stringify(
                dataContext,
                null,
                2
              )}
            </Text>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f5f5f5",
    },

    loading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
    },

    loadingText: {
      marginTop: 12,
      color:
        "#666666",
      fontSize: 14,
    },

    header: {
      minHeight: 64,

      paddingHorizontal: 16,
      paddingVertical: 10,

      backgroundColor:
        "#ffffff",

      borderBottomWidth: 1,
      borderBottomColor:
        "#dddddd",

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    title: {
      fontSize: 15,
      fontWeight:
        "600",
      color:
        "#111111",
    },

    description: {
      marginTop: 3,
      fontSize: 11,
      color:
        "#777777",
    },

    executeButton: {
      minWidth: 80,
      height: 36,

      paddingHorizontal: 14,

      borderRadius: 6,

      backgroundColor:
        "#2563eb",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    disabledButton: {
      opacity: 0.5,
    },

    executeText: {
      color:
        "#ffffff",

      fontSize: 12,

      fontWeight:
        "600",
    },

    orientationBar: {
      minHeight: 52,

      paddingHorizontal: 12,

      backgroundColor:
        "#ffffff",

      borderBottomWidth: 1,

      borderBottomColor:
        "#dddddd",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    resolution: {
      color:
        "#666666",

      fontSize: 11,

      fontFamily:
        "monospace",
    },

    orientationLabel: {
      marginTop: 3,

      fontSize: 9,

      color:
        "#999999",

      textTransform:
        "capitalize",
    },

    orientationButtons: {
      flexDirection:
        "row",

      borderWidth: 1,

      borderColor:
        "#dddddd",

      borderRadius: 6,

      overflow:
        "hidden",
    },

    orientationButton: {
      paddingHorizontal: 10,

      paddingVertical: 6,

      backgroundColor:
        "#ffffff",
    },

    selectedOrientation: {
      backgroundColor:
        "#2563eb",
    },

    orientationText: {
      fontSize: 10,

      color:
        "#666666",
    },

    selectedOrientationText: {
      fontSize: 10,

      color:
        "#ffffff",

      fontWeight:
        "600",
    },

    previewContainer: {
      minHeight: 280,

      padding: 12,

      backgroundColor:
        "#e5e5e5",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    previewTitle: {
      alignSelf:
        "flex-start",

      marginBottom: 8,

      fontSize: 13,

      fontWeight:
        "700",

      color:
        "#222222",
    },

    errorContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 20,

      backgroundColor:
        "#fff5f5",
    },

    errorTitle: {
      color:
        "#dc2626",

      fontSize: 14,

      fontWeight:
        "600",

      marginBottom: 6,
    },

    errorText: {
      color:
        "#ef4444",

      fontSize: 11,

      textAlign:
        "center",
    },

    emptyPreview: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyText: {
      marginTop: 8,

      color:
        "#999999",

      fontSize: 12,
    },

    section: {
      padding: 12,

      backgroundColor:
        "#ffffff",

      borderBottomWidth: 1,

      borderBottomColor:
        "#dddddd",
    },

    sectionTitle: {
      marginBottom: 10,

      fontSize: 12,

      fontWeight:
        "700",

      color:
        "#555555",

      textTransform:
        "uppercase",
    },

    deviceButton: {
      paddingHorizontal: 12,

      paddingVertical: 8,

      marginRight: 8,

      borderWidth: 1,

      borderColor:
        "#dddddd",

      borderRadius: 6,

      backgroundColor:
        "#ffffff",
    },

    deviceName: {
      fontSize: 11,

      fontWeight:
        "600",

      color:
        "#222222",
    },

    deviceResolution: {
      marginTop: 3,

      fontSize: 10,

      color:
        "#888888",
    },

    settings: {
      padding: 12,

      backgroundColor:
        "#ffffff",
    },

    emptySettings: {
      color:
        "#999999",

      fontSize: 11,

      textAlign:
        "center",

      paddingVertical:
        20,
    },

    dataContextHeader: {
      minHeight: 46,

      paddingHorizontal: 12,

      backgroundColor:
        "#ffffff",

      borderTopWidth: 1,

      borderBottomWidth: 1,

      borderColor:
        "#dddddd",

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    expandIcon: {
      marginLeft:
        "auto",

      color:
        "#777777",

      fontSize: 11,
    },

    dataContext: {
      maxHeight: 350,

      padding: 12,

      backgroundColor:
        "#111111",
    },

    json: {
      fontFamily:
        "monospace",

      fontSize: 10,

      color:
        "#eeeeee",
    },
  });