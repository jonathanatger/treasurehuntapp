import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { router, useLocalSearchParams } from "expo-router";
import {
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
    queryFn: () => {
      return fetchRaces(userInfo?.id);
    },
  });

  const raceNumberId = raceId ? Number(raceId) : 0;
  const currentRace = raceData?.data.filter(
    (race) => race.races.id === raceNumberId
  )[0];

  const raceLaunched = currentRace?.races.launched ? true : false;

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
  );

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
        <PressableLink
          text="Go back"
          route="/tracks"
          style={styles.backlink}></PressableLink>
        <ThemedText type="subtitle" style={{ fontSize: 24 }}>
          {currentRace?.races.name || "Préparation des équipes"}
        </ThemedText>
        {!raceLaunched && <NewTeamForm raceId={raceId} userInfo={userInfo} />}
        {teamsIsLoading ? (
          <ThemedText>Waiting for teams to load...</ThemedText>
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
          />
        )}
      </ScrollView>
      <ThemedView style={styles.raceEnterContainer}>
        {currentRace?.races.launched ? (
          <EnterRaceButton raceId={raceId} userCurrentTeam={userCurrentTeam} />
        ) : (
          <ThemedText type="subtitle">Race has not started yet!</ThemedText>
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

  if (userCurrentTeam && userCurrentTeam.length > 0) {
    return (
      <ThemedPressable
        text="Enter the race"
        themeColor="secondary"
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
}: {
  raceId: string | string[] | undefined;
  userInfo: UserInfoType | null;
}) => {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { Name: "" },
  });
  const onSubmit = async (data: { Name: string }) => {
    if (!userInfo || data.Name === "") return;

    const res = await createNewTeamLogic(data.Name, raceId, userInfo);
    if (res) reset();
  };

  return (
    <ThemedView style={styles.newTeamForm}>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Nom de la nouvelle équipe"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.newTeamInput}
          />
        )}
        name="Name"
      />
      <ThemedPressable
        onPress={handleSubmit(onSubmit)}
        style={styles.newTeamButton}
        text="+"
        textType="subtitle"></ThemedPressable>
    </ThemedView>
  );
};

const TeamCards = ({
  teams,
  userInfo,
  raceId,
  raceLaunched,
}: {
  teams: TransformedTeamsData | undefined;
  userInfo: UserInfoType | null;
  raceId: string | string[] | undefined;
  raceLaunched: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const userName = userInfo?.name ? userInfo.name : "";
  const userEmail = userInfo?.email ? userInfo.email : "";
  const userId = userInfo?.id ? userInfo.id : "";

  return (
    <ThemedView style={styles.teamsView}>
      {teams
        ?.sort((a, b) => sortStrings(a.name, b.name))
        .map((team, index) => {
          return (
            <ThemedView style={styles.teamsCard} key={team.id}>
              <ThemedText type="title" style={{ fontSize: 24 }}>
                {team.name}
              </ThemedText>
              <ThemedText>
                {team.users.map((user) => user.name).join("\n")}
              </ThemedText>
              <ThemedView style={styles.teamButtons}>
                {team.users.filter((user) => user.email === userEmail).length >
                0 ? (
                  <Pressable
                    disabled={raceLaunched}
                    onPress={() => quitTeamLogic(team.id, userId, raceId)}
                    style={{
                      ...styles.teamSingleButton,
                      flex: 1,
                      opacity: raceLaunched ? 0.5 : 1,
                    }}>
                    <ThemedText>Quit</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    disabled={raceLaunched}
                    onPress={() => {
                      enterTeamLogic(team.id, userId, userEmail, teams, raceId);
                    }}
                    style={{
                      ...styles.teamSingleButton,
                      flex: 1,
                      opacity: raceLaunched ? 0.5 : 1,
                    }}>
                    <ThemedText secondary>Join</ThemedText>
                  </Pressable>
                )}
                {team.users.length > 0 && team.users[0].email === "" && (
                  <Pressable
                    disabled={raceLaunched}
                    onPress={() => {
                      deleteTeamLogic(team.id, raceId);
                    }}
                    style={{
                      opacity: raceLaunched ? 0.5 : 1,
                      ...styles.teamSingleButton,
                    }}>
                    <ThemedText secondary>X</ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            </ThemedView>
          );
        })}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
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
    backgroundColor: Colors.primary.muted,
    padding: 10,
    borderRadius: 10,
  },
  main: {
    flexDirection: "column",
  },
  newTeamForm: {
    flexDirection: "row",
  },
  newTeamButton: {
    borderRadius: 100,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  newTeamInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "black",
    paddingLeft: 10,
    borderRadius: 100,
    marginRight: 10,
  },
  raceEnterContainer: {
    minHeight: 40,
    shadowColor: "black",
    padding: 10,
    borderTopColor: Colors.light.icon,
    borderTopWidth: 1,
  },
  teamSingleButton: {
    backgroundColor: Colors.primary.background,
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
    height: "auto",
    backgroundColor: Colors.primary.background,
    borderRadius: 18,
    padding: 10,
    gap: 5,
  },

  teamsView: {
    flex: 1,
    gap: 10,
    paddingVertical: 10,
    borderTopColor: "black",
    borderTopWidth: 1,
    flexDirection: "column",
  },
});

async function createNewTeamLogic(
  name: string,
  raceId: string | string[] | undefined,
  userInfo: UserInfoType | null
) {
  if (!raceId || Array.isArray(raceId) || userInfo?.id === undefined)
    throw new Error("No id provided");

  const res = await createNewTeam(name, Number(raceId), userInfo?.id);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
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
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
  }
  return true;
}

async function enterTeamLogic(
  teamId: number,
  userId: string,
  userEmail: string,
  teams: TransformedTeamsData,
  raceId: string | string[] | undefined
) {
  const existingTeamId = teams.reduce((acc, team) => {
    if (
      team.users.reduce((acc, value) => {
        if (value.email === userEmail) return true;
        else return acc;
      }, false)
    )
      return team.id;
    else return acc;
  }, 0);

  if (!raceId || Array.isArray(raceId) || userId === undefined)
    throw new Error("No id provided");
  const res = await enterTeam(teamId, userId, existingTeamId);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + raceId] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + raceId] });
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
