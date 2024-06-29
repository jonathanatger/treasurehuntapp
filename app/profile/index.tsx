import { PressableLink } from "@/components/PressableLink";
import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";
import { appContext } from "../_layout";
import { Colors } from "@/constants/Colors";
import { Controller, set, useForm } from "react-hook-form";
import { domain } from "@/constants/data";
import { logout } from "../login";
import { router } from "expo-router";
import { ThemedPressable } from "@/components/Pressable";
import AsyncStorage from "@react-native-async-storage/async-storage";

function Profile() {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isEditing, setIsEditing] = useState(false);
  const [variableName, setVariableName] = useState("");

  return (
    <ThemedSafeAreaView style={styles.container}>
      <PressableLink text="Go back" style={styles.backlink}></PressableLink>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedView style={styles.main}>
        {!isEditing ? (
          <>
            <ThemedText style={{ paddingVertical: 20 }} type="subtitle" primary>
              {userInfo?.name ? userInfo?.name : "No user connected."}
            </ThemedText>
            <ThemedPressable
              onPress={() => {
                setIsEditing(true);
              }}
              text="Edit my name"
              style={styles.editButton}></ThemedPressable>
          </>
        ) : (
          <EditNameForm setIsEditing={setIsEditing} />
        )}
      </ThemedView>
      <ThemedPressable
        style={styles.editButton}
        text="Log out"
        onPress={() => {
          logout(setUserInfo);
          router.push("/login");
        }}></ThemedPressable>
      <ThemedPressable
        style={styles.editButton}
        text="Support"
        onPress={() => {
          router.push("/support");
        }}></ThemedPressable>
    </ThemedSafeAreaView>
  );
}

function EditNameForm({ setIsEditing }: { setIsEditing: any }) {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Name: "" } });

  const onSubmit = async (data: { Name: string }) => {
    if (!userInfo?.email) return;
    console.log(data);

    const reqBody = { name: data.Name, userEmail: userInfo.email };

    const res = await fetch(domain + "/api/mobile/editName", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const responseData = (await res.json()) as {
      changed: boolean;
      result: string;
    };

    if (responseData.changed) {
      const newUser = { ...userInfo, name: data.Name };
      setUserInfo(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setIsEditing(false);
    } else {
      setError(responseData.result);
    }
    console.log(responseData);
    return responseData;
  };

  return (
    <ThemedView style={styles.form}>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="New name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
          />
        )}
        name="Name"
      />
      <ThemedPressable
        onPress={handleSubmit(onSubmit)}
        style={styles.editButton}
        text="Change"></ThemedPressable>
      <ThemedPressable
        onPress={() => setIsEditing(false)}
        text="X"
        style={styles.editButton}></ThemedPressable>
      <ThemedText>{error}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
    borderRadius: 5,
  },
  container: {
    padding: 5,
    flexDirection: "column",
    gap: 10,
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
    justifyContent: "center",
    minHeight: 300,
    gap: 10,
    padding: 10,
    backgroundColor: Colors.primary.background,
    borderRadius: 10,
    color: Colors.primary.text,
  },
});

export default Profile;
