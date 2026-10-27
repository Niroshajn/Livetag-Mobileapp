
import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type EpColumnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EpColumn({ children, style }: EpColumnProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          flexDirection: "column",
          alignItems: "stretch",
          gap: 8,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default EpColumn;
