import { Pressable, PressableProps, StyleProp } from "react-native";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { ThemedText, ThemedTextProps } from "./ThemedText";

export type ThemedPressableProps = PressableProps & {
  textType?: ThemedTextProps["type"];
  route?: string;
  text?: string;
  onPress: () => {};
};

export function ThemedPressable({
  style,
  route,
  textType,
  text,
  onPress,
  ...rest
}: ThemedPressableProps) {
  return (
    <Pressable
      //@ts-ignore
      style={({ pressed }) => {
        return [
          {
            backgroundColor: pressed
              ? Colors.secondary.muted
              : Colors.secondary.background,
          },
          style,
        ];
      }}
      onPress={() => {
        onPress();
      }}
      {...rest}>
      <ThemedText secondary={true} type={textType}>
        {text}
      </ThemedText>
    </Pressable>
  );
}
