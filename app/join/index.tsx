import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import {
  Button,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Controller, set, useForm } from "react-hook-form";
import { PressableLink } from "@/components/PressableLink";
import { domain } from "@/constants/data";
import { useContext, useState } from "react";
import { appContext } from "../_layout";
import { router } from "expo-router";
import { ThemedPressable } from "@/components/Pressable";

function Join() {
  const { height, width } = useWindowDimensions();
  return (
    <ThemedSafeAreaView style={{ height: height, ...styles.container }}>
      <PressableLink
        text="Go back"
        route="/"
        style={styles.backlink}></PressableLink>
      <JoinForm viewerheight={height} />
    </ThemedSafeAreaView>
  );
}

function JoinForm({ viewerheight }: { viewerheight: number }) {
  const userInfo = useContext(appContext).userInfo;
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Code: "" } });

  const onSubmit = async (data: { Code: string }) => {
    if (!userInfo?.email) return;

    const reqBody = { code: data.Code, userId: userInfo.id };

    const res = await fetch(domain + "/api/mobile/enterRace", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const responseData = (await res.json()) as {
      result: {
        joined: boolean;
        result: string;
      };
    };

    if (responseData.result.joined) {
      router.push("tracks");
      setError("");
    } else {
      setError(responseData.result.result);
    }
    return responseData;
  };

  return (
    <ThemedView
      primary
      style={{ height: viewerheight - 200, ...styles.joinForm }}>
      <ThemedText type="subtitle" light style={{ textAlign: "center" }}>
        To join a race, enter the code below :
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Code"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Code"
      />
      <ThemedPressable
        async
        onPress={handleSubmit(onSubmit)}
        style={styles.joinButton}
        text="Join"></ThemedPressable>
      <ThemedText light style={{ textAlign: "center" }}>
        {error}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    height: 40,
    width: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  joinButton: {
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    height: 48,
    borderRadius: 100,
  },
  joinForm: {
    paddingTop: 50,
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
  },
  input: {
    height: 50,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontSize: 24,
    color: "#FEF9F6",
  },
});

export default Join;
