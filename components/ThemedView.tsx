import { View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  light?: boolean;
  secondary?: boolean;
  primary?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  light,
  secondary,
  primary,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = light
    ? Colors.light.background
    : secondary
    ? Colors.secondary.background
    : primary
    ? Colors.primary.background
    : useThemeColor({ light: lightColor, dark: darkColor }, "background");

  const text = light
    ? Colors.light.text
    : secondary
    ? Colors.secondary.text
    : useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ThemedSafeAreaView({
  style,
  lightColor,
  darkColor,
  light,
  secondary,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = light
    ? Colors.light.background
    : secondary
    ? Colors.secondary.background
    : Colors.primary.background; //useThemeColor({ light: lightColor, dark: darkColor }, "background");

  return <SafeAreaView style={[{ backgroundColor }, style]} {...otherProps} />;
}
