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
      };
      raceOnUserJoin: { userEmail: string; raceId: number };
    }[];
  };
  return data;
};

export const fetchTeams = async (id: string | string[] | undefined) => {
  if (!id || Array.isArray(id)) throw new Error("No id provided");

  const raceId = Number(id);

  const res = await fetch(domain + "/api/mobile/getTeams", {
    method: "POST",
    body: JSON.stringify({ raceId }),
  });

  const data = (await res.json()) as {
    data: {
      races: {
        id: number;
        code: string;
        createdAt: Date;
        projectId: number;
        name: string;
      };
      raceOnUserJoin: { userEmail: string; raceId: number };
    }[];
  };
  return data;
};

export const fetchRacesKey = "userRaces";
