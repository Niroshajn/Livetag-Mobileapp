import React from "react";
import { Pressable,PressableProps, Text } from "react-native";

const variants = {
  default: "bg-white border border-blue-600",
  outline: "border border-gray-300 bg-white",
  secondary: "bg-gray-100",
  destructive: "bg-red-600",
  ghost: "bg-transparent",
  link: "bg-transparent",
};

const textVariants = {
  default: "text-blue-600",
  outline: "text-gray-900",
  secondary: "text-gray-900",
  destructive: "text-white",
  ghost: "text-gray-700",
  link: "text-blue-600 underline",
};

const sizes = {
  default: "px-4 py-2",
  sm: "px-3 py-1.5",
  lg: "px-6 py-3",
};
