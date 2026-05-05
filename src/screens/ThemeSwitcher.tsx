import { View, Text, Pressable, Dimensions } from "react-native";
import { Moon, Sun } from "lucide-react-native"; // ✅ FIXED
import { useTheme } from "../context/ThemeContext";
export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { width } = Dimensions.get("window");
  const iconSize = width * 0.05;
  return (
    <Pressable
      onPress={toggleTheme}
      className="flex-row items-center space-x-3 py-2.5 px-5 mx-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {theme === "dark" ? (
        <>
          <Sun size={iconSize} color="white" />
          <Text className="text-black dark:text-white">
            Light Mode
          </Text>
        </>
      ) : (
        <>
          <Moon size={iconSize} color="black" />
          <Text className="text-black dark:text-white">
            Dark Mode
          </Text>
        </>
      )}
    </Pressable>
  );
}