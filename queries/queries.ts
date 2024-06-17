import { domain } from "../constants/data";

export const fetchRaces = async (email: string | undefined) => {
  if (!email) throw new Error("No email provided");

  const res = await fetch(domain + "/api/races", {
    method: "POST",
    body: email,
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
  userEmail: string
) {
  const res = await fetch(domain + "/api/mobile/createTeam", {
    method: "POST",
    body: JSON.stringify({
      teamName,
      raceId,
      userEmail,
    }),
  });

  const data = await res.json();

  return data;
}

export async function quitTeam(teamId: number, userEmail: string) {
  const res = await fetch(domain + "/api/mobile/quitTeam", {
    method: "POST",
    body: JSON.stringify({
      teamId,
      userEmail,
    }),
  });

  const data = await res.json();

  return data;
}

export async function enterTeam(
  teamId: number,
  userEmail: string,
  existingTeamId?: number
) {
  let body: any;

  if (existingTeamId) {
    body = JSON.stringify({
      teamId,
      userEmail,
      existingTeamId,
    });
  } else {
    body = JSON.stringify({
      teamId,
      userEmail,
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
