
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

type UserType = {
  id: string;
  name: string;
  email: string;
  roles: any[];
  permissions?: string[];
};

type AdminContextType = {
  user: UserType | null;
  isAdmin: boolean;
  canManageGroups: boolean;
  loading: boolean;
  setUser: (user: UserType | null) => void;
  setIsAdmin: (value: boolean) => void;
  refreshAdmin: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(
  undefined
);

const getRoles = (user: UserType | null): string[] => {
  if (!user?.roles) return [];

  return user.roles.map((role: any) =>
    typeof role === "string"
      ? role.toLowerCase()
      : role?.name?.toLowerCase() || ""
  );
};

export const AdminProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);

        const roles = getRoles(parsedUser);

        setIsAdmin(roles.includes("admin"));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.log("Admin context error:", error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  const roles = getRoles(user);

  const canManageGroups =
    roles.includes("admin") ||
    roles.includes("editor");

  return (
    <AdminContext.Provider
      value={{
        user,
        isAdmin,
        canManageGroups,
        loading,
        setUser,
        setIsAdmin,
        refreshAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error(
      "useAdmin must be used inside AdminProvider"
    );
  }

  return context;
};
