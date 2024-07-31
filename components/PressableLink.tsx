import { Pressable, PressableProps, StyleProp, TextStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { ThemedText, ThemedTextProps } from "./ThemedText";

export type PressableLinkProps = PressableProps & {
  textType?: ThemedTextProps["type"];
  route?: string;
  text: string;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
};

export function PressableLink({
  style,
  route,
  textType,
  text,
  color,
  textStyle,
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
                : color === "primary"
                ? Colors.primary.muted
                : Colors.light.muted
              : color === "secondary"
              ? Colors.secondary.background
              : color === "primary"
              ? Colors.primary.background
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
      <ThemedText
        style={textStyle}
        light={color === "primary" || color === "secondary" ? true : false}
        type={textType ? textType : "defaultSemiBold"}>
        {text}
      </ThemedText>
    </Pressable>
  );
}
