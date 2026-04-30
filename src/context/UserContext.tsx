import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id?: number;
  name?: string;
  email?: string;
  profilePic?: string;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  setIsLoggedIn,
}: {
  children: ReactNode;
  setIsLoggedIn: (value: boolean) => void;
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // ================= LOAD FROM STORAGE =================
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      const savedUser = await AsyncStorage.getItem("user");

      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      console.log("Error loading user:", err);
    }
  };

  // ================= LOGIN =================
  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setToken(token);
    } catch (err) {
      console.log("Login error:", err);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    setUser(null);
    setToken(null);

    // 🔥 THIS IS THE KEY FIX
    setIsLoggedIn(false);
  } catch (err) {
    console.log("Logout error:", err);
  }
};

  // ================= UPDATE USER =================
  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = { ...user, ...userData } as User;

      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.log("Update user error:", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// ================= HOOK =================
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return context;
};