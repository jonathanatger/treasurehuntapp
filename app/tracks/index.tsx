import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
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

  const pulsationAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading, error } = useQuery({
    queryKey: ["userRaces"],
    queryFn: async () => {
      const data = await fetchRaces(userInfo?.id);
      return data.data;
    },
  });

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsationAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(pulsationAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
        ])
      ).start();
    } else {
      pulsationAnim.stopAnimation();
    }
  }, [isLoading]);

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
        <ThemedView primary style={styles.topBar}>
          <PressableLink
            text="Go back"
            route="/"
            style={styles.backlink}></PressableLink>
          <ThemedText light type="title">
            Your races
          </ThemedText>
        </ThemedView>
        {isLoading ? (
          <Animated.View style={{ opacity: pulsationAnim }}>
            <ThemedView primary style={styles.loading}>
              <ThemedText light type="subtitle">
                Loading...
              </ThemedText>
            </ThemedView>
          </Animated.View>
        ) : raceData ? (
          <ThemedView primary style={styles.racesContainer}>
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
          <ThemedText light>
            It seems there is an error, are you connected to the internet ?
          </ThemedText>
        ) : (
          <PressableLink
            route="/join"
            style={{ minHeight: 90 }}
            text="You have no races yet, join one !"
          />
        )}
        <ThemedText light style={{ textAlign: "center", fontStyle: "italic" }}>
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
  loading: {
    flexDirection: "column",
    height: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 50,
  },
});
export default RacesMainPage;
