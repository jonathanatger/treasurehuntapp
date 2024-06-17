import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link, router, useLocalSearchParams } from "expo-router";
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
import {
  RaceData,
  createNewTeam,
  enterTeam,
  fetchRaces,
  fetchTeams,
  fetchTeamsKey,
  quitTeam,
} from "@/queries/queries";
import { useQuery } from "@tanstack/react-query";
import { appContext, queryClient } from "../_layout";
import { UserInfoType } from "@/constants/data";
import { Controller, set, useForm } from "react-hook-form";

function SpecificTrackPage() {
  const { height, width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const { userInfo } = useContext(appContext);
  const [refreshing, setRefreshing] = useState(false);

  const refreshFunction = async () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + id] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + id] }).then(() => {
      setRefreshing(false);
    });
  };
  const {
    data: raceData,
    isLoading: raceIsLoading,
    error: raceError,
  } = useQuery({
    queryKey: ["userRaces"],
    queryFn: () => {
      return fetchRaces(userInfo?.email);
    },
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

  const teamsData = transformData(teamsRawData);

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
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        <ThemedText type="title">This is tracks {id}</ThemedText>
        <ThemedText type="subtitle">La course n'a pas commencé !</ThemedText>
        <NewTeamForm id={id} userInfo={userInfo} />
        {teamsIsLoading ? (
          <ThemedText>En attente des équipes...</ThemedText>
        ) : (
          <TeamCard teams={teamsData} userInfo={userInfo} id={id} />
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

const NewTeamForm = ({
  id,
  userInfo,
}: {
  id: string | string[] | undefined;
  userInfo: UserInfoType | null;
}) => {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { Name: "" },
  });
  const onSubmit = async (data: { Name: string }) => {
    if (!userInfo || data.Name === "") return;

    const res = await createNewTeamLogic(data.Name, id, userInfo);
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
            placeholder="Nom"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.newTeamInput}
          />
        )}
        name="Name"
      />
      <Button title="Create new team" onPress={handleSubmit(onSubmit)} />
    </ThemedView>
  );
};

const TeamCard = ({
  teams,
  userInfo,
  id,
}: {
  teams: TransformedTeamsData | undefined;
  userInfo: UserInfoType | null;
  id: string | string[] | undefined;
}) => {
  const [loading, setLoading] = useState(false);
  const userName = userInfo?.name ? userInfo.name : "";
  const userEmail = userInfo?.email ? userInfo.email : "";

  return (
    <ThemedView style={styles.teamsView}>
      {teams
        ?.sort((a, b) => {
          const nameA = a.name.toUpperCase();
          const nameB = b.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }

          return 0;
        })
        .map((team, index) => {
          return (
            <ThemedView style={styles.teamsCard}>
              <ThemedText type="title">{team.name}</ThemedText>
              <ThemedText type="subtitle">
                {team.users.map((user) => user.name).join(", ")}
              </ThemedText>
              <ThemedView style={styles.teamButtons}>
                {team.users.filter((user) => user.email === userEmail).length >
                0 ? (
                  <Pressable
                    onPress={() => quitTeamLogic(team.id, userEmail, id)}
                    style={{ ...styles.teamSingleButton, flex: 1 }}>
                    <ThemedText>Quitter</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      enterTeamLogic(team.id, userEmail, teams, id);
                    }}
                    style={{ ...styles.teamSingleButton, flex: 1 }}>
                    <ThemedText secondary>Rejoindre</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    // console.log("Rejoindre");
                  }}
                  style={styles.teamSingleButton}>
                  <ThemedText secondary>X</ThemedText>
                </Pressable>
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
  main: {
    flexDirection: "column",
  },
  newTeamForm: {
    flexDirection: "row",
  },
  newTeamInput: {
    flex: 1,
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
export default SpecificTrackPage;

function transformData(data: RaceData) {
  let returnData = [] as TransformedTeamsData;

  if (!data) return undefined;
  for (const user of data.result) {
    let found = false;

    for (const team of returnData) {
      if (team.id === user.teams.id) {
        team.users.push({
          name: user.users?.name ? user.users.name : "",
          email: user.users?.email ? user.users.email : "",
        });
        found = true;
        break;
      }
    }

    if (!found) {
      returnData.push({
        id: user.teams.id,
        name: user.teams.name,
        users: [
          {
            name: user.users?.name ? user.users.name : "",
            email: user.users?.email ? user.users.email : "",
          },
        ],
      });
    }
  }
  return returnData;
}

type TransformedTeamsData = {
  id: number;
  name: string;
  users: { name: string; email: string }[];
}[];

async function createNewTeamLogic(
  name: string,
  id: string | string[] | undefined,
  userInfo: UserInfoType | null
) {
  if (!id || Array.isArray(id) || userInfo?.email === undefined)
    throw new Error("No id provided");
  const res = await createNewTeam(name, Number(id), userInfo?.email);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + id] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + id] });
  }
  return true;
}
async function quitTeamLogic(
  teamId: number,
  userEmail: string,
  id: string | string[] | undefined
) {
  if (!id || Array.isArray(id) || userEmail === undefined)
    throw new Error("No id provided");
  const res = await quitTeam(teamId, userEmail);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + id] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + id] });
  }
  return true;
}

async function enterTeamLogic(
  teamId: number,
  userEmail: string,
  teams: TransformedTeamsData,
  id: string | string[] | undefined
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
  if (!id || Array.isArray(id) || userEmail === undefined)
    throw new Error("No id provided");
  const res = await enterTeam(teamId, userEmail, existingTeamId);

  if (!res || res.result === "error") return false;
  else {
    queryClient.invalidateQueries({ queryKey: [fetchTeamsKey + id] });
    queryClient.refetchQueries({ queryKey: [fetchTeamsKey + id] });
  }
  return true;
}
