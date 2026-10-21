
import React from "react";
import { StyleSheet, View } from "react-native";
import type { DeviceProfile } from "../../../packages/ltag/device";
import Text from "../../components/AppText";
type EpStatProps = {
  value: string;
  label?: string;
  align?: "left" | "center" | "right";
  size?: "small" | "medium" | "large";
  profile?: DeviceProfile;
};

export function EpStat({
  value,
  label,
  size = "medium",
  align = "right",
  profile,
}: EpStatProps) {
  const statSize = profile?.statSizes?.[size] ?? {
    small: { fontSize: 16, lineHeight: 20 },
    medium: { fontSize: 20, lineHeight: 24 },
    large: { fontSize: 26, lineHeight: 30 },
  }[size];

  return (
    <View style={styles.stat}>
      <Text
        allowFontScaling={false}
        style={[
          styles.statValue,
          {
            fontSize: statSize.fontSize,
            lineHeight: statSize.lineHeight,
            textAlign: align,
          },
        ]}
      >
        {value}
      </Text>

      {label ? (
        <Text
          allowFontScaling={false}
          style={[
            styles.statLabel,
            { textAlign: align },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export default EpStat;

const styles = StyleSheet.create({
  stat: {
    width: "100%",
    minWidth: 0,
  },
  statValue: {
    fontFamily: "Roboto-Bold",
    color: "#000000",
    includeFontPadding: false,
    flexShrink: 1,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "Roboto-Bold",
    color: "#000000",
    includeFontPadding: false,
    flexShrink: 1,
  },
});
