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
import { set } from "react-hook-form";

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
  const checkForStyleProp = (prop: string) => {
    if (style?.hasOwnProperty(prop)) {
      //@ts-ignore
      return style[prop];
    } else {
      return 0;
    }
  };

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
                  : themeColor === "secondary"
                  ? Colors.secondary.muted
                  : Colors.light.muted
                : themeColor === "primary"
                ? Colors.primary.background
                : themeColor === "secondary"
                ? Colors.secondary.background
                : Colors.light.background,
          },
          style,
        ];
      }}
      onPress={async () => {
        if (async) {
          setLoading(true);
          await onPress().then(() => setLoading(false));
        } else {
          onPress();
        }
      }}
      {...rest}>
      <ThemedText type={textType}>{text}</ThemedText>
      {loading && (
        <View
          style={{
            borderRadius: checkForStyleProp("borderRadius"),
            backgroundColor: "white",
            opacity: 0.5,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <ActivityIndicator style={styles.activityLoader}></ActivityIndicator>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activityLoader: {
    position: "absolute",
  },
});
