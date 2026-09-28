import React from "react";
import {
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpStatProps = {
  value?: React.ReactNode;

  label?: React.ReactNode;

  size?: number;

  style?: StyleProp<ViewStyle>;
};

export function EpStat({
  value,
  label,
  size = 28,
  style,
}: EpStatProps) {
  return (
    <View
      style={[
        {
          width: "100%",

          alignItems: "center",

          justifyContent: "center",

          padding: 4,
        },

        style,
      ]}
    >
      <Text
        style={{
          color: "#111111",

          fontSize: Number(size) || 28,

          fontWeight: "700",

          textAlign: "center",

          includeFontPadding: false,
        }}
      >
        {String(value ?? "")}
      </Text>

      {label !== undefined ? (
        <Text
          style={{
            color: "#666666",

            fontSize: 12,

            marginTop: 4,

            textAlign: "center",
          }}
        >
          {String(label)}
        </Text>
      ) : null}
    </View>
  );
}

export default EpStat;