/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#0a7ea4";

export const Colors = {
  light: {
    text: "#C03F0C",
    background: "#FEF9F6",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    muted: "#fbeadf",
  },
  dark: {
    text: "#1F2937",
    background: "#FEF9F6",
    tint: tintColorDark,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorDark,
  },
  primary: {
    text: "#FEF9F6",
    background: "#C03F0C",
    muted: "#7C7EF4",
  },
  secondary: {
    text: "#FEF9F6",
    background: "#6467F2",
    muted: "#D8470E",
  },
};
