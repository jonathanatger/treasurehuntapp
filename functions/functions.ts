import { UserInfoType } from "@/constants/data";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { RaceData, setTeamLocation } from "@/queries/queries";
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

export type TransformedSingleTeamData = {
  id: number;
  name: string;
  users: { name: string; email: string }[];
  currentLongitude: number;
  currentLatitude: number;
  objectiveIndex: number;
};

export type TransformedTeamsData = TransformedSingleTeamData[];

export function transformTeamsData(data: RaceData) {
  let returnData = [] as TransformedTeamsData;

  if (!data) return undefined;
  for (const user of data.result) {
    let found = false;

    for (const team of returnData) {
      if (team.id === user.teams.id) {
        team.users.push({
          name: user.users?.name ? user.users.name : "",
          email: user.users?.email ? user.users.email : "",
        });
        found = true;
        break;
      }
    }

    if (!found) {
      returnData.push({
        id: user.teams.id,
        name: user.teams.name,
        users: [
          {
            name: user.users?.name ? user.users.name : "",
            email: user.users?.email ? user.users.email : "",
          },
        ],
        currentLatitude: user.teams.currentLatitude,
        currentLongitude: user.teams.currentLongitude,
        objectiveIndex: user.teams.objectiveIndex,
      });
    }
  }
  return returnData;
}

export const requestLocationPermissions = async () => {
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === "granted") {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === "granted") {
      return true;
    }
  }
  return false;
};

export const LOCATION_TASK_NAME = "background-location-task";

export const backgroundLocationFetch = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === "granted") {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      showsBackgroundLocationIndicator: true,
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 2000,
      distanceInterval: 40,
      foregroundService: {
        notificationTitle: "Treasurio",
        notificationBody: "Getting your location",
        killServiceOnDestroy: true,
      },
    });
  }
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );
};

export function setCurrentTeamId(id: number) {
  currentTeamId = id;
}

export function setNumberOfTeamMembers(number: number) {
  numberOfTeamMembers = number;
}

let numberOfTeamMembers = 1;
let currentTeamId = 0;
export let currentLocationTimestamp = 0;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const typedData = data as locationDataType;

    if (typedData.locations[0].timestamp > currentLocationTimestamp + 30000) {
      currentLocationTimestamp = typedData.locations[0].timestamp;

      const res = await setTeamLocation(
        typedData.locations[0].coords.latitude,
        typedData.locations[0].coords.longitude,
        currentTeamId
      );

      if (res.res.raceFinished) {
        await stopTracking();
      }
    }
  }
});

type locationDataType = {
  locations: {
    coords: {
      accuracy: number;
      altitude: number;
      altitudeAccuracy: number;
      latitude: number;
      longitude: number;
    };
    timestamp: number;
  }[];
};

export async function stopTracking() {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
