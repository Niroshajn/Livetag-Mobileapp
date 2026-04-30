import React from "react";
import { Pressable, Text, ActivityIndicator, PressableProps, ViewStyle } from "react-native";

type AppButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "outline"|"ghost";
  loading?: boolean;
  style?: ViewStyle;
};

const AppButton: React.FC<AppButtonProps> = ({ title, variant = "primary", loading = false, style, ...props }) => {
  let bgColor = "bg-gray-300";
  let textColor = "text-black";

  if (variant === "primary") {
    bgColor = "bg-gray-300 dark:bg-gray-700";
    textColor = "text-black dark:text-white";
  } else if (variant === "secondary") 
    {
    bgColor = "bg-blue-600";
    textColor = "text-white";
  }
  else if (variant === "ghost") {
  bgColor = "bg-transparent";
  textColor = "text-gray-700 dark:text-gray-300";
}
  else if (variant === "outline") {
    bgColor = "bg-transparent border border-gray-400";
    textColor = "text-black dark:text-white";
  }

  return (
    <Pressable
      className={`${bgColor} p-3 rounded-md flex-row justify-center items-center`}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#000" : "#fff"} />
      ) : (
        <Text className={`text-center ${textColor}`}>{title}</Text>
      )}
    </Pressable>
  );
};

export default AppButton;