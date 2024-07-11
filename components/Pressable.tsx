import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { ThemedText, ThemedTextProps } from "./ThemedText";
import { StyleSheet } from "react-native";
import { useState } from "react";
import { act } from "react-test-renderer";

export type ThemedPressableProps = PressableProps & {
  textType?: ThemedTextProps["type"];
  route?: string;
  text?: string;
  onPress: any;
  themeColor?: string;
  async?: boolean;
};

export function ThemedPressable({
  style,
  route,
  textType,
  text,
  themeColor,
  async,
  onPress,
  ...rest
}: ThemedPressableProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Pressable
      //@ts-ignore
      style={({ pressed }) => {
        return [
          {
            backgroundColor:
              pressed || loading
                ? themeColor === "primary"
                  ? Colors.primary.muted
                  : Colors.secondary.muted
                : themeColor === "primary"
                ? Colors.primary.background
                : Colors.secondary.background,
          },
          style,
        ];
      }}
      onPress={async () => {
        if (async) {
          setLoading(true);
          await onPress().then(() => {
            setLoading(false);
          });
        } else {
          onPress();
        }
      }}
      {...rest}>
      <ThemedText secondary={true} type={textType}>
        {text}
      </ThemedText>
      {loading && (
        <ActivityIndicator style={styles.activityLoader}></ActivityIndicator>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activityLoader: {
    position: "absolute",
  },
});
