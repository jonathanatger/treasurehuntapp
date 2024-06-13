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

function Join() {
  const { height, width } = useWindowDimensions();
  return (
    <ThemedSafeAreaView style={{ height: height, ...styles.container }}>
      <JoinForm />
      <PressableLink text="Go back" style={styles.backlink}></PressableLink>
    </ThemedSafeAreaView>
  );
}

function JoinForm() {
  const userInfo = useContext(appContext).userInfo;
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Code: "" } });

  const onSubmit = async (data: { Code: string }) => {
    if (!userInfo?.email) return;

    const reqBody = { code: data.Code, userEmail: userInfo.email };

    const res = await fetch(domain + "/api/mobile/enterRace", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const responseData = (await res.json()) as {
      joined: boolean;
      result: string;
    };
    console.log(responseData);

    if (responseData.joined) {
      router.push("tracks");
      setError("");
    } else {
      setError(responseData.result);
    }
    return responseData;
  };

  return (
    <ThemedView style={{ height: 300, paddingTop: 50 }}>
      <ThemedText type="subtitle">
        Pour rejoindre une piste, entrez le code ci-dessous
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
      <Button title="Join" onPress={handleSubmit(onSubmit)} />
      <ThemedText>{error}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    height: 50,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  container: {
    fontSize: 30,
    padding: 10,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  input: {
    height: 50,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontSize: 24,
  },
});

export default Join;
