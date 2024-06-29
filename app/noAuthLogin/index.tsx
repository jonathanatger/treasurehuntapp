import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Link } from "expo-router";

function noAuthLogin() {
  return (
    <ThemedSafeAreaView>
      <ThemedText>This is no auth login</ThemedText>
      <Link href="/">Go back</Link>
    </ThemedSafeAreaView>
  );
}

export default noAuthLogin;
