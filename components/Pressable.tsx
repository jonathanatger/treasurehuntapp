import { Pressable, PressableProps, StyleProp } from "react-native";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { ThemedText, ThemedTextProps } from "./ThemedText";

export type ThemedPressableProps = PressableProps & {
  textType?: ThemedTextProps["type"];
  route?: string;
  text?: string;
  onPress: any;
  themeColor?: string;
};

export function ThemedPressable({
  style,
  route,
  textType,
  text,
  themeColor,
  ...rest
}: ThemedPressableProps) {
  return (
    <Pressable
      //@ts-ignore
      style={({ pressed }) => {
        return [
          {
            backgroundColor: pressed
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
      {...rest}>
      <ThemedText secondary={true} type={textType}>
        {text}
      </ThemedText>
    </Pressable>
  );
}
