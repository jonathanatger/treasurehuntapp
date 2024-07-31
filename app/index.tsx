import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext } from "./_layout";
import { PressableLink } from "@/components/PressableLink";
import { useQuery } from "@tanstack/react-query";
import { fetchRaces, fetchRacesKey } from "@/queries/queries";
import * as Location from "expo-location";
import { stopTracking } from "@/functions/functions";

function Homescreen() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const setIsFirstTime = useContext(appContext).setIsFirstTime;
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim2, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!userInfo) {
    try {
      stopTracking();
    } catch {}
  }

  useEffect(() => {
    (async () => {
      let { status: firstStatus } =
        await Location.requestForegroundPermissionsAsync();
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocationEnabled(false);
        return;
      }
    })();
  }, []);

  useEffect(() => {
    getUserInfoInStorage();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: [fetchRacesKey],
    queryFn: async () => {
      const data = await fetchRaces(userInfo?.id);
      return data.data;
    },
  });

  const getUserInfoInStorage = async () => {
    await AsyncStorage.getItem("user").then((userJSON) => {
      if (!userJSON || !setUserInfo) return;
      setUserInfo(JSON.parse(userJSON));
    });
  };

  return (
    <ThemedSafeAreaView primary style={{ height: height, ...styles.container }}>
      <ThemedView
        primary
        style={{ flexDirection: "column", alignItems: "center" }}>
        <Animated.Image
          source={require("@/assets/images/icon.png")}
          style={{
            opacity: fadeAnim2,
            height: 100,
            width: 100,
          }}></Animated.Image>
      </ThemedView>
      <ThemedView primary style={styles.main}>
        {userInfo ? (
          <Animated.View
            style={{
              opacity: fadeAnim,
              ...styles.buttonContainer,
            }}>
            <PressableLink
              route="join"
              text="Join a Race"
              textType="subtitle"
              style={styles.links}
            />
            <PressableLink
              text="Go to Races"
              route="tracks"
              textType="subtitle"
              style={styles.links}></PressableLink>
            <PressableLink
              text="Profile"
              route="profile"
              textType="subtitle"
              style={styles.links}></PressableLink>
            <Pressable
              onPress={() => setIsFirstTime(true)}
              style={{
                height: 30,
                width: "100%",
                backgroundColor: "#FEF9F6",
              }}></Pressable>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              ...styles.buttonContainer,
            }}>
            <PressableLink
              text="Login"
              route="login"
              textType="subtitle"
              style={styles.links}></PressableLink>
            <PressableLink
              text="Continue as guest"
              route="noAuthLogin"
              textType="subtitle"
              style={styles.links}></PressableLink>
            <Pressable
              onPress={() => setIsFirstTime(true)}
              style={{
                height: 30,
                width: "100%",
                backgroundColor: "#FEF9F6",
              }}></Pressable>
          </Animated.View>
        )}
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "column",
    width: "100%",
    height: "100%",
    gap: 10,
  },
  container: {
    fontSize: 30,
    borderColor: "#20232a",
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: "column",
    justifyContent: "space-between",
    color: "white",
  },
  links: {
    // ...Shadows.base,
    borderRadius: 24,
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    height: 300,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  title: {
    fontSize: 50,
    height: "auto",
    paddingBottom: 20,
    textAlign: "center",
    lineHeight: 34,
    paddingTop: 20,
    color: Colors.secondary.background,
  },
});

export default Homescreen;
