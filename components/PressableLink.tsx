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
              ? color === "secondary"
                ? Colors.secondary.muted
                : Colors.light.muted
              : color === "secondary"
              ? Colors.secondary.background
              : Colors.light.background,
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 5,
            minWidth: 90,
            borderRadius: 10,
          },
          style,
        ];
      }}
      onPress={() => {
        if (route) {
          router.push(route);
        } else {
          router.back();
        }
      }}
      {...rest}>
      <ThemedText type={textType ? textType : "defaultSemiBold"}>
        {text}
      </ThemedText>
    </Pressable>
  );
}
