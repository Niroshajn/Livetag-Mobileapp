import React from "react";
import {
  Image,
  View,
  Text,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type EpImageProps = {
  src?: string;
  overlayText?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function EpImage({
  src,
  overlayText,
  style,
  imageStyle,
}: EpImageProps) {
  if (!src) {
    return (
      <View
        style={[
          {
            width: "100%",
            height: "100%",
            minHeight: 40,
            backgroundColor: "#eeeeee",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
          style,
        ]}
      >
        <Text
          style={{
            color: "#999999",
            fontSize: 12,
          }}
        >
          No image
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: "100%",
          flex: 1,
          minHeight: 1,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#ffffff",
        },
        style,
      ]}
    >
      <Image
        source={{
          uri: src,
        }}
        resizeMode="cover"
        style={[
          {
            width: "100%",
            height: "100%",
          },
          imageStyle,
        ]}
      />

      {overlayText ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 8,
            paddingVertical: 6,
            backgroundColor:
              "rgba(0,0,0,0.45)",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {overlayText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default EpImage;