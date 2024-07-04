import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { PressableLink } from "@/components/PressableLink";
import React, { useContext, useEffect, useState } from "react";
import { Colors } from "@/constants/Colors";
import { useQuery } from "@tanstack/react-query";
import {
  advanceObjective,
  fetchObjectives,
  fetchProjectObjectivesKey,
  fetchTeams,
  fetchTeamsKey,
} from "@/queries/queries";
import { transformTeamsData } from "../../functions/functions";
import { appContext, queryClient } from "../_layout";
import { getDistanceFromLatLonInM } from "../../functions/functions";
import { ThemedPressable } from "@/components/Pressable";

function RacePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { height, width } = useWindowDimensions();
  const { raceId } = useLocalSearchParams();
  const numberId = raceId ? Number(raceId) : 0;
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Activez la géolocalisation pour pouvoir utiliser l'appli");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

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

  const teamsData = transformTeamsData(teamsRawData);
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
    <ThemedSafeAreaView style={{ height: height, flexDirection: "column" }}>
      <ScrollView
        contentContainerStyle={{ flex: 1, ...styles.container }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refreshFunction()}
          />
        }>
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        {projectObjectivesIsLoading ? (
          <LoadingScreen />
        ) : userHasFinishedRace ? (
          <VictoryScreen />
        ) : (
          <InRaceScreen
            currentObjective={currentObjective}
            userCurrentTeamData={userCurrentTeamData}
            numberId={numberId}
            finished={finished}
            setRetryMessage={setRetryMessage}
            retryMessage={retryMessage}
            setFinished={setFinished}
          />
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

function LoadingScreen() {
  return <ThemedText>En attente des objectifs...</ThemedText>;
}

function InRaceScreen({
  finished,
  setRetryMessage,
  retryMessage,
  currentObjective,
  userCurrentTeamData,
  numberId,
  setFinished,
}: {
  finished: boolean;
  setRetryMessage: React.Dispatch<React.SetStateAction<boolean>>;
  retryMessage: boolean;
  currentObjective: any;
  userCurrentTeamData: any;
  numberId: number;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { height } = useWindowDimensions();

  return (
    <ThemedView style={{ flex: 1, ...styles.main }}>
      <ThemedView style={styles.raceMessageView}>
        {finished ? (
          <CongratulationsMessage />
        ) : (
          <ObjectiveInfo
            message={currentObjective?.message}
            retryMessage={retryMessage}
          />
        )}
      </ThemedView>
      <ThemedView style={styles.raceButtonView}>
        {finished ? (
          <AdvanceToNextObjectiveButton
            userCurrentTeamData={userCurrentTeamData}
            numberId={numberId}
            currentObjective={currentObjective}
            setFinished={setFinished}
          />
        ) : (
          <CheckLocationButton
            setFinished={setFinished}
            currentObjective={currentObjective}
            setRetryMessage={setRetryMessage}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

function ObjectiveInfo({
  message,
  retryMessage,
}: {
  message: string | undefined;
  retryMessage: boolean;
}) {
  return (
    <ThemedView style={styles.objectiveInfoView}>
      <ThemedText type="subtitle">{message}</ThemedText>
      {retryMessage && (
        <ThemedText> Vous n'êtes pas encore au bon endroit...</ThemedText>
      )}
    </ThemedView>
  );
}

function CongratulationsMessage() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>Congratulations, you found the objective !</ThemedText>
    </ThemedView>
  );
}

function VictoryScreen() {
  return (
    <ThemedView style={styles.victoryScreen}>
      <ThemedText type="title" primary>
        Bravo, dernier objectif atteint !
      </ThemedText>
    </ThemedView>
  );
}

function AdvanceToNextObjectiveButton({
  userCurrentTeamData,
  numberId,
  currentObjective,
  setFinished,
}: {
  userCurrentTeamData: any;
  numberId: number;
  currentObjective: any;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <ThemedPressable
      onPress={() => {
        advanceToNextObjectiveLogic(
          userCurrentTeamData?.id!,
          numberId,
          currentObjective?.order!,
          currentObjective?.title!
        );
        setFinished(false);
      }}
      text="Advance to next objective !"
      style={styles.button}
    />
  );
}
function CheckLocationButton({
  currentObjective,
  setRetryMessage,
  setFinished,
}: {
  currentObjective: any;
  setRetryMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <ThemedPressable
      onPress={async () => {
        if (
          await checkLocation(
            currentObjective?.latitude!,
            currentObjective?.longitude!
          )
        ) {
          setFinished(true);
        } else {
          setRetryMessage(true);

          setTimeout(() => {
            setRetryMessage(false);
          }, 5000);
        }
      }}
      text="Check your location !"
      themeColor="primary"
      style={styles.button}
    />
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
    borderRadius: 105,
    textAlign: "center",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    height: 200,
    width: 200,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    gap: 10,
  },
  main: {
    flexDirection: "column",
    gap: 10,
  },
  objectiveInfoView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  raceButtonView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  raceMessageView: {
    flex: 1,
  },
  victoryScreen: {
    flex: 1,
    margin: 10,
    backgroundColor: Colors.primary.background,
    borderRadius: 10,
    color: Colors.primary.text,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
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
