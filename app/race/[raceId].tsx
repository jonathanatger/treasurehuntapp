import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import {
  Animated,
  AppState,
  Easing,
  Platform,
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
  teamFinishedRace,
} from "@/queries/queries";
import {
  requestLocationPermissions,
  setCurrentTeamId,
  stopTracking,
  transformTeamsData,
} from "../../functions/functions";
import { appContext, queryClient } from "../_layout";
import { getDistanceFromLatLonInM } from "../../functions/functions";
import { ThemedPressable } from "@/components/Pressable";
import {
  LOCATION_TASK_NAME,
  backgroundLocationFetchIos,
} from "../../functions/functions";
import { Icon } from "react-native-elements/dist/icons/Icon";

function RacePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { height, width } = useWindowDimensions();
  const { raceId } = useLocalSearchParams();
  const numberId = raceId ? Number(raceId) : 0;
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | undefined>(
    undefined
  );
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [checkingLocation, setCheckingLocation] = useState(false);

  async function refreshFunction() {
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

  setCurrentTeamId(userCurrentTeamData?.id!);

  const currentObjective = projectObjectives?.result.filter(
    (obj) => obj.order === userCurrentTeamData?.objectiveIndex
  )[0];

  const userHasFinishedRace =
    projectObjectives?.result?.length! <= userCurrentTeamData?.objectiveIndex!;

  return (
    <ThemedSafeAreaView style={{ height: height, ...styles.container }}>
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
        {!userHasFinishedRace && Platform.OS !== "android" && (
          <StopTrackingButton raceId={raceId} />
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
          isLocationEnabled={isLocationEnabled}
        />
      )}
    </ThemedSafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <ThemedText style={{ textAlign: "center" }}>
      We are waiting for the objectives...
    </ThemedText>
  );
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
  isLocationEnabled,
}: {
  finished: boolean;
  setRetryMessage: React.Dispatch<React.SetStateAction<string | undefined>>;
  retryMessage: string | undefined;
  currentObjective: any;
  userCurrentTeamData: any;
  numberId: number;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLocationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  refreshFunction: any;
  setCheckingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  checkingLocation: boolean;
  isLocationEnabled: boolean;
}) {
  const appState = useRef(AppState.currentState);
  const [backgroundListener, setBackgroundListener] = useState(true);

  useEffect(() => {
    if (Platform.OS === "android") return;

    requestLocationPermissions().then((result) => {
      if (result) {
        setIsLocationEnabled(true);
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then(
          (hasStarted) => {
            if (!hasStarted) backgroundLocationFetchIos();
          }
        );
      }
    });
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
  retryMessage: string | undefined;
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
      fadeAnim.setValue(0);
    }
  }, [retryMessage]);
  return (
    <ThemedView style={styles.objectiveInfoView}>
      <ScrollView
        nestedScrollEnabled={true}
        style={{
          borderColor: Colors.primary.background,
          borderWidth: 1,
          borderRadius: 10,
          height: "100%",
        }}
        contentContainerStyle={{
          flexDirection: "column",
          alignItems: "center",
          paddingVertical: 30,
          paddingHorizontal: 10,
        }}>
        <ThemedView light style={styles.objClueText}>
          <Icon
            iconStyle={{ color: Colors.primary.background, height: 70 }}
            size={50}
            name="info"
          />
          <ThemedText
            type="subtitle"
            style={{
              textAlign: "center",
            }}>
            {message}
          </ThemedText>
        </ThemedView>
      </ScrollView>
      <Animated.View
        style={{
          opacity: fadeAnim,
          borderWidth: 1,
          borderColor: Colors.primary.background,
          borderRadius: 10,
          padding: 10,
          marginTop: 10,
        }}>
        <ThemedText style={styles.objLocationErrorMessage}>
          {retryMessage}
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

function CongratulationsMessage() {
  return (
    <ThemedView style={styles.congratulationsMessage}>
      <ThemedText style={{ textAlign: "center" }}>
        Congratulations, you found the objective !
      </ThemedText>
    </ThemedView>
  );
}

function VictoryScreen({ currentTeamId }: { currentTeamId: number }) {
  useEffect(() => {
    teamFinishedRace(currentTeamId);

    if (Platform.OS === "android") return;
    stopTracking();
  }, []);

  return (
    <ThemedView primary style={styles.victoryScreen}>
      <ThemedText light type="title" style={{ textAlign: "center" }}>
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
    async
    onPress={async () => {
      stopTracking();

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

// function PermissionsButton({
//   setIsLocationEnabled,
// }: {
//   setIsLocationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
// }) {
//   const [message, setMessage] = useState("Enable background location");
//   return (
//     <ThemedPressable
//       onPress={() => {
//         requestLocationPermissions().then((result) => {
//           if (result) setIsLocationEnabled(true);
//           else {
//             setMessage("Your settings need to be updated");
//           }
//         });
//       }}
//       text={message}
//       style={{ width: 220, borderRadius: 10, padding: 10 }}
//     />
//   );
// }

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
  const [disabled, setDisabled] = useState(false);
  return (
    <ThemedPressable
      async
      themeColor="secondary"
      disabled={disabled}
      textStyle={{ textAlign: "center" }}
      onPress={async () => {
        setDisabled(true);

        advanceToNextObjectiveLogic(
          userCurrentTeamData?.id!,
          numberId,
          currentObjective?.order!,
          currentObjective?.title!
        ).then((data) => {
          setDisabled(false);
        });
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
  setRetryMessage: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  refreshFunction: any;
  setCheckingLocation: React.Dispatch<React.SetStateAction<boolean>>;
  checkingLocation: boolean;
}) {
  const pulsationAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (checkingLocation) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsationAnim, {
            toValue: 0.6,
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
      pulsationAnim.stopAnimation();
      pulsationAnim.setValue(1);
    }
  }, [checkingLocation]);

  return (
    <Animated.View style={{ opacity: pulsationAnim }}>
      <ThemedPressable
        onPress={async () => {
          setCheckingLocation(true);
          const check = await checkLocation(
            currentObjective?.latitude!,
            currentObjective?.longitude!
          );

          if (check.isLocationEnabled && check.check) {
            setFinished(true);

            setCheckingLocation(false);
            refreshFunction();
          } else {
            if (check.isLocationEnabled === false) {
              setRetryMessage(
                "❌ Your location is disabled. You can enable it in your phone settings."
              );
            } else {
              setRetryMessage("❌ You are not at the right place yet...");
            }
          }
          setCheckingLocation(false);

          setTimeout(() => {
            setRetryMessage(undefined);
          }, 5000);
        }}
        text="Check your location !"
        themeColor="primary"
        style={styles.button}
        textStyle={{ textAlign: "center" }}
      />
    </Animated.View>
  );
}

async function checkLocation(lat: number, lon: number) {
  const result = await requestLocationPermissions();
  if (!result) {
    return { isLocationEnabled: false, check: false };
  }
  const location = await Location.getCurrentPositionAsync();
  const distance = getDistanceFromLatLonInM(
    location.coords.latitude,
    location.coords.longitude,
    lat,
    lon
  );
  if (distance < 50) {
    return { isLocationEnabled: true, check: true };
  }
  return { isLocationEnabled: true, check: false };
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
  congratulationsMessage: {
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
    textAlign: "center",
    flexDirection: "column",
    flexGrow: 1,
    justifyContent: "center",
    overflow: "visible",
    pointerEvents: "auto",
  },
  objLocationErrorMessage: {
    minHeight: 50,
    textAlign: "center",
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
    borderRadius: 10,
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
  const data = await advanceObjective(teamId, raceId, order, title).then(
    async (data) => {
      queryClient.invalidateQueries({
        queryKey: [fetchTeamsKey + raceId],
      });
      queryClient.refetchQueries({
        queryKey: [fetchTeamsKey + raceId],
      });
      return data;
    }
  );
  return data;
}

export default RacePage;
