import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView } from "@/components/ThemedView";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useContext, useEffect, useState } from "react";
import { Button, Linking, Platform } from "react-native";
import { AuthSessionRedirectUriOptions, revokeAsync } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext, queryClient } from "../_layout";
import { UserInfoType, domain } from "@/constants/data";
import { set } from "react-hook-form";

function Login() {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = makeRedirectUri({
    scheme: "com.anonymous.treasurehuntapp",
    path: "/login",
  });

  const googleAuthRequestConfig = {
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    redirectUri,
  };

  const [request, response, promptAsync] = Google.useAuthRequest(
    googleAuthRequestConfig
  );

  useEffect(() => {
    setGoogleUserAuthInfo().then(() => {
      if (isLoggingIn) {
        setIsLoggingIn(false);
        router.push("/tracks");
      }
    });
  }, [response]);

  useEffect(() => {}, [userInfo]);

  const setGoogleUserAuthInfo = async () => {
    try {
      await AsyncStorage.getItem("user").then(async (userJSON) => {
        if (userJSON) {
          setUserInfo(JSON.parse(userJSON));
        } else if (response?.type === "success") {
          const user = await getUserInfo(
            //@ts-ignore
            response.authentication.accessToken
          )
            .then((userData) => {
              if (userData) return checkIfUserIsInDB(userData, setUserInfo);
              else return null;
            })
            .then(async (userData) => {
              if (userData) {
                await AsyncStorage.setItem("user", JSON.stringify(userData));
                await AsyncStorage.setItem("authProvider", "google");
              }
            });
        }
      });
    } catch (error) {
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  const getUserInfo = async (token: any) => {
    if (!token) return;

    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user: UserInfoType = await response.json();
      if (user) return user;
      return null;
    } catch (error) {
      console.error(
        "Failed to fetch user data:",
        //@ts-ignore
        response.status,
        //@ts-ignore
        response.statusText
      );
      return null;
    }
  };

  return (
    <ThemedSafeAreaView>
      <ThemedText>This is login</ThemedText>
      <Link href="/">Go back</Link>
      <ThemedText>User : {userInfo?.name}</ThemedText>
      <Button
        title="sign in with google"
        onPress={async () => {
          setIsLoggingIn(true);
          await promptAsync();
        }}
      />
      <Button
        title="sign out"
        onPress={() => {
          logout(setUserInfo);
        }}
      />
    </ThemedSafeAreaView>
  );
}

export async function logout(
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfoType | null>>
) {
  const token = await AsyncStorage.getItem("user");
  const authProvider = await AsyncStorage.getItem("authProvider");
  if (token) {
    try {
      await revokeAsync(
        { token },
        { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
      );
      await AsyncStorage.removeItem("user").then(() => {
        setUserInfo(null);
      });
      await AsyncStorage.removeItem("authProvider");
    } catch (error) {
      console.error("ERROR at logout", error);
    }
  }
}

export async function checkIfUserIsInDB(
  userInfo: UserInfoType | null,
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfoType | null>>
) {
  if (!userInfo) return;

  const res = await fetch(domain + "/api/mobile/checkUser", {
    method: "POST",
    body: JSON.stringify({
      email: userInfo.email,
      id: userInfo.id,
      picture: userInfo.picture,
      name: userInfo.name,
    }),
  });

  const data = (await res.json()) as { found: boolean; user: UserInfoType };

  if (data) {
    return data.user;
  }
  return null;
}

export default Login;
