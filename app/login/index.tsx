import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { useContext, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext } from "../_layout";
import { UserInfoType, domain } from "@/constants/data";
import { PressableLink } from "@/components/PressableLink";
import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { ThemedPressable } from "@/components/Pressable";
import { ThemedText } from "@/components/ThemedText";

function Login() {
  const userInfo = useContext(appContext).userInfo;
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { height, width } = useWindowDimensions();

  // Apple Auth -----------------------
  useEffect(() => {
    const checkAvailable = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);
    };
    checkAvailable();
  }, []);

  // Google Auth -----------------------
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
        if (response?.type === "success") {
          router.push("tracks");
        }
      }
    });
  }, [response]);

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
              if (userData) return checkIfUserIsInDB(userData);
              else return null;
            })
            .then(async (userData) => {
              if (userData) {
                await AsyncStorage.setItem(
                  "user",
                  JSON.stringify({ ...userData, provider: "google" })
                );
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
    <ThemedSafeAreaView style={{ height: height, width: width }}>
      <PressableLink text="Go back" style={styles.backlink}></PressableLink>
      <ThemedView style={{ height: height - 50, ...styles.container }}>
        <ThemedView style={styles.form}>
          <ThemedPressable
            text="Sign in with Google"
            onPress={async () => {
              setIsLoggingIn(true);
              await promptAsync();
            }}
            style={styles.googleButton}
          />
          {appleAuthAvailable && <AppleAuth setIsLoggingIn={setIsLoggingIn} />}
        </ThemedView>
        {isLoggingIn && <ThemedText> We are connecting ...</ThemedText>}
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

function AppleAuth({
  setIsLoggingIn,
}: {
  setIsLoggingIn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;

  const login = async () => {
    let appleUser: UserInfoType | null = null;

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      appleUser = {
        name: credential.fullName?.givenName || "Apple user",
        email: credential.email || "no email",
        picture: "",
        id: credential.user,
        provider: "apple",
      };
      console.log("appleUser", appleUser);
    } catch (e) {
      console.error(e);
    }

    if (appleUser) {
      checkIfUserIsInDB(appleUser).then(async (userData) => {
        if (userData) {
          console.log("userData", userData);
          await AsyncStorage.setItem(
            "user",
            JSON.stringify({ ...userData, provider: "apple" })
          ).then(() => {
            setIsLoggingIn(false);
            router.push("tracks");
          });
        } else {
          console.error("User not found in DB");
        }
      });
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={5}
      style={styles.appleSignInButton}
      onPress={async () => {
        login();
      }}
    />
  );
}

async function checkIfUserIsInDB(userInfo: UserInfoType | null) {
  if (!userInfo) return;

  const res = await fetch(domain + "/api/mobile/checkUser", {
    method: "POST",
    body: JSON.stringify({
      email: userInfo.email,
      id: userInfo.id,
      picture: userInfo.picture,
      name: userInfo.name,
      provider: userInfo.provider,
    }),
  });

  const data = (await res.json()) as { found: boolean; user: UserInfoType };

  if (data) {
    return data.user;
  }
  return null;
}

const styles = StyleSheet.create({
  appleSignInButton: {
    width: 200,
    height: 50,
  },
  backlink: {
    width: 70,
    padding: 3,
    borderRadius: 5,
  },
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },
  form: {
    flexDirection: "column",
    gap: 10,
    backgroundColor: Colors.primary.background,
    padding: 10,
    borderRadius: 10,
  },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    height: 50,
  },
});

export default Login;
