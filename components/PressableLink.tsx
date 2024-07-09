import { Pressable, PressableProps, StyleProp } from "react-native";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { ThemedText, ThemedTextProps } from "./ThemedText";

export type PressableLinkProps = PressableProps & {
  textType?: ThemedTextProps["type"];
  route?: string;
  text: string;
  color?: string;
};

export function PressableLink({
  style,
  route,
  textType,
  text,
  color,
  ...rest
}: PressableLinkProps) {
  return (
    <Pressable
      //@ts-ignore
      style={({ pressed }) => {
        return [
          {
            backgroundColor: pressed
              ? color === "primary"
                ? Colors.primary.muted
                : Colors.secondary.muted
              : color === "primary"
              ? Colors.primary.background
              : Colors.secondary.background,
          },
          style,
        ];
      }}
      onPress={() => {
        if (route) {
          // router.push(route);
          router.replace(route);
        } else {
          router.back();
        }
      }}
      {...rest}>
      <ThemedText secondary={true} type={textType}>
        {text}
      </ThemedText>
    </Pressable>
  );
}
