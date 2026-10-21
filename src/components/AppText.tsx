
import React from "react";
import { Text, type TextProps } from "react-native";

type AppTextProps = TextProps & {
  bold?: boolean;
};

export default function AppText({
  bold = false,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: bold ? "Roboto-Bold" : "Roboto-Regular",
        },
        style,
      ]}
    />
  );
}
