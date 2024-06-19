import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  Button,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { PressableLink } from "@/components/PressableLink";
import { useContext, useState } from "react";
import { Colors } from "@/constants/Colors";
import { useQuery } from "@tanstack/react-query";
import {
  fetchObjectives,
  fetchProjectObjectivesKey,
  fetchTeams,
  fetchTeamsKey,
} from "@/queries/queries";
import { transformData } from "../tracks/[id]";
import { appContext, queryClient } from "../_layout";

export default function RacePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { height, width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const numberId = id ? Number(id) : 0;
  async function refreshFunction() {
    queryClient.invalidateQueries({
      queryKey: [fetchProjectObjectivesKey + id],
    });
    queryClient.refetchQueries({
      queryKey: [fetchProjectObjectivesKey + id],
    });
  }
  const {
    data: projectObjectives,
    isLoading: projectObjectivesIsLoading,
    error: projectObjectivesError,
  } = useQuery({
    queryKey: [fetchProjectObjectivesKey + id],
    queryFn: () => {
      return fetchObjectives(numberId);
    },
    staleTime: 1000 * 60 * 60,
  });

  const {
    data: teamsRawData,
    isLoading: teamsIsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: [fetchTeamsKey + id],
    queryFn: () => {
      return fetchTeams(id);
    },
  });

  const { userInfo } = useContext(appContext);
  const userEmail = userInfo?.email ? userInfo.email : "";

  const teamsData = transformData(teamsRawData);
  const userCurrentTeamData = teamsData?.find((team) => {
    const users = team.users;
    for (const user of users) {
      if (user.email === userEmail) {
        return true;
      }
    }
    return false;
  });

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
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        {projectObjectivesIsLoading ? (
          <ThemedText>En attente des objectifs...</ThemedText>
        ) : (
          projectObjectives?.result
            .filter((obj) => obj.order === userCurrentTeamData?.objectiveIndex)
            .map((objective, index) => {
              return (
                <ThemedView style={styles.container} key={index}>
                  <ThemedText type="subtitle">{objective.title}</ThemedText>
                  <ThemedText type="subtitle">{objective.message}</ThemedText>
                </ThemedView>
              );
            })
        )}
      </ScrollView>
      <Pressable
        onPress={() => {
          checkLocation();
        }}
        style={styles.button}>
        <ThemedText>Vous pensez etre au bon endroit ?</ThemedText>
      </Pressable>
    </ThemedSafeAreaView>
  );
}

async function checkLocation() {
  const location = await Location.getCurrentPositionAsync();
  console.log(
    getDistanceFromLatLonInKm(
      location.coords.latitude,
      location.coords.longitude,
      48.856614,
      2.352221
    )
  );
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
    borderRadius: 5,
  },
  button: {
    backgroundColor: Colors.primary.background,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    gap: 10,
  },
});
