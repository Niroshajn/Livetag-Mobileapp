
// export default EpImage;
import React from "react";
import { Image, Text, View, type DimensionValue, } from "react-native"; 
type EpImageProps = { 
  src: string;
   overlayText?: string; 
   overlayImage?: string; 
   isOverlay?: boolean; 
   width?: DimensionValue; 
   height?: DimensionValue; 
   fit?: "cover" | "contain" | "stretch" | "center"; 
   align?: "left" | "center" | "right";
   }; 
   export function EpImage(
    { src,
      overlayText, 
      isOverlay = false, 
      width, 
      height, 
      fit, 
      align = "center", 
    }: EpImageProps) 
    { if (!src) 
      {
         return null;
       } 
       const horizontalAlignment = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"; 
       const imageWidth: DimensionValue = width ?? (isOverlay ? 80 : "100%"); const imageHeight: DimensionValue = height ?? (isOverlay ? 40 : "100%"); 
       const effectiveFit = fit ?? (isOverlay ? "contain" : "cover");
        return ( 
        <View 
        style={{ width: imageWidth,
          height: imageHeight, 
          flex: isOverlay ? undefined : 1, 
          minWidth: 0, 
          minHeight: 0, 
          alignSelf: isOverlay ? "flex-start" : "stretch", 
          justifyContent: "center", 
          alignItems: horizontalAlignment, 
          overflow: "hidden", }}
           > 
           <Image 
           source={{ uri: src }} 
           resizeMode={effectiveFit} 
           style={{ 
            width: "100%", 
            height: "100%",
           }} 
           /> 
           {overlayText ? (
             <View
              pointerEvents="none" 
              style={{ 
                position: "absolute", 
                left: 0, 
                right: 0, 
                top: 0, 
                bottom: 0, 
                justifyContent: "center", 
                alignItems: "center", 
                }} 
                > 
                <Text>
                  {overlayText}
                  </Text>
                   </View> 
                   ) : null}
                    </View> 
                    ); } 
                    
  export default EpImage;