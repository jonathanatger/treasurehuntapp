import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { TextInput } from "react-native";
import { appContext } from "../_layout";
import { useContext, useEffect, useState } from "react";
import { UserInfoType, domain } from "@/constants/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";
import { ThemedPressable } from "@/components/Pressable";
import { PressableLink } from "@/components/PressableLink";
import { ScrollView } from "react-native";
import { router } from "expo-router";

function NoAuthLogin() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;

  useEffect(() => {
    if (userInfo) router.push("/");
  }, []);

  return (
    <ThemedSafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 10, height: height }}>
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        <ThemedView primary style={{ height: height - 100, ...styles.main }}>
          <ThemedText light type="title">
            Choose a name to start
          </ThemedText>
          <ChooseNameForm />
        </ThemedView>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

function ChooseNameForm() {
  const setUserInfo = useContext(appContext).setUserInfo;
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Name: "" } });

  const onSubmit = async (data: { Name: string }) => {
    const reqBody = { name: data.Name };

    const res = await fetch(domain + "/api/mobile/guestSubscription", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const responseData = (await res.json()) as {
      created: boolean;
      result: UserInfoType;
      error: string;
    };

    if (responseData.created) {
      const newUser = { ...responseData.result };
      setUserInfo(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      router.push("/");
    } else {
      setError(responseData.error);
    }
    return responseData;
  };

  return (
    <ThemedView style={styles.form}>
      <Controller
        control={control}
        rules={{
          required: true,
          minLength: 6,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="New name"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Name"
      />
      <ThemedPressable
        async
        themeColor="primary"
        onPress={() => {
          setError("");
          if (errors.Name?.type === "minLength")
            setError("Name must be at least 6 characters");

          handleSubmit(onSubmit)();
        }}
        style={styles.editButton}
        text="Let's Go"></ThemedPressable>
      <ThemedText style={{ color: Colors.primary.text, textAlign: "center" }}>
        {error}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
  },
  editButton: {
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    height: 48,
    borderRadius: 100,
  },
  form: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 10,
    width: "100%",
    borderRadius: 10,
    color: Colors.primary.text,
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
    width: "100%",
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
  },
  main: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 10,
  },
});

export default NoAuthLogin;
