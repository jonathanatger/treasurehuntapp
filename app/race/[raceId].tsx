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
  advanceObjective,
  fetchObjectives,
  fetchProjectObjectivesKey,
  fetchTeams,
  fetchTeamsKey,
} from "@/queries/queries";
import { transformData } from "../tracks/[raceId]";
import { appContext, queryClient } from "../_layout";
import { getDistanceFromLatLonInM } from "../../functions/functions";

function RacePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { height, width } = useWindowDimensions();
  const { raceId } = useLocalSearchParams();
  const numberId = raceId ? Number(raceId) : 0;
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");

  async function refreshFunction() {
    setFinished(false);
    queryClient.invalidateQueries({
      queryKey: [fetchProjectObjectivesKey + raceId],
    });
    queryClient.refetchQueries({
      queryKey: [fetchProjectObjectivesKey + raceId],
    });
    queryClient.invalidateQueries({
      queryKey: [fetchTeamsKey + raceId],
    });
    queryClient.refetchQueries({
      queryKey: [fetchTeamsKey + raceId],
    });
  }

  const {
    data: projectObjectives,
    isLoading: projectObjectivesIsLoading,
    error: projectObjectivesError,
  } = useQuery({
    queryKey: [fetchProjectObjectivesKey + raceId],
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
    queryKey: [fetchTeamsKey + raceId],
    queryFn: () => {
      return fetchTeams(raceId);
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

  const currentObjective = projectObjectives?.result.filter(
    (obj) => obj.order === userCurrentTeamData?.objectiveIndex
  )[0];

  const userHasFinishedRace =
    projectObjectives?.result?.length! <= userCurrentTeamData?.objectiveIndex!;

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
        ) : userHasFinishedRace ? (
          <VictoryScreen />
        ) : (
          <ObjectiveInfo
            title={currentObjective?.title}
            message={currentObjective?.message}
          />
        )}
        <ThemedView>
          {retryMessage && <ThemedText>{retryMessage}</ThemedText>}
        </ThemedView>
        {finished && (
          <ThemedView>
            <ThemedText> Bravo, objectif atteint !</ThemedText>
            <Pressable
              onPress={() => {
                advanceToNextObjectiveLogic(
                  userCurrentTeamData?.id!,
                  numberId,
                  currentObjective?.order!,
                  currentObjective?.title!
                );
                setFinished(false);
              }}
              style={styles.button}>
              <ThemedText>Passer au prochain objectif !</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ScrollView>
      {!userHasFinishedRace && (
        <Pressable
          onPress={async () => {
            if (
              await checkLocation(
                currentObjective?.latitude!,
                currentObjective?.longitude!
              )
            ) {
              setFinished(true);
            } else {
              setRetryMessage("Ce n'est pas ici ! :)");

              setTimeout(() => {
                setRetryMessage("");
              }, 5000);
            }
          }}
          style={styles.button}>
          <ThemedText>Vous pensez etre au bon endroit ?</ThemedText>
        </Pressable>
      )}
    </ThemedSafeAreaView>
  );
}

function ObjectiveInfo({
  title,
  message,
}: {
  title: string | undefined;
  message: string | undefined;
}) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="subtitle">{message}</ThemedText>
    </ThemedView>
  );
}
function VictoryScreen() {
  return (
    <ThemedView>
      <ThemedText>Bravo, dernier objectif atteint !</ThemedText>
    </ThemedView>
  );
}

async function checkLocation(lat: number, lon: number) {
  const location = await Location.getCurrentPositionAsync();
  const distance = getDistanceFromLatLonInM(
    location.coords.latitude,
    location.coords.longitude,
    lat,
    lon
  );
  if (distance < 50) {
    return true;
  }
  return false;
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

async function advanceToNextObjectiveLogic(
  teamId: number,
  raceId: number,
  order: number,
  title: string
) {
  const res = await advanceObjective(teamId, raceId, order, title).then(
    async () => {
      queryClient.invalidateQueries({
        queryKey: [fetchTeamsKey + raceId],
      });
      queryClient.refetchQueries({
        queryKey: [fetchTeamsKey + raceId],
      });
    }
  );
}

export default RacePage;
