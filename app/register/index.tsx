import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";
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

function RegisterEmail() {
  const { height, width } = useWindowDimensions();
  const userInfo = useContext(appContext).userInfo;

  return (
    <ThemedSafeAreaView>
      <ScrollView
        contentContainerStyle={{
          padding: 10,
          height: "auto",
          flexDirection: "column",
          justifyContent: "flex-start",
          backgroundColor: Colors.primary.background,
        }}>
        <PressableLink text="Go back" style={styles.backlink}></PressableLink>
        <ThemedView primary style={{ height: height, ...styles.main }}>
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
  } = useForm({
    defaultValues: { Name: "", Email: "", Password: "", RepeatPassword: "" },
  });

  function errorMessage() {
    const nameError = errors.Name?.message;
    const emailError = errors.Email?.message;
    const passwordError = errors.Password?.message;
    const repeatPasswordError = errors.RepeatPassword?.message;
    const errorArray = [
      nameError,
      emailError,
      passwordError,
      repeatPasswordError,
    ];

    return errorArray.filter((e) => e).join("\n");
  }

  const onSubmit = async (data: {
    Name: string;
    Email: string;
    Password: string;
    RepeatPassword: string;
  }) => {
    if (data.Password !== data.RepeatPassword || data.Password === "") {
      setError("Passwords do not match");
      return;
    }

    const responseData = await emailRegisterCall(
      data.Name,
      data.Email,
      data.Password
    );

    if (responseData?.status) {
      const newUser = { ...responseData.user };
      setUserInfo(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      router.push("/");
    } else {
      setError(responseData.message);
    }
    return responseData;
  };

  return (
    <ThemedView primary style={styles.form}>
      <ThemedText light style={styles.formText}>
        Name
      </ThemedText>
      <Controller
        control={control}
        rules={{
          required: { value: true, message: "Name is required" },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Your name here"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Name"
      />
      <ThemedText style={styles.formText}>Email</ThemedText>
      <Controller
        control={control}
        rules={{
          required: { value: true, message: "Email is required" },
          pattern: {
            value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
            message: "Invalid email address",
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="someone@example.com"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Email"
      />
      <ThemedText style={styles.formText}>Password</ThemedText>
      <Controller
        control={control}
        rules={{
          required: "Password is required",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
            secureTextEntry={true}
          />
        )}
        name="Password"
      />
      <Controller
        control={control}
        rules={{
          required: "Repeat password to confirm",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Repeat Password"
            placeholderTextColor={Colors.primary.placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
            textContentType="password"
            secureTextEntry={true}
          />
        )}
        name="RepeatPassword"
      />
      <ThemedPressable
        onPress={() => {
          setError(errorMessage());
          handleSubmit(onSubmit)();
        }}
        style={styles.editButton}
        text="Let's Go"></ThemedPressable>
      <ThemedText light style={{ minHeight: 100 }}>
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
    backgroundColor: Colors.primary.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary.text,
    color: Colors.primary.text,
  },
  formText: {
    textAlign: "left",
    paddingTop: 10,
    width: "100%",
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
  },
  main: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    padding: 10,
    paddingTop: 20,
  },
});

async function emailRegisterCall(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch(domain + "/api/mobile/emailRegister", {
    method: "POST",
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
    }),
  });

  const data = (await res.json()) as {
    message: string;
    status: boolean;
    user: UserInfoType;
  };
  return data;
}
export default RegisterEmail;
