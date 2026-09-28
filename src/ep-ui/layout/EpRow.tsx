import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpRowProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EpRow({
  children,
  style,
}: EpRowProps) {
  return (
    <View
      style={[
        {
          width: "100%",

          flex: 1,

          flexDirection: "row",

          alignItems: "stretch",

          justifyContent: "flex-start",

          minWidth: 0,

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

export default EpRow;