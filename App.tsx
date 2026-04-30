/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @format
 */import React from "react";
import "./global";   // 🔥 THIS IS REQUIRED
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// import { ThemeProvider } from "./src/context/ThemeContext";
import { UserProvider } from "./src/context/UserContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotpasswordScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import Frame from "./src/screens/Frame";
import Apps from "./src/screens/Apps";
import Help from "./src/screens/Help";
import Account from "./src/screens/Account";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PreviewPage from "./src/screens/PreviewPage";
import { ThemeProvider } from "./src/context/ThemeContext";
import { PlaylistCountProvider} from "./src/context/PlayListCountContext";
import PlayList from "./src/screens/PlayList";
import PlayListPreview from "./src/screens/PlayListPreview";
import TermsOfService from "./src/modal/TermsOfService";
import PrivacyPolicy from "./src/modal/PrivacyPolicy";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppLayout from "./src/screens/Layout";
import EmailVerification from "./src/modal/EmailVerification";
import EmailVerificationFailed from "./src/modal/EmailVerificationFailed";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  Frame: undefined;
  Apps: undefined;
  Account: undefined;
  Logout: undefined;
  Help: undefined;
  PreviewPage: {
  pluginId: string;
  pluginName: string;
  pluginDescription?: string;
  };
  PlayList: { id: string };
  PlayListPreview: {
    pluginId: string;
    pluginName: string;
    pluginDescription?: string;
  };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  EmailVerification: { email: string };
  EmailVerificationFailed: { email: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      console.log("TOKEN:", token); 

      if (token) {
        setIsLoggedIn(true);
      }
      setLoading(false);
    };

    checkLogin();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
    <ThemeProvider>
    <PlaylistCountProvider>
   <UserProvider setIsLoggedIn={setIsLoggedIn}>
    {/* <AppLayout> */}
      <NavigationContainer>
        <Stack.Navigator
          key={isLoggedIn ? "app" : "auth"}
          screenOptions={{ headerShown: false }}
        >
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Frame" component={Frame} />
              <Stack.Screen name="Apps" component={Apps} />
              {/* <Stack.Screen name="Logout" component={Logout} /> */}
              <Stack.Screen name="Help" component={Help} />
              <Stack.Screen name="Account" component={Account} />
              <Stack.Screen name="PreviewPage" component={PreviewPage} />
              <Stack.Screen name="PlayList" component={PlayList} />
              <Stack.Screen name="PlayListPreview" component={PlayListPreview} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={() => setIsLoggedIn(true)} 
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="TermsOfService" component={TermsOfService} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
              <Stack.Screen name="EmailVerification" component={EmailVerification} />
              <Stack.Screen name="EmailVerificationFailed" component={EmailVerificationFailed} />
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>
      {/* </AppLayout> */}
    </UserProvider>
  </PlaylistCountProvider>
   </ThemeProvider>
   </SafeAreaProvider>
  );
}