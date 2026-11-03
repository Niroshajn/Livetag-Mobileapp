// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  * @format
//  */import React from "react";
// import "./global";   // 🔥 THIS IS REQUIRED
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";

// // import { ThemeProvider } from "./src/context/ThemeContext";
// import { UserProvider } from "./src/context/UserContext";

// // Screens
// import LoginScreen from "./src/screens/LoginScreen";
// import SignupScreen from "./src/screens/SignupScreen";
// import ForgotPasswordScreen from "./src/screens/ForgotpasswordScreen";
// import DashboardScreen from "./src/screens/DashboardScreen";
// import Frame from "./src/screens/Frame";
// import Apps from "./src/screens/Apps";
// import Help from "./src/screens/Help";
// import Account from "./src/screens/Account";
// import { useEffect, useState } from "react";
// import { View, ActivityIndicator } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import PreviewPage from "./src/screens/PreviewPage";
// import { ThemeProvider } from "./src/context/ThemeContext";
// import { PlaylistCountProvider} from "./src/context/PlayListCountContext";
// import PlayList from "./src/screens/PlayList";
// import PlayListPreview from "./src/screens/PlayListPreview";
// import TermsOfService from "./src/modal/TermsOfService";
// import PrivacyPolicy from "./src/modal/PrivacyPolicy";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import AppLayout from "./src/screens/Layout";
// import EmailVerification from "./src/modal/EmailVerification";
// import EmailVerificationFailed from "./src/modal/EmailVerificationFailed";
// import TenantSelectionScreen from "./src/screens/TenantSelectionScreen";

// export type RootStackParamList = {
//   Login: undefined;
//   Signup: undefined;
//   ForgotPassword: undefined;
//   ResetPassword: { token: string } | undefined;

//   Dashboard: undefined;
//   Frame: undefined;
//   Apps: undefined;
//   Account: undefined;
//   Logout: undefined;
//   Help: undefined;

//   PreviewPage: {
//     pluginId: string;
//     pluginName: string;
//     pluginDescription?: string;
//   };

//   PlayList: { id: string };

//   PlayListPreview: {
//     pluginId: string;
//     pluginName: string;
//     pluginDescription?: string;
//   };

//   TermsOfService: undefined;
//   PrivacyPolicy: undefined;
//   EmailVerification: { email: string };
//   EmailVerificationFailed: { email: string };
// };
// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function App() {
//   const [loading, setLoading] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   useEffect(() => {
//     const checkLogin = async () => {
//       const token = await AsyncStorage.getItem("token");
//       console.log("TOKEN:", token); 

//       if (token) {
//         setIsLoggedIn(true);
//       }
//       setLoading(false);
//     };

//     checkLogin();
//   }, []);

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-black">
//         <ActivityIndicator size="large" color="#fff" />
//       </View>
//     );
//   }
//   return (
//     <SafeAreaProvider >
//     <ThemeProvider>
//     <PlaylistCountProvider>
//    <UserProvider setIsLoggedIn={setIsLoggedIn}>
//     {/* <AppLayout> */}
//       <NavigationContainer>
//         <Stack.Navigator
//           key={isLoggedIn ? "app" : "auth"}
//           screenOptions={{ headerShown: false }}
//         >
//           {isLoggedIn ? (
//             <>
//               <Stack.Screen name="Dashboard" component={DashboardScreen} />
//               <Stack.Screen name="Frame" component={Frame} />
//               <Stack.Screen name="Apps" component={Apps} />
//               {/* <Stack.Screen name="Logout" component={Logout} /> */}
//               <Stack.Screen name="Help" component={Help} />
//               <Stack.Screen name="Account" component={Account} />
//               <Stack.Screen name="PreviewPage" component={PreviewPage} />
//               <Stack.Screen name="PlayList" component={PlayList} />
//               <Stack.Screen name="PlayListPreview" component={PlayListPreview} />
//             </>
//           ) : (
//             <>
//               <Stack.Screen name="Login">
//                 {(props) => (
//                   <LoginScreen
//                     {...props}
//                     onLogin={() => setIsLoggedIn(true)} 
//                   />
//                 )}
//               </Stack.Screen>
//               <Stack.Screen name="Signup" component={SignupScreen} />
//               <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
//               <Stack.Screen name="TermsOfService" component={TermsOfService} />
//               <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
//               <Stack.Screen name="EmailVerification" component={EmailVerification} />
//               <Stack.Screen name="EmailVerificationFailed" component={EmailVerificationFailed} />
//             </>
//           )}

//         </Stack.Navigator>
//       </NavigationContainer>
//       {/* </AppLayout> */}
//     </UserProvider>
//   </PlaylistCountProvider>
//    </ThemeProvider>
//    </SafeAreaProvider>
//   );
// }


import React, { useEffect, useState } from "react";
import "./global";
import {
  NavigationContainer,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import api from "./src/lib/api";
import { UserProvider } from "./src/context/UserContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { PlaylistCountProvider } from "./src/context/PlayListCountContext";
import LoginScreen from "./src/screens/LoginScreen";
import TenantSelectionScreen from "./src/screens/TenantSelectionScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotpasswordScreen";
// Main screens
import DashboardScreen from "./src/screens/DashboardScreen";
import Frame from "./src/screens/Frame";
import Apps from "./src/screens/Apps";
import Help from "./src/screens/Help";
import Account from "./src/screens/Account";
import PreviewPage from "./src/screens/PreviewPage";
import PlayList from "./src/screens/PlayList";
import PlayListPreview from "./src/screens/PlayListPreview";
// User management
import CreateUserScreen from "./src/screens/CreateUserScreen";
import UserManagementScreen from "./src/screens/UserManagementScreen";
// Create these files if they do not exist yet.
import GroupDevices from "./src/screens/GroupDevices";
import GroupPlaylist from "./src/screens/GroupPlaylist";
import EditFrame from "./src/screens/EditFrame";
// Modals / public screens
import TermsOfService from "./src/modal/TermsOfService";
import PrivacyPolicy from "./src/modal/PrivacyPolicy";
import EmailVerification from "./src/modal/EmailVerification";
import EmailVerificationFailed from "./src/modal/EmailVerificationFailed";

// Navigation types
export type RootStackParamList = {
  TenantSelection: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string } | undefined;
EditFrame: {
  id: string;
};
  Dashboard: undefined;
  Groups: undefined;
  Frame: {
    groupId?: string;
    groupName?: string;
    groupCount?: number;
  } | undefined;
  GroupPlaylist: {
    targetId: string;
    groupName?: string;
  };
  Apps: undefined;
  Help: undefined;
  Account: undefined;
  Logout: undefined;
  PreviewPage: {
    pluginId: string;
    pluginName: string;
    pluginDescription?: string;
  };
  PlayList: {
    id: string;
    deviceName?: string;
    modelNo?: string;
    width?: number;
    height?: number;
  };
  PlayListPreview: {
    pluginId: string;
    pluginName: string;
    pluginDescription?: string;
  };
  CreateUser: undefined;
  UserManagement: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  EmailVerification: {
    email: string;
  };
  EmailVerificationFailed: {
    email: string;
  };
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] =
    useState(false);
  const [hasTenant, setHasTenant] =
    useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const tenantData =
          await AsyncStorage.getItem("activeTenant");
        const token =
          await AsyncStorage.getItem("token");
        console.log("========== APP INITIALIZATION ==========");
        if (tenantData) {
          const tenant = JSON.parse(tenantData);

          if (tenant?.id && tenant?.domain) {
            setHasTenant(true);
            api.defaults.headers.common["X-Tenant-ID"] =
              tenant.id;
            api.defaults.headers.common["X-Tenant-Domain"] =
              tenant.domain;
            console.log("ACTIVE TENANT:", tenant.domain);
          } else {
            await AsyncStorage.removeItem("activeTenant");
            setHasTenant(false);
          }
        }

        if (token && tenantData) {
          setIsLoggedIn(true);
          console.log("LOGIN SESSION FOUND");
        } else {
          setIsLoggedIn(false);

          if (token && !tenantData) {
            await AsyncStorage.multiRemove([
              "token",
              "user",
              "isAdmin",
            ]);
          }
        }
      } catch (error) {
        console.log("APP INITIALIZATION ERROR:", error);

        setIsLoggedIn(false);
        setHasTenant(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 justify-center items-center bg-black">
          <ActivityIndicator
            size="large"
            color="#ffffff"
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PlaylistCountProvider>
          <UserProvider setIsLoggedIn={setIsLoggedIn}>
            <NavigationContainer>
              <Stack.Navigator
                key={isLoggedIn ? "app" : "auth"}
                initialRouteName={
                  isLoggedIn
                    ? "Dashboard"
                    : hasTenant
                    ? "Login"
                    : "TenantSelection"
                }
                screenOptions={{
                  headerShown: false,
                }}
              >
                {isLoggedIn ? (
                  <>
                    <Stack.Screen
                      name="Dashboard"
                      component={DashboardScreen}
                    />
                  <Stack.Screen name="Groups" component={GroupDevices} />
<Stack.Screen name="Frame" component={Frame} />
<Stack.Screen
  name="EditFrame"
  component={EditFrame}
/>
                    <Stack.Screen
                      name="GroupPlaylist"
                      component={GroupPlaylist}
                    />
                    <Stack.Screen
                      name="Apps"
                      component={Apps}
                    />
                    <Stack.Screen
                      name="Help"
                      component={Help}
                    />
                    <Stack.Screen
                      name="Account"
                      component={Account}
                    />
                    <Stack.Screen
                      name="PreviewPage"
                      component={PreviewPage}
                    />
                    <Stack.Screen
                      name="PlayList"
                      component={PlayList}
                    />
                    <Stack.Screen
                      name="PlayListPreview"
                      component={PlayListPreview}
                    />
                    <Stack.Screen
                      name="CreateUser"
                      component={CreateUserScreen}
                    />
                    <Stack.Screen
                      name="UserManagement"
                      component={UserManagementScreen}
                    />
                    <Stack.Screen
                      name="TermsOfService"
                      component={TermsOfService}
                    />
                    <Stack.Screen
                      name="PrivacyPolicy"
                      component={PrivacyPolicy}
                    />
                    <Stack.Screen
                      name="EmailVerification"
                      component={EmailVerification}
                    />
                    <Stack.Screen
                      name="EmailVerificationFailed"
                      component={EmailVerificationFailed}
                    />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="TenantSelection">
                      {(props) => (
                        <TenantSelectionScreen
                          {...props}
                          onTenantSelected={() => {
                            setHasTenant(true);
                          }}
                        />
                      )}
                    </Stack.Screen>
                    <Stack.Screen name="Login">
                      {(props) => (
                        <LoginScreen
                          {...props}
                          onLogin={() => {
                            setIsLoggedIn(true);
                          }}
                        />
                      )}
                    </Stack.Screen>

                    {/* AUTH SCREENS */}

                    <Stack.Screen
                      name="Signup"
                      component={SignupScreen}
                    />

                    <Stack.Screen
                      name="ForgotPassword"
                      component={ForgotPasswordScreen}
                    />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </UserProvider>
        </PlaylistCountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
