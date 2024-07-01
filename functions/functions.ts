import { UserInfoType } from "@/constants/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { revokeAsync } from "expo-auth-session";

export function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c * 1000; // Distance in m
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function logout(
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfoType | null>>
) {
  const token = await AsyncStorage.getItem("user");
  const authProvider = await AsyncStorage.getItem("authProvider");
  if (token) {
    try {
      await revokeAsync(
        { token },
        { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
      );
      await AsyncStorage.removeItem("user").then(() => {
        setUserInfo(null);
      });
      await AsyncStorage.removeItem("authProvider");
    } catch (error) {
      console.error("ERROR at logout", error);
    }
  }
}
