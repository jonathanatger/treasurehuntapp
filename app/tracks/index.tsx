import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { appContext, queryClient } from "../_layout";
import { PressableLink } from "@/components/PressableLink";
import { RefreshControl } from "react-native";
import { fetchRaces, fetchRacesKey } from "../../queries/queries";

function RacesMainPage() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRaces"],
    queryFn: () => {
      return fetchRaces(userInfo?.id);
    },
  });

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
        <ThemedText type="title">This is tracks main page !</ThemedText>
        {isLoading ? (
          <ThemedText type="title">Loading...</ThemedText>
        ) : data ? (
          <ThemedView>
            {data.data.map((race) => {
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
        ) : (
          <ThemedText>{error?.toString()}</ThemedText>
        )}
        <ThemedText>Pull down to refresh</ThemedText>
      </ScrollView>
    </ThemedSafeAreaView>
  );
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
export default RacesMainPage;
