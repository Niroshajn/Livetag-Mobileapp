
import React from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import type { DeviceProfile } from "../../../packages/ltag/device";

type EpTextProps = {
  children?: React.ReactNode;
  size?: "small" | "medium" | "large";
  align?: "left" | "center" | "right";
  vAlign?: "top" | "center" | "bottom";
  profile?: DeviceProfile;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function EpText({
  children,
  size = "medium",
  align = "left",
  vAlign = "top",
  profile,
  width,
  height,
  style,
  textStyle,
}: EpTextProps) {
const fontSize =
  profile?.textSizes?.[size] ??
  { small: 16, medium: 18, large: 22 }[size];

const lineHeight = fontSize + 4;
// DEBUG LOGS
console.log("[MOBILE FONT CHECK]", {
  requestedFontFamily: textStyle,
  fontSize,
  lineHeight,
  platformFont: "Roboto (Android default is usually Roboto)",
});
console.log("[EP TEXT DEBUG]", {
  text: typeof children === "string" ? children : "",
  size,
  profileName: profile?.canvasWidth,
  fontSize,
  lineHeight,
  profileTextSizes: profile?.textSizes,
  profileLineHeight: profile?.lineHeight,
});
  const debugText =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : "";

  return (
    <View
      onLayout={(event) => {
        console.log("[EP TEXT VIEW]", {
          text: debugText,
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
          fontSize,
          lineHeight,
        });
      }}
      style={[
        {
          width: width ?? "100%",
          height,
          minWidth: 0,
          minHeight: 0,
          flexShrink: 1,
          justifyContent:
            vAlign === "center"
              ? "center"
              : vAlign === "bottom"
                ? "flex-end"
                : "flex-start",
        },
        style,
      ]}
    >
   <Text
  allowFontScaling={false}
  onTextLayout={(event) => {
    console.log("[EP TEXT LAYOUT]", {
      text: debugText,
      fontSize,
      lineHeight,
      lines: event.nativeEvent.lines.map(
        (line) => line.text
      ),
      lineWidths: event.nativeEvent.lines.map(
        (line) => line.width
      ),
    });
  }}
 style={[
  {
    color: "#000000",
    fontFamily: "Roboto",
    fontSize,
    lineHeight,
    textAlign: align,
    includeFontPadding: false,
    flexShrink: 1,
  },
  textStyle,
]}
>
  {children == null ? null : children}
</Text>
    </View>
  );
}

export default EpText;
