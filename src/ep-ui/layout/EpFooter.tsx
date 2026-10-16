import React from "react";
import { View } from "react-native";

type EpFooterProps = {
  children: React.ReactNode;
};

export function EpFooter({ children }: EpFooterProps) {
  return (
    <View className="w-full">
      {children}
    </View>
  );
}

export default EpFooter;