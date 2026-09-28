import React from "react";
import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpBlockProps = {
  children?: React.ReactNode;

  full?: boolean;
  border?: boolean;

  hAlign?: "left" | "center" | "right";
  vAlign?: "top" | "center" | "bottom";

  style?: StyleProp<ViewStyle>;
};

function getHorizontalAlignment(
  align?: EpBlockProps["hAlign"]
): "flex-start" | "center" | "flex-end" {
  switch (align) {
    case "center":
      return "center";

    case "right":
      return "flex-end";

    case "left":
    default:
      return "flex-start";
  }
}

function getVerticalAlignment(
  align?: EpBlockProps["vAlign"]
): "flex-start" | "center" | "flex-end" {
  switch (align) {
    case "center":
      return "center";

    case "bottom":
      return "flex-end";

    case "top":
    default:
      return "flex-start";
  }
}

export function EpBlock({
  children,
  full = false,
  border = false,
  hAlign = "left",
  vAlign = "top",
  style,
}: EpBlockProps) {
  const horizontalAlignment =
    getHorizontalAlignment(hAlign);

  const verticalAlignment =
    getVerticalAlignment(vAlign);

  return (
    <View
      style={[
        {
          /*
           * A block is a card/item inside a column.
           */
          width: "100%",

          /*
           * VERY IMPORTANT:
           *
           * Without flex: 1, a block containing an image
           * may not receive the available height.
           *
           * This also lets multiple blocks share the column.
           */
          flex: full ? 1 : 1,

          minWidth: 0,

          /*
           * Image + text should be vertical.
           */
          flexDirection: "column",

          /*
           * Horizontal alignment.
           */
          alignItems: horizontalAlignment,

          /*
           * Vertical alignment.
           */
          justifyContent: verticalAlignment,

          /*
           * Don't allow image/text to escape the card.
           */
          overflow: "hidden",

          backgroundColor: "#ffffff",

          /*
           * Similar to the web preview.
           */
          padding: full ? 0 : 4,
        },

        border
          ? {
              borderWidth: 1,
              borderColor: "#777777",
            }
          : null,

        style,
      ]}
    >
      {children}
    </View>
  );
}

export default EpBlock;