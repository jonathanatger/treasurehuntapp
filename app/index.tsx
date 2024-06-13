import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import React, { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appContext } from "./_layout";
import { Link } from "expo-router";
import { PressableLink } from "@/components/PressableLink";
import { logout } from "./login";
import { useQuery } from "@tanstack/react-query";
import { fetchRaces } from "@/queries/queries";

function Homescreen() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;

  useEffect(() => {
    getUserInfoInStorage();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRaces"],
    queryFn: () => {
      return fetchRaces(userInfo?.email);
    },
  });

  const getUserInfoInStorage = async () => {
    await AsyncStorage.getItem("user").then((userJSON) => {
      if (!userJSON || !setUserInfo) return;
      setUserInfo(JSON.parse(userJSON));
    });
  };

  return (
    <ThemedView style={{ height: height, ...styles.container }}>
      <ThemedText type="title" style={styles.title}>
        Treasurio
      </ThemedText>
      <ThemedView style={styles.main}>
        {userInfo ? (
          <>
            <PressableLink
              text="Go to Tracks"
              route="tracks"
              style={styles.links}></PressableLink>
            <PressableLink
              route="join"
              text="Join a Race"
              style={styles.links}
            />
            <Pressable
              onPress={() => logout(setUserInfo)}
              style={{
                ...styles.links,
                backgroundColor: Colors.secondary.background,
              }}>
              <ThemedText style={{ color: Colors.secondary.text }}>
                Logout
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <PressableLink
            text="Login"
            route="login"
            style={styles.links}></PressableLink>
        )}
      </ThemedView>
    </ThemedView>
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
    fontSize: 30,
    height: "auto",
    paddingBottom: 20,
    textAlign: "center",
    lineHeight: 34,
    paddingTop: 30,
  },
});

export default Homescreen;
