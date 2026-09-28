// EpColumns.tsx
import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpColumnsProps = {
  children?: React.ReactNode;
  columns?: number;
  style?: StyleProp<ViewStyle>;
};

export function EpColumns({
  children,
  columns = 1,
  style,
}: EpColumnsProps) {
  const safeColumns = Math.max(
    1,
    Math.floor(Number(columns) || 1)
  );

  const columnWidth = `${100 / safeColumns}%` as `${number}%`;

  return (
    <View
      style={[
        {
          width: "100%",
          flex: 1,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "stretch",
          justifyContent: "flex-start",
          minWidth: 0,
          overflow: "hidden",
          backgroundColor: "#ffffff",
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        return (
          <View
            style={{
              width: columnWidth,
              minWidth: 0,
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

export default EpColumns;