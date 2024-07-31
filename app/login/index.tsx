import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { useContext, useEffect, useState } from "react";
import { Platform, TextInput, View, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext } from "../_layout";
import { UserInfoType, domain } from "@/constants/data";
import { PressableLink } from "@/components/PressableLink";
import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { ThemedPressable } from "@/components/Pressable";
import { ThemedText } from "@/components/ThemedText";
import { Controller, set, useForm } from "react-hook-form";

export const ANDROID_CLIENT_ID =
  "499556521140-mofu5nq6upk5q8jk4a3bsvh7ho8v47t2.apps.googleusercontent.com";
export const IOS_CLIENT_ID =
  "499556521140-u23ghdeve49lepfqhjthtast2gl2epha.apps.googleusercontent.com";
export const WEB_CLIENT_ID =
  "499556521140-dgd0u528ipkgn8m5gdnlukptgfmv0mn7.apps.googleusercontent.com";

function Login() {
  const userInfo = useContext(appContext).userInfo;
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { height, width } = useWindowDimensions();
  const [error, setError] = useState("");

  // Apple Auth -----------------------
  useEffect(() => {
    if (Platform.OS === "ios") {
      const checkAvailable = async () => {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAuthAvailable(isAvailable);
      };
      checkAvailable();
    }
  }, []);

  //Google Auth -----------------------
  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = makeRedirectUri({
    scheme: "com.jonathanatger.treasurehuntapp",
    path: "/login",
  });

  const googleAuthRequestConfig = {
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
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
            .then(async (userData) => {
              if (userData) {
                const user = await checkIfUserIsInDB(userData);
                return user;
              } else return null;
            })
            .then(async (userData) => {
              if (userData) {
                await AsyncStorage.setItem(
                  "user",
                  JSON.stringify({ ...userData, provider: "google" })
                );

                setUserInfo(userData);
              }
            });
        }
      });
    } catch (error) {
      setError("Error retrieving user data from phone storage.");
      setIsLoggingIn(false);
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
      setError("Failed to fetch user data.");
      setIsLoggingIn(false);
      return null;
    }
  };

  return (
    <ThemedSafeAreaView
      primary
      style={{
        height: height,
        width: width,
        padding: 10,
        flexDirection: "column",
        gap: 10,
      }}>
      <PressableLink text="Go back" route="/" style={styles.backlink} />
      <ThemedView primary style={{ flex: 1, ...styles.container }}>
        <ThemedView style={styles.form}>
          <ThemedPressable
            themeColor="primary"
            text="Sign in with Google"
            async
            onPress={async () => {
              setIsLoggingIn(true);
              await promptAsync();
            }}
            style={styles.googleButton}
          />
          {appleAuthAvailable && (
            <AppleAuth setIsLoggingIn={setIsLoggingIn} setError={setError} />
          )}
          <View
            style={{
              height: 1,
              borderBottomColor: Colors.primary.background,
              borderBottomWidth: 1,
              borderWidth: 1,
              borderColor: Colors.light.background,
              marginVertical: 10,
            }}
          />
          <EmailAuth setIsLoggingIn={setIsLoggingIn} />
        </ThemedView>
        <ThemedText style={{ minHeight: 24 }}>
          {isLoggingIn ? "We are connecting..." : ""}
        </ThemedText>
        <ThemedText light style={{ minHeight: 30 }}>
          {error}
        </ThemedText>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

function AppleAuth({
  setIsLoggingIn,
  setError,
}: {
  setIsLoggingIn: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
}) {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;

  if (Platform.OS !== "ios")
    return <ThemedText>No Apple Auth on Android</ThemedText>;

  const login = async () => {
    let appleUser: UserInfoType | null = null;
    setIsLoggingIn(true);

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
    } catch (e) {
      setIsLoggingIn(false);
    }

    if (appleUser) {
      const user = await checkIfUserIsInDB(appleUser);

      if (user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...user, provider: "apple" })
        ).then(() => {
          setUserInfo(user);
          setIsLoggingIn(false);
          router.push("tracks");
        });
      } else {
        setError("Could not connect to the service.");
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={styles.appleSignInButton}
      onPress={async () => {
        login();
      }}
    />
  );
}

function EmailAuth({
  setIsLoggingIn,
}: {
  setIsLoggingIn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const setUserInfo = useContext(appContext).setUserInfo;
  const [error, setError] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Email: "", Password: "" } });

  function errorMessage() {
    const emailError = errors.Email?.message;
    const passwordError = errors.Password?.message;
    let message: string = "";
    if (emailError) message += emailError;
    if (emailError && passwordError) {
      message += "\n";
    }
    if (passwordError) message += passwordError;
    return message;
  }

  const onSubmit = async (data: { Email: string; Password: string }) => {
    const reqBody = { email: data.Email, password: data.Password };

    const res = await fetch(domain + "/api/mobile/emailLogin", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const responseData = (await res.json()) as {
      message: string;
      user: UserInfoType;
      status: boolean;
    };

    if (responseData.status) {
      const newUser = { ...responseData.user };
      setUserInfo(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      router.push("/");
    } else {
      setError(responseData.message);
    }
    return responseData;
  };

  return (
    <ThemedView style={styles.emailLogin}>
      <Controller
        control={control}
        rules={{
          required: true,
          pattern: {
            value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
            message: "Invalid email address",
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="your@email.com"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Email"
      />
      <Controller
        control={control}
        rules={{
          required: "Password is required",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            placeholderTextColor={Colors.primary.placeholder}
            textContentType="password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
            secureTextEntry={true}
          />
        )}
        name="Password"
      />
      <ThemedPressable
        themeColor="primary"
        onPress={() => {
          setError(errorMessage());
          handleSubmit(onSubmit)();
        }}
        style={styles.googleButton}
        text="Sign in"
      />
      <PressableLink
        color="light"
        text="Do not have an account ? Sign up here"
        textStyle={{
          textAlign: "center",
          fontWeight: "400",
          fontStyle: "italic",
          fontSize: 14,
        }}
        route="register"
        style={styles.registerLink}
      />
      <ThemedText style={styles.errorMessage}>{error}</ThemedText>
    </ThemedView>
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

  const data = (await res.json()) as {
    found: boolean;
    user: UserInfoType | undefined;
  };

  if (data) {
    return data.user;
  }
  return null;
}

const styles = StyleSheet.create({
  appleSignInButton: {
    width: "auto",
    height: 50,
    borderRadius: 10,
  },
  backlink: {
    width: 70,
    padding: 3,
  },
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    padding: 10,
  },
  emailLogin: {
    flexDirection: "column",
    gap: 10,
  },
  errorMessage: {
    color: Colors.primary.text,
    fontWeight: 600,
    fontSize: 18,
    textAlign: "center",
  },
  form: {
    flexDirection: "column",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.background,
  },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    height: 50,
  },
  input: {
    height: 50,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontSize: 18,
    width: "100%",
    backgroundColor: Colors.light.background,
  },
  registerLink: {
    borderWidth: 1,
    borderColor: Colors.primary.background,
    borderRadius: 10,
    padding: 5,
    marginTop: 10,
  },
});

export default Login;
