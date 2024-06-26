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
  userId: string
) {
  const res = await fetch(domain + "/api/mobile/createTeam", {
    method: "POST",
    body: JSON.stringify({
      teamName,
      raceId,
      userId,
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
}
