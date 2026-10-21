
import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { DeviceProfile } from "../../../packages/ltag/device";

type EpCanvasProps = {
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  full?: boolean;
  profile: DeviceProfile;
  style?: StyleProp<ViewStyle>;
};

export function EpCanvas({
  children,
  overlay,
  full = false,
  profile,
  style,
}: EpCanvasProps) {
  const width = Number(profile.canvasWidth);
  const height = Number(profile.canvasHeight);
  const padding = full ? 0 : 12;

  return (
    <View
      style={[
        {
          width,
          height,
          padding,
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View
        onLayout={(event) => {
      const { width, height } = event.nativeEvent.layout;

      console.log("[MOBILE CANVAS ACTUAL SIZE]", {
        width,
        height,
      });

      console.log("[MOBILE OUTER CANVAS SIZE]", {
        width,
        height,
      });
    }}
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </View>

      {overlay ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 30,
            bottom: 20,
            maxWidth: width - 40,
            zIndex: 999,
            elevation: 999,
          }}
        >
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

export default EpCanvas;
