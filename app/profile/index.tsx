import { PressableLink } from "@/components/PressableLink";
import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import { appContext } from "../_layout";
import { Colors } from "@/constants/Colors";
import { Controller, set, useForm } from "react-hook-form";
import { domain } from "@/constants/data";
import { logout } from "@/functions/functions";
import { router } from "expo-router";
import { ThemedPressable } from "@/components/Pressable";
import AsyncStorage from "@react-native-async-storage/async-storage";

function Profile() {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ThemedSafeAreaView>
      <ScrollView>
        <ThemedView style={styles.container}>
          <PressableLink text="Go back" style={styles.backlink}></PressableLink>
          <ThemedText type="title">Profile</ThemedText>
          <ThemedView style={styles.main}>
            {!isEditing ? (
              <>
                <ThemedText
                  style={{ paddingVertical: 20 }}
                  type="subtitle"
                  primary>
                  {userInfo?.name ? userInfo?.name : "No name "}
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
            async
            onPress={async () => {
              logout(setUserInfo);
              router.push("/");
            }}></ThemedPressable>
          <ThemedPressable
            style={styles.editButton}
            text="Support"
            onPress={() => {
              router.push("support");
            }}></ThemedPressable>
          <DeleteUserComponent />
        </ThemedView>
      </ScrollView>
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
    if (!userInfo?.id) return;

    const reqBody = { name: data.Name, userId: userInfo.id };

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
        async
        text="Change"></ThemedPressable>
      <ThemedPressable
        onPress={() => setIsEditing(false)}
        text="Back"
        style={styles.backButton}></ThemedPressable>
      <ThemedText>{error}</ThemedText>
    </ThemedView>
  );
}

function DeleteUserComponent() {
  const userInfo = useContext(appContext).userInfo;
  const setUserInfo = useContext(appContext).setUserInfo;
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  return (
    <ThemedView style={styles.deletionView}>
      {isDeleting ? (
        <>
          <ThemedText primary>
            Are you sure you want to delete your account ? You will lose access
            to all the races you have entered. Please confirm below.
          </ThemedText>
          <ThemedPressable
            text="Keep my account"
            onPress={() => {
              setIsDeleting(false);
            }}
            style={styles.editButton}></ThemedPressable>
          <ThemedPressable
            text="Delete !"
            async
            onPress={async () => {
              deleteUserLogic(userInfo, setUserInfo, setError);
            }}
            style={styles.deleteButton}></ThemedPressable>
          <ThemedText primary>{error}</ThemedText>
        </>
      ) : (
        <ThemedPressable
          text="Delete my account"
          onPress={() => {
            setIsDeleting(true);
          }}
          style={styles.editButton}></ThemedPressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backlink: {
    width: 70,
    padding: 3,
  },
  backButton: {
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    height: 48,
    borderRadius: 100,
    backgroundColor: Colors.primary.background,
    borderColor: Colors.primary.text,
    borderWidth: 1,
  },
  container: {
    padding: 5,
    flexDirection: "column",
    gap: 10,
  },
  deleteButton: {
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    height: 48,
    borderRadius: 100,
    backgroundColor: Colors.primary.background,
    borderColor: Colors.primary.text,
    borderWidth: 1,
  },
  deletionView: {
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary.background,
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

async function deleteUserLogic(
  userInfo: any,
  setUserInfo: React.Dispatch<React.SetStateAction<any>>,
  setError: React.Dispatch<React.SetStateAction<string>>
) {
  const res = await fetch(domain + "/api/mobile/deleteUser", {
    method: "POST",
    body: JSON.stringify({ userId: userInfo.id, userEmail: userInfo.email }),
  });

  const responseData = (await res.json()) as {
    deleted: boolean;
    result: string;
  };

  if (responseData.deleted) {
    await AsyncStorage.removeItem("user");
    setUserInfo(null);
    router.push("/login");
  } else {
    setError(responseData.result);
  }
}

export default Profile;
