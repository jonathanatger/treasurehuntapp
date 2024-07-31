import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { useColorScheme, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppContextType, UserInfoType } from "@/constants/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Onboarding from "react-native-onboarding-swiper";
import { Image } from "react-native";
import * as Location from "expo-location";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient();
export const appContext = createContext<AppContextType>({
  userInfo: null,
  setUserInfo: () => {},
  AuthProvider: null,
  setIsFirstTime: () => true,
});
export const AppContextProvider = appContext.Provider;

function Layout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    OswaldMedium: require("../assets/fonts/Oswald-Medium.ttf"),
  });
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const check = checkFirstTime(setIsChecking, setIsFirstTime);
  }, []);

  useEffect(() => {
    if (loaded && !isChecking) {
      SplashScreen.hideAsync();
    }
    if (error) {
      console.error(error);
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isChecking]);

  const onboardingPages = [
    {
      backgroundColor: "#C03F0C",
      image: (
        <Image
          style={{ width: 200, height: 200 }}
          source={require("../assets/images/splash.png")}
        />
      ),
      title: "Welcome !",
      titleStyles: {
        padding: 10,
        fontFamily: "Oswald-Medium",
        color: "#FEF9F6",
      },
      subtitle: "Let's get you ready for your treasure hunt.",
      subTitleStyles: { padding: 10, color: "#FEF9F6" },
    },
    {
      backgroundColor: "#C03F0C",
      image: (
        <Image
          style={{ width: 200, height: 200 }}
          source={require("../assets/images/splash.png")}
        />
      ),
      title: "We will ask you for your location",
      titleStyles: {
        padding: 10,
        fontFamily: "Oswald-Medium",
        color: "#FEF9F6",
      },
      subtitle:
        "It is required to be able to advance in your game, and let the organizers know where you are.",
      subTitleStyles: { padding: 10, color: "#FEF9F6" },
      width: width,
    },
    {
      backgroundColor: "#C03F0C",
      image: (
        <Image
          style={{ width: 200, height: 200 }}
          source={require("../assets/images/splash.png")}
        />
      ),
      titleStyles: {
        padding: 10,
        fontFamily: "Oswald-Medium",
        color: "#FEF9F6",
      },
      title: "Want a change ?",
      subtitle:
        "The location permissions of the app can be changed anytime in the settings of your device.",
      subTitleStyles: { padding: 10, color: "#FEF9F6" },
      width: width,
    },
    {
      backgroundColor: "#C03F0C",
      image: (
        <Image
          style={{ width: 200, height: 200 }}
          source={require("../assets/images/splash.png")}
        />
      ),
      title: "An account is possible - \n but not required",
      titleStyles: {
        padding: 10,
        fontFamily: "Oswald-Medium",
        color: "#FEF9F6",
      },
      subtitle:
        "You can create an account, this way you'll let us save your progress, and will be able to access it later on.",
      subTitleStyles: { padding: 10, color: "#FEF9F6" },
      width: width,
    },
  ];

  const onboardingPageCallback = (pageIndex: number) => {
    if (pageIndex === 2) {
      getLocationPermission();
    }
  };

  function onboardingDone() {
    AsyncStorage.setItem("isFirstTime", "false");
    setIsFirstTime(false);
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
              setIsFirstTime: setIsFirstTime,
            }}>
            {isFirstTime ? (
              <Onboarding
                pages={onboardingPages}
                showSkip={false}
                pageIndexCallback={onboardingPageCallback}
                onDone={onboardingDone}
              />
            ) : (
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
            )}
          </AppContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default Layout;

async function checkFirstTime(
  setIsChecking: React.Dispatch<React.SetStateAction<boolean>>,
  setIsFirstTime: React.Dispatch<React.SetStateAction<boolean>>
) {
  const isFirstTimeInStorage = await AsyncStorage.getItem("isFirstTime");

  if (isFirstTimeInStorage !== null) {
    setIsFirstTime(false);
  }
  setIsChecking(false);
}

async function getLocationPermission() {
  (async () => {
    let { status: firstStatus } =
      await Location.requestForegroundPermissionsAsync();
    let { status } = await Location.requestBackgroundPermissionsAsync();
  })();
}
