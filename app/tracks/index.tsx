import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { appContext, queryClient } from "../_layout";
import { PressableLink } from "@/components/PressableLink";
// import {
//   Race,
//   RaceOnUserJoin,
// } from "../../../treasurehuntweb/src/server/db/schema";
import { domain } from "@/constants/data";
import { RefreshControl } from "react-native";

const fetchRaces = async (email: string | undefined) => {
  if (!email) throw new Error("No email provided");

  const res = await fetch(domain + "/api/races", {
    method: "POST",
    body: email,
  });

  const data = (await res.json()) as {
    // data: {
    //   races: Race;
    //   raceOnUserJoin: RaceOnUserJoin;
    // }[];
  };
  return data;
};

function TracksMainPage() {
  const { height, width } = useWindowDimensions();
  const [tracksIds, setTracksIds] = useState([1, 2, 3, 4]);
  const userInfo = useContext(appContext).userInfo;
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRaces"],
    queryFn: () => {
      return fetchRaces(userInfo?.email);
    },
  });

  const refreshFunction = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["userRaces"] });
    queryClient.refetchQueries({ queryKey: ["userRaces"] }).then(() => {
      setRefreshing(false);
    });
  };
  return (
    <ThemedSafeAreaView style={{ height: height }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refreshFunction()}
          />
        }>
        <PressableLink
          text="Go back"
          route="/"
          style={styles.backlink}></PressableLink>
        <ThemedText type="title">This is tracks main page !</ThemedText>
        {isLoading ? (
          <ThemedText type="title">Loading...</ThemedText>
        ) : data ? (
          <ThemedView>
            {/* {data.data.map((race) => {
              return (
                <PressableLink
                  route={`/tracks/${race.races.id}`}
                  text={`This is Track ${race.races.id}`}
                  style={styles.trackCard}
                  textType="subtitle"
                  key={"track" + race.races.id.toString()}
                />
              );
            })} */}
          </ThemedView>
        ) : (
          <ThemedText>{error?.toString()}</ThemedText>
        )}
        <ThemedText>Pull down to refresh</ThemedText>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

function Track(props: { id: number }) {
  return <></>;
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
    borderRadius: 5,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    gap: 10,
  },
  main: {
    height: 300,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  trackCard: {
    flexDirection: "column",
    justifyContent: "center",
    alignContent: "center",
    height: 150,
    padding: 10,
    borderRadius: 5,
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
export default TracksMainPage;
