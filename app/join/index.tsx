import { ThemedText } from "@/components/ThemedText";
import { ThemedSafeAreaView, ThemedView } from "@/components/ThemedView";
import {
  Button,
  StyleSheet,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { PressableLink } from "@/components/PressableLink";

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
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { Code: "" } });

  const onSubmit = async (data: { Code: string }) => {
    console.log(data);
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
      {/* {errors.Code && <ThemedText>This is required.</ThemedText>} */}
      <Button title="Join" onPress={handleSubmit(onSubmit)} />
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
