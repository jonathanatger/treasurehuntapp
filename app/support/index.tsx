import { PressableLink } from "@/components/PressableLink";
import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Linking, StyleSheet, useWindowDimensions } from "react-native";

function SupportPage() {
  const { height, width } = useWindowDimensions();

  return (
    <ThemedSafeAreaView
      primary
      style={{ height: height, width: width, ...styles.container }}>
      <PressableLink text="Go back" style={styles.backlink}></PressableLink>
      <ThemedText light type="title">
        Support
      </ThemedText>
      <ThemedText light type="subtitle">
        Contact us for any questions or feedback :
      </ThemedText>
      <ThemedText light>jonathan.atger@gmail.com</ThemedText>
      <ThemedText light type="subtitle">
        To view our privacy policy, please visit :
      </ThemedText>
      <ThemedText
        light
        onPress={() =>
          Linking.openURL("https://treasurehunt-jet.vercel.app/privacypolicy")
        }
        style={{ textDecorationLine: "underline" }}>
        Privacy Policy
      </ThemedText>
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
    padding: 5,
    flexDirection: "column",
    gap: 10,
  },
});

export default SupportPage;
