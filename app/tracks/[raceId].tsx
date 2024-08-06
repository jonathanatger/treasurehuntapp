import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { router, useLocalSearchParams } from "expo-router";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { PressableLink } from "@/components/PressableLink";
import { useContext, useEffect, useRef, useState } from "react";
import { Colors } from "@/constants/Colors";
import {
  RaceData,
  createNewTeam,
  deleteTeam,
  enterTeam,
  fetchObjectives,
  fetchProjectObjectivesKey,
  fetchRaces,
  fetchRacesKey,
  fetchTeams,
  fetchTeamsKey,
  quitTeam,
} from "@/queries/queries";
import { useQuery } from "@tanstack/react-query";
import { appContext, queryClient } from "../_layout";
import { UserInfoType } from "@/constants/data";
import { Controller, useForm } from "react-hook-form";
import { ThemedPressable } from "@/components/Pressable";
import {
  TransformedSingleTeamData,
  TransformedTeamsData,
  transformTeamsData,
} from "@/functions/functions";

function SpecificRacePage() {
  const { height, width } = useWindowDimensions();
  const { raceId } = useLocalSearchParams();
  const { userInfo } = useContext(appContext);
  const [refreshing, setRefreshing] = useState(false);

  const refreshFunction = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({
      queryKey: [fetchTeamsKey + raceId],
    });

    queryClient
      .refetchQueries({ queryKey: [fetchTeamsKey + raceId] })
      .then(() => {
        setRefreshing(false);
      });

    queryClient.invalidateQueries({ queryKey: [fetchRacesKey] });
    queryClient.refetchQueries({ queryKey: [fetchRacesKey] });
  };

  const {
    data: raceData,
    isLoading: raceIsLoading,
    error: raceError,
  } = useQuery({
    queryKey: ["userRaces"],
    queryFn: async () => {
      const data = await fetchRaces(userInfo?.id);
      return data.data;
    },
  });

  const raceNumberId = raceId ? Number(raceId) : 0;
  let currentRace = null;
  let raceLaunched = false;

  if (raceData) {
    currentRace = raceData?.filter((race) => race.races.id === raceNumberId)[0];

    raceLaunched = currentRace?.races.launched ? true : false;
  }

  const {
    data: projectObjectives,
    isLoading: projectObjectivesIsLoading,
    error: projectObjectivesError,
  } = useQuery({
    queryKey: [fetchProjectObjectivesKey + raceId],
    queryFn: () => {
      return fetchObjectives(raceNumberId);
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

  const userEmail = userInfo?.email ? userInfo.email : "";
  const teamsData = transformTeamsData(teamsRawData);
  const userCurrentTeam = teamsData?.filter(
    (team) => team.users.filter((user) => user.email === userEmail).length > 0
  )[0];

  return (
    <ThemedSafeAreaView style={{ height: height, ...styles.main }}>
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
            route="/tracks"
            style={styles.backlink}></PressableLink>
          <ThemedText
            light
            type="subtitle"
            style={{ fontSize: 20, flexWrap: "wrap", maxWidth: width - 120 }}>
            {currentRace?.races.name || "Préparation des équipes"}
          </ThemedText>
        </ThemedView>
        {!raceLaunched && (
          <NewTeamForm
            userCurrentTeam={userCurrentTeam}
            raceId={raceId}
            userInfo={userInfo}
          />
        )}
        {teamsIsLoading ? (
          <ThemedText light>Waiting for teams to load...</ThemedText>
        ) : teamsData?.length === 0 ? (
          <ThemedText
            style={{
              fontWeight: 200,
              fontStyle: "italic",
            }}>
            (No team has been created yet)
          </ThemedText>
        ) : (
          <TeamCards
            raceLaunched={raceLaunched}
            teams={teamsData}
            userInfo={userInfo}
            raceId={raceId}
            userCurrentTeam={userCurrentTeam}
          />
        )}
      </ScrollView>
      <ThemedView primary style={styles.raceEnterContainer}>
        {currentRace?.races.launched ? (
          <EnterRaceButton raceId={raceId} userCurrentTeam={userCurrentTeam} />
        ) : (
          <ThemedText light type="subtitle">
            Race has not started yet!
          </ThemedText>
        )}
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

function EnterRaceButton({
  raceId,
  userCurrentTeam,
}: {
  raceId: string | string[] | undefined;
  userCurrentTeam: any;
}) {
  const [loading, setLoading] = useState(false);

  if (userCurrentTeam && userCurrentTeam !== undefined) {
    return (
      <ThemedPressable
        themeColor="light"
        text="Enter the race"
        textType="subtitle"
        style={styles.enterRaceButton}
        onPress={() => {
          if (!raceId || typeof raceId !== "string") return;
          const route = "/race/" + raceId;
          router.push(route);
        }}
      />
    );
  }

  return (
    <ThemedPressable
      themeColor="primary"
      text="Enter a team to join the race"
      style={styles.joinTeamBeforeRaceButton}
      onPress={() => {
        ///
      }}
    />
  );
}
const NewTeamForm = ({
  raceId,
  userInfo,
  userCurrentTeam,
}: {
  raceId: string | string[] | undefined;
  userInfo: UserInfoType | null;
  userCurrentTeam: TransformedSingleTeamData | undefined;
}) => {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { Name: "" },
  });
  const onSubmit = async (data: { Name: string }) => {
    if (!userInfo || data.Name === "") return;

    const res = await createNewTeamLogic(
      data.Name,
      raceId,
      userInfo.id,
      userCurrentTeam?.id ?? undefined
    );
    if (res) {
      queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
      queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
      reset();
    }
  };

  return (
    <ThemedView light style={styles.newTeamForm}>
      <ThemedView
        light
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <ThemedText type="subtitle"> Create a new team</ThemedText>
        <ThemedPressable
          async
          themeColor="primary"
          onPress={handleSubmit(onSubmit)}
          style={styles.newTeamButton}
          text="+"
          textType="subtitle"></ThemedPressable>
      </ThemedView>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Enter the name of the new team..."
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.newTeamInput}
          />
        )}
        name="Name"
      />
    </ThemedView>
  );
};

const TeamCards = ({
  teams,
  userInfo,
  raceId,
  raceLaunched,
  userCurrentTeam,
}: {
  teams: TransformedTeamsData | undefined;
  userInfo: UserInfoType | null;
  raceId: string | string[] | undefined;
  raceLaunched: boolean;
  userCurrentTeam: any;
}) => {
  const [loading, setLoading] = useState(false);
  const userName = userInfo?.name ? userInfo.name : "";
  const userEmail = userInfo?.email ? userInfo.email : "";
  const userId = userInfo?.id ? userInfo.id : "";

  return (
    <ThemedView primary style={styles.teamsView}>
      {teams
        ?.sort((a, b) => sortStrings(a.name, b.name))
        .map((team, index) => {
          return (
            <SingleTeamCard
              team={team}
              userId={userId}
              raceId={raceId}
              userCurrentTeam={userCurrentTeam}
              key={team.id}
              userEmail={userEmail}
              raceLaunched={raceLaunched}
            />
          );
        })}
    </ThemedView>
  );
};

const SingleTeamCard = ({
  team,
  raceId,
  userId,
  userEmail,
  userCurrentTeam,
  raceLaunched,
}: {
  team: TransformedSingleTeamData;
  raceId: string | string[] | undefined;
  userId: string;
  userCurrentTeam: TransformedSingleTeamData | undefined;
  userEmail: string;
  raceLaunched: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ThemedView primary style={styles.teamsCard} key={team.id}>
        <ThemedView primary style={styles.teamCardHeader}>
          <ThemedText
            light
            type="title"
            style={{ fontSize: 24, maxWidth: "70%" }}>
            {team.name}
          </ThemedText>
          {team.users.filter((user) => user.email === userEmail).length > 0 && (
            <ThemedText type="title" light style={{ textAlign: "center" }}>
              ✅
            </ThemedText>
          )}
        </ThemedView>
        <ThemedText light style={{ textAlign: "center" }}>
          {team.users.map((user) => user.name).join("\n")}
        </ThemedText>
        <ThemedView light style={styles.teamButtons}>
          {team.users.filter((user) => user.email === userEmail).length > 0 ? (
            <ThemedPressable
              async
              themeColor="light"
              text="Quit"
              disabled={raceLaunched}
              onPress={() => quitTeamLogic(team.id, userId, raceId)}
              style={{
                ...styles.teamSingleButton,
                flex: 1,
                opacity: raceLaunched ? 0.5 : 1,
              }}></ThemedPressable>
          ) : (
            <ThemedPressable
              async
              themeColor="light"
              disabled={raceLaunched && userCurrentTeam !== undefined}
              text="Join"
              onPress={() =>
                enterTeamLogic(
                  team.id,
                  userId,
                  userEmail,
                  userCurrentTeam,
                  raceId
                )
              }
              style={{
                ...styles.teamSingleButton,
                flex: 1,
                opacity: raceLaunched && userCurrentTeam ? 0.5 : 1,
              }}></ThemedPressable>
          )}
          {team.users.length > 0 && team.users[0].email === "" && (
            <ThemedPressable
              async
              text="X"
              themeColor="light"
              disabled={raceLaunched}
              onPress={() => deleteTeamLogic(team.id, raceId)}
              style={{
                opacity: raceLaunched ? 0.5 : 1,
                ...styles.teamSingleButton,
                minWidth: 50,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}></ThemedPressable>
          )}
        </ThemedView>
      </ThemedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
    height: 50,
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
  enterRaceButton: {
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
  },
  joinTeamBeforeRaceButton: {
    padding: 10,
    borderRadius: 10,
  },
  main: {
    flexDirection: "column",
  },
  newTeamForm: {
    flexDirection: "column",
    padding: 5,
    gap: 5,
    borderRadius: 10,
  },
  newTeamButton: {
    borderRadius: 100,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  newTeamInput: {
    borderWidth: 1,
    borderColor: Colors.primary.background,
    paddingLeft: 10,
    borderRadius: 100,
    height: 48,
    color: Colors.light.text,
  },
  raceEnterContainer: {
    minHeight: 40,
    shadowColor: "black",
    padding: 10,
    borderTopColor: Colors.light.background,
    borderTopWidth: 1,
  },
  teamCardHeader: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  teamSingleButton: {
    borderWidth: 1,
    borderColor: Colors.light.background,
    borderRadius: 100,
    padding: 5,
  },
  teamButtons: {
    flexDirection: "row",
    backgroundColor: Colors.primary.background,
    justifyContent: "space-between",
    gap: 20,
  },
  teamsCard: {
    borderWidth: 1,
    borderColor: Colors.light.background,
    height: "auto",
    borderRadius: 18,
    padding: 10,
    gap: 5,
  },

  teamsView: {
    flex: 1,
    gap: 10,
    paddingVertical: 10,
    borderTopColor: Colors.light.background,
    borderTopWidth: 1,
    flexDirection: "column",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "auto",
  },
});

async function createNewTeamLogic(
  name: string,
  raceId: string | string[] | undefined,
  userId: string | undefined,
  formerTeamId?: number
) {
  if (!raceId || Array.isArray(raceId) || userId === undefined)
    throw new Error("No id provided");

  const res = await createNewTeam(
    name,
    Number(raceId),
    userId,
    formerTeamId ?? undefined
  );

  if (!res || res.result === "error") return false;
  else {
    await queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    await queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
  }
  return true;
}

async function quitTeamLogic(
  teamId: number,
  userId: string,
  raceId: string | string[] | undefined
) {
  if (!raceId || Array.isArray(raceId) || userId === undefined)
    throw new Error("No id provided");
  const res = await quitTeam(teamId, userId);

  if (!res || res.result === "error") return false;
  else {
    await queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    await queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
  }
}

async function enterTeamLogic(
  teamId: number,
  userId: string,
  userEmail: string,
  userCurrentTeam: TransformedSingleTeamData | undefined,
  raceId: string | string[] | undefined
) {
  const existingTeamId = userCurrentTeam?.id ?? undefined;
  if (!raceId || Array.isArray(raceId) || userId === undefined) return false;
  const res = await enterTeam(teamId, userId, existingTeamId);

  if (!res || res.result === "error") return false;
  else {
    await queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    await queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
  }
  return true;
}

function sortStrings(a: string, b: string) {
  const nameA = a.toUpperCase();
  const nameB = b.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

async function deleteTeamLogic(
  teamId: number,
  id: string | string[] | undefined
) {
  const res = await deleteTeam(teamId);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + id] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + id] });
  }
  return true;
}

export default SpecificRacePage;
