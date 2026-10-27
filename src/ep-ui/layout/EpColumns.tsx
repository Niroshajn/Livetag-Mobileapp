import React from "react";
import { View } from "react-native";

type EpColumnsProps = {
  children?: React.ReactNode;
  columns: number;
};

export function EpColumns({
  children,
  columns,
}: EpColumnsProps) {
  const count = Math.max(1, Math.floor(Number(columns) || 1));
  const childArray = React.Children.toArray(children).slice(0, count);

  return (
    <View
      style={{
        width: "100%",
        flex: 1,
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {childArray.map((child, index) => (
        <View
          key={`ep-column-${index}`}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export default EpColumns;