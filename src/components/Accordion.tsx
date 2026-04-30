import React, { useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { ChevronDown } from "lucide-react-native";

// Enable animation (Android)
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export function AccordionItem({ title, children }: any) {
  const [open, setOpen] = useState(false);

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <View className="border-b border-gray-300">
      {/* Header */}
      <TouchableOpacity
        onPress={toggleAccordion}
        className="flex-row justify-between items-center py-4 px-3"
      >
        <Text className="text-base font-semibold">{title}</Text>
        <ChevronDown
          size={18}
          style={{
            transform: [{ rotate: open ? "180deg" : "0deg" }],
          }}
        />
      </TouchableOpacity>

      {/* Content */}
      {open && (
        <View className="px-3 pb-4">
          <Text className="text-sm text-gray-600">{children}</Text>
        </View>
      )}
    </View>
  );
}