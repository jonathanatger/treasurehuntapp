import { View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  primary?: boolean;
  secondary?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  primary,
  secondary,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = primary
    ? Colors.primary.background
    : secondary
    ? Colors.secondary.background
    : useThemeColor({ light: lightColor, dark: darkColor }, "background");

  const text = primary
    ? Colors.primary.text
    : secondary
    ? Colors.secondary.text
    : useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ThemedSafeAreaView({
  style,
  lightColor,
  darkColor,
  primary,
  secondary,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = primary
    ? Colors.primary.background
    : secondary
    ? Colors.secondary.background
    : useThemeColor({ light: lightColor, dark: darkColor }, "background");

  return <SafeAreaView style={[{ backgroundColor }, style]} {...otherProps} />;
}
