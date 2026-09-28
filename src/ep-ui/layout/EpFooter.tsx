import React from "react";
import { View, StyleSheet } from "react-native";

type EpFooterProps = {
  children: React.ReactNode;
};

export function EpFooter({ children }: EpFooterProps) {
  return (
    <View style={styles.footer}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
  },
});