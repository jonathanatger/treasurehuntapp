import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";
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
          source={require("@/assets/images/adaptive-icon.png")}
          style={{
            opacity: fadeAnim2,
            height: 300,
            maxHeight: 300,
            width: width,
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
              textStyle={{ fontFamily: "Oswald-Medium" }}
              style={styles.links}
            />
            <PressableLink
              text="Your races"
              route="tracks"
              textType="subtitle"
              textStyle={{ fontFamily: "Oswald-Medium" }}
              style={styles.links}></PressableLink>
            <PressableLink
              text="Profile"
              route="profile"
              textType="subtitle"
              textStyle={{ fontFamily: "Oswald-Medium" }}
              style={styles.links}></PressableLink>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              ...styles.buttonContainer,
            }}>
            <PressableLink
              color="primary"
              text="Continue without account"
              route="noAuthLogin"
              textType="subtitle"
              textStyle={{ fontFamily: "Oswald-Medium" }}
              style={styles.links}></PressableLink>
            <PressableLink
              color="primary"
              text="Login"
              route="login"
              textType="subtitle"
              textStyle={{ fontFamily: "Oswald-Medium" }}
              style={styles.links}></PressableLink>
            {/* <Pressable
              onPress={() => {
                setIsFirstTime(true);
              }}
              style={{
                height: 10,
                width: width,
                backgroundColor: "white",
              }}></Pressable> */}
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary.text,
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.24,
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
