export type Role = "ADMIN" | "MANAGER" | "AGENT";

// Airtable's "Role" single-select field uses these display names.
export const ROLE_TO_AIRTABLE: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
};

export const ROLE_FROM_AIRTABLE: Record<string, Role> = {
  Admin: "ADMIN",
  Manager: "MANAGER",
  Agent: "AGENT",
};
