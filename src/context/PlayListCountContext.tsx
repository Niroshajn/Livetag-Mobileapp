import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ContextType {
  playlistCounts: Record<string, number>;
  setPlaylistCount: (frameId: string, count: number) => void;
}

const PlaylistCountContext = createContext<ContextType | undefined>(
  undefined
);

export const PlaylistCountProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [playlistCounts, setPlaylistCountsState] = useState<
    Record<string, number>
  >({});

  // 🔥 Load from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem("playlistCounts");
        if (stored) {
          setPlaylistCountsState(JSON.parse(stored));
        }
      } catch (err) {
        console.log("Error loading playlistCounts");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          "playlistCounts",
          JSON.stringify(playlistCounts)
        );
      } catch (err) {
        console.log("Error saving playlistCounts");
      }
    };
    saveData();
  }, [playlistCounts]);

  const setPlaylistCount = (frameId: string, count: number) => {
    setPlaylistCountsState((prev) => ({
      ...prev,
      [frameId]: count,
    }));
  };

  return (
    <PlaylistCountContext.Provider
      value={{ playlistCounts, setPlaylistCount }}
    >
      {children}
    </PlaylistCountContext.Provider>
  );
};

export const usePlaylistCount = () => {
  const context = useContext(PlaylistCountContext);
  if (!context)
    throw new Error(
      "usePlaylistCount must be used within PlaylistCountProvider"
    );
  return context;
};