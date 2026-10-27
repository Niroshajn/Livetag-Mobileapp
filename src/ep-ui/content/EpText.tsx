
import React from "react";
import {
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import Text from "../../components/AppText";
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
    { small: 16, medium: 20, large: 22 }[size];

  const lineHeight = fontSize + 4;

  return (
    <View
      style={[
        {
          width: width ?? "100%",
          height,
          minWidth: 0,
          minHeight: 0,
          alignSelf: "stretch",
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
        style={[
          {
            color: "#000000",
            fontFamily: "Roboto-Regular",
            fontSize,
            lineHeight,
            textAlign: align,
            includeFontPadding: false,
            margin: 0,
            padding: 0,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export default EpText;
