import React from "react";
import { Text, StyleSheet } from "react-native";

type EpTextProps = {
  children: React.ReactNode;
  align?: "center";
  vAlign?: "center";
  size?: "small" | "medium" | "large";
};

export const EpText = ({
  children,
  size = "medium",
  align,
  vAlign,
}: EpTextProps) => {
  return (
    <Text
      style={[
        styles.text,

        size === "small" && styles.small,
        size === "medium" && styles.medium,
        size === "large" && styles.large,

        align === "center" && styles.center,
        vAlign === "center" && styles.vCenter,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: "#000",
    flexShrink: 1,
    width: "100%",
  },

  small: {
    fontSize: 11,
    lineHeight: 13,
  },

  medium: {
    fontSize: 14,
    lineHeight: 17,
  },

  large: {
    fontSize: 20,
    lineHeight: 24,
  },

  center: {
    textAlign: "center",
  },

  vCenter: {
    textAlignVertical: "center",
  },
});