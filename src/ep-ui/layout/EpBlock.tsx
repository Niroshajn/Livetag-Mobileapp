import React from "react";
import {
  View,
  type DimensionValue,
} from "react-native";

import type { DeviceProfile } from "../../../packages/ltag/device";

type EpBlockProps = {
  children?: React.ReactNode;
  full?: boolean;
  border?: boolean;
  hAlign?: "left" | "center" | "right";
  vAlign?: "top" | "center" | "bottom";
  profile?: DeviceProfile;
  width?: DimensionValue;
  height?: DimensionValue;
  padding?: number;
};

export function EpBlock({
  children,
  full = false,
  border = false,
  hAlign = "left",
  vAlign = "top",
  profile,
  width,
  height,
  padding,
}: EpBlockProps) {
  const horizontalAlignment =
    hAlign === "center"
      ? "center"
      : hAlign === "right"
        ? "flex-end"
        : "flex-start";

  const verticalAlignment =
    vAlign === "center"
      ? "center"
      : vAlign === "bottom"
        ? "flex-end"
        : "flex-start";

  const blockPadding = full
    ? 0
    : padding ?? profile?.blockPaddingY ?? 12;

  return (
    <View
      style={{
        width: width ?? "100%",
        height,
        flex: height === undefined ? 1 : undefined,
        flexShrink: 1,
        minWidth: 0,
        minHeight: 0,
        alignSelf: "stretch",

        flexDirection: "column",
        justifyContent: verticalAlignment,
        alignItems: horizontalAlignment,

        // Match the web block's padding on all sides.
        padding: blockPadding,

        borderWidth: border ? 1 : 0,
        borderColor: "#000000",
        borderStyle: "solid",

        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

export default EpBlock;
