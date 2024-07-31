import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { PressableLink } from "@/components/PressableLink";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Colors } from "@/constants/Colors";
import { useQuery } from "@tanstack/react-query";
import {
  advanceObjective,
  fetchObjectives,
  fetchProjectObjectivesKey,
  fetchTeams,
  fetchTeamsKey,
  setTeamLocation,
  teamFinishedRace,
} from "@/queries/queries";
import {
  setCurrentTeamId,
  setNumberOfTeamMembers,
  stopTracking,
  transformTeamsData,
} from "../../functions/functions";
import { appContext, queryClient } from "../_layout";
import { getDistanceFromLatLonInM } from "../../functions/functions";
import { ThemedPressable } from "@/components/Pressable";
import {
  LOCATION_TASK_NAME,
  backgroundLocationFetch,
  requestLocationPermissions,
} from "../../functions/functions";
import { set } from "react-hook-form";

function RacePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { height, width } = useWindowDimensions();
  const { raceId } = useLocalSearchParams();
  const numberId = raceId ? Number(raceId) : 0;
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [checkingLocation, setCheckingLocation] = useState(false);

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

  setNumberOfTeamMembers(userCurrentTeamData?.users.length!);
  setCurrentTeamId(userCurrentTeamData?.id!);

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
        <ThemedView
          primary
          style={{
            width: "auto",
            flexDirection: "row",
            justifyContent: "space-between",
          }}>
          <PressableLink
            text="Go back"
            route={"/tracks/" + raceId}
            style={styles.backlink}></PressableLink>
          {isLocationEnabled && !userHasFinishedRace ? (
            <StopTrackingButton raceId={raceId} />
          ) : (
            !isLocationEnabled && (
              <PermissionsButton isSetLocationEnabled={setIsLocationEnabled} />
            )
          )}
        </ThemedView>
        {projectObjectivesIsLoading ? (
          <LoadingScreen />
        ) : userHasFinishedRace ? (
          <VictoryScreen currentTeamId={userCurrentTeamData?.id!} />
        ) : (
          <InRaceScreen
            currentObjective={currentObjective}
            userCurrentTeamData={userCurrentTeamData}
            numberId={numberId}
            finished={finished}
            setRetryMessage={setRetryMessage}
            retryMessage={retryMessage}
            setFinished={setFinished}
            setIsLocationEnabled={setIsLocationEnabled}
            refreshFunction={() => refreshFunction()}
            setCheckingLocation={setCheckingLocation}
            checkingLocation={checkingLocation}
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
  setIsLocationEnabled,
  refreshFunction,
  setCheckingLocation,
  checkingLocation,
}: {
  finished: boolean;
  setRetryMessage: React.Dispatch<React.SetStateAction<boolean>>;
  retryMessage: boolean;
  currentObjective: any;
  userCurrentTeamData: any;
  numberId: number;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLocationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  refreshFunction: any;
  setCheckingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  checkingLocation: boolean;
}) {
  const { height } = useWindowDimensions();

  useEffect(() => {
    const permissionCheck = async () => {
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocationEnabled(false);
        return;
      }
    };

    permissionCheck();

    backgroundLocationFetch();
  }, []);

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
            refreshFunction={refreshFunction}
            setCheckingLocation={setCheckingLocation}
            checkingLocation={checkingLocation}
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (retryMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [retryMessage]);
  return (
    <ThemedView style={styles.objectiveInfoView}>
      <ThemedView light style={styles.objClueText}>
        <ThemedText type="subtitle" style={{ textAlign: "center" }}>
          {message}
        </ThemedText>
      </ThemedView>
      <Animated.View style={{ opacity: fadeAnim }}>
        <ThemedText style={styles.objLocationErrorMessage}>
          You are not at the right place yet...
        </ThemedText>
      </Animated.View>
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

function VictoryScreen({ currentTeamId }: { currentTeamId: number }) {
  useEffect(() => {
    stopTracking();
    teamFinishedRace(currentTeamId);
  }, []);

  return (
    <ThemedView style={styles.victoryScreen}>
      <ThemedText type="title" style={{ textAlign: "center" }}>
        Well played, you finished the race !
      </ThemedText>
    </ThemedView>
  );
}

const StopTrackingButton = ({
  raceId,
}: {
  raceId: string | string[] | undefined;
}) => (
  <ThemedPressable
    onPress={async () => {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (typeof raceId === "string") {
        router.push("/tracks/" + raceId);
      }
    }}
    text="Stop racing for now"
    style={{
      ...styles.backlink,
      minWidth: 200,
      minHeight: 50,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    }}
  />
);

const PermissionsButton = ({
  isSetLocationEnabled,
}: {
  isSetLocationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <ThemedView>
    <ThemedPressable
      onPress={() => {
        requestLocationPermissions().then((result) => {
          if (result) isSetLocationEnabled(true);
        });
      }}
      text="Enable background location"
      style={{ ...styles.backlink, minWidth: 200 }}
    />
  </ThemedView>
);

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
  refreshFunction,
  setCheckingLocation,
  checkingLocation,
}: {
  currentObjective: any;
  setRetryMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  refreshFunction: any;
  setCheckingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  checkingLocation: boolean;
}) {
  const pulsationAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (checkingLocation) {
      console.log("start");
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsationAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(pulsationAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
        ])
      ).start();
    } else {
      console.log("stop");
      pulsationAnim.stopAnimation();
    }
  }, [checkingLocation]);

  return (
    <Animated.View>
      <ThemedPressable
        onPress={async () => {
          setCheckingLocation(true);
          setRetryMessage(true);
          // if (
          //   await checkLocation(
          //     currentObjective?.latitude!,
          //     currentObjective?.longitude!
          //   )
          // ) {
          //   setFinished(true);
          //   setCheckingLocation(false);
          // } else {
          //   refreshFunction();
          //   setRetryMessage(true);
          //   // setCheckingLocation(false);

          setTimeout(() => {
            setRetryMessage(false);
            setCheckingLocation(false);
          }, 5000);
          // }
        }}
        text="Check your location !"
        themeColor="primary"
        style={{ opacity: pulsationAnim, ...styles.button }}
      />
    </Animated.View>
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
    borderRadius: 10,
  },
  main: {
    flexDirection: "column",
    borderRadius: 10,
    gap: 10,
  },
  objClueText: {
    height: "80%",
    textAlign: "center",
    flexDirection: "column",
    justifyContent: "center",
  },
  objLocationErrorMessage: {
    flex: 1,
  },
  objectiveInfoView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  raceButtonView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  raceMessageView: {
    flex: 1,
    borderRadius: 10,
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
  await advanceObjective(teamId, raceId, order, title).then(async (data) => {
    queryClient.invalidateQueries({
      queryKey: [fetchTeamsKey + raceId],
    });
    queryClient.refetchQueries({
      queryKey: [fetchTeamsKey + raceId],
    });
  });
}

export default RacePage;
