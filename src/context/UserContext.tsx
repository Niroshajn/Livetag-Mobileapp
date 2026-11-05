
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type { ReactNode, Dispatch, SetStateAction } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id?: string | number;
  name?: string;
  email?: string;
  profilePic?: string;
  roles?: any[];
  permissions?: string[];
}

interface UserContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const UserProvider = ({
  children,
  setIsLoggedIn,
}: {
  children: ReactNode;
  setIsLoggedIn?: (value: boolean) => void;
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // LOAD SAVED SESSION
  useEffect(() => {
    const loadUser = async () => {
      try {
        const [savedToken, savedUser] =
          await AsyncStorage.multiGet(["token", "user"]);

        const tokenValue = savedToken[1];
        const userValue = savedUser[1];

        if (tokenValue && userValue) {
          const parsedUser = JSON.parse(userValue);

          setToken(tokenValue);
          setUser(parsedUser);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.log("User loading error:", error);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // LOGIN
  const login = async (
    userData: User,
    newToken: string
  ) => {
    try {
      await AsyncStorage.multiSet([
        ["token", newToken],
        ["user", JSON.stringify(userData)],
      ]);

      setUser(userData);
      setToken(newToken);
      setIsLoggedIn?.(true);
    } catch (error) {
      console.log("Login storage error:", error);
      throw error;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "isAdmin",
      ]);

      setUser(null);
      setToken(null);
      setIsLoggedIn?.(false);
    } catch (error) {
      console.log("Logout error:", error);
      throw error;
    }
  };

  // UPDATE USER
  const updateUser = async (
    userData: Partial<User>
  ) => {
    const updatedUser = {
      ...user,
      ...userData,
    } as User;

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider"
    );
  }

  return context;
};
