import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link, router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { PressableLink } from "@/components/PressableLink";
import { useState } from "react";
import { Colors } from "@/constants/Colors";

function SpecificTrackPage() {
  const { height, width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const [teams, setTeams] = useState<TeamProps[]>([
    { name: "Les ptits fous", id: "1", users: ["bobby", "guigui", "baba"] },
    { name: "Les requins guedins", id: "2" },
    { name: "Boubadibou et voilou", id: "3" },
  ]);

  return (
    <ThemedSafeAreaView style={{ height: height, ...styles.main }}>
      <ScrollView contentContainerStyle={styles.container}>
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        <ThemedText type="title">This is tracks {id}</ThemedText>
        <ThemedText type="subtitle">
          We are waiting on other participants
        </ThemedText>
        <ThemedView style={styles.teamsView}>
          {teams.map((team) => {
            return (
              <ThemedView style={styles.teamsCard} key={"team" + team.name}>
                <ThemedText type="subtitle">
                  This is team {team.name}
                </ThemedText>
                {team.users?.map((user) => {
                  return <ThemedText>{user}</ThemedText>;
                })}
              </ThemedView>
            );
          })}
        </ThemedView>
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
    flexDirection: "column",
  },
  teamsCard: {
    height: "auto",
    backgroundColor: Colors.primary.background,
    borderRadius: 18,
    padding: 5,
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

export type TeamProps = {
  id: string;
  name: string;
  users?: string[];
};
