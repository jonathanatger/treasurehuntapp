import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  primary?: boolean;
  secondary?: boolean;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  primary,
  secondary,
  type = "defaultSemiBold",
  ...rest
}: ThemedTextProps) {
  const color =
    primary || secondary
      ? Colors.primary.text
      : useThemeColor({ light: lightColor, dark: darkColor }, "text");

  const fontFamily =
    type === ("title" || "default" || "defaultSemiBold" || "subtitle")
      ? "Oswald-Medium"
      : "";

  const minHeight =
    type === "title" ? 60 : type === "subtitle" ? 25 : undefined;

  const letterSpacing = 0.8;

  return (
    <Text
      style={[
        { color, fontFamily, minHeight, letterSpacing },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Roboto",
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 45,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
