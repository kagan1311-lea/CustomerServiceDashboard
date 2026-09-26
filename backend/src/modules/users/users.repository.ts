import type { Record as AirtableRecord, FieldSet } from "airtable";
import { escapeFormulaValue, usersTable } from "../../db/airtable";
import { Role, ROLE_FROM_AIRTABLE, ROLE_TO_AIRTABLE } from "../../types/role";

export interface AirtableUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
}

function mapRecord(record: AirtableRecord<FieldSet>): AirtableUser {
  const role = record.get("Role") as string | undefined;
  const mappedRole = role ? ROLE_FROM_AIRTABLE[role] : undefined;
  return {
    id: record.id,
    name: (record.get("Name") as string) ?? "",
    email: (record.get("Email") as string) ?? "",
    passwordHash: (record.get("Password Hash") as string) ?? "",
    role: mappedRole ?? "AGENT",
    active: Boolean(record.get("Active")),
  };
}

export async function findUserByEmail(email: string): Promise<AirtableUser | null> {
  const records = await usersTable
    .select({
      filterByFormula: `LOWER({Email}) = "${escapeFormulaValue(email.toLowerCase())}"`,
      maxRecords: 1,
    })
    .firstPage();

  return records[0] ? mapRecord(records[0]) : null;
}

export async function findUserById(id: string): Promise<AirtableUser | null> {
  try {
    const record = await usersTable.find(id);
    return mapRecord(record);
  } catch {
    return null;
  }
}

export async function listUsers(): Promise<AirtableUser[]> {
  const records = await usersTable.select({ filterByFormula: "{Active} = TRUE()" }).all();
  return records.map(mapRecord);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}): Promise<AirtableUser> {
  const [record] = await usersTable.create([
    {
      fields: {
        Name: input.name,
        Email: input.email,
        "Password Hash": input.passwordHash,
        Role: ROLE_TO_AIRTABLE[input.role],
        Active: true,
      },
    },
  ]);
  return mapRecord(record);
}
