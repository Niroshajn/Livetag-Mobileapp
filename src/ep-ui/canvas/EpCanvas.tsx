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
const canvasPadding = full ? 0 : 12;

return (
  <View
    style={[
      {
        width,
        height,
        minWidth: width,
        minHeight: height,
        maxWidth: width,
        maxHeight: height,
        padding: canvasPadding,
        backgroundColor: "#ffffff",
        position: "relative",
        overflow: "hidden",
      },
      style,
    ]}
  >
     <View
  style={{
    flex: 1,
    alignSelf: "stretch",
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
            alignSelf: "flex-end",
          }}
        >
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

export default EpCanvas;