import { apiClient } from "./client";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
}

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<{ users: UserSummary[] }>("/users");
  return data.users;
}
