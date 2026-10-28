// import React, { useEffect, useState, useMemo } from "react";
// import {
//   View,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   ScrollView,
// } from "react-native";
// import Text from "../components/AppText";
// import { Puzzle, ChevronDown } from "lucide-react-native";
// import api from "../lib/api";
// import AppLayout from "./Layout";
// import {useColorScheme} from "nativewind";
// import { Dimensions } from "react-native";
// interface Tag {
//   id: string;
//   name: string;
// }

// export interface Plugin {
//   pluginId: string;
//   pluginName: string;
//   pluginDescription?: string;
//   pluginLogoUrl?: string;
//   pluginInstalls: number;
//   createdAt?: string;
//   hashtags?: Tag[];
// }

// type SortOption = "newest" | "oldest" | "popular" | "name";

// export default function Apps({ navigation }: any) {
//   const [plugins, setPlugins] = useState<Plugin[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState<SortOption>("newest");

//   const [selectedTags, setSelectedTags] = useState<string[]>([]);
//   const [showTagDropdown, setShowTagDropdown] = useState(false);
//   const { colorScheme } = useColorScheme();
//     const { width } = Dimensions.get("window");
//     const iconSize = width * 0.05;
//   // 🔥 FETCH
//   const fetchPlugins = async () => {
//     try {
//       const res = await api.get("/plugin/all");
//       setPlugins(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.log("Error:", err);
//       setPlugins([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//   useEffect(() => {
//     fetchPlugins();
//   }, []);
//   // 🔹 ALL TAGS
//   const allTags = useMemo(() => {
//     const tags = new Set<string>();
//     plugins.forEach((p) => {
//       p.hashtags?.forEach((t) => tags.add(t.name));
//     });
//     return Array.from(tags);
//   }, [plugins]);
//   // 🔹 FILTER + SORT
//   const filteredPlugins = useMemo(() => {
//     let result = [...plugins];
//     // SEARCH
//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase();
//       result = result.filter(
//         (p) =>
//           p.pluginName.toLowerCase().includes(q) ||
//           p.pluginDescription?.toLowerCase().includes(q)
//       );
//     }
//     // TAG FILTER
//     if (selectedTags.length > 0) {
//       result = result.filter((p) =>
//         p.hashtags?.some((tag) => selectedTags.includes(tag.name))
//       );
//     }
//     // SORT
//     switch (sortBy) {
//       case "newest":
//         result.sort(
//           (a, b) =>
//             new Date(b.createdAt ?? 0).getTime() -
//             new Date(a.createdAt ?? 0).getTime()
//         );
//         break;
//       case "oldest":
//         result.sort(
//           (a, b) =>
//             new Date(a.createdAt ?? 0).getTime() -
//             new Date(b.createdAt ?? 0).getTime()
//         );
//         break;
//       case "popular":
//         result.sort((a, b) => b.pluginInstalls - a.pluginInstalls);
//         break;
//       case "name":
//         result.sort((a, b) =>
//           a.pluginName.localeCompare(b.pluginName)
//         );
//         break;
//     }

//     return result;
//   }, [plugins, searchQuery, selectedTags, sortBy]);

//   // 🔹 TOGGLE TAG
//   const toggleTag = (tag: string) => {
//     setSelectedTags((prev) =>
//       prev.includes(tag)
//         ? prev.filter((t) => t !== tag)
//         : [...prev, tag]
//     );
//   };

//   // 🔹 CARD
//   const renderItem = ({ item }: { item: Plugin }) => (
//     <TouchableOpacity
//       className="bg-white dark:bg-gray-900 rounded-xl mb-4 overflow-hidden shadow"
//       onPress={() => {
//         navigation.navigate("PreviewPage", {
//           pluginId: item.pluginId,
//           pluginName: item.pluginName,
//           pluginDescription: item.pluginDescription,
//         });
//       }
//       }
//     >
//       {/* IMAGE */}
//       <View className="w-full bg-gray-200 dark:bg-gray-800 aspect-[1/1] justify-center items-center">
//         {item.pluginLogoUrl ? (
//           <Image
//             source={{ uri: item.pluginLogoUrl }}
//             className="w-full h-full"
//             resizeMode="contain"   // 🔥 change here
//           />
//         ) : (
//           <View className="flex-1 items-center justify-center">
//             <Puzzle size={iconSize} ccolor={colorScheme === "dark" ? "white" : "black"}/>
//           </View>
//         )}
//       </View>

//       {/* INFO */}
//       <View className="p-4">
//         <Text className="text-lg font-semibold text-black dark:text-white">
//           {item.pluginName}
//         </Text>

//         <Text className="text-gray-500 text-sm mt-1">
//           {item.pluginDescription || "No description"}
//         </Text>

//         <Text className="text-xs text-gray-400 mt-2">
//           Installs: {item.pluginInstalls}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );

//   // 🔄 LOADING
//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <AppLayout>
//       <View className="flex-1 bg-white dark:bg-[#1a1a1a]  p-4">
//         {/* 🔹 HEADER */}
//         <Text className="text-xl font-bold text-black dark:text-white mb-3">
//           Apps / Plugins
//         </Text>

//         {/* 🔹 SEARCH */}
//         <TextInput
//           placeholder="Search apps..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           className="bg-gray-200 dark:bg-gray-500 p-3 rounded-lg mb-3 text-black dark:text-white"
//         />

//         {/* 🔹 FILTER DROPDOWN */}
//         <View className="relative mb-3">
//           <TouchableOpacity
//             onPress={() => setShowTagDropdown(!showTagDropdown)}
//             className="flex-row justify-between items-center px-4 py-2 bg-gray-300 dark:bg-gray-500 rounded-lg"
//           >
//             <Text className="text-black dark:text-white text-sm">
//               Filter Tags
//             </Text>
//             <ChevronDown size={iconSize} color={colorScheme === "dark" ? "white" : "black"} />
//           </TouchableOpacity>

//           {showTagDropdown && (
//             <View className="absolute top-12 w-full bg-white dark:bg-gray-100 border border-gray-300 rounded-lg max-h-60 z-50">
//               <ScrollView>
//                 {allTags.map((tag) => (
//                   <TouchableOpacity
//                     key={tag}
//                     onPress={() => toggleTag(tag)}
//                     className="flex-row items-center px-3 py-2"
//                   >
//                     <View
//                       className={`w-4 h-4 mr-2 border rounded ${selectedTags.includes(tag)
//                         ? "bg-blue-500"
//                         : "bg-white"
//                         }`}
//                     />
//                     <Text className="text-black dark:text-black text-sm">
//                       #{tag}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           )}
//         </View>

//         {/* 🔹 SELECTED TAGS */}
//         {selectedTags.length > 0 && (
//           <View className="flex-row flex-wrap mb-3">
//             {selectedTags.map((tag) => (
//               <TouchableOpacity
//                 key={tag}
//                 onPress={() => toggleTag(tag)}
//                 className="bg-blue-500 px-3 py-1 rounded mr-2 mb-2 flex-row items-center"
//               >
//                 <Text className="text-white text-xs">#{tag} ✕</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {/* 🔹 LIST */}
//         {filteredPlugins.length === 0 ? (
//           <View className="flex-1 items-center justify-center p-15">
//             <Puzzle size={iconSize} color={colorScheme === "dark" ? "white" : "black"} />
//             <Text className="text-gray-500 mt-2">
//               No apps found
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={filteredPlugins}
//             renderItem={renderItem}
//             keyExtractor={(item) => item.pluginId}
//           />
//         )}
//       </View>
//     </AppLayout>
//   );
// }


import React, { useEffect, useState } from "react";
import {
  View, 
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import Text from "../components/AppText";
import { Puzzle, ChevronDown, X } from "lucide-react-native";
import api from "../lib/api";
import AppLayout from "./Layout";

interface Tag {
  id: string;
  name: string;
}

export interface Plugin {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  pluginLogoUrl?: string;
  pluginInstalls: number;
  createdAt?: string;
  hashtags?: Tag[];
}

type SortOption = "newest" | "oldest" | "popular" | "name";

export default function Apps({ navigation }: any) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Fetch plugins
  useEffect(() => {
    let active = true;

    const fetchPlugins = async () => {
      try {
        const response = await api.get("/plugin/all");

        if (active) {
          setPlugins(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        console.error("Error fetching plugins:", error);

        if (active) {
          setPlugins([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPlugins();

    return () => {
      active = false;
    };
  }, []);

  // Calculate available tags without useMemo
  const tagSet = new Set<string>();

  plugins.forEach((plugin) => {
    plugin.hashtags?.forEach((tag) => {
      tagSet.add(tag.name);
    });
  });

  const allTags = Array.from(tagSet).sort();

  // Search, filter and sort
  let filteredPlugins = plugins.filter((plugin) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (plugin.pluginName || "").toLowerCase().includes(query) ||
      (plugin.pluginDescription || "").toLowerCase().includes(query);

    const matchesTags =
      selectedTags.length === 0 ||
      !!plugin.hashtags?.some((tag) =>
        selectedTags.includes(tag.name)
      );

    return matchesSearch && matchesTags;
  });

  filteredPlugins = [...filteredPlugins].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime()
        );

      case "popular":
        return (b.pluginInstalls ?? 0) - (a.pluginInstalls ?? 0);

      case "name":
        return (a.pluginName ?? "").localeCompare(
          b.pluginName ?? ""
        );

      case "newest":
      default:
        return (
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
        );
    }
  });

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    );
  };

// App icon grid item
const renderItem = ({ item }: { item: Plugin }) => (
  <View className="mb-4 w-1/3 px-2">
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        navigation.navigate("PreviewPage", {
          pluginId: item.pluginId,
          pluginName: item.pluginName,
          pluginDescription: item.pluginDescription,
        });
      }}
      className="items-center"
      accessibilityRole="button"
      accessibilityLabel={item.pluginName}
    >
      {/* Smaller app icon box */}
      <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
        {item.pluginLogoUrl ? (
          <Image
            source={{ uri: item.pluginLogoUrl }}
            className="h-full w-full"
            resizeMode="contain"
            accessibilityLabel={`${item.pluginName} icon`}
          />
        ) : (
          <Puzzle size={28} color="#6B7280" />
        )}
      </View>

      {/* App name */}
      <Text
        className="mt-2 text-center text-xs font-medium text-gray-900 dark:text-white"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.pluginName}
      </Text>
    </TouchableOpacity>
  </View>
);


  // Loading screen
  if (loading) {
    return (
      <AppLayout>
        <View className="flex-1 items-center justify-center bg-white dark:bg-[#1a1a1a]">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <View className="flex-1 bg-white p-4 dark:bg-[#1a1a1a]">
        {/* Header */}
        <Text className="mb-4 text-xl font-bold text-black dark:text-white">
          Apps
        </Text>

        {/* Search */}
        <TextInput
          placeholder="Search apps..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="mb-3 rounded-xl bg-gray-100 p-3 text-black dark:bg-gray-800 dark:text-white"
          returnKeyType="search"
          autoCorrect={false}
        />

        {/* Tag filter */}
        <View className="relative z-20 mb-3">
          <TouchableOpacity
            onPress={() =>
              setShowTagDropdown((previous) => !previous)
            }
            activeOpacity={0.7}
            className="flex-row items-center justify-between rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800"
          >
            <Text className="text-sm font-medium text-black dark:text-white">
              {selectedTags.length > 0
                ? `Filter Tags (${selectedTags.length})`
                : "Filter Tags"}
            </Text>

            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {showTagDropdown && (
            <View className="absolute left-0 right-0 top-12 max-h-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <ScrollView nestedScrollEnabled>
                {allTags.length === 0 ? (
                  <Text className="p-3 text-sm text-gray-500">
                    No tags available
                  </Text>
                ) : (
                  allTags.map((tag) => {
                    const selected = selectedTags.includes(tag);

                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        className="flex-row items-center px-4 py-3"
                      >
                        <View
                          className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-400 bg-white"
                          }`}
                        >
                          {selected && (
                            <Text className="text-xs font-bold text-white">
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text className="text-sm text-black dark:text-white">
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <View className="mb-3 flex-row flex-wrap">
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                className="mb-2 mr-2 flex-row items-center rounded-full bg-blue-600 px-3 py-2"
              >
                <Text className="text-xs text-white">#{tag}</Text>
                <X size={13} color="#FFFFFF" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setSelectedTags([])}
              className="mb-2 justify-center px-2"
            >
              <Text className="text-xs text-blue-600 dark:text-blue-400">
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results count */}
        <Text className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {filteredPlugins.length} apps available
        </Text>

        {/* Four-column app grid */}
        {filteredPlugins.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Puzzle size={38} color="#9CA3AF" />

            <Text className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No apps found
            </Text>
          </View>
        ) : (
       <FlatList
  data={filteredPlugins}
  renderItem={renderItem}
  keyExtractor={(item) => item.pluginId}
  numColumns={3}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
    paddingTop: 8,
    paddingBottom: 24,
  }}
  columnWrapperStyle={{
    justifyContent: "flex-start",
  }}
/>
        )}
      </View>
    </AppLayout>
  );
}

