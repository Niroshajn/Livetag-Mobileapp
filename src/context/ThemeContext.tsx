
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import SystemNavigationBar from "react-native-system-navigation-bar";
import {
  Appearance,
  StatusBar,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const [theme, setThemeState] = useState<Theme>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme");

        if (storedTheme === "light" || storedTheme === "dark") {
          setThemeState(storedTheme);
        } else {
          const systemTheme =
            Appearance.getColorScheme() === "dark" ? "dark" : "light";

          setThemeState(systemTheme);
        }
      } catch (error) {
        console.log("Theme load error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);
// Sync Android bottom navigation bar with app theme
useEffect(() => {
  const updateNavigationBar = async () => {
    try {
      await SystemNavigationBar.setBarColor(
        theme === "dark" ? "#0B0B0B" : "#FFFFFF",
        {
          bar: "navigation",
          style: theme === "dark" ? "light" : "dark",
        }
      );
    } catch (error) {
      console.log("Navigation bar theme error:", error);
    }
  };

  if (isLoaded) {
    updateNavigationBar();
  }
}, [theme, isLoaded]);
  // Sync NativeWind and save theme
  useEffect(() => {
    if (!isLoaded) return;

    if (theme !== colorScheme) {
      toggleColorScheme();
    }

    AsyncStorage.setItem("theme", theme);
  }, [theme, isLoaded, colorScheme, toggleColorScheme]);

  const toggleTheme = () => {
    setThemeState((prev) =>
      prev === "dark" ? "light" : "dark"
    );
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme }}
    >
      <>
        <StatusBar
          animated
          hidden={false}
          translucent={false}
          backgroundColor={theme === "dark" ? "#0B0B0B" : "#FFFFFF"}
          barStyle={
            theme === "dark"
              ? "light-content"
              : "dark-content"
          }
        />

        {children}
      </>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
