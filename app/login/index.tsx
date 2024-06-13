import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView } from "@/components/ThemedView";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useContext, useEffect, useState } from "react";
import { Button, Linking } from "react-native";
import { AuthSessionRedirectUriOptions, revokeAsync } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext, queryClient } from "../_layout";
import { UserInfoType, domain } from "@/constants/data";

function Login() {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;

  WebBrowser.maybeCompleteAuthSession();

  const googleAuthRequestConfig = {
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: "com.anonymous.treasurehuntapp",
    } satisfies AuthSessionRedirectUriOptions),
  };

  const [request, response, promptAsync] = Google.useAuthRequest(
    googleAuthRequestConfig
  );

  useEffect(() => {
    setGoogleUserAuthInfo();
  }, [response]);

  useEffect(() => {
    checkIfUserIsInDB(userInfo);
  }, [userInfo]);

  const setGoogleUserAuthInfo = async () => {
    try {
      await AsyncStorage.getItem("user").then(async (userJSON) => {
        if (userJSON) {
          setUserInfo(JSON.parse(userJSON));
          router.push("/tracks");
        } else if (response?.type === "success") {
          const user = await getUserInfo(
            //@ts-ignore
            response.authentication.accessToken
          )
            .then((data) => setUserInfo(data))
            .then(() => router.push("/tracks"));
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
      const user = await response.json();
      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("authProvider", "google");
      return user;
    } catch (error) {
      console.error(
        "Failed to fetch user data:",
        //@ts-ignore
        response.status,
        //@ts-ignore
        response.statusText
      );
    }
  };

  return (
    <ThemedSafeAreaView>
      <ThemedText>This is login</ThemedText>
      <Link href="/">Go back</Link>
      <ThemedText>User : {JSON.stringify(userInfo)}</ThemedText>
      <Button
        title="sign in with google"
        onPress={() => {
          promptAsync();
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
  // if (token && authProvider === "google") {
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
      console.log("ERROR at logout", error);
    }
  }
}

export async function checkIfUserIsInDB(userInfo: UserInfoType | null) {
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

  const data = await res.json();

  return data;
}

export default Login;
