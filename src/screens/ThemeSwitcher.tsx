import { View, Text, Pressable } from "react-native";
import { Moon, Sun } from "lucide-react-native"; // ✅ FIXED
import { useTheme } from "../context/ThemeContext";
export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      className="flex-row items-center space-x-3 py-2.5 px-5 mx-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {theme === "dark" ? (
        <>
          <Sun size={20} color="white" />
          <Text className="text-black dark:text-white">
            Light Mode
          </Text>
        </>
      ) : (
        <>
          <Moon size={20} color="black" />
          <Text className="text-black dark:text-white">
            Dark Mode
          </Text>
        </>
      )}
    </Pressable>
  );
}