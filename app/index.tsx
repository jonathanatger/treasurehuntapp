import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import React, { useContext, useEffect, useState } from "react";
import {
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
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);

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
    <ThemedSafeAreaView style={{ height: height, ...styles.container }}>
      <ThemedView style={{ flexDirection: "column", alignItems: "center" }}>
        <Image
          source={require("@/assets/images/adaptive-icon.png")}
          style={{ height: 100, width: 100 }}></Image>
        <ThemedText type="title" style={styles.title}>
          Treasurio
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.main}>
        {!isLocationEnabled && (
          <Pressable
            onPress={() =>
              Location.requestBackgroundPermissionsAsync
            }></Pressable>
        )}
        {userInfo ? (
          <>
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
          </>
        ) : (
          <>
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
          </>
        )}
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 24,
    height: 300,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
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
