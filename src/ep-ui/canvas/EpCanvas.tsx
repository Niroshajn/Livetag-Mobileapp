import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type DeviceProfile = {
  canvasWidth: number;
  canvasHeight: number;
  [key: string]: any;
};

export type EpCanvasProps = {
  children?: React.ReactNode;

  profile: DeviceProfile;

  full?: boolean;

  overlay?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
};

export function EpCanvas({
  children,
  profile,
  full = false,
  overlay,
  style,
}: EpCanvasProps) {
  return (
    <View
      style={[
        {
          width: profile.canvasWidth,

          height: profile.canvasHeight,

          backgroundColor: "#ffffff",

          overflow: "hidden",

          position: "relative",

          flexDirection: "column",

          alignItems: "stretch",

          justifyContent: "flex-start",
        },

        full
          ? {
              padding: 0,
            }
          : undefined,

        style,
      ]}
    >
      {children}

      {overlay ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",

            left: 0,

            top: 0,

            width: profile.canvasWidth,

            height: profile.canvasHeight,

            zIndex: 999,
          }}
        >
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

export default EpCanvas;