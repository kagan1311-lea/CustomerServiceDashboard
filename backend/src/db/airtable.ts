import Airtable from "airtable";
import { env } from "../config/env";

const airtable = new Airtable({ apiKey: env.airtableApiKey });
const base = airtable.base(env.airtableBaseId);

export const usersTable = base("Users");
export const inquiriesTable = base("Inquiries");

// Airtable formulas take double-quoted strings; escape backslashes and quotes
// before interpolating untrusted input (e.g. a login email) into a formula.
export function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
