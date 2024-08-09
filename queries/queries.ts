import { domain } from "../constants/data";

export const fetchRaces = async (id: string | undefined) => {
  if (!id) throw new Error("No id provided");

  const res = await fetch(domain + "/api/races", {
    method: "POST",
    body: id,
  });

  const data = (await res.json()) as {
    data: {
      races: {
        id: number;
        code: string;
        createdAt: Date;
        projectId: number;
        name: string;
        launched: boolean;
      };
      raceOnUserJoin: { userEmail: string; raceId: number };
    }[];
  };
  return data;
};
export const fetchRacesKey = "userRaces";

export const fetchTeams = async (id: string | string[] | undefined) => {
  if (!id || Array.isArray(id)) throw new Error("No id provided");

  const raceId = Number(id);

  const res = await fetch(domain + "/api/mobile/getTeams", {
    method: "POST",
    body: JSON.stringify(raceId),
  });

  const data = (await res.json()) as RaceData;

  return data;
};
export const fetchTeamsKey = "fetchTeams";

export type RaceData =
  | {
      result: {
        teams: {
          id: number;
          name: string;
          raceId: number;
          racePositionId: number;
          currentLatitude: number;
          currentLongitude: number;
          objectiveIndex: number;
        };
        userOnTeamJoin: {
          userEmail: string;
          teamId: number;
        } | null;
        users: {
          name: string;
          email: string;
        } | null;
      }[];
    }
  | undefined;

export async function createNewTeam(
  teamName: string,
  raceId: number,
  userId: string,
  formerTeamId?: number
) {
  console.log;
  const res = await fetch(domain + "/api/mobile/createTeam", {
    method: "POST",
    body: JSON.stringify({
      teamName,
      raceId,
      userId,
      formerTeamId,
    }),
  });

  const data = await res.json();

  return data;
}

export async function quitTeam(teamId: number, userId: string) {
  const res = await fetch(domain + "/api/mobile/quitTeam", {
    method: "POST",
    body: JSON.stringify({
      teamId,
      userId,
    }),
  });

  const data = await res.json();

  return data;
}

export async function enterTeam(
  teamId: number,
  userId: string,
  existingTeamId?: number
) {
  let body: any;

  if (existingTeamId) {
    body = JSON.stringify({
      teamId,
      userId,
      existingTeamId,
    });
  } else {
    body = JSON.stringify({
      teamId,
      userId,
    });
  }

  const res = await fetch(domain + "/api/mobile/enterTeam", {
    method: "POST",
    body: body,
  });

  const data = await res.json();

  return data;
}

export async function deleteTeam(teamId: number) {
  const res = await fetch(domain + "/api/mobile/deleteTeam", {
    method: "POST",
    body: JSON.stringify({
      teamId,
    }),
  });

  const data = await res.json();

  return data;
}

export async function fetchObjectives(raceId: number) {
  const res = await fetch(domain + "/api/mobile/getRaceObjectives", {
    method: "POST",
    body: JSON.stringify({ raceId }),
  });

  const data = (await res.json()) as {
    result: {
      id: number;
      clientId: number;
      title: string;
      order: number;
      latitude: number;
      longitude: number;
      message: string;
    }[];
  };

  return data;
}

export const fetchProjectObjectivesKey = "projectObjectives";

export async function advanceObjective(
  teamId: number,
  raceId: number,
  objectiveIndex: number,
  objectiveName: string
) {
  const res = await fetch(domain + "/api/mobile/advanceObjective", {
    method: "POST",
    body: JSON.stringify({ teamId, raceId, objectiveIndex, objectiveName }),
  });

  const data = (await res.json()) as {
    check: boolean;
    teamHasAlreadyAdvanced: boolean;
    error: string;
  };

  return data;
}

export async function quitRace(raceId: number, userId: string) {
  if (!userId || !raceId) return;

  const res = await fetch(domain + "/api/mobile/quitRace", {
    method: "POST",
    body: JSON.stringify({
      raceId: raceId,
      userId: userId,
    }),
  });

  const data = (await res.json()) as {
    result: string;
  };

  if (data.result === "success") return true;
  return false;
}

export const setTeamLocation = async (
  latitude: number,
  longitude: number,
  teamId: number
) => {
  if (!latitude || !longitude || !teamId) throw new Error("No data provided");

  const res = await fetch(domain + "/api/mobile/setTeamLocation", {
    method: "POST",
    body: JSON.stringify({
      latitude: latitude,
      longitude: longitude,
      teamId: teamId,
    }),
  });

  const data = (await res.json()) as {
    res: {
      status: boolean;
      message: string;
      raceFinished: boolean;
    };
  };

  return data;
};
export const teamFinishedRace = async (teamId: number) => {
  if (!teamId) throw new Error("No data provided");

  const res = await fetch(domain + "/api/mobile/teamFinishedRace", {
    method: "POST",
    body: JSON.stringify({
      teamId: teamId,
    }),
  });

  const data = (await res.json()) as {
    result: boolean;
  };

  return data;
};
