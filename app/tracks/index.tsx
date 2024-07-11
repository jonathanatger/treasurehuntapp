import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { appContext, queryClient } from "../_layout";
import { PressableLink } from "@/components/PressableLink";
import { RefreshControl } from "react-native";
import { fetchRaces, fetchRacesKey } from "../../queries/queries";
import { Colors } from "@/constants/Colors";

function RacesMainPage() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRaces"],
    queryFn: async () => {
      const data = await fetchRaces(userInfo?.id);
      return data.data;
    },
  });

  const raceData = data ? (data.length > 0 ? data : null) : null;

  const refreshFunction = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: [fetchRacesKey] });
    queryClient.refetchQueries({ queryKey: [fetchRacesKey] }).then(() => {
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
        <ThemedText type="title">Your races</ThemedText>
        {isLoading ? (
          <ThemedText type="title">Loading...</ThemedText>
        ) : raceData ? (
          <ThemedView style={styles.racesContainer}>
            {raceData.map((race) => {
              return (
                <PressableLink
                  route={`/tracks/${race.races.id}`}
                  text={`${race.races.name}`}
                  style={styles.trackCard}
                  textType="subtitle"
                  key={"track" + race.races.id.toString()}
                />
              );
            })}
          </ThemedView>
        ) : error ? (
          <ThemedText>
            It seems there is an error, are you connected to the internet ?
          </ThemedText>
        ) : (
          <PressableLink
            route="/join"
            text="You have no races yet, join one !"
            style={styles.joinButton}
          />
        )}
        <ThemedText style={{ textAlign: "center", fontStyle: "italic" }}>
          Pull down to refresh
        </ThemedText>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    gap: 10,
  },
  joinButton: {
    backgroundColor: Colors.primary.background,
    minHeight: 70,
  },
  main: {
    height: 300,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  racesContainer: {
    gap: 10,
  },
  trackCard: {
    flexDirection: "column",
    justifyContent: "center",
    alignContent: "center",
    height: 150,
    padding: 10,
    borderRadius: 10,
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
export default RacesMainPage;
