import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppContextType, UserInfoType } from "@/constants/data";
import { stopTracking } from "@/functions/functions";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient();
export const appContext = createContext<AppContextType>({
  userInfo: null,
  setUserInfo: () => {},
  AuthProvider: null,
});
export const AppContextProvider = appContext.Provider;

function Layout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    OswaldMedium: require("../assets/fonts/Oswald-Medium.ttf"),
  });
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  if (!loaded) {
    return null;
  }
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContextProvider
            value={{
              userInfo: userInfo,
              setUserInfo: setUserInfo,
              AuthProvider: null,
            }}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="race/[raceId]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="tracks/[raceId]"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="tracks/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="login/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="register/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="join/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="noAuthLogin/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="profile/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="support/index"
                options={{ headerShown: false }}
              />
            </Stack>
          </AppContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default Layout;
