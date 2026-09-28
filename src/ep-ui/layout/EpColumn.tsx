// EpColumn.tsx
import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpColumnProps = {
  children?: React.ReactNode;
  columns?: number;
  style?: StyleProp<ViewStyle>;
};

export function EpColumn({
  children,
  style,
}: EpColumnProps) {
  return (
    <View
      style={[
        {
          width: "100%",
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          overflow: "hidden",
          backgroundColor: "#ffffff",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default EpColumn;